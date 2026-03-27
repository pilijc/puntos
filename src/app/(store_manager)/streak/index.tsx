import React, { useCallback } from "react";
import { ScrollView, useColorScheme } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import { Button } from "@/components/button";
import { Modal } from "@/components/modal";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getAllStreaksByStoreId,
  endStreakProgram,
  publishStreakProgram,
  activateStreakProgram,
} from "@/services/store-manager/streak-service";
import {
  Streak,
  StreakTabs,
} from "@/type/store-manager/streak";
import { ChevronLeft, Flame } from "lucide-react-native";
import { StreakCard } from "@/components/store_manager/streak/streak-card";
import { StreakCardSkeleton } from "@/components/skeleton/store_manager/streak-skeleton";
import { useStreakViewStore } from "@/store/store-manager/streak-store";

export default function ViewStreak() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const {
    activeTab,
    streaks,
    loading,
    acting,
    modal,
    setActiveTab,
    setStreaks,
    setLoading,
    setActing,
    setModal,
  } = useStreakViewStore();

  const load = useCallback(() => {
    if (!storeId) return;
    setLoading(true);
    getAllStreaksByStoreId(storeId)
      .then(setStreaks)
      .catch(() => setStreaks([]))
      .finally(() => setLoading(false));
  }, [storeId, setLoading, setStreaks]);

  useFocusEffect(load);

  const activeStreaks = streaks.filter((s) => s.status === "active");
  const upcomingStreaks = streaks.filter((s) => s.status === "draft" || s.status === "upcoming");
  const endedStreaks = streaks.filter((s) => s.status === "ended");

  const tabStreaks =
    activeTab === "active" ? activeStreaks
    : activeTab === "upcoming" ? upcomingStreaks
    : endedStreaks;

  const showError = (message: string) =>
    setModal({ title: "Error", message, buttons: [{ label: "OK", onPress: () => setModal(null) }] });

  const handlePublish = (streak: Streak) => {
    setModal({
      title: "Publish Streak Program",
      message: "Users will be able to see this program is coming. You can activate it when you're ready.",
      buttons: [
        { label: "Cancel",  variant: "secondary", onPress: () => setModal(null) },
        { label: "Publish", variant: "primary", onPress: () => { setModal(null); doPublish(streak.id!); } },
      ],
    });
  };

  const doPublish = async (programId: number) => {
    setActing({ id: programId, action: "publish" });
    try {
      await publishStreakProgram(programId);
      load();
    } catch (e) {
      showError((e as Error).message ?? "Failed to publish program.");
    } finally {
      setActing(null);
    }
  };

  const handleActivate = (streak: Streak) => {
    setModal({
      title: "Activate Streak Program",
      message: "Users will be able to start earning streak points immediately.",
      buttons: [
        { label: "Cancel",   variant: "secondary", onPress: () => setModal(null) },
        { label: "Activate", variant: "primary", onPress: () => { setModal(null); doActivate(streak.id!); } },
      ],
    });
  };

  const doActivate = async (programId: number) => {
    setActing({ id: programId, action: "activate" });
    try {
      await activateStreakProgram(programId);
      load();
    } catch (e) {
      showError((e as Error).message ?? "Failed to activate program.");
    } finally {
      setActing(null);
    }
  };

  const handleEnd = (streak: Streak) => {
    setModal({
      title: "End Streak Program",
      message: "This will immediately stop earning for all users. This action cannot be undone.",
      buttons: [
        { label: "End Program", variant: "danger",   onPress: () => { setModal(null); doEnd(streak.id!); } },
        { label: "Cancel",      variant: "secondary", onPress: () => setModal(null) },
      ],
    });
  };

  const doEnd = async (programId: number) => {
    setActing({ id: programId, action: "end" });
    try {
      await endStreakProgram(programId);
      load();
    } catch (e) {
      showError((e as Error).message ?? "Failed to end program.");
    } finally {
      setActing(null);
    }
  };

  return (
    <View className="flex-1 bg-backgroundMuted dark:bg-[#111921]">
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
      />

      <View
        className="bg-background dark:bg-[#111921] border-b border-slate-200 dark:border-slate-800 flex-row items-center px-2"
        style={{ paddingTop: insets.top + 8, paddingBottom: 0 }}
      >
        <TouchableOpacity
          className="w-10 h-10 rounded-full items-center justify-center mb-3"
          activeOpacity={0.7}
          onPress={() => router.push({ pathname: "/(store_manager)/view-store/[id]", params: { id: storeId } })}
        >
          <ChevronLeft size={22} color={isDark ? "#F1F5F9" : "#0F172A"} />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-[17px] font-poppins-bold text-slate-900 dark:text-slate-100 pr-10 mb-3">
          Streak Programs
        </Text>
      </View>

      <View className="bg-white dark:bg-neutral-800 border-b border-slate-100 dark:border-slate-800 flex-row px-6">
        {StreakTabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const count =
            tab.key === "active" ? activeStreaks.length
            : tab.key === "upcoming" ? upcomingStreaks.length
            : endedStreaks.length;
          return (
            <TouchableOpacity
              key={tab.key}
              className="flex-1 py-3 items-center flex-row justify-center gap-1.5"
              style={{ borderBottomWidth: 2, borderBottomColor: isActive ? "#FF6600" : "transparent" }}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text className={isActive ? "text-xs font-poppins-bold text-primary" : "text-xs font-poppins-medium text-slate-400 dark:text-slate-500"}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View className={`rounded-full px-1.5 min-w-[18px] items-center ${isActive ? "bg-primary/10" : "bg-neutral-100 dark:bg-neutral-700"}`}>
                  <Text className={`text-[9px] font-poppins-bold ${isActive ? "text-primary" : "text-neutral-500 dark:text-neutral-400"}`}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View className="flex-1 p-4">
          <StreakCardSkeleton />
        </View>
      ) : tabStreaks.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8 gap-y-2">
          <View className="w-20 h-20 rounded-2xl items-center justify-center">
            <Flame size={36} color="gray" />
          </View>
          <View className="items-center gap-y-1 -mt-4">
            <Text className="text-sm font-poppins-semibold text-textMuted">
              {activeTab === "active"
                ? "No Active Program"
                : activeTab === "upcoming"
                ? "No Upcoming Programs"
                : "No Past Programs"}
            </Text>
            <Text className="text-sm font-poppins text-textMuted text-center">
              {activeTab === "active"
                ? "Activate a streak program to start rewarding daily visitors."
                : activeTab === "upcoming"
                ? "Create and publish a program so users can see it's coming."
                : "Ended streak programs will appear here."}
            </Text>
          </View>
          {activeTab !== "ended" && (
            <Button
              label="Create Program"
              onPress={() => router.push({ pathname: "/(store_manager)/streak/configure-streaks", params: { storeId } })}
              variant="primary"
            />
          )}
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }}>
          {tabStreaks.map((streak) => (
            <StreakCard
              key={streak.id}
              streak={streak}
              isDark={isDark}
              onPublish={streak.status === "draft" ? () => handlePublish(streak) : undefined}
              onActivate={streak.status === "upcoming" ? () => handleActivate(streak) : undefined}
              onEnd={(streak.status === "upcoming" || streak.status === "active") ? () => handleEnd(streak) : undefined}
              isPublishing={acting?.id === streak.id && acting?.action === "publish"}
              isActivating={acting?.id === streak.id && acting?.action === "activate"}
              isEnding={acting?.id === streak.id && acting?.action === "end"}
            />
          ))}

          {activeTab !== "ended" && (
            <Button
              label="Create New Program"
              onPress={() => router.push({ pathname: "/(store_manager)/streak/configure-streaks", params: { storeId } })}
              variant="ghost"
              icon="add-circle-outline"
            />
          )}
        </ScrollView>
      )}
    </View>
  );
}
