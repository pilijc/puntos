import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { View, Text } from "@/tw";
import { FileText, Image as ImageIcon, Plus, Send, X } from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { SupportAttachmentInput, SupportMessage } from "@/type/support-chat";

function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export interface SharedChatAreaProps {
  messages: SupportMessage[];
  loadingMessages: boolean;
  emptyMessage: string | React.ReactNode;
  onSendMessage: (text: string) => Promise<void>;
  onSendAttachment?: (attachment: SupportAttachmentInput) => Promise<void>;
  sending: boolean;
  uploadingAttachment?: boolean;
  disabled: boolean;
  placeholder?: string;
  currentUserRole: "store_manager" | "super_admin";
  isWeb: boolean;
  bottomInset: number;
}

export function SharedChatArea({
  messages,
  loadingMessages,
  emptyMessage,
  onSendMessage,
  onSendAttachment,
  sending,
  uploadingAttachment = false,
  disabled,
  placeholder = "Reply to store...",
  currentUserRole,
  isWeb,
  bottomInset,
}: SharedChatAreaProps) {
  const [messageText, setMessageText] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollBottom = Math.max(bottomInset, 4);

  const handleSend = async () => {
    if (!messageText.trim() || sending || disabled) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const outgoing = messageText;
    setMessageText("");
    await onSendMessage(outgoing);
  };

  const handlePickImage = async () => {
    if (!onSendAttachment || disabled || uploadingAttachment) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setDrawerOpen(false);
    await onSendAttachment({
      uri: asset.uri,
      name: asset.fileName || `image-${Date.now()}.jpg`,
      mimeType: asset.mimeType || "image/jpeg",
      size: asset.fileSize ?? null,
      kind: "image",
    });
  };

  const handlePickFile = async () => {
    if (!onSendAttachment || disabled || uploadingAttachment) return;

    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setDrawerOpen(false);
    await onSendAttachment({
      uri: asset.uri,
      name: asset.name || `file-${Date.now()}`,
      mimeType: asset.mimeType || "application/octet-stream",
      size: asset.size ?? null,
      kind: "file",
    });
  };

  const formatFileSize = (value?: number | null) => {
    if (!value) return "";
    if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderAttachment = (msg: SupportMessage, isMe: boolean) => {
    if (!msg.attachment_url && !msg.attachment_name) return null;

    if (msg.message_kind === "image" && msg.attachment_url) {
      return (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => msg.attachment_url && Linking.openURL(msg.attachment_url)}
        >
          <Image
            source={{ uri: msg.attachment_url }}
            style={{
              width: 220,
              height: 220,
              borderRadius: 16,
              backgroundColor: isMe ? "rgba(255,255,255,0.18)" : "#E2E8F0",
            }}
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => msg.attachment_url && Linking.openURL(msg.attachment_url)}
        className="flex-row items-center"
      >
        <View
          className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
            isMe ? "bg-white/20" : "bg-slate-100 dark:bg-neutral-800"
          }`}
        >
          <FileText size={20} color={isMe ? "#FFFFFF" : "#64748B"} />
        </View>
        <View className="flex-1">
          <Text
            numberOfLines={1}
            className={`text-[14px] font-poppins-semibold ${
              isMe ? "text-white" : "text-slate-800 dark:text-slate-100"
            }`}
          >
            {msg.attachment_name || "Attachment"}
          </Text>
          {!!msg.attachment_size && (
            <Text
              className={`text-[11px] font-poppins ${
                isMe ? "text-white/80" : "text-slate-400 dark:text-neutral-500"
              }`}
            >
              {formatFileSize(msg.attachment_size)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 24,
          paddingBottom: 4,
          ...(isWeb ? { alignItems: "center" as const } : {}),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full flex-row justify-center mb-6">
          <Text className="text-[11px] font-poppins-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Today
          </Text>
        </View>

        <View style={{ maxWidth: isWeb ? 896 : undefined }} className="w-full flex-1">
          {loadingMessages && messages.length === 0 ? (
            <View className="items-center justify-center py-20">
              <ActivityIndicator color="#FF6600" />
              <Text className="mt-3 text-sm font-poppins text-slate-400">Loading messages...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View className="items-center justify-center py-20 px-8">
              {typeof emptyMessage === "string" ? (
                <Text className="text-sm font-poppins text-slate-400 text-center">{emptyMessage}</Text>
              ) : (
                emptyMessage
              )}
            </View>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.sender_role === currentUserRole;
              const nextMsg = messages[index + 1];
              const isLastInGroup = !nextMsg || nextMsg.sender_role !== msg.sender_role;

              return (
                <View
                  key={msg.id}
                  className={`mb-1 max-w-[80%] ${isMe ? "self-end" : "self-start"} ${isLastInGroup ? "mb-2" : ""}`}
                >
                  <View
                    className={`px-4 py-3 ${isMe
                      ? "bg-primary"
                      : "bg-white dark:bg-darkBackgroundCard border border-slate-100 dark:border-neutral-800"
                      } ${isMe
                        ? isLastInGroup
                          ? "rounded-t-2xl rounded-bl-2xl rounded-br-[4px]"
                          : "rounded-2xl rounded-br-[4px]"
                        : isLastInGroup
                          ? "rounded-t-2xl rounded-br-2xl rounded-bl-[4px]"
                          : "rounded-2xl rounded-bl-[4px]"
                      }`}
                  >
                    {renderAttachment(msg, isMe)}
                    {!!msg.body && (
                      <Text
                        className={`text-[15px] font-poppins leading-6 ${
                          isMe ? "text-white" : "text-slate-800 dark:text-slate-100"
                        } ${msg.attachment_path ? "mt-2" : ""}`}
                      >
                        {msg.body}
                      </Text>
                    )}
                  </View>
                  {isLastInGroup && (
                    <Text
                      className={`text-[11px] font-poppins text-slate-400 dark:text-neutral-500 mt-1.5 ${isMe ? "text-right" : "text-left ml-1"
                        }`}
                    >
                      {formatMessageTime(msg.created_at)}
                    </Text>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <View
        className="px-4 py-3 bg-backgroundMuted dark:bg-neutral-900 border-t border-neutral-100 dark:border-darkBorder flex-row items-end justify-center"
        style={{ paddingBottom: Math.max(bottomInset, 12) }}
      >
        <TouchableOpacity
          disabled={!onSendAttachment || disabled || uploadingAttachment}
          onPress={() => setDrawerOpen(true)}
          style={{
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 22,
            opacity: !onSendAttachment || disabled ? 0.4 : 1,
            marginBottom: 4,
          }}
        >
          <Plus size={22} color="#94a3b8" />
        </TouchableOpacity>

        <View className="flex-1 mx-3 bg-white dark:bg-darkBackground rounded-[24px] px-4 py-1 flex-row items-center border border-slate-100 dark:border-neutral-800 min-h-[44px]">
          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            className="text-textPrimary dark:text-darkTextPrimary outline-none"
            style={{
              flex: 1,
              paddingVertical: 12,
              fontFamily: "Poppins-Regular",
              fontSize: 14,
              maxHeight: 120,
            }}
            multiline
            textAlignVertical="center"
            editable={!disabled && !sending}
          />
        </View>

        <TouchableOpacity
          onPress={handleSend}
          disabled={!messageText.trim() || sending || uploadingAttachment || disabled}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 4,
            backgroundColor: messageText.trim() && !sending && !uploadingAttachment && !disabled ? "#FF6600" : "transparent",
          }}
        >
          {sending || uploadingAttachment ? (
            <ActivityIndicator color="#FF6600" />
          ) : (
            <Send
              size={20}
              color={messageText.trim() && !disabled && !uploadingAttachment ? "#ffffff" : "#cbd5e1"}
              style={messageText.trim() ? { marginLeft: -2 } : {}}
            />
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={drawerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDrawerOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setDrawerOpen(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(15,23,42,0.28)",
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(event) => event.stopPropagation()}
            style={{
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 20,
              paddingTop: 14,
              paddingBottom: Math.max(bottomInset, 16),
            }}
          >
            <View className="w-10 h-1 rounded-full bg-slate-200 self-center mb-4" />
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-base font-poppins-bold text-slate-900">Add attachment</Text>
              <TouchableOpacity
                onPress={() => setDrawerOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center"
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handlePickImage}
              className="flex-row items-center py-4"
              disabled={uploadingAttachment}
            >
              <View className="w-11 h-11 rounded-full bg-orange-50 items-center justify-center mr-3">
                <ImageIcon size={21} color="#FF6600" />
              </View>
              <View>
                <Text className="text-[15px] font-poppins-semibold text-slate-900">Upload image</Text>
                <Text className="text-xs font-poppins text-slate-400">Choose a photo from your device</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePickFile}
              className="flex-row items-center py-4"
              disabled={uploadingAttachment}
            >
              <View className="w-11 h-11 rounded-full bg-slate-100 items-center justify-center mr-3">
                <FileText size={21} color="#64748B" />
              </View>
              <View>
                <Text className="text-[15px] font-poppins-semibold text-slate-900">Attach file</Text>
                <Text className="text-xs font-poppins text-slate-400">PDF, documents, or spreadsheets</Text>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}
