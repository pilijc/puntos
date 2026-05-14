import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, useColorScheme, Platform } from "react-native";
import { View, Text, TouchableOpacity, SafeAreaView } from "@/tw";
import { Modal } from "@/components/modal";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import {
  getCollectorsByProgramId,
  getCollectorsCountByProgramId,
  endStampProgram,
  activateStampProgram,
  deleteStampProgram,
} from "@/services/store-manager/stamp-service";
import { Tabs, CollectorSlice, emptyCollectorSlice } from "@/type/store-manager/stamp";
import { Button } from "@/components/button";
import { Plus } from "lucide-react-native";
import { AppHeader } from "@/components/header";
import { useStampViewStore } from "@/store/store-manager/stamp-store";
import { StampCard } from "@/components/store_manager/stamp/stamp-card";
import { useTranslation } from "react-i18next";
import { useStorePremiumCampaignEdit } from "@/hooks/store-manager/use-store-premium-campaign-edit";
import { formatDate } from "@/utils/store_manager/stamp-utils";
import { useStampsByStoreQuery, useRewardsByStoreQuery } from "@/hooks/store-manager/rq";

const WEB_MAX_WIDTH = 896;
const WEB_TAB_PILL_STYLE = { flexGrow: 1, flexBasis: 120, minWidth: 0 };

