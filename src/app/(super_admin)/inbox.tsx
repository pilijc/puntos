import React, { useState, useMemo, useRef } from "react";
import {
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  LayoutAnimation,
  useWindowDimensions,
} from "react-native";
import { View, Text, SafeAreaView, TouchableOpacity as TwTouchableOpacity } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Send, Paperclip, ArrowLeft, Search, MessageSquare, X } from "lucide-react-native";

type FilterType = "all" | "unread" | "read" | "archived";

interface ChatMessage {
  id: string;
  text: string;
  sender: "store_manager" | "super_admin";
  timestamp: string;
}

interface ChatStore {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  archived?: boolean;
  messages: ChatMessage[];
}

const MOCK_STORES: ChatStore[] = [
  {
    id: "s1",
    name: "Downtown Coffee Branch",
    lastMessage: "I want to confirm how the monthly billing cap works.",
    time: "10:05 AM",
    unread: 1,
    messages: [
      { id: "m1", text: "Hello! Our team is available to assist you. How can we help today?", sender: "super_admin", timestamp: "10:00 AM" },
      { id: "m2", text: "I want to confirm how the monthly billing limit is calculated across different branches.", sender: "store_manager", timestamp: "10:05 AM" },
    ],
  },
  {
    id: "s2",
    name: "Uptown Bakery",
    lastMessage: "Thank you for the quick upgrade!",
    time: "Yesterday",
    unread: 0,
    messages: [
      { id: "m1", text: "We have upgraded your tier to Premium.", sender: "super_admin", timestamp: "2:00 PM" },
      { id: "m2", text: "Thank you for the quick upgrade!", sender: "store_manager", timestamp: "2:15 PM" },
    ],
  },
  {
    id: "s3",
    name: "Eastside Fitness Co.",
    lastMessage: "Having an issue with QR code rendering on the user side.",
    time: "Mon",
    unread: 2,
    messages: [
      { id: "m1", text: "Having an issue with QR code rendering on the user side.", sender: "store_manager", timestamp: "9:00 AM" },
    ],
  },
  {
    id: "s4",
    name: "Sunrise Spa & Wellness",
    lastMessage: "All good, thanks for sorting that out!",
    time: "Sun",
    unread: 0,
    archived: true,
    messages: [
      { id: "m1", text: "All good, thanks for sorting that out!", sender: "store_manager", timestamp: "4:30 PM" },
    ],
  },
];

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const AVATAR_PALETTES = [
  { bg: "#FDE8D8", text: "#C2440C" },
  { bg: "#D8EDF8", text: "#1565A8" },
  { bg: "#D8F8E8", text: "#0A7A40" },
  { bg: "#EDD8F8", text: "#7A0A9A" },
  { bg: "#F8F0D8", text: "#8A6800" },
];
function getAvatarColor(id: string) {
  return AVATAR_PALETTES[id.charCodeAt(id.length - 1) % AVATAR_PALETTES.length];
}

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "read", label: "Read" },
  { key: "archived", label: "Archived" },
];

