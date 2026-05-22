import React, { useRef, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  LayoutAnimation,
  Platform,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  TextStyle,
  StyleProp,
} from "react-native";
import { View, Text, TextInput } from "@/tw";
import { Check, FileText, Image as ImageIcon, Plus, Send, X } from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { SupportAttachmentInput, SupportMessage } from "@/type/support-chat";
import { logger } from "@/utils/logger";

interface WebTextStyle extends Omit<TextStyle, "outlineStyle"> {
  outlineStyle?: "none" | "solid" | "dotted" | "dashed";
}

// ============================================================================
// STRICTLY DO NOT DELETE THIS COMMENT (For Devs and AI)
// TIMEZONE LOGIC EXPLANATION:
// The chat timestamps (formatMessageTime and formatMessageDate) intentionally
// use the viewer's DEVICE LOCAL TIMEZONE (via standard JS `new Date()`).
// This is the universal UX standard for chat apps (Messenger, iMessage, etc).
// 
// DO NOT change this to use the physical Store's PostGIS timezone boundaries!
// While features like Stamps & Streaks MUST strictly use the Store's local time,
// chat messages must always be relative to the user's current physical location
// so they match the clock on their phone.
// ============================================================================

function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatMessageDate(value: string) {
  const date = new Date(value);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isToday) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
  });
}

