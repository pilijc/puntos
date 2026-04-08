import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, useColorScheme } from "react-native";
import { View, Text, TouchableOpacity, SafeAreaView } from "@/tw";
import { Modal } from "@/components/modal";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

export default function ViewStamp() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
        title: "Error",
        message: (e as Error).message ?? "Failed to end program.",
        buttons: [{ label: "OK", variant: "secondary", onPress: () => setModal(null) }],
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
        title: "Error",
        message: (e as Error).message ?? "Failed to delete program.",
        buttons: [{ label: "OK", variant: "secondary", onPress: () => setModal(null) }],
      });
    }
  };

  const doActivate = async (programId: number) => {
    try {
      await activateStampProgram(programId);
      load();
    } catch (e) {
      setModal({
        title: "Error",
        message: (e as Error).message ?? "Failed to activate program.",
        buttons: [{ label: "OK", variant: "secondary", onPress: () => setModal(null) }],
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
        title="Stamp Program"
        paddingTop={insets.top + 8}
        onBackPress={() => router.push({ pathname: "/(store_manager)/view-store/[id]", params: { id: storeId } })}
      />

      <View className="bg-white dark:bg-neutral-800 border-b border-slate-100 dark:border-slate-800 flex-row px-6">
        {Tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const count =
            tab.key === "draft" ? draftStamps.length : tab.key === "active" ? activeStamps.length : endedStamps.length;
          return (
            <TouchableOpacity
              key={tab.key}
              className="flex-1 py-3 items-center flex-row justify-center gap-1.5"
              style={{ borderBottomWidth: 2, borderBottomColor: isActive ? "#FF6600" : "transparent" }}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text
                className={
                  isActive
                    ? "text-xs font-poppins-bold text-primary"
                    : "text-xs font-poppins-medium text-slate-400 dark:text-slate-500"
                }
              >
                {tab.label}
              </Text>
              {count > 0 && (
                <View
                  className="rounded-full px-1.5 min-w-[18px] items-center bg-white"
                >
                  <Text
                    className={`text-[9px] font-poppins-bold ${isActive ? "text-primary" : "text-neutral-500 dark:text-neutral-400"}`}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

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
                ? "No Draft Stamp Program"
                : activeTab === "active"
                  ? "No Active Program"
                  : "No Ended Programs"}
            </Text>
            <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 text-center">
              {activeTab === "active"
                ? "Launch a stamp program to start rewarding your customers."
                : activeTab === "draft"
                  ? "Draft stamp programs will appear here."
                  : "Ended stamp programs will appear here."}
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }}>
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
              label="Create New Program"
              onPress={() => router.push({ pathname: "/(store_manager)/stamp/configure-stamp", params: { storeId } })}
              variant="primary"
              fullWidth
            />
          )}
        </ScrollView>
      )}

      {activeTab === "draft" && (
        <TouchableOpacity
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center"
          activeOpacity={0.85}
          onPress={() => router.push({ pathname: "/(store_manager)/stamp/configure-stamp", params: { storeId } })}
        >
          <Plus size={26} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
