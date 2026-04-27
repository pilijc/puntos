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
import { ArrowLeft, Headset } from "lucide-react-native";
import { SharedChatArea } from "@/components/chat/shared-chat-area";
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
    uploadingAttachment,
    error,
    loadManagerConversation,
    sendMessage,
    sendAttachment,
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
          onPress={() => router.replace("/(store_manager)/settings")}
          className="p-2 -ml-2 rounded-full active:bg-neutral-100 dark:active:bg-neutral-800"
        >
          <ArrowLeft size={22} color="#1e293b" className="dark:text-white" />
        </TouchableOpacity>

        <View className="w-10 h-10 ml-4 mr-3 rounded-full bg-slate-100 dark:bg-neutral-800 items-center justify-center">
          <Headset size={20} color="#64748b" />
        </View>
        <View className="flex-1 justify-center">
          <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary leading-tight mt-1">
            Contact Support
          </Text>

        </View>
      </View>

      <SharedChatArea
        messages={messages}
        loadingMessages={storesLoading || loading || loadingMessages}
        emptyMessage={emptyMessage}
        onSendMessage={async (text) => await sendMessage(text, "store_manager")}
        onSendAttachment={async (attachment) => await sendAttachment(attachment, "store_manager")}
        sending={sending}
        uploadingAttachment={uploadingAttachment}
        disabled={!activeConversationId || !activeStore}
        placeholder="Message support..."
        currentUserRole="store_manager"
        isWeb={isWeb}
        bottomInset={insets.bottom}
      />
    </SafeAreaView>
  );
}
