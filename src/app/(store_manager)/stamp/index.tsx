import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, useColorScheme } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Modal } from "@/components/modal";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { getRewardsByStoreId } from "@/services/store-manager/reward-service";
import {
  getAllStampsByStoreId,
  getCollectorsByProgramId,
  getCollectorsCountByProgramId,
  endStampProgram,
  getProgramStatus,
} from "@/services/store-manager/stamp-service";
import { ProgramStatus, Stamp, StampCollector, TabKey, Tabs } from "@/type/store-manager/stamp";
import { Reward } from "@/type/store-manager/reward";
import { ModalButton } from "@/components/modal";
import { formatDate } from "@/utils/store_manager/stamp-utils";
import { Button } from "@/components/button";
import { Stamp as StampIcon, } from "lucide-react-native";
import { AppHeader } from "@/components/header";

function StatusBadge({ status }: { status: ProgramStatus }) {
  const config = {
    active:        { label: "Active",       color: "bg-emerald-50 dark:bg-emerald-900/20", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
    ended_grace:   { label: "Grace Period", color: "bg-amber-50 dark:bg-amber-900/20",     dot: "bg-amber-400",   text: "text-amber-600 dark:text-amber-400" },
    ended_expired: { label: "Expired",      color: "bg-slate-100 dark:bg-slate-700",       dot: "bg-slate-400",   text: "text-slate-500 dark:text-slate-400" },
  }[status];

  return (
    <View className={`flex-row items-center gap-x-1 ${config.color} px-2.5 py-1 rounded-full`}>
      <View className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <Text className={`text-[10px] font-poppins-semibold ${config.text}`}>{config.label}</Text>
    </View>
  );
}

function CollectorRow({ item, total }: { item: StampCollector; total: number }) {
  const progress = Math.min(item.stamps_count / Math.max(total, 1), 1);
  const name = item.users?.name ?? "Unknown User";
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const cardExpired = item.card_expires_at ? new Date() >= new Date(item.card_expires_at) : false;

  return (
    <View className="border-b border-slate-100 dark:border-slate-800 px-4 py-3 gap-y-1.5">
      {/* Name + status badges */}
      <View className="flex-row items-center gap-x-1.5">
        {item.users?.avatar_url ? (
          <Image source={{ uri: item.users.avatar_url }} style={{ width: 28, height: 28, borderRadius: 14 }} contentFit="cover" />
        ) : (
          <View className="w-7 h-7 rounded-full bg-primary/10 items-center justify-center">
            <Text className="text-[10px] font-poppins-bold text-primary">{initials}</Text>
          </View>
        )}
        <Text className="text-[13px] font-poppins-semibold text-slate-900 dark:text-slate-100 flex-1" numberOfLines={1}>
          {name}
        </Text>
        {cardExpired && (
          <View className="bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">
            <Text className="text-xs font-poppins-semibold text-red-500">EXPIRED</Text>
          </View>
        )}
        {item.card_status === "completed" && !cardExpired && (
          <View className="bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
            <Text className="text-xs font-poppins-semibold text-emerald-500">REDEEMABLE</Text>
          </View>
        )}
      </View>

      {/* Last stamp date + count */}
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
          Last stamp: {formatDate(item.last_stamp_at)}
        </Text>
        <Text className="text-xs font-poppins-bold text-primary">
          {item.stamps_count}/{total}
        </Text>
      </View>

      {/* Progress bar */}
      <View className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <View className="h-full rounded-full bg-primary" style={{ width: `${progress * 100}%` }} />
      </View>
    </View>
  );
}

function StampCard({
  stamp,
  reward,
  isDark,
  onEnd,
  isEnding,
}: {
  stamp: Stamp;
  reward: Reward | null;
  isDark: boolean;
  onEnd?: () => void;
  isEnding?: boolean;
}) {
  const PAGE_SIZE = 5;

  const [collectorsOpen, setCollectorsOpen] = useState(false);
  const [collectors, setCollectors] = useState<StampCollector[]>([]);
  const [collectorsCount, setCollectorsCount] = useState(0);
  const [collectorsPage, setCollectorsPage] = useState(0);
  const [collectorsLoading, setCollectorsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const status = getProgramStatus(stamp);

  const hasMore = collectors.length < collectorsCount;

  React.useEffect(() => {
    if (!stamp.id) return;
    getCollectorsCountByProgramId(stamp.id)
      .then(setCollectorsCount)
      .catch(() => {});
  }, [stamp.id]);

  React.useEffect(() => {
    if (!collectorsOpen || !stamp.id || collectors.length > 0) return;
    setCollectorsLoading(true);
    getCollectorsByProgramId(stamp.id, 0, PAGE_SIZE)
      .then((data) => { setCollectors(data); setCollectorsPage(0); })
      .catch(() => {})
      .finally(() => setCollectorsLoading(false));
  }, [collectorsOpen, stamp.id]);

  const handleLoadMore = async () => {
    if (!stamp.id || loadingMore) return;
    const nextPage = collectorsPage + 1;
    setLoadingMore(true);
    try {
      const more = await getCollectorsByProgramId(stamp.id, nextPage, PAGE_SIZE);
      setCollectors((prev) => [...prev, ...more]);
      setCollectorsPage(nextPage);
    } catch {
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <View className="flex-row items-center gap-x-2">
          <View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center">
            <MaterialIcons name="loyalty" size={16} color="#FF6600" />
          </View>
          <Text className="text-[15px] font-poppins-bold text-slate-900 dark:text-slate-100">
            Stamp Program
          </Text>
        </View>
        <StatusBadge status={status} />
      </View>

      {/* Started on */}
      {stamp.created_at && (
        <View className="flex-row items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">Started</Text>
          <Text className="text-xs font-poppins-semibold text-slate-600 dark:text-slate-300">
            {formatDate(stamp.created_at)}
          </Text>
        </View>
      )}

        {/* Ended date */}
        {status !== "active" && stamp.ended_at && (
        <View className="flex-row items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">Ended on</Text>
          <Text className="text-xs font-poppins-semibold text-slate-600 dark:text-slate-300">
            {formatDate(stamp.ended_at)}
          </Text>
        </View>
      )}

      {/* Stamps required */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">Stamps required</Text>
        <Text className="text-xs font-poppins-bold text-primary">{stamp.total_stamps}</Text>
      </View>


      {/* Expiration mode */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <Text className="text-sm font-poppins text-slate-500 dark:text-slate-400">Expiration</Text>
        <View className="flex-row items-center gap-x-1">
          <MaterialIcons
            name={stamp.expiration_mode === "none" ? "all-inclusive" : "timer"}
            size={14}
            color={stamp.expiration_mode === "none" ? "#10B981" : "#F59E0B"}
          />
          <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
            {stamp.expiration_mode === "none"
              ? "No Expiration"
              : `${stamp.expiration_days} day${stamp.expiration_days !== 1 ? "s" : ""} card limit`}
          </Text>
        </View>
      </View>

      {/* Reward */}
      <View className="flex-row items-center gap-x-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        {reward?.image_url ? (
          <Image source={{ uri: reward.image_url }} style={{ width: 40, height: 40, borderRadius: 10 }} contentFit="cover" />
        ) : (
          <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
            <MaterialIcons name="redeem" size={18} color="#FF6600" />
          </View>
        )}
        <View className="flex-1">
          <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">Reward</Text>
          <Text className="text-sm font-poppins-semibold text-slate-900 dark:text-slate-100" numberOfLines={1}>
            {reward?.title ?? "No reward linked"}
          </Text>
        </View>
      </View>

      {/* Grace period notice */}
      {status === "ended_grace" && stamp.redemption_deadline && (
        <View className="mx-4 my-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-700 px-3 py-2.5 flex-row items-center gap-x-2">
          <MaterialIcons name="hourglass-top" size={14} color="#D97706" />
          <Text className="text-xs font-poppins text-amber-700 dark:text-amber-400 flex-1">
            Grace period ends {formatDate(stamp.redemption_deadline)} — users can redeem but not earn stamps.
          </Text>
        </View>
      )}

      {/* Collectors toggle */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setCollectorsOpen((p) => !p)}
        className="flex-row items-center justify-between px-4 py-3"
      >
        <View className="flex-row items-center gap-x-2">
          <View className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 items-center justify-center">
            <MaterialIcons name="people" size={16} color={isDark ? "#94A3B8" : "#64748B"} />
          </View>
          <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
            Collectors
          </Text>
          <View className="bg-slate-100 dark:bg-slate-700 rounded-full px-2 py-0.5 min-w-[22px] items-center">
            <Text className="text-[10px] font-poppins-bold text-slate-500 dark:text-slate-400">
              {collectorsCount}
            </Text>
          </View>
        </View>
        <MaterialIcons
          name={collectorsOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"}
          size={20}
          color={isDark ? "#94A3B8" : "#CBD5E1"}
        />
      </TouchableOpacity>

      {collectorsOpen && (
        <View className="border-t border-slate-100 dark:border-slate-800">
          {collectorsLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="small" color="#FF6600" />
            </View>
          ) : collectors.length === 0 ? (
            <View className="py-8 items-center gap-y-2">
              <MaterialIcons name="people-outline" size={28} color="#CBD5E1" />
              <Text className="text-sm font-poppins text-slate-400 dark:text-slate-500">
                No collectors for this program
              </Text>
            </View>
          ) : (
            <>
              {collectors.map((item) => (
                <CollectorRow key={item.user_id} item={item} total={stamp.total_stamps} />
              ))}

              {hasMore && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleLoadMore}
                  disabled={loadingMore}
                  className="py-3 items-center flex-row justify-center gap-x-2 border-t border-slate-100 dark:border-slate-800"
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color="#FF6600" />
                  ) : (
                    <>
                      <MaterialIcons name="expand-more" size={16} color="#FF6600" />
                      <Text className="text-xs font-poppins-semibold text-primary">
                        Load more ({collectorsCount - collectors.length} remaining)
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {!hasMore && collectors.length > 0 && (
                <View className="py-2.5 items-center border-t border-slate-100 dark:border-slate-800">
                  <Text className="text-[10px] font-poppins text-slate-300 dark:text-slate-600">
                    All {collectorsCount} collectors shown
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* End program button — active only */}
      {status === "active" && onEnd && (
        <View className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={isEnding}
            onPress={onEnd}
            className="w-full rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 py-3 items-center flex-row justify-center gap-x-2"
          >
            {isEnding ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <>
                <MaterialIcons name="stop-circle" size={16} color="#EF4444" />
                <Text className="text-sm font-poppins-semibold text-red-500">End Program</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function ViewStamp() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { storeId } = useLocalSearchParams<{ storeId: string }>();

  const [activeTab, setActiveTab] = useState<TabKey>("active");
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [endingId, setEndingId] = useState<number | null>(null);
	const [modal, setModal] = useState<{ title: string; message: string; buttons: ModalButton[] } | null>(null);

  const load = useCallback(() => {
    if (!storeId) return;
    setLoading(true);
    Promise.all([
      getAllStampsByStoreId(storeId),
      getRewardsByStoreId(storeId),
    ])
      .then(([stampsData, rewardsData]) => {
        setStamps(stampsData);
        setRewards(rewardsData);
      })
      .catch(() => {
        setStamps([]);
        setRewards([]);
      })
      .finally(() => setLoading(false));
  }, [storeId]);

  useFocusEffect(load);

  const handleEndProgram = (stamp: Stamp) => {
    setModal({
      title: "End Stamp Program",
      message: "Choose a grace period during which users can still redeem existing stamps. After the grace period, no earning or redeeming is possible.",
      buttons: [
        { label: "14-Day Grace Period",variant: "primary",   onPress: () => { setModal(null); doEnd(stamp.id!, 14); } },
        { label: "7-Day Grace Period", variant: "secondary", onPress: () => { setModal(null); doEnd(stamp.id!, 7);  } },
        { label: "No Grace Period",    variant: "secondary",    onPress: () => { setModal(null); doEnd(stamp.id!, 0);  } },
      ],
    });
  };

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

  const activeStamps = stamps.filter((s) => s.is_active);
  const inactiveStamps = stamps.filter((s) => !s.is_active);
  const tabStamps = activeTab === "active" ? activeStamps : inactiveStamps;

  return (
    <View className="flex-1 bg-backgroundMuted dark:bg-[#111921]">
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
          const count = tab.key === "active" ? activeStamps.length : inactiveStamps.length;
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
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6600" />
        </View>
      ) : tabStamps.length === 0 ? (
        /* Empty state */
        <View className="flex-1 items-center justify-center px-8 gap-y-4 bg-slate-50 dark:bg-slate-900">
          <View className="items-center justify-center">
            <StampIcon size={36} color="gray" />
          </View>
          <View className="items-center gap-y-1">
            <Text className="text-base font-poppins-bold text-slate-500 dark:text-slate-300">
              {activeTab === "active" ? "No Active Program" : "No Past Programs"}
            </Text>
            <Text className="text-sm font-poppins text-slate-400 dark:text-slate-500 text-center">
              {activeTab === "active"
                ? "Launch a stamp program to start rewarding your customers."
                : "Ended stamp programs will appear here."}
            </Text>
          </View>
          {activeTab === "active" && (
            <Button
              label="Create Stamp Program"
              onPress={() => router.push({ pathname: "/(store_manager)/stamp/configure-stamp", params: { storeId } })}
              variant="primary"
            />
          )}
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }}>
          {tabStamps.map((stamp) => {
            const reward = rewards.find((r) => r.id === stamp.reward_id) ?? null;
            return (
              <StampCard
                key={stamp.id}
                stamp={stamp}
                reward={reward}
                isDark={isDark}
                onEnd={stamp.is_active ? () => handleEndProgram(stamp) : undefined}
                isEnding={endingId === stamp.id}
              />
            );
          })}

          {/* New program CTA — shown below active stamp */}
          {activeTab === "active" && activeStamps.length === 0 && (
            <TouchableOpacity
              className="w-full border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl py-6 items-center gap-y-2"
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: "/(store_manager)/configure-stamp", params: { storeId } })}
            >
              <MaterialIcons name="add-circle-outline" size={28} color="#94A3B8" />
              <Text className="text-sm font-poppins-semibold text-slate-400 dark:text-slate-500">
                Create New Program
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}
