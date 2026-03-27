import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ScrollView, ActivityIndicator, RefreshControl, Image, StyleSheet, Pressable } from "react-native";
import { SafeAreaView, Text, View } from "@/tw";
import { useRouter, useFocusEffect } from "expo-router";
import { useDashboardStore } from "@/store/dashboard-store";
import { useProfile } from "@/hooks/use-profile";
import { SectionHeader } from "@/components/ui/section-header";
import { UserRow } from "@/components/users/UserRow";
import { StatCard } from "@/components/ui/stat-card";
import { Modal } from "@/components/modal";
import { Users, Store, BarChart3 } from "lucide-react-native";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { users, stores, adminInfo, loading, fetchDashboardData, fetchAdminSession } = useDashboardStore();
  const { profile, refreshProfile } = useProfile();

  const [refreshing, setRefreshing] = useState(false);
  const [avatarKey, setAvatarKey] = useState(Date.now());

  const activeStoresCount = useMemo(() =>
    (stores || []).filter(s => s.status?.toString().toUpperCase().trim() === "ACTIVE").length,
    [stores]
  );

  useFocusEffect(
    useCallback(() => {
      initData();
      refreshProfile();
      setAvatarKey(Date.now());
    }, [])
  );

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
                className="relative mt-1"
              >
                <Image
                  source={{ uri: (profile?.avatar_url || profile?.avatarUrl || profile?.logo || adminInfo?.avatar) ? `${(profile?.avatar_url || profile?.avatarUrl || profile?.logo || adminInfo?.avatar)}?t=${avatarKey}` : undefined }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    borderWidth: 2,
                    borderColor: "#F1F5F9",
                  }}
                />
                <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full z-10" />
              </Pressable>
            </View>
          </View>
          <View className="px-2 mt-3">
            <View className="h-[1px] w-full bg-[#E2E8F0]" />
          </View>
        </View>

        <View className="px-6 mb-6 mt-4">
          <View className="flex-row gap-2">
            <StatCard label="Total Users" val={users.length} Icon={Users} />
            <StatCard label="Total Stores" val={stores.length} Icon={Store} />
            <StatCard label="Active Stores" val={activeStoresCount} Icon={Store} />
          </View>
        </View>

        {/* User Analytics Placeholder Section */}
        <View className="mb-6 px-6">
            <SectionHeader title="User Analytics" onAction={() => {}} />
            <View className="bg-white rounded-2xl p-8 border border-slate-100 items-center justify-center min-h-[220px]">
                <Users size={48} color="#FF6600" />
                <Text className="text-lg font-[Poppins-Bold] text-[#0F172A] mt-3">User Insights</Text>
                <Text className="text-sm font-[Poppins-Regular] text-[#94A3B8] text-center mt-2 px-6">
                    User analytics and behaviors will appear here.
                </Text>
            </View>
        </View>

        {/* Store Analytics Placeholder Section */}
        <View className="mb-8 px-6">
            <SectionHeader title="Store Analytics" onAction={() => {}} />
            <View className="bg-white rounded-2xl p-8 border border-slate-100 items-center justify-center min-h-[220px]">
                <BarChart3 size={48} color="#FF6600" />
                <Text className="text-lg font-[Poppins-Bold] text-[#0F172A] mt-3">Store Insights</Text>
                <Text className="text-sm font-[Poppins-Regular] text-[#94A3B8] text-center mt-2 px-6">
                    Store analytics and insights will appear here.
                </Text>
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
