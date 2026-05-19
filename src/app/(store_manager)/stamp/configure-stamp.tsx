import { Image } from "expo-image";
import { Modal } from "@/components/modal";
import { Button } from "@/components/button";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@/components/header";
import { TextField } from "@/components/text-field";
import type { Reward } from "@/type/store-manager/reward";
import { EXPIRATION_OPTIONS } from "@/type/store-manager/stamp";
import { Gift, Check, ChevronRight } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, SafeAreaView } from "@/tw";
import { ActivityIndicator, Platform, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { RewardPickerModal } from "@/components/store_manager/stamp/reward-picker-modal";
import { useStampConfigureViewStore, useStampStore } from "@/store/store-manager/stamp-store";
import { getRewardById, getRewardsByStoreIdPage } from "@/services/store-manager/reward-service";
import { useStorePremiumCampaignEdit } from "@/hooks/store-manager/use-store-premium-campaign-edit";
import {
  createStamp,
  getStampProgramById,
  updateStampProgram,
} from "@/services/store-manager/stamp-service";

export default function ConfigureStamp() {
  const { t: translate } = useTranslation();
  const router = useRouter();
  const { storeId, stampId } = useLocalSearchParams<{ storeId: string; stampId?: string }>();
  const isEdit = !!stampId;
  const isWeb = Platform.OS === "web";
  const programId = stampId ? Number(stampId) : null;
  const {
    total_stamps,
    reward_id,
    expiration_mode,
    expiration_days,
    totalStampsError,
    rewardError,
    expirationDaysError,
    setTotalStamps,
    setRewardId,
    setExpirationMode,
    setExpirationDays,
    setTotalStampsError,
    setRewardError,
    setExpirationDaysError,
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

  const { canEdit, loading: permLoading } = useStorePremiumCampaignEdit(storeId);

  useEffect(() => {
    setCheckingActive(false);
  }, [setCheckingActive]);

  useEffect(() => {
    if (!storeId || permLoading || canEdit) return;
    router.replace({ pathname: "/(store_manager)/stamp", params: { storeId } });
  }, [storeId, permLoading, canEdit, router]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setTotalStampsError(false);
      setRewardError(false);
      setExpirationDaysError(false);

      if (storeId) {
        getRewardsByStoreIdPage(storeId, 0, 1)
          .then((rows) => {
            if (cancelled) return;
            setStoreHasRewards(rows.length > 0);
          })
          .catch(() => {
            if (cancelled) return;
            setStoreHasRewards(false);
          });
      }

      if (isEdit && programId && storeId) {
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
            if (cancelled) return;
            setModal({
              title: translate("storeManager.stampConfigure.cannotEditTitle"),
              message: (e as Error).message ?? translate("storeManager.stampConfigure.cannotEditDefault"),
              buttons: [
                {
                  label: translate("label.ok"),
                  onPress: () => {
                    setModal(null);
                    router.push({ pathname: "/(store_manager)/stamp", params: { storeId } });
                  },
                },
              ],
            });
          });
      }

      return () => {
        cancelled = true;
      };
    }, [
      storeId,
      isEdit,
      programId,
      translate,
      router,
      setModal,
      setTotalStampsError,
      setRewardError,
      setExpirationDaysError,
      setTotalStamps,
      setRewardId,
      setExpirationMode,
      setExpirationDays,
    ])
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

  const handleSave = async () => {
    const nextTotalStampsError = !total_stamps || total_stamps < 1;
    const nextRewardError = !reward_id;
    const nextExpirationDaysError = expiration_mode === "card" && (!expiration_days || expiration_days < 1);

    if (nextTotalStampsError || nextRewardError || nextExpirationDaysError) {
      setModal(null);
      setTotalStampsError(nextTotalStampsError);
      setRewardError(nextRewardError);
      setExpirationDaysError(nextExpirationDaysError);
      return;
    }

    setTotalStampsError(false);
    setRewardError(false);
    setExpirationDaysError(false);

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
        title: translate("label.success"),
        message: isEdit ? translate("storeManager.stampConfigure.successUpdate") : translate("storeManager.stampConfigure.successCreate"),
        buttons: [{
          label: translate("label.ok"),
          onPress: () => {
            setModal(null);
            router.push({ pathname: "/(store_manager)/stamp", params: { storeId } });
          },
        }],
      });
    } catch (error) {
      setModal({
        title: translate("label.error"),
        message: (error as Error).message ?? translate("storeManager.stampConfigure.saveFailed"),
        buttons: [{ label: translate("label.ok"), onPress: () => setModal(null) }],
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
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-backgroundMuted dark:bg-[#111921]">
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
      />
      <AppHeader
        title={isEdit ? translate("storeManager.stampConfigure.editTitle") : translate("storeManager.stampConfigure.newTitle")}
        onBackPress={() => {
          router.push({ pathname: "/(store_manager)/stamp", params: { storeId } });
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 16,
          gap: 16,
          ...(isWeb ? { alignItems: "center" as const } : {}),
        }}
      >
        <View style={{ width: "100%", maxWidth: isWeb ? 896 : undefined }} className="w-full">
          <View className="bg-white dark:bg-darkBackgroundMuted rounded-xl p-4 gap-y-4">
            <View className="gap-y-4">
              <View className="gap-y-1">
                <Text className="text-base font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                  {translate("storeManager.stampConfigure.stampDetails")}
                </Text>
                <Text className="text-sm font-poppins text-textSecondary dark:text-darkTextSecondary">
                  {translate("storeManager.stampConfigure.stampDetailsBody")}
                </Text>
              </View>

            <View className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-4">
              <View className="flex-row items-center gap-x-2">
                <Text className="text-sm font-poppins-bold text-amber-700 dark:text-amber-400">
                  {translate("storeManager.stampConfigure.beforeYouStart")}
                </Text>
              </View>
              <View>
                {[
                  translate("storeManager.stampConfigure.rule1"),
                  translate("storeManager.stampConfigure.rule2"),
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
                label={translate("storeManager.stampConfigure.stampsToRedeem")}
                placeholder={translate("label.eg10Placeholder")}
                keyboardType="decimal-pad"
                value={total_stamps > 0 ? String(total_stamps) : ""}
                onChangeText={(v) => {
                  const n = parseInt(v) || 0;
                  setTotalStamps(n);
                  if (n >= 1) setTotalStampsError(false);
                }}
                required
                error={totalStampsError}
              />
              {totalStampsError && (
                <Text className="text-xs font-poppins text-red-500 dark:text-red-400 -mt-1">
                  {translate("storeManager.stampConfigure.stampsRequiredInvalid")}
                </Text>
              )}
            </View>

            <View className="gap-y-1.5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-x-1">
                  <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-darkTextSoft">
                    {translate("storeManager.stampConfigure.reward")}
                  </Text>
                  <Text className="text-sm font-poppins text-red-500 dark:text-red-400 ">*</Text>
                </View>
                {selectedReward && (
                  <TouchableOpacity
                    onPress={() => {
                      setRewardId("");
                      setSelectedReward(null);
                      setRewardError(false);
                    }}
                    activeOpacity={0.7}
                    className="px-2 py-1"
                    hitSlop={8 as any}
                  >
                    <Text className="text-xs font-poppins-semibold text-primary">{translate("storeManager.stampConfigure.clear")}</Text>
                  </TouchableOpacity>
                )}
              </View>
              {!storeHasRewards ? (
                <View
                  className={`rounded-xl border border-dashed bg-slate-50 dark:bg-darkBackgroundMuted px-4 py-5 items-center gap-y-3 ${
                    rewardError
                      ? "border-red-500 dark:border-red-500"
                      : "border-slate-300 dark:border-darkBorder"
                  }`}
                >
                  <Gift size={26} color="#94A3B8" />
                  <View className="items-center gap-y-1">
                    <Text className="text-sm font-poppins-semibold text-slate-600 dark:text-darkTextMuted">
                      {translate("storeManager.stampConfigure.noRewardsTitle")}
                    </Text>
                    <Text className="text-xs font-poppins text-slate-400 dark:text-darkTextSecondary text-center">
                      {translate("storeManager.stampConfigure.noRewardsBody")}
                    </Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    className="bg-primary rounded-xl px-6 py-2.5"
                    onPress={() =>
                      router.push({ pathname: "/(store_manager)/reward", params: { storeId } })
                    }
                  >
                    <Text className="text-white text-xs font-poppins-bold">{translate("storeManager.stampConfigure.createReward")}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setRewardPickerOpen(true)}
                  className={`flex-row items-center gap-x-3 rounded-xl border bg-white dark:bg-darkBackgroundMuted px-4 py-3 ${
                    rewardError
                      ? "border-red-500 dark:border-red-500"
                      : "border-slate-200 dark:border-darkBorder"
                  }`}
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
                    <Text className="text-sm font-poppins-semibold text-slate-900 dark:text-darkTextPrimary">
                      {selectedReward?.title ?? (reward_id ? translate("storeManager.stampConfigure.loadingReward") : translate("storeManager.stampConfigure.chooseReward"))}
                    </Text>
                    <Text className="text-xs font-poppins text-slate-400 dark:text-darkTextSecondary mt-0.5">
                      {selectedReward ? translate("storeManager.reward.pts", { points: selectedReward.points_cost }) : translate("storeManager.stampConfigure.opensList")}
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#94A3B8" />
                </TouchableOpacity>
              )}
              {rewardError && (
                <Text className="text-xs font-poppins text-red-500 dark:text-red-400 -mt-1">
                  {translate("storeManager.stampConfigure.selectReward")}
                </Text>
              )}
            </View>
          </View>

          <View className="gap-y-3">
            <View className="gap-y-1">
              <View className="flex-row items-center gap-x-1">
                <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-darkTextSoft">
                  {translate("storeManager.stampConfigure.expirationMode")}
                </Text>
                <Text className="text-sm font-poppins text-red-500 dark:text-red-400 ">*</Text>
              </View>
              <Text className="text-xs font-poppins text-slate-500 dark:text-darkTextMuted">
                {translate("storeManager.stampConfigure.expirationModeHint")}
              </Text>
            </View>

            {EXPIRATION_OPTIONS.map((opt) => {
              const selected = expiration_mode === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  activeOpacity={0.8}
                  onPress={() => {
                    setExpirationMode(opt.key);
                    if (opt.key !== "card") setExpirationDaysError(false);
                  }}
                  className={`rounded-xl border px-4 py-2 gap-y-1 bg-white dark:bg-darkBackgroundMuted ${
                    selected
                      ? "border-primary"
                      : "border-slate-200 dark:border-darkBorder"
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-sm font-poppins pr-8 text-textSecondary dark:text-darkTextSecondary mt-1 font-poppins-semibold">
                        {translate(`storeManager.stampConfigure.expiration.${opt.key}.label`)}
                      </Text>
                      <Text
                        className="text-xs font-poppins pr-8 text-textMuted dark:text-darkTextMuted mt-1"
                      >
                        {translate(`storeManager.stampConfigure.expiration.${opt.key}.description`)}
                      </Text>
                    </View>
                    <View
                      className={`w-5 h-5 rounded-full border-2 items-center justify-center self-center ${
                        selected ? "border-primary bg-primary" : "border-slate-300 dark:border-darkBorder"
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
                  label={translate("storeManager.stampConfigure.expirationDays")}
                  placeholder={translate("storeManager.stampConfigure.expirationDaysPlaceholder")}
                  keyboardType="numeric"
                  value={expiration_days > 0 ? String(expiration_days) : ""}
                  onChangeText={(v) => {
                    const n = parseInt(v) || 0;
                    setExpirationDays(n);
                    if (n >= 1) setExpirationDaysError(false);
                  }}
                  required
                  error={expirationDaysError}
                />
                {expirationDaysError && (
                  <Text className="text-xs font-poppins text-red-500 dark:text-red-400 -mt-1">
                    {translate("storeManager.stampConfigure.expirationDaysInvalid")}
                  </Text>
                )}
              </View>
            )}
          </View>

          {isWeb ? (
            <View className="flex-row gap-x-3 justify-center items-center">
              <Button
                label={translate("storeManager.stampConfigure.cancel")}
                onPress={() => {
                  router.push({ pathname: "/(store_manager)/stamp", params: { storeId } });
                }}
                variant="secondary"
                fullWidth={false}
              />
              <Button
                label={isEdit ? translate("storeManager.stampConfigure.saveChanges") : translate("storeManager.stampConfigure.launchProgram")}
                onPress={handleSave}
                disabled={isSubmitting}
                variant="primary"
                fullWidth={false}
              />
            </View>   
          ) : (
            <View className="gap-y-3">
              <Button
                label={isEdit ? translate("storeManager.stampConfigure.saveChanges") : translate("storeManager.stampConfigure.launchProgram")}
                onPress={handleSave}
                disabled={isSubmitting}
                variant="primary"
                fullWidth={true}
              />
              <Button
                label={translate("storeManager.stampConfigure.cancel")}
                onPress={() => {
                  router.push({ pathname: "/(store_manager)/stamp", params: { storeId } });
                }}
                variant="secondary"
                fullWidth={true}
              />
            </View>
          )}
 
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
          if (r.id != null) setRewardError(false);
        }}
      />
    </SafeAreaView>
  );
}
