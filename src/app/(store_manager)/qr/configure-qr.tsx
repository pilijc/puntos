import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, useColorScheme } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import { Check } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/button";
import { Modal, type ModalButton } from "@/components/modal";
import { TextField } from "@/components/text-field";
import { EarningType } from "@/type/store-manager/qr.purchase";
import { useQRStore } from "@/store/store-manager/qr-store";
import { createQRService, getQRConfig } from "@/services/store-manager/qr-service";
import { AppHeader } from "@/components/header";
import { useTranslation } from "react-i18next";

const WEB_MAX_WIDTH = 896;

export default function ConfigureStreaks() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId, id } = useLocalSearchParams<{ storeId?: string; id?: string }>();
  const storeIdParam = storeId ?? id;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [percentageInput, setPercentageInput] = useState("");
  const [baseAmountInput, setBaseAmountInput] = useState("");
  const [fixedPointsInput, setFixedPointsInput] = useState("");
  const [minimumSpendInput, setMinimumSpendInput] = useState("");
  const [maxPointsInput, setMaxPointsInput] = useState("");
  const [modal, setModal] = useState<{
    title: string;
    message: string;
    buttons: ModalButton[];
    timer?: boolean;
  } | null>(null);
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
    reset,
  } = useQRStore();

	const showError = (message: string) =>
		setModal({ title: t("storeManager.qrConfigure.almostThere"), message, buttons: [{ label: t("label.ok"), onPress: () => setModal(null), variant: "secondary" }] });

	const validate = (): boolean => {
		if (earning_type === "percentage") {
			const pct = parseFloat(percentageInput);
			const base = parseFloat(baseAmountInput);
			if (!percentageInput || isNaN(pct) || pct <= 0) { showError(t("storeManager.qrConfigure.validPercentage")); return false; }
			if (pct > 100) { showError(t("storeManager.qrConfigure.percentageOver100")); return false; }
			if (baseAmountInput && (isNaN(base) || base <= 0)) { showError(t("storeManager.qrConfigure.validBaseAmount")); return false; }
		} else {
			const pts = parseFloat(fixedPointsInput);
			if (!fixedPointsInput || isNaN(pts) || pts <= 0) { showError(t("storeManager.qrConfigure.validFixedPoints")); return false; }
      const maxTxn = maxPointsInput ? parseFloat(maxPointsInput) : NaN;
      if (!isNaN(maxTxn) && maxTxn > 0 && maxTxn < pts) {
        showError(t("storeManager.qrConfigure.maxLowerThanFixed"));
        return false;
      }
		}
		return true;
	};

  useEffect(() => {
    const storeIdForDb = storeIdParam && storeIdParam !== "undefined" ? storeIdParam : null;
    if (!storeIdForDb) return;

    let cancelled = false;
    reset();
    setPercentageInput("");
    setBaseAmountInput("");
    setFixedPointsInput("");
    setMinimumSpendInput("");
    setMaxPointsInput("");
    getQRConfig(storeIdForDb)
      .then((cfg) => {
        if (cancelled) return;
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
      })
      .catch((error) => {
        if (cancelled) return;
        setModal({
          title: t("storeManager.qrConfigure.loadErrorTitle"),
          message: t("storeManager.qrConfigure.loadErrorMessage"),
          buttons: [{ label: t("label.ok"), onPress: () => setModal(null), variant: "secondary" }],
        });
      });

    return () => {
      cancelled = true;
    };
  }, [
    storeIdParam,
    setEarningType,
    setPercentage,
    setBaseAmount,
    setFixedPoints,
    setMinimumSpend,
    setMaxPointsPerTxn,
    reset,
    t,
  ]);

	const handleSave = async () => {
		if (isSubmitting) return;
    const storeIdForDb = storeIdParam && storeIdParam !== "undefined" ? storeIdParam : null;
    if (!storeIdForDb) {
      setModal({
        title: t("storeManager.qrConfigure.invalidStoreTitle"),
        message: t("storeManager.qrConfigure.invalidStoreMessage"),
        buttons: [{ label: t("label.ok"), onPress: () => setModal(null), variant: "secondary" }],
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
			reset();
			setModal({
				title: t("label.success"),
				message: t("storeManager.qrConfigure.successMessage"),
        buttons: [{ label: t("label.ok"), onPress: () => router.push({ pathname: "/(store_manager)/qr", params: { storeId: storeIdForDb } }), variant: "secondary" }],
			});
		} catch (error) {
			setModal({
				title: t("label.error"),
				message: (error as Error).message ?? t("storeManager.qrConfigure.saveFailed"),
				buttons: [{ label: t("label.ok"), onPress: () => setModal(null), variant: "secondary" }],
			});
		} finally {
			setIsSubmitting(false);
		}
	};

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      className="bg-backgroundMuted dark:bg-neutral-900"
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
        title={t("storeManager.qrConfigure.title")}
        onBackPress={() => {
          router.push({ pathname: "/(store_manager)/qr", params: { storeId: storeIdParam } });
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
          ...(Platform.OS === "web" ? { width: "100%", alignItems: "center" } : null),
        }}
      >
        <View
          className="bg-white rounded-xl p-4 flex-col gap-y-5"
          style={Platform.OS === "web" ? { width: "100%", maxWidth: WEB_MAX_WIDTH } : undefined}
        >
          <View>
            <Text className="text-md font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
            {t("storeManager.qrConfigure.heading")}
            </Text>
            <Text className="text-sm font-poppins text-textSecondary dark:text-darkTextSecondary">
              {t("storeManager.qrConfigure.subheading")}
            </Text>
          </View>
        <View className="gap-y-2">
          <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
            {t("storeManager.qrConfigure.pointsType")}
          </Text>
          <View className="flex-row gap-x-2">
            {([
              { key: "percentage" as EarningType, label: t("storeManager.qrConfigure.percentageOptionTitle"), desc: t("storeManager.qrConfigure.percentageOptionDesc") },
              { key: "fixed" as EarningType, label: t("storeManager.qrConfigure.fixedOptionTitle"), desc: t("storeManager.qrConfigure.fixedOptionDesc") },
            ] as const)
              .map((opt) => {
              const selected = earning_type === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  activeOpacity={0.8}
                  onPress={() => setEarningType(opt.key)}
                  className={`flex-1 rounded-xl border p-3 gap-y-1 bg-white dark:bg-slate-900 ${
                    selected
                      ? "border-primary"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className={`w-4 h-4 rounded-full border-2 items-center justify-center self-center ${selected ? "border-primary bg-primary" : "border-slate-300 dark:border-slate-600"}`}>
                      {selected && <Check size={9} color="#fff" />}
                    </View>
                  </View>
                  <Text className={`text-xs font-poppins-bold mt-1 ${selected ? "text-textSecondary dark:text-darkTextSecondary" : "text-textSecondary dark:text-darkTextSecondary"}`}>
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
                  label={t("storeManager.qrConfigure.percentageLabel")}
                  placeholder={t("storeManager.qrConfigure.percentagePlaceholder")}
                  keyboardType="decimal-pad"
                  value={percentageInput}
                  onChangeText={(v) => {
                    setPercentageInput(v);
                    const parsed = parseFloat(v);
                    if (!isNaN(parsed)) setPercentage(Math.max(0, parsed));
                  }}
									required
                />
              </View>
              <View className="flex-1">
                <TextField
                  label={t("storeManager.qrConfigure.baseAmount")}
                  placeholder={t("storeManager.qrConfigure.baseAmountPlaceholder")}
                  keyboardType="decimal-pad"
                  value={baseAmountInput}
                  onChangeText={(v) => {
                    setBaseAmountInput(v);
                    const parsed = parseFloat(v);
                    if (!isNaN(parsed)) setBaseAmount(Math.max(0, parsed));
                  }}
                  required
                />
              </View>
            </View>

            <View className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl px-4 py-3">
              <Text className="text-xs font-poppins text-yellow-800 dark:text-yellow-200">
                {t("storeManager.qrConfigure.percentageHint")}
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
									label={t("storeManager.qrConfigure.fixedPoints")}
									placeholder={t("storeManager.qrConfigure.fixedPointsPlaceholder")}
									keyboardType="decimal-pad"
									value={fixedPointsInput}
									onChangeText={(v) => {
										setFixedPointsInput(v);
										const parsed = parseFloat(v);
										if (!isNaN(parsed)) setFixedPoints(Math.max(0, parsed));
									}}
									required
								/>
							</View>
							<View className="flex-1">
								<TextField
									label={t("storeManager.qrConfigure.minimumSpend")}
									placeholder={t("storeManager.qrConfigure.minimumSpendPlaceholder")}
									keyboardType="decimal-pad"
									value={minimumSpendInput}
									onChangeText={(v) => {
										setMinimumSpendInput(v);
										const parsed = parseFloat(v);
										if (!isNaN(parsed)) setMinimumSpend(Math.max(0, parsed));
									}}
                  required
								/>
							</View>
						</View>

            <View className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl px-4 py-3">
              <Text className="text-xs font-poppins text-yellow-800 dark:text-yellow-200">
                {t("storeManager.qrConfigure.fixedHint")}
              </Text>
            </View>
					</>
        )}

        {/* Max points per transaction — shared */}
        <TextField
          label={t("storeManager.qrConfigure.maxPointsPerTxn")}
          hint={t("storeManager.qrConfigure.maxPointsHint")}
          placeholder={t("storeManager.qrConfigure.maxPointsPlaceholder")}
          keyboardType="decimal-pad"
          value={maxPointsInput}
          onChangeText={(v) => {
            setMaxPointsInput(v);
            const parsed = parseFloat(v);
            if (!isNaN(parsed)) setMaxPointsPerTxn(Math.max(0, parsed));
          }}
        />

        {/* Actions */}
        <View className="gap-y-3">
          <Button
            label={t("storeManager.qrConfigure.saveRules")}
            onPress={handleSave}
            disabled={isSubmitting}
            loading={isSubmitting}
            fullWidth={true}
            variant="primary"
          />
          <Button
            label={t("label.cancel")}
            onPress={() => {
              router.push({ pathname: "/(store_manager)/qr", params: { storeId: storeIdParam } });
            }}
            fullWidth={true}
            variant="secondary"
          />
        </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
