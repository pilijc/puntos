import React, { useCallback } from "react";
import { FlatList, useColorScheme, Platform } from "react-native";
import { View, Text, TouchableOpacity, SafeAreaView } from "@/tw";
import { Modal } from "@/components/modal";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getAllStreaksByStoreId, endStreakProgram, publishStreakProgram, activateStreakProgram, deleteStreakProgram } from "@/services/store-manager/streak-service";
import { Streak, StreakTabs } from "@/type/store-manager/streak";
import { Flame, Plus } from "lucide-react-native";
import { StreakCard } from "@/components/store_manager/streak/streak-card";
import { StreakCardSkeleton } from "@/components/skeleton/store_manager/streak-skeleton";
import { useStreakViewStore } from "@/store/store-manager/streak-store";
import { AppHeader } from "@/components/header";
import { useTranslation } from "react-i18next";

const WEB_MAX_WIDTH = 896;
const WEB_TAB_PILL_STYLE = { flexGrow: 1, flexBasis: 120, minWidth: 0 };

export default function ViewStreak() {
  const { t } = useTranslation();
  const PAGE_SIZE = 6;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const {
    activeTab,
    streaks,
    loading,
    upcomingVisible,
    endedVisible,
    acting,
    modal,
    setActiveTab,
    setStreaks,
    setLoading,
    setUpcomingVisible,
    setEndedVisible,
    setActing,
    setModal,
  } = useStreakViewStore();

  const load = useCallback(() => {
    if (!storeId) return;
    setLoading(true);
    getAllStreaksByStoreId(storeId)
      .then((rows) => {
        setStreaks(rows);
        setUpcomingVisible(PAGE_SIZE);
        setEndedVisible(PAGE_SIZE);
      })
      .catch(() => setStreaks([]))
      .finally(() => setLoading(false));
  }, [storeId, setLoading, setStreaks, setUpcomingVisible, setEndedVisible]);

  useFocusEffect(load);

  const activeStreaks = streaks.filter((s) => s.status === "active");
  const upcomingStreaks = streaks.filter((s) => s.status === "draft" || s.status === "upcoming");
  const endedStreaks = streaks.filter((s) => s.status === "ended");
  const visibleUpcomingStreaks = upcomingStreaks.slice(0, upcomingVisible);
  const visibleEndedStreaks = endedStreaks.slice(0, endedVisible);
  const hasMoreUpcoming = visibleUpcomingStreaks.length < upcomingStreaks.length;
  const hasMoreEnded = visibleEndedStreaks.length < endedStreaks.length;

  const tabStreaks =
    activeTab === "active" ? activeStreaks
    : activeTab === "upcoming" ? visibleUpcomingStreaks
    : visibleEndedStreaks;

  const showError = (message: string) =>
    setModal({ title: t("store_manager.streak.error"), message, buttons: [{ label: t("label.ok"), onPress: () => setModal(null) }] });

  const handlePublish = (streak: Streak) => {
    const hasOtherUpcoming = streaks.some(
      (s) => s.status === "upcoming" && s.id !== streak.id,
    );
    if (hasOtherUpcoming) {
      setModal({
        title: t("store_manager.streak.upcomingExistsTitle"),
        message: t("store_manager.streak.upcomingExistsMessage"),
        buttons: [{ label: t("label.ok"), onPress: () => setModal(null) }],
      });
      return;
    }

    setModal({
      title: t("store_manager.streak.publishTitle"),
      message: t("store_manager.streak.publishMessage"),
      buttons: [
        { label: t("label.cancel"),  variant: "secondary", onPress: () => setModal(null) },
        { label: t("store_manager.streak.publish"), variant: "primary", onPress: () => { setModal(null); doPublish(streak.id!); } },
      ],
    });
  };

  const handleEdit = (streak: Streak) => {
    router.push({
      pathname: "/(store_manager)/streak/configure-streaks",
      params: { storeId, streakId: String(streak.id) },
    });
  };

  const doPublish = async (programId: number) => {
    setActing({ id: programId, action: "publish" });
    try {
      await publishStreakProgram(programId);
      load();
    } catch (e) {
      showError((e as Error).message ?? t("store_manager.streak.publishFailed"));
    } finally {
      setActing(null);
    }
  };

  const handleActivate = (streak: Streak) => {
    setModal({
      title: t("store_manager.streak.activateTitle"),
      message: t("store_manager.streak.activateMessage"),
      buttons: [
        { label: t("label.cancel"),   variant: "secondary", onPress: () => setModal(null) },
        { label: t("store_manager.streak.activate"), variant: "primary", onPress: () => { setModal(null); doActivate(streak.id!); } },
      ],
    });
  };

  const doActivate = async (programId: number) => {
    setActing({ id: programId, action: "activate" });
    try {
      await activateStreakProgram(programId);
      load();
    } catch (e) {
      showError((e as Error).message ?? t("store_manager.streak.activateFailed"));
    } finally {
      setActing(null);
    }
  };

  const handleEnd = (streak: Streak) => {
    setModal({
      title: t("store_manager.streak.endTitle"),
      message: t("store_manager.streak.endMessage"),
      buttons: [
        { label: t("label.cancel"),      variant: "secondary", onPress: () => setModal(null) },
        { label: t("store_manager.streak.endProgram"), variant: "danger",   onPress: () => { setModal(null); doEnd(streak.id!); } },
      ],
    });
  };

  const handleDelete = (streak: Streak) => {
    setModal({
      title: t("store_manager.streak.deleteTitle"),
      message: t("store_manager.streak.deleteMessage"),
      buttons: [
        { label: t("label.cancel"), variant: "secondary", onPress: () => setModal(null) },
				{ label: t("store_manager.streak.deleteProgram"), variant: "danger", onPress: () => { setModal(null); doDelete(streak.id!); } },
      ],
    });
  };

  const doEnd = async (programId: number) => {
    setActing({ id: programId, action: "end" });
    try {
      await endStreakProgram(programId);
      load();
    } catch (e) {
      showError((e as Error).message ?? t("store_manager.streak.endFailed"));
    } finally {
      setActing(null);
    }
  };

  const doDelete = async (programId: number) => {
    setActing({ id: programId, action: "delete" });
    try {
      await deleteStreakProgram(programId);
      load();
    } catch (e) {
      showError((e as Error).message ?? t("store_manager.streak.deleteFailed"));
    } finally {
      setActing(null);
    }
  };

  const handleLoadMore = () => {
    if (activeTab === "upcoming" && hasMoreUpcoming) {
      setUpcomingVisible(Math.min(upcomingVisible + PAGE_SIZE, upcomingStreaks.length));
      return;
    }
    if (activeTab === "ended" && hasMoreEnded) {
      setEndedVisible(Math.min(endedVisible + PAGE_SIZE, endedStreaks.length));
    }
  };

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
        title={t("store_manager.streak.title")}
        description={t("store_manager.streak.description")}
        onBackPress={() => {
          router.push(`/(store_manager)/view-store/${storeId}`);
        }}
      />

      {Platform.OS === "web" ? (
        <View className="bg-backgroundMuted dark:bg-slate-950 px-4 pt-4 items-center">
          <View className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden flex-row flex-wrap p-1 gap-1">
            {StreakTabs.map((tab) => {
              const active = activeTab === tab.key;
              const count =
                tab.key === "active" ? activeStreaks.length : tab.key === "upcoming" ? upcomingStreaks.length : endedStreaks.length;

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
                    {t(`store_manager.streak.tabs.${tab.key}`)}
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
      ) : (
        <View className="border-b border-slate-100 dark:border-slate-800 px-4 py-3">
          <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden flex-row p-1">
            {StreakTabs.map((tab) => {
              const active = activeTab === tab.key;
              const count =
                tab.key === "active" ? activeStreaks.length : tab.key === "upcoming" ? upcomingStreaks.length : endedStreaks.length;

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
                    {tab.label}
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
        <View
          className="flex-1 pt-2"
          style={Platform.OS === "web" ? { width: "100%", maxWidth: WEB_MAX_WIDTH, alignSelf: "center" } : undefined}
        >
          <StreakCardSkeleton />
        </View>
      ) : tabStreaks.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8 gap-y-2">
          <View className="w-20 h-20 rounded-xl items-center justify-center">
            <Flame size={36} color="gray" />
          </View>
          <View className="items-center gap-y-1 -mt-4">
            <Text className="text-sm font-poppins-semibold text-textMuted">
              {activeTab === "active"
                ? t("store_manager.streak.emptyActiveTitle")
                : activeTab === "upcoming"
                ? t("store_manager.streak.emptyUpcomingTitle")
                : t("store_manager.streak.emptyEndedTitle")}
            </Text>
            <Text className="text-sm font-poppins text-textMuted text-center">
              {activeTab === "active"
                ? t("store_manager.streak.emptyActiveBody")
                : activeTab === "upcoming"
                ? t("store_manager.streak.emptyUpcomingBody")
                : t("store_manager.streak.emptyEndedBody")}
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={tabStreaks}
          keyExtractor={(item, index) => `${item.id ?? index}`}
          contentContainerStyle={{
            padding: 16,
            gap: 12,
            ...(Platform.OS === "web" ? { width: "100%", maxWidth: WEB_MAX_WIDTH, alignSelf: "center" } : null),
          }}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.35}
          renderItem={({ item: streak }) => (
            <StreakCard
              streak={streak}
              isDark={isDark}
              onEdit={streak.status === "draft" ? () => handleEdit(streak) : undefined}
              onPublish={streak.status === "draft" ? () => handlePublish(streak) : undefined}
              onActivate={streak.status === "upcoming" ? () => handleActivate(streak) : undefined}
              onEnd={streak.status === "active" ? () => handleEnd(streak) : undefined}
              onDelete={(streak.status === "draft" || streak.status === "upcoming") ? () => handleDelete(streak) : undefined}
              isPublishing={acting?.id === streak.id && acting?.action === "publish"}
              isActivating={acting?.id === streak.id && acting?.action === "activate"}
              isEnding={acting?.id === streak.id && acting?.action === "end"}
              isDeleting={acting?.id === streak.id && acting?.action === "delete"}
            />
          )}
        />
      )}

      {activeTab !== "ended" && (
        Platform.OS === "web" ? (
          <View
            pointerEvents="box-none"
            style={{ position: "absolute", left: 0, right: 0, bottom: 60, alignItems: "center" }}
          >
            <View style={{ width: "100%", maxWidth: WEB_MAX_WIDTH, paddingHorizontal: 16, alignItems: "flex-end" }}>
              <TouchableOpacity
                className="w-14 h-14 rounded-full bg-primary items-center justify-center"
                activeOpacity={0.85}
                onPress={() => {
                  router.push({ pathname: "/(store_manager)/streak/configure-streaks", params: { storeId } });
                }}
              >
                <Plus size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center"
            activeOpacity={0.85}
            onPress={() => {
              router.push({ pathname: "/(store_manager)/streak/configure-streaks", params: { storeId } });
            }}
          >
            <Plus size={28} color="#fff" />
          </TouchableOpacity>
        )
      )}
    </SafeAreaView>
  );
}
