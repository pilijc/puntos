import React, { useEffect, useCallback, useMemo, useRef } from "react";
import {
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Animated,
  PanResponder,
  FlatList,
} from "react-native";
import { SafeAreaView, Text, View, TouchableOpacity } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { useUserStore, type UserRoleTab, type AccountStatusFilter } from "@/store/user-store";
import { UserRow } from "@/components/users/UserRow";

// ────────────────── Configuration & Types ──────────────────

type UserRole = UserRoleTab;
type AccountStatus = AccountStatusFilter;

const FILTER_OPTIONS: { value: AccountStatus; label: string; desc: string }[] = [
  { value: "All", label: "All Accounts", desc: "Show everyone" },
  { value: "Active", label: "Active Only", desc: "Show active users" },
  { value: "Blocked", label: "Blocked Only", desc: "Show blocked users" },
];

const TYPO = {
  title: "text-[22px] font-poppins-bold text-textPrimary leading-7",
  subtitle: "text-[11px] font-poppins text-textMuted",
  sectionHeader: "text-[10px] font-poppins-bold text-textMuted uppercase tracking-widest",
  body: "text-[12px] font-poppins text-textSecondary",
  button: "text-[12px] font-poppins-bold",
  chip: "text-[11px] font-poppins-bold",
};

const ROLE_CONFIG: Record<string, { bg: string; text: string }> = {
  "s-admin": { bg: "bg-amber-100", text: "text-amber-700" },
  Manager: { bg: "bg-purple-100", text: "text-purple-600" },
  Staff: { bg: "bg-blue-100", text: "text-blue-600" },
  User: { bg: "bg-slate-100", text: "text-slate-600" },
  Blocked: { bg: "bg-red-100", text: "text-red-600" },
};

