import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView, Text, View, TouchableOpacity } from "@/tw";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/supabase/supabase";
import { tw } from "@/tw";

// ────────────────── Configuration ──────────────────
const BUCKET_URL =
  "https://[YOUR_PROJECT_ID].supabase.co/storage/v1/object/public/puntos-public/profile-pictures";

type UserRole = "All" | "User" | "Manager" | "Staff";

const ROLE_CONFIG: Record<
  string,
  { bg: string; text: string; dot: string; icon: string }
> = {
  User:    { bg: "bg-sky-50",    text: "text-sky-600",    dot: "bg-sky-400",    icon: "person"        },
  Manager: { bg: "bg-violet-50", text: "text-violet-600", dot: "bg-violet-400", icon: "manage-accounts" },
  Staff:    { bg: "bg-emerald-50",text: "text-emerald-600",dot: "bg-emerald-400",icon: "badge"          },
  Blocked: { bg: "bg-red-50",    text: "text-red-500",    dot: "bg-red-400",    icon: "block"          },
};

const TAB_COUNTS_LABEL: Record<UserRole, string> = {
  All: "All",
  User: "Users",
  Manager: "Managers",
  Staff: "Staff",
};

export default function UsersScreen() {
  const router = useRouter();

  // ────────────────── State ──────────────────
  const [activeTab, setActiveTab] = useState<UserRole>("All");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);

  // ────────────────── Data Fetching ──────────────────
  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("users_with_email")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      const processed = (data || []).map((u) => ({
        ...u,
        name: u.name || "Unknown User",
        email: u.email || "No Email",
        imageUri: u.avatar_url
          ? u.avatar_url.startsWith("http")
            ? u.avatar_url
            : `${BUCKET_URL}/${u.avatar_url}`
          : `https://api.dicebear.com/7.x/avataaars/png?seed=${u.name || u.id}`,
        role:
          u.role_type === "manager"
            ? "Manager"
            : u.role_type === "front_desk"
            ? "Staff"
            : ("User" as UserRole),
        status: u.role === 0 ? "Blocked" : "Active",
        stores:
          u.role_type === "manager"
            ? ["Assigned Store"]
            : u.role_type === "front_desk"
            ? ["Branch Location"]
            : [],
      }));

      setUsers(processed);
    } catch (error: any) {
      console.error("Fetch Users Error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  // ────────────────── Derived Data ──────────────────
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { All: users.length };
    users.forEach((u) => {
      counts[u.role] = (counts[u.role] || 0) + 1;
    });
    return counts;
  }, [users]);

  const filteredData = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = activeTab === "All" || u.role === activeTab;
      const matchesSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [activeTab, search, users]);

  const groupedUsers = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredData.forEach((user) => {
      const firstLetter = user.name.charAt(0).toUpperCase();
      if (!groups[firstLetter]) groups[firstLetter] = [];
      groups[firstLetter].push(user);
    });
    return Object.keys(groups)
      .sort()
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {} as Record<string, any[]>);
  }, [filteredData]);

  const getBadge = (user: any) => {
    if (user.status === "Blocked") return ROLE_CONFIG["Blocked"];
    return ROLE_CONFIG[user.role] || ROLE_CONFIG["User"];
  };

