import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, useColorScheme } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/button";
import { Modal, type ModalButton } from "@/components/modal";
import { TextField } from "@/components/text-field";
import { EarningType } from "@/type/store-manager/qr.purchase";
import { useQRStore } from "@/store/store-manager/qr-store";
import { createQRService } from "@/services/store-manager/qr-service";

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
		setModal({ title: "Invalid Input", message, buttons: [{ label: "OK", onPress: () => setModal(null) }] });

	const validate = (): boolean => {
		if (earning_type === "percentage") {
			const pct = parseFloat(percentageInput);
			const base = parseFloat(baseAmountInput);
			if (!percentageInput || isNaN(pct) || pct <= 0) { showError("Percentage must be greater than 0."); return false; }
			if (pct > 100) { showError("Percentage cannot exceed 100%."); return false; }
			if (baseAmountInput && isNaN(base) || base <= 0) { showError("Base amount must be greater than 0."); return false; }
		} else {
			const pts = parseFloat(fixedPointsInput);
			if (!fixedPointsInput || isNaN(pts) || pts <= 0) { showError("Fixed points must be greater than 0."); return false; }
		}
		return true;
	};

	const handleSave = async () => {
		if (isSubmitting) return;
		if (!validate()) return;

		setIsSubmitting(true);
		try {
			await createQRService(storeId, {
				store_id: storeId,
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
				buttons: [{ label: "OK", onPress: () => router.push({ pathname: "/(store_manager)/qr", params: { storeId } }) }],
			});
			router.push({ pathname: "/(store_manager)/qr", params: { storeId } });
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
      className="bg-background dark:bg-[#111921]"
      behavior= "height"
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
          onPress={() => router.back()}
        >
          <MaterialIcons name="chevron-left" size={22} color={isDark ? "#F1F5F9" : "#0F172A"} />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-[17px] font-poppins-bold text-slate-900 dark:text-slate-100 pr-10">
          QR Purchase Rules
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
            QR Purchase Rules
          </Text>
          <Text className="text-sm font-poppins text-slate-500 dark:text-slate-400 mt-1">
            Define how customers earn loyalty points through QR purchases.
          </Text>
        </View>

        {/* Points mode toggle */}
        <View className="gap-y-2">
          <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
            Points Type
          </Text>
          <View className="flex-row gap-x-2">
            {([
              { key: "percentage" as EarningType, label: "Percentage", icon: "percent" as const, desc: "Points based on purchase percentage" },
              { key: "fixed" as EarningType,       label: "Fixed",       icon: "monetization-on" as const, desc: "Fixed points per purchase" },
            ]).map((opt) => {
              const selected = earning_type === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  activeOpacity={0.8}
                  onPress={() => setEarningType(opt.key)}
                  className={`flex-1 rounded-2xl border p-3 gap-y-1 ${
                    selected
                      ? "bg-primary/5 dark:bg-primary/10 border border-primary/10"
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

        {/* Percentage fields */}
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
                />
              </View>
            </View>

            <View className="bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/10 px-4 py-3 flex-row items-start gap-x-2">
              <MaterialIcons name="info-outline" size={15} color="#FF6600" style={{ marginTop: 1 }} />
              <Text className="flex-1 text-[11px] font-poppins text-primary/90 dark:text-primary/80">
                For every <Text className="font-poppins-semibold text-primary">Base Amount</Text> spent, customers earn <Text className="font-poppins-semibold text-primary">Percentage%</Text> in points.
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
								/>
							</View>
						</View>

						<View className="bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/10 px-4 py-3 flex-row items-start gap-x-2">
							<MaterialIcons name="info-outline" size={15} color="#FF6600" style={{ marginTop: 1 }} />
							<View className="flex-1">
								<Text className="text-[11px] font-poppins text-primary/90 dark:text-primary/80">
									Customers earn a fixed <Text className="font-poppins-semibold text-primary">Points</Text> amount for each transaction above the <Text className="font-poppins-semibold text-primary">Minimum Spend</Text>.
								</Text>
							</View>
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
        <View className="gap-y-3 border-t border-slate-200 dark:border-slate-800 pt-3">
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
            onPress={() => router.back()}
            fullWidth={true}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
