import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, useColorScheme } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import { Check} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/button";
import { Modal, type ModalButton } from "@/components/modal";
import { TextField } from "@/components/text-field";
import { EarningType } from "@/type/store-manager/qr.purchase";
import { useQRStore } from "@/store/store-manager/qr-store";
import { createQRService } from "@/services/store-manager/qr-service";
import { AppHeader } from "@/components/header";

export default function ConfigureStreaks() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId, id } = useLocalSearchParams<{ storeId?: string; id?: string }>();
  const storeIdParam = storeId ?? id;
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
		reset
  } = useQRStore();

  const [percentageInput, setPercentageInput] = useState("");
  const [baseAmountInput, setBaseAmountInput] = useState("");
  const [fixedPointsInput, setFixedPointsInput] = useState("");
  const [minimumSpendInput, setMinimumSpendInput] = useState("");
  const [maxPointsInput, setMaxPointsInput] = useState("");

	const showError = (message: string) =>
		setModal({ title: "Almost there!", message, buttons: [{ label: "OK", onPress: () => setModal(null) }] });

	const validate = (): boolean => {
		if (earning_type === "percentage") {
			const pct = parseFloat(percentageInput);
			const base = parseFloat(baseAmountInput);
			if (!percentageInput || isNaN(pct) || pct <= 0) { showError("Please enter a valid percentage."); return false; }
			if (pct > 100) { showError("Percentage cannot exceed 100%."); return false; }
			if (baseAmountInput && isNaN(base) || base <= 0) { showError("Please enter a valid base amount."); return false; }
		} else {
			const pts = parseFloat(fixedPointsInput);
			if (!fixedPointsInput || isNaN(pts) || pts <= 0) { showError("Please enter a valid fixed points amount."); return false; }
		}
		return true;
	};

	const handleSave = async () => {
		if (isSubmitting) return;
    const storeIdForDb = storeIdParam && storeIdParam !== "undefined" ? storeIdParam : null;
    if (!storeIdForDb) {
      setModal({
        title: "Invalid Store",
        message: "Missing store id. Please go back and try again.",
        buttons: [{ label: "OK", onPress: () => setModal(null), variant: "secondary" }],
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
				title: "Success",
				message: "QR purchase rules saved successfully",
        buttons: [{ label: "OK", onPress: () => router.push({ pathname: "/(store_manager)/qr", params: { storeId: storeIdForDb } }) }],
			});
		} catch (error) {
			setModal({
				title: "Error",
				message: (error as Error).message ?? "Failed to save QR purchase rules",
				buttons: [{ label: "OK", onPress: () => setModal(null) }],
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
        title="QR Earning Rules"
        paddingTop={insets.top + 8}
        onBackPress={() => router.push({ pathname: "/(store_manager)/qr", params: { storeId: storeIdParam } })}
      />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 20 }}
      >
        <View className="bg-white rounded-xl p-4 flex-col gap-y-5">
          <View>
            <Text className="text-md font-poppins-bold text-slate-900 dark:text-slate-100">
            Set how QR scans earn points
            </Text>
            <Text className="text-sm font-poppins text-slate-500 dark:text-slate-400">
              Choose between percentage or fixed points and define when customers start earning.
            </Text>
          </View>
        <View className="gap-y-2">
          <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
            Points Type
          </Text>
          <View className="flex-row gap-x-2">
            {[{key: "percentage" as EarningType, label: "Percentage", desc: "Earn points by Purchase Percentage"},
              {key: "fixed" as EarningType, label: "Fixed", desc: "Earn a fixed number of points per transaction"}]
              .map((opt) => {
              const selected = earning_type === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  activeOpacity={0.8}
                  onPress={() => setEarningType(opt.key)}
                  className={`flex-1 rounded-2xl border p-3 gap-y-1 bg-white dark:bg-slate-900 ${
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
                  label="Percentage (%)"
                  placeholder="e.g. 10"
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
                  label="Base Amount"
                  placeholder="e.g. 10"
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
                Customers earn points based on a <Text className="font-poppins-semibold text-yellow-900 dark:text-yellow-300">percentage</Text> of their purchase.
                The <Text className="font-poppins-semibold text-yellow-900 dark:text-yellow-300">Base Amount</Text> helps determine how points are calculated for every amount spent.
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
									label="Fixed Points"
									placeholder="e.g. 5"
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
									label="Minimum Spend"
									placeholder="e.g. 3"
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
                With <Text className="font-poppins-semibold text-yellow-900 dark:text-yellow-300">Fixed Points</Text>, customers earn the same number of points every time they make a purchase.
                The <Text className="font-poppins-semibold text-yellow-900 dark:text-yellow-300">Minimum Spend</Text> is the amount they need to spend before they can start earning points.
              </Text>
            </View>
					</>
        )}

        {/* Max points per transaction — shared */}
        <TextField
          label="Max Points per Transaction"
          hint="Leave blank for no cap."
          placeholder="e.g. 50"
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
            label="Save Rules"
            onPress={handleSave}
            disabled={isSubmitting}
            loading={isSubmitting}
            fullWidth={true}
            variant="primary"
          />
          <Button
            label="Cancel"
            onPress={() => router.push({ pathname: "/(store_manager)/view-store/[id]", params: { id: storeIdParam } })}
            fullWidth={true}
            variant="secondary"
          />
        </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
