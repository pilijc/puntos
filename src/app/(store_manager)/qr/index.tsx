import React, { useCallback, useState } from "react";
import { RefreshControl, ActivityIndicator, Platform } from "react-native";
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from "@/tw";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Modal } from "@/components/modal";
import { Button } from "@/components/button";
import { Toggle } from "@/components/toggle";
import { QrCode, RefreshCcw } from "lucide-react-native";
import { formatDate } from "@/utils/store_manager/streak-utils";
import { QRSkeleton } from "@/components/skeleton/store_manager/qr-skeleton";
import { AppHeader } from "@/components/header";
import { useTranslation } from "react-i18next";
import { useQRConfigQuery, useToggleQREnabledMutation } from "@/hooks/store-manager/rq";

const WEB_MAX_WIDTH = 896;

export default function QRIndex() {
  const { t: translate } = useTranslation();
  const router = useRouter();
  const { storeId } = useLocalSearchParams<{ storeId?: string }>();
  const storeIdForFetch = storeId && storeId !== "undefined" ? storeId : undefined;
  const [modal, setModal] = useState<{
    title: string;
    message: string;
    buttons: { label: string; onPress: () => void; variant: "secondary" }[];
  } | null>(null);
  const [toggling, setToggling] = useState(false);

  const { data, isPending, isRefetching, refetch } = useQRConfigQuery(storeIdForFetch);
  const toggleMutation = useToggleQREnabledMutation();
  const config = data ?? null;
  const loading = isPending;
  const refreshing = isRefetching && !isPending;

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const handleRefresh = () => void refetch();

  const handleToggleEnabled = async () => {
    if (!config || toggling || !storeIdForFetch) return;
    setToggling(true);
    try {
      const next = !config.qr_enabled;
      await toggleMutation.mutateAsync({ storeId: storeIdForFetch, enabled: next });
    } catch {
      setModal({
        title: translate("label.error"),
        message: translate("storeManager.qr.toggleError"),
        buttons: [{ label: translate("label.ok"), onPress: () => setModal(null), variant: "secondary" }],
      });
    } finally {
      setToggling(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-backgroundMuted dark:bg-darkBackgroundMuted">
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
      />
      <AppHeader
        title={translate("storeManager.qr.title")}
        description={translate("storeManager.qr.description")}
        onBackPress={() => {
          router.push(`/(store_manager)/view-store/${storeIdForFetch}`);
        }}
      />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 32,
          paddingTop: 12,
          paddingHorizontal: Platform.OS === "web" ? 16 : 0,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#FF6600"]}
            tintColor="#FF6600"
          />
        }
      >
        <View
          className={Platform.OS === "web" ? "items-center" : ""}
          style={Platform.OS === "web" ? { width: "100%" } : undefined}
        >
          <View
            style={Platform.OS === "web" ? { width: "100%", maxWidth: WEB_MAX_WIDTH } : undefined}
            className={Platform.OS === "web" ? "gap-y-3" : ""}
          >
            {loading ? (
              <QRSkeleton />
            ) : !config ? (
              <View className="bg-white dark:bg-darkBackgroundCard rounded-xl border border-slate-100 dark:border-darkBorder px-4 py-14 items-center gap-y-2 mx-4">
                <View className="w-14 h-14 rounded-xl items-center justify-center">
                  <QrCode size={28} color="gray" />
                </View>
                <Text className="text-sm font-poppins-semibold text-textSecondary dark:text-darkTextSecondary">{translate("storeManager.qr.notConfiguredTitle")}</Text>
                <Text className="text-xs font-poppins text-textSecondary dark:text-darkTextSecondary text-center px-6 mb-2">
                  {translate("storeManager.qr.notConfiguredBody")}
                </Text>
                <Button
                  label={translate("storeManager.qr.configureNow")}
                  onPress={() =>
                    router.push({
                      pathname: "/(store_manager)/qr/configure-qr",
                      params: { storeId: storeIdForFetch },
                    })
                  }
                  variant="primary"
                  icon="Plus"
                />
              </View>
            ) : (
              <View className="gap-y-3 mx-4">
                <View className="bg-white dark:bg-darkBackgroundCard rounded-xl border border-slate-100 dark:border-darkBorder px-4 py-3.5 flex-row items-center gap-x-3">
                  <View
                    className={`w-10 h-10 rounded-xl items-center justify-center ${
                      config.qr_enabled ? "bg-green-50 dark:bg-green-950" : "bg-slate-100 dark:bg-darkBackgroundCard"
                    }`}
                  >
                    <QrCode size={20} color={config.qr_enabled ? "#22C55E" : "#94A3B8"} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-poppins-bold text-slate-800 dark:text-darkTextPrimary">
                      {config.qr_enabled ? translate("storeManager.qr.enabled") : translate("storeManager.qr.disabled")}
                    </Text>
                    <Text className="text-xs font-poppins text-slate-400 dark:text-darkTextSecondary">
                      {config.qr_enabled ? translate("storeManager.qr.enabledSubtitle") : translate("storeManager.qr.disabledSubtitle")}
                    </Text>
                  </View>
                  {toggling ? (
                    <ActivityIndicator size="small" color="#FF6600" />
                  ) : (
                    <Toggle value={config.qr_enabled} onValueChange={handleToggleEnabled} size="xs" />
                  )}
                </View>

                <View className="bg-white dark:bg-darkBackgroundCard rounded-xl border border-slate-100 dark:border-darkBorder overflow-hidden">
                  <View className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-darkBorder">
                    <Text className="text-xs font-poppins text-slate-400 dark:text-darkTextSecondary">{translate("storeManager.qr.earningsType")}</Text>
                    <Text className="text-sm font-poppins-bold text-textPrimary dark:text-darkTextPrimary mt-0.5">
                      {config.earning_type === "percentage" ? translate("storeManager.qr.percentage") : translate("label.fixed")}
                    </Text>
                  </View>

                  <View className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-darkBorder">
                    <Text className="text-xs font-poppins text-slate-400 dark:text-darkTextSecondary">{translate("storeManager.qr.howCustomersEarn")}</Text>
                    <Text className="text-sm font-poppins-bold text-textPrimary dark:text-darkTextPrimary mt-0.5">
                      {config.earning_type === "percentage"
                        ? translate("storeManager.qr.earnPercentageLine", { pct: config.percentage ?? 0, base: config.base_amount ?? 0 })
                        : translate("storeManager.qr.earnFixedLine", { pts: config.fixed_points ?? 0 })}
                    </Text>
                  </View>

                  {config.earning_type === "percentage" ? (
                    <View className="flex-row">
                      <View className="flex-1 px-4 py-3 border-r border-slate-100 dark:border-darkBorder">
                        <Text className="text-xs font-poppins text-slate-400 dark:text-darkTextSecondary">{translate("storeManager.qr.rate")}</Text>
                        <Text className="text-base font-poppins-bold text-textPrimary dark:text-darkTextPrimary mt-0.5">
                          {config.percentage ?? 0}%
                        </Text>
                      </View>
                      <View className="flex-1 px-4 py-3">
                        <Text className="text-xs font-poppins text-slate-400 dark:text-darkTextSecondary">{translate("storeManager.qr.per")}</Text>
                        <Text className="text-base font-poppins-bold text-textPrimary dark:text-darkTextPrimary mt-0.5">
                          PHP {config.base_amount ?? 0}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View className="flex-row">
                      <View className="flex-1 px-4 py-3 border-r border-slate-100 dark:border-darkBorder">
                        <Text className="text-xs font-poppins text-slate-400 dark:text-darkTextSecondary">{translate("label.points")}</Text>
                        <Text className="text-base font-poppins-bold text-textPrimary dark:text-darkTextPrimary mt-0.5">
                          {translate("storeManager.reward.pts", { points: config.fixed_points ?? 0 })}
                        </Text>
                      </View>
                      <View className="flex-1 px-4 py-3">
                        <Text className="text-xs font-poppins text-slate-400 dark:text-darkTextSecondary">{translate("storeManager.qr.minSpend")}</Text>
                        <Text className="text-base font-poppins-bold text-textPrimary dark:text-darkTextPrimary mt-0.5">
                          {config.minimum_spend != null && config.minimum_spend > 0 ? `PHP ${config.minimum_spend}` : translate("store_manager.qr.none")}
                        </Text>
                      </View>
                    </View>
                  )}

                  <View className="border-t border-slate-100 dark:border-darkBorder px-4 py-3 flex-row items-center justify-between">
                    <Text className="text-xs font-poppins text-slate-400 dark:text-darkTextSecondary">{translate("storeManager.qr.maxPointsPerTxn")}</Text>
                    <Text className="text-sm font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                      {config.max_points_per_txn != null ? translate("storeManager.qr.ptsUnit", { n: config.max_points_per_txn }) : translate("storeManager.qr.noCap")}
                    </Text>
                  </View>

                  {config.updated_at && (
                    <View className="border-t border-slate-100 dark:border-darkBorder px-4 py-2.5 flex-row items-center gap-x-1.5">
                      <RefreshCcw size={12} color="#94A3B8" />
                      <Text className="text-[10px] font-poppins text-slate-400 dark:text-darkTextSecondary">
                        {translate("storeManager.qr.lastUpdated", { date: formatDate(config.updated_at) })}
                      </Text>
                    </View>
                  )}

                  <View className="border-t border-slate-100 dark:border-darkBorder px-4 py-3">
                    <Button
                      label={translate("label.edit")}
                      onPress={() =>
                        router.push({
                          pathname: "/(store_manager)/qr/configure-qr",
                          params: { storeId: storeIdForFetch },
                        })
                      }
                      variant="primary"
                      fullWidth
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
