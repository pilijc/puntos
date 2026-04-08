import React from "react";
import { Image } from "expo-image";
import { View, Text } from "@/tw";
import { StreakParticipant } from "@/type/store-manager/streak";

interface ParticipantRowProps {
  item: StreakParticipant;
  streakLength: number;
}

export function ParticipantRow({ item, streakLength }: ParticipantRowProps) {
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
