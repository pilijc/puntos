import React, { useCallback, useEffect } from "react";
import { FlatList, useColorScheme, Platform } from "react-native";
import { Image } from "expo-image";
import { View, Text, TouchableOpacity, SafeAreaView } from "@/tw";
import { Modal } from "@/components/modal";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { endStreakProgram, publishStreakProgram, activateStreakProgram, deleteStreakProgram } from "@/services/store-manager/streak-service";
import { Streak, StreakTabs } from "@/type/store-manager/streak";
import { Plus } from "lucide-react-native";
import { StreakCard } from "@/components/store_manager/streak/streak-card";
import { StreakCardSkeleton } from "@/components/skeleton/store_manager/streak-skeleton";
import { useStreakViewStore } from "@/store/store-manager/streak-store";
import { AppHeader } from "@/components/header";
import { useTranslation } from "react-i18next";
import { useStorePremiumCampaignEdit } from "@/hooks/store-manager/use-store-premium-campaign-edit";
import { formatDate } from "@/utils/store_manager/streak-utils";
import {
  isStreakNoticeMessageKey,
  resolveStreakErrorI18nKey,
  resolveStreakErrorTitleKey,
} from "@/services/store-manager/streak-user-messages";
import { useStreaksByStoreQuery } from "@/hooks/store-manager/rq";

const WEB_MAX_WIDTH = 896;
const CONTENT_INSET = 16;
const WEB_TAB_PILL_STYLE = { flexGrow: 1, flexBasis: 120, minWidth: 0 };

