import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, useColorScheme } from "react-native";
import { View, Text, TouchableOpacity, TextInput } from "@/tw";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStreakStore } from "@/store/store-manager/streak-store";
import { createStreak, getAllStreaksByStoreId, getStreakProgramById, updateStreakProgram } from "@/services/store-manager/streak-service";
import { PointsMode, Streak } from "@/type/store-manager/streak";
import { Button } from "@/components/button";
import { Modal } from "@/components/modal";
import { Coins, TrendingUp, Check, Info } from "lucide-react-native";
import { AppHeader } from "@/components/header";
import { TextField } from "@/components/text-field";
import { Toggle } from "@/components/toggle";
import { formatDateTime } from "@/utils/store_manager/streak-utils";

export default function ConfigureStreaks() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId, streakId } = useLocalSearchParams<{ storeId: string; streakId?: string }>();
  const isEditMode = !!streakId;
  const {
    points_mode, setPointsMode,
    fixed_points_per_day, setFixedPointsPerDay,
    starting_points, setStartingPoints,
    increment_value, setIncrementValue,
    streak_length, setStreakLength,
    max_days_cap,  setMaxDaysCap,
    reward_description, setRewardDescription,
    start_at, setStartAt,
    min_start_at, setMinStartAt,
    showStartDatePicker, setShowStartDatePicker,
    showStartTimePicker, setShowStartTimePicker,
    isSubmitting, setIsSubmitting,
    modal, setModal,
    reset,
  } = useStreakStore();

  const [scheduleEnabled, setScheduleEnabled] = React.useState(true);
  const [hasActiveProgramBarrier, setHasActiveProgramBarrier] = React.useState(false);
  const isFixed = points_mode === "fixed";
  const activationAt = start_at ? new Date(start_at) : new Date();
  const isActivationValid = start_at ? !Number.isNaN(activationAt.getTime()) : false;
  const activationDateText = isActivationValid
    ? activationAt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "Select date";
  const activationTimeText = isActivationValid
    ? activationAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : "Select time";
  const minActivationAt = min_start_at ? new Date(min_start_at) : new Date();

  const computeMinStartAtFromActive = (active: Streak | undefined) => {
    const now = new Date();
    if (!active) return now;

    if (active.end_date) {
      const endOfDay = new Date(`${active.end_date}T23:59:59.999Z`);
      return endOfDay > now ? endOfDay : now;
    }

    if (active.start_at && active.streak_length && active.streak_length > 0) {
      const derivedEnd = new Date(active.start_at);
      derivedEnd.setDate(derivedEnd.getDate() + active.streak_length);
      return derivedEnd > now ? derivedEnd : now;
    }

    return now;
  };

  useFocusEffect(
    React.useCallback(() => {
      if (!storeId) return;
      getAllStreaksByStoreId(storeId)
        .then((rows) => {
          const active = rows.find((s) => s.status === "active");
          setHasActiveProgramBarrier(!!active);
          const minAllowed = computeMinStartAtFromActive(active);
          setMinStartAt(minAllowed.toISOString());
          const currentStart = useStreakStore.getState().start_at;
          if (currentStart && new Date(currentStart) < minAllowed) {
            setStartAt(minAllowed.toISOString());
          }
        })
        .catch(() => {
          const now = new Date();
          setHasActiveProgramBarrier(false);
          setMinStartAt(now.toISOString());
        });

      if (!isEditMode || !streakId) return;
      getStreakProgramById(Number(streakId))
        .then((row) => {
          if (!row) throw new Error("Streak program not found.");
          if (row.status !== "draft") throw new Error("Only draft streak programs can be edited.");

          setPointsMode((row.points_mode as PointsMode) ?? "fixed");
          setFixedPointsPerDay(row.fixed_points_per_day ?? null);
          setStartingPoints(row.starting_points ?? null);
          setIncrementValue(row.increment_value ?? null);
          setStreakLength(row.streak_length ?? 0);
          setMaxDaysCap(row.max_days_cap ?? null);
          setRewardDescription(row.reward_description ?? "");
          setStartAt(row.start_at ?? null);
          setScheduleEnabled(!!row.start_at);
        })
        .catch((error) => {
          setModal({
            title: "Error",
            message: (error as Error).message ?? "Failed to load streak program.",
            buttons: [{
              label: "OK",
              onPress: () => {
                setModal(null);
                router.push({ pathname: "/(store_manager)/streak", params: { storeId } });
              },
            }],
          });
        });
    }, [
      storeId,
      streakId,
      isEditMode,
      setMinStartAt,
      setStartAt,
      setPointsMode,
      setFixedPointsPerDay,
      setStartingPoints,
      setIncrementValue,
      setStreakLength,
      setMaxDaysCap,
      setRewardDescription,
      setModal,
      router,
    ]),
  );

  const updateStartAtDate = (date: Date) => {
    const base = start_at ? new Date(start_at) : new Date();
    base.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    if (base < minActivationAt) {
      setStartAt(minActivationAt.toISOString());
      return;
    }
    setStartAt(base.toISOString());
  };

  const updateStartAtTime = (time: Date) => {
    const base = start_at ? new Date(start_at) : new Date();
    base.setHours(time.getHours(), time.getMinutes(), 0, 0);
    if (base < minActivationAt) {
      setStartAt(minActivationAt.toISOString());
      return;
    }
    setStartAt(base.toISOString());
  };

  const handleSave = async () => {
    if (!streak_length || streak_length < 1) {
      setModal({
        title: "Almost there!",
        message: "Streak length must be at least 1 day.",
        buttons: [{ label: "OK", onPress: () => setModal(null) }],
      });
      return;
    }
    if (isFixed && (!fixed_points_per_day || fixed_points_per_day < 1)) {
      setModal({
        title: "Almost there!",
        message: "Please enter a valid points per day amount.",
        buttons: [{ label: "OK", onPress: () => setModal(null) }],
      });
      return;
    }
    if (!isFixed && (!starting_points || starting_points < 1)) {
      setModal({
        title: "Almost there!",
        message: "Please enter a valid starting points amount.",
        buttons: [{ label: "OK", onPress: () => setModal(null) }],
      });
      return;
    }
    if (!isFixed && (!increment_value || increment_value < 1)) {
      setModal({
        title: "Almost there!",
        message: "Please enter a valid increment per day.",
        buttons: [{ label: "OK", onPress: () => setModal(null) }],
      });
      return;
    }
    if (scheduleEnabled) {
      if (start_at && new Date(start_at) < minActivationAt) {
        setModal({
          title: "Almost there!",
          message: `Start time must be after ${minActivationAt.toLocaleString()}.`,
          buttons: [{ label: "OK", onPress: () => setModal(null) }],
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const startAtPayload = scheduleEnabled ? start_at : null;

      if (isEditMode && streakId) {
        await updateStreakProgram(Number(streakId), {
          points_mode,
          start_at: startAtPayload,
          fixed_points_per_day: isFixed ? (fixed_points_per_day ?? 10) : null,
          starting_points: !isFixed ? starting_points : null,
          increment_value: !isFixed ? increment_value : null,
          streak_length,
          max_days_cap,
          reward_description,
        });
      } else {
        await createStreak({
          store_id: storeId,
          points_mode,
          status: "draft",
          start_at: startAtPayload,
          fixed_points_per_day: isFixed ? (fixed_points_per_day ?? 10) : null,
          starting_points: !isFixed ? starting_points : null,
          increment_value: !isFixed ? increment_value : null,
          streak_length,
          max_days_cap,
          reward_description,
        });
        reset();
      }
      setModal({
        title: "Success",
        message: isEditMode ? "Streak program updated successfully" : "Streak configuration saved successfully",
        buttons: [{
          label: "OK",
          onPress: () => {
            setModal(null);
            router.push({ pathname: "/(store_manager)/streak", params: { storeId } });
          },
        }],
      });
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

  const handleScheduleToggle = (enabled: boolean) => {
    if (enabled) {
      setScheduleEnabled(true);
      if (!start_at) {
        setStartAt(minActivationAt.toISOString());
      }
    } else {
      setScheduleEnabled(false);
      setStartAt(null);
      setShowStartDatePicker(false);
      setShowStartTimePicker(false);
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
        <AppHeader
          title={isEditMode ? "Edit Streak Program" : "New Streak Program"}
          paddingTop={insets.top + 8}
          onBackPress={() => {
            router.push({ pathname: "/(store_manager)/streak", params: { storeId } });
          }}
        />
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 20 }}
        >
          <View className="bg-white dark:bg-slate-900 rounded-xl p-4 gap-y-4">
          <View>
            <Text className="text-md font-poppins-bold text-slate-900 dark:text-slate-100">
              How earning works
            </Text>
            <Text className="text-sm font-poppins text-slate-500 dark:text-slate-400 mt-1">
              Set points, streak length, and start date. Customers earn by visiting on consecutive days.
            </Text>
          </View>

          {/* Points mode toggle */}
          <View className="gap-y-2">
            <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
              Points Type
            </Text>
            <View className="flex-row gap-x-2">
              {([
                { key: "fixed" as PointsMode, label: "Fixed", icon: <Coins size={14} />, desc: "Same points every day" },
                { key: "incremental" as PointsMode, label: "Incremental", icon: <TrendingUp size={14} />, desc: "Points grow each day" },
              ]).map((opt) => {
                const selected = points_mode === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    activeOpacity={0.8}
                    onPress={() => setPointsMode(opt.key)}
                    className={`flex-1 rounded-xl border p-3 gap-y-1 bg-white ${
                      selected
                        ? "border border-primary"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className={`w-4 h-4 rounded-full border-2 items-center justify-center ${selected ? "border-primary bg-primary" : "border-slate-300 dark:border-slate-600"}`}>
                        {selected && <Check size={9} color="#fff" />}
                      </View>
                    </View>
                    <Text className="text-sm font-poppins-semibold mt-1 text-textPrimary">
                      {opt.label}
                    </Text>
                    <Text className="text-xs font-poppins text-textMuted">
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
              <TextField
                label="Points per Day"
                placeholder="e.g. 10"
                keyboardType="decimal-pad"
                value={fixed_points_per_day != null ? String(fixed_points_per_day) : ""}
                onChangeText={(v) => {
                  const parsed = parseFloat(v);
                  setFixedPointsPerDay(!isNaN(parsed) ? parsed : null);
                }}
                required
              />
            </View>
          )}

          {!isFixed && (
            <View className="flex-row gap-x-3">
              <View className="flex-1 gap-y-2">
                <TextField
                  label="Start Point"
                  placeholder="e.g. 5"
                  keyboardType="decimal-pad"
                  value={starting_points != null ? String(starting_points) : ""}
                  onChangeText={(v) => {
                    const parsed = parseFloat(v);
                    setStartingPoints(!isNaN(parsed) ? parsed : null);
                  }}
                  required
                />
              </View>
              <View className="flex-1 gap-y-2">
                <TextField
                  label="Increment Per Day"
                  placeholder="e.g. 3"
                  keyboardType="decimal-pad"
                  value={increment_value != null ? String(increment_value) : ""}
                  onChangeText={(v) => {
                    const parsed = parseFloat(v);
                    setIncrementValue(!isNaN(parsed) ? parsed : null);
                  }}
                  required
                />
              </View>
            </View>
          )}

          <View className="gap-y-2">
            <TextField
              label="Streak Days Length"
              placeholder="e.g. 7"
              keyboardType="numeric"
              value={streak_length ? String(streak_length) : ""}
              onChangeText={(v) => setStreakLength(parseInt(v) || 0)}
              required
            />
          </View>

          {/* Max days cap */}
          <View className="gap-y-2">
            <TextField
              label="Max Days Cap"
              placeholder="e.g. 30"
              keyboardType="numeric"
              value={max_days_cap ? String(max_days_cap) : ""}
              onChangeText={(v) => setMaxDaysCap(v ? parseInt(v) : null)}
            />
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
              style={{ textAlignVertical: "top", minHeight: 88, paddingLeft: 12, fontSize: 13 }}
            />
          </View>

          {/* Activation schedule */}
          <View className="gap-y-2">
            <View className="flex-row items-center justify-between gap-x-3">
              <View className="flex-1">
                <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
                  Activation Schedule
                </Text>
                <Text className="text-xs font-poppins text-slate-500 dark:text-slate-400 mt-0.5">
                  Set when this streak should activate automatically.
                </Text>
              </View>
              <Toggle value={scheduleEnabled} onValueChange={handleScheduleToggle} size="sm" />
            </View>

            {hasActiveProgramBarrier && (
              <View className="rounded-xl bg-amber-50 dark:bg-amber-900/20 px-3 py-3 my-2 flex-row gap-x-2">
                <Info size={14} color="#D97706" />
                <Text className="text-xs font-poppins text-amber-900 dark:text-amber-200 flex-1">
                  This store already has an active streak. You can only schedule activation after it ends. Earliest:{" "}
                  {formatDateTime(minActivationAt.toISOString())}.
                </Text>
              </View>
            )}

            {scheduleEnabled && (
              <>
                <View className="flex-row gap-x-2">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      setShowStartTimePicker(false);
                      setShowStartDatePicker(true);
                    }}
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-3"
                  >
                    <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">Date</Text>
                    <Text className="text-sm font-poppins-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                      {activationDateText}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      setShowStartDatePicker(false);
                      setShowStartTimePicker(true);
                    }}
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-3"
                  >
                    <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">Time</Text>
                    <Text className="text-sm font-poppins-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                      {activationTimeText}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showStartDatePicker && (
                  <DateTimePicker
                    value={activationAt}
                    minimumDate={minActivationAt}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    onChange={(_, selectedDate) => {
                      if (selectedDate) updateStartAtDate(selectedDate);
                      if (Platform.OS !== "ios") setShowStartDatePicker(false);
                    }}
                  />
                )}
                {showStartTimePicker && (
                  <DateTimePicker
                    value={activationAt}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(_, selectedTime) => {
                      if (selectedTime) updateStartAtTime(selectedTime);
                      if (Platform.OS !== "ios") setShowStartTimePicker(false);
                    }}
                  />
                )}
              </>
            )}
          </View>

          {/* Actions */}
          <View className="gap-y-3 mt-3">
            <Button
              label={isEditMode ? "Save Changes" : "Save as Draft"}
              onPress={handleSave}
              disabled={isSubmitting}
              loading={isSubmitting}
              fullWidth={true}
              variant="primary"
            />
            <Button
              label="Cancel"
              onPress={() => {
                router.push({ pathname: "/(store_manager)/streak", params: { storeId } });
              }}
              disabled={isSubmitting}
              fullWidth={true}
              variant="secondary"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
