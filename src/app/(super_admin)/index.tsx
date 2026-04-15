import React from "react";
import { ScrollView, ActivityIndicator, RefreshControl, Platform } from "react-native";
import { SafeAreaView, Text, View } from "@/tw";
import { useSuperAdminDashboard } from "@/hooks/super-admin/use-super-admin-dashboard";
import { SectionHeader } from "@/components/ui/section-header";
import { UserRow } from "@/components/users/UserRow";
import { StatCard } from "@/components/ui/stat-card";
import { Modal } from "@/components/modal";
import { Users, Store, BarChart3 } from "lucide-react-native";
import { useTranslation } from "react-i18next";

const isWeb = Platform.OS === "web";

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
        {/* ── Web Header (left-aligned, matches "Store Approvals") ── */}
        {isWeb ? (
          <View style={{ paddingTop: 24, paddingBottom: 16, paddingHorizontal: 50 }}>
            <Text style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'Poppins-Regular', marginBottom: 2 }}>
              {translate("superAdmin.dashboard.welcome")}
              <Text style={{ color: '#FF6600', fontFamily: 'Poppins-Bold' }}>
                {adminInfo?.username?.split(" ")[0] || "Admin"}
              </Text>!
            </Text>
            <Text style={{ fontSize: 22, fontFamily: 'Poppins-Bold', color: '#0f172a' }}>
              {translate("superAdmin.dashboard.title")}
            </Text>
          </View>
        ) : (
          <View className="pt-4 pb-3">
            <View className="px-6 pt-4">
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
            <View className="px-2 mt-3">
              <View className="h-[1px] w-full bg-[#E2E8F0] dark:bg-darkBorder" />
            </View>
          </View>
        )}

        {/* ── Stat Cards (centered on web) ── */}
        <View
          style={isWeb ? { maxWidth: 1000, width: '100%', alignSelf: 'center', paddingHorizontal: 24 } : {}}
          className="px-6 mb-6 mt-4"
        >
          <View className="flex-row gap-2">
            <StatCard label={translate("superAdmin.dashboard.metrics.totalUsers")} val={users.length} Icon={Users} />
            <StatCard label={translate("superAdmin.dashboard.metrics.totalStores")} val={stores.length} Icon={Store} />
            <StatCard label={translate("superAdmin.dashboard.metrics.activeStores")} val={activeStoresCount} Icon={Store} />
          </View>
        </View>

        {/* ── User Analytics ── */}
        {/* Label: left-aligned on web */}
        {isWeb ? (
          <View style={{ paddingHorizontal: 50, marginBottom: 8 }}>
            <SectionHeader title={translate("superAdmin.dashboard.analytics.user.title")} onAction={() => { }} />
          </View>
        ) : null}
        {/* Card: centered on web */}
        <View
          style={isWeb ? { maxWidth: 1000, width: '100%', alignSelf: 'center', paddingHorizontal: 24 } : {}}
          className={isWeb ? 'mb-6' : 'mb-6 px-6'}
        >
          {!isWeb && <SectionHeader title={translate("superAdmin.dashboard.analytics.user.title")} onAction={() => { }} />}
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

        {/* ── Store Analytics ── */}
        {/* Label: left-aligned on web */}
        {isWeb ? (
          <View style={{ paddingHorizontal: 50, marginBottom: 8 }}>
            <SectionHeader title={translate("superAdmin.dashboard.analytics.store.title")} onAction={() => { }} />
          </View>
        ) : null}
        {/* Card: centered on web */}
        <View
          style={isWeb ? { maxWidth: 1000, width: '100%', alignSelf: 'center', paddingHorizontal: 24 } : {}}
          className={isWeb ? 'mb-8' : 'mb-8 px-6'}
        >
          {!isWeb && <SectionHeader title={translate("superAdmin.dashboard.analytics.store.title")} onAction={() => { }} />}
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


