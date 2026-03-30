import React, { useEffect, useRef, useState } from "react";
import { View, Text, Image } from "@/tw";
import {
  Animated,
  ScrollView,
  TouchableOpacity,
  Easing,
  View as RNView,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { storeLogos } from "@/data/rewards";
import { getUserStreakByStore, UserStreak } from "@/services/streak-service";
import { supabase } from "@/supabase/supabase";
import {
  ChevronLeft,
  Flame,
  Gem,
  Crosshair,
  TrendingUp,
  CalendarDays,
  Star,
  Store,
  CircleCheck,
} from "lucide-react-native";

const getOrdinalSuffix = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function ProgressRing({
  progress,
  size = 160,
  strokeWidth = 14,
  streakDays,
  targetDays,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  streakDays: number;
  targetDays: number;
}) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animatedValue, progress]);

  const isComplete = progress >= 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const center = size / 2;
  const activeColor = isComplete ? "#22c55e" : "#FF6600";

  return (
    <RNView style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={activeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      <View className="items-center">
        <Flame size={24} color={activeColor} />
        <Text className="text-neutral-900 dark:text-white font-poppins-bold text-4xl leading-tight">
          {streakDays}
        </Text>
        <Text className="text-neutral-400 font-poppins-medium text-[11px]">
          of {targetDays} days
        </Text>
      </View>
    </RNView>
  );
}

function RecentActivityCalendar({
  streakDays,
  lastActivityDate,
}: {
  streakDays: number;
  lastActivityDate: string | null;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const scrollRef = React.useRef<any>(null);
  const STRIP_DAYS = 90;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastDate = lastActivityDate ? new Date(lastActivityDate) : today;
  lastDate.setHours(0, 0, 0, 0);

  const earnedDates = new Set<string>();
  for (let i = 0; i < streakDays; i++) {
    const d = new Date(lastDate);
    d.setDate(lastDate.getDate() - i);
    earnedDates.add(d.toISOString().split("T")[0]);
  }

  const todayStr = today.toISOString().split("T")[0];
  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  const allCells = Array.from({ length: STRIP_DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (STRIP_DAYS - 1 - i));
    const dateStr = d.toISOString().split("T")[0];
    return {
      dateStr,
      day: d.getDate(),
      dow: d.getDay(),
      isToday: dateStr === todayStr,
      earned: earnedDates.has(dateStr),
      isFuture: d > today,
    };
  });

  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startPad = firstOfMonth.getDay();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const monthLabel = today.toLocaleString("default", { month: "long", year: "numeric" });

  const Cell = ({ day, isToday, earned, isFuture, pad = false }: {
    day?: number;
    isToday?: boolean;
    earned?: boolean;
    isFuture?: boolean;
    pad?: boolean;
  }) => (
    <RNView
      style={{
        flex: 1,
        aspectRatio: 1,
        margin: 2,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pad ? "transparent" : earned ? "#FF6600" : isToday && !earned ? "#FFF7ED" : "#f3f4f6",
        borderWidth: !pad && isToday && !earned ? 1.5 : 0,
        borderColor: "#FF6600",
        opacity: isFuture ? 0.35 : 1,
      }}
    >
      {!pad && (
        earned ? (
          <Flame size={12} color="#FFFFFF" />
        ) : (
          <Text style={{ fontSize: 9, color: isToday ? "#FF6600" : "#9ca3af", fontWeight: "600" }}>
            {day}
          </Text>
        )
      )}
    </RNView>
  );

  const totalCells = startPad + daysInMonth;
  const rows: React.ReactNode[] = [];
  let cells: React.ReactNode[] = [];
  for (let i = 0; i < totalCells; i++) {
    if (i < startPad) {
      cells.push(<Cell key={`pad-${i}`} pad />);
    } else {
      const dayNum = i - startPad + 1;
      const d = new Date(today.getFullYear(), today.getMonth(), dayNum);
      const dateStr = d.toISOString().split("T")[0];
      cells.push(
        <Cell
          key={dateStr}
          day={dayNum}
          isToday={dateStr === todayStr}
          earned={earnedDates.has(dateStr)}
          isFuture={d > today}
        />,
      );
    }
    if (cells.length === 7) {
      rows.push(<View key={`row-${rows.length}`} className="flex-row">{cells}</View>);
      cells = [];
    }
  }
  if (cells.length > 0) {
    while (cells.length < 7) cells.push(<Cell key={`end-pad-${cells.length}`} pad />);
    rows.push(<View key={`row-${rows.length}`} className="flex-row">{cells}</View>);
  }

  const Legend = () => (
    <View className="flex-row items-center gap-x-3">
      <View className="flex-row items-center gap-x-1">
        <RNView style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "#FF6600" }} />
        <Text className="text-[10px] text-neutral-400 font-poppins">Earned</Text>
      </View>
      <View className="flex-row items-center gap-x-1">
        <RNView style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "#FFF7ED", borderWidth: 1.5, borderColor: "#FF6600" }} />
        <Text className="text-[10px] text-neutral-400 font-poppins">Today</Text>
      </View>
      <View className="flex-row items-center gap-x-1">
        <RNView style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "#f3f4f6" }} />
        <Text className="text-[10px] text-neutral-400 font-poppins">Missed</Text>
      </View>
    </View>
  );

  return (
    <View>
      {!expanded ? (
        <>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            onLayout={() => scrollRef.current?.scrollToEnd?.({ animated: false })}
            contentContainerStyle={{ paddingBottom: 4 }}
          >
            <View style={{ paddingHorizontal: 2 }}>
              <View className="flex-row mb-1">
                {allCells.map((cell, i) => (
                  <View key={i} style={{ width: 26, alignItems: "center" }}>
                    <Text className="text-[8px] text-neutral-400 font-poppins-medium">{dayLabels[cell.dow]}</Text>
                  </View>
                ))}
              </View>
              <View className="flex-row">
                {allCells.map((cell, i) => (
                  <RNView
                    key={i}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 7,
                      margin: 2,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: cell.earned ? "#FF6600" : cell.isToday && !cell.earned ? "#FFF7ED" : "#f3f4f6",
                      borderWidth: cell.isToday && !cell.earned ? 1.5 : 0,
                      borderColor: "#FF6600",
                      opacity: cell.isFuture ? 0.4 : 1,
                    }}
                  >
                    {cell.earned ? (
                      <Flame size={10} color="#FFFFFF" />
                    ) : (
                      <Text className={`text-[8px] font-poppins-medium ${cell.isToday ? "text-primary" : "text-neutral-300"}`}>
                        {cell.day}
                      </Text>
                    )}
                  </RNView>
                ))}
              </View>
            </View>
          </ScrollView>

          <View className="flex-row items-center justify-between mt-2">
            <Legend />
            <TouchableOpacity onPress={() => setExpanded(true)}>
              <Text className="text-[11px] text-primary font-poppins-semibold">Full calendar ›</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-poppins-semibold text-neutral-900 dark:text-white">{monthLabel}</Text>
            <TouchableOpacity onPress={() => setExpanded(false)}>
              <Text className="text-[11px] text-primary font-poppins-semibold">‹ Compact view</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row mb-1">
            {dayLabels.map((label, i) => (
              <Text key={i} style={{ flex: 1, textAlign: "center", fontSize: 9, color: "#9ca3af", fontWeight: "600" }}>
                {label}
              </Text>
            ))}
          </View>
          {rows}
          <View className="mt-2"><Legend /></View>
        </>
      )}
    </View>
  );
}

