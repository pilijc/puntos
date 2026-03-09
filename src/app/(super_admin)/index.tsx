import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Image, Modal, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView, Text, TouchableOpacity, View } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { supabase } from "@/supabase/supabase";

// ────────────────── Configuration & Constants ──────────────────
const BUCKET_URL = "https://[YOUR_PROJECT_ID].supabase.co/storage/v1/object/public/puntos-public/profile-pictures";

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  ACTIVE: { label: "Active", color: "#16A34A", dot: "#22C55E" },
  PENDING: { label: "Pending", color: "#DC2626", dot: "#EF4444" },
  INACTIVE: { label: "Inactive", color: "#DC2626", dot: "#EF4444" },
};

const ICON_COLOR_MAP: Record<string, string> = {
  registration: "#3B82F6",
  action: "#FF6600",
  alert: "#EF4444",
  default: "#64748B"
};

const SOFT_CARD_SHADOW = {
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 6,
  elevation: 2,
};

// ────────────────── Helpers ──────────────────
const getRoleDetails = (roleType: string, roleLevel?: number) => {
  const roles: Record<string, { label: string; bg: string; text: string }> = {
    super_admin: { label: "S-ADMIN", bg: "#FAF5FF", text: "#A855F7" },
    manager: { label: "MANAGER", bg: "#F0FDF4", text: "#16A34A" },
    front_desk: { label: "STAFF", bg: "#F0F9FF", text: "#0EA5E9" },
  };

  if (roles[roleType]) return roles[roleType];
  if (roleLevel === 0) return { label: "BLOCKED", bg: "#FEE2E2", text: "#EF4444" };
  return { label: "USER", bg: "#F1F5F9", text: "#94A3B8" };
};

