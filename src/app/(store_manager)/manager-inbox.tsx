import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Image } from "@/tw";
import { useRouter } from "expo-router";
import { ArrowLeft, Headset, MessageSquare, Store } from "lucide-react-native";
import { supabase } from "@/supabase/supabase";
import { useManagerStoresStore } from "@/store/manager-stores-store";
import { useSupportChatStore } from "@/store/support-chat-store";
import { SupportConversation } from "@/type/support-chat";
import { useTranslation } from "react-i18next";
import { useIsDark } from "@/hooks/use-is-dark";

function formatTime(value: string | null, translate: any) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === now.toDateString())
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (date.toDateString() === yesterday.toDateString()) return translate("storeManager.chat.inbox.yesterday", "Yesterday");
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ManagerInbox() {
  const { t: translate } = useTranslation();
  const router = useRouter();
  const isDark = useIsDark();
  const { stores, loading: storesLoading, fetchStores } = useManagerStoresStore();
  
  // Use global support chat store for real-time consistency
  const { conversations, loadAllManagerConversations } = useSupportChatStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!mounted || !user) return;
      
      setLoading(true);
      try {
        await Promise.all([
          fetchStores(),
          loadAllManagerConversations(user.id)
        ]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    bootstrap();
    return () => {
      mounted = false;
    };
  }, [fetchStores, loadAllManagerConversations]);

  const totalUnread = conversations.reduce(
    (sum, c) => sum + (c.unread_store_count ?? 0),
    0,
  );

  const getConvForStore = (storeId: number) =>
    conversations.find((c) => c.store_id === storeId) ?? null;

  const isLoading = loading || storesLoading;

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-white dark:bg-darkBackground"
    >
      {/* Header */}
      <View
        className="bg-white dark:bg-darkBackground border-b border-neutral-100 dark:border-darkBorder pl-6 pr-4 py-3 flex-row items-center"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 -ml-2 rounded-full active:bg-neutral-100 dark:active:bg-neutral-800"
        >
          <ArrowLeft size={22} color={isDark ? "#FFFFFF" : "#1e293b"} />
        </TouchableOpacity>

        <View className="flex-1 flex-row items-center gap-x-2">
          <Headset size={18} color="#FF6600" />
          <Text className="text-lg font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
            {translate("storeManager.chat.inbox.title", "Support")}
          </Text>
        </View>

        {totalUnread > 0 && (
          <View
            className="bg-danger rounded-full px-2 py-0.5 min-w-[22px] items-center justify-center"
          >
            <Text className="text-[11px] font-poppins-bold text-white">
              {totalUnread > 99 ? "99+" : totalUnread}
            </Text>
          </View>
        )}
      </View>

      {/* Subtitle */}
      <View className="px-6 pt-3 pb-1">
        <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">
          {translate("storeManager.chat.inbox.subtitle", "Select a store to chat with Super Admin")}
        </Text>
      </View>

      <ScrollView
        className="flex-1 bg-backgroundMuted dark:bg-darkBackgroundMuted"
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View className="items-center justify-center pt-20">
            <ActivityIndicator color="#FF6600" />
            <Text
              className="mt-3 text-xs font-poppins-medium text-textMuted dark:text-darkTextMuted"
            >
              {translate("storeManager.chat.inbox.loading", "Loading...")}
            </Text>
          </View>
        ) : stores.length === 0 ? (
          <View
            className="items-center justify-center pt-20 px-8"
          >
            <View
              className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-darkBackgroundCard items-center justify-center mb-3"
            >
              <MessageSquare size={24} color={isDark ? "#737373" : "#CBD5E1"} />
            </View>
            <Text
              className="text-xs font-poppins-medium text-textMuted dark:text-darkTextMuted text-center"
            >
              {translate("storeManager.chat.inbox.noStores", "No stores found")}
            </Text>
          </View>
        ) : (
          <View
            className="m-3 bg-white dark:bg-darkBackgroundCard rounded-2xl border border-neutral-100 dark:border-darkBorder overflow-hidden"
          >
            {stores.map((store, idx) => {
              const conv = getConvForStore(store.id);
              const unread = conv?.unread_store_count ?? 0;
              const lastMsg = conv?.last_message ?? null;
              const lastTime = conv?.last_message_at ?? conv?.updated_at ?? null;

              return (
                <TouchableOpacity
                  key={store.id}
                  onPress={() =>
                  router.push(
                      `/(store_manager)/chat-support?storeId=${store.id}&from=inbox`,
                    )
                  }
                  activeOpacity={0.7}
                  className={`flex-row items-center px-4 py-3.5 bg-white dark:bg-darkBackgroundCard ${
                    idx < stores.length - 1 ? "border-b border-backgroundMuted dark:border-darkBorder" : ""
                  }`}
                >
                  {/* Store logo / fallback */}
                  {store.logo ? (
                    <Image
                      source={{ uri: store.logo }}
                      className="w-11 h-11 rounded-full mr-3 bg-slate-100 dark:bg-darkBackground"
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      className="w-11 h-11 rounded-full bg-orange-50 dark:bg-orange-950/20 items-center justify-center mr-3"
                    >
                      <Store size={20} color="#C2440C" />
                    </View>
                  )}

                  {/* Text content */}
                  <View className="flex-1">
                    <View
                      className="flex-row justify-between items-center mb-0.5"
                    >
                      <Text
                        numberOfLines={1}
                        className={`text-sm flex-1 pr-2 ${
                          unread > 0 ? "font-poppins-semibold text-textPrimary dark:text-darkTextPrimary" : "font-poppins-medium text-textPrimary dark:text-darkTextPrimary"
                        }`}
                      >
                        {store.name}
                      </Text>
                      {lastTime ? (
                        <Text
                          className="text-[11px] font-poppins text-textMuted dark:text-darkTextMuted"
                        >
                          {formatTime(lastTime, translate)}
                        </Text>
                      ) : null}
                    </View>

                    <View
                      className="flex-row justify-between items-center"
                    >
                      <Text
                        numberOfLines={1}
                        className={`text-xs flex-1 pr-2 ${
                          unread > 0 ? "font-poppins-medium text-textSecondary dark:text-darkTextSecondary" : "font-poppins text-textMuted dark:text-darkTextMuted"
                        }`}
                      >
                        {lastMsg ?? translate("storeManager.chat.inbox.tapToStart", "Tap to start a conversation")}
                      </Text>
                      {unread > 0 ? (
                        <View
                          className="min-w-[20px] h-5 rounded-full bg-danger items-center justify-center px-1"
                        >
                          <Text
                            className="text-[10px] font-poppins-bold text-white"
                          >
                            {unread}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
