import { Modal } from "@/components/modal";
import { Check } from "lucide-react-native";
import { Button } from "@/components/button";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@/components/header";
import React, { useEffect, useState } from "react";
import { TextField } from "@/components/text-field";
import { useQueryClient } from "@tanstack/react-query";
import { useQRStore } from "@/store/store-manager/qr-store";
import { useQRConfigQuery } from "@/hooks/store-manager/rq";
import { useRouter, useLocalSearchParams } from "expo-router";
import { EarningType } from "@/type/store-manager/qr.purchase";
import { View, Text, TouchableOpacity, SafeAreaView } from "@/tw";
import { createQRService } from "@/services/store-manager/qr-service";
import { storeManagerKeys } from "@/hooks/store-manager/rq/query-keys";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
} from "react-native";

const WEB_MAX_WIDTH = 896;

export default function ConfigureStreaks() {
  const { t: translate } = useTranslation();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { storeId, id } = useLocalSearchParams<{
    storeId?: string;
    id?: string;
  }>();
  const storeIdParam = storeId ?? id;
  const storeIdForDb =
    storeIdParam && storeIdParam !== "undefined" ? storeIdParam : null;
  const qrQuery = useQRConfigQuery(storeIdForDb ?? undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [percentageInput, setPercentageInput] = useState("");
  const [baseAmountInput, setBaseAmountInput] = useState("");
  const [fixedPointsInput, setFixedPointsInput] = useState("");
  const [minimumSpendInput, setMinimumSpendInput] = useState("");
  const [maxPointsInput, setMaxPointsInput] = useState("");
  const {
    percentage,
    setPercentage,
    base_amount,
    setBaseAmount,
    earning_type,
    setEarningType,
    fixed_points,
    setFixedPoints,
    minimum_spend,
    setMinimumSpend,
    max_points_per_txn,
    setMaxPointsPerTxn,
    modal,
    setModal,
    errors,
    setErrors,
    reset,
  } = useQRStore();

  const validate = (): boolean => {
    let hasErrors = false;
    const nextErrors = {
      percentage: false,
      percentageErrorMessage: "",
      baseAmount: false,
      baseAmountErrorMessage: "",
      fixedPoints: false,
      fixedPointsErrorMessage: "",
      minimumSpend: false,
      minimumSpendErrorMessage: "",
      maxPointsPerTxn: false,
      maxPointsPerTxnErrorMessage: "",
    };

    if (earning_type === "percentage") {
      const pct = parseFloat(percentageInput);
      const base = parseFloat(baseAmountInput);

      if (!percentageInput || isNaN(pct) || pct <= 0) {
        nextErrors.percentage = true;
        nextErrors.percentageErrorMessage = translate(
          "storeManager.qrConfigure.validPercentage",
        );
        hasErrors = true;
      } else if (pct > 100) {
        nextErrors.percentage = true;
        nextErrors.percentageErrorMessage = translate(
          "storeManager.qrConfigure.percentageOver100",
        );
        hasErrors = true;
      }

      if (!baseAmountInput || isNaN(base) || base < 0) {
        nextErrors.baseAmount = true;
        nextErrors.baseAmountErrorMessage = translate(
          "storeManager.qrConfigure.validBaseAmount",
        );
        hasErrors = true;
      }
    } else {
      const pts = parseFloat(fixedPointsInput);
      const minSpend = parseFloat(minimumSpendInput);

      if (!fixedPointsInput || isNaN(pts) || pts <= 0) {
        nextErrors.fixedPoints = true;
        nextErrors.fixedPointsErrorMessage = translate(
          "storeManager.qrConfigure.validFixedPoints",
        );
        hasErrors = true;
      }

      if (!minimumSpendInput || isNaN(minSpend) || minSpend < 0) {
        nextErrors.minimumSpend = true;
        nextErrors.minimumSpendErrorMessage = translate(
          "storeManager.qrConfigure.validMinimumSpend",
        );
        hasErrors = true;
      }

      const maxTxn = maxPointsInput ? parseFloat(maxPointsInput) : NaN;
      if (!isNaN(maxTxn)) {
        if (maxTxn < 0) {
          nextErrors.maxPointsPerTxn = true;
          nextErrors.maxPointsPerTxnErrorMessage = translate(
            "storeManager.qrConfigure.validMaxPointsPerTxn",
          );
          hasErrors = true;
        } else if (maxTxn > 0 && maxTxn < pts) {
          nextErrors.maxPointsPerTxn = true;
          nextErrors.maxPointsPerTxnErrorMessage = translate(
            "storeManager.qrConfigure.maxLowerThanFixed",
          );
          hasErrors = true;
        }
      }
    }

    if (earning_type === "percentage" && maxPointsInput) {
      const maxTxn = parseFloat(maxPointsInput);
      if (isNaN(maxTxn) || maxTxn < 0) {
        nextErrors.maxPointsPerTxn = true;
        nextErrors.maxPointsPerTxnErrorMessage = translate(
          "storeManager.qrConfigure.validMaxPointsPerTxn",
        );
        hasErrors = true;
      }
    }

    setErrors(nextErrors);
    return !hasErrors;
  };

  const emptyFieldErrors = {
    percentage: false,
    percentageErrorMessage: "",
    baseAmount: false,
    baseAmountErrorMessage: "",
    fixedPoints: false,
    fixedPointsErrorMessage: "",
    minimumSpend: false,
    minimumSpendErrorMessage: "",
    maxPointsPerTxn: false,
    maxPointsPerTxnErrorMessage: "",
  };

  useEffect(() => {
    if (!storeIdForDb) return;
    reset();
    setPercentageInput("");
    setBaseAmountInput("");
    setFixedPointsInput("");
    setMinimumSpendInput("");
    setMaxPointsInput("");
    setErrors(emptyFieldErrors);
  }, [storeIdForDb, reset, setErrors]);

  useEffect(() => {
    if (!storeIdForDb) return;
    if (qrQuery.isPending) return;
    if (qrQuery.isError) {
      setModal({
        title: translate("store_manager.qrConfigure.loadErrorTitle"),
        message: translate("store_manager.qrConfigure.loadErrorMessage"),
        buttons: [
          {
            label: translate("label.ok"),
            onPress: () => setModal(null),
            variant: "secondary",
          },
        ],
      });
      return;
    }
    const cfg = qrQuery.data;
    if (!cfg) {
      reset();
      setPercentageInput("");
      setBaseAmountInput("");
      setFixedPointsInput("");
      setMinimumSpendInput("");
      setMaxPointsInput("");
      return;
    }
    const type = (cfg.earning_type as EarningType) ?? "percentage";
    setEarningType(type);

    if (type === "percentage") {
      const pct = cfg.percentage ?? 0;
      const base = cfg.base_amount ?? 0;
      setPercentage(pct);
      setBaseAmount(base);
      setPercentageInput(pct ? String(pct) : "");
      setBaseAmountInput(base ? String(base) : "");
    } else {
      const fixed = cfg.fixed_points ?? 0;
      const minSpend = cfg.minimum_spend ?? 0;
      setFixedPoints(fixed);
      setMinimumSpend(minSpend);
      setFixedPointsInput(fixed ? String(fixed) : "");
      setMinimumSpendInput(minSpend ? String(minSpend) : "");
    }

    const maxPerTxn = cfg.max_points_per_txn ?? 0;
    setMaxPointsPerTxn(maxPerTxn);
    setMaxPointsInput(maxPerTxn ? String(maxPerTxn) : "");
  }, [
    storeIdForDb,
    qrQuery.isPending,
    qrQuery.isError,
    qrQuery.data,
    reset,
    setEarningType,
    setPercentage,
    setBaseAmount,
    setFixedPoints,
    setMinimumSpend,
    setMaxPointsPerTxn,
    translate,
  ]);

  const handleSave = async () => {
    if (isSubmitting) return;
    if (!storeIdForDb) {
      setModal({
        title: translate("storeManager.qrConfigure.invalidStoreTitle"),
        message: translate("storeManager.qrConfigure.invalidStoreMessage"),
        buttons: [
          {
            label: translate("label.ok"),
            onPress: () => setModal(null),
            variant: "secondary",
          },
        ],
      });
      return;
    }
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await createQRService(storeIdForDb, {
        store_id: storeIdForDb,
        percentage,
        base_amount,
        earning_type,
        fixed_points,
        minimum_spend,
        max_points_per_txn,
      });

      await queryClient.invalidateQueries({
        queryKey: storeManagerKeys.qrConfig(storeIdForDb),
      });

      reset();
      setPercentageInput("");
      setBaseAmountInput("");
      setFixedPointsInput("");
      setMinimumSpendInput("");
      setMaxPointsInput("");
      setErrors({
        ...errors,
        percentage: false,
        percentageErrorMessage: "",
        baseAmount: false,
        baseAmountErrorMessage: "",
        fixedPoints: false,
        fixedPointsErrorMessage: "",
        minimumSpend: false,
        minimumSpendErrorMessage: "",
        maxPointsPerTxn: false,
        maxPointsPerTxnErrorMessage: "",
      });

      setModal({
        title: translate("label.success"),
        message: translate("storeManager.qrConfigure.successMessage"),
        buttons: [
          {
            label: translate("label.ok"),
            onPress: () =>
              router.push({
                pathname: "/(store_manager)/qr",
                params: { storeId: storeIdForDb },
              }),
            variant: "secondary",
          },
        ],
      });
    } catch (error) {
      setModal({
        title: translate("label.error"),
        message:
          (error as Error).message ??
          translate("storeManager.qrConfigure.saveFailed"),
        buttons: [
          {
            label: translate("label.ok"),
            onPress: () => setModal(null),
            variant: "secondary",
          },
        ],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-backgroundMuted dark:bg-[#111921]"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
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
          title={translate("storeManager.qrConfigure.title")}
          onBackPress={() => {
            router.push({
              pathname: "/(store_manager)/qr",
              params: { storeId: storeIdParam },
            });
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
            ...(Platform.OS === "web"
              ? { width: "100%", alignItems: "center" }
              : null),
          }}
        >
          <View
            className="bg-white dark:bg-darkBackgroundCard border border-slate-100 dark:border-darkBorder rounded-xl p-4 flex-col gap-y-5"
            style={
              Platform.OS === "web"
                ? { width: "100%", maxWidth: WEB_MAX_WIDTH }
                : undefined
            }
          >
            <View>
              <Text className="text-md font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                {translate("storeManager.qrConfigure.heading")}
              </Text>
              <Text className="text-sm font-poppins text-textSecondary dark:text-darkTextSecondary">
                {translate("storeManager.qrConfigure.subheading")}
              </Text>
            </View>
            <View className="gap-y-2">
              <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-darkTextSoft">
                {translate("storeManager.qrConfigure.pointsType")}
              </Text>
              <View className="flex-row gap-x-2">
                {(
                  [
                    {
                      key: "percentage" as EarningType,
                      label: translate(
                        "storeManager.qrConfigure.percentageOptionTitle",
                      ),
                      desc: translate(
                        "storeManager.qrConfigure.percentageOptionDesc",
                      ),
                    },
                    {
                      key: "fixed" as EarningType,
                      label: translate("label.fixed"),
                      desc: translate(
                        "storeManager.qrConfigure.fixedOptionDesc",
                      ),
                    },
                  ] as const
                ).map((opt) => {
                  const selected = earning_type === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      activeOpacity={0.8}
                      onPress={() => {
                        setEarningType(opt.key);
                        setErrors({
                          ...errors,
                          percentage: false,
                          percentageErrorMessage: "",
                          baseAmount: false,
                          baseAmountErrorMessage: "",
                          fixedPoints: false,
                          fixedPointsErrorMessage: "",
                          minimumSpend: false,
                          minimumSpendErrorMessage: "",
                          maxPointsPerTxn: false,
                          maxPointsPerTxnErrorMessage: "",
                        });
                      }}
                      className={`flex-1 rounded-xl border p-3 gap-y-1 bg-white dark:bg-darkBackgroundMuted ${
                        selected
                          ? "border-primary"
                          : "border-slate-200 dark:border-darkBorder"
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View
                          className={`w-4 h-4 rounded-full border-2 items-center justify-center self-center ${selected ? "border-primary bg-primary" : "border-slate-300 dark:border-darkBorder"}`}
                        >
                          {selected && <Check size={9} color="#fff" />}
                        </View>
                      </View>
                      <Text
                        className={`text-xs font-poppins-bold mt-1 ${selected ? "text-textSecondary dark:text-darkTextSecondary" : "text-textSecondary dark:text-darkTextSecondary"}`}
                      >
                        {opt.label}
                      </Text>
                      <Text className="text-[10px] font-poppins text-textMuted dark:text-darkTextMuted">
                        {opt.desc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {earning_type === "percentage" && (
              <View className="gap-y-3">
                <View className="flex-row gap-x-3">
                  <View className="flex-1">
                    <TextField
                      label={translate(
                        "storeManager.qrConfigure.percentageLabel",
                      )}
                      placeholder={translate("label.eg10Placeholder")}
                      keyboardType="decimal-pad"
                      value={percentageInput}
                      onChangeText={(v) => {
                        setPercentageInput(v);
                        setErrors({
                          ...errors,
                          percentage: false,
                          percentageErrorMessage: "",
                        });
                        const parsed = parseFloat(v);
                        if (!isNaN(parsed)) setPercentage(Math.max(0, parsed));
                        else setPercentage(0);
                      }}
                      required
                      error={errors.percentage}
                    />
                    {errors.percentage && (
                      <Text className="text-xs font-poppins text-red-500 dark:text-red-400 mt-1">
                        {errors.percentageErrorMessage}
                      </Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <TextField
                      label={translate("storeManager.qrConfigure.baseAmount")}
                      placeholder={translate("label.eg10Placeholder")}
                      keyboardType="decimal-pad"
                      value={baseAmountInput}
                      onChangeText={(v) => {
                        setBaseAmountInput(v);
                        setErrors({
                          ...errors,
                          baseAmount: false,
                          baseAmountErrorMessage: "",
                        });
                        const parsed = parseFloat(v);
                        if (!isNaN(parsed)) setBaseAmount(Math.max(0, parsed));
                        else setBaseAmount(0);
                      }}
                      required
                      error={errors.baseAmount}
                    />
                    {errors.baseAmount && (
                      <Text className="text-xs font-poppins text-red-500 dark:text-red-400 mt-1">
                        {errors.baseAmountErrorMessage}
                      </Text>
                    )}
                  </View>
                </View>

                <View className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl px-4 py-3">
                  <Text className="text-xs font-poppins text-yellow-800 dark:text-yellow-200">
                    {translate("storeManager.qrConfigure.percentageHint")}
                  </Text>
                </View>
              </View>
            )}

            {/* Fixed fields */}
            {earning_type === "fixed" && (
              <>
                <View className="flex-row gap-x-3">
                  <View className="flex-1">
                    <TextField
                      label={translate("storeManager.qrConfigure.fixedPoints")}
                      placeholder={translate(
                        "storeManager.qrConfigure.fixedPointsPlaceholder",
                      )}
                      keyboardType="decimal-pad"
                      value={fixedPointsInput}
                      onChangeText={(v) => {
                        setFixedPointsInput(v);
                        setErrors({
                          ...errors,
                          fixedPoints: false,
                          fixedPointsErrorMessage: "",
                        });
                        const parsed = parseFloat(v);
                        if (!isNaN(parsed)) setFixedPoints(Math.max(0, parsed));
                        else setFixedPoints(0);
                      }}
                      required
                      error={errors.fixedPoints}
                    />
                    {errors.fixedPoints && (
                      <Text className="text-xs font-poppins text-red-500 dark:text-red-400 mt-1">
                        {errors.fixedPointsErrorMessage}
                      </Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <TextField
                      label={translate("storeManager.qrConfigure.minimumSpend")}
                      placeholder={translate(
                        "storeManager.qrConfigure.minimumSpendPlaceholder",
                      )}
                      keyboardType="decimal-pad"
                      value={minimumSpendInput}
                      onChangeText={(v) => {
                        setMinimumSpendInput(v);
                        setErrors({
                          ...errors,
                          minimumSpend: false,
                          minimumSpendErrorMessage: "",
                        });
                        const parsed = parseFloat(v);
                        if (!isNaN(parsed))
                          setMinimumSpend(Math.max(0, parsed));
                        else setMinimumSpend(0);
                      }}
                      required
                      error={errors.minimumSpend}
                    />
                    {errors.minimumSpend && (
                      <Text className="text-xs font-poppins text-red-500 dark:text-red-400 mt-1">
                        {errors.minimumSpendErrorMessage}
                      </Text>
                    )}
                  </View>
                </View>

                <View className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl px-4 py-3">
                  <Text className="text-xs font-poppins text-yellow-800 dark:text-yellow-200">
                    {translate("storeManager.qrConfigure.fixedHint")}
                  </Text>
                </View>
              </>
            )}

            {/* Max points per transaction — shared */}
            <View className="gap-y-1.5">
              <TextField
                label={translate("storeManager.qrConfigure.maxPointsPerTxn")}
                hint={translate("storeManager.qrConfigure.maxPointsHint")}
                placeholder={translate(
                  "storeManager.qrConfigure.maxPointsPlaceholder",
                )}
                keyboardType="decimal-pad"
                value={maxPointsInput}
                onChangeText={(v) => {
                  setMaxPointsInput(v);
                  setErrors({
                    ...errors,
                    maxPointsPerTxn: false,
                    maxPointsPerTxnErrorMessage: "",
                  });
                  const parsed = parseFloat(v);
                  if (!isNaN(parsed)) setMaxPointsPerTxn(Math.max(0, parsed));
                  else setMaxPointsPerTxn(0);
                }}
                error={errors.maxPointsPerTxn}
              />
              {errors.maxPointsPerTxn && (
                <Text className="text-xs font-poppins text-red-500 dark:text-red-400 mt-1">
                  {errors.maxPointsPerTxnErrorMessage}
                </Text>
              )}
            </View>

            {/* Actions */}
            <View className="gap-y-3">
              <Button
                label={translate("storeManager.qrConfigure.saveRules")}
                onPress={handleSave}
                disabled={isSubmitting}
                loading={isSubmitting}
                fullWidth={true}
                variant="primary"
              />
              <Button
                label={translate("label.cancel")}
                onPress={() => {
                  router.push({
                    pathname: "/(store_manager)/qr",
                    params: { storeId: storeIdParam },
                  });
                }}
                fullWidth={true}
                variant="secondary"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