export default function SuperAdminDashboard() {
  const router = useRouter();

  // ────────────────── State ──────────────────
  const [showNotifications, setShowNotifications] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [notifications, setNotifications] = useState([
    { id: "n1", title: "New Registration", message: "Alex Morgan registered", time: "2m ago", type: "registration", icon: "person-add", unread: true },
    { id: "n2", title: "Action Required", message: "Brew & Bean Co. is waiting", time: "1h ago", type: "action", icon: "warning", unread: true },
    { id: "n3", title: "System Alert", message: "Security patches applied", time: "5h ago", type: "alert", icon: "info", unread: false },
  ]);

  const unreadCount = useMemo(() => notifications.filter(n => n.unread).length, [notifications]);
  
  const activeStoresCount = useMemo(() => 
    stores.filter(s => s.status?.toString().toUpperCase().trim() === "ACTIVE").length, 
  [stores]);

  // ────────────────── Data Fetching ──────────────────
  const fetchDashboardData = useCallback(async () => {
    try {
      const [{ data: userData, error: userError }, { data: storeData, error: storeError }] = await Promise.all([
        supabase.from('users_with_email').select('*').order('id', { ascending: true }),
        supabase.from('stores').select('*')
      ]);

      if (userError) throw userError;
      if (storeError) throw storeError;

      const processedUsers = (userData || []).map(u => ({
        ...u,
        avatar: u.avatar_url
          ? u.avatar_url.startsWith('http') ? u.avatar_url : `${BUCKET_URL}/${u.avatar_url}`
          : `https://api.dicebear.com/7.x/avataaars/png?seed=${u.name || u.id}`,
        displayEmail: u.email || "No Email Provided"
      }));

      setUsers(processedUsers);
      setStores(storeData || []);
    } catch (error) {
      console.error("Dashboard Fetch Error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#FF6600" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6600" />}
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[9px] font-poppins text-primary uppercase tracking-widest mb-0.5">Welcome back!</Text>
              <Text className="text-3xl font-poppins-bold text-textPrimary leading-tight">Dashboard</Text>
            </View>

            <TouchableOpacity
              style={[SOFT_CARD_SHADOW, styles.notificationBtn]}
              onPress={() => setShowNotifications(true)}
            >
              <MaterialIcons name="notifications-none" size={18} color="#334155" />
              {unreadCount > 0 && (
                <View className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] rounded-full bg-primary items-center justify-center">
                  <Text className="text-white text-[8px] font-poppins-bold">{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <View className="h-[1px] bg-backgroundMuted mt-4" />
        </View>

        {/* Stats Section */}
        <View className="px-6 mb-6 mt-4">
          <View className="flex-row gap-2">
            <StatCard label="Total Users" val={users.length} icon="groups" color="#3B82F6" />
            <StatCard label="Total Stores" val={stores.length} icon="storefront" color="#22C55E" />
            <StatCard label="Active Stores" val={activeStoresCount} icon="storefront" color="#16A34A" />
          </View>
        </View>

        {/* User Management */}
        <View className="px-6 mb-8">
          <SectionHeader title="Manage Users" onAction={() => router.push("/(super_admin)/users")} />
          <View style={[SOFT_CARD_SHADOW, styles.userContainer]}>
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {users.length === 0 ? (
                <Text className="text-center py-10 text-textMuted font-poppins">No users found</Text>
              ) : (
                users.map((user, idx) => <UserRow key={user.id} user={user} isFirst={idx === 0} />)
              )}
            </ScrollView>
          </View>
        </View>

        {/* Store Management */}
        <View className="px-6 mb-6">
          <SectionHeader title="Store Management" onAction={() => router.push("/(super_admin)/stores")} />
          <View style={{ gap: 12 }}>
            {stores.length === 0 ? (
              <Text className="text-center text-textMuted py-4 font-poppins">No stores found.</Text>
            ) : (
              stores.map(store => <StoreCard key={store.id} store={store} />)
            )}
          </View>
        </View>

        {/* Notifications Modal */}
        <NotificationModal 
          visible={showNotifications} 
          onClose={() => setShowNotifications(false)} 
          data={notifications}
          onMarkRead={markAsRead}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ────────────────── Sub-Components ──────────────────

const StatCard = ({ label, val, icon, color }: any) => (
  <View style={[SOFT_CARD_SHADOW, styles.statCard]}>
    <MaterialIcons name={icon} size={16} color={color} />
    <Text className="text-[18px] font-poppins-bold text-textPrimary">{val}</Text>
    <Text className="text-[8px] font-poppins-bold text-textMuted uppercase">{label}</Text>
  </View>
);

const SectionHeader = ({ title, onAction }: { title: string, onAction: () => void }) => (
  <View className="flex-row justify-between items-center mb-3">
    <Text className="text-base font-poppins-bold text-textPrimary">{title}</Text>
    <TouchableOpacity className="flex-row items-center" onPress={onAction}>
      <Text className="text-[11px] font-poppins-bold text-primary mr-0.5">VIEW ALL</Text>
      <MaterialIcons name="chevron-right" size={14} color="#FF6600" />
    </TouchableOpacity>
  </View>
);

const UserRow = ({ user, isFirst }: any) => {
  const roleInfo = getRoleDetails(user.role_type, user.role);
  return (
    <View style={[styles.userRow, { borderTopWidth: isFirst ? 0 : 1 }]}>
      <Image source={{ uri: user.avatar }} style={styles.avatar} />
      <View className="ml-3 flex-1">
        <Text className="text-[13px] font-poppins-bold text-textPrimary">{user.name || "User"}</Text>
        <Text className="text-[10px] font-poppins text-textMuted italic">{user.displayEmail}</Text>
      </View>
      <View style={[styles.roleBadge, { backgroundColor: roleInfo.bg }]}>
        <Text style={{ color: roleInfo.text }} className="text-[9px] font-poppins-bold">{roleInfo.label}</Text>
      </View>
    </View>
  );
};

const StoreCard = ({ store }: any) => {
  const status = store.status?.toUpperCase() ?? "INACTIVE";
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["INACTIVE"];
  
  return (
    <View style={[SOFT_CARD_SHADOW, styles.storeCard]}>
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row flex-1 items-center">
          <Image
            source={{ uri: store.logo || store.image || `https://api.dicebear.com/7.x/identicon/png?seed=${store.name || store.id}` }}
            style={styles.storeLogo}
          />
          <View className="ml-3 flex-1">
            <Text className="text-[14px] font-poppins-bold text-textPrimary">{store.name}</Text>
            {store.location && <Text className="text-[11px] font-poppins text-textMuted">{store.location}</Text>}
          </View>
        </View>
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: cfg.dot }} />
      </View>
      <View className="flex-row gap-2">
        <TouchableOpacity style={styles.btnSecondary}><Text className="text-xs font-poppins-bold text-textSecondary">Edit</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btnDanger}><Text className="text-xs font-poppins-bold text-danger">Deactivate</Text></TouchableOpacity>
      </View>
    </View>
  );
};

const NotificationModal = ({ visible, onClose, data, onMarkRead }: any) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View className="flex-1 bg-black/40 justify-end">
      <View className="bg-white rounded-t-[28px] pt-3 pb-8 max-h-[65%]">
        <View className="w-9 h-1 bg-backgroundMuted rounded-full self-center mb-5" />
        <View className="flex-row justify-between items-center px-6 mb-4">
          <Text className="text-base font-poppins-bold text-textPrimary">Notifications</Text>
          <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={20} color="#94A3B8"/></TouchableOpacity>
        </View>
        <ScrollView>
          {data.map((n: any) => (
            <TouchableOpacity key={n.id} onPress={() => onMarkRead(n.id)} className={`flex-row px-6 py-3.5 ${n.unread ? 'bg-primary/5' : 'bg-white'}`}>
              <View style={{ backgroundColor: (ICON_COLOR_MAP[n.type] || ICON_COLOR_MAP.default) + "15" }} className="w-9 h-9 rounded-full items-center justify-center mr-3.5">
                <MaterialIcons name={n.icon} size={18} color={ICON_COLOR_MAP[n.type] || ICON_COLOR_MAP.default}/>
              </View>
              <View className="flex-1">
                <Text className="text-[13px] font-poppins-bold text-textPrimary">{n.title}</Text>
                <Text className="text-[12px] font-poppins text-textSecondary">{n.message}</Text>
                <Text className="text-[10px] font-poppins text-textMuted mt-0.5">{n.time}</Text>
              </View>
              {n.unread && <View className="w-2 h-2 rounded-full bg-primary mt-1.5" />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

// ────────────────── Styles──────────────────
const styles = {
  notificationBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFF",
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#F1F5F9"
  },
  statCard: {
    flex: 1, backgroundColor: "#FFF", borderRadius: 16, paddingVertical: 14, 
    alignItems: "center", borderWidth: 1, borderColor: "#F1F5F9"
  },
  userContainer: {
    backgroundColor: "#FFF", borderRadius: 16, overflow: "hidden", maxHeight: 350, borderWidth: 1, borderColor: "#F1F5F9"
  },
  userRow: {
    flexDirection: "row", alignItems: "center", padding: 14, borderTopColor: "#F8FAFC"
  },
  avatar: { width: 38, height: 38, borderRadius: 10, backgroundColor: "#F1F5F9" },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  storeCard: { backgroundColor: "#FFF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#F1F5F9" },
  storeLogo: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#F1F5F9" },
  btnSecondary: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0" },
  btnDanger: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: "#FFF5F5", borderWidth: 1, borderColor: "#FEE2E2" },
} as const;