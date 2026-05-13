import { View, Text, TouchableOpacity, View as RNView } from "react-native";
import { View as TWView, Text as TWText } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

interface UserStreakListItemProps {
  stamp: {
    store_id: number;
    stamps_count: number;
    target: number;
    stores?: {
      name: string;
      is_active?: boolean;
    };
  };
}

const getTier = (completed: number, translate: (key: string) => string) => {
  if (completed >= 5) return { label: translate("user.rewards.streaks.tiers.gold"), color: "text-amber-500" };
  if (completed >= 3) return { label: translate("user.rewards.streaks.tiers.silver"), color: "text-slate-400" };
  return { label: translate("user.rewards.streaks.tiers.bronze"), color: "text-amber-700" };
};

export default function UserStreakListItem({ stamp }: UserStreakListItemProps) {
  const router = useRouter();
  const { t: translate } = useTranslation();
  const targetDays = stamp.target || 7;
  const completed = stamp.stamps_count;
  const bonus = 500;
  const progress = Math.round((completed / targetDays) * 100);
  const safeProgress = Math.min(Math.max(progress, 0), 100);
  const tier = getTier(completed, translate);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/store/${stamp.store_id}`)}
      className="bg-white dark:bg-neutral-800 rounded-3xl p-4 border border-neutral-100 dark:border-neutral-700"
    >
      <TWView className="flex-row items-center justify-between">
        <TWView className="flex-row items-center gap-x-3">
          <TWView className="w-11 h-11 rounded-2xl bg-neutral-100 dark:bg-neutral-700 items-center justify-center">
            <MaterialIcons name="storefront" size={20} color="#FF6600" />
          </TWView>
          <TWView>
            <TWText className="font-poppins-semibold text-neutral-900 dark:text-white">
              {stamp.stores?.name ?? translate("user.rewards.store")}
            </TWText>
            <TWText className="text-xs text-neutral-500 font-poppins mt-1">
              {stamp.stores?.is_active 
                ? translate("user.rewards.streaks.activeStore") 
                : translate("user.rewards.streaks.inactiveStore")}
            </TWText>
          </TWView>
        </TWView>
        <MaterialIcons name="chevron-right" size={20} color="#94a3b8" />
      </TWView>

      <TWView className="flex-row items-center justify-between mt-4">
        <TWView className="flex-row items-center gap-x-2">
          <TWText className="text-xs font-poppins-medium text-neutral-400">
            {translate("user.rewards.completed", { current: completed, target: targetDays })}
          </TWText>
          <TWText className={`text-xs font-poppins-semibold ${tier.color}`}>
            {tier.label}
          </TWText>
        </TWView>
        <TWText className="text-xs font-poppins-semibold text-primary">
          {translate("user.rewards.streaks.bonusPts", { count: bonus })}
        </TWText>
      </TWView>

      <TWView className="h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full mt-3 overflow-hidden w-full">
        <RNView
          className="h-full bg-primary rounded-full"
          style={{ width: `${safeProgress}%`, minWidth: 6 }}
        />
      </TWView>

      <TWView className="flex-row items-center justify-between mt-3">
        <TWText className="text-[11px] text-neutral-400 font-poppins-medium">
          {translate("user.rewards.streaks.percentComplete", { percent: progress })}
        </TWText>
        <TWView className="flex-row items-center gap-x-1">
          <MaterialIcons name="bolt" size={14} color="#FF6600" />
          <TWText className="text-[11px] text-neutral-500 font-poppins-medium">
            {translate("user.rewards.streaks.reachingTarget")}
          </TWText>
        </TWView>
      </TWView>
    </TouchableOpacity>
  );
}