export default function UsersScreen() {
  const insets = useSafeAreaInsets();

  // ────────────────── State ──────────────────
  const {
    users,
    loading,
    refreshing,
    updatingUserId,
    fetchUsers,
    setRefreshing,
    activeTab,
    statusFilter,
    search,
    showFilterModal,
    setActiveTab,
    setStatusFilter,
    setSearch,
    setShowFilterModal,
    selectedUser,
    showBlockModal,
    openBlockModal,
    closeBlockModal,
    confirmToggleBlock,
    tabCounts,
    flatListData,
    stickyHeaderIndices,
  } = useUserStore();

  // ────────────────── Animations ──────────────────
  const translateY = useRef(new Animated.Value(300)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const openFilter = () => {
    setShowFilterModal(true);
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, damping: 25, stiffness: 200, useNativeDriver: true })
    ]).start();
  };

  const closeSheet = useCallback((onClosed?: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 300, duration: 200, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      requestAnimationFrame(() => {
        setShowFilterModal(false);
        onClosed?.();
      });
    });
  }, [translateY, backdropOpacity]);

  const handleCloseSheet = useCallback(() => closeSheet(), [closeSheet]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 10,
      onPanResponderMove: (_, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 50) closeSheet();
        else Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  // ────────────────── Helpers ──────────────────
  const getBadge = (user: any) => {
    if (!user) return ROLE_CONFIG["User"];
    if (user.status === "Blocked") return ROLE_CONFIG["Blocked"];
    return ROLE_CONFIG[user.roleLabel] || ROLE_CONFIG["User"];
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, [setRefreshing, fetchUsers]);

  // ────────────────── Lifecycle ──────────────────
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ────────────────── Data Processing ──────────────────
  const counts = useMemo(() => tabCounts(), [tabCounts, users, activeTab, statusFilter, search]);
  const listData = useMemo(() => flatListData(), [flatListData, users, activeTab, statusFilter, search]);
  const stickyHeaders = useMemo(
    () => stickyHeaderIndices(),
    [stickyHeaderIndices, users, activeTab, statusFilter, search]
  );

  const renderItem = ({ item }: { item: any }) => {
    if (item.isHeader) {
      return (
        <View className="bg-background flex-row items-center py-2 px-5 mt-2">
          <Text className={`${TYPO.sectionHeader} mr-2`}>{item.title}</Text>
          <View className="flex-1 h-[0.5px] bg-backgroundMuted" />
        </View>
      );
    }

    const isBlocked = item.status === "Blocked";
    const isSuperAdmin = item.roleLabel === "s-admin" || item.role_type === "super_admin";

    return (
      <TouchableOpacity
        disabled={isSuperAdmin}
        activeOpacity={isSuperAdmin ? 1 : 0.7}
        onPress={() => openBlockModal(item)}
        className={`mx-4 ${isSuperAdmin ? "opacity-60" : ""}`}
      >
        <View 
          className={`flex-row items-center bg-white rounded-xl mb-3 border ${
            isSuperAdmin ? "border-slate-200 bg-slate-50" : isBlocked ? "border-red-100" : "border-slate-100"
          }`} 
          style={{ elevation: isSuperAdmin ? 0 : 2 }}
        >
          <View className="flex-1">
            <UserRow user={item} isFirst />
          </View>
          
          {!isSuperAdmin ? (
            <MaterialIcons name="chevron-right" size={18} color="#cbd5e1" style={{ marginRight: 12 }} />
          ) : (
            <Feather name="lock" size={14} color="#94a3b8" style={{ marginRight: 15 }} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  const willBlock = selectedUser?.status !== "Blocked";

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />
      <View className="px-5 pt-4">
        <View className="mb-4">
          <Text className={TYPO.title}>Users</Text>
          <Text className={TYPO.subtitle}>{counts.All} members total</Text>
        </View>

        <View className="flex-row items-center bg-backgroundMuted rounded-xl px-3 mb-4 h-10 border border-slate-200/50">
          <Feather name="search" size={14} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput 
            className="flex-1 text-[13px] font-poppins text-textPrimary" 
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

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
          data={["All", "User", "Manager", "Staff"] as UserRole[]}
          keyExtractor={(item) => item}
          ListHeaderComponent={
            <TouchableOpacity 
              onPress={openFilter}
              className={`flex-row items-center h-10 px-4 rounded-full mr-2 border ${statusFilter !== "All" ? "bg-orange-50 border-orange-200" : "bg-white border-slate-100"}`}
            >
              <Feather name="sliders" size={13} color={statusFilter !== "All" ? "#FF6600" : "#94a3b8"} style={{ marginRight: 6 }} />
              <Text className={`${TYPO.chip} ${statusFilter !== "All" ? "text-primary" : "text-textMuted"}`}>Filter</Text>
            </TouchableOpacity>
          }
          renderItem={({ item: tab }) => (
            <TouchableOpacity 
              onPress={() => setActiveTab(tab)} 
              className={`flex-row items-center h-10 px-4 rounded-full mr-2 ${activeTab === tab ? "bg-orange-500" : "bg-white border border-slate-100"}`}
            >
              <Text className={`${TYPO.chip} ${activeTab === tab ? "text-white" : "text-textMuted"}`}>
                {tab === "All" ? "All" : tab + "s"}
              </Text>
              <View className={`ml-2 px-1.5 py-0.5 rounded-md ${activeTab === tab ? "bg-white/20" : "bg-slate-100"}`}>
                <Text className={`text-[9px] font-poppins-bold ${activeTab === tab ? "text-white" : "text-textMuted"}`}>
                  {counts[tab as keyof typeof counts]}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.isHeader ? `header-${item.title}` : `user-${item.id}-${index}`}
        stickyHeaderIndices={stickyHeaders}
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        removeClippedSubviews={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        ListEmptyComponent={
          <View className="items-center justify-center pt-20">
            <Text className={TYPO.subtitle}>No users found</Text>
          </View>
        }
      />
      {showBlockModal && (
        <View className="absolute inset-0 z-50" style={{ justifyContent: "center" }} collapsable={false}>
          <View style={StyleSheet.absoluteFillObject} className="bg-black/50" />
          <View className="px-5">
            <View className="bg-white w-full rounded-3xl overflow-hidden shadow-2xl">
              <View className={`h-1.5 w-full ${willBlock ? "bg-red-500" : "bg-emerald-500"}`} />
              <View className="p-6">
                <View className={`w-14 h-14 rounded-2xl items-center justify-center self-center mb-4 ${willBlock ? "bg-red-50" : "bg-emerald-50"}`}>
                  <MaterialIcons name={willBlock ? "block" : "lock-open"} size={28} color={willBlock ? "#ef4444" : "#059669"} />
                </View>
                <Text className="text-[17px] font-poppins-bold text-textPrimary text-center mb-1">{willBlock ? "Block User" : "Unblock User"}</Text>
                <Text className={`${TYPO.body} text-center mb-5`}>Are you sure you want to {willBlock ? "restrict" : "restore"} access for this user?</Text>

                {selectedUser && (
                  <View className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-100">
                    <View className="flex-row items-center mb-3">
                      <View className="w-10 h-12 rounded-xl overflow-hidden border border-slate-200 mr-3">
                        <Image source={{ uri: selectedUser.imageUri || selectedUser.avatar }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[14px] font-poppins-bold text-textPrimary">{selectedUser.name}</Text>
                        <Text className={TYPO.subtitle}>{selectedUser.email || selectedUser.displayEmail}</Text>
                      </View>
                      <View className={`px-2.5 py-1 rounded-lg ${getBadge(selectedUser).bg}`}>
                        <Text className={`text-[9px] font-poppins-bold uppercase ${getBadge(selectedUser).text}`}>
                          {selectedUser.status === "Blocked" ? "Blocked" : (selectedUser.roleLabel || "User")}
                        </Text>
                      </View>
                    </View>
                    {selectedUser.roleLabel === "Manager" && (selectedUser.stores?.length > 0) && (
                      <View>
                        <Text className="text-[10px] font-poppins-bold text-slate-400 uppercase tracking-wider mb-2">Stores Managed</Text>
                        {selectedUser.stores.map((store: string, i: number) => (
                          <View key={i} className="flex-row items-center bg-white border border-slate-100 rounded-xl px-3 py-2 mb-1.5">
                            <MaterialIcons name="storefront" size={14} color="#94a3b8" />
                            <Text className="text-[12px] font-poppins text-slate-700 ml-2">{store}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {selectedUser.roleLabel === "Staff" && (selectedUser.stores?.length > 0) && (
                      <View>
                        <Text className="text-[10px] font-poppins-bold text-slate-400 uppercase tracking-wider mb-2">Branch Location</Text>
                        <View className="flex-row items-center bg-orange-500 rounded-xl px-4 py-3">
                          <MaterialIcons name="location-on" size={14} color="white" />
                          <Text className="text-[12px] font-poppins-bold text-white flex-1 ml-2">{selectedUser.stores[0]}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                <View className="flex-row gap-3">
                  <TouchableOpacity className="flex-1 h-12 bg-slate-100 rounded-2xl items-center justify-center" onPress={closeBlockModal}>
                    <Text className={`${TYPO.button} text-textSecondary`}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 h-12 rounded-2xl items-center justify-center ${willBlock ? "bg-red-500" : "bg-emerald-500"}`}
                    onPress={confirmToggleBlock}
                    disabled={updatingUserId === selectedUser?.id}
                  >
                    {updatingUserId === selectedUser?.id ? <ActivityIndicator color="white" size="small" /> : <Text className={`${TYPO.button} text-white`}>{willBlock ? "Block User" : "Unblock"}</Text>}
                  </TouchableOpacity>
                </View>
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
          </View>
        </View>
      )}
      {showFilterModal && (
        <View className="absolute inset-0 z-50" style={{ justifyContent: "flex-end" }} pointerEvents="box-none" collapsable={false}>
          <Animated.View
            style={[StyleSheet.absoluteFillObject, { opacity: backdropOpacity }]}
            className="bg-slate-900/50"
          >
            <TouchableOpacity
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
              activeOpacity={1}
              onPress={handleCloseSheet}
            />
          </Animated.View>

          <Animated.View style={{ transform: [{ translateY }] }}>
            <View
              {...panResponder.panHandlers}
              className="bg-white rounded-t-3xl pt-3 px-4"
              style={{ elevation: 20, paddingBottom: insets.bottom + 20 }}
            >
              <View className="w-9 h-1 bg-slate-200 rounded-full self-center mb-4" />
              <Text className="text-[15px] font-poppins-bold text-textPrimary mb-4">Filter Users</Text>
              <View className="gap-2">
                {FILTER_OPTIONS.map((option) => {
                  const isActive = statusFilter === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => {
                        closeSheet(() => setStatusFilter(option.value));
                      }}
                      className={`flex-row items-center px-3 py-2.5 rounded-xl border ${isActive ? "bg-orange-50 border-orange-200" : "bg-slate-50 border-slate-100"}`}
                    >
                      <View className="flex-1">
                        <Text
                          className={`text-[12px] ${isActive ? "font-poppins-bold text-primary" : "font-poppins-medium text-textSecondary"}`}
                        >
                          {option.label}
                        </Text>
                        <Text className={TYPO.subtitle}>{option.desc}</Text>
                      </View>
                      {isActive && <Feather name="check" size={14} color="#f97316" />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                onPress={() => {
                  closeSheet(() => setStatusFilter("All"));
                }}
                className="mt-4 h-11 rounded-2xl items-center justify-center bg-slate-100 border border-slate-200"
              >
                <Text className={`${TYPO.button} text-textSecondary`}>Reset filter</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}