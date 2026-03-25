import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, useColorScheme } from "react-native";
import { View, Text, TouchableOpacity, TextInput } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStreakStore } from "@/store/store-manager/streak-store";
import { createStreak } from "@/services/store-manager/streak-service";
import { PointsMode } from "@/type/store-manager/streak";
import { Button } from "@/components/button";
import { Modal, type ModalButton } from "@/components/modal";

export default function ConfigureStreaks() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState<{
    title: string;
    message: string;
    buttons: ModalButton[];
    timer?: boolean;
  } | null>(null);
  const {
    points_mode, setPointsMode,
    fixed_points_per_day, setFixedPointsPerDay,
    starting_points, setStartingPoints,
    increment_value, setIncrementValue,
    streak_length, setStreakLength,
    max_days_cap,  setMaxDaysCap,
    reward_description, setRewardDescription,
    reset,
  } = useStreakStore();

  const [rawPointsPerDay,   setRawPointsPerDay]   = useState(fixed_points_per_day != null ? String(fixed_points_per_day) : "");
  const [rawStartingPoints, setRawStartingPoints] = useState(starting_points  != null ? String(starting_points)  : "");
  const [rawIncrementValue, setRawIncrementValue] = useState(increment_value  != null ? String(increment_value)  : "");

  const isFixed = points_mode === "fixed";
  const previewDays = Math.min(Math.max(streak_length ?? 1, 1), 7);

  const handleSave = async () => {
    if (!streak_length || streak_length < 1) {
      setModal({
        title: "Validation Error",
        message: "Streak length must be at least 1 day.",
        buttons: [{ label: "OK", onPress: () => setModal(null) }],
      });
      return;
    }
    if (isFixed && (!fixed_points_per_day || fixed_points_per_day < 1)) {
      setModal({
        title: "Validation Error",
        message: "Please enter a valid points per day amount.",
        buttons: [{ label: "OK", onPress: () => setModal(null) }],
      });
      return;
    }
    if (!isFixed && (!starting_points || starting_points < 1)) {
      setModal({
        title: "Validation Error",
        message: "Please enter a valid starting points amount.",
        buttons: [{ label: "OK", onPress: () => setModal(null) }],
      });
      return;
    }
    if (!isFixed && (!increment_value || increment_value < 1)) {
      setModal({
        title: "Validation Error",
        message: "Please enter a valid increment per day.",
        buttons: [{ label: "OK", onPress: () => setModal(null) }],
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createStreak({
        store_id: storeId,
        points_mode,
        ...(isFixed ? { fixed_points_per_day: fixed_points_per_day ?? 10 } : {}),
        starting_points: !isFixed ? starting_points : null,
        increment_value: !isFixed ? increment_value : null,
        streak_length,
        max_days_cap,
        reward_description,
      });
      reset();
      setRawPointsPerDay("");
      setRawStartingPoints("");
      setRawIncrementValue("");
      setModal({
        title: "Success",
        message: "Streak configuration saved successfully",
        buttons: [{ label: "OK", onPress: () => router.push({ pathname: "/(store_manager)/view-streak", params: { storeId } }) }],
      });
      router.push({ pathname: "/(store_manager)/view-streak", params: { storeId } });
    } catch (error) {
      setModal({
        title: "Error",
        message: (error as Error).message ?? "Failed to save streak configuration",
        buttons: [{ label: "OK", onPress: () => setModal(null) }],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      className="bg-background dark:bg-[#111921]"
      behavior={Platform.OS === "android" ? "height" : "padding"}
    >
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
      />
      <View
        className="bg-background dark:bg-[#111921] border-b border-slate-200 dark:border-slate-800 flex-row items-center px-2"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
      >
        <TouchableOpacity
          className="w-10 h-10 rounded-full items-center justify-center"
          activeOpacity={0.7}
          onPress={() => router.push({ pathname: "/(store_manager)/view-store/[id]", params: { id: storeId } })}
        >
          <MaterialIcons name="chevron-left" size={22} color={isDark ? "#F1F5F9" : "#0F172A"} />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-[17px] font-poppins-bold text-slate-900 dark:text-slate-100 pr-10">
          Configure Streaks
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 20 }}
      >
        <View>
          <Text className="text-xl font-poppins-bold text-slate-900 dark:text-slate-100">
            Streak Rules
          </Text>
          <Text className="text-sm font-poppins text-slate-500 dark:text-slate-400 mt-1">
            Define how customers earn loyalty points through consecutive daily visits.
          </Text>
        </View>

        {/* Points mode toggle */}
        <View className="gap-y-2">
          <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
            Points Type
          </Text>
          <View className="flex-row gap-x-2">
            {([
              { key: "fixed" as PointsMode,       label: "Fixed",       icon: "monetization-on" as const, desc: "Same points every day" },
              { key: "incremental" as PointsMode, label: "Incremental", icon: "trending-up" as const,     desc: "Points grow each day" },
            ]).map((opt) => {
              const selected = points_mode === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  activeOpacity={0.8}
                  onPress={() => setPointsMode(opt.key)}
                  className={`flex-1 rounded-2xl border p-3 gap-y-1 ${
                    selected
                      ? "bg-primary/5 dark:bg-primary/10 border-primary/30"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className={`w-7 h-7 rounded-lg items-center justify-center ${selected ? "bg-primary/20" : "bg-slate-100 dark:bg-slate-700"}`}>
                      <MaterialIcons name={opt.icon} size={14} color={selected ? "#FF6600" : "#94A3B8"} />
                    </View>
                    <View className={`w-4 h-4 rounded-full border-2 items-center justify-center ${selected ? "border-primary bg-primary" : "border-slate-300 dark:border-slate-600"}`}>
                      {selected && <MaterialIcons name="check" size={9} color="#fff" />}
                    </View>
                  </View>
                  <Text className={`text-xs font-poppins-bold mt-1 ${selected ? "text-primary" : "text-slate-800 dark:text-slate-200"}`}>
                    {opt.label}
                  </Text>
                  <Text className={`text-[10px] font-poppins ${selected ? "text-primary/70" : "text-slate-400 dark:text-slate-500"}`}>
                    {opt.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Fixed: points per day */}
        {isFixed && (
          <View className="gap-y-2">
            <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
              Points per Day
            </Text>
            <View className="relative">
              <TextInput
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 text-base font-poppins text-slate-900 dark:text-slate-100 pr-12"
                  placeholder="e.g. 10"
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                  value={rawPointsPerDay}
                  onChangeText={(v) => {
                    setRawPointsPerDay(v);
                    const parsed = parseFloat(v);
                    setFixedPointsPerDay(!isNaN(parsed) ? parsed : null);
                  }}
                />
              <View className="absolute right-4 top-0 bottom-0 justify-center">
                <MaterialIcons name="monetization-on" size={20} color="#94A3B8" />
              </View>
            </View>
          </View>
        )}

        {/* Incremental: starting points + increment */}
        {!isFixed && (
          <View className="flex-row gap-x-3">
            <View className="flex-1 gap-y-2">
              <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
                Starting Points
              </Text>
              <View className="relative">
                <TextInput
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 text-base font-poppins text-slate-900 dark:text-slate-100 pr-12"
                  placeholder="e.g. 5"
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                  value={rawStartingPoints}
                  onChangeText={(v) => {
                    setRawStartingPoints(v);
                    const parsed = parseFloat(v);
                    setStartingPoints(!isNaN(parsed) ? parsed : null);
                  }}
                />
                <View className="absolute right-4 top-0 bottom-0 justify-center">
                  <MaterialIcons name="looks-one" size={18} color="#94A3B8" />
                </View>
              </View>
            </View>

            <View className="flex-1 gap-y-2">
              <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
                Increment / Day
              </Text>
              <View className="relative">
                <TextInput
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 text-base font-poppins text-slate-900 dark:text-slate-100 pr-12"
                  placeholder="e.g. 3"
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                  value={rawIncrementValue}
                  onChangeText={(v) => {
                    setRawIncrementValue(v);
                    const parsed = parseFloat(v);
                    setIncrementValue(!isNaN(parsed) ? parsed : null);
                  }}
                />
                <View className="absolute right-4 top-0 bottom-0 justify-center">
                  <MaterialIcons name="trending-up" size={18} color="#94A3B8" />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Streak length */}
        <View className="gap-y-2">
          <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
            Streak Length (Days)
          </Text>
          <View className="relative">
            <TextInput
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 text-base font-poppins text-slate-900 dark:text-slate-100 pr-12"
              placeholder="e.g. 7"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={streak_length ? String(streak_length) : ""}
              onChangeText={(v) => setStreakLength(parseInt(v) || 0)}
            />
            <View className="absolute right-4 top-0 bottom-0 justify-center">
              <MaterialIcons name="calendar-today" size={20} color="#94A3B8" />
            </View>
          </View>
        </View>

        {/* Max days cap */}
        <View className="gap-y-2">
          <View className="flex-row items-center gap-x-2">
            <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
              Max Days Cap
            </Text>
            <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">(Optional)</Text>
          </View>
          <View className="relative">
            <TextInput
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 text-base font-poppins text-slate-900 dark:text-slate-100 pr-12"
              placeholder="e.g. 30"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={max_days_cap ? String(max_days_cap) : ""}
              onChangeText={(v) => setMaxDaysCap(v ? parseInt(v) : null)}
            />
            <View className="absolute right-4 top-0 bottom-0 justify-center">
              <MaterialIcons name="event-repeat" size={20} color="#94A3B8" />
            </View>
          </View>
        </View>

        {/* Reward description */}
        <View className="gap-y-2">
          <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
            Reward Description
          </Text>
          <TextInput
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 text-base font-poppins text-slate-900 dark:text-slate-100"
            placeholder="Describe the benefit to the user..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            value={reward_description}
            onChangeText={setRewardDescription}
            style={{ textAlignVertical: "top", minHeight: 88 }}
          />
        </View>

        {/* Customer preview */}
        <View>
          <Text className="text-sm font-poppins-semibold ttext-slate-700 dark:text-slate-300 mb-3 px-1">
            Customer Preview
          </Text>
          <View className="bg-primary/3 rounded-xl p-5 flex-row gap-4 items-start">
            <View className="p-2 items-center justify-center">
              <MaterialIcons name="local-fire-department" size={24} color="#FF6600" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-poppins-bold text-primary">
                Daily Streak Active
              </Text>

              {isFixed ? (
                <>
                  <Text className="text-sm font-poppins text-slate-600 dark:text-slate-300 mt-1">
                    Earn{" "}
                    <Text className="font-poppins-bold text-slate-900 dark:text-slate-100">
                      {fixed_points_per_day ?? "—"} pts
                    </Text>
                    {" "}per day for{" "}
                    <Text className="font-poppins-bold text-slate-900 dark:text-slate-100">
                      {streak_length ?? "—"} days
                    </Text>
                    .
                  </Text>
                  <View className="flex-row gap-1 mt-4">
                    {Array.from({ length: previewDays }).map((_, i) => (
                      <View
                        key={i}
                        className="h-1.5 flex-1 rounded-full bg-primary/20"
                      />
                    ))}
                  </View>
                </>
              ) : (
                <>
                  <Text className="text-sm font-poppins text-slate-600 dark:text-slate-300 mt-1">
                    Starts at{" "}
                    <Text className="font-poppins-bold text-slate-900 dark:text-slate-100">
                      {starting_points ?? "—"} pts
                    </Text>
                    , increasing by{" "}
                    <Text className="font-poppins-bold text-slate-900 dark:text-slate-100">
                      {increment_value ?? "—"} pts
                    </Text>
                    {" "}each day.
                  </Text>
                  {/* Growing bar chart */}
                  <View className="flex-row gap-1 mt-4 items-end" style={{ height: 28 }}>
                    {Array.from({ length: previewDays }).map((_, i) => {
                      const heightPx = Math.round(8 + (i / Math.max(previewDays - 1, 1)) * 20);
                      return (
                        <View
                          key={i}
                          className="flex-1 rounded-t-sm bg-primary"
                          style={{ height: heightPx }}
                        />
                      );
                    })}
                  </View>
                  {/* Day labels */}
                  <View className="flex-row gap-1 mt-1">
                    {Array.from({ length: previewDays }).map((_, i) => {
                      const pts = (starting_points ?? 0) + (increment_value ?? 0) * i;
                      return (
                        <Text key={i} className="flex-1 text-center text-[8px] font-poppins text-primary/60">
                          {pts}
                        </Text>
                      );
                    })}
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className="gap-y-3 border-t border-slate-200 dark:border-slate-800 pt-3">
          <Button
            label="Save as Draft"
            onPress={handleSave}
            disabled={isSubmitting}
            loading={isSubmitting}
            fullWidth={true}
            variant="primary"
          />
          <Button
            label="Cancel"
            onPress={() => router.push({ pathname: "/(store_manager)/view-store/[id]", params: { id: storeId } })}
            disabled={isSubmitting}
            loading={isSubmitting}
            fullWidth={true}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
