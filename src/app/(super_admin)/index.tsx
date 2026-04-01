import React from "react";
import { ScrollView, ActivityIndicator, RefreshControl, Image, StyleSheet, Pressable } from "react-native";
import { SafeAreaView, Text, View } from "@/tw";
import { useSuperAdminDashboard } from "@/hooks/super-admin/use-super-admin-dashboard";
import { SectionHeader } from "@/components/ui/section-header";
import { UserRow } from "@/components/users/UserRow";
import { StatCard } from "@/components/ui/stat-card";
import { Modal } from "@/components/modal";
import { Users, Store, BarChart3 } from "lucide-react-native";
import { useTranslation } from "react-i18next";

export default function SuperAdminDashboard() {
  const {
    router,
    users,
    stores,
    adminInfo,
    loading,
    profile,
    refreshing,
    avatarKey,
    activeStoresCount,
    onRefresh,
  } = useSuperAdminDashboard();
  const { t: translate } = useTranslation();

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-background dark:bg-darkBackground">
        <ActivityIndicator size="large" color="#FF6600" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-darkBackground" edges={["top", "left", "right"]}>
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
                <Text className="text-sm text-[#94A3B8] dark:text-darkTextSecondary font-[Poppins-Regular]">
                    {translate("superAdmin.dashboard.welcome")}
                    <Text className="text-orange-500 font-[Poppins-Bold]">
                    {adminInfo?.username?.split(" ")[0] || "Admin"}
                  </Text>!
                </Text>
                <Text className="text-2xl font-[Poppins-Bold] text-[#0F172A] dark:text-darkTextPrimary">
                  {translate("superAdmin.dashboard.title")}
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
            <View className="h-[1px] w-full bg-[#E2E8F0] dark:bg-darkBorder" />
          </View>
        </View>

        <View className="px-6 mb-6 mt-4">
          <View className="flex-row gap-2">
            <StatCard label={translate("superAdmin.dashboard.metrics.totalUsers")} val={users.length} Icon={Users} />
            <StatCard label={translate("superAdmin.dashboard.metrics.totalStores")} val={stores.length} Icon={Store} />
            <StatCard label={translate("superAdmin.dashboard.metrics.activeStores")} val={activeStoresCount} Icon={Store} />
          </View>
        </View>

        {/* User Analytics Placeholder Section */}
        <View className="mb-6 px-6">
          <SectionHeader title={translate("superAdmin.dashboard.analytics.user.title")} onAction={() => { }} />
          <View className="bg-white dark:bg-darkBackgroundMuted rounded-2xl p-8 border border-slate-100 dark:border-darkBorder items-center justify-center min-h-[220px]">
            <Users size={48} color="#FF6600" />
            <Text className="text-lg font-[Poppins-Bold] text-[#0F172A] dark:text-darkTextPrimary mt-3">
              {translate("superAdmin.dashboard.analytics.user.insights")}
            </Text>
            <Text className="text-sm font-[Poppins-Regular] text-[#94A3B8] dark:text-darkTextSecondary text-center mt-2 px-6">
              {translate("superAdmin.dashboard.analytics.user.desc")}
            </Text>
          </View>
        </View>

        {/* Store Analytics Placeholder Section */}
        <View className="mb-8 px-6">
          <SectionHeader title={translate("superAdmin.dashboard.analytics.store.title")} onAction={() => { }} />
          <View className="bg-white dark:bg-darkBackgroundMuted rounded-2xl p-8 border border-slate-100 dark:border-darkBorder items-center justify-center min-h-[220px]">
            <BarChart3 size={48} color="#FF6600" />
            <Text className="text-lg font-[Poppins-Bold] text-[#0F172A] dark:text-darkTextPrimary mt-3">
              {translate("superAdmin.dashboard.analytics.store.insights")}
            </Text>
            <Text className="text-sm font-[Poppins-Regular] text-[#94A3B8] dark:text-darkTextSecondary text-center mt-2 px-6">
              {translate("superAdmin.dashboard.analytics.store.desc")}
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
