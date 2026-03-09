import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView, Text, TouchableOpacity, View } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { supabase } from "@/supabase/supabase";

// Import your sub-components
import { SectionHeader } from "@/components/ui/SectionHeader";
import { UserRow } from "@/components/users/UserRow";
import { StoreCard } from "@/components/stores/StoreCard";
import { StatCard } from "@/components/ui/StatCard";

// ────────────────── Configuration ──────────────────
const BUCKET_URL = "https://[YOUR_PROJECT_ID].supabase.co/storage/v1/object/public/puntos-public/profile-pictures";

const SOFT_CARD_SHADOW = {
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 6,
  elevation: 2,
};

export default function SuperAdminDashboard() {
  const router = useRouter();

  // ────────────────── State ──────────────────
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);

  const activeStoresCount = useMemo(() => 
    stores.filter(s => s.status?.toString().toUpperCase().trim() === "ACTIVE").length, 
  [stores]);

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
    } catch (error: any) {
      console.error("Dashboard Fetch Error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      if (isMounted) {
        await fetchDashboardData();
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
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
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#FF6600" 
          />
        }
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[9px] font-poppins text-primary uppercase tracking-widest mb-0.5">
                Welcome back!
              </Text>
              <Text className="text-3xl font-poppins-bold text-textPrimary leading-tight">
                Dashboard
              </Text>
            </View>

            {/* Replaced Notifications with Settings Icon */}
            <TouchableOpacity
              style={[SOFT_CARD_SHADOW, styles.headerBtn]}
              onPress={() => console.log("Open Settings")}
            >
              <MaterialIcons name="settings" size={20} color="#334155" />
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
          <SectionHeader 
            title="Manage Users" 
            onAction={() => router.push("/(super_admin)/users")} 
          />
          <View style={[SOFT_CARD_SHADOW, styles.userContainer]}>
            <ScrollView 
              nestedScrollEnabled 
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 350 }}
            >
              {users.length === 0 ? (
                <Text className="text-center py-10 text-textMuted font-poppins">No users found</Text>
              ) : (
                users.map((user, idx) => (
                  <UserRow key={user.id} user={user} isFirst={idx === 0} />
                ))
              )}
            </ScrollView>
          </View>
        </View>

        {/* Store Management */}
        <View className="px-6 mb-6">
          <SectionHeader 
            title="Store Management" 
            onAction={() => router.push("/(super_admin)/stores")} 
          />
          <View style={{ gap: 12 }}>
            {stores.length === 0 ? (
              <Text className="text-center text-textMuted py-4 font-poppins">No stores found.</Text>
            ) : (
              stores.map(store => <StoreCard key={store.id} store={store} />)
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  userContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
} as const;