// ────────────────── Render Card ──────────────────
  const renderCustomerCard = (c: any) => {
    const badge = getBadge(c);
    const isBlocked = c.status === "Blocked";

    return (
      <TouchableOpacity
        key={c.id}
        activeOpacity={0.7}
        onPress={() => {
          setSelectedUser(c);
          setShowBlockModal(true);
        }}
      >
        <View
          // Added 'mx-5' to create space between the screen edge and the box
          className={`flex-row items-center bg-white rounded-xl px-4 py-3 mb-3 mx-5 border ${
            isBlocked ? "border-red-100" : "border-slate-100"
          }`}
          style={{
            // Increased shadow slightly to make the "floating box" more obvious
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 3,
            elevation: 2,
          }}
        >
          {/* Avatar */}
          <View className="relative mr-3">
            <View
              className={`w-10 h-10 rounded-full overflow-hidden border ${
                isBlocked ? "border-red-50" : "border-slate-50"
              }`}
            >
              <Image source={{ uri: c.imageUri }} className="w-full h-full" />
            </View>
            <View
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${badge.dot}`}
            />
          </View>

          {/* Info */}
          <View className="flex-1">
            <Text
              className={`text-[13px] font-poppins-bold ${
                isBlocked ? "text-slate-400" : "text-slate-800"
              }`}
              numberOfLines={1}
            >
              {c.name}
            </Text>
            <Text className="text-[11px] font-poppins text-slate-400" numberOfLines={1}>
              {c.email}
            </Text>
          </View>

          {/* Badge */}
          <View className="flex-row items-center ml-2">
            <View className={`px-2 py-0.5 rounded-md ${badge.bg}`}>
              <Text className={`text-[8.5px] font-poppins-bold uppercase tracking-tight ${badge.text}`}>
                {isBlocked ? "Blocked" : c.role}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={18} color="#cbd5e1" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#f7f7fa]">
        <ActivityIndicator size="large" color="#f97316" />
        <Text className="mt-3 text-slate-400 text-[13px] font-poppins">Loading users…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f7f7fa]" edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER (Transparent/Clean) ── */}
      <View className="px-5 pt-4 pb-2">
        {/* Title row */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-[22px] font-poppins-bold text-slate-900 leading-7">Users</Text>
            <Text className="text-[11px] font-poppins text-slate-400">
              {users.length} total members
            </Text>
          </View>

          <TouchableOpacity className="w-9 h-9 rounded-xl bg-white border border-slate-100 items-center justify-center">
            <Feather name="sliders" size={16} color="#FF6600" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-slate-200/50 rounded-xl px-3 mb-4 h-10">
          <Feather name="search" size={14} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            className="flex-1 text-[13px] font-poppins text-slate-800"
            placeholder="Search by name or email…"
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          {(["All", "User", "Manager", "Staff"] as UserRole[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
                className={`flex-row items-center h-10 px-4 rounded-full mr-2 ${
                  isActive ? "bg-orange-500" : "bg-white border border-slate-100"
                }`}
              >
                <Text
                  className={`text-[11px] font-poppins-bold ${
                    isActive ? "text-white" : "text-slate-500"
                  }`}
                >
                  {TAB_COUNTS_LABEL[tab]}
                </Text>
                {tabCounts[tab] !== undefined && (
                  <View
                    className={`ml-1.5 px-1.5 py-0.5 rounded-full min-w-[16px] items-center ${
                      isActive ? "bg-white/20" : "bg-slate-100"
                    }`}
                  >
                    <Text
                      className={`text-[8px] font-poppins-bold ${
                        isActive ? "text-white" : "text-slate-500"
                      }`}
                    >
                      {tabCounts[tab] || 0}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── LIST ── */}
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#f97316"
            colors={["#f97316"]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredData.length === 0 ? (
          <View className="items-center justify-center py-20">
            <View className="w-16 h-16 rounded-2xl bg-slate-100 items-center justify-center mb-3">
              <Feather name="users" size={26} color="#94a3b8" />
            </View>
            <Text className="text-[14px] font-poppins-bold text-slate-700 mb-1">No users found</Text>
          </View>
        ) : (
          Object.keys(groupedUsers).map((letter) => (
            <View key={letter} className="mb-4">
              <View className="flex-row items-center mb-2 px-1">
                <Text className="text-[10px] font-poppins-bold text-slate-400 uppercase tracking-widest mr-2">
                  {letter}
                </Text>
                <View className="flex-1 h-[0.5px] bg-slate-200" />
              </View>
              {groupedUsers[letter].map(renderCustomerCard)}
            </View>
          ))
        )}
      </ScrollView>

      {/* ── BLOCK / UNBLOCK MODAL ── */}
      <Modal
        visible={showBlockModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBlockModal(false)}
        statusBarTranslucent
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-5">
          <View
            className="bg-white w-full rounded-3xl overflow-hidden"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 30, elevation: 20 }}
          >
            <View
              className={`h-1.5 w-full ${
                selectedUser?.status === "Blocked" ? "bg-emerald-500" : "bg-red-500"
              }`}
            />

            <View className="p-6">
              <View
                className={`w-14 h-14 rounded-2xl items-center justify-center self-center mb-4 ${
                  selectedUser?.status === "Blocked" ? "bg-emerald-50" : "bg-red-50"
                }`}
              >
                <MaterialIcons
                  name={selectedUser?.status === "Blocked" ? "lock-open" : "block"}
                  size={28}
                  color={selectedUser?.status === "Blocked" ? "#059669" : "#ef4444"}
                />
              </View>

              <Text className="text-[17px] font-poppins-bold text-slate-900 text-center mb-1">
                {selectedUser?.status === "Blocked" ? "Unblock User" : "Block User"}
              </Text>
              <Text className="text-[12px] font-poppins text-slate-400 text-center mb-5">
                This will{" "}
                {selectedUser?.status === "Blocked"
                  ? "restore access for"
                  : "revoke access for"}{" "}
                this {selectedUser?.role?.toLowerCase()}.
              </Text>

              {selectedUser && (
                <View className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-100">
                  <View className="flex-row items-center mb-3">
                    <View className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 mr-3">
                      <Image
                        source={{ uri: selectedUser.imageUri }}
                        className="w-full h-full"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[14px] font-poppins-bold text-slate-900">
                        {selectedUser.name}
                      </Text>
                      <Text className="text-[11px] font-poppins text-slate-400">
                        {selectedUser.email}
                      </Text>
                    </View>
                    <View className={`px-2.5 py-1 rounded-lg ${getBadge(selectedUser).bg}`}>
                      <Text className={`text-[9px] font-poppins-bold uppercase ${getBadge(selectedUser).text}`}>
                        {selectedUser.role}
                      </Text>
                    </View>
                  </View>

                  {selectedUser.role === "Manager" && selectedUser.stores.length > 0 && (
                    <View>
                      <Text className="text-[10px] font-poppins-bold text-slate-400 uppercase tracking-wider mb-2">
                        Stores Managed
                      </Text>
                      {selectedUser.stores.map((store: string, i: number) => (
                        <View
                          key={i}
                          className="flex-row items-center bg-white border border-slate-100 rounded-xl px-3 py-2.5 mb-1.5"
                        >
                          <MaterialIcons name="storefront" size={14} color="#94a3b8" />
                          <Text className="text-[12px] font-poppins text-slate-700 ml-2">
                            {store}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                {selectedUser.role === "Staff" && selectedUser.stores.length > 0 && (
                  <View>
                    <Text className="text-[10px] font-poppins-bold text-slate-400 uppercase tracking-wider mb-2">
                      Branch Location
                    </Text>
                    <View className="flex-row items-center bg-orange-500 rounded-xl px-4 py-3">
                      {/* Icon color changed to white for contrast */}
                      <MaterialIcons name="location-on" size={14} color="white" /> 
                      <Text className="text-[12px] font-poppins-bold text-white flex-1 ml-2">
                        {selectedUser.stores[0]}
                      </Text>
                      {/* Chevron color changed to white/70 for better visibility */}
                      <MaterialIcons name="chevron-right" size={18} color="rgba(255,255,255,0.7)" />
                    </View>
                  </View>
                )}
                </View>
              )}

              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 h-12 bg-slate-100 rounded-2xl items-center justify-center"
                  onPress={() => setShowBlockModal(false)}
                  activeOpacity={0.8}
                >
                  <Text className="font-poppins-bold text-slate-600 text-[13px]">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-1 h-12 rounded-2xl items-center justify-center flex-row gap-2 ${
                    selectedUser?.status === "Blocked" ? "bg-emerald-500" : "bg-red-500"
                  }`}
                  activeOpacity={0.85}
                >
                  <MaterialIcons
                    name={selectedUser?.status === "Blocked" ? "lock-open" : "block"}
                    size={15}
                    color="white"
                  />
                  <Text className="font-poppins-bold text-white text-[13px]">
                    {selectedUser?.status === "Blocked" ? "Unblock" : "Block User"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}