export default function ViewStreak() {
  const { t: translate, i18n } = useTranslation();
  const PAGE_SIZE = 6;
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isWeb = Platform.OS === "web";
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

  const { canEdit, loading: permLoading, expiresAtIso } = useStorePremiumCampaignEdit(storeId);
  const campaignsLocked = !permLoading && !canEdit;

  const { refetch, data, isPending } = useStreaksByStoreQuery(storeId);

  useEffect(() => {
    if (data) {
      setStreaks(data);
      setUpcomingVisible(PAGE_SIZE);
      setEndedVisible(PAGE_SIZE);
    }
  }, [data, setStreaks, setUpcomingVisible, setEndedVisible]);

  useEffect(() => {
    setLoading(isPending);
  }, [isPending, setLoading]);

  const refetchStreaks = useCallback(() => {
    void refetch();
  }, [refetch]);

  useFocusEffect(
    useCallback(() => {
      refetchStreaks();
    }, [refetchStreaks]),
  );

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

  const streakErrorTitle = (messageKey: string | null) => {
    if (!messageKey) return translate("storeManager.streak.error");
    const titleKey = resolveStreakErrorTitleKey(messageKey);
    if (i18n.exists(titleKey)) return translate(titleKey);
    if (isStreakNoticeMessageKey(messageKey)) return translate("label.almostThere");
    return translate("storeManager.streak.error");
  };

  const showStreakError = (e: unknown) => {
    const key = resolveStreakErrorI18nKey(e);
    const raw = e instanceof Error ? e.message : String(e);
    const message = key
      ? translate(key)
      : raw.length > 0 && raw.length < 200
        ? raw
        : translate("storeManager.streak.errors.generic");
    setModal({
      title: streakErrorTitle(key),
      message,
      buttons: [{ label: translate("label.ok"), onPress: () => setModal(null) }],
    });
  };

  const handlePublish = (streak: Streak) => {
    const hasSchedule = Boolean(streak.start_at);
    const hasActiveProgram = streaks.some((s) => s.status === "active");
    const hasOtherUpcoming = streaks.some(
      (s) => s.status === "upcoming" && s.id !== streak.id,
    );

    if (!hasSchedule && hasActiveProgram) {
      setModal({
        title: translate("storeManager.streak.activeExistsTitle"),
        message: translate("storeManager.streak.activeExistsMessage"),
        buttons: [{ label: translate("label.ok"), onPress: () => setModal(null) }],
      });
      return;
    }

    const publishWouldCreateUpcoming = hasSchedule || hasActiveProgram;
    if (publishWouldCreateUpcoming && hasOtherUpcoming) {
      setModal({
        title: translate("storeManager.streak.upcomingExistsTitle"),
        message: translate("storeManager.streak.upcomingExistsMessage"),
        buttons: [{ label: translate("label.ok"), onPress: () => setModal(null) }],
      });
      return;
    }

    const publishMessage = hasSchedule
      ? translate("storeManager.streak.publishMessage")
      : translate("storeManager.streak.publishMessageNoScheduleLive");
    const primaryLabel = hasSchedule
      ? translate("storeManager.streak.publish")
      : translate("storeManager.streak.activate");

    setModal({
      title: translate("storeManager.streak.publishTitle"),
      message: publishMessage,
      buttons: [
        { label: translate("label.cancel"),  variant: "secondary", onPress: () => setModal(null) },
        {
          label: primaryLabel,
          variant: "primary",
          onPress: () => {
            setModal(null);
            void doPublish(streak.id!);
          },
        },
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
      refetchStreaks();
    } catch (e) {
      showStreakError(e);
    } finally {
      setActing(null);
    }
  };

  const handleActivate = (streak: Streak) => {
    setModal({
      title: translate("storeManager.streak.activateTitle"),
      message: translate("storeManager.streak.activateMessage"),
      buttons: [
        { label: translate("label.cancel"),   variant: "secondary", onPress: () => setModal(null) },
        { label: translate("storeManager.streak.activate"), variant: "primary", onPress: () => { setModal(null); doActivate(streak.id!); } },
      ],
    });
  };

  const doActivate = async (programId: number) => {
    setActing({ id: programId, action: "activate" });
    try {
      await activateStreakProgram(programId);
      refetchStreaks();
    } catch (e) {
      showStreakError(e);
    } finally {
      setActing(null);
    }
  };

  const handleEnd = (streak: Streak) => {
    setModal({
      title: translate("storeManager.streak.endTitle"),
      message: translate("storeManager.streak.endMessage"),
      buttons: [
        { label: translate("label.cancel"),      variant: "secondary", onPress: () => setModal(null) },
        { label: translate("storeManager.streak.endProgram"), variant: "danger",   onPress: () => { setModal(null); doEnd(streak.id!); } },
      ],
    });
  };

  const handleDelete = (streak: Streak) => {
    setModal({
      title: translate("storeManager.streak.deleteTitle"),
      message: translate("storeManager.streak.deleteMessage"),
      buttons: [
        { label: translate("label.cancel"), variant: "secondary", onPress: () => setModal(null) },
				{ label: translate("storeManager.streak.deleteProgram"), variant: "danger", onPress: () => { setModal(null); doDelete(streak.id!); } },
      ],
    });
  };

  const doEnd = async (programId: number) => {
    setActing({ id: programId, action: "end" });
    try {
      await endStreakProgram(programId);
      refetchStreaks();
    } catch (e) {
      showStreakError(e);
    } finally {
      setActing(null);
    }
  };

  const doDelete = async (programId: number) => {
    setActing({ id: programId, action: "delete" });
    try {
      await deleteStreakProgram(programId);
      refetchStreaks();
    } catch (e) {
      showStreakError(e);
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
        title={translate("storeManager.streak.title")}
        description={translate("storeManager.streak.description")}
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
        <View className="bg-backgroundMuted dark:bg-darkBackground pt-4 items-center">
          <View style={{ width: "100%", maxWidth: WEB_MAX_WIDTH, paddingHorizontal: CONTENT_INSET }}>
            <View className="w-full bg-white dark:bg-darkBackgroundMuted border border-slate-100 dark:border-darkBorder rounded-xl overflow-hidden flex-row flex-wrap p-1 gap-1">
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
                        : "min-w-0 text-xs font-poppins-medium text-slate-400 dark:text-darkTextSecondary"
                    }
                    numberOfLines={1}
                  >
                    {translate(`storeManager.streak.tabs.${tab.key}`)}
                  </Text>
                  {count > 0 && (
                    <View className={`rounded-full min-w-[18px] items-center px-1.5 ${active ? "bg-white/20" : "bg-slate-100 dark:bg-darkBackgroundCard"}`}>
                      <Text className={`text-[10px] font-poppins-semibold ${active ? "text-white" : "text-slate-500 dark:text-darkTextMuted"}`}>{count}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
            </View>
          </View>
        </View>
      ) : (
        <View className="border-b border-slate-100 dark:border-darkBorder px-4 py-3">
          <View className="bg-white dark:bg-darkBackgroundMuted border border-slate-100 dark:border-darkBorder rounded-xl overflow-hidden flex-row p-1 px-4">
            {StreakTabs.map((tab) => {
              const active = activeTab === tab.key;
              const count =
                tab.key === "active" ? activeStreaks.length : tab.key === "upcoming" ? upcomingStreaks.length : endedStreaks.length;

              return (
                <TouchableOpacity
                  key={tab.key}
                  className={[
                    "flex-1 py-2 items-center flex-row justify-center gap-1.5 rounded-xl",
                    active ? "bg-primary" : "bg-white dark:bg-darkBackgroundMuted",
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
                        : "text-xs font-poppins-medium text-slate-400 dark:text-darkTextSecondary"
                    }
                  >
                    {tab.label}
                  </Text>
                  {count > 0 && (
                    <View className={`rounded-full min-w-[18px] items-center px-1.5 ${active ? "bg-white/20" : ""}`}>
                      <Text className={`text-[9px] font-poppins-bold ${active ? "text-white" : "text-neutral-500 dark:text-darkTextMuted"}`}>
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
          style={[
            { flex: 1, padding: CONTENT_INSET, gap: 12 },
            Platform.OS === "web"
              ? { width: "100%", maxWidth: WEB_MAX_WIDTH, alignSelf: "center" }
              : null,
          ]}
        >
          <StreakCardSkeleton />
        </View>
      ) : tabStreaks.length === 0 ? (
        <View
          style={[
            { flex: 1, padding: CONTENT_INSET, gap: 12 },
            Platform.OS === "web"
              ? { width: "100%", maxWidth: WEB_MAX_WIDTH, alignSelf: "center" }
              : null,
          ]}
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
            <Text className="text-sm font-poppins-semibold text-slate-600 dark:text-darkTextSoft text-center">
                {activeTab === "active"
                  ? translate("storeManager.streak.emptyActiveTitle")
                  : activeTab === "upcoming"
                  ? translate("storeManager.streak.emptyUpcomingTitle")
                  : translate("storeManager.streak.emptyEndedTitle")}
              </Text>
              <Text className="text-xs font-poppins text-slate-400 dark:text-darkTextSecondary text-center">
                {activeTab === "active"
                  ? translate("storeManager.streak.emptyActiveBody")
                  : activeTab === "upcoming"
                  ? translate("storeManager.streak.emptyUpcomingBody")
                  : translate("storeManager.streak.emptyEndedBody")}
              </Text>
           </View>
          </View>
        </View>
      ) : (
        <View
          style={[
            { flex: 1, paddingHorizontal: CONTENT_INSET },
            Platform.OS === "web"
              ? { width: "100%", maxWidth: WEB_MAX_WIDTH, alignSelf: "center" }
              : null,
          ]}
        >
          <FlatList
            data={tabStreaks}
            keyExtractor={(item, index) => `${item.id ?? index}`}
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingVertical: CONTENT_INSET,
              gap: 12,
            }}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.35}
            renderItem={({ item: streak }) => (
              <StreakCard
                streak={streak}
                isDark={isDark}
                readonlyCampaigns={campaignsLocked}
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
        </View>
      )}

      {activeTab !== "ended" && !campaignsLocked && (
        Platform.OS === "web" ? (
          <View
            pointerEvents="box-none"
            style={{ position: "absolute", left: 0, right: 0, bottom: 60, alignItems: "center" }}
          >
            <View style={{ width: "100%", maxWidth: WEB_MAX_WIDTH, paddingHorizontal: CONTENT_INSET, alignItems: "flex-end" }}>
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
