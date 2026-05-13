import React, { createElement as domEl, useEffect, useMemo, useRef } from "react";
import { Platform, ScrollView, useColorScheme } from "react-native";
import { View, Text, TouchableOpacity, TextInput, SafeAreaView } from "@/tw";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useStreakStore } from "@/store/store-manager/streak-store";
import { createStreak, getAllStreaksByStoreId, getStreakProgramById, updateStreakProgram } from "@/services/store-manager/streak-service";
import { PointsMode, Streak } from "@/type/store-manager/streak";
import { Button } from "@/components/button";
import { Modal } from "@/components/modal";
import { Coins, TrendingUp, Check, Info } from "lucide-react-native";
import { AppHeader } from "@/components/header";
import { TextField } from "@/components/text-field";
import { Toggle } from "@/components/toggle";
import { formatDateTime, computeMinStartAtFromActiveProgram } from "@/utils/store_manager/streak-utils";
import { resolveStreakErrorI18nKey } from "@/services/store-manager/streak-user-messages";
import { useTranslation } from "react-i18next";
import { useStorePremiumCampaignEdit } from "@/hooks/store-manager/use-store-premium-campaign-edit";
import { WebStreakActivationCalendar } from "@/components/store_manager/streak/web-streak-activation-calendar";

const MS_24H = 24 * 60 * 60 * 1000;

function defaultScheduleStart(minBound: Date): Date {
  const in24h = new Date(Date.now() + MS_24H);
  return in24h > minBound ? in24h : new Date(minBound);
}

function formatLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const WEB_MINUTE_STEP = 5;

function snapMinuteToStep(m: number): number {
  const rounded = Math.round(m / WEB_MINUTE_STEP) * WEB_MINUTE_STEP;
  return Math.min(55, Math.max(0, rounded));
}

