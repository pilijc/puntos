import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { View, Text, SafeAreaView } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Headset, Paperclip, Send } from "lucide-react-native";
import { supabase } from "@/supabase/supabase";
import { useManagerStoresStore } from "@/store/manager-stores-store";
import { useSupportChatStore } from "@/store/support-chat-store";

function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatSupportScreen() {
  const [message, setMessage] = useState("");
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const scrollBottom = Math.max(insets.bottom, 40);
  const isWeb = Platform.OS === "web";
  const router = useRouter();

  const stores = useManagerStoresStore((state) => state.stores);
  const fetchStores = useManagerStoresStore((state) => state.fetchStores);
  const storesLoading = useManagerStoresStore((state) => state.loading);

  const {
    activeConversationId,
    messagesByConversationId,
    loading,
    loadingMessages,
    sending,
    error,
    loadManagerConversation,
    sendMessage,
    markRead,
    cleanupRealtime,
  } = useSupportChatStore();

  const activeStore = stores[0] ?? null;
  const messages = activeConversationId ? messagesByConversationId[activeConversationId] ?? [] : [];

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!mounted || !user) return;
      setOwnerId(user.id);
      await fetchStores();
    }

    bootstrap();
    return () => {
      mounted = false;
      cleanupRealtime();
    };
  }, [cleanupRealtime, fetchStores]);

  useEffect(() => {
    if (activeStore?.id && ownerId) {
      loadManagerConversation(activeStore.id, ownerId);
    }
  }, [activeStore?.id, loadManagerConversation, ownerId]);

  useEffect(() => {
    if (activeConversationId) {
      markRead(activeConversationId, "store");
    }
  }, [activeConversationId, markRead, messages.length]);

  const emptyMessage = useMemo(() => {
    if (storesLoading || loading || loadingMessages) return "Loading support chat...";
    if (!activeStore) return "No active store is available for support chat.";
    if (error) return error;
    return "Send a message to start a support conversation.";
  }, [activeStore, error, loading, loadingMessages, storesLoading]);

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const outgoing = message;
    setMessage("");
    await sendMessage(outgoing, "store_manager");
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-backgroundMuted dark:bg-neutral-900 border-x-0">
      <View className="bg-white dark:bg-darkBackground border-b border-neutral-100 dark:border-neutral-800 pl-6 pr-4 py-3 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 -ml-2 rounded-full active:bg-neutral-100 dark:active:bg-neutral-800"
        >
          <ArrowLeft size={22} color="#1e293b" className="dark:text-white" />
        </TouchableOpacity>

        <View className="w-10 h-10 ml-4 mr-3 rounded-full bg-slate-100 dark:bg-neutral-800 items-center justify-center">
          <Headset size={20} color="#64748b" />
        </View>
        <View className="flex-1 justify-center">
          <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary leading-tight">
            Contact Support
          </Text>
          {activeStore && (
            <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
              {activeStore.name}
            </Text>
          )}
        </View>
      </View>

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
            paddingBottom: Math.max(scrollBottom, 20),
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
            {(storesLoading || loading || loadingMessages) && messages.length === 0 ? (
              <View className="items-center justify-center py-20">
                <ActivityIndicator color="#FF6600" />
                <Text className="mt-3 text-sm font-poppins text-slate-400">Loading support chat...</Text>
              </View>
            ) : messages.length === 0 ? (
              <View className="items-center justify-center py-20 px-8">
                <Text className="text-sm font-poppins text-slate-400 text-center">{emptyMessage}</Text>
              </View>
            ) : (
              messages.map((msg, index) => {
                const isManager = msg.sender_role === "store_manager";
                const nextMsg = messages[index + 1];
                const isLastInGroup = !nextMsg || nextMsg.sender_role !== msg.sender_role;

                return (
                  <View
                    key={msg.id}
                    className={`mb-1 max-w-[80%] ${isManager ? "self-end" : "self-start"} ${isLastInGroup ? "mb-5" : ""}`}
                  >
                    <View
                      className={`px-4 py-3 ${
                        isManager
                          ? "bg-primary"
                          : "bg-white dark:bg-darkBackgroundCard border border-slate-100 dark:border-neutral-800"
                      } ${
                        isManager
                          ? isLastInGroup
                            ? "rounded-t-2xl rounded-bl-2xl rounded-br-[4px]"
                            : "rounded-2xl rounded-br-[4px]"
                          : isLastInGroup
                            ? "rounded-t-2xl rounded-br-2xl rounded-bl-[4px]"
                            : "rounded-2xl rounded-bl-[4px]"
                      }`}
                    >
                      <Text
                        className={`text-[15px] font-poppins leading-6 ${
                          isManager ? "text-white" : "text-slate-800 dark:text-slate-100"
                        }`}
                      >
                        {msg.body}
                      </Text>
                    </View>
                    {isLastInGroup && (
                      <Text
                        className={`text-[11px] font-poppins text-slate-400 dark:text-neutral-500 mt-1.5 ${
                          isManager ? "text-right" : "text-left ml-1"
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
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <TouchableOpacity
            disabled
            className="w-[44px] h-[44px] items-center justify-center rounded-full opacity-40"
            style={{ marginBottom: 18, marginLeft: 8 }}
          >
            <Paperclip size={20} color="#94a3b8" />
          </TouchableOpacity>

          <View className="flex-1 mx-5 bg-white dark:bg-darkBackground rounded-3xl px-4 py-1 flex-row items-center border border-slate-100 dark:border-neutral-800 min-h-[44px]">
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Message support..."
              placeholderTextColor="#94a3b8"
              className="text-textPrimary dark:text-darkTextPrimary outline-none"
              style={{
                flex: 1,
                paddingVertical: 12,
                fontFamily: "Poppins-Regular",
                fontSize: 15,
                maxHeight: 120,
              }}
              multiline
              textAlignVertical="center"
              editable={Boolean(activeConversationId && activeStore) && !sending}
            />
          </View>

          <TouchableOpacity
            onPress={handleSend}
            disabled={!message.trim() || !activeConversationId || sending}
            className="w-[44px] h-[44px] rounded-full items-center justify-center"
            style={{ 
              marginBottom: 16, 
              marginRight: 8,
              backgroundColor: message.trim() && activeConversationId && !sending ? "#FF6600" : "transparent"
            }}
          >
            {sending ? (
              <ActivityIndicator color="#FF6600" />
            ) : (
              <Send
                size={20}
                color={message.trim() && activeConversationId ? "#ffffff" : "#cbd5e1"}
                style={message.trim() ? { marginLeft: -2 } : {}}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