function DetailRow({
  label,
  value,
  isPrimary,
  noBorder,
}: {
  label: string;
  value: string;
  isPrimary?: boolean;
  noBorder?: boolean;
}) {
  return (
    <View
      className={`flex-row justify-between items-start py-2 ${noBorder ? "" : "border-b border-neutral-100 dark:border-darkBorder"}`}
    >
      <Text className="text-xs font-poppins text-neutral-400 flex-1">{label}</Text>
      <Text className={`text-xs font-poppins-semibold flex-2 text-right ${isPrimary ? "text-primary" : "text-neutral-900 dark:text-white"}`}>
        {value}
      </Text>
    </View>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <View className="flex-1 bg-white dark:bg-darkBackgroundMuted rounded-2xl p-3 items-center border border-neutral-100 dark:border-darkBorder">
      <View className="flex-row items-center gap-x-1.5">
        {icon}
        <Text className="text-lg font-poppins-bold text-neutral-900 dark:text-white">{value}</Text>
      </View>
      <Text className="text-[9px] font-poppins text-neutral-400 text-center mt-0.5">{label}</Text>
    </View>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-white dark:bg-darkBackgroundMuted rounded-3xl p-4 border border-neutral-100 dark:border-darkBorder">
      {children}
    </View>
  );
}

function SectionHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <View className="flex-row items-center gap-x-2 mb-3">
      {icon}
      <Text className="text-sm font-poppins-semibold text-neutral-900 dark:text-white">{title}</Text>
      {sub && <Text className="text-[11px] font-poppins text-neutral-400">{sub}</Text>}
    </View>
  );
}