export default function SuperAdminInbox() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isLargeScreen = width > 768;

  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [stores, setStores] = useState<ChatStore[]>(MOCK_STORES);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const scrollViewRef = useRef<ScrollView>(null);

  const activeStore = stores.find((s) => s.id === activeStoreId);

  const filteredStores = useMemo(() => {
    let result = stores;
    if (activeFilter === "unread") result = result.filter((s) => s.unread > 0 && !s.archived);
    else if (activeFilter === "read") result = result.filter((s) => s.unread === 0 && !s.archived);
    else if (activeFilter === "archived") result = result.filter((s) => s.archived);
    else result = result.filter((s) => !s.archived);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.lastMessage.toLowerCase().includes(q)
      );
    }
    return result;
  }, [stores, activeFilter, searchQuery]);

  const handleSend = () => {
    if (!messageText.trim() || !activeStore) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      text: messageText,
      sender: "super_admin",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setStores((prev) =>
      prev.map((s) =>
        s.id === activeStore.id
          ? { ...s, messages: [...s.messages, newMsg], lastMessage: messageText, time: "Just now" }
          : s
      )
    );
    setMessageText("");
  };

  const totalUnread = stores.filter((s) => !s.archived).reduce((acc, s) => acc + s.unread, 0);
  const unreadCount = stores.filter((s) => s.unread > 0 && !s.archived).length;

  /* ─────────────────────────── INBOX LIST ─────────────────────────── */
  const renderInboxList = () => (
    <View
      style={{
        flex: !isLargeScreen && activeStoreId ? 0 : 1,
        display: !isLargeScreen && activeStoreId ? "none" : "flex",
        width: isLargeScreen ? 320 : undefined,
        borderRightWidth: isLargeScreen ? 1 : 0,
        borderRightColor: "#F1F5F9",
        backgroundColor: "#FFFFFF",
      }}
    >
      {/* ── Header — matches chat-support.tsx ── */}
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
        <Text
          style={{ flex: 1, fontSize: 20, fontFamily: "Poppins-Bold", color: "#0F172A" }}
        >
          Inbox
        </Text>
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
              {totalUnread}
            </Text>
          </View>
        )}
      </View>

      {/* ── Search + Filter tray ── */}
      <View
        style={{
          backgroundColor: "#F8FAFC",
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#F1F5F9",
        }}
      >
        {/* Search box — matches store/index.tsx */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            paddingHorizontal: 14,
            height: 44,
            borderWidth: 1,
            borderColor: "#E2E8F0",
            marginBottom: 10,
          }}
        >
          <Search size={18} color="#9CA3AF" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search stores or messages..."
            placeholderTextColor="#9CA3AF"
            style={{
              flex: 1,
              marginLeft: 10,
              fontFamily: "Poppins-Regular",
              fontSize: 13,
              color: "#111827",
              height: 44,
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={{ padding: 4 }}>
              <X size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter chips — exactly matches history.tsx using @/tw className */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {FILTERS.map((f) => {
              const isActive = activeFilter === f.key;
              return (
                <TwTouchableOpacity
                  key={f.key}
                  onPress={() => setActiveFilter(f.key)}
                  className={`px-3.5 py-1.5 rounded-full border flex-row items-center ${
                    isActive
                      ? "bg-primary border-primary"
                      : "bg-white dark:bg-darkBackgroundCard border-neutral-200 dark:border-darkBorder"
                  }`}
                >
                  <Text
                    className={`text-xs font-poppins-semibold ${
                      isActive ? "text-white" : "text-neutral-500 dark:text-darkTextSecondary"
                    }`}
                  >
                    {f.label}
                  </Text>
                  {f.key === "unread" && unreadCount > 0 && (
                    <View
                      style={{
                        backgroundColor: isActive ? "rgba(255,255,255,0.35)" : "#EF4444",
                        borderRadius: 8,
                        minWidth: 16,
                        height: 16,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 4,
                        marginLeft: 4,
                      }}
                    >
                      <Text
                        style={{ fontSize: 10, fontFamily: "Poppins-Bold", color: "#fff", lineHeight: 14 }}
                      >
                        {unreadCount}
                      </Text>
                    </View>
                  )}
                </TwTouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* ── Store List ── */}
      <ScrollView
        style={{ flex: 1, backgroundColor: "#F8FAFC" }}
        showsVerticalScrollIndicator={false}
      >
        {filteredStores.length === 0 ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 80, paddingHorizontal: 32 }}>
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
              {searchQuery
                ? `No results for "${searchQuery}"`
                : `No ${activeFilter} conversations`}
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
            {filteredStores.map((store) => {
            const { bg, text } = getAvatarColor(store.id);
            const isSelected = activeStoreId === store.id;
            return (
              <TouchableOpacity
                key={store.id}
                onPress={() => setActiveStoreId(store.id)}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingRight: 20,
                  paddingVertical: 14,
                  paddingLeft: isSelected ? 17 : 20,
                  borderBottomWidth: 1,
                  borderBottomColor: "#F8FAFC",
                  backgroundColor: isSelected ? "#FFF8F4" : "#FFFFFF",
                  borderLeftWidth: isSelected ? 3 : 0,
                  borderLeftColor: "#FF6600",
                }}
              >
                {/* Avatar */}
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: bg,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                    flexShrink: 0,
                  }}
                >
                  <Text style={{ fontSize: 14, fontFamily: "Poppins-Bold", color: text }}>
                    {getInitials(store.name)}
                  </Text>
                </View>

                {/* Content */}
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 14,
                        fontFamily: store.unread > 0 ? "Poppins-SemiBold" : "Poppins-Medium",
                        color: "#0F172A",
                        flex: 1,
                        paddingRight: 8,
                      }}
                    >
                      {store.name}
                    </Text>
                    <Text
                      style={{ fontSize: 11, fontFamily: "Poppins-Regular", color: "#94A3B8" }}
                    >
                      {store.time}
                    </Text>
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
                        fontSize: 13,
                        fontFamily: store.unread > 0 ? "Poppins-Medium" : "Poppins-Regular",
                        color: store.unread > 0 ? "#334155" : "#94A3B8",
                        flex: 1,
                        paddingRight: 8,
                      }}
                    >
                      {store.lastMessage}
                    </Text>
                    {store.unread > 0 && (
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
                          {store.unread}
                        </Text>
                      </View>
                    )}
                    {store.archived && store.unread === 0 && (
                      <View
                        style={{
                          paddingHorizontal: 7,
                          paddingVertical: 2,
                          borderRadius: 6,
                          backgroundColor: "#F1F5F9",
                        }}
                      >
                        <Text
                          style={{ fontSize: 10, fontFamily: "Poppins-Regular", color: "#94A3B8" }}
                        >
                          Archived
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
          </View>
        )}
      </ScrollView>
    </View>
  );

  /* ─────────────────────────── CHAT AREA ─────────────────────────── */
  const renderChatArea = () => {
    if (!activeStore) {
      if (!isLargeScreen) return null;
      return (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F8FAFC",
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E2E8F0",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <MessageSquare size={28} color="#CBD5E1" />
          </View>
          <Text
            style={{ fontSize: 14, fontFamily: "Poppins-Medium", color: "#94A3B8" }}
          >
            Select a store to view conversation
          </Text>
        </View>
      );
    }

    const { bg, text } = getAvatarColor(activeStore.id);

    return (
      <View
        style={{
          flex: !isLargeScreen && !activeStoreId ? 0 : 1,
          display: !isLargeScreen && !activeStoreId ? "none" : "flex",
          backgroundColor: "#F8FAFC",
          borderLeftWidth: 1,
          borderLeftColor: "#F1F5F9",
        }}
      >
        {/* Chat Header — matches chat-support.tsx */}
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
          {!isLargeScreen && (
            <TouchableOpacity
              onPress={() => setActiveStoreId(null)}
              style={{ padding: 8, marginLeft: -8, marginRight: 8, borderRadius: 20 }}
            >
              <ArrowLeft size={22} color="#1e293b" />
            </TouchableOpacity>
          )}
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: bg,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 10,
            }}
          >
            <Text style={{ fontSize: 12, fontFamily: "Poppins-Bold", color: text }}>
              {getInitials(activeStore.name)}
            </Text>
          </View>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text
              style={{
                fontSize: 15,
                fontFamily: "Poppins-Bold",
                color: "#0F172A",
                lineHeight: 20,
              }}
            >
              {activeStore.name.length > 15 ? activeStore.name.substring(0, 15) + "..." : activeStore.name}
            </Text>
            <Text
              style={{ fontSize: 11, fontFamily: "Poppins-Regular", color: "#94A3B8" }}
            >
              Store Manager
            </Text>
          </View>
        </View>

        {/* Messages */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            ref={scrollViewRef}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 24,
              paddingBottom: Math.max(insets.bottom, 20),
              ...(isWeb ? { alignItems: "center" as const } : {}),
            }}
            showsVerticalScrollIndicator={false}
          >
            <View style={isWeb ? { width: "100%", maxWidth: 768 } : { width: "100%" }}>
              {activeStore.messages.map((msg, index) => {
                const isAdmin = msg.sender === "super_admin";
                const nextMsg = activeStore.messages[index + 1];
                const isLastInGroup = !nextMsg || nextMsg.sender !== msg.sender;
                return (
                  <View
                    key={msg.id}
                    style={{
                      maxWidth: "80%",
                      alignSelf: isAdmin ? "flex-end" : "flex-start",
                      marginBottom: isLastInGroup ? 20 : 4,
                    }}
                  >
                    <View
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        backgroundColor: isAdmin ? "#FF6600" : "#FFFFFF",
                        borderWidth: isAdmin ? 0 : 1,
                        borderColor: "#F1F5F9",
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        borderBottomLeftRadius: isAdmin ? 16 : (isLastInGroup ? 4 : 16),
                        borderBottomRightRadius: isAdmin ? (isLastInGroup ? 4 : 16) : 16,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: "Poppins-Regular",
                          lineHeight: 22,
                          color: isAdmin ? "#FFFFFF" : "#334155",
                        }}
                      >
                        {msg.text}
                      </Text>
                    </View>
                    {isLastInGroup && (
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: "Poppins-Regular",
                          color: "#94A3B8",
                          marginTop: 6,
                          textAlign: isAdmin ? "right" : "left",
                          marginLeft: isAdmin ? 0 : 4,
                        }}
                      >
                        {msg.timestamp}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Input Area */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 12),
              backgroundColor: "#FFFFFF",
              borderTopWidth: 1,
              borderTopColor: "#F1F5F9",
              flexDirection: "row",
              alignItems: "flex-end",
            }}
          >
            <TouchableOpacity
              style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 }}
            >
              <Paperclip size={20} color="#94a3b8" />
            </TouchableOpacity>

            <View
              style={{
                flex: 1,
                marginHorizontal: 8,
                backgroundColor: "#F8FAFC",
                borderRadius: 24,
                paddingHorizontal: 16,
                paddingVertical: 4,
                borderWidth: 1,
                borderColor: "#E2E8F0",
                minHeight: 44,
                maxWidth: 768,
                justifyContent: "center",
              }}
            >
              <TextInput
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Reply to store..."
                placeholderTextColor="#94a3b8"
                style={{
                  fontFamily: "Poppins-Regular",
                  fontSize: 14,
                  color: "#0F172A",
                  paddingVertical: 8,
                  maxHeight: 120,
                }}
                multiline
                textAlignVertical="center"
              />
            </View>

            <TouchableOpacity
              onPress={handleSend}
              disabled={!messageText.trim()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: messageText.trim() ? "#FF6600" : "transparent",
              }}
            >
              <Send
                size={20}
                color={messageText.trim() ? "#ffffff" : "#cbd5e1"}
                style={messageText.trim() ? { marginLeft: -2 } : {}}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, flexDirection: "row", backgroundColor: "#FFFFFF" }}
    >
      {renderInboxList()}
      {renderChatArea()}
    </SafeAreaView>
  );
}
