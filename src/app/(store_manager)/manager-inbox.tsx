import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { View, Text, SafeAreaView } from "@/tw";
import { useRouter } from "expo-router";
import { ArrowLeft, Headset, MessageSquare, Store } from "lucide-react-native";
import { supabase } from "@/supabase/supabase";
import { useManagerStoresStore } from "@/store/manager-stores-store";
import { useSupportChatStore } from "@/store/support-chat-store";
import { SupportConversation } from "@/type/support-chat";
import { useTranslation } from "react-i18next";

function formatTime(value: string | null, translate: any) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === now.toDateString())
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (date.toDateString() === yesterday.toDateString()) return translate("store_manager.chat.inbox.yesterday", "Yesterday");
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ManagerInbox() {
  const { t: translate } = useTranslation();
  const router = useRouter();
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
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
    >
      {/* Header */}
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderBottomWidth: 1,
          borderBottomColor: "#F1F5F9",
          paddingLeft: 24,
          paddingRight: 16,
          paddingTop: 12,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: 8, marginLeft: -8, marginRight: 8, borderRadius: 20 }}
        >
          <ArrowLeft size={22} color="#1e293b" />
        </TouchableOpacity>

        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Headset size={18} color="#FF6600" />
          <Text style={{ fontSize: 20, fontFamily: "Poppins-Bold", color: "#0F172A" }}>
            {translate("store_manager.chat.inbox.title", "Support")}
          </Text>
        </View>

        {totalUnread > 0 && (
          <View
            style={{
              backgroundColor: "#EF4444",
              borderRadius: 10,
              paddingHorizontal: 8,
              paddingVertical: 2,
              minWidth: 22,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 11, fontFamily: "Poppins-Bold", color: "#fff" }}>
              {totalUnread > 99 ? "99+" : totalUnread}
            </Text>
          </View>
        )}
      </View>

      {/* Subtitle */}
      <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 4 }}>
        <Text style={{ fontSize: 12, fontFamily: "Poppins-Regular", color: "#94A3B8" }}>
          {translate("store_manager.chat.inbox.subtitle", "Select a store to chat with Super Admin")}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: "#F8FAFC" }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
            <ActivityIndicator color="#FF6600" />
            <Text
              style={{
                marginTop: 12,
                fontSize: 13,
                fontFamily: "Poppins-Medium",
                color: "#94A3B8",
              }}
            >
              {translate("store_manager.chat.inbox.loading", "Loading...")}
            </Text>
          </View>
        ) : stores.length === 0 ? (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 80,
              paddingHorizontal: 32,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#F1F5F9",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <MessageSquare size={24} color="#CBD5E1" />
            </View>
            <Text
              style={{
                fontSize: 13,
                fontFamily: "Poppins-Medium",
                color: "#94A3B8",
                textAlign: "center",
              }}
            >
              {translate("store_manager.chat.inbox.noStores", "No stores found")}
            </Text>
          </View>
        ) : (
          <View
            style={{
              margin: 12,
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#F1F5F9",
              overflow: "hidden",
            }}
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
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: idx < stores.length - 1 ? 1 : 0,
                    borderBottomColor: "#F8FAFC",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  {/* Store logo / fallback */}
                  {store.logo ? (
                    <Image
                      source={{ uri: store.logo }}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        marginRight: 12,
                        flexShrink: 0,
                        backgroundColor: "#F1F5F9",
                      }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: "#FDE8D8",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                        flexShrink: 0,
                      }}
                    >
                      <Store size={20} color="#C2440C" />
                    </View>
                  )}

                  {/* Text content */}
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 2,
                      }}
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 14,
                          fontFamily: unread > 0 ? "Poppins-SemiBold" : "Poppins-Medium",
                          color: "#0F172A",
                          flex: 1,
                          paddingRight: 8,
                        }}
                      >
                        {store.name}
                      </Text>
                      {lastTime ? (
                        <Text
                          style={{
                            fontSize: 11,
                            fontFamily: "Poppins-Regular",
                            color: "#94A3B8",
                          }}
                        >
                          {formatTime(lastTime, translate)}
                        </Text>
                      ) : null}
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 12,
                          fontFamily: unread > 0 ? "Poppins-Medium" : "Poppins-Regular",
                          color: unread > 0 ? "#334155" : "#94A3B8",
                          flex: 1,
                          paddingRight: 8,
                        }}
                      >
                        {lastMsg ?? translate("store_manager.chat.inbox.tapToStart", "Tap to start a conversation")}
                      </Text>
                      {unread > 0 ? (
                        <View
                          style={{
                            minWidth: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: "#EF4444",
                            alignItems: "center",
                            justifyContent: "center",
                            paddingHorizontal: 4,
                          }}
                        >
                          <Text
                            style={{ fontSize: 10, fontFamily: "Poppins-Bold", color: "#fff" }}
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
