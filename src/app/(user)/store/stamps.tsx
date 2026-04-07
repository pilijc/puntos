import React, { useEffect } from "react";
import { View, Text, Image } from "@/tw";
import {
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useStamps } from "@/hooks/use-stamps";
import { useStampRewards } from "@/hooks/use-stamp-rewards";
import { getActiveStampProgramRewards } from "@/services/stamp-service";
import { storeLogos } from "@/data/rewards";
import {
  ChevronLeft,
  Check,
  Sparkles,
  Store,
  Gem,
  PackageOpen,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

// ─── SectionCard wrapper ──────────────────────────────────────────────────────
function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-white dark:bg-darkBackgroundMuted rounded-3xl border border-neutral-100 dark:border-darkBorder p-4">
      {children}
    </View>
  );
}

// ─── Single Stamp Card ────────────────────────────────────────────────────────
function StampCard({
  stamp,
  rewardTitle,
}: {
  stamp: any;
  rewardTitle?: string | null;
}) {
  const storeStr = stamp.stores as {
    name?: string;
    logo?: string;
    address?: string;
    is_active?: boolean;
    status?: string;
  } | undefined;

  const storeName = storeStr?.name ?? "Store";
  const storeAddress = storeStr?.address ?? "";
  const count = stamp.stamps_count ?? 0;
  const target = stamp.target ?? 7;
  const clampedCount = Math.min(Math.max(count, 0), target);
  const progress = target > 0 ? clampedCount / target : 0;

  const getLogoImage = () => {
    if (storeStr?.logo) return { uri: storeStr.logo };
    if (storeLogos[stamp.store_id?.toString()]) return storeLogos[stamp.store_id.toString()];
    // return require("../../../assets/images/rewards/coffee-shop.png");
  };

  const days = Array.from({ length: target }, (_, i) => ({
    number: i + 1,
    state: i < clampedCount ? "completed" : i === clampedCount && clampedCount < target ? "current" : "upcoming",
  }));

  return (
    <SectionCard>
      {/* Store header */}
      <View className="flex-row items-center gap-x-3 mb-3">
        <View className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-darkBackgroundCard items-center justify-center overflow-hidden border border-neutral-100 dark:border-darkBorder">
          {storeStr?.logo || storeLogos[stamp.store_id?.toString()] ? (
            <Image source={getLogoImage()} className="w-full h-full" contentFit="cover" />
          ) : (
            <Store size={20} color="#FF6600" />
          )}
        </View>
        <View className="flex-1">
          <Text className="font-poppins-semibold text-neutral-900 dark:text-white text-sm" numberOfLines={1}>
            {storeName}
          </Text>
          {!!storeAddress && (
            <Text className="text-[10px] font-poppins text-neutral-400" numberOfLines={1}>
              {storeAddress}
            </Text>
          )}
        </View>
        <View className="items-end">
          <Text className="text-[11px] font-poppins-bold text-primary">
            {clampedCount}/{target}
          </Text>
          <Text className="text-[9px] font-poppins text-neutral-400">stamps</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View className="h-1.5 bg-neutral-100 dark:bg-darkBackgroundCard rounded-full mb-3 overflow-hidden">
        <View
          className="h-full bg-primary rounded-full"
          style={{ width: `${progress * 100}%` }}
        />
      </View>

      {/* Stamp dots */}
      <View className="flex-row flex-wrap gap-1.5 mb-3">
        {days.map((day, i) => {
          const isCompleted = day.state === "completed";
          const isCurrent = day.state === "current";
          return (
            <View
              key={i}
              className={`w-9 h-9 rounded-full items-center justify-center ${
                isCompleted
                  ? "bg-primary"
                  : isCurrent
                  ? "bg-white dark:bg-darkBackgroundMuted"
                  : "bg-neutral-100 dark:bg-darkBackgroundCard"
              }`}
              style={isCurrent ? { borderWidth: 1.5, borderColor: "#FF6600", borderStyle: "dashed" } : undefined}
            >
              {isCompleted ? (
                <Check size={14} color="#FFFFFF" />
              ) : (
                <Text className={`text-xs font-poppins-semibold ${isCurrent ? "text-primary" : "text-neutral-400"}`}>
                  {day.number}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Reward row */}
      {rewardTitle && (
        <View className="flex-row items-center gap-x-2 pt-2 border-t border-neutral-100 dark:border-darkBorder">
          <Gem size={13} color={clampedCount >= target ? "#FF6600" : "#d1d5db"} />
          <Text
            className="text-[11px] font-poppins-semibold flex-1"
            style={{ color: clampedCount >= target ? "#FF6600" : "#9ca3af" }}
            numberOfLines={1}
          >
            {clampedCount >= target ? "Ready to claim: " : "Reward: "}
            {rewardTitle}
          </Text>
          {clampedCount >= target && (
            <View className="bg-orange-50 px-2 py-0.5 rounded-full">
              <Text className="text-[9px] font-poppins-bold text-primary">UNLOCKED</Text>
            </View>
          )}
        </View>
      )}
    </SectionCard>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AllStampsScreen() {
  const router = useRouter();
  const { t: translate } = useTranslation();
  const { stamps, isLoading, fetchStamps } = useStamps();
  const { stampRewards } = useStampRewards();
  const [activePrograms, setActivePrograms] = React.useState<any[]>([]);

  useEffect(() => {
    fetchStamps();
  }, []);

  useEffect(() => {
    if (stamps.length === 0) return;
    const storeIds = stamps.map((s) => s.store_id);
    getActiveStampProgramRewards(storeIds).then(setActivePrograms).catch(console.error);
  }, [stamps]);

  const totalStamps = stamps.reduce((sum, s) => sum + (s.stamps_count ?? 0), 0);
  const activeCards = stamps.length;

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-darkBackground">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-14 pb-4 gap-x-3 bg-white dark:bg-darkBackgroundMuted border-b border-neutral-100 dark:border-darkBorder">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-darkBackgroundCard items-center justify-center"
        >
          <ChevronLeft size={20} color="#FF6600" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-base font-poppins-bold text-neutral-900 dark:text-white">
            {translate("user.rewards.streaks.title")}
          </Text>
          <Text className="text-[10px] font-poppins text-neutral-400">
            {translate("user.rewards.streaks.status")}
          </Text>
        </View>
        <Sparkles size={18} color="#FF6600" />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FF6600" />
          <Text className="text-xs font-poppins text-neutral-400 mt-2">
            {translate("user.rewards.streaks.loading")}
          </Text>
        </View>
      ) : stamps.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <PackageOpen size={40} color="#d1d5db" />
          <Text className="text-sm font-poppins-semibold text-neutral-500 dark:text-neutral-400 mt-3 text-center">
            {translate("user.rewards.streaks.notFound")}
          </Text>
          <Text className="text-[11px] font-poppins text-neutral-400 mt-1 text-center">
            {translate("user.rewards.streaks.notFoundDetail")}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary stats */}
          <SectionCard>
            <View className="flex-row">
              <View className="flex-1 items-center">
                <Text className="text-xl font-poppins-bold text-primary">{totalStamps}</Text>
                <Text className="text-[10px] font-poppins text-neutral-400">
                  {translate("user.rewards.streaks.lifetime")}
                </Text>
              </View>
              <View className="w-px bg-neutral-100 dark:bg-darkBorder" />
              <View className="flex-1 items-center">
                <Text className="text-xl font-poppins-bold text-primary">{activeCards}</Text>
                <Text className="text-[10px] font-poppins text-neutral-400">
                  {translate("user.rewards.streaks.activeCards")}
                </Text>
              </View>
              <View className="w-px bg-neutral-100 dark:bg-darkBorder" />
              <View className="flex-1 items-center">
                <Text className="text-xl font-poppins-bold text-primary">
                  {Math.max(...stamps.map((s) => s.stamps_count ?? 0), 0)}
                </Text>
                <Text className="text-[10px] font-poppins text-neutral-400">
                  {translate("user.rewards.streaks.highestStamps")}
                </Text>
              </View>
            </View>
          </SectionCard>

          {/* Stamp cards */}
          {stamps.map((stamp) => {
            const program = activePrograms.find((p) => p.store_id === stamp.store_id);
            return (
              <StampCard
                key={stamp.id}
                stamp={stamp}
                rewardTitle={program?.reward_title ?? null}
              />
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
