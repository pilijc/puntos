import React from "react";
import { useRouter } from "expo-router";
import { View, Text, TouchableOpacity } from "@/tw";
import { ChevronRight, MessageCircle } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useSupportChatStore } from "@/store/support-chat-store";

export function ChatSupportCard() {
  const router = useRouter();
  const { t: translate } = useTranslation();

  const conversations = useSupportChatStore((state) => state.conversations);
  const unreadCount = conversations.reduce(
    (total, c) => total + (c.unread_store_count ?? 0),
    0,
  );

  return (
    <View className="bg-white dark:bg-darkBackground px-2.5 py-3 overflow-hidden">
      <TouchableOpacity
        onPress={() => router.push("/(store_manager)/manager-inbox")}
        className="flex-row items-center"
        activeOpacity={0.7}
      >
        <View className="h-8 w-8 -mt-0.5 rounded-lg items-center justify-center">
          <MessageCircle size={15} color="#FF6600" />
        </View>

        <View className="flex-1 ml-2">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-md font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
              {translate("settings.chatSupport.title", "Chat Support")}
            </Text>
            {unreadCount > 0 && (
              <View
                style={{
                  backgroundColor: "#EF4444",
                  borderRadius: 10,
                  minWidth: 18,
                  height: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 4,
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 10,
                    fontFamily: "Poppins-Bold",
                    lineHeight: 13,
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">
            {translate("settings.chatSupport.subtitle", "Get help from Super Admin")}
          </Text>
        </View>

        <ChevronRight size={15} color="#94a3b8" />
      </TouchableOpacity>
    </View>
  );
}
