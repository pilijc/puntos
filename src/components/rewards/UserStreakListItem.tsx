import { View, Text, TouchableOpacity, View as RNView } from "react-native";
import { View as TWView, Text as TWText } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React from "react";

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

const getTier = (completed: number) => {
  if (completed >= 5) return { label: "Gold", color: "text-amber-500" };
  if (completed >= 3) return { label: "Silver", color: "text-slate-400" };
  return { label: "Bronze", color: "text-amber-700" };
};

export default function UserStreakListItem({ stamp }: UserStreakListItemProps) {
  const router = useRouter();
  const targetDays = stamp.target || 7;
  const completed = stamp.stamps_count;
  const bonus = 500;
  const progress = Math.round((completed / targetDays) * 100);
  const safeProgress = Math.min(Math.max(progress, 0), 100);
  const tier = getTier(completed);

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
              {stamp.stores?.name ?? "Store"}
            </TWText>
            <TWText className="text-xs text-neutral-500 font-poppins mt-1">
              {stamp.stores?.is_active ? "Active Partner Store" : "Inactive"}
            </TWText>
          </TWView>
        </TWView>
        <MaterialIcons name="chevron-right" size={20} color="#94a3b8" />
      </TWView>

      <TWView className="flex-row items-center justify-between mt-4">
        <TWView className="flex-row items-center gap-x-2">
          <TWText className="text-xs font-poppins-medium text-neutral-400">
            {completed}/{targetDays} COMPLETED
          </TWText>
          <TWText className={`text-xs font-poppins-semibold ${tier.color}`}>
            {tier.label}
          </TWText>
        </TWView>
        <TWText className="text-xs font-poppins-semibold text-primary">
          +{bonus} bonus pts
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
          {progress}% complete
        </TWText>
        <TWView className="flex-row items-center gap-x-1">
          <MaterialIcons name="bolt" size={14} color="#FF6600" />
          <TWText className="text-[11px] text-neutral-500 font-poppins-medium">
            Keep stamping to reach your target!
          </TWText>
        </TWView>
      </TWView>
    </TouchableOpacity>
  );
}
