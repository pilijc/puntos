import React, { useState, useEffect, useMemo } from "react";
import { ScrollView, ActivityIndicator, RefreshControl, Image, StyleSheet, Pressable } from "react-native";
import { SafeAreaView, Text, View } from "@/tw";
import { useRouter } from "expo-router";
import { useDashboardStore } from "@/store/dashboard-store";
import { SectionHeader } from "@/components/ui/section-header";
import { UserRow } from "@/components/users/UserRow";
import { StoreCard } from "@/components/stores/store-card";
import { StatCard } from "@/components/ui/stat-card";
import { Modal } from "@/components/modal";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { users, stores, adminInfo, loading, fetchDashboardData, fetchAdminSession } = useDashboardStore();

  const [refreshing, setRefreshing] = useState(false);

  const activeStoresCount = useMemo(() => 
    (stores || []).filter(s => s.status?.toString().toUpperCase().trim() === "ACTIVE").length,
    [stores]
  );

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    await Promise.all([fetchAdminSession(), fetchDashboardData()]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await initData();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
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
        {/* Header Section */}
        <View className="pt-4 pb-3">
          <View className="px-6.5">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pl-2 pt-4 items-start"> 
                <Text className="text-sm text-[#94A3B8] font-[Poppins-Regular]">
                  Welcome, <Text className="text-orange-500 font-[Poppins-Bold]">
                    {adminInfo?.username?.split(" ")[0] || "Admin"}
                  </Text>!
                </Text>
                <Text className="text-2xl font-[Poppins-Bold] text-[#0F172A]">
                  Dashboard
                </Text>
              </View>

              <Pressable
                onPress={() => router.push("/(super_admin)/settings")}
                style={{ width: 44, height: 44, borderRadius: 14, overflow: "hidden" }}
              >
                <Image
                  source={{ uri: adminInfo?.avatar }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: "#F1F5F9",
                  }}
                />
              </Pressable>
            </View>
          </View>
          <View className="px-2 mt-3">
            <View className="h-[1px] w-full bg-[#E2E8F0]" />
          </View>
        </View>

        <View className="px-6 mb-6 mt-4">
          <View className="flex-row gap-2">
            <StatCard label="Total Users"   val={users.length}         icon="groups"/>
            <StatCard label="Total Stores"  val={stores.length}        icon="storefront"/>
            <StatCard label="Active Stores" val={activeStoresCount}    icon="storefront"/>
          </View>
        </View>

        {/* Manage Users Section */}
        <View className="px-6 mb-8">
          <SectionHeader title="Manage Users" onAction={() => router.push("/(super_admin)/users")} />
          <View style={styles.userContainer}>
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={{ maxHeight: 350 }}>
              {users.length === 0 ? (
                <Text className="text-center py-10 text-[#94A3B8] font-[Poppins-Regular]">No users found</Text>
              ) : (
                users.map((user, idx) => <UserRow key={`${user.id}-${idx}`} user={user} isFirst={idx === 0} />)
              )}
            </ScrollView>
          </View>
        </View>

        {/* Store Management Section */}
        <View className="px-6 mb-6">
          <SectionHeader title="Store Management" onAction={() => router.push("/(super_admin)/stores")} />
          <View style={{ gap: 6 }}>
            {stores.length === 0 ? (
              <Text className="text-center text-[#94A3B8] py-4 font-[Poppins-Regular]">No stores found.</Text>
            ) : (
              stores.map(store => <StoreCard key={store.id} store={store} />)
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  userContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
});