export default function ConfigureStreaks() {
  const { t: translate } = useTranslation();
  const router = useRouter();
  const { storeId, streakId } = useLocalSearchParams<{ storeId: string; streakId?: string }>();
  const isEditMode = !!streakId;
  const isWeb = Platform.OS === "web";
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
    streakLengthError, setStreakLengthError,
    fixedPointsError, setFixedPointsError,
    startingPointsError, setStartingPointsError,
    incrementError, setIncrementError,
    maxDaysCapError, setMaxDaysCapError,
    reset,
  } = useStreakStore();

  const [scheduleEnabled, setScheduleEnabled] = React.useState(!isEditMode);
  const [startTimeError, setStartTimeError] = React.useState(false);
  const [hasActiveProgramBarrier, setHasActiveProgramBarrier] = React.useState(false);
  const createDefaultsAppliedRef = useRef(false);
  const colorScheme = useColorScheme();
  const isDarkScheme = colorScheme === "dark";
  const { canEdit, loading: permLoading } = useStorePremiumCampaignEdit(storeId);
  const isFixed = points_mode === "fixed";
  const activationAt = start_at ? new Date(start_at) : new Date();
  const isActivationValid = start_at ? !Number.isNaN(activationAt.getTime()) : false;
  const activationDateText = isActivationValid
    ? activationAt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : translate("storeManager.streakConfigure.selectDate");
  const activationTimeText = isActivationValid
    ? activationAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : translate("storeManager.streakConfigure.selectTime");
  const minActivationAt = min_start_at ? new Date(min_start_at) : new Date();

  useEffect(() => {
    createDefaultsAppliedRef.current = false;
  }, [storeId, streakId, isEditMode]);

  const webSelectStyle = useMemo(
    () =>
      ({
        width: "100%",
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: isDarkScheme ? "#334155" : "#e2e8f0",
        fontSize: 14,
        fontFamily: "Poppins-Medium",
        backgroundColor: isDarkScheme ? "#0f172a" : "#ffffff",
        color: isDarkScheme ? "#f1f5f9" : "#0f172a",
      }) as const,
    [isDarkScheme],
  );

  const webMinuteOptions = useMemo(() => {
    const opts: number[] = [];
    for (let m = 0; m < 60; m += WEB_MINUTE_STEP) opts.push(m);
    return opts;
  }, []);

  const webDateSelectValue = useMemo(() => {
    if (isActivationValid) return formatLocalDateKey(activationAt);
    const min = minActivationAt;
    const start = new Date(min.getFullYear(), min.getMonth(), min.getDate());
    return formatLocalDateKey(start);
  }, [isActivationValid, activationAt, minActivationAt]);

  const webHourSelectValue = useMemo(() => {
    if (isActivationValid) return activationAt.getHours();
    return defaultScheduleStart(minActivationAt).getHours();
  }, [isActivationValid, activationAt, minActivationAt]);

  const webMinuteSelectValue = useMemo(() => {
    if (isActivationValid) return snapMinuteToStep(activationAt.getMinutes());
    return snapMinuteToStep(defaultScheduleStart(minActivationAt).getMinutes());
  }, [isActivationValid, activationAt, minActivationAt]);

  const combineScheduleLocal = (dayKey: string, hour: number, minute: number): Date => {
    const [y, mo, d] = dayKey.split("-").map(Number);
    const candidate = new Date(y, mo - 1, d, hour, minute, 0, 0);
    if (candidate.getTime() < minActivationAt.getTime()) {
      return new Date(minActivationAt);
    }
    return candidate;
  };

  useEffect(() => {
    if (!storeId || permLoading || canEdit) return;
    router.replace({ pathname: "/(store_manager)/streak", params: { storeId } });
  }, [storeId, permLoading, canEdit, router]);

  useFocusEffect(
    React.useCallback(() => {
      if (!storeId) return;
      getAllStreaksByStoreId(storeId)
        .then((rows) => {
          const active = rows.find((s) => s.status === "active");
          setHasActiveProgramBarrier(!!active);
          const minAllowed = computeMinStartAtFromActiveProgram(active);
          setMinStartAt(minAllowed.toISOString());

          if (!isEditMode && !createDefaultsAppliedRef.current) {
            createDefaultsAppliedRef.current = true;
            setScheduleEnabled(true);
            const def = defaultScheduleStart(minAllowed);
            setStartAt(def.toISOString());
            return;
          }

          const currentStart = useStreakStore.getState().start_at;
          if (currentStart && new Date(currentStart) < minAllowed) {
            setStartAt(minAllowed.toISOString());
          }
        })
        .catch(() => {
          const now = new Date();
          setHasActiveProgramBarrier(false);
          setMinStartAt(now.toISOString());
          if (!isEditMode && !createDefaultsAppliedRef.current) {
            createDefaultsAppliedRef.current = true;
            setScheduleEnabled(true);
            setStartAt(defaultScheduleStart(now).toISOString());
          }
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
          const key = resolveStreakErrorI18nKey(error);
          const message =
            key != null ? translate(key) : ((error as Error).message ?? translate("storeManager.streakConfigure.loadError"));
          setModal({
            title: translate("label.error"),
            message,
            buttons: [{
              label: translate("label.ok"),
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
      setStartTimeError(false);
      return;
    }
    setStartAt(base.toISOString());
    setStartTimeError(false);
  };

  const updateStartAtTime = (time: Date) => {
    const base = start_at ? new Date(start_at) : new Date();
    base.setHours(time.getHours(), time.getMinutes(), 0, 0);
    if (base < minActivationAt) {
      setStartAt(minActivationAt.toISOString());
      setStartTimeError(false);
      return;
    }
    setStartAt(base.toISOString());
    setStartTimeError(false);
  };

  const handleSave = async () => {
    const hasStreakLengthError = !streak_length || streak_length < 1;
    const hasFixedPointsError = isFixed && (!fixed_points_per_day || fixed_points_per_day < 1);
    const hasStartingPointsError = !isFixed && (!starting_points || starting_points < 1);
    const hasIncrementError = !isFixed && (!increment_value || increment_value < 1);
    const hasMaxDaysCapError = !!max_days_cap && !!streak_length && max_days_cap > streak_length;
    setStreakLengthError(hasStreakLengthError);
    setFixedPointsError(hasFixedPointsError);
    setStartingPointsError(hasStartingPointsError);
    setIncrementError(hasIncrementError);
    setMaxDaysCapError(hasMaxDaysCapError);
    if (hasStreakLengthError || hasFixedPointsError || hasStartingPointsError || hasIncrementError || hasMaxDaysCapError) return;

    if (scheduleEnabled && start_at && new Date(start_at) < minActivationAt) {
      setStartTimeError(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const startAtPayload = scheduleEnabled ? start_at : null;
      const computeEndDate = (startIso: string | null, cap: number | null): string | null => {
        if (!startIso || !cap || cap < 1) return null;
        const d = new Date(startIso);
        d.setDate(d.getDate() + cap);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };
      const endDatePayload = computeEndDate(startAtPayload, max_days_cap);

      if (isEditMode && streakId) {
        await updateStreakProgram(Number(streakId), {
          points_mode,
          start_at: startAtPayload,
          end_date: endDatePayload,
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
          end_date: endDatePayload,
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
        title: translate("label.success"),
        message: isEditMode ? translate("storeManager.streakConfigure.successUpdate") : translate("storeManager.streakConfigure.successCreate"),
        buttons: [{
          label: translate("label.ok"),
          onPress: () => {
            setModal(null);
            router.push({ pathname: "/(store_manager)/streak", params: { storeId } });
          },
        }],
      });
    } catch (error) {
      const key = resolveStreakErrorI18nKey(error);
      const message =
        key != null ? translate(key) : ((error as Error).message ?? translate("storeManager.streakConfigure.saveFailed"));
      setModal({
        title: translate("label.error"),
        message,
        buttons: [{ label: translate("label.ok"), onPress: () => setModal(null) }],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScheduleToggle = (enabled: boolean) => {
    if (enabled) {
      setScheduleEnabled(true);
      setStartTimeError(false);
      if (!start_at) {
        setStartAt(defaultScheduleStart(minActivationAt).toISOString());
      }
    } else {
      setScheduleEnabled(false);
      setStartTimeError(false);
      setStartAt(null);
      setShowStartDatePicker(false);
      setShowStartTimePicker(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-backgroundMuted dark:bg-[#111921]">
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
      />
        <AppHeader
          title={isEditMode ? translate("storeManager.streakConfigure.editTitle") : translate("storeManager.streakConfigure.newTitle")}
          onBackPress={() => {
            router.push({ pathname: "/(store_manager)/streak", params: { storeId } });
          }}
        />
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 32,
            gap: 20,
            ...(isWeb ? { alignItems: "center" as const } : {}),
          }}
        >
          <View
            style={{ width: "100%", maxWidth: isWeb ? 896 : undefined }}
            className="w-full"
          >
            <View className="bg-white dark:bg-slate-900 rounded-xl p-4 gap-y-4">
            <View>
              <Text className="text-md font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                {translate("storeManager.streakConfigure.howEarningWorks")}
              </Text>
              <Text className="text-sm font-poppins text-textSecondary dark:text-darkTextSecondary mt-1">
                {translate("storeManager.streakConfigure.howEarningWorksBody")}
              </Text>
            </View>

          {/* Points mode toggle */}
          <View className="gap-y-2">
            <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
              {translate("storeManager.streakConfigure.pointsType")}
            </Text>
            <View className="flex-row gap-x-2">
              {([
                { key: "fixed" as PointsMode, label: translate("label.fixed"), icon: <Coins size={14} />, desc: translate("storeManager.streakConfigure.fixedDesc") },
                { key: "incremental" as PointsMode, label: translate("storeManager.streakConfigure.incrementalTitle"), icon: <TrendingUp size={14} />, desc: translate("storeManager.streakConfigure.incrementalDesc") },
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
                      <View className={`w-4 h-4 rounded-full border items-center justify-center ${selected ? "border-primary bg-primary" : "border-slate-300 dark:border-slate-600"}`}>
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
                label={translate("storeManager.streakConfigure.pointsPerDay")}
                placeholder={translate("label.eg10Placeholder")}
                keyboardType="decimal-pad"
                value={fixed_points_per_day != null ? String(fixed_points_per_day) : ""}
                onChangeText={(v) => {
                  const parsed = parseFloat(v);
                  setFixedPointsPerDay(!isNaN(parsed) ? parsed : null);
                  if (!isNaN(parsed) && parsed >= 1) setFixedPointsError(false);
                }}
                required
                error={fixedPointsError}
              />
              {fixedPointsError && (
                <Text className="text-xs font-poppins text-red-500 dark:text-red-400 -mt-1">
                  {translate("storeManager.streakConfigure.fixedPointsInvalid")}
                </Text>
              )}
            </View>
          )}

          {!isFixed && (
            <View className="flex-row gap-x-3">
              <View className="flex-1 gap-y-2">
                <TextField
                  label={translate("storeManager.streakConfigure.startPoint")}
                  placeholder={translate("storeManager.streakConfigure.startPointPlaceholder")}
                  keyboardType="decimal-pad"
                  value={starting_points != null ? String(starting_points) : ""}
                  onChangeText={(v) => {
                    const parsed = parseFloat(v);
                    setStartingPoints(!isNaN(parsed) ? parsed : null);
                    if (!isNaN(parsed) && parsed >= 1) setStartingPointsError(false);
                  }}
                  required
                  error={startingPointsError}
                />
                {startingPointsError && (
                  <Text className="text-xs font-poppins text-red-500 dark:text-red-400 -mt-1">
                    {translate("storeManager.streakConfigure.startingPointsInvalid")}
                  </Text>
                )}
              </View>
              <View className="flex-1 gap-y-2">
                <TextField
                  label={translate("storeManager.streakConfigure.incrementPerDay")}
                  placeholder={translate("storeManager.streakConfigure.incrementPlaceholder")}
                  keyboardType="decimal-pad"
                  value={increment_value != null ? String(increment_value) : ""}
                  onChangeText={(v) => {
                    const parsed = parseFloat(v);
                    setIncrementValue(!isNaN(parsed) ? parsed : null);
                    if (!isNaN(parsed) && parsed >= 1) setIncrementError(false);
                  }}
                  required
                  error={incrementError}
                />
                {incrementError && (
                  <Text className="text-xs font-poppins text-red-500 dark:text-red-400 -mt-1">
                    {translate("storeManager.streakConfigure.incrementInvalid")}
                  </Text>
                )}
              </View>
            </View>
          )}

          <View className="gap-y-2">
            <TextField
              label={translate("storeManager.streakConfigure.streakDaysLength")}
              placeholder={translate("storeManager.streakConfigure.streakDaysPlaceholder")}
              keyboardType="numeric"
              value={streak_length ? String(streak_length) : ""}
              onChangeText={(v) => { const n = parseInt(v) || 0; setStreakLength(n); if (n >= 1) setStreakLengthError(false); }}
              required
              error={streakLengthError}
            />
            {streakLengthError && (
              <Text className="text-xs font-poppins text-red-500 dark:text-red-400 -mt-1">
                {translate("storeManager.streakConfigure.streakLengthInvalid")}
              </Text>
            )}
          </View>

          {/* Max days cap */}
          <View className="gap-y-2">
            <TextField
              label={translate("storeManager.streakConfigure.maxDaysCap")}
              placeholder={translate("storeManager.streakConfigure.maxDaysPlaceholder")}
              keyboardType="numeric"
              value={max_days_cap ? String(max_days_cap) : ""}
              onChangeText={(v) => {
                const n = v ? parseInt(v) : null;
                setMaxDaysCap(n);
                if (!n || !streak_length || n <= streak_length) setMaxDaysCapError(false);
              }}
              hint={streak_length && streak_length > 0 ? translate("storeManager.streakConfigure.maxDaysCapHint", { max: streak_length }) : undefined}
              error={maxDaysCapError}
            />
            {maxDaysCapError && (
              <Text className="text-xs font-poppins text-red-500 dark:text-red-400 -mt-1">
                {translate("storeManager.streakConfigure.maxDaysCapInvalid")}
              </Text>
            )}
          </View>

          {/* Reward description */}
          <View className="gap-y-2">
            <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
              {translate("storeManager.streakConfigure.rewardDescription")}
            </Text>
            <TextInput
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 text-base font-poppins text-slate-900 dark:text-slate-100"
              placeholder={translate("storeManager.streakConfigure.rewardDescriptionPlaceholder")}
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
                  {translate("storeManager.streakConfigure.activationSchedule")}
                </Text>
                <Text className="text-xs font-poppins text-slate-500 dark:text-slate-400 mt-0.5">
                  {translate("storeManager.streakConfigure.activationScheduleHint")}
                </Text>
              </View>
              <Toggle value={scheduleEnabled} onValueChange={handleScheduleToggle} size="sm" />
            </View>

            {hasActiveProgramBarrier && (
              <View className="rounded-xl bg-amber-50 dark:bg-amber-900/20 px-3 py-3 my-2 flex-row gap-x-2">
                <Info size={14} color="#D97706" />
                <Text className="text-xs font-poppins text-amber-900 dark:text-amber-200 flex-1">
                  {translate("storeManager.streakConfigure.barrierInfo", { date: formatDateTime(minActivationAt.toISOString()) })}
                </Text>
              </View>
            )}

            {scheduleEnabled && (
              <>
                {isWeb ? (
                  <View className="gap-y-3">
                    <View className="gap-y-1">
                      <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
                        {translate("storeManager.streakConfigure.date")}
                      </Text>
                      <WebStreakActivationCalendar
                        minActivationAt={minActivationAt}
                        selectedDateKey={webDateSelectValue}
                        isDark={isDarkScheme}
                        onSelectDateKey={(dayKey) => {
                          const merged = combineScheduleLocal(
                            dayKey,
                            webHourSelectValue,
                            webMinuteSelectValue,
                          );
                          setStartAt(merged.toISOString());
                          setStartTimeError(false);
                        }}
                      />
                    </View>
                    <View className="gap-y-1">
                      <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
                        {translate("storeManager.streakConfigure.time")}
                      </Text>
                      <View className="flex-row gap-x-2">
                        <View className="flex-1">
                          {domEl(
                            "select",
                            {
                              value: String(webHourSelectValue),
                              onChange: (e: { target: { value: string } }) => {
                                const h = Number(e.target.value);
                                const merged = combineScheduleLocal(
                                  webDateSelectValue,
                                  h,
                                  webMinuteSelectValue,
                                );
                                setStartAt(merged.toISOString());
                                setStartTimeError(false);
                              },
                              style: webSelectStyle,
                            },
                            Array.from({ length: 24 }, (_, h) =>
                              domEl(
                                "option",
                                { key: `h-${h}`, value: String(h) },
                                String(h).padStart(2, "0"),
                              ),
                            ),
                          )}
                        </View>
                        <View className="flex-1">
                          {domEl(
                            "select",
                            {
                              value: String(webMinuteSelectValue),
                              onChange: (e: { target: { value: string } }) => {
                                const mi = Number(e.target.value);
                                const merged = combineScheduleLocal(
                                  webDateSelectValue,
                                  webHourSelectValue,
                                  mi,
                                );
                                setStartAt(merged.toISOString());
                                setStartTimeError(false);
                              },
                              style: webSelectStyle,
                            },
                            webMinuteOptions.map((m) =>
                              domEl(
                                "option",
                                { key: `m-${m}`, value: String(m) },
                                String(m).padStart(2, "0"),
                              ),
                            ),
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                ) : (
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
                        <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
                          {translate("storeManager.streakConfigure.date")}
                        </Text>
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
                        <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
                          {translate("storeManager.streakConfigure.time")}
                        </Text>
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

                {startTimeError && (
                  <Text className="text-xs font-poppins text-red-500 dark:text-red-400 -mt-1">
                    {translate("storeManager.streakConfigure.startTimeAfter", { time: minActivationAt.toLocaleString() })}
                  </Text>
                )}
              </>
            )}
          </View>

          {/* Actions */}
          {isWeb ? (
            <View className="flex-row gap-x-3 justify-center items-center">
              <Button
                label={translate("storeManager.streakConfigure.cancel")}
                onPress={() => {
                  router.push({ pathname: "/(store_manager)/streak", params: { storeId } });
                }}
                disabled={isSubmitting}
                fullWidth={false}
                variant="secondary"
              />
              <Button
                label={isEditMode ? translate("storeManager.streakConfigure.saveChanges") : translate("storeManager.streakConfigure.saveDraft")}
                onPress={handleSave}
                disabled={isSubmitting}
                loading={isSubmitting}
                fullWidth={false}
                variant="primary"
              />
            </View>
          ) : (
            <View className="gap-y-3 mt-3">
              <Button
                label={isEditMode ? translate("storeManager.streakConfigure.saveChanges") : translate("storeManager.streakConfigure.saveDraft")}
                onPress={handleSave}
                disabled={isSubmitting}
                loading={isSubmitting}
                fullWidth={true}
                variant="primary"
              />
              <Button
                label={translate("storeManager.streakConfigure.cancel")}
                onPress={() => {
                  router.push({ pathname: "/(store_manager)/streak", params: { storeId } });
                }}
                disabled={isSubmitting}
                fullWidth={true}
                variant="secondary"
              />
            </View>
          )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
