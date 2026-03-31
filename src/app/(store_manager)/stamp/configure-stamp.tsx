import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { View, Text, TouchableOpacity, TextInput } from "@/tw";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useStampConfigureViewStore, useStampStore } from "@/store/store-manager/stamp-store";
import { createStamp, getStampProgramById, updateStampProgram } from "@/services/store-manager/stamp-service";
import { getRewardById, getRewardsByStoreIdPage } from "@/services/store-manager/reward-service";
import { EXPIRATION_OPTIONS } from "@/type/store-manager/stamp";
import type { Reward } from "@/type/store-manager/reward";
import { AppHeader } from "@/components/header";
import { Button } from "@/components/button";
import { Modal } from "@/components/modal";
import { RewardPickerModal } from "@/components/store_manager/stamp/reward-picker-modal";
import { Info, Gift, Check, ChevronRight } from "lucide-react-native";
import { TextField } from "@/components/text-field";

export default function ConfigureStamp() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId, stampId } = useLocalSearchParams<{ storeId: string; stampId?: string }>();
  const isEdit = !!stampId;
  const programId = stampId ? Number(stampId) : null;
  const {
    total_stamps,
    reward_id,
    expiration_mode,
    expiration_days,
    setTotalStamps,
    setRewardId,
    setExpirationMode,
    setExpirationDays,
    reset,
  } = useStampStore();
  const {
    isSubmitting,
    checkingActive,
    modal,
    setIsSubmitting,
    setCheckingActive,
    setModal,
  } = useStampConfigureViewStore();

  const [rewardPickerOpen, setRewardPickerOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [storeHasRewards, setStoreHasRewards] = useState(true);

  useEffect(() => {
    setCheckingActive(false);
  }, [setCheckingActive]);

  useFocusEffect(
    useCallback(() => {
      if (!storeId) return;
      getRewardsByStoreIdPage(storeId, 0, 1)
        .then((rows) => setStoreHasRewards(rows.length > 0))
        .catch(() => setStoreHasRewards(false));
    }, [storeId])
  );

  useEffect(() => {
    if (!storeId || !reward_id) {
      setSelectedReward(null);
      return;
    }
    let cancelled = false;
    getRewardById(storeId, String(reward_id))
      .then((r) => {
        if (!cancelled) setSelectedReward(r);
      })
      .catch(() => {
        if (!cancelled) setSelectedReward(null);
      });
    return () => {
      cancelled = true;
    };
  }, [storeId, reward_id]);

  useFocusEffect(
    useCallback(() => {
      if (!isEdit || !programId) return;
      let cancelled = false;
      getStampProgramById(programId)
        .then((program) => {
          if (cancelled) return;
          if (!program) throw new Error("Stamp program not found.");
          if (String(program.store_id) !== String(storeId)) {
            throw new Error("Invalid stamp program for this store.");
          }
          if (program.status !== "draft") throw new Error("Only draft stamp programs can be edited.");

          setTotalStamps(program.total_stamps ?? 0);
          setRewardId(program.reward_id != null ? String(program.reward_id) : "");
          setExpirationMode(program.expiration_mode ?? "none");
          setExpirationDays(program.expiration_days ?? 30);
        })
        .catch((e) => {
          setModal({
            title: "Cannot Edit",
            message: (e as Error).message ?? "This stamp program cannot be edited.",
            buttons: [
              {
                label: "OK",
                onPress: () => {
                  setModal(null);
                  router.push({ pathname: "/(store_manager)/stamp", params: { storeId } });
                },
              },
            ],
          });
        });
      return () => {
        cancelled = true;
      };
    }, [
      isEdit,
      programId,
      storeId,
      router,
      setModal,
      setTotalStamps,
      setRewardId,
      setExpirationMode,
      setExpirationDays,
    ])
  );

  const handleSave = async () => {
    if (!total_stamps || total_stamps < 1) {
      setModal({
        title: "Almost there!",
        message: "Please enter a valid number of stamps required.",
        buttons: [{ label: "OK", onPress: () => setModal(null) }],
      });
      return;
    }
    if (!reward_id) {
      setModal({
        title: "Almost there!",
        message: "Please select a reward for this stamp program.",
        buttons: [{ label: "OK", onPress: () => setModal(null) }],
      });
      return;
    }
    if (expiration_mode === "card" && (!expiration_days || expiration_days < 1)) {
      setModal({
        title: "Almost there!",
        message: "Please enter a valid number of days for card expiration.",
        buttons: [{ label: "OK", onPress: () => setModal(null) }],
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && programId) {
        await updateStampProgram(programId, {
          total_stamps,
          reward_id,
          expiration_mode,
          expiration_days: expiration_mode === "card" ? expiration_days : null,
        });
      } else {
        await createStamp({
          store_id: storeId,
          total_stamps,
          reward_id,
          expiration_mode,
          expiration_days: expiration_mode === "card" ? expiration_days : null,
        });
      }
      reset();
      setSelectedReward(null);
      setModal({
        title: "Success",
        message: isEdit ? "Stamp program updated successfully!" : "Stamp program created successfully!",
        buttons: [{
          label: "OK",
          onPress: () => {
            setModal(null);
            router.push({ pathname: "/(store_manager)/stamp", params: { storeId } });
          },
        }],
      });
    } catch (error) {
      setModal({
        title: "Error",
        message: (error as Error).message ?? "Failed to create stamp program.",
        buttons: [{ label: "OK", onPress: () => setModal(null) }],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingActive) {
    return (
      <View className="flex-1 bg-background dark:bg-[#111921] items-center justify-center">
        <ActivityIndicator size="large" color="#FF6600" />
      </View>
    );
  }

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
        title={isEdit ? "Edit Stamp Program" : "New Stamp Program"}
        paddingTop={insets.top + 8}
        onBackPress={() => router.push({ pathname: "/(store_manager)/stamp", params: { storeId } })}
      />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, gap: 16 }}
      >
        <View className="bg-white dark:bg-slate-900 rounded-xl p-4 gap-y-4">
          <View className="gap-y-4">
            <View className="gap-y-1">
              <Text className="text-base font-poppins-bold text-slate-900 dark:text-slate-100">
                Stamp Details
              </Text>
              <Text className="text-sm font-poppins text-slate-500 dark:text-slate-400">
                Set the rules for your digital loyalty card.
              </Text>
            </View>

            <View className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-4">
              <View className="flex-row items-center gap-x-2">
                <Text className="text-sm font-poppins-bold text-amber-700 dark:text-amber-400">
                  Before You Start
                </Text>
              </View>
              <View>
                {[
                  "Only 1 stamp program can be active per store at a time.",
                  "When you end a program, users cannot earn new stamps, but can still redeem during the grace period.",
                ].map((rule, i) => (
                  <View
                    key={i}
                    className="flex-row items-start gap-x-2 gap-y-1"
                    style={{ alignItems: "flex-start" }}
                  >
                    <Text className="text-amber-500 text-xs mt-0.5 font-poppins-semibold">•</Text>
                    <Text className="text-xs font-poppins text-amber-700 dark:text-amber-400 flex-1">
                      {rule}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="gap-y-1.5">
              <TextField
                label="Stamps Required to Redeem"
                placeholder="e.g. 10"
                keyboardType="decimal-pad"
                value={total_stamps > 0 ? String(total_stamps) : ""}
                onChangeText={(v) => setTotalStamps(parseInt(v) || 0)}
                required
              />
            </View>

            <View className="gap-y-1.5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-x-1">
                  <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
                    Reward
                  </Text>
                  <Text className="text-sm font-poppins text-red-500 dark:text-red-400 ">*</Text>
                </View>
                {selectedReward && (
                  <TouchableOpacity
                    onPress={() => {
                      setRewardId("");
                      setSelectedReward(null);
                    }}
                    activeOpacity={0.7}
                    className="px-2 py-1"
                    hitSlop={8 as any}
                  >
                    <Text className="text-xs font-poppins-semibold text-primary">Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
              {!storeHasRewards ? (
                <View className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-5 items-center gap-y-3">
                  <Gift size={26} color="#94A3B8" />
                  <View className="items-center gap-y-1">
                    <Text className="text-sm font-poppins-semibold text-slate-600 dark:text-slate-400">
                      No rewards yet
                    </Text>
                    <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 text-center">
                      You need at least one reward before launching a stamp program.
                    </Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    className="bg-primary rounded-xl px-6 py-2.5"
                    onPress={() =>
                      router.push({ pathname: "/(store_manager)/reward", params: { storeId } })
                    }
                  >
                    <Text className="text-white text-xs font-poppins-bold">Create a Reward</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setRewardPickerOpen(true)}
                  className="flex-row items-center gap-x-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3"
                >
                  {selectedReward?.image_url ? (
                    <Image
                      source={{ uri: selectedReward.image_url }}
                      style={{ width: 40, height: 40, borderRadius: 6 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
                      <Gift size={18} color="#FF6600" />
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="text-sm font-poppins-semibold text-slate-900 dark:text-slate-100">
                      {selectedReward?.title ?? (reward_id ? "Loading reward…" : "Tap to choose a reward")}
                    </Text>
                    <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 mt-0.5">
                      {selectedReward ? `${selectedReward.points_cost} pts` : "Opens a searchable list"}
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View className="gap-y-3">
            <View className="gap-y-1">
              <View className="flex-row items-center gap-x-1">
                <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
                  Expiration Mode
                </Text>
                <Text className="text-sm font-poppins text-red-500 dark:text-red-400 ">*</Text>
              </View>
              <Text className="text-xs font-poppins text-slate-500 dark:text-slate-400">
                Choose how stamp cards expire for your customers.
              </Text>
            </View>

            {EXPIRATION_OPTIONS.map((opt) => {
              const selected = expiration_mode === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  activeOpacity={0.8}
                  onPress={() => setExpirationMode(opt.key)}
                  className={`rounded-xl border px-4 py-2 gap-y-1 bg-white dark:bg-slate-900 ${
                    selected
                      ? "border-primary"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-sm font-poppins pr-8 text-textSecondary dark:text-darkTextSecondary mt-1 font-poppins-semibold">
                        {opt.label}
                      </Text>
                      <Text
                        className="text-xs font-poppins pr-8 text-textMuted dark:text-darkTextMuted mt-1"
                      >
                        {opt.description}
                      </Text>
                    </View>
                    <View
                      className={`w-5 h-5 rounded-full border-2 items-center justify-center self-center ${
                        selected ? "border-primary bg-primary" : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {selected && <Check size={12} color="#FFFFFF" />}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {expiration_mode === "card" && (
              <View className="gap-y-1.5 pl-1">
                <TextField
                  label="Expiration Period (days)"
                  placeholder="e.g. 30"
                  keyboardType="numeric"
                  value={expiration_days > 0 ? String(expiration_days) : ""}
                  onChangeText={(v) => setExpirationDays(parseInt(v) || 0)}
                  required
                />
              </View>
            )}
          </View>

          <View className="gap-y-3">
            <Button
              label={isEdit ? "Save Changes" : "Launch Stamp Program"}
              onPress={handleSave}
              disabled={isSubmitting}
              variant="primary"
            />
            <Button
              label="Cancel"
              onPress={() => router.push({ pathname: "/(store_manager)/stamp", params: { storeId } })}
              variant="secondary"
            />
          </View>
        </View>
      </ScrollView>

      <RewardPickerModal
        visible={rewardPickerOpen}
        storeId={storeId ?? ""}
        selectedRewardId={reward_id}
        onClose={() => setRewardPickerOpen(false)}
        onSelect={(r) => {
          setRewardId(r.id != null ? String(r.id) : "");
          setSelectedReward(r);
        }}
      />
    </KeyboardAvoidingView>
  );
}
