import React, { Dispatch, SetStateAction } from "react";
import { ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { View, Text, TouchableOpacity } from "@/tw";
import { getCollectorsByProgramId, getProgramStatus } from "@/services/store-manager/stamp-service";
import {
  CollectorSlice,
  emptyCollectorSlice,
  Stamp,
  STATUS_BADGE,
  StampModalState,
  TabKey,
} from "@/type/store-manager/stamp";
import { Reward } from "@/type/store-manager/reward";
import { formatDate } from "@/utils/store_manager/stamp-utils";
import { ChevronUp, ChevronDown, OctagonMinus, Trash2, Pencil, SendHorizonal, Stamp as StampIcon } from "lucide-react-native";

const PAGE_SIZE = 5;

export type StampCardProps = {
  stamp: Stamp;
  reward: Reward | null;
  activeTab: TabKey;
  isDark: boolean;
  collector: CollectorSlice;
  programId: number;
  setCollectorByProgram: Dispatch<SetStateAction<Record<number, CollectorSlice>>>;
  loadCollectorsFirstPage: (programId: number) => void;
  activeProgramCount: number;
  doActivate: (programId: number) => void | Promise<void>;
  doEnd: (programId: number, graceDays: number) => void | Promise<void>;
  doDelete: (programId: number) => void | Promise<void>;
  onEditDraft?: () => void;
  setModal: (modal: StampModalState) => void;
  endingId: number | null;
};

export function StampCard({
  stamp,
  reward,
  activeTab,
  isDark,
  collector: c,
  programId: pid,
  setCollectorByProgram,
  loadCollectorsFirstPage,
  setModal,
  activeProgramCount,
  doActivate,
  doEnd,
  doDelete,
  onEditDraft,
  endingId,
}: StampCardProps) {
  const status = getProgramStatus(stamp);
  const badge = STATUS_BADGE[status];
  const hasMore = c.collectors.length < c.collectorsCount;

  return (
    <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <View className="flex-row items-center gap-x-2">
          <StampIcon size={16} color="#94A3B8" />
          <Text className="text-sm font-poppins-bold text-slate-900 dark:text-slate-100">Stamp Program</Text>
        </View>
        <View className={`flex-row items-center gap-x-1 ${badge.color} px-2.5 py-1 rounded-full`}>
          <View className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
          <Text className={`text-xs font-poppins-semibold ${badge.text}`}>{badge.label}</Text>
        </View>
      </View>

      {stamp.created_at && (
        <View className="flex-row items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">Started</Text>
          <Text className="text-xs font-poppins-semibold text-textSecondary dark:text-slate-300">
            {formatDate(stamp.created_at)}
          </Text>
        </View>
      )}

      {status !== "active" && stamp.ended_at && (
        <View className="flex-row items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">Ended on</Text>
          <Text className="text-xs font-poppins-semibold text-textSecondary dark:text-slate-300">
            {formatDate(stamp.ended_at)}
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">Stamps required</Text>
        <Text className="text-xs font-poppins-bold text-textSecondary">{stamp.total_stamps}</Text>
      </View>

      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <Text className="text-xs font-poppins text-slate-500 dark:text-slate-400">Expiration</Text>
        <Text className="text-xs font-poppins-semibold text-textSecondary dark:text-slate-300">
          {stamp.expiration_mode === "none"
            ? "No Expiration"
            : `${stamp.expiration_days} day${stamp.expiration_days !== 1 ? "s" : ""} card limit`}
        </Text>
      </View>

      <View className="flex-row items-center gap-x-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        {reward?.image_url ? (
          <Image source={{ uri: reward.image_url }} style={{ width: 40, height: 40, borderRadius: 10 }} contentFit="cover" />
        ) : null}
        <View className="flex-1">
          <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">Reward</Text>
          <Text className="text-sm font-poppins-semibold text-slate-900 dark:text-slate-100" numberOfLines={1}>
            {reward?.title ?? "No reward linked"}
          </Text>
        </View>
      </View>

      {status === "ended_grace" && stamp.redemption_deadline && (
        <View className="mx-4 my-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-700 px-3 py-2.5 flex-row items-center gap-x-2">
          <Text className="text-xs font-poppins text-amber-700 dark:text-amber-400 flex-1">
            Grace period ends {formatDate(stamp.redemption_deadline)} — users can redeem but not earn stamps.
          </Text>
        </View>
      )}

      {activeTab === "active" && (
        <>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setCollectorByProgram((prev) => {
                const cur = prev[pid] ?? emptyCollectorSlice();
                const nextOpen = !cur.collectorsOpen;
                if (nextOpen && !cur.hasLoadedCollectorsOnce) {
                  queueMicrotask(() => loadCollectorsFirstPage(pid));
                }
                return {
                  ...prev,
                  [pid]: { ...cur, collectorsOpen: nextOpen },
                };
              });
            }}
            className="flex-row items-center justify-between px-4 py-3"
          >
            <View className="flex-row items-center gap-x-2">
              <Text className="text-sm font-poppins-semibold text-textSecondary dark:text-slate-300">Collectors</Text>
              <View className="bg-slate-100 dark:bg-slate-700 rounded-full px-2 py-0.5 min-w-[22px] items-center">
                <Text className="text-xs font-poppins-bold text-slate-500 dark:text-slate-400">{c.collectorsCount}</Text>
              </View>
            </View>
            {c.collectorsOpen ? (
              <ChevronUp size={20} color={isDark ? "#94A3B8" : "#CBD5E1"} />
            ) : (
              <ChevronDown size={20} color={isDark ? "#94A3B8" : "#CBD5E1"} />
            )}
          </TouchableOpacity>

          {c.collectorsOpen && (
            <View className="border-t border-slate-100 dark:border-slate-800">
              {c.collectorsLoading ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="small" color="#FF6600" />
                </View>
              ) : c.collectors.length === 0 ? (
                <View className="py-8 items-center gap-y-2">
                  <Text className="text-sm font-poppins text-slate-400 dark:text-slate-500">No collectors for this program</Text>
                </View>
              ) : (
                <>
                  {c.collectors.map((item) => {
                    const progress = Math.min(item.stamps_count / Math.max(stamp.total_stamps, 1), 1);
                    const name = item.users?.name ?? "Unknown User";
                    const initials = name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    const cardExpired = item.card_expires_at ? new Date() >= new Date(item.card_expires_at) : false;
                    return (
                      <View key={item.user_id} className="border-b border-slate-100 dark:border-slate-800 px-4 py-3 gap-y-1.5">
                        <View className="flex-row items-center gap-x-1.5">
                          {item.users?.avatar_url ? (
                            <Image
                              source={{ uri: item.users.avatar_url }}
                              style={{ width: 28, height: 28, borderRadius: 14 }}
                              contentFit="cover"
                            />
                          ) : (
                            <View className="w-7 h-7 rounded-full bg-primary/10 items-center justify-center">
                              <Text className="text-[10px] font-poppins-bold text-primary">{initials}</Text>
                            </View>
                          )}
                          <Text className="text-sm font-poppins-semibold text-slate-900 dark:text-slate-100 flex-1" numberOfLines={1}>
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
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
                            Last stamp: {formatDate(item.last_stamp_at)}
                          </Text>
                          <Text className="text-xs font-poppins-bold text-primary">
                            {item.stamps_count}/{stamp.total_stamps}
                          </Text>
                        </View>
                        <View className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                          <View className="h-full rounded-full bg-primary" style={{ width: `${progress * 100}%` }} />
                        </View>
                      </View>
                    );
                  })}

                  {hasMore && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={async () => {
                        if (!stamp.id || c.loadingMore) return;
                        const nextPage = c.collectorsPage + 1;
                        setCollectorByProgram((prev) => ({
                          ...prev,
                          [pid]: { ...(prev[pid] ?? emptyCollectorSlice()), loadingMore: true },
                        }));
                        try {
                          const more = await getCollectorsByProgramId(stamp.id, nextPage, PAGE_SIZE);
                          setCollectorByProgram((prev) => {
                            const cur = prev[pid] ?? emptyCollectorSlice();
                            return {
                              ...prev,
                              [pid]: {
                                ...cur,
                                collectors: [...cur.collectors, ...more],
                                collectorsPage: nextPage,
                                loadingMore: false,
                              },
                            };
                          });
                        } catch {
                          setCollectorByProgram((prev) => ({
                            ...prev,
                            [pid]: { ...(prev[pid] ?? emptyCollectorSlice()), loadingMore: false },
                          }));
                        }
                      }}
                      disabled={c.loadingMore}
                      className="py-3 items-center flex-row justify-center gap-x-2 border-t border-slate-100 dark:border-slate-800"
                    >
                      {c.loadingMore ? (
                        <ActivityIndicator size="small" color="#FF6600" />
                      ) : (
                        <>
                          <ChevronDown size={16} color="#FF6600" />
                          <Text className="text-xs font-poppins-semibold text-primary">
                            Load more ({c.collectorsCount - c.collectors.length} remaining)
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  {!hasMore && c.collectors.length > 0 && (
                    <View className="py-2.5 items-center border-t border-slate-100 dark:border-slate-800">
                      <Text className="text-xs font-poppins text-slate-300 dark:text-slate-600">
                        All {c.collectorsCount} collectors shown
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}
        </>
      )}

      {activeTab === "draft" && (
        <View className="px-4 pb-4 pt-2">
          <View className="flex-row gap-x-2">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                setModal({
                  title: "Delete Stamp Program",
                  message: "Are you sure you want to delete this stamp program?",
                  buttons: [
                    { label: "Cancel", variant: "secondary", onPress: () => setModal(null) },
                    { label: "Delete", variant: "danger", onPress: () => { setModal(null); doDelete(stamp.id!) } },
                  ],
                })
              }
              className="flex-1 h-10 rounded-xl items-center justify-center bg-red-100"
            >
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={
                onEditDraft ??
                (() =>
                  setModal({
                    title: "Edit Program",
                    message: "Edit draft program will be implemented next.",
                    buttons: [{ label: "OK", onPress: () => setModal(null) }],
                  }))
              }
              className="flex-1 h-10 rounded-xl items-center justify-center bg-gray-200"
            >
              <Pencil size={16} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                activeProgramCount > 0
                  ? setModal({
                      title: "Active Program Exists",
                      message: "There is already an active stamp program for this store. End it first before activating another one.",
                      buttons: [{ label: "OK", variant: "secondary", onPress: () => setModal(null) }],
                    })
                  : setModal({
                      title: "Activate Program",
                      message: "This draft will be activated and users can start collecting stamps immediately.",
                      buttons: [
                        { label: "Cancel", variant: "secondary", onPress: () => setModal(null) },
                        {
                          label: "Activate",
                          variant: "primary",
                          onPress: () => {
                            setModal(null);
                            void doActivate(stamp.id!);
                          },
                        },
                      ],
                    })
              }
              className="flex-1 h-10 rounded-xl items-center justify-center bg-orange-500"
            >
              <SendHorizonal size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {status === "active" && activeTab === "active" && (
        <View className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={endingId === stamp.id}
            onPress={() =>
              setModal({
                title: "End Stamp Program",
                message:
                  "Choose a grace period during which users can still redeem existing stamps. After the grace period, no earning or redeeming is possible.",
                buttons: [
                  {
                    label: "14-Day Grace Period",
                    variant: "primary",
                    onPress: () => {
                      setModal(null);
                      void doEnd(stamp.id!, 14);
                    },
                  },
                  {
                    label: "7-Day Grace Period",
                    variant: "secondary",
                    onPress: () => {
                      setModal(null);
                      void doEnd(stamp.id!, 7);
                    },
                  },
                  {
                    label: "No Grace Period",
                    variant: "secondary",
                    onPress: () => {
                      setModal(null);
                      void doEnd(stamp.id!, 0);
                    },
                  },
                ],
              })
            }
            className="w-full rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 py-3 items-center flex-row justify-center gap-x-2"
          >
            {endingId === stamp.id ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <>
                <OctagonMinus size={16} color="#EF4444" />
                <Text className="text-sm font-poppins-semibold text-red-500">End Program</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
