import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { View, Text, SafeAreaView } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { ArrowLeft, Headset } from "lucide-react-native";
import { SharedChatArea } from "@/components/chat/shared-chat-area";
import { supabase } from "@/supabase/supabase";
import { useTranslation } from "react-i18next";
import { useManagerStoresStore } from "@/store/manager-stores-store";
import { useSupportChatStore } from "@/store/support-chat-store";

export default function ChatSupportScreen() {
  const { t: translate } = useTranslation();
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const router = useRouter();
  const isFocused = useIsFocused();

  // Accept storeId from route params (from manager-inbox or view-store header icon)
  const { storeId: storeIdParam, from } = useLocalSearchParams<{ storeId?: string; from?: string }>();

  const stores = useManagerStoresStore((state) => state.stores);
  const fetchStores = useManagerStoresStore((state) => state.fetchStores);
  const storesLoading = useManagerStoresStore((state) => state.loading);

  const {
    conversations,
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

  // Resolve the target store: param → find in list, fallback to first store
  const activeStore = useMemo(
    () =>
      storeIdParam
        ? (stores.find((s) => s.id === Number(storeIdParam)) ?? null)
        : (stores[0] ?? null),
    [storeIdParam, stores],
  );

  // --- CROSS-STORE LEAK PREVENTION ---
  // The SupportChatStore is a global Zustand state. When switching from Store A's chat
  // directly to Store B's chat, `activeConversationId` still temporarily holds Store A's ID
  // while Store B's conversation is being fetched from Supabase.
  // We must verify that the currently loaded conversation actually belongs to the active store
  // before rendering its messages, otherwise Store A's messages will flash on Store B's screen.
  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const isCorrectConversation = activeConversation?.store_id === activeStore?.id;

  const messages =
    activeConversationId && isCorrectConversation
      ? (messagesByConversationId[activeConversationId] ?? [])
      : [];

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
    // ============================================================================
    // DO NOT REMOVE `isFocused` CHECK
    // React Navigation / Expo Router keeps this chat screen mounted in the background
    // stack when you press "Back". If `isFocused` is missing, incoming messages will
    // trigger this hook while the screen is invisible, silently marking them as "read"
    // and instantly clearing the red notification dots on the dashboard.
    // ============================================================================
    if (activeConversationId && isFocused) {
      markRead(activeConversationId, "store");
    }
  }, [activeConversationId, markRead, messages.length, isFocused]);

  const emptyMessage = useMemo(() => {
    if (storesLoading || loading || loadingMessages) return translate("storeManager.chat.screen.loading", "Loading support chat...");
    if (!activeStore) return translate("storeManager.chat.screen.storeNotFound", "Store not found.");
    if (error) return error;
    return translate("storeManager.chat.screen.startConversation", "Send a message to start a support conversation.");
  }, [activeStore, error, loading, loadingMessages, storesLoading, translate]);

  const handleBack = () => {
    if (from === "inbox") {
      router.push("/(store_manager)/manager-inbox");
    } else if (from === "view-store" && storeIdParam) {
      router.push(`/(store_manager)/view-store/${storeIdParam}`);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-backgroundMuted dark:bg-darkBackgroundMuted"
    >
      {/* Header */}
      <View className="bg-white dark:bg-darkBackground border-b border-neutral-100 dark:border-darkBorder pl-6 pr-4 py-3 flex-row items-center">
        <TouchableOpacity
          onPress={handleBack}
          className="p-2 -ml-2 rounded-full active:bg-neutral-100 dark:active:bg-neutral-800"
        >
          <ArrowLeft size={22} color="#1e293b" />
        </TouchableOpacity>

        <View className="w-10 h-10 ml-4 mr-3 rounded-full bg-slate-100 dark:bg-darkBackgroundCard items-center justify-center">
          <Headset size={20} color="#64748b" />
        </View>

        <View className="flex-1 justify-center">
          <Text className="text-base font-poppins-bold text-textPrimary dark:text-darkTextPrimary leading-tight">
            {activeStore?.name ?? translate("storeManager.chat.screen.contactSupport", "Contact Support")}
          </Text>
          <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">
            {translate("storeManager.chat.screen.superAdminSupport", "Super Admin Support")}
          </Text>
        </View>
      </View>

      <SharedChatArea
        messages={messages}
        loadingMessages={storesLoading || loading || loadingMessages}
        emptyMessage={emptyMessage}
        onSendMessage={async (text) => await sendMessage(text, "store_manager")}
        onSendAttachment={async (attachments, body) =>
          await sendAttachment(attachments, "store_manager", body)
        }
        sending={sending}
        uploadingAttachment={uploadingAttachment}
        disabled={!activeConversationId || !activeStore}
        placeholder={translate("storeManager.chat.screen.messagePlaceholder", "Message support...")}
        currentUserRole="store_manager"
        isWeb={isWeb}
        bottomInset={insets.bottom}
        conversationId={activeConversationId || undefined}
      />
    </SafeAreaView>
  );
}
