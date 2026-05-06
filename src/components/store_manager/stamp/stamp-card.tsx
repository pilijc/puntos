import React from "react";
import { ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { View, Text, TouchableOpacity } from "@/tw";
import { getCollectorsByProgramId, getProgramStatus } from "@/services/store-manager/stamp-service";
import { emptyCollectorSlice, STATUS_BADGE, StampCardProps,
} from "@/type/store-manager/stamp";
import { formatDate } from "@/utils/store_manager/stamp-utils";
import { ChevronUp, ChevronDown, OctagonMinus, Trash2, Pencil, SendHorizonal, Stamp as StampIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";

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
  const { t: translate } = useTranslation();
  const status = getProgramStatus(stamp);
  const badge = STATUS_BADGE[status];
  const hasMore = c.collectors.length < c.collectorsCount;
  const PAGE_SIZE = 5;

  return (
    <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <View className="flex-row items-center gap-x-2">
          <StampIcon size={16} color="#94A3B8" />
          <Text className="text-sm font-poppins-bold text-slate-900 dark:text-slate-100">{translate("store_manager.stamp.title")}</Text>
        </View>
        <View className={`flex-row items-center gap-x-1 ${badge.color} px-2.5 py-1 rounded-full`}>
          <View className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
          <Text className={`text-xs font-poppins-semibold ${badge.text}`}>{badge.label}</Text>
        </View>
      </View>

      {stamp.created_at && (
        <View className="flex-row items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">{translate("store_manager.stamp.started")}</Text>
          <Text className="text-xs font-poppins-semibold text-textSecondary dark:text-slate-300">
            {formatDate(stamp.created_at)}
          </Text>
        </View>
      )}

      {status !== "active" && stamp.ended_at && (
        <View className="flex-row items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">{translate("store_manager.stamp.endedOn")}</Text>
          <Text className="text-xs font-poppins-semibold text-textSecondary dark:text-slate-300">
            {formatDate(stamp.ended_at)}
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">{translate("store_manager.stamp.stampsRequired")}</Text>
        <Text className="text-xs font-poppins-bold text-textSecondary">{stamp.total_stamps}</Text>
      </View>

      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <Text className="text-xs font-poppins text-slate-500 dark:text-slate-400">{translate("store_manager.stamp.expiration")}</Text>
        <Text className="text-xs font-poppins-semibold text-textSecondary dark:text-slate-300">
          {stamp.expiration_mode === "none"
            ? translate("store_manager.stamp.noExpiration")
            : `${stamp.expiration_days} ${translate(stamp.expiration_days !== 1 ? "store_manager.stamp.daysLimit" : "store_manager.stamp.dayLimit")}`}
        </Text>
      </View>

      <View className="flex-row items-center gap-x-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        {reward?.image_url ? (
          <Image source={{ uri: reward.image_url }} style={{ width: 40, height: 40, borderRadius: 10 }} contentFit="cover" />
        ) : null}
        <View className="flex-1">
          <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">{translate("store_manager.stamp.reward")}</Text>
          <Text className="text-sm font-poppins-semibold text-slate-900 dark:text-slate-100" numberOfLines={1}>
            {reward?.title ?? translate("store_manager.stamp.noRewardLinked")}
          </Text>
        </View>
      </View>

      {status === "ended_grace" && stamp.redemption_deadline && (
        <View className="mx-4 my-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-700 px-3 py-2.5 flex-row items-center gap-x-2">
          <Text className="text-xs font-poppins text-amber-700 dark:text-amber-400 flex-1">
            {translate("store_manager.stamp.gracePeriodInfo", { date: formatDate(stamp.redemption_deadline) })}
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
              <Text className="text-sm font-poppins-semibold text-textSecondary dark:text-slate-300">{translate("store_manager.stamp.collectors")}</Text>
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
                  <Text className="text-sm font-poppins text-slate-400 dark:text-slate-500">{translate("store_manager.stamp.noCollectors")}</Text>
                </View>
              ) : (
                <>
                  {c.collectors.map((item) => {
                    const progress = Math.min(item.stamps_count / Math.max(stamp.total_stamps, 1), 1);
                    const name = item.users?.name ?? translate("store_manager.stamp.unknownUser");
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
                              <Text className="text-xs font-poppins-semibold text-red-500">{translate("store_manager.stamp.expired")}</Text>
                            </View>
                          )}
                          {item.card_status === "completed" && !cardExpired && (
                            <View className="bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
                              <Text className="text-xs font-poppins-semibold text-emerald-500">{translate("store_manager.stamp.redeemable")}</Text>
                            </View>
                          )}
                        </View>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
                            {translate("store_manager.stamp.lastStamp", { date: formatDate(item.last_stamp_at) })}
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
                            {translate("store_manager.stamp.loadMore", { count: c.collectorsCount - c.collectors.length })}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  {!hasMore && c.collectors.length > 0 && (
                    <View className="py-2.5 items-center border-t border-slate-100 dark:border-slate-800">
                      <Text className="text-xs font-poppins text-slate-300 dark:text-slate-600">
                        {translate("store_manager.stamp.allCollectorsShown", { count: c.collectorsCount })}
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
                  title: translate("store_manager.stamp.deleteConfirmTitle"),
                  message: translate("store_manager.stamp.deleteConfirmMessage"),
                  buttons: [
                    { label: translate("label.cancel"), variant: "secondary", onPress: () => setModal(null) },
                    { label: translate("label.delete"), variant: "danger", onPress: () => { setModal(null); doDelete(stamp.id!) } },
                  ],
                })
              }
              className="flex-1 h-8 rounded-lg items-center justify-center bg-red-100"
            >
              <Trash2 size={12} color="#ef4444" />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={
                onEditDraft ??
                (() =>
                  setModal({
                    title: translate("store_manager.stamp.editProgramTitle"),
                    message: translate("store_manager.stamp.editProgramMessage"),
                    buttons: [{ label: translate("label.ok"), onPress: () => setModal(null) }],
                  }))
              }
              className="flex-1 h-8 rounded-lg items-center justify-center bg-gray-200"
            >
              <Pencil size={12} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                activeProgramCount > 0
                  ? setModal({
                      title: translate("store_manager.stamp.activeProgramExistsTitle"),
                      message: translate("store_manager.stamp.activeProgramExistsMessage"),
                      buttons: [{ label: translate("label.ok"), variant: "secondary", onPress: () => setModal(null) }],
                    })
                  : setModal({
                      title: translate("store_manager.stamp.activateConfirmTitle"),
                      message: translate("store_manager.stamp.activateConfirmMessage"),
                      buttons: [
                        { label: translate("label.cancel"), variant: "secondary", onPress: () => setModal(null) },
                        {
                          label: translate("label.active"),
                          variant: "primary",
                          onPress: () => {
                            setModal(null);
                            void doActivate(stamp.id!);
                          },
                        },
                      ],
                    })
              }
              className="flex-1 h-8 rounded-lg items-center justify-center bg-orange-500"
            >
              <SendHorizonal size={12} color="#fff" />
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
                title: translate("store_manager.stamp.endConfirmTitle"),
                message: translate("store_manager.stamp.endConfirmMessage"),
                buttons: [
                  {
                    label: translate("store_manager.stamp.grace14"),
                    variant: "primary",
                    onPress: () => {
                      setModal(null);
                      void doEnd(stamp.id!, 14);
                    },
                  },
                  {
                    label: translate("store_manager.stamp.grace7"),
                    variant: "secondary",
                    onPress: () => {
                      setModal(null);
                      void doEnd(stamp.id!, 7);
                    },
                  },
                  {
                    label: translate("store_manager.stamp.grace0"),
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
                <Text className="text-sm font-poppins-semibold text-red-500">{translate("store_manager.stamp.endProgram")}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
