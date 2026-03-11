import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  StatusBar,
  Animated,
  PanResponder,
} from "react-native";
import { SafeAreaView, Text, View, TouchableOpacity } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useUserStore } from "@/store/useUserStore";
import { UserRow } from "@/components/users/UserRow";

// ────────────────── Configuration ──────────────────

type UserRole = "All" | "User" | "Manager" | "Staff";
type AccountStatus = "All" | "Active" | "Blocked";

const FILTER_OPTIONS: { value: AccountStatus; label: string; desc: string }[] = [
  { value: "All",    label: "All Accounts", desc: "Show everyone" },
  { value: "Active",  label: "Active Only",  desc: "Show active users" },
  { value: "Blocked", label: "Blocked Only", desc: "Show blocked users" },
];

export default function UsersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ────────────────── Store & local state ──────────────────
  const { users, loading, refreshing, updatingUserId, fetchUsers, setRefreshing, toggleBlockStatus } = useUserStore();
  const [activeTab, setActiveTab]             = useState<UserRole>("All");
  const [statusFilter, setStatusFilter]       = useState<AccountStatus>("All");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [search, setSearch]                   = useState("");
  const [selectedUser, setSelectedUser]       = useState<any | null>(null);
  const [showBlockModal, setShowBlockModal]   = useState(false);

  // ────────────────── Filter Animation ──────────────────
  const translateY = useRef(new Animated.Value(300)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const openFilter = () => {
    setShowFilterModal(true);
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, damping: 25, stiffness: 200, useNativeDriver: true })
    ]).start();
  };

  const closeFilter = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 300, duration: 200, useNativeDriver: true })
    ]).start(() => setShowFilterModal(false));
  };

  const closeSheet = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 300, duration: 200, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => setShowFilterModal(false));
  }, [translateY, backdropOpacity]);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 10,
      onPanResponderMove: (_, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 50) closeFilter();
        else Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  // ────────────────── Data Fetching ──────────────────
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, [setRefreshing, fetchUsers]);

  // ────────────────── Block Logic ──────────────────
  const handleToggleBlock = useCallback(async () => {
    if (!selectedUser) return;
    await toggleBlockStatus(selectedUser.id, selectedUser.status);
    setShowBlockModal(false);
    setSelectedUser(null);
  }, [selectedUser, toggleBlockStatus]);

  // ────────────────── Tab Counts ──────────────────
  const tabCounts = useMemo(() => {
    return {
      All: users.length,
      User: users.filter(u => u.role === "User").length,
      Manager: users.filter(u => u.role === "Manager").length,
      Staff: users.filter(u => u.role === "Staff").length,
    };
  }, [users]);

  // ────────────────── Filtered Data ──────────────────
  const filteredData = useMemo(() => {
    return users.filter((u) => {
      const matchesRole   = activeTab === "All" || u.role === activeTab;
      const matchesStatus = statusFilter === "All" || u.status === statusFilter;
      const matchesSearch =
        (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.displayEmail || u.email || "").toLowerCase().includes(search.toLowerCase());
      return matchesRole && matchesStatus && matchesSearch;
    });
  }, [activeTab, statusFilter, search, users]);

  const groupedUsers = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredData.forEach((user) => {
      const firstLetter = user.name.charAt(0).toUpperCase();
      if (!groups[firstLetter]) groups[firstLetter] = [];
      groups[firstLetter].push(user);
    });
    return Object.keys(groups).sort().reduce((acc, key) => {
      acc[key] = groups[key];
      return acc;
    }, {} as Record<string, any[]>);
  }, [filteredData]);

  const renderUserCard = (c: any) => {
    const isBlocked = c.status === "Blocked";
    return (
      <TouchableOpacity
        key={c.id}
        activeOpacity={0.7}
        onPress={() => { setSelectedUser(c); setShowBlockModal(true); }}
      >
        <View className={`flex-row items-center bg-white rounded-xl mb-3 mx-5 border ${isBlocked ? "border-red-100" : "border-slate-100"}`} style={{ elevation: 2 }}>
          <View className="flex-1">
            <UserRow user={c} isFirst />
          </View>
          <MaterialIcons name="chevron-right" size={18} color="#cbd5e1" style={{ marginRight: 12 }} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <View className="flex-1 justify-center items-center bg-[#f7f7fa]"><ActivityIndicator size="large" color="#f97316" /></View>;

  const willBlock = selectedUser?.status !== "Blocked";
  const actionColor = willBlock ? "bg-red-500" : "bg-emerald-500";
  const actionLabel = willBlock ? "Block User" : "Unblock";

  return (
    <SafeAreaView className="flex-1 bg-[#f7f7fa]" edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View className="px-5 pt-4 pb-2">
        <View className="mb-4">
          <Text className="text-[22px] font-poppins-bold text-slate-900 leading-7">Users</Text>
          <Text className="text-[11px] font-poppins text-slate-400">{users.length} members total</Text>
        </View>
        <View className="flex-row items-center bg-slate-100 rounded-xl px-3 mb-4 h-10 border border-slate-200/50">
          <Feather name="search" size={14} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput 
            className="flex-1 text-[13px] font-poppins text-slate-800" 
            placeholder="Search..." 
            placeholderTextColor="#94a3b8"
            value={search} 
            onChangeText={setSearch} 
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <TouchableOpacity 
            onPress={openFilter}
            className={`flex-row items-center h-10 px-4 rounded-full mr-2 border ${statusFilter !== "All" ? "bg-orange-50 border-orange-200" : "bg-white border-slate-100"}`}
          >
            <Feather name="sliders" size={13} color={statusFilter !== "All" ? "#FF6600" : "#94a3b8"} style={{ marginRight: 6 }} />
            <Text className={`text-[11px] font-poppins-bold ${statusFilter !== "All" ? "text-orange-600" : "text-slate-500"}`}>Filter</Text>
          </TouchableOpacity>

          {(["All", "User", "Manager", "Staff"] as UserRole[]).map((tab) => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setActiveTab(tab)} 
              className={`flex-row items-center h-10 px-4 rounded-full mr-2 ${activeTab === tab ? "bg-orange-500" : "bg-white border border-slate-100"}`}
            >
              <Text className={`text-[11px] font-poppins-bold ${activeTab === tab ? "text-white" : "text-slate-500"}`}>
                {tab === "All" ? "All" : tab + "s"}
              </Text>
              <View className={`ml-2 px-1.5 py-0.5 rounded-md ${activeTab === tab ? "bg-white/20" : "bg-slate-100"}`}>
                <Text className={`text-[9px] font-poppins-bold ${activeTab === tab ? "text-white" : "text-slate-400"}`}>
                  {tabCounts[tab]}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* LIST */}
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingTop: 8, paddingBottom: 110 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {Object.keys(groupedUsers).map((letter) => (
          <View key={letter} className="mb-4">
            <View className="flex-row items-center mb-2 px-1">
              <Text className="text-[10px] font-poppins-bold text-slate-400 uppercase tracking-widest mr-2">{letter}</Text>
              <View className="flex-1 h-[0.5px] bg-slate-200" />
            </View>
            {groupedUsers[letter].map(renderUserCard)}
          </View>
        ))}
      </ScrollView>

      {/* BLOCK CONFIRMATION MODAL */}
      <Modal visible={showBlockModal} transparent animationType="fade" statusBarTranslucent>
        <View className="flex-1 bg-black/50 items-center justify-center px-5">
          <View className="bg-white w-full rounded-3xl overflow-hidden">
            <View className={`h-1.5 w-full ${willBlock ? "bg-red-500" : "bg-emerald-500"}`} />
            <View className="p-6">
              <View className={`w-14 h-14 rounded-2xl items-center justify-center self-center mb-4 ${willBlock ? "bg-red-50" : "bg-emerald-50"}`}>
                <MaterialIcons name={willBlock ? "block" : "lock-open"} size={28} color={willBlock ? "#ef4444" : "#059669"} />
              </View>
              <Text className="text-[17px] font-poppins-bold text-slate-900 text-center mb-1">{willBlock ? "Block User" : "Unblock User"}</Text>
              <Text className="text-[12px] font-poppins text-slate-400 text-center mb-5">Are you sure you want to {willBlock ? "block" : "unblock"} this user?</Text>

              {selectedUser && (
                <View className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-100">
                  <View className="flex-row items-center mb-3">
                    <View className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 mr-3">
                      <Image source={{ uri: selectedUser.avatar }} style={{ width: "100%", height: "100%" }} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[14px] font-poppins-bold text-slate-900">{selectedUser.name}</Text>
                      <Text className="text-[11px] font-poppins text-slate-400">{selectedUser.displayEmail}</Text>
                    </View>
                  </View>
                  {(selectedUser.stores || []).map((s: any, i: number) => (
                    <View key={i} className="flex-row items-center bg-white border border-slate-100 rounded-xl px-3 py-2.5 mb-1.5">
                      <MaterialIcons name="storefront" size={14} color="#94a3b8" />
                      <Text className="text-[12px] font-poppins text-slate-700 ml-2">{s}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View className="flex-row gap-3">
                <TouchableOpacity className="flex-1 h-12 bg-slate-100 rounded-2xl items-center justify-center" onPress={() => setShowBlockModal(false)}>
                  <Text className="font-poppins-bold text-slate-600">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity className={`flex-1 h-12 rounded-2xl items-center justify-center ${actionColor}`} onPress={handleToggleBlock}>
                  {updatingUserId === selectedUser?.id ? <ActivityIndicator color="white" /> : <Text className="font-poppins-bold text-white">{actionLabel}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── FILTER BOTTOM SHEET ── */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="none"
        onRequestClose={closeSheet}
        statusBarTranslucent
      >
        <Animated.View
          style={[{ flex: 1, justifyContent: "flex-end" }, { opacity: backdropOpacity }]}
          className="bg-slate-900/50"
        >
          <TouchableOpacity
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            activeOpacity={1}
            onPress={closeSheet}
          />
          <Animated.View style={{ transform: [{ translateY }] }}>
            <View
              {...panResponder.panHandlers}
              className="bg-white rounded-t-3xl pt-3 px-4"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -6 },
                shadowOpacity: 0.08,
                shadowRadius: 20,
                elevation: 20,
                paddingBottom: insets.bottom + 20, 
              }}
            >
              <View className="w-9 h-1 bg-slate-200 rounded-full self-center mb-4" />
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-[15px] font-poppins-bold text-slate-900">Filter Users</Text>
                  <Text className="text-[10px] font-poppins text-slate-400 mt-0.5">
                    {statusFilter === "All" ? "Showing all accounts" : `Showing ${statusFilter.toLowerCase()} only`}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={closeSheet}
                  className="w-7 h-7 items-center justify-center"
                >
                  <Feather name="x" size={16} color="#94a3b8" />
                </TouchableOpacity>
              </View>
              <Text className="text-[9px] font-poppins-bold text-slate-400 uppercase tracking-widest mb-2">
                Account Status
              </Text>
              <View className="gap-2">
                {FILTER_OPTIONS.map((option) => {
                  const isActive  = statusFilter === option.value;
                  const iconColor =
                    option.value === "Active"  ? "#10b981" :
                    option.value === "Blocked" ? "#ef4444" : "#f97316";

                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => { setStatusFilter(option.value); closeSheet(); }}
                      activeOpacity={0.7}
                      className={`flex-row items-center px-3 py-2.5 rounded-xl border ${
                        isActive ? "bg-orange-50 border-orange-200" : "bg-slate-50 border-slate-100"
                      }`}
                    >
                      <View
                        className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${
                          isActive ? "bg-orange-100" : "bg-white"
                        }`}
                        style={!isActive ? { borderWidth: 1, borderColor: "#f1f5f9" } : undefined}
                      >
                        <Feather
                          name={option.value === "Active" ? "check-circle" : option.value === "Blocked" ? "slash" : "users"}
                          size={14}
                          color={isActive ? "#f97316" : iconColor}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className={`text-[12px] ${isActive ? "font-poppins-bold text-orange-600" : "font-poppins-medium text-slate-700"}`}>
                          {option.label}
                        </Text>
                        <Text className="text-[10px] font-poppins text-slate-400">{option.desc}</Text>
                      </View>
                      {isActive && (
                        <View className="w-5 h-5 rounded-full bg-orange-500 items-center justify-center">
                          <Feather name="check" size={10} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {statusFilter !== "All" && (
                <TouchableOpacity
                  onPress={() => { setStatusFilter("All"); closeSheet(); }}
                  className="mt-3 mb-1 self-center flex-row items-center gap-1"
                >
                  <Feather name="rotate-ccw" size={10} color="#94a3b8" />
                  <Text className="text-[11px] font-poppins text-slate-400">Reset filter</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}