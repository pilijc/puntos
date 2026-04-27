import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, useColorScheme, Platform } from "react-native";
import { View, Text, TouchableOpacity, SafeAreaView } from "@/tw";
import { Modal } from "@/components/modal";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import {
  getAllStampsByStoreId,
  getCollectorsByProgramId,
  getCollectorsCountByProgramId,
  endStampProgram,
  activateStampProgram,
  deleteStampProgram,
} from "@/services/store-manager/stamp-service";
import { Tabs, CollectorSlice, emptyCollectorSlice } from "@/type/store-manager/stamp";
import { Button } from "@/components/button";
import { Plus, Stamp as StampIcon } from "lucide-react-native";
import { AppHeader } from "@/components/header";
import { useStampViewStore } from "@/store/store-manager/stamp-store";
import { getRewardsByStoreId } from "@/services/store-manager/reward-service";
import { StampCard } from "@/components/store_manager/stamp/stamp-card";
import { useTranslation } from "react-i18next";

const WEB_MAX_WIDTH = 896;

export default function ViewStamp() {
  const { t } = useTranslation();
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

  const load = useCallback(() => {
    if (!storeId) return;
    setLoading(true);
    Promise.all([getAllStampsByStoreId(storeId), getRewardsByStoreId(storeId)])
      .then(([stampsData, rewardsData]) => {
        setStamps(stampsData);
        setRewards(rewardsData);
      })
      .catch(() => {
        setStamps([]);
        setRewards([]);
      })
      .finally(() => setLoading(false));
  }, [storeId, setLoading, setStamps, setRewards]);

  useFocusEffect(load);

  const doEnd = async (programId: number, graceDays: number) => {
    setEndingId(programId);
    try {
      await endStampProgram(programId, graceDays);
      load();
    } catch (e) {
      setModal({
        title: t("label.error"),
        message: (e as Error).message ?? t("store_manager.stamp.endFailed"),
        buttons: [{ label: t("label.ok"), variant: "secondary", onPress: () => setModal(null) }],
      });
    } finally {
      setEndingId(null);
    }
  };
  
  const doDelete = async (programId: number) => {
    try {
      await deleteStampProgram(programId);
      load();
    } catch (e) {
      setModal({
        title: t("label.error"),
        message: (e as Error).message ?? t("store_manager.stamp.deleteFailed"),
        buttons: [{ label: t("label.ok"), variant: "secondary", onPress: () => setModal(null) }],
      });
    }
  };

  const doActivate = async (programId: number) => {
    try {
      await activateStampProgram(programId);
      load();
    } catch (e) {
      setModal({
        title: t("label.error"),
        message: (e as Error).message ?? t("store_manager.stamp.activateFailed"),
        buttons: [{ label: t("label.ok"), variant: "secondary", onPress: () => setModal(null) }],
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
        title={t("store_manager.stamp.title")}
        description={t("store_manager.stamp.description")}
        onBackPress={() => {
          router.push(`/(store_manager)/view-store/${storeId}`);
        }}
      />

      {Platform.OS === "web" ? (
        <View className="bg-backgroundMuted dark:bg-slate-950 pt-4 items-center">
          <View style={{ width: "100%", maxWidth: WEB_MAX_WIDTH, paddingHorizontal: 16 }}>
            <View className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden flex-row">
            {Tabs.map((tab) => {
              const active = activeTab === tab.key;
              const count =
                tab.key === "draft" ? draftStamps.length : tab.key === "active" ? activeStamps.length : endedStamps.length;

              return (
                <TouchableOpacity
                  key={tab.key}
                  className={[
                    "flex-1 py-3 items-center flex-row justify-center gap-1.5 rounded-xl mx-1 my-1",
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
                        ? "text-xs font-poppins-bold text-white"
                        : "text-xs font-poppins-medium text-slate-400 dark:text-slate-500"
                    }
                  >
                    {t(`store_manager.stamp.tabs.${tab.key}`)}
                  </Text>
                  {count > 0 && (
                    <View className="rounded-full min-w-[18px] items-center bg-white/20">
                      <Text className="text-[10px] font-poppins-semibold text-white">{count}</Text>
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
                    {t(`store_manager.stamp.tabs.${tab.key}`)}
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
        <View className="flex-1 items-center justify-center px-8 gap-y-4 bg-slate-50 dark:bg-slate-900">
          <View className="items-center gap-y-1">
            <View className="mb-2">
              <StampIcon size={36} color="#a3a3a3" />
            </View>
            <Text className="text-sm font-poppins-bold text-slate-500 dark:text-slate-300">
              {activeTab === "draft"
                ? t("store_manager.stamp.emptyDraftTitle")
                : activeTab === "active"
                  ? t("store_manager.stamp.emptyActiveTitle")
                  : t("store_manager.stamp.emptyEndedTitle")}
            </Text>
            <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 text-center">
              {activeTab === "active"
                ? t("store_manager.stamp.emptyActiveBody")
                : activeTab === "draft"
                  ? t("store_manager.stamp.emptyDraftBody")
                  : t("store_manager.stamp.emptyEndedBody")}
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 16,
            gap: 12,
            ...(Platform.OS === "web" ? { width: "100%", maxWidth: WEB_MAX_WIDTH, alignSelf: "center" } : null),
          }}
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

          {activeTab === "active" && activeStamps.length === 0 && (
            <Button
              label={t("store_manager.stamp.createProgram")}
              onPress={() => router.push({ pathname: "/(store_manager)/stamp/configure-stamp", params: { storeId } })}
              variant="primary"
              fullWidth
            />
          )}
        </ScrollView>
      )}

      {activeTab === "draft" && (
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
