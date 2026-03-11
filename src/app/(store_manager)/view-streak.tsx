import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, useColorScheme } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Button } from "@/components/button";
import { Modal, type ModalButton } from "@/components/modal";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import {
  getAllStreaksByStoreId,
  endStreakProgram,
  publishStreakProgram,
  activateStreakProgram,
  getParticipantsCountByProgramId,
  getParticipantsByProgramId,
} from "@/services/store-manager/streak-service";
import {
	StatusBadgeProps,
  Streak,
  StreakCardProps,
  StreakParticipant,
  StreakStatus,
  StreakTabKey,
  StreakTabs,
} from "@/type/store-manager/streak";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: StreakStatus }) {
  const config = StatusBadgeProps[status];

  return (
    <View className={`flex-row items-center gap-x-1 ${config.color} px-2.5 py-1 rounded-full`}>
      <View className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <Text className={`text-[10px] font-poppins-semibold ${config.text}`}>{config.label}</Text>
    </View>
  );
}

function ParticipantRow({ item, streakLength }: { item: StreakParticipant; streakLength: number }) {
  const progress = Math.min(item.total_earned_days / Math.max(streakLength, 1), 1);
  const name = item.users?.name ?? "Unknown User";
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <View className="border-b border-slate-100 dark:border-slate-800 px-4 py-3 gap-y-1.5">
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
        {item.completion_bonus_awarded && (
          <View className="bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">
            <Text className="text-xs font-poppins-semibold text-amber-500">BONUS</Text>
          </View>
        )}
        {item.status === "completed" && (
          <View className="bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
            <Text className="text-xs font-poppins-semibold text-emerald-500">DONE</Text>
          </View>
        )}
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
          {item.total_earned_days} day{item.total_earned_days !== 1 ? "s" : ""} earned
        </Text>
        <Text className="text-xs font-poppins-bold text-primary">
          {item.points_earned} pts
        </Text>
      </View>

      <View className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <View className="h-full rounded-full bg-primary" style={{ width: `${progress * 100}%` }} />
      </View>
    </View>
  );
}

