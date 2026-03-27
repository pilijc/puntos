import React, { useState } from "react";
import { ActivityIndicator } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import { CheckCircle, ChevronDown, Flame, Gift, Info, Pencil, Users } from "lucide-react-native";
import { COLORS } from "@/components/users/constants";
import { Button } from "@/components/button";
import { getParticipantsByProgramId, getParticipantsCountByProgramId } from "@/services/store-manager/streak-service";
import { StreakCardProps, StreakParticipant } from "@/type/store-manager/streak";
import { formatDate, formatDateTime } from "@/utils/store_manager/streak-utils";
import { StatusBadge } from "./status-badge";
import { ParticipantRow } from "./participant-row";

export function StreakCard({
  streak,
  isDark,
  onPublish,
  onActivate,
  onEnd,
  isPublishing,
  isActivating,
  isEnding,
}: StreakCardProps) {
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
      .then((data) => {
        setParticipants(data);
        setParticipantsPage(0);
      })
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
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <View className="flex-row items-center gap-x-2">
          <View className="w-8 h-8 rounded-lg items-center justify-center">
            <Flame size={16} color="#FF6600" />
          </View>
          <Text className="text-md font-poppins-bold text-textPrimary ">
            {streak.title ?? "Streak Program"}
          </Text>
        </View>
        <StatusBadge status={status} />
      </View>

      {streak.start_at && (
        <View className="flex-row items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">Starts at</Text>
          <Text className="text-xs font-poppins-semibold text-slate-600 dark:text-slate-300">
            {formatDateTime(streak.start_at)}
          </Text>
        </View>
      )}

      {streak.end_date && status !== "ended" && (
        <View className="flex-row items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">Ends</Text>
          <Text className="text-xs font-poppins-semibold text-slate-600 dark:text-slate-300">
            {formatDate(streak.end_date)}
          </Text>
        </View>
      )}

      {status === "ended" && streak.ended_at && (
        <View className="flex-row items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">Ended on</Text>
          <Text className="text-xs font-poppins-semibold text-slate-600 dark:text-slate-300">
            {formatDate(streak.ended_at)}
          </Text>
        </View>
      )}

      {!streak.start_at && streak.created_at && (
        <View className="flex-row items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-xs font-poppins text-textMuted">Created</Text>
          <Text className="text-xs font-poppins-semibold text-textSecondary">
            {formatDate(streak.created_at)}
          </Text>
        </View>
      )}

      {streak.streak_length != null && (
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-xs font-poppins text-textMuted">Streak length</Text>
          <Text className="text-xs font-poppins-bold text-textSecondary">{streak.streak_length} days</Text>
        </View>
      )}

      {streak.max_days_cap != null && (
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-xs font-poppins text-textMuted">Max days cap</Text>
          <Text className="text-xs font-poppins-semibold text-textSecondary">
            {streak.max_days_cap} days
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <Text className="text-xs font-poppins text-textMuted">Points</Text>
        <View className="flex-row items-center gap-x-1">
          <Text className="text-xs font-poppins-semibold text-textSecondary">
            {isFixed
              ? `${streak.fixed_points_per_day ?? "—"} pts/day`
              : `${streak.starting_points ?? "—"} pts + ${streak.increment_value ?? "—"}/day`}
          </Text>
        </View>
      </View>

      {(streak.completion_bonus_points ?? 0) > 0 && (
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-xs font-poppins text-textMuted">Completion bonus</Text>
          <View className="flex-row items-center gap-x-1">
            <Gift size={14} color="#F59E0B" />
            <Text className="text-xs font-poppins-bold text-textPrimary">
              +{streak.completion_bonus_points} pts
            </Text>
          </View>
        </View>
      )}

      {!!streak.reward_description && (
        <View className="flex-row items-center gap-x-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-xs font-poppins text-textSecondary" numberOfLines={2}>
            {streak.reward_description}
          </Text>
        </View>
      )}

      {status === "draft" && (
        <View className="mx-4 my-3 rounded-xl bg-backgroundMuted border border-slate-100 px-3 py-2.5 flex-row items-center gap-x-2">
          <Pencil size={14} color="#94A3B8" />
          <Text className="text-xs font-poppins text-textMuted flex-1">
            Draft — publish this program so users can see it's coming.
          </Text>
        </View>
      )}

      {status === "upcoming" && (
        <View className="mx-4 my-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-700 px-3 py-2.5 flex-row items-center gap-x-2">
          <Info size={14} color="#3B82F6" />
          <Text className="text-xs font-poppins text-textSecondary flex-1">
            {streak.start_at
              ? `Visible to users. Auto-activates on ${formatDateTime(streak.start_at)}.`
              : "Visible to users. Activate when you're ready for earning to begin."}
          </Text>
        </View>
      )}

      {status === "active" && (
        <View className="mx-4 my-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-700 px-3 py-2.5 flex-row items-center gap-x-2">
          <CheckCircle size={14} color="#10B981" />
          <Text className="text-xs font-poppins text-textSecondary flex-1">
            Users can earn today if they{streak.radius_meters ? ` are within ${streak.radius_meters}m and` : ""} haven't checked in yet today.
          </Text>
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setParticipantsOpen((p) => !p)}
        className="flex-row items-center justify-between px-4 py-3"
      >
        <View className="flex-row items-center gap-x-2">
          <View className="w-8 h-8 rounded-lg bg-backgroundMuted items-center justify-center">
            <Users size={16} color={COLORS.textMuted} />
          </View>
          <Text className="text-sm font-poppins-semibold text-textSecondary">
            Participants
          </Text>
          <View className="spx-2 py-0.5 min-w-[22px] items-center">
            <Text className="text-xs font-poppins-bold text-textSecondary">
              {participantsCount}
            </Text>
          </View>
        </View>
        <ChevronDown size={20} color={COLORS.textMuted} />
      </TouchableOpacity>

      {participantsOpen && (
        <View className="border-t border-slate-100 dark:border-slate-800">
          {participantsLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="small" color="#FF6600" />
            </View>
          ) : participants.length === 0 ? (
            <View className="py-8 items-center gap-y-2">
              <Users size={28} color={COLORS.textMuted} />
              <Text className="text-sm font-poppins text-textMuted">
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
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <>
                      <ChevronDown size={16} color={COLORS.primary} />
                      <Text className="text-xs font-poppins-semibold text-primary">
                        Load more ({participantsCount - participants.length} remaining)
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {!hasMore && participants.length > 0 && (
                <View className="py-2.5 items-center border-t border-slate-100 dark:border-slate-800">
                  <Text className="text-[10px] font-poppins text-textMuted">
                    All {participantsCount} participants shown
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      )}

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