export default function ViewStamp() {
  const { t: translate } = useTranslation();
  const isWeb = Platform.OS === "web";
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const {
    activeTab,
    stamps,
    rewards,
    loading,
    endingId,
    modal,
    setActiveTab,
    setStamps,
    setRewards,
    setLoading,
    setEndingId,
    setModal,
  } = useStampViewStore();
  const [collectorByProgram, setCollectorByProgram] = useState<Record<number, CollectorSlice>>({});
  const { canEdit, loading: permLoading, expiresAtIso } = useStorePremiumCampaignEdit(storeId);
  const campaignsLocked = !permLoading && !canEdit;

  const stampsQuery = useStampsByStoreQuery(storeId);
  const rewardsQuery = useRewardsByStoreQuery(storeId);

  useEffect(() => {
    if (stampsQuery.data) setStamps(stampsQuery.data);
  }, [stampsQuery.data, setStamps]);

  useEffect(() => {
    if (rewardsQuery.data) setRewards(rewardsQuery.data);
  }, [rewardsQuery.data, setRewards]);

  useEffect(() => {
    setLoading(stampsQuery.isPending || rewardsQuery.isPending);
  }, [stampsQuery.isPending, rewardsQuery.isPending, setLoading]);

  const refetchStampRewards = useCallback(() => {
    void stampsQuery.refetch();
    void rewardsQuery.refetch();
  }, [stampsQuery, rewardsQuery]);

  useFocusEffect(
    useCallback(() => {
      refetchStampRewards();
    }, [refetchStampRewards]),
  );

  const doEnd = async (programId: number, graceDays: number) => {
    setEndingId(programId);
    try {
      await endStampProgram(programId, graceDays);
      refetchStampRewards();
    } catch (e) {
      setModal({
        title: translate("label.error"),
        message: (e as Error).message ?? translate("storeManager.stamp.endFailed"),
        buttons: [{ label: translate("label.ok"), variant: "secondary", onPress: () => setModal(null) }],
      });
    } finally {
      setEndingId(null);
    }
  };
  
  const doDelete = async (programId: number) => {
    try {
      await deleteStampProgram(programId);
      refetchStampRewards();
    } catch (e) {
      setModal({
        title: translate("label.error"),
        message: (e as Error).message ?? translate("storeManager.stamp.deleteFailed"),
        buttons: [{ label: translate("label.ok"), variant: "secondary", onPress: () => setModal(null) }],
      });
    }
  };

  const doActivate = async (programId: number) => {
    try {
      await activateStampProgram(programId);
      refetchStampRewards();
    } catch (e) {
      setModal({
        title: translate("label.error"),
        message: (e as Error).message ?? translate("storeManager.stamp.activateFailed"),
        buttons: [{ label: translate("label.ok"), variant: "secondary", onPress: () => setModal(null) }],
      });
    }
  };

  const activeStamps = stamps.filter((s) => s.status === "active");
  const draftStamps = stamps.filter((s) => s.status === "draft");
  const endedStamps = stamps.filter((s) => s.status === "ended");
  const tabStamps = activeTab === "draft" ? draftStamps : activeTab === "active" ? activeStamps : endedStamps;

  const tabStampIds = tabStamps.map((s) => s.id).filter((id): id is number => id != null).join(",");

  useEffect(() => {
    tabStamps.forEach((stamp) => {
      if (!stamp.id) return;
      getCollectorsCountByProgramId(stamp.id)
        .then((count) =>
          setCollectorByProgram((prev) => ({
            ...prev,
            [stamp.id!]: { ...(prev[stamp.id!] ?? emptyCollectorSlice()), collectorsCount: count },
          }))
        )
        .catch(() => {});
    });
  }, [tabStampIds]);

  const loadCollectorsFirstPage = useCallback((programId: number) => {
    setCollectorByProgram((prev) => ({
      ...prev,
      [programId]: { ...(prev[programId] ?? emptyCollectorSlice()), collectorsLoading: true },
    }));
    getCollectorsByProgramId(programId, 0, 5)
      .then((data) => {
        setCollectorByProgram((prev) => ({
          ...prev,
          [programId]: {
            ...(prev[programId] ?? emptyCollectorSlice()),
            collectors: data,
            collectorsPage: 0,
            collectorsLoading: false,
            hasLoadedCollectorsOnce: true,
          },
        }));
      })
      .catch(() => {
        setCollectorByProgram((prev) => ({
          ...prev,
          [programId]: {
            ...(prev[programId] ?? emptyCollectorSlice()),
            collectorsLoading: false,
            hasLoadedCollectorsOnce: true,
          },
        }));
      });
  }, []);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-backgroundMuted dark:bg-[#111921]">
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
      />

      <AppHeader
        title={translate("storeManager.stamp.title")}
        description={translate("storeManager.stamp.description")}
        onBackPress={() => {
          router.push(`/(store_manager)/view-store/${storeId}`);
        }}
      />

      {campaignsLocked ? (
        <View className={isWeb ? "px-4 pt-3 items-center" : "px-4 pt-3"}>
          <View className={`w-full rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2.5 ${isWeb ? "max-w-4xl" : ""}`}>
            <Text className="text-xs font-poppins text-amber-900 dark:text-amber-200 leading-5">
              {expiresAtIso
                ? translate("storeManager.premiumCampaigns.bannerWithExpiry", { date: formatDate(expiresAtIso) })
                : translate("storeManager.premiumCampaigns.banner")}
            </Text>
          </View>
        </View>
      ) : null}

      {Platform.OS === "web" ? (
        <View className="bg-backgroundMuted dark:bg-slate-950 pt-4 items-center">
          <View style={{ width: "100%", maxWidth: WEB_MAX_WIDTH, paddingHorizontal: 16 }}>
            <View className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden flex-row flex-wrap p-1 gap-1">
            {Tabs.map((tab) => {
                const active = activeTab === tab.key;
                const count =
                  tab.key === "draft" ? draftStamps.length : tab.key === "active" ? activeStamps.length : endedStamps.length;

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={WEB_TAB_PILL_STYLE}
                  className={[
                    "py-3 px-2 items-center flex-row justify-center gap-1.5 rounded-xl",
                    active && "bg-primary",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    className={
                      active
                        ? "min-w-0 text-xs font-poppins-bold text-white"
                        : "min-w-0 text-xs font-poppins-medium text-slate-400 dark:text-slate-500"
                    }
                    numberOfLines={1}
                  >
                    {translate(`storeManager.stamp.tabs.${tab.key}`)}
                  </Text>
                  {count > 0 && (
                    <View className={`rounded-full min-w-[18px] items-center px-1.5 ${active ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800"}`}>
                      <Text className={`text-[10px] font-poppins-semibold ${active ? "text-white" : "text-slate-500 dark:text-slate-400"}`}>{count}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
            </View>
          </View>
        </View>
      ) : (
        <View className="border-b border-slate-100 dark:border-slate-800 px-4 py-3">
          <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden flex-row p-1 px-4">
            {Tabs.map((tab) => {
              const active = activeTab === tab.key;
              const count =
                tab.key === "draft" ? draftStamps.length : tab.key === "active" ? activeStamps.length : endedStamps.length;

              return (
                <TouchableOpacity
                  key={tab.key}
                  className={[
                    "flex-1 py-2 items-center flex-row justify-center gap-1.5 rounded-xl",
                    active ? "bg-primary" : "bg-white dark:bg-slate-900",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    className={
                      active
                        ? "text-xs font-poppins-bold text-white"
                        : "text-xs font-poppins-medium text-slate-400 dark:text-slate-500"
                    }
                  >
                    {translate(`storeManager.stamp.tabs.${tab.key}`)}
                  </Text>
                  {count > 0 && (
                    <View className={`rounded-full min-w-[18px] items-center px-1.5 ${active ? "bg-white/20" : ""}`}>
                      <Text className={`text-[9px] font-poppins-bold ${active ? "text-white" : "text-neutral-500 dark:text-neutral-400"}`}>
                        {count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6600" />
        </View>
      ) : tabStamps.length === 0 ? (
        <View 
          style={[{ flex: 1 }, 
          { padding: 16, gap: 12,
            ...(Platform.OS === "web" ? { width: "100%" as const, maxWidth: WEB_MAX_WIDTH, alignSelf: "center" as const } : null),
          }]}
        >
          <View
            className={`w-full bg-white dark:bg-darkBackground rounded-xl overflow-hidden items-center justify-center ${
              isWeb ? "px-6 py-12 gap-y-3" : "px-5 py-10 gap-y-3"
            }`}
          >
            <Image
              source={require("@/assets/images/found.png")}
              style={{ width: Platform.OS === "web" ? 160 : 120, height: Platform.OS === "web" ? 160 : 120 }}
              contentFit="contain"
            />
            <View className="items-center justify-center gap-y-1">
              <Text className="text-sm font-poppins-semibold text-slate-600 dark:text-slate-300 text-center">
                {activeTab === "draft"
                  ? translate("storeManager.stamp.emptyDraftTitle")
                  : activeTab === "active"
                    ? translate("storeManager.stamp.emptyActiveTitle")
                    : translate("storeManager.stamp.emptyEndedTitle")}
              </Text>
              <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 text-center">
                {activeTab === "active"
                  ? translate("storeManager.stamp.emptyActiveBody")
                  : activeTab === "draft"
                    ? translate("storeManager.stamp.emptyDraftBody")
                    : translate("storeManager.stamp.emptyEndedBody")}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={[{ padding: 16,
            gap: 12,
            ...(Platform.OS === "web" ? { width: "100%" as const, maxWidth: WEB_MAX_WIDTH, alignSelf: "center" as const } : null),
          }]}
        >
          {tabStamps.map((stamp) => {
            const reward = rewards.find((r) => r.id === stamp.reward_id) ?? null;
            const pid = stamp.id!;
            const c = collectorByProgram[pid] ?? emptyCollectorSlice();
            return (
              <StampCard
                key={stamp.id}
                stamp={stamp}
                reward={reward}
                activeTab={activeTab}
                isDark={isDark}
                readonlyCampaigns={campaignsLocked}
                collector={c}
                programId={pid}
                setCollectorByProgram={setCollectorByProgram}
                loadCollectorsFirstPage={loadCollectorsFirstPage}
                setModal={setModal}
                activeProgramCount={activeStamps.length}
                doActivate={doActivate}
                doEnd={doEnd}
                doDelete={doDelete}
                onEditDraft={() =>
                  router.push({
                    pathname: "/(store_manager)/stamp/configure-stamp",
                    params: { storeId, stampId: pid },
                  })
                }
                endingId={endingId}
              />
            );
          })}

          {activeTab === "active" && activeStamps.length === 0 && !campaignsLocked && (
            <Button
              label={translate("storeManager.stamp.createProgram")}
              onPress={() => router.push({ pathname: "/(store_manager)/stamp/configure-stamp", params: { storeId } })}
              variant="primary"
              fullWidth
            />
          )}
        </ScrollView>
      )}

      {activeTab === "draft" && !campaignsLocked && (
        Platform.OS === "web" ? (
          <View
            pointerEvents="box-none"
            style={{ position: "absolute", left: 0, right: 0, bottom: 60, alignItems: "center" }}
          >
            <View style={{ width: "100%", maxWidth: WEB_MAX_WIDTH, paddingHorizontal: 16, alignItems: "flex-end" }}>
              <TouchableOpacity
                className="w-14 h-14 rounded-full bg-primary items-center justify-center"
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: "/(store_manager)/stamp/configure-stamp", params: { storeId } })}
              >
                <Plus size={26} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center"
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: "/(store_manager)/stamp/configure-stamp", params: { storeId } })}
          >
            <Plus size={26} color="#fff" />
          </TouchableOpacity>
        )
      )}
    </SafeAreaView>
  );
}
