import React, { useState, useEffect, useCallback } from "react"; 
import { Image, Modal, ScrollView, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { SafeAreaView, Text, TouchableOpacity, View } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { supabase } from "@/supabase/supabase";

// ── STATUS CONFIG ─────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  ACTIVE: { label: "Active", color: "#16A34A", dot: "#22C55E" },
  PENDING: { label: "Pending", color: "#DC2626", dot: "#EF4444" },
  INACTIVE: { label: "Inactive", color: "#DC2626", dot: "#EF4444" },
};

export default function SuperAdminDashboard() {
  const router = useRouter();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ✅ Notifications */
  const [notifications, setNotifications] = useState([
    { id: "n1", title: "New Registration", message: "Alex Morgan registered", time: "2m ago", type: "registration", icon: "person-add", unread: true },
    { id: "n2", title: "Action Required", message: "Brew & Bean Co. is waiting", time: "1h ago", type: "action", icon: "warning", unread: true },
    { id: "n3", title: "System Alert", message: "Security patches applied", time: "5h ago", type: "alert", icon: "info", unread: false },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const softCardShadow = {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  };

  const fetchDashboardData = useCallback(async () => {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .order('id', { ascending: true });
    
    if (userError) throw userError;

    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('*');
      
    if (storeError) throw storeError;

    // 1. Define your storage base path
    // Replace [YOUR_PROJECT_ID] with your actual Supabase project ID (e.g., abcdefghijklm)
    const BUCKET_URL = "https://[YOUR_PROJECT_ID].supabase.co/storage/v1/object/public/puntos-public/profile-pictures";

    const processedUsers = (userData || []).map(u => {
      let finalAvatar;

      if (u.avatar_url) {
        // 2. Check if avatar_url is already a full URL or just a filename
        const isFullUrl = u.avatar_url.startsWith('http');
        finalAvatar = isFullUrl 
          ? u.avatar_url 
          : `${BUCKET_URL}/${u.avatar_url}`;
      } else {
        // 3. Fallback to DiceBear if avatar_url is null or empty
        finalAvatar = `https://api.dicebear.com/7.x/avataaars/png?seed=${u.name || u.id}`;
      }

      return {
        ...u,
        avatar: finalAvatar,
      };
    });

    setUsers(processedUsers);
    setStores(storeData || []);
  } catch (error) {
    console.error("Fetch Error:", error.message);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const onRefresh = () => { setRefreshing(true); fetchDashboardData(); };

  const activeStoresCount = stores.filter(store => store.status?.toString().toUpperCase().trim() === "ACTIVE").length;

  const markNotificationRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const iconColorMap = {
    registration: "#3B82F6",
    action: "#FF6600",
    alert: "#EF4444",
    default: "#64748B"
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
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6600" />}
      >

        {/* HEADER */}
        <View className="px-6 pt-4 pb-4 bg-background">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[9px] font-poppins text-primary uppercase tracking-widest mb-0.5">
                Welcome back!
              </Text>
              <Text className="text-3xl font-poppins-bold text-textPrimary leading-tight">
                Dashboard
              </Text>
            </View>

            {/* 🔔 Notifications */}
            <TouchableOpacity
              style={[softCardShadow, {
                width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFFFFF",
                alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#F1F5F9"
              }]}
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

        {/* DASHBOARD CARDS */}
        <View className="px-6 mb-6 mt-4">
          <View className="flex-row gap-2">
            <View style={[softCardShadow, { flex: 1, backgroundColor: "#FFF", borderRadius: 16, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#F1F5F9" }]}>
              <MaterialIcons name="groups" size={16} color="#3B82F6"/>
              <Text className="text-[18px] font-poppins-bold text-textPrimary">{users.length}</Text>
              <Text className="text-[8px] font-poppins-bold text-textMuted uppercase">Total Users</Text>
            </View>
            <View style={[softCardShadow, { flex: 1, backgroundColor: "#FFF", borderRadius: 16, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#F1F5F9" }]}>
              <MaterialIcons name="storefront" size={16} color="#22C55E"/>
              <Text className="text-[18px] font-poppins-bold text-textPrimary">{stores.length}</Text>
              <Text className="text-[8px] font-poppins-bold text-textMuted uppercase">Total Stores</Text>
            </View>
            <View style={[softCardShadow, { flex: 1, backgroundColor: "#FFF", borderRadius: 16, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#F1F5F9" }]}>
              <MaterialIcons name="storefront" size={16} color="#16A34A"/>
              <Text className="text-[18px] font-poppins-bold text-textPrimary">{activeStoresCount}</Text>
              <Text className="text-[8px] font-poppins-bold text-textMuted uppercase">Active Stores</Text>
            </View>
          </View>
        </View>

        {/* MANAGE USERS */}
        <View className="px-6 mb-8">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-poppins-bold text-textPrimary">Manage Users</Text>
            <TouchableOpacity className="flex-row items-center" onPress={() => router.push("/(super_admin)/users")}>
              <Text className="text-[11px] font-poppins-bold text-primary mr-0.5">VIEW ALL</Text>
              <MaterialIcons name="chevron-right" size={14} color="#FF6600" />
            </TouchableOpacity>
          </View>

          <View style={[softCardShadow, { backgroundColor: "#FFFFFF", borderRadius: 16, overflow: "hidden", maxHeight: 350, borderWidth: 1, borderColor: "#F1F5F9" }]}>
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {users.length === 0 ? (
                <Text className="text-center py-10 text-textMuted font-poppins">No users found in database</Text>
              ) : (
                users.map((user, index) => (
                  <View key={user.id.toString()} style={{ flexDirection: "row", alignItems: "center", padding: 14, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: "#F8FAFC" }}>
                    <Image source={{ uri: user.avatar }} style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: "#F1F5F9" }} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text className="text-[13px] font-poppins-bold text-textPrimary">{user.name || "User"}</Text>
                      <Text className="text-[11px] font-poppins text-textMuted">{user.email}</Text>
                      {user.role === 0 && <Text className="text-[9px] text-danger font-poppins-bold">BLOCKED</Text>}
                    </View>
                    {user.role !== 0 && (
                      <TouchableOpacity
                        style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#FEE2E2", backgroundColor: "#FFF5F5" }}
                        onPress={() => { setSelectedUser(user); setShowBlockModal(true); }}
                      >
                        <Text className="text-danger text-[11px] font-poppins-bold">Block</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>

        {/* STORE MANAGEMENT */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-base font-poppins-bold text-textPrimary">Store Management</Text>
            <TouchableOpacity onPress={() => router.push("/(super_admin)/stores")}>
              <Text className="text-[11px] font-poppins-bold text-primary">VIEW ALL</Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 12 }}>
            {stores.length === 0 ? (
              <Text className="text-center text-textMuted py-4 font-poppins">No stores found.</Text>
            ) : (
              stores.map((store) => {
                const status = store.status?.toUpperCase() ?? "INACTIVE";
                const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["INACTIVE"];
                return (
                  <View key={store.id} style={[softCardShadow, { backgroundColor: "#FFF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#F1F5F9" }]}>
                    <View className="flex-row justify-between items-center mb-4">
                      <View className="flex-row flex-1 items-center">
                        <Image
                          source={{ 
                            uri: store.logo || store.image || `https://api.dicebear.com/7.x/identicon/png?seed=${store.name || store.id}&backgroundColor=F1F5F9` 
                          }}
                          style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#F1F5F9" }}
                        />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text className="text-[14px] font-poppins-bold text-textPrimary">{store.name}</Text>
                          {store.location && <Text className="text-[11px] font-poppins text-textMuted">{store.location}</Text>}
                        </View>
                      </View>
                      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: cfg.dot }} />
                    </View>

                    <View className="flex-row gap-2">
                      <TouchableOpacity style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0" }}>
                        <Text className="text-xs font-poppins-bold text-textSecondary">Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: "#FFF5F5", borderWidth: 1, borderColor: "#FEE2E2" }}>
                        <Text className="text-xs font-poppins-bold text-danger">Deactivate</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* NOTIFICATIONS MODAL */}
        <Modal visible={showNotifications} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.4)", justifyContent: "flex-end" }}>
            <View className="bg-white rounded-t-[28px] pt-3 pb-8 max-h-[65%]">
              <View className="w-9 h-1 bg-backgroundMuted rounded-full self-center mb-5" />
              <View className="flex-row justify-between items-center px-6 mb-4">
                <Text className="text-base font-poppins-bold text-textPrimary">Notifications</Text>
                <TouchableOpacity onPress={() => setShowNotifications(false)}>
                  <MaterialIcons name="close" size={20} color="#94A3B8"/>
                </TouchableOpacity>
              </View>
              <ScrollView>
                {notifications.map((n) => (
                  <TouchableOpacity key={n.id} onPress={() => markNotificationRead(n.id)} className={`flex-row px-6 py-3.5 ${n.unread ? 'bg-primary/5' : 'bg-white'}`}>
                    <View style={{ backgroundColor: iconColorMap[n.type] + "15" }} className="w-9 h-9 rounded-full items-center justify-center mr-3.5">
                      <MaterialIcons name={n.icon} size={18} color={iconColorMap[n.type]}/>
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

      </ScrollView>
    </SafeAreaView>
  );
}