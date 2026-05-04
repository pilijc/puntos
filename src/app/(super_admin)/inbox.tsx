import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Modal,
  Clipboard,
  Alert,
} from "react-native";
import { View, Text, SafeAreaView, TouchableOpacity as TwTouchableOpacity, TextInput } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Info,
  MessageSquare,
  Paperclip,
  Search,
  Send,
  Store,
  X,
  Copy,
} from "lucide-react-native";
import { useSupportChatStore } from "@/store/support-chat-store";
import { SupportConversation, SupportInboxFilter } from "@/type/support-chat";
import { SharedChatArea } from "@/components/chat/shared-chat-area";
import { getMyStores, StoreRow } from "@/services/store-service";

const FILTERS: { key: SupportInboxFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "read", label: "Read" },
  { key: "archived", label: "Archived" },
];

const AVATAR_PALETTES = [
  { bg: "#FDE8D8", text: "#C2440C" },
  { bg: "#D8EDF8", text: "#1565A8" },
  { bg: "#D8F8E8", text: "#0A7A40" },
  { bg: "#EDD8F8", text: "#7A0A9A" },
  { bg: "#F8F0D8", text: "#8A6800" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function getAvatarColor(id: string) {
  return AVATAR_PALETTES[id.charCodeAt(id.length - 1) % AVATAR_PALETTES.length];
}

function formatTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getConversationName(conversation: SupportConversation) {
  return conversation.store_name || `Store #${conversation.store_id}`;
}

export default function SuperAdminInbox() {

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isLargeScreen = width > 768;

  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<SupportInboxFilter>("all");
  const scrollViewRef = useRef<ScrollView>(null);

  const [storeListModalVisible, setStoreListModalVisible] = useState(false);
  const [infoModalTab, setInfoModalTab] = useState<"store_info" | "manager_stores">("store_info");
  const [managerStores, setManagerStores] = useState<StoreRow[]>([]);
  const [loadingManagerStores, setLoadingManagerStores] = useState(false);

  const handleShowStoreInfo = async () => {
    if (!activeConversation?.owner_id) return;
    setInfoModalTab("store_info");
    setStoreListModalVisible(true);
    setLoadingManagerStores(true);
    try {
      const stores = await getMyStores(activeConversation.owner_id);
      setManagerStores(stores);
    } catch (e) {
      console.warn("Failed to load stores", e);
    } finally {
      setLoadingManagerStores(false);
    }
  };

  const handleCopy = (text: string) => {
    Clipboard.setString(String(text));
  };

  const {
    conversations,
    activeConversationId,
    messagesByConversationId,
    loading,
    loadingMessages,
    sending,
    uploadingAttachment,
    error,
    loadAdminConversations,
    openConversation,
    sendMessage,
    sendAttachment,
    setStatus,
    subscribeInbox,
    cleanupRealtime,
  } = useSupportChatStore();

  const activeConversation = conversations.find((item) => item.id === activeConversationId) ?? null;
  const activeMessages = activeConversationId ? messagesByConversationId[activeConversationId] ?? [] : [];

  useEffect(() => {
    loadAdminConversations();
    subscribeInbox();
    return cleanupRealtime;
  }, [cleanupRealtime, loadAdminConversations, subscribeInbox]);

  const filteredConversations = useMemo(() => {
    let result = conversations;
    if (activeFilter === "unread") {
      result = result.filter((item) => (item.unread_admin_count ?? 0) > 0 && item.status !== "archived");
    } else if (activeFilter === "read") {
      result = result.filter((item) => (item.unread_admin_count ?? 0) === 0 && item.status !== "archived");
    } else if (activeFilter === "archived") {
      result = result.filter((item) => item.status === "archived");
    } else {
      result = result.filter((item) => item.status !== "archived");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => {
        const name = getConversationName(item).toLowerCase();
        const last = (item.last_message ?? "").toLowerCase();
        return name.includes(q) || last.includes(q);
      });
    }

    return result;
  }, [activeFilter, conversations, searchQuery]);

  const totalUnread = conversations
    .filter((item) => item.status !== "archived")
    .reduce((total, item) => total + (item.unread_admin_count ?? 0), 0);
  const unreadCount = conversations.filter(
    (item) => (item.unread_admin_count ?? 0) > 0 && item.status !== "archived",
  ).length;

  const handleOpenConversation = async (conversationId: string) => {
    await openConversation(conversationId, "admin");
  };

  const handleSend = async () => {
    if (!messageText.trim() || !activeConversation || sending) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const outgoing = messageText;
    setMessageText("");
    await sendMessage(outgoing, "super_admin");
  };

  const toggleArchive = async () => {
    if (!activeConversation) return;
    await setStatus(activeConversation.id, activeConversation.status === "archived" ? "open" : "archived");
  };

  const renderInboxList = () => (
    <View
      style={isLargeScreen ? {
        width: 400,
        minWidth: 400,
        flexShrink: 0,
        borderRightWidth: 1,
        borderRightColor: "#F1F5F9",
        backgroundColor: "#FFFFFF",
      } : {
        flex: activeConversationId ? 0 : 1,
        display: activeConversationId ? "none" : "flex",
        backgroundColor: "#FFFFFF",
      }}
    >
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderBottomWidth: 1,
          borderBottomColor: "#F1F5F9",
          paddingLeft: 24,
          paddingRight: 16,
          paddingTop: 12,
          paddingBottom: 12,
          height: 70,
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
        <Text style={{ flex: 1, fontSize: 20, fontFamily: "Poppins-Bold", color: "#0F172A" }}>
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
            placeholder="Search stores..."
            placeholderTextColor="#9CA3AF"
            style={{
              flex: 1,
              marginLeft: 10,
              fontFamily: "Poppins-Regular",
              fontSize: 13,
              color: "#111827",
              height: 44,
              // @ts-ignore - web only
              outlineStyle: "none",
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={{ padding: 4 }}>
              <X size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter.key;
              return (
                <TwTouchableOpacity
                  key={filter.key}
                  onPress={() => setActiveFilter(filter.key)}
                  className={`px-3.5 py-1.5 rounded-full border flex-row items-center ${isActive
                    ? "bg-primary border-primary"
                    : "bg-white dark:bg-darkBackgroundCard border-neutral-200 dark:border-darkBorder"
                    }`}
                >
                  <Text
                    className={`text-xs font-poppins-semibold ${isActive ? "text-white" : "text-neutral-500 dark:text-darkTextSecondary"
                      }`}
                  >
                    {filter.label}
                  </Text>
                  {filter.key === "unread" && unreadCount > 0 && (
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
                      <Text style={{ fontSize: 10, fontFamily: "Poppins-Bold", color: "#fff", lineHeight: 14 }}>
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

      <ScrollView style={{ flex: 1, backgroundColor: "#F8FAFC" }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
            <ActivityIndicator color="#FF6600" />
            <Text style={{ marginTop: 12, fontSize: 13, fontFamily: "Poppins-Medium", color: "#94A3B8" }}>
              Loading inbox...
            </Text>
          </View>
        ) : filteredConversations.length === 0 ? (
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
            <Text style={{ fontSize: 13, fontFamily: "Poppins-Medium", color: "#94A3B8", textAlign: "center" }}>
              {error || (searchQuery ? `No results for "${searchQuery}"` : `No ${activeFilter} conversations`)}
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
            {filteredConversations.map((conversation) => {
              const { bg, text } = getAvatarColor(conversation.id);
              const isSelected = activeConversationId === conversation.id;
              const unread = conversation.unread_admin_count ?? 0;
              const name = getConversationName(conversation);
              return (
                <TouchableOpacity
                  key={conversation.id}
                  onPress={() => handleOpenConversation(conversation.id)}
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
                  {conversation.store_logo ? (
                    <Image
                      source={{ uri: conversation.store_logo }}
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
                        backgroundColor: bg,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                        flexShrink: 0,
                      }}
                    >
                      <Text style={{ fontSize: 14, fontFamily: "Poppins-Bold", color: text }}>
                        {getInitials(name)}
                      </Text>
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 1,
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
                        {name}
                      </Text>
                      <Text style={{ fontSize: 11, fontFamily: "Poppins-Regular", color: "#94A3B8" }}>
                        {formatTime(conversation.last_message_at ?? conversation.updated_at)}
                      </Text>
                    </View>

                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 13,
                          fontFamily: unread > 0 ? "Poppins-Medium" : "Poppins-Regular",
                          color: unread > 0 ? "#334155" : "#94A3B8",
                          flex: 1,
                          paddingRight: 8,
                        }}
                      >
                        {conversation.last_message || "No messages yet"}
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
                          <Text style={{ fontSize: 10, fontFamily: "Poppins-Bold", color: "#fff" }}>
                            {unread}
                          </Text>
                        </View>
                      ) : conversation.status === "archived" ? (
                        <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: "#F1F5F9" }}>
                          <Text style={{ fontSize: 10, fontFamily: "Poppins-Regular", color: "#94A3B8" }}>
                            Archived
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
    </View>
  );

  const renderChatArea = () => {
    if (!activeConversation) {
      if (!isLargeScreen) return null;
      return (
        <View className="flex-1 items-center justify-center bg-backgroundMuted dark:bg-neutral-900">
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
          <Text style={{ fontSize: 14, fontFamily: "Poppins-Medium", color: "#94A3B8" }}>
            Select a store to view conversation
          </Text>
        </View>
      );
    }

    const name = getConversationName(activeConversation);
    const { bg, text } = getAvatarColor(activeConversation.id);

    return (
      <View
        className="bg-backgroundMuted dark:bg-neutral-900"
        style={{
          flex: !isLargeScreen && !activeConversationId ? 0 : 1,
          display: !isLargeScreen && !activeConversationId ? "none" : "flex",
          borderLeftWidth: 1,
          borderLeftColor: "#F1F5F9",
        }}
      >
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderBottomWidth: 1,
            borderBottomColor: "#F1F5F9",
            paddingLeft: 24,
            paddingRight: 16,
            paddingTop: 12,
            paddingBottom: 12,
            height: 70,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {!isLargeScreen && (
            <TouchableOpacity
              onPress={() => useSupportChatStore.setState({ activeConversationId: null })}
              style={{ padding: 8, marginLeft: -8, marginRight: 8, borderRadius: 20 }}
            >
              <ArrowLeft size={22} color="#1e293b" />
            </TouchableOpacity>
          )}

          <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 24,
                padding: 4,
                paddingRight: 12,
              }}
            >
              {activeConversation.store_logo ? (
                <Image
                  source={{ uri: activeConversation.store_logo }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    marginRight: 10,
                    backgroundColor: "#F1F5F9",
                    overflow: "hidden",
                  }}
                  resizeMode="cover"
                />
              ) : (
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
                    {getInitials(name)}
                  </Text>
                </View>
              )}

              <View style={{ flexShrink: 1 }}>
                <Text numberOfLines={1} style={{ fontSize: 15, fontFamily: "Poppins-Bold", color: "#0F172A", lineHeight: 20 }}>
                  {name}
                </Text>
                <Text style={{ fontSize: 11, fontFamily: "Poppins-Regular", color: "#94A3B8" }}>
                  {activeConversation.owner_name || "Store Manager"}
                </Text>
              </View>

              <TouchableOpacity onPress={handleShowStoreInfo} style={{ padding: 4, marginLeft: 16, borderRadius: 20 }}>
                <Info size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity onPress={toggleArchive} style={{ padding: 8, borderRadius: 20 }}>
            {activeConversation.status === "archived" ? (
              <ArchiveRestore size={20} color="#64748B" />
            ) : (
              <Archive size={20} color="#64748B" />
            )}
          </TouchableOpacity>
        </View>

        <SharedChatArea
          messages={activeMessages}
          loadingMessages={loadingMessages}
          emptyMessage={
            <Text style={{ fontSize: 13, fontFamily: "Poppins-Medium", color: "#94A3B8" }}>
              No messages yet
            </Text>
          }
          onSendMessage={async (text) => await sendMessage(text, "super_admin")}
          onSendAttachment={async (attachments, body) => await sendAttachment(attachments, "super_admin", body)}
          sending={sending}
          uploadingAttachment={uploadingAttachment}
          disabled={false}
          placeholder="Reply to store..."
          currentUserRole="super_admin"
          isWeb={isWeb}
          bottomInset={insets.bottom}
          conversationId={activeConversation.id}
        />
      </View>
    );
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, flexDirection: "row", backgroundColor: "#FFFFFF" }}>
      {renderInboxList()}
      {renderChatArea()}

      <Modal
        visible={storeListModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setStoreListModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-start", alignItems: "center", paddingTop: isWeb ? 120 : 180 }}>
          <View style={{ width: "85%", maxWidth: 350, backgroundColor: "#FFFFFF", borderRadius: 16, overflow: "hidden", maxHeight: "80%" }}>
            <View style={{ flexDirection: "row", alignItems: "center", padding: 16, paddingBottom: 0 }}>
              <View style={{ width: 28 }} />
              <Text style={{ flex: 1, fontSize: 18, fontFamily: "Poppins-Bold", color: "#0F172A", textAlign: "center" }}>
                Details
              </Text>
              <TouchableOpacity onPress={() => setStoreListModalVisible(false)} style={{ padding: 4 }}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#F1F5F9", marginTop: 12 }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: infoModalTab === "store_info" ? "#FF6600" : "transparent" }}
                onPress={() => setInfoModalTab("store_info")}
              >
                <Text style={{ fontSize: 14, fontFamily: infoModalTab === "store_info" ? "Poppins-Bold" : "Poppins-Medium", color: infoModalTab === "store_info" ? "#FF6600" : "#64748B" }}>
                  Store Info
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: infoModalTab === "manager_stores" ? "#FF6600" : "transparent" }}
                onPress={() => setInfoModalTab("manager_stores")}
              >
                <Text style={{ fontSize: 14, fontFamily: infoModalTab === "manager_stores" ? "Poppins-Bold" : "Poppins-Medium", color: infoModalTab === "manager_stores" ? "#FF6600" : "#64748B" }}>
                  Manager's Stores
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={{ padding: 20, flexShrink: 1 }}>
              {infoModalTab === "manager_stores" ? (
                loadingManagerStores ? (
                  <ActivityIndicator size="large" color="#FF6600" style={{ marginVertical: 40 }} />
                ) : managerStores.length === 0 ? (
                  <Text style={{ fontSize: 14, fontFamily: "Poppins-Medium", color: "#64748B", textAlign: "center", marginVertical: 40 }}>
                    No active stores found.
                  </Text>
                ) : (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {managerStores.map((store) => (
                      <View key={store.id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" }}>
                        {store.logo ? (
                          <Image source={{ uri: store.logo }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: "#F1F5F9" }} />
                        ) : (
                          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                            <Store size={20} color="#94A3B8" />
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Text style={{ fontSize: 14, fontFamily: "Poppins-Bold", color: "#0F172A" }}>{store.name}</Text>
                            <TouchableOpacity onPress={() => handleCopy(String(store.id))} style={{ flexDirection: "row", alignItems: "center", marginLeft: 8, backgroundColor: "#F1F5F9", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                              <Text style={{ fontSize: 11, fontFamily: "Poppins-Medium", color: "#64748B", marginRight: 4 }}>#{store.id}</Text>
                              <Copy size={10} color="#64748B" />
                            </TouchableOpacity>
                          </View>
                          <Text style={{ fontSize: 12, fontFamily: "Poppins-Regular", color: "#64748B" }}>{store.address || "No address"}</Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                )
              ) : (
                // Store Info Tab
                <ScrollView showsVerticalScrollIndicator={false}>
                  {(() => {
                    const activeStore = managerStores.find(s => s.id === activeConversation?.store_id);
                    if (loadingManagerStores) {
                       return <ActivityIndicator size="large" color="#FF6600" style={{ marginVertical: 40 }} />;
                    }
                    if (!activeStore) {
                      return (
                        <Text style={{ fontSize: 14, fontFamily: "Poppins-Medium", color: "#64748B", textAlign: "center", marginVertical: 40 }}>
                          Store details not available.
                        </Text>
                      );
                    }
                    return (
                      <View>
                        <View style={{ alignItems: "center", marginBottom: 20 }}>
                          {activeStore.logo ? (
                            <Image source={{ uri: activeStore.logo }} style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#F1F5F9", marginBottom: 12 }} />
                          ) : (
                            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                              <Store size={32} color="#94A3B8" />
                            </View>
                          )}
                          <Text style={{ fontSize: 18, fontFamily: "Poppins-Bold", color: "#0F172A", textAlign: "center" }}>{activeStore.name}</Text>
                          <Text style={{ fontSize: 14, fontFamily: "Poppins-Medium", color: "#FF6600", textAlign: "center", marginTop: 2 }}>{activeStore.type || "Store"}</Text>
                        </View>

                        <View style={{ paddingHorizontal: 8 }}>
                          <View style={{ flexDirection: "row", marginBottom: 16 }}>
                            <View style={{ flex: 1, paddingRight: 8 }}>
                              <Text style={{ fontSize: 12, fontFamily: "Poppins-Medium", color: "#94A3B8", marginBottom: 4 }}>Store ID</Text>
                              <TouchableOpacity 
                                onPress={() => handleCopy(String(activeStore.id))}
                                style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", backgroundColor: "#F1F5F9", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
                              >
                                <Text style={{ fontSize: 14, fontFamily: "Poppins-Medium", color: "#0F172A", marginRight: 8 }}>#{activeStore.id}</Text>
                                <Copy size={14} color="#64748B" />
                              </TouchableOpacity>
                            </View>
                            <View style={{ flex: 1, paddingLeft: 20 }}>
                              <Text style={{ fontSize: 12, fontFamily: "Poppins-Medium", color: "#94A3B8", marginBottom: 4 }}>Address</Text>
                              <Text style={{ fontSize: 14, fontFamily: "Poppins-Medium", color: "#0F172A" }}>{activeStore.address || "N/A"}</Text>
                            </View>
                          </View>

                          <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 12, fontFamily: "Poppins-Medium", color: "#94A3B8", marginBottom: 4 }}>Phone</Text>
                            <Text style={{ fontSize: 14, fontFamily: "Poppins-Medium", color: "#0F172A" }}>{activeStore.phone || "N/A"}</Text>
                          </View>

                          <View style={{ flexDirection: "row", marginBottom: 16 }}>
                            <View style={{ flex: 1, paddingRight: 8 }}>
                              <Text style={{ fontSize: 12, fontFamily: "Poppins-Medium", color: "#94A3B8", marginBottom: 4 }}>Reg. Number</Text>
                              <Text style={{ fontSize: 14, fontFamily: "Poppins-Medium", color: "#0F172A" }}>{activeStore.registration_number || "N/A"}</Text>
                            </View>
                            <View style={{ flex: 1, paddingLeft: 20 }}>
                              <Text style={{ fontSize: 12, fontFamily: "Poppins-Medium", color: "#94A3B8", marginBottom: 4 }}>Status</Text>
                              <View style={{ alignSelf: "flex-start", backgroundColor: activeStore.is_active ? "#DCFCE7" : "#FEE2E2", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                                <Text style={{ fontSize: 12, fontFamily: "Poppins-Bold", color: activeStore.is_active ? "#166534" : "#991B1B" }}>
                                  {activeStore.is_active ? "Active" : "Inactive"}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })()}
                </ScrollView>
              )}  
            </View>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
  );
}
