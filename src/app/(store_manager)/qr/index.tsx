import React, { useCallback, useRef } from "react";
import { RefreshControl, useColorScheme, ActivityIndicator, Platform } from "react-native";
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from "@/tw";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { getQRConfig, toggleQREnabled } from "@/services/store-manager/qr-service";
import { Modal } from "@/components/modal";
import { Button } from "@/components/button";
import { Toggle } from "@/components/toggle";
import { QrCode, RefreshCcw } from "lucide-react-native";
import { formatDate } from "@/utils/store_manager/streak-utils";
import { useQRStore } from "@/store/store-manager/qr-store";
import { QRSkeleton } from "@/components/skeleton/store_manager/qr-skeleton";
import { AppHeader } from "@/components/header";
import { useTranslation } from "react-i18next";

const WEB_MAX_WIDTH = 896;

export default function QRIndex() {
  const { t } = useTranslation();
  const router = useRouter();
  const { storeId } = useLocalSearchParams<{ storeId?: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const lastUpdatedRef = useRef<string | null>(null);
  const storeIdForFetch = storeId && storeId !== "undefined" ? storeId : undefined;
  const lastStoreIdRef = useRef<string | undefined>(undefined);
  const hasLoadedOnceRef = useRef(false);
  const isFetchingRef = useRef(false);
  const {
    config,
    loading,
    refreshing,
    toggling,
    modal,
    setConfig,
    setLoading,
    setRefreshing,
    setToggling,
    setModal,
  } = useQRStore();

  const loadConfig = useCallback(
    async (isRefresh = false) => {
      if (!storeIdForFetch || isFetchingRef.current) return;
  
      const isNewStore = storeIdForFetch !== lastStoreIdRef.current;
      if (isNewStore) {
        lastStoreIdRef.current = storeIdForFetch;
        lastUpdatedRef.current = null;
        hasLoadedOnceRef.current = false;
        setConfig(null);
      }
  
      if (!hasLoadedOnceRef.current && !isRefresh) setLoading(true);
      if (isRefresh) setRefreshing(true);
      isFetchingRef.current = true;
  
      try {
        const data = await getQRConfig(storeIdForFetch);
        if (lastUpdatedRef.current !== data?.updated_at) {
          lastUpdatedRef.current = data?.updated_at ?? null;
          setConfig(data ?? null);
        }
      } catch {
        lastUpdatedRef.current = null;
        setConfig(null);
      } finally {
        hasLoadedOnceRef.current = true;
        isFetchingRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [storeIdForFetch]
  );
  
  useFocusEffect(
    useCallback(() => {
      loadConfig();
    }, [loadConfig])
  );
  
  const handleRefresh = () => loadConfig(true);

  const handleToggleEnabled = async () => {
    if (!config || toggling || !storeIdForFetch) return;
    setToggling(true);
    try {
      const next = !config.qr_enabled;
      await toggleQREnabled(storeIdForFetch, next);
      setConfig({ ...config, qr_enabled: next });
    } catch {
      setModal({
        title: t("label.error"),
        message: t("store_manager.qr.toggleError"),
        buttons: [{ label: t("label.ok"), onPress: () => setModal(null), variant: "secondary" }],
      });
    } finally {
      setToggling(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-backgroundMuted dark:bg-neutral-900">
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
      />
      <AppHeader
        title={t("store_manager.qr.title")}
        description={t("store_manager.qr.description")}
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
              <View className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 px-4 py-14 items-center gap-y-2 mx-4">
                <View className="w-14 h-14 rounded-2xl items-center justify-center">
                  <QrCode size={28} color="gray" />
                </View>
                <Text className="text-sm font-poppins-semibold text-slate-500 dark:text-slate-400">{t("store_manager.qr.notConfiguredTitle")}</Text>
                <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 text-center px-6 mb-2">
                  {t("store_manager.qr.notConfiguredBody")}
                </Text>
                <Button
                  label={t("store_manager.qr.configureNow")}
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
                <View className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 px-4 py-3.5 flex-row items-center gap-x-3">
                  <View
                    className={`w-10 h-10 rounded-xl items-center justify-center ${
                      config.qr_enabled ? "bg-green-50 dark:bg-green-950" : "bg-slate-100 dark:bg-neutral-700"
                    }`}
                  >
                    <QrCode size={20} color={config.qr_enabled ? "#22C55E" : "#94A3B8"} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-poppins-bold text-slate-800 dark:text-slate-100">
                      {config.qr_enabled ? t("store_manager.qr.enabled") : t("store_manager.qr.disabled")}
                    </Text>
                    <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
                      {config.qr_enabled ? t("store_manager.qr.enabledSubtitle") : t("store_manager.qr.disabledSubtitle")}
                    </Text>
                  </View>
                  {toggling ? (
                    <ActivityIndicator size="small" color="#FF6600" />
                  ) : (
                    <Toggle value={config.qr_enabled} onValueChange={handleToggleEnabled} size="xs" />
                  )}
                </View>

                <View className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 overflow-hidden">
                  <View className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-neutral-700">
                    <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">{t("store_manager.qr.earningsType")}</Text>
                    <Text className="text-sm font-poppins-bold text-textPrimary dark:text-darkTextPrimary mt-0.5">
                      {config.earning_type === "percentage" ? t("store_manager.qr.percentage") : t("label.fixed")}
                    </Text>
                  </View>

                  <View className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-neutral-700">
                    <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">{t("store_manager.qr.howCustomersEarn")}</Text>
                    <Text className="text-sm font-poppins-bold text-textPrimary dark:text-darkTextPrimary mt-0.5">
                      {config.earning_type === "percentage"
                        ? t("store_manager.qr.earnPercentageLine", { pct: config.percentage ?? 0, base: config.base_amount ?? 0 })
                        : t("store_manager.qr.earnFixedLine", { pts: config.fixed_points ?? 0 })}
                    </Text>
                  </View>

                  {config.earning_type === "percentage" ? (
                    <View className="flex-row">
                      <View className="flex-1 px-4 py-3 border-r border-slate-100 dark:border-neutral-700">
                        <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">{t("store_manager.qr.rate")}</Text>
                        <Text className="text-base font-poppins-bold text-textPrimary dark:text-darkTextPrimary mt-0.5">
                          {config.percentage ?? 0}%
                        </Text>
                      </View>
                      <View className="flex-1 px-4 py-3">
                        <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">{t("store_manager.qr.per")}</Text>
                        <Text className="text-base font-poppins-bold text-textPrimary dark:text-darkTextPrimary mt-0.5">
                          ₱{config.base_amount ?? 0}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View className="flex-row">
                      <View className="flex-1 px-4 py-3 border-r border-slate-100 dark:border-neutral-700">
                        <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">{t("label.points")}</Text>
                        <Text className="text-base font-poppins-bold text-textPrimary dark:text-darkTextPrimary mt-0.5">
                          {t("store_manager.reward.pts", { points: config.fixed_points ?? 0 })}
                        </Text>
                      </View>
                      <View className="flex-1 px-4 py-3">
                        <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">{t("store_manager.qr.minSpend")}</Text>
                        <Text className="text-base font-poppins-bold text-textPrimary dark:text-darkTextPrimary mt-0.5">
                          {config.minimum_spend != null && config.minimum_spend > 0 ? `₱${config.minimum_spend}` : t("store_manager.qr.none")}
                        </Text>
                      </View>
                    </View>
                  )}

                  <View className="border-t border-slate-100 dark:border-neutral-700 px-4 py-3 flex-row items-center justify-between">
                    <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">{t("store_manager.qr.maxPointsPerTxn")}</Text>
                    <Text className="text-sm font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                      {config.max_points_per_txn != null ? t("store_manager.qr.ptsUnit", { n: config.max_points_per_txn }) : t("store_manager.qr.noCap")}
                    </Text>
                  </View>

                  {config.updated_at && (
                    <View className="border-t border-slate-100 dark:border-neutral-700 px-4 py-2.5 flex-row items-center gap-x-1.5">
                      <RefreshCcw size={12} color="#94A3B8" />
                      <Text className="text-[10px] font-poppins text-slate-400 dark:text-slate-500">
                        {t("store_manager.qr.lastUpdated", { date: formatDate(config.updated_at) })}
                      </Text>
                    </View>
                  )}

                  <View className="border-t border-slate-100 dark:border-neutral-700 px-4 py-3">
                    <Button
                      label={t("label.edit")}
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