function StreakCard({ streak, isDark, onPublish, onActivate, onEnd, isPublishing, isActivating, isEnding }: StreakCardProps) {
  const PAGE_SIZE = 5;
  const status = streak.status ?? "draft";
  const isFixed = !streak.points_mode || streak.points_mode === "fixed";

  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [participants, setParticipants] = useState<StreakParticipant[]>([]);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [participantsPage, setParticipantsPage] = useState(0);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const hasMore = participants.length < participantsCount;

  React.useEffect(() => {
    if (!streak.id) return;
    getParticipantsCountByProgramId(streak.id)
      .then(setParticipantsCount)
      .catch(() => {});
  }, [streak.id]);

  React.useEffect(() => {
    if (!participantsOpen || !streak.id || participants.length > 0) return;
    setParticipantsLoading(true);
    getParticipantsByProgramId(streak.id, 0, PAGE_SIZE)
      .then((data) => { setParticipants(data); setParticipantsPage(0); })
      .catch(() => {})
      .finally(() => setParticipantsLoading(false));
  }, [participantsOpen, streak.id]);

  const handleLoadMore = async () => {
    if (!streak.id || loadingMore) return;
    const nextPage = participantsPage + 1;
    setLoadingMore(true);
    try {
      const more = await getParticipantsByProgramId(streak.id, nextPage, PAGE_SIZE);
      setParticipants((prev) => [...prev, ...more]);
      setParticipantsPage(nextPage);
    } catch {
    } finally {
      setLoadingMore(false);
    }
  };

  const isActingAny = !!(isPublishing || isActivating || isEnding);
  const hasActions = !!(onPublish || onActivate || onEnd);

  return (
    <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <View className="flex-row items-center gap-x-2">
          <View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center">
            <MaterialIcons name="local-fire-department" size={16} color="#FF6600" />
          </View>
          <Text className="text-[15px] font-poppins-bold text-slate-900 dark:text-slate-100">
            {streak.title ?? "Streak Program"}
          </Text>
        </View>
        <StatusBadge status={status} />
      </View>

      {/* Start date */}
      {streak.start_date && (
        <View className="flex-row items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">Starts</Text>
          <Text className="text-xs font-poppins-semibold text-slate-600 dark:text-slate-300">
            {formatDate(streak.start_date)}
          </Text>
        </View>
      )}

      {/* End date */}
      {streak.end_date && status !== "ended" && (
        <View className="flex-row items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">Ends</Text>
          <Text className="text-xs font-poppins-semibold text-slate-600 dark:text-slate-300">
            {formatDate(streak.end_date)}
          </Text>
        </View>
      )}

      {/* Ended at */}
      {status === "ended" && streak.ended_at && (
        <View className="flex-row items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">Ended on</Text>
          <Text className="text-xs font-poppins-semibold text-slate-600 dark:text-slate-300">
            {formatDate(streak.ended_at)}
          </Text>
        </View>
      )}

      {/* Created at fallback */}
      {!streak.start_date && streak.created_at && (
        <View className="flex-row items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">Created</Text>
          <Text className="text-xs font-poppins-semibold text-slate-600 dark:text-slate-300">
            {formatDate(streak.created_at)}
          </Text>
        </View>
      )}

      {/* Streak length */}
      {streak.streak_length != null && (
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">Streak length</Text>
          <Text className="text-xs font-poppins-bold text-slate-600 dark:text-slate-300">{streak.streak_length} days</Text>
        </View>
      )}

      {/* Max days cap */}
      {streak.max_days_cap != null && (
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">Max days cap</Text>
          <Text className="text-xs font-poppins-semibold text-slate-600 dark:text-slate-300">
            {streak.max_days_cap} days
          </Text>
        </View>
      )}

      {/* Points mode */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <Text className="text-xs font-poppins text-slate-500 dark:text-slate-400">Points</Text>
        <View className="flex-row items-center gap-x-1">
          <Text className="text-xs font-poppins-semibold text-slate-700 dark:text-slate-300">
            {isFixed
              ? `${streak.fixed_points_per_day ?? "—"} pts/day`
              : `${streak.starting_points ?? "—"} pts + ${streak.increment_value ?? "—"}/day`}
          </Text>
        </View>
      </View>

      {/* Completion bonus */}
      {(streak.completion_bonus_points ?? 0) > 0 && (
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">Completion bonus</Text>
          <View className="flex-row items-center gap-x-1">
            <MaterialIcons name="emoji-events" size={14} color="#F59E0B" />
            <Text className="text-xs font-poppins-bold text-amber-500">
              +{streak.completion_bonus_points} pts
            </Text>
          </View>
        </View>
      )}

      {/* Reward description */}
      {!!streak.reward_description && (
        <View className="flex-row items-center gap-x-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
					<Text className="text-xs font-poppins text-slate-600 dark:text-slate-300" numberOfLines={2}>
						{streak.reward_description}
					</Text>
        </View>
      )}

      {/* Status notice banners */}
      {status === "draft" && (
        <View className="mx-4 my-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-2.5 flex-row items-center gap-x-2">
          <MaterialIcons name="edit-note" size={14} color="#94A3B8" />
          <Text className="text-xs font-poppins text-slate-500 dark:text-slate-400 flex-1">
            Draft — publish this program so users can see it's coming.
          </Text>
        </View>
      )}

      {status === "upcoming" && (
        <View className="mx-4 my-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-700 px-3 py-2.5 flex-row items-center gap-x-2">
          <MaterialIcons name="info-outline" size={14} color="#3B82F6" />
          <Text className="text-xs font-poppins text-blue-700 dark:text-blue-400 flex-1">
            {streak.start_date
              ? `Visible to users. Earning starts on ${formatDate(streak.start_date)}.`
              : "Visible to users. Activate when you're ready for earning to begin."}
          </Text>
        </View>
      )}

      {status === "active" && (
        <View className="mx-4 my-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-700 px-3 py-2.5 flex-row items-center gap-x-2">
          <MaterialIcons name="check-circle-outline" size={14} color="#10B981" />
          <Text className="text-xs font-poppins text-emerald-700 dark:text-emerald-400 flex-1">
            Users can earn today if they{streak.radius_meters ? ` are within ${streak.radius_meters}m and` : ""} haven't checked in yet today.
          </Text>
        </View>
      )}

      {/* Participants toggle */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setParticipantsOpen((p) => !p)}
        className="flex-row items-center justify-between px-4 py-3"
      >
        <View className="flex-row items-center gap-x-2">
          <View className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 items-center justify-center">
            <MaterialIcons name="people" size={16} color={isDark ? "#94A3B8" : "#64748B"} />
          </View>
          <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
            Participants
          </Text>
          <View className="bg-slate-100 dark:bg-slate-700 rounded-full px-2 py-0.5 min-w-[22px] items-center">
            <Text className="text-[10px] font-poppins-bold text-slate-500 dark:text-slate-400">
              {participantsCount}
            </Text>
          </View>
        </View>
        <MaterialIcons
          name={participantsOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"}
          size={20}
          color={isDark ? "#94A3B8" : "#CBD5E1"}
        />
      </TouchableOpacity>

      {participantsOpen && (
        <View className="border-t border-slate-100 dark:border-slate-800">
          {participantsLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="small" color="#FF6600" />
            </View>
          ) : participants.length === 0 ? (
            <View className="py-8 items-center gap-y-2">
              <MaterialIcons name="people-outline" size={28} color="#CBD5E1" />
              <Text className="text-sm font-poppins text-slate-400 dark:text-slate-500">
                No participants yet
              </Text>
            </View>
          ) : (
            <>
              {participants.map((item) => (
                <ParticipantRow
                  key={item.user_id}
                  item={item}
                  streakLength={streak.streak_length ?? 1}
                />
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
                        Load more ({participantsCount - participants.length} remaining)
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {!hasMore && participants.length > 0 && (
                <View className="py-2.5 items-center border-t border-slate-100 dark:border-slate-800">
                  <Text className="text-[10px] font-poppins text-slate-300 dark:text-slate-600">
                    All {participantsCount} participants shown
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* Action buttons */}
      {hasActions && (
        <View className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800 gap-y-2">
          {onPublish && (
            <Button
              label="Publish Program"
              onPress={onPublish}
              variant="primary"
              icon="publish"
              loading={isPublishing}
              disabled={isActingAny}
            />
          )}

          {onActivate && (
            <Button
              label="Activate Now"
              onPress={onActivate}
              variant="primary"
              icon="play-arrow"
              loading={isActivating}
              disabled={isActingAny}
            />
          )}

          {onEnd && (
            <Button
              label="End Program"
              onPress={onEnd}
              variant="danger"
              icon="stop-circle"
              loading={isEnding}
              disabled={isActingAny}
            />
          )}
        </View>
      )}
    </View>
  );
}

export default function ViewStreak() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { storeId } = useLocalSearchParams<{ storeId: string }>();

  const [activeTab, setActiveTab] = useState<StreakTabKey>("upcoming");
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<{ id: number; action: "publish" | "activate" | "end" } | null>(null);
  const [modal, setModal] = useState<{ title: string; message: string; buttons: ModalButton[] } | null>(null);

  const load = useCallback(() => {
    if (!storeId) return;
    setLoading(true);
    getAllStreaksByStoreId(storeId)
      .then(setStreaks)
      .catch(() => setStreaks([]))
      .finally(() => setLoading(false));
  }, [storeId]);

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
        { label: "Publish", variant: "primary", onPress: () => { setModal(null); doPublish(streak.id!); } },
        { label: "Cancel",  variant: "secondary", onPress: () => setModal(null) },
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
        { label: "Activate", variant: "success", onPress: () => { setModal(null); doActivate(streak.id!); } },
        { label: "Cancel",   variant: "secondary", onPress: () => setModal(null) },
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

      {/* Header */}
      <View
        className="bg-background dark:bg-[#111921] border-b border-slate-200 dark:border-slate-800 flex-row items-center px-2"
        style={{ paddingTop: insets.top + 8, paddingBottom: 0 }}
      >
        <TouchableOpacity
          className="w-10 h-10 rounded-full items-center justify-center mb-3"
          activeOpacity={0.7}
          onPress={() => router.push({ pathname: "/(store_manager)/view-store/[id]", params: { id: storeId } })}
        >
          <MaterialIcons name="chevron-left" size={22} color={isDark ? "#F1F5F9" : "#0F172A"} />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-[17px] font-poppins-bold text-slate-900 dark:text-slate-100 pr-10 mb-3">
          Streak Programs
        </Text>
      </View>

      {/* Tabs */}
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
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6600" />
        </View>
      ) : tabStreaks.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8 gap-y-4">
          <View className="w-20 h-20 rounded-2xl bg-primary/5 dark:bg-primary/10 items-center justify-center">
            <MaterialIcons name="local-fire-department" size={36} color="#FF6600" />
          </View>
          <View className="items-center gap-y-1">
            <Text className="text-base font-poppins-bold text-slate-900 dark:text-slate-100">
              {activeTab === "active"
                ? "No Active Program"
                : activeTab === "upcoming"
                ? "No Upcoming Programs"
                : "No Past Programs"}
            </Text>
            <Text className="text-sm font-poppins text-slate-500 dark:text-slate-400 text-center">
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
              onPress={() => router.push({ pathname: "/(store_manager)/configure-streaks", params: { storeId } })}
              variant="primary"
              icon="add"
              fullWidth={false}
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
              onPress={() => router.push({ pathname: "/(store_manager)/configure-streaks", params: { storeId } })}
              variant="ghost"
              icon="add-circle-outline"
            />
          )}
        </ScrollView>
      )}
    </View>
  );
}
