import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  LayoutAnimation,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { View, Text } from "@/tw";
import { Check, FileText, Image as ImageIcon, Plus, Send, X } from "lucide-react-native";
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
  onSendAttachment?: (attachment: SupportAttachmentInput, body?: string) => Promise<void>;
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
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<SupportAttachmentInput | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = async () => {
    const hasText = messageText.trim();
    const hasAttachment = !!pendingAttachment && !!onSendAttachment;
    if ((!hasText && !hasAttachment) || sending || uploadingAttachment || disabled) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (hasAttachment) {
      const attachment = pendingAttachment!;
      const body = hasText ? messageText.trim() : undefined;
      setPendingAttachment(null);
      setMessageText("");
      await onSendAttachment!(attachment, body);
    } else {
      const outgoing = messageText;
      setMessageText("");
      await onSendMessage(outgoing);
    }
  };

  const handlePickImage = async () => {
    if (!onSendAttachment || disabled) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setPopoverOpen(false);
    setPendingAttachment({
      uri: asset.uri,
      name: asset.fileName || `image-${Date.now()}.jpg`,
      mimeType: asset.mimeType || "image/jpeg",
      size: asset.fileSize ?? null,
      kind: "image",
    });
  };

  const handlePickFile = async () => {
    if (!onSendAttachment || disabled) return;
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setPopoverOpen(false);
    setPendingAttachment({
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

  /** True when the message has a non-image file attachment */
  const isFileAttachment = (msg: SupportMessage) =>
    (!!msg.attachment_url || !!msg.attachment_name) && msg.message_kind !== "image";

  /** Image attachment — rendered inside the colored bubble */
  const renderImageAttachment = (msg: SupportMessage, isMe: boolean) => {
    if (msg.message_kind !== "image" || !msg.attachment_url) return null;
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
  };

  /** File attachment — standalone card with isMe-aware colors, matching message bubble spacing */
  const renderFileCard = (msg: SupportMessage, isMe: boolean, hasBodyBelow: boolean) => {
    if (!isFileAttachment(msg)) return null;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => msg.attachment_url && Linking.openURL(msg.attachment_url)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: isMe ? "#FF6600" : "#FFFFFF",
          borderRadius: 16,
          borderWidth: isMe ? 0 : 1,
          borderColor: "#E2E8F0",
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginBottom: hasBodyBelow ? 6 : 0,
          minWidth: 210,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isMe ? "rgba(255,255,255,0.20)" : "#F1F5F9",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
            flexShrink: 0,
          }}
        >
          <FileText size={20} color={isMe ? "#FFFFFF" : "#64748B"} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 13,
              fontFamily: "Poppins-SemiBold",
              color: isMe ? "#FFFFFF" : "#0F172A",
            }}
          >
            {msg.attachment_name || "Attachment"}
          </Text>
          {!!msg.attachment_size && (
            <Text
              style={{
                fontSize: 11,
                fontFamily: "Poppins-Regular",
                color: isMe ? "rgba(255,255,255,0.75)" : "#94A3B8",
                marginTop: 2,
              }}
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

        <View style={{ maxWidth: isWeb ? 896 : undefined }} className="w-full">
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
              const isLastMyMessage =
                isMe && !messages.slice(index + 1).some((m) => m.sender_role === currentUserRole);
              const hasFile = isFileAttachment(msg);
              const hasImage = msg.message_kind === "image" && !!msg.attachment_url;
              const hasBody = !!msg.body;

              const bubbleRadius = isMe
                ? isLastInGroup
                  ? "rounded-t-2xl rounded-bl-2xl rounded-br-[4px]"
                  : "rounded-2xl rounded-br-[4px]"
                : isLastInGroup
                  ? "rounded-t-2xl rounded-br-2xl rounded-bl-[4px]"
                  : "rounded-2xl rounded-bl-[4px]";

              const bubbleColor = isMe
                ? "bg-primary"
                : "bg-white dark:bg-darkBackgroundCard border border-slate-100 dark:border-neutral-800";

              return (
                <View
                  key={msg.id}
                  className={`mb-1 max-w-[80%] ${isMe ? "self-end" : "self-start"} ${isLastInGroup ? "mb-2" : ""}`}
                >
                  {/*
                   * FILE ATTACHMENT — rendered as a standalone white card,
                   * identical to the web platform design (white bg, border,
                   * icon circle, filename + size). Not inside any colored bubble.
                   */}
                  {hasFile && renderFileCard(msg, isMe, hasBody)}

                  {/*
                   * IMAGE attachment OR text body — rendered inside the colored bubble.
                   * Only shown when there's something to show in the bubble.
                   */}
                  {(hasImage || hasBody) && (
                    hasImage && !hasBody ? (
                      // Image-only: render bare, no bubble outline or padding
                      renderImageAttachment(msg, isMe)
                    ) : (
                      <View className={`px-4 py-3 ${bubbleColor} ${bubbleRadius}`}>
                        {hasImage && renderImageAttachment(msg, isMe)}
                        {hasBody && (
                          <Text
                            className={`text-[15px] font-poppins leading-6 ${
                              isMe ? "text-white" : "text-slate-800 dark:text-slate-100"
                            } ${hasImage ? "mt-2" : ""}`}
                          >
                            {msg.body}
                          </Text>
                        )}
                      </View>
                    )
                  )}

                  {isLastInGroup && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: isMe ? "flex-end" : "flex-start",
                        marginTop: 4,
                        gap: 4,
                        marginLeft: isMe ? 0 : 4,
                      }}
                    >
                      {isMe && isLastMyMessage && !sending && !uploadingAttachment && (
                        <>
                          <Check size={10} color="#94A3B8" />
                          <Text style={{ fontSize: 11, fontFamily: "Poppins-Regular", color: "#94A3B8" }}>
                            Sent ·{" "}
                          </Text>
                        </>
                      )}
                      <Text style={{ fontSize: 11, fontFamily: "Poppins-Regular", color: "#94A3B8" }}>
                        {formatMessageTime(msg.created_at)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}

          {/* Messenger-style Sending... indicator */}
          {(sending || uploadingAttachment) && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-end",
                marginTop: 2,
                marginBottom: 6,
                gap: 5,
              }}
            >
              <ActivityIndicator size="small" color="#94A3B8" />
              <Text style={{ fontSize: 11, fontFamily: "Poppins-Regular", color: "#94A3B8" }}>
                Sending...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Pending attachment preview strip */}
      {pendingAttachment && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 4,
            backgroundColor: "#F8FAFC",
            borderTopWidth: 1,
            borderTopColor: "#F1F5F9",
          }}
        >
          {pendingAttachment.kind === "image" ? (
            <View style={{ position: "relative", alignSelf: "flex-start" }}>
              <Image
                source={{ uri: pendingAttachment.uri }}
                style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: "#E2E8F0" }}
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => setPendingAttachment(null)}
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: "#0F172A",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#FFFFFF",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#E2E8F0",
                paddingHorizontal: 12,
                paddingVertical: 8,
                alignSelf: "flex-start",
                maxWidth: 260,
              }}
            >
              <FileText size={16} color="#64748B" style={{ marginRight: 8, flexShrink: 0 }} />
              <Text
                numberOfLines={1}
                style={{ fontSize: 13, fontFamily: "Poppins-Medium", color: "#0F172A", flex: 1 }}
              >
                {pendingAttachment.name}
              </Text>
              <TouchableOpacity
                onPress={() => setPendingAttachment(null)}
                style={{ marginLeft: 8, flexShrink: 0 }}
              >
                <X size={14} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <View
        className="px-4 py-3 bg-backgroundMuted dark:bg-neutral-900 border-t border-neutral-100 dark:border-darkBorder flex-row items-end justify-center"
        style={{ paddingBottom: Math.max(bottomInset, 12) }}
      >
        <TouchableOpacity
          disabled={!onSendAttachment || disabled || uploadingAttachment}
          onPress={() => setPopoverOpen((v) => !v)}
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
            placeholder={pendingAttachment ? "Add a caption..." : placeholder}
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
            editable={!disabled && !sending && !uploadingAttachment}
          />
        </View>

        <TouchableOpacity
          onPress={handleSend}
          disabled={(!messageText.trim() && !pendingAttachment) || sending || uploadingAttachment || disabled}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 4,
            backgroundColor:
              (messageText.trim() || pendingAttachment) && !sending && !uploadingAttachment && !disabled
                ? "#FF6600"
                : "transparent",
          }}
        >
          <Send
              size={20}
              color={(messageText.trim() || pendingAttachment) && !disabled ? "#ffffff" : "#cbd5e1"}
              style={(messageText.trim() || pendingAttachment) ? { marginLeft: -2 } : {}}
            />
        </TouchableOpacity>
      </View>

      {/* Popover menu anchored above the + button */}
      {popoverOpen && (
        <>
          {/* Invisible backdrop to close on outside tap */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setPopoverOpen(false)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          {/* Popover card */}
          <View
            style={{
              position: "absolute",
              bottom: Math.max(bottomInset, 12) + 56 + 12,
              left: 8,
              backgroundColor: "#FFFFFF",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              minWidth: 190,
              overflow: "hidden",
            }}
          >
            <TouchableOpacity
              onPress={handlePickImage}
              disabled={uploadingAttachment}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 13,
                borderBottomWidth: 1,
                borderBottomColor: "#F1F5F9",
              }}
            >
              <ImageIcon size={17} color="#FF6600" style={{ marginRight: 12 }} />
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Poppins-Medium",
                  color: "#0F172A",
                }}
              >
                Upload image
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePickFile}
              disabled={uploadingAttachment}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 13,
              }}
            >
              <FileText size={17} color="#64748B" style={{ marginRight: 12 }} />
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Poppins-Medium",
                  color: "#0F172A",
                }}
              >
                Attach file
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}