export default function StoreStreakDetail() {
  const { storeId } = useLocalSearchParams<{ storeId?: string }>();
  const router = useRouter();
  const { t: translate } = useTranslation();
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadStreak = async () => {
      if (!storeId) {
        setStreak(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) {
          if (!cancelled) {
            setStreak(null);
          }
          return;
        }

        const data = await getUserStreakByStore(user.id, Number(storeId));
        if (!cancelled) {
          setStreak(data);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadStreak();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const program = streak?.store_streaks;
  const storeStr = streak?.stores;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-primary">
        <Flame size={40} color="#FFFFFF" />
        <Text className="text-white font-poppins-medium text-sm mt-3">Loading streak…</Text>
      </View>
    );
  }

  if (!streak) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-background dark:bg-darkBackground">
        <Flame size={48} color="#d1d5db" />
        <Text className="text-base font-poppins-semibold text-neutral-700 dark:text-neutral-300 mt-3">
          No streak found
        </Text>
        <Text className="text-xs font-poppins text-neutral-500 mt-2 text-center">
          This store does not have an active streak program available for your account.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-5 px-6 py-2.5 border border-primary rounded-full"
        >
          <Text className="text-primary font-poppins-semibold text-sm">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const streakDays = streak.streak_days ?? 0;
  const targetDays = program?.streak_length ?? 7;
  const progress = targetDays > 0 ? Math.min(streakDays / targetDays, 1) : 0;
  const daysLeft = Math.max(targetDays - streakDays, 0);
  const isCompleted = streak.status === "completed";
  const storeName = storeStr?.name ?? translate("user.rewards.store");

  const getLogoImage = () => {
    if (storeStr?.logo) return { uri: storeStr.logo };
    if (streak.store_id && storeLogos[String(streak.store_id)]) {
      return storeLogos[String(streak.store_id)];
    }
    return null;
  };

  const logoImage = getLogoImage();
  const pointsPerDay = program?.points_mode === "incremental"
    ? `${Number(program.starting_points ?? 0)} +${Number(program.increment_value ?? 0)}/day`
    : `${Number(program?.fixed_points_per_day ?? 0)} pts/day`;

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-darkBackground"
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="bg-white dark:bg-darkBackgroundMuted flex-row items-center px-4 pt-12 pb-3 border-b border-neutral-100 dark:border-darkBorder">
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
          <ChevronLeft size={24} color="#FF6600" />
        </TouchableOpacity>
        <Text className="text-base font-poppins-semibold text-neutral-900 dark:text-white">
          Streak Log
        </Text>
      </View>

      <View className="bg-white dark:bg-darkBackgroundMuted mx-4 mt-4 rounded-2xl border border-neutral-100 dark:border-darkBorder overflow-hidden">
        <View className="flex-row">
          <View className="w-1.5 bg-primary" />
          <View className="flex-row items-center gap-x-3 p-3.5 flex-1">
            <View className="w-11 h-11 rounded-full bg-orange-50 items-center justify-center overflow-hidden border border-orange-100">
              {logoImage ? (
                <Image source={logoImage} className="w-full h-full" contentFit="cover" />
              ) : (
                <Store size={20} color="#FF6600" />
              )}
            </View>
            <View className="flex-1 justify-center">
              <Text className="font-poppins-semibold text-neutral-900 dark:text-white text-base leading-tight" numberOfLines={1}>
                {storeName}
              </Text>
              {program?.title && (
                <Text className="font-poppins text-neutral-500 text-xs mt-0.5" numberOfLines={1}>
                  {program.title}
                </Text>
              )}
            </View>
          </View>
        </View>

        {Number(program?.completion_bonus_points ?? 0) > 0 ? (
          <View className="bg-orange-50/60 dark:bg-darkPrimaryBgMuted/40 px-4 py-2.5 flex-row items-center justify-between border-t border-orange-100/50 dark:border-darkPrimaryBorder/50">
            <Text className="text-[11px] font-poppins text-neutral-600 dark:text-neutral-400">
              Complete streak to earn
            </Text>
            <View className="flex-row items-center gap-x-1.5">
              <Gem size={12} color="#FF6600" />
              <Text className="text-xs font-poppins-bold text-primary">
                +{Number(program.completion_bonus_points)} Bonus
              </Text>
            </View>
          </View>
        ) : program?.reward_description ? (
          <View className="bg-orange-50/60 dark:bg-darkPrimaryBgMuted/40 px-4 py-2.5 flex-row items-center justify-between border-t border-orange-100/50 dark:border-darkPrimaryBorder/50">
            <Text className="text-[11px] font-poppins text-neutral-600 dark:text-neutral-400">
              Complete streak to unlock
            </Text>
            <View className="flex-row items-center gap-x-1.5">
              <Gem size={12} color="#FF6600" />
              <Text className="text-xs font-poppins-bold text-primary">Reward</Text>
            </View>
          </View>
        ) : null}
      </View>

      <View className="bg-white dark:bg-darkBackgroundMuted mx-4 mt-3 rounded-2xl border border-neutral-100 dark:border-darkBorder items-center py-6">
        <ProgressRing
          progress={progress}
          size={150}
          strokeWidth={14}
          streakDays={streakDays}
          targetDays={targetDays}
        />
        <View
          className={`flex-row items-center gap-x-1 mt-4 px-4 py-1.5 rounded-full ${
            isCompleted ? "bg-green-50" : "bg-orange-50"
          }`}
        >
          {isCompleted ? <CircleCheck size={13} color="#16a34a" /> : null}
          <Text
            className={`text-[11px] font-poppins-semibold ml-0.5 ${
              isCompleted ? "text-green-700" : "text-primary"
            }`}
          >
            {isCompleted
              ? "Streak Completed!"
              : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} to go`}
          </Text>
        </View>
      </View>

      <View className="px-4 pt-3 pb-4 gap-y-3">
        <View className="flex-row gap-x-2.5">
          <StatCard
            label="Current Streak"
            value={`${streakDays}${getOrdinalSuffix(streakDays)}`}
            icon={<Flame size={16} color="#FF6600" />}
          />
          <StatCard
            label="Target Days"
            value={`${targetDays}`}
            icon={<Crosshair size={16} color="#6366f1" />}
          />
          <StatCard
            label="Pts Earned"
            value={`${Number(streak.points_earned ?? 0)}`}
            icon={<Star size={16} color="#f59e0b" />}
          />
        </View>

        {((!isCompleted && daysLeft > 0) || Number(program?.completion_bonus_points ?? 0) > 0) && (
          <View className="bg-white dark:bg-darkBackgroundMuted rounded-3xl border border-neutral-100 dark:border-darkBorder overflow-hidden">
            {!isCompleted && daysLeft > 0 && (
              <View className="flex-row items-center gap-x-2.5 p-4">
                <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center">
                  <TrendingUp size={18} color="#FF6600" />
                </View>
                <View className="flex-1">
                  <Text className="text-[13px] font-poppins-semibold text-neutral-900 dark:text-white">
                    {daysLeft === 1
                      ? "One more visit and you're done!"
                      : `${daysLeft} more visits to complete your streak`}
                  </Text>
                  <Text className="text-[11px] font-poppins text-neutral-500 mt-0.5">
                    Come within range of {storeName} to earn your next streak day.
                  </Text>
                </View>
              </View>
            )}

            {!isCompleted && daysLeft > 0 && Number(program?.completion_bonus_points ?? 0) > 0 && (
              <View className="h-px bg-neutral-100 dark:bg-darkBorder" />
            )}

            {Number(program?.completion_bonus_points ?? 0) > 0 && (
              <View className="flex-row items-center justify-end gap-x-3 px-4 py-3">
                <View className="flex-row items-center gap-x-2">
                  <Gem size={28} color="#FF6600" />
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#FF6600", lineHeight: 17 }}>
                      {Number(program.completion_bonus_points)} bonus pts
                    </Text>
                    {!isCompleted && (
                      <Text style={{ fontSize: 10, color: "#FF6600", opacity: 0.6, lineHeight: 14 }}>
                        earn on completion
                      </Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  disabled={!isCompleted}
                  activeOpacity={0.75}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: isCompleted ? "#FF6600" : "#f3f4f6",
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "700", color: isCompleted ? "#FFFFFF" : "#c1c1c1" }}>
                    {isCompleted ? "Claim" : "Locked"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <SectionCard>
          <SectionHeader
            icon={<CalendarDays size={16} color="#FF6600" />}
            title="Recent Activity"
            sub="(last 14 days)"
          />
          <RecentActivityCalendar
            streakDays={streakDays}
            lastActivityDate={streak.last_activity_date}
          />
        </SectionCard>

        <SectionCard>
          <SectionHeader
            icon={<Star size={16} color="#FF6600" />}
            title="Program Details"
          />
          <DetailRow label="Points mode" value={program?.points_mode ?? "fixed"} />
          <DetailRow label="Daily earning" value={pointsPerDay} />
          <DetailRow
            label="Bonus reward"
            value={Number(program?.completion_bonus_points ?? 0) > 0
              ? `${Number(program?.completion_bonus_points ?? 0)} pts`
              : (program?.reward_description ?? "None")}
          />
          <DetailRow
            label="Program status"
            value={program?.status ?? streak.status ?? "in_progress"}
            isPrimary
            noBorder
          />
        </SectionCard>
      </View>
    </ScrollView>
  );
}
