import React, { useState, useEffect, useCallback } from "react";
import { Image, Modal, ScrollView, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { SafeAreaView, Text, TouchableOpacity, View } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { supabase } from "@/supabase/supabase";

export default function SuperAdminDashboard() {
  const router = useRouter();
  
  // UI State
  const [showNotifications, setShowNotifications] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Database Data State
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  const softCardShadow = {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  };

  const storeFilters = ["All Stores", "Active", "Deactivated"];

  // --- Fetch Data from Supabase ---
  const fetchDashboardData = useCallback(async () => {
    try {
      // 1. Fetch Users
      const { data: userData, error: userError } = await supabase
        .from('user_list')
        .select('*')
        .order('id', { ascending: true });

      if (userError) throw userError;

      // 2. Fetch Stores
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*');

      if (storeError) throw storeError;

      const formattedUsers = (userData || []).map(u => ({
        ...u,
        avatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${u.name || u.id}`,
      }));

      setUsers(formattedUsers);
      setStores(storeData || []);
    } catch (error) {
      console.error("Fetch Error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // --- Calculations ---
  // Using the logic from your old code but applied to Supabase data
  const activeStoresCount = stores.filter(store => store.status === "ACTIVE").length;

  // --- Logic to Block User ---
  async function handleBlockUser() {
    if (!selectedUser) return;
    try {
      const { error } = await supabase
        .from('user_list')
        .update({ role: 0 }) 
        .eq('id', selectedUser.id);

      if (error) throw error;

      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, role: 0 } : u));
      setShowBlockModal(false);
      Alert.alert("Success", `${selectedUser.name} has been blocked.`);
    } catch (error) {
      Alert.alert("Update Failed", error.message);
    }
  }

  // Mock Notifications
  const notifications = [
    { id: "n1", title: "New Registration", message: "Alex Morgan registered The Coffee Foundry", time: "2m ago", type: "registration", icon: "person-add", unread: true },
    { id: "n2", title: "Action Required", message: "Brew & Bean Co. is waiting for your review", time: "1h ago", type: "action", icon: "warning", unread: true },
    { id: "n3", title: "System Alert", message: "New security patches have been applied", time: "5h ago", type: "alert", icon: "info", unread: false },
  ];

  const iconColorMap = {
    registration: "#3B82F6",
    action: "#FF6600",
    alert: "#EF4444",
    default: "#64748B"
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F8FAFC]">
        <ActivityIndicator size="large" color="#FF6600" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={["top", "left", "right"]}>
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 40 }} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6600" />}
      >

        {/* Header */}
        <View className="px-6 pt-4 pb-4 bg-[#F8FAFC]">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[11px] font-poppins text-orange-500 uppercase tracking-widest mb-0.5">Welcome back</Text>
              <Text className="text-3xl font-poppins-bold text-slate-900 leading-tight">Dashboard</Text>
            </View>
            <TouchableOpacity
              style={[softCardShadow, { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#F1F5F9" }]}
              onPress={() => setShowNotifications(true)}
            >
              <MaterialIcons name="notifications-none" size={18} color="#334155" />
              <View style={{ position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: "#FF6600", borderWidth: 1.5, borderColor: "#FFFFFF" }} />
            </TouchableOpacity>
          </View>
          <View style={{ height: 1, backgroundColor: "#E2E8F0", marginTop: 16 }} />
        </View>

        {/* Stats Section - Fixed 3-Column Layout */}
        <View className="px-6 mb-6 mt-4">
          <View style={{ flexDirection: "row", gap: 8 }}>
            
            {/* Total Users */}
            <View style={[softCardShadow, { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 16, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#F1F5F9" }]}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                <MaterialIcons name="groups" size={16} color="#3B82F6" />
              </View>
              <Text className="text-[18px] font-poppins-bold text-slate-900">{users.length}</Text>
              <Text className="text-[8px] font-poppins-bold text-slate-400 mt-0.5 uppercase text-center">Total Users</Text>
            </View>

            {/* Total Stores */}
            <View style={[softCardShadow, { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 16, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#F1F5F9" }]}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                <MaterialIcons name="storefront" size={16} color="#22C55E" />
              </View>
              <Text className="text-[18px] font-poppins-bold text-slate-900">{stores.length}</Text>
              <Text className="text-[8px] font-poppins-bold text-slate-400 mt-0.5 uppercase text-center">Total Stores</Text>
            </View>

            {/* Active Stores */}
            <View style={[softCardShadow, { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 16, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#F1F5F9" }]}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                <MaterialIcons name="storefront" size={16} color="#16A34A" />
              </View>
              <Text className="text-[18px] font-poppins-bold text-slate-900">{activeStoresCount}</Text>
              <Text className="text-[8px] font-poppins-bold text-slate-400 mt-0.5 uppercase text-center">Active Stores</Text>
            </View>

          </View>
        </View>

        {/* Manage Users List */}
        <View className="px-6 mb-8">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-poppins-bold text-slate-900">Manage Users</Text>
            <TouchableOpacity className="flex-row items-center" onPress={() => router.push("/(super_admin)/users")}>
              <Text className="text-[11px] font-poppins-bold text-primary mr-0.5">VIEW ALL</Text>
              <MaterialIcons name="chevron-right" size={14} color="#FF6600" />
            </TouchableOpacity>
          </View>

          <View style={[softCardShadow, { backgroundColor: "#FFFFFF", borderRadius: 16, overflow: "hidden", maxHeight: 350, borderWidth: 1, borderColor: "#F1F5F9" }]}>
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {users.length === 0 ? (
                <Text className="text-center py-10 text-slate-400">No users found in database</Text>
              ) : (
                users.map((user, index) => (
                  <View key={user.id.toString()} style={{ flexDirection: "row", alignItems: "center", padding: 14, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: "#F8FAFC" }}>
                    <Image source={{ uri: user.avatar }} style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: "#F1F5F9" }} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text className="text-[13px] font-poppins-bold text-slate-800">{user.name || "User"}</Text>
                      <Text className="text-[11px] font-poppins text-slate-400">{user.email}</Text>
                      {user.role === 0 && <Text className="text-[9px] text-red-500 font-poppins-bold">BLOCKED</Text>}
                    </View>
                    {user.role !== 0 && (
                      <TouchableOpacity
                        style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#FEE2E2", backgroundColor: "#FFF5F5" }}
                        onPress={() => { setSelectedUser(user); setShowBlockModal(true); }}
                      >
                        <Text style={{ color: "#EF4444", fontSize: 11, fontWeight: "700" }}>Block</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>

        {/* Store Management Section */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-base font-poppins-bold text-slate-900">Store Management</Text>
            <TouchableOpacity onPress={() => router.push("/(super_admin)/stores")}>
              <Text className="text-[11px] font-poppins-bold text-primary">VIEW ALL</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {storeFilters.map((filter, index) => (
              <TouchableOpacity key={filter} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 8, backgroundColor: index === 0 ? "#1E293B" : "#FFFFFF", borderWidth: 1, borderColor: index === 0 ? "#1E293B" : "#E2E8F0" }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: index === 0 ? "#FFFFFF" : "#64748B" }}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={{ gap: 12 }}>
            {stores.length === 0 ? (
               <Text className="text-center text-slate-400 py-4">No stores found.</Text>
            ) : (
              stores.map((store) => (
                <View key={store.id} style={[softCardShadow, { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#F1F5F9" }]}>
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-row flex-1">
                      <Image source={{ uri: store.image || "https://via.placeholder.com/150" }} style={{ width: 48, height: 48, borderRadius: 12 }} />
                      <View className="ml-3 flex-1 justify-center">
                        <Text className="text-[14px] font-poppins-bold text-slate-800">{store.name}</Text>
                        <Text className="text-[11px] font-poppins text-slate-400">{store.location}</Text>
                      </View>
                    </View>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: store.status === "ACTIVE" ? "#F0FDF4" : "#FFFBEB", borderWidth: 1, borderColor: store.status === "ACTIVE" ? "#BBF7D0" : "#FDE68A" }}>
                      <Text style={{ fontSize: 9, fontWeight: "700", color: store.status === "ACTIVE" ? "#16A34A" : "#D97706" }}>{store.status}</Text>
                    </View>
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0" }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: "#475569" }}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: "#FFF5F5", borderWidth: 1, borderColor: "#FEE2E2" }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: "#EF4444" }}>Deactivate</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Notifications Modal */}
        <Modal visible={showNotifications} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.4)", justifyContent: "flex-end" }}>
            <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingBottom: 32, maxHeight: "65%" }}>
              <View style={{ width: 36, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, alignSelf: "center", marginBottom: 20 }} />
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#0F172A" }}>Notifications</Text>
                <TouchableOpacity onPress={() => setShowNotifications(false)}><MaterialIcons name="close" size={20} color="#94A3B8" /></TouchableOpacity>
              </View>
              <ScrollView>
                {notifications.map((n) => (
                  <TouchableOpacity key={n.id} style={{ flexDirection: "row", paddingHorizontal: 24, paddingVertical: 14, backgroundColor: n.unread ? "#FAFAFA" : "#FFFFFF" }}>
                    <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: iconColorMap[n.type] + "15", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                      <MaterialIcons name={n.icon} size={18} color={iconColorMap[n.type]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: "#1E293B" }}>{n.title}</Text>
                      <Text style={{ fontSize: 12, color: "#64748B" }}>{n.message}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Block Confirmation Modal */}
        <Modal visible={showBlockModal} animationType="fade" transparent>
          <View style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.4)", justifyContent: "center", alignItems: "center" }}>
            <View style={{ backgroundColor: "#FFF", borderRadius: 20, padding: 24, width: "80%", alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 12 }}>Block User</Text>
              <Text style={{ fontSize: 13, color: "#64748B", textAlign: "center", marginBottom: 24 }}>
                Are you sure you want to block <Text style={{ fontWeight: "700", color: "#EF4444" }}>{selectedUser?.name}</Text>?
              </Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: "#F1F5F9", alignItems: "center" }} onPress={() => setShowBlockModal(false)}>
                  <Text style={{ color: "#64748B", fontWeight: "600" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: "#EF4444", alignItems: "center" }} onPress={handleBlockUser}>
                  <Text style={{ color: "#FFF", fontWeight: "600" }}>Block</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </SafeAreaView>
  );
}