export interface SharedChatAreaProps {
  messages: SupportMessage[];
  loadingMessages: boolean;
  emptyMessage: string | React.ReactNode;
  onSendMessage: (text: string) => Promise<void>;
  onSendAttachment?: (attachments: SupportAttachmentInput[], body?: string) => Promise<void>;
  sending: boolean;
  uploadingAttachment?: boolean;
  disabled: boolean;
  placeholder?: string;
  currentUserRole: "store_manager" | "super_admin";
  isWeb: boolean;
  bottomInset: number;
  conversationId?: string;
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
  conversationId,
}: SharedChatAreaProps) {
  const [messageText, setMessageText] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<SupportAttachmentInput[]>([]);
  const [outgoingBubble, setOutgoingBubble] = useState<{
    text?: string;
    isAttachment: boolean;
    attachments?: SupportAttachmentInput[];
  } | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const prevMessagesLength = useRef(0);

  // Drafts system
  const draftsRef = useRef<Record<string, string>>({});
  const currentTextRef = useRef(messageText);
  currentTextRef.current = messageText;
  const prevConversationIdRef = useRef<string | undefined>(conversationId);

  useEffect(() => {
    if (conversationId !== prevConversationIdRef.current) {
      if (prevConversationIdRef.current) {
        draftsRef.current[prevConversationIdRef.current] = currentTextRef.current;
      }
      const newDraft = conversationId ? draftsRef.current[conversationId] || "" : "";
      setMessageText(newDraft);
      currentTextRef.current = newDraft;
      prevConversationIdRef.current = conversationId;
    }
  }, [conversationId]);

  const handleSend = async () => {
    const hasText = messageText.trim();
    const hasAttachments = pendingAttachments.length > 0 && !!onSendAttachment;
    if ((!hasText && !hasAttachments) || sending || uploadingAttachment || disabled) return;
    if (hasAttachments) {
      const attachments = [...pendingAttachments];
      const body = hasText ? messageText.trim() : undefined;
      setOutgoingBubble({
        text: body,
        isAttachment: true,
        attachments,
      });
      setPendingAttachments([]);
      setMessageText("");
      if (conversationId) draftsRef.current[conversationId] = "";
      try {
        await onSendAttachment!(attachments, body);
      } catch (e) {
        logger.error(e);
        setPendingAttachments(attachments);
        setMessageText(body || "");
        if (conversationId) draftsRef.current[conversationId] = body || "";
      }
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setOutgoingBubble(null);
    } else {
      const outgoing = messageText;
      setOutgoingBubble({ text: outgoing, isAttachment: false });
      setMessageText("");
      if (conversationId) draftsRef.current[conversationId] = "";
      try {
        await onSendMessage(outgoing);
      } catch (e) {
        logger.error(e);
        setMessageText(outgoing);
        if (conversationId) draftsRef.current[conversationId] = outgoing;
      }
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setOutgoingBubble(null);
    }
  };

  const handlePickImage = async () => {
    if (!onSendAttachment || disabled) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsMultipleSelection: true,
    });
    if (result.canceled || !result.assets || result.assets.length === 0) return;
    setPopoverOpen(false);

    const newAttachments: SupportAttachmentInput[] = result.assets.map((asset) => ({
      uri: asset.uri,
      name: asset.fileName || `image-${Date.now()}.jpg`,
      mimeType: asset.mimeType || "image/jpeg",
      size: asset.fileSize ?? null,
      kind: "image",
    }));

    setPendingAttachments(prev => [...prev, ...newAttachments]);
  };

  const handlePickFile = async () => {
    if (!onSendAttachment || disabled) return;
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: true,
    });
    if (result.canceled || !result.assets || result.assets.length === 0) return;
    setPopoverOpen(false);

    const newAttachments: SupportAttachmentInput[] = result.assets.map((asset) => ({
      uri: asset.uri,
      name: asset.name || `file-${Date.now()}`,
      mimeType: asset.mimeType || "application/octet-stream",
      size: asset.size ?? null,
      kind: "file",
    }));

    setPendingAttachments(prev => [...prev, ...newAttachments]);
  };

  const formatFileSize = (value?: number | null) => {
    if (!value) return "";
    if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  };

  /** True when the message has a non-image file attachment */
  const isFileAttachment = (msg: SupportMessage) => {
    if (msg.attachments && msg.attachments.length > 0) {
      return msg.attachments.some(a => a.kind === "file");
    }
    return (!!msg.attachment_url || !!msg.attachment_name) && msg.message_kind !== "image";
  };

  /** Image attachment — rendered inside the colored bubble */
  const renderImageAttachment = (msg: SupportMessage, isMe: boolean) => {
    const images = msg.attachments ? msg.attachments.filter(a => a.kind === "image" && a.url) : [];
    if (images.length === 0) {
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
    }

    return (
      <View style={{ flexDirection: "row", flexWrap: "wrap", width: 224, gap: 4 }}>
        {images.map((img, idx) => {
          const isFullWidth = images.length % 2 !== 0 && idx === 0;
          const width = isFullWidth ? 220 : 108;
          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.85}
              onPress={() => img.url && Linking.openURL(img.url)}
            >
              <Image
                source={{ uri: img.url }}
                style={{
                  width: width,
                  height: width,
                  borderRadius: 12,
                  backgroundColor: isMe ? "rgba(255,255,255,0.18)" : "#E2E8F0",
                }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  /** File attachment — standalone card with isMe-aware colors, matching message bubble spacing */
  const renderFileCard = (msg: SupportMessage, isMe: boolean, hasBodyBelow: boolean) => {
    const files = msg.attachments ? msg.attachments.filter(a => a.kind === "file") : [];

    if (files.length === 0) {
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
    }

    return (
      <View style={{ gap: 6, marginBottom: hasBodyBelow ? 6 : 0 }}>
        {files.map((f, idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.85}
            onPress={() => f.url && Linking.openURL(f.url)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: isMe ? "#FF6600" : "#FFFFFF",
              borderRadius: 16,
              borderWidth: isMe ? 0 : 1,
              borderColor: "#E2E8F0",
              paddingHorizontal: 16,
              paddingVertical: 12,
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
                {f.name || "Attachment"}
              </Text>
              {!!f.size && (
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: "Poppins-Regular",
                    color: isMe ? "rgba(255,255,255,0.75)" : "#94A3B8",
                    marginTop: 2,
                  }}
                >
                  {formatFileSize(f.size)}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        ref={scrollViewRef}
        onContentSizeChange={() => {
          const isNewMessage = messages.length > 0 && messages.length - prevMessagesLength.current === 1;
          const isSending = !!outgoingBubble;
          const shouldAnimate = isNewMessage || isSending;

          // setTimeout ensures native layout is fully calculated before scrolling
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: shouldAnimate });
          }, 100);

          prevMessagesLength.current = messages.length;
        }}
        onLayout={() => {
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: false });
          }, 100);
        }}
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 24,
          paddingBottom: 4,
          ...(isWeb ? { alignItems: "center" as const } : {}),
        }}
        showsVerticalScrollIndicator={false}
      >
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
            (() => {
              // --- OPTIMISTIC UI: GHOST BUBBLE & ANTI-JUMP LOGIC ---
              // When a user sends a message, we instantly show a "ghost bubble" (opacity 0.7).
              // However, the Supabase Realtime websocket often receives the *real* broadcasted message 
              // *before* the local HTTP request (sendMessage) fully resolves and clears the ghost.
              // If we don't handle this, the UI renders BOTH the ghost and the real message for a split second,
              // causing a jarring jump at the bottom of the chat.
              // 
              // The fix: We actively check the bottom of the list. If the *real* message has already
              // arrived via realtime websockets, we instantly hide the ghost bubble.
              const isGhostAlreadyInList = !!outgoingBubble && messages.slice(-3).some((m) =>
                m.sender_role === currentUserRole &&
                (!outgoingBubble.text || m.body === outgoingBubble.text) &&
                (!outgoingBubble.attachments || (m.attachments && m.attachments.length === outgoingBubble.attachments.length) || (!m.attachments && m.attachment_name === outgoingBubble.attachments[0]?.name))
              );
              const showGhost = !!outgoingBubble && !isGhostAlreadyInList;

              return (
                <React.Fragment>
                  {messages.map((msg, index) => {
                    const currentDateLabel = formatMessageDate(msg.created_at);
                    const prevDateLabel = index > 0 ? formatMessageDate(messages[index - 1].created_at) : null;
                    const showDateHeader = currentDateLabel !== prevDateLabel;

                    const isMe = msg.sender_role === currentUserRole;
                    const nextMsg = messages[index + 1];
                    // Also break groups if the date header interrupts them
                    const nextDateLabel = nextMsg ? formatMessageDate(nextMsg.created_at) : null;
                    const isLastInGroup = !nextMsg || nextMsg.sender_role !== msg.sender_role || nextDateLabel !== currentDateLabel;

                    const isLastMyMessage =
                      isMe && !messages.slice(index + 1).some((m) => m.sender_role === currentUserRole);
                    const hasFile = isFileAttachment(msg);
                    const hasImage =
                      (msg.attachments && msg.attachments.some((a) => a.kind === "image")) ||
                      (msg.message_kind === "image" && !!msg.attachment_url);
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
                      <React.Fragment key={msg.id}>
                        {showDateHeader && (
                          <View className={`w-full flex-row justify-center ${index === 0 ? "mb-6" : "mt-6 mb-6"}`}>
                            <Text className="text-[11px] font-poppins-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                              {currentDateLabel}
                            </Text>
                          </View>
                        )}

                        {/* Bubble — max-w-[80%] only applies here, not to the status row */}
                        <View
                          className={`mb-0.5 max-w-[80%] ${isMe ? "self-end" : "self-start"}`}
                        >
                          {hasFile && renderFileCard(msg, isMe, hasBody)}

                          {(hasImage || hasBody) && (
                            hasImage && !hasBody ? (
                              renderImageAttachment(msg, isMe)
                            ) : (
                              <View className={`px-4 py-3 ${bubbleColor} ${bubbleRadius}`}>
                                {hasImage && renderImageAttachment(msg, isMe)}
                                {hasBody && (
                                  <Text
                                    className={`text-[15px] font-poppins leading-6 ${isMe ? "text-white" : "text-slate-800 dark:text-slate-100"
                                      } ${hasImage ? "mt-2" : ""}`}
                                  >
                                    {msg.body}
                                  </Text>
                                )}
                              </View>
                            )
                          )}
                        </View>

                        {/* 
                   * Status row (Sent / Sending...) 
                   * CRITICAL: Hidden for the previous last-my-message while the ghost bubble is active.
                   * If we didn't hide this, the previous message would show "Sent", pushing the ghost down,
                   * and causing a layout jump when the ghost resolves.
                   */}
                        {isLastInGroup && !(isMe && isLastMyMessage && showGhost) && (
                          <View
                            style={{
                              alignSelf: isMe ? "flex-end" : "flex-start",
                              flexDirection: "row",
                              alignItems: "center",
                              marginTop: 3,
                              marginBottom: 6,
                              gap: 4,
                              marginLeft: isMe ? 0 : 4,
                            }}
                          >
                            {isMe && isLastMyMessage ? (
                              // Only show Sending... on existing messages if no ghost bubble is active
                              (!showGhost && (sending || uploadingAttachment)) ? (
                                <>
                                  <ActivityIndicator size={12} color="#94A3B8" />
                                  <Text style={{ fontSize: 11, fontFamily: "Poppins-Regular", color: "#94A3B8" }}>
                                    Sending...
                                  </Text>
                                </>
                              ) : (
                                <>
                                  <Check size={10} color="#94A3B8" />
                                  <Text style={{ fontSize: 11, fontFamily: "Poppins-Regular", color: "#94A3B8" }}>
                                    {"Sent · " + formatMessageTime(msg.created_at)}
                                  </Text>
                                </>
                              )
                            ) : (
                              <Text style={{ fontSize: 11, fontFamily: "Poppins-Regular", color: "#94A3B8" }}>
                                {formatMessageTime(msg.created_at)}
                              </Text>
                            )}
                          </View>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* 
           * GHOST BUBBLE (OPTIMISTIC UI)
           * Appears instantly when send is pressed. 
           * Automatically hides as soon as the real message arrives from the server.
           */}
                  {showGhost && (
                    <React.Fragment>
                      {(() => {
                        const lastRealMsg = messages[messages.length - 1];
                        const lastRealDateLabel = lastRealMsg ? formatMessageDate(lastRealMsg.created_at) : null;
                        const ghostDateLabel = "Today"; // A ghost bubble being sent right now is always "Today"
                        const needsDateHeader = lastRealDateLabel !== ghostDateLabel;

                        return needsDateHeader && (
                          <View className={`w-full flex-row justify-center ${messages.length === 0 ? "mb-6" : "mt-6 mb-6"}`}>
                            <Text className="text-[11px] font-poppins-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                              {ghostDateLabel}
                            </Text>
                          </View>
                        );
                      })()}
                      <View className="mb-0.5 max-w-[80%] self-end" style={{ opacity: 0.7 }}>
                        {outgoingBubble!.isAttachment ? (
                          <React.Fragment>
                            {outgoingBubble!.attachments?.some(a => a.kind === "image") && (
                              <View style={{ flexDirection: "row", flexWrap: "wrap", width: 224, gap: 4, alignSelf: "flex-end", justifyContent: "flex-end" }}>
                                {outgoingBubble!.attachments.filter(a => a.kind === "image").map((img, idx, arr) => {
                                  const isFullWidth = arr.length % 2 !== 0 && idx === 0;
                                  const width = isFullWidth ? 220 : 108;
                                  return (
                                    <Image
                                      key={idx}
                                      source={{ uri: img.uri }}
                                      style={{ width: width, height: width, borderRadius: 12, backgroundColor: "#E2E8F0" }}
                                      resizeMode="cover"
                                    />
                                  );
                                })}
                              </View>
                            )}
                            {outgoingBubble!.attachments?.some(a => a.kind === "file") && (
                              <View style={{ gap: 6, alignSelf: "flex-end", marginTop: outgoingBubble!.attachments.some(a => a.kind === "image") ? 6 : 0 }}>
                                {outgoingBubble!.attachments.filter(a => a.kind === "file").map((f, idx) => (
                                  <View key={idx} style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FF6600", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, minWidth: 160 }}>
                                    <FileText size={20} color="rgba(255,255,255,0.9)" style={{ marginRight: 10 }} />
                                    <Text numberOfLines={1} style={{ color: "#fff", fontSize: 13, fontFamily: "Poppins-SemiBold", flex: 1 }}>
                                      {f.name}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            )}
                            {!!outgoingBubble!.text && (
                              <View className="px-4 py-3 bg-primary rounded-t-2xl rounded-bl-2xl rounded-br-[4px] mt-1 self-end">
                                <Text className="text-[15px] font-poppins leading-6 text-white">
                                  {outgoingBubble!.text}
                                </Text>
                              </View>
                            )}
                          </React.Fragment>
                        ) : (
                          <View className="px-4 py-3 bg-primary rounded-t-2xl rounded-bl-2xl rounded-br-[4px]">
                            <Text className="text-[15px] font-poppins leading-6 text-white">
                              {outgoingBubble!.text}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={{ alignSelf: "flex-end", flexDirection: "row", alignItems: "center", marginTop: 3, marginBottom: 6, gap: 4 }}>
                        <ActivityIndicator size={12} color="#94A3B8" />
                        <Text style={{ fontSize: 11, fontFamily: "Poppins-Regular", color: "#94A3B8" }}>Sending...</Text>
                      </View>
                    </React.Fragment>
                  )}
                </React.Fragment>
              );
            })()
          )}
        </View>
      </ScrollView>

      {/* Pending attachments preview strip */}
      {pendingAttachments.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="bg-white dark:bg-darkBackground border-t border-slate-100 dark:border-neutral-800"
          style={{ flexGrow: 0, flexShrink: 0, minHeight: 76 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 5,
            paddingBottom: 5,
            gap: 12,
            alignItems: "center"
          }}
        >
          {pendingAttachments.map((att, idx) => (
            <View key={idx}>
              {att.kind === "image" ? (
                <View style={{ position: "relative" }}>
                  <Image
                    source={{ uri: att.uri }}
                    style={{ width: 64, height: 64, borderRadius: 10, backgroundColor: "#E2E8F0" }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => setPendingAttachments(prev => prev.filter((_, i) => i !== idx))}
                    style={{
                      position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: 11,
                      backgroundColor: "#0F172A", alignItems: "center", justifyContent: "center", zIndex: 10
                    }}
                  >
                    <X size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ position: "relative" }}>
                  <View
                    style={{
                      width: 64, height: 64, backgroundColor: "#F8FAFC",
                      borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0",
                      alignItems: "center", justifyContent: "center", padding: 6
                    }}
                  >
                    <FileText size={20} color="#94A3B8" style={{ marginBottom: 2 }} />
                    <Text numberOfLines={1} style={{ fontSize: 9, fontFamily: "Poppins-Medium", color: "#64748B", textAlign: "center", width: "100%" }}>
                      {att.name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setPendingAttachments(prev => prev.filter((_, i) => i !== idx))}
                    style={{
                      position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: 11,
                      backgroundColor: "#0F172A", alignItems: "center", justifyContent: "center", zIndex: 10
                    }}
                  >
                    <X size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
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
            placeholder={pendingAttachments.length > 0 ? "Add a caption..." : placeholder}
            placeholderTextColor="#94a3b8"
            className="text-textPrimary dark:text-darkTextPrimary"
            style={{
              flex: 1,
              paddingVertical: 12,
              fontFamily: "Poppins-Regular",
              fontSize: 14,
              maxHeight: 120,
              // @ts-ignore - web only
              outlineStyle: "none",
            } as unknown as StyleProp<TextStyle>}
            onKeyPress={(e) => {
              const webEvent = e as unknown as React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>;
              if (Platform.OS === "web" && webEvent.key === "Enter" && !webEvent.shiftKey) {
                webEvent.preventDefault();
                handleSend();
              }
            }}
            multiline
            textAlignVertical="center"
            editable={!disabled && !sending && !uploadingAttachment}
          />
        </View>

        <TouchableOpacity
          onPress={handleSend}
          disabled={(!messageText.trim() && pendingAttachments.length === 0) || sending || uploadingAttachment || disabled}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 4,
            backgroundColor:
              (messageText.trim() || pendingAttachments.length > 0) && !sending && !uploadingAttachment && !disabled
                ? "#FF6600"
                : "transparent",
          }}
        >
          <Send
            size={20}
            color={(messageText.trim() || pendingAttachments.length > 0) && !disabled ? "#ffffff" : "#cbd5e1"}
            style={(messageText.trim() || pendingAttachments.length > 0) ? { marginLeft: -2 } : {}}
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
