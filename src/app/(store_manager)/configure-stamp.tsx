import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { View, Text, TouchableOpacity, TextInput } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useStampStore } from "@/store/store-manager/stamp-store";
import { createStamp, getActiveStampProgram } from "@/services/store-manager/stamp-service";
import { getRewardsByStoreId } from "@/services/store-manager/reward-service";
import { Reward } from "@/type/store-manager/reward";
import { ExpirationMode } from "@/type/store-manager/stamp";

const EXPIRATION_OPTIONS: { key: ExpirationMode; label: string; description: string; icon: string }[] = [
  {
    key: "none",
    label: "No Expiration",
    description: "Stamps never expire until the user completes the card.",
    icon: "all-inclusive",
  },
  {
    key: "card",
    label: "Card Expiration",
    description: "The entire stamp card expires if not completed within a set number of days.",
    icon: "timer",
  },
];

export default function ConfigureStamp() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingActive, setCheckingActive] = useState(true);
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

  const [rewards, setRewards] = useState<Reward[]>([]);

  useEffect(() => {
    if (!storeId) return;
    (async () => {
      try {
        const active = await getActiveStampProgram(storeId);
        if (active) {
          Alert.alert(
            "Active Program Exists",
            "There is already an active stamp program for this store. End the current program from the Stamp Cards screen before creating a new one.",
            [
              {
                text: "View Active Program",
                onPress: () =>
                  router.push({ pathname: "/(store_manager)/view-stamp", params: { storeId } }),
              },
              { text: "Cancel", style: "cancel", onPress: () => router.back() },
            ]
          );
        }
      } finally {
        setCheckingActive(false);
      }
    })();
  }, [storeId]);

  useFocusEffect(
    useCallback(() => {
      if (!storeId) return;
      getRewardsByStoreId(storeId)
        .then((all) => setRewards(all.filter((r) => r.type === "stamp")))
        .catch(() => setRewards([]));
    }, [storeId])
  );

  const handleSave = async () => {
    if (!total_stamps || total_stamps < 1) {
      Alert.alert("Validation Error", "Please enter a valid number of stamps required.");
      return;
    }
    if (!reward_id) {
      Alert.alert("Validation Error", "Please select a reward for this stamp program.");
      return;
    }
    if (expiration_mode === "card" && (!expiration_days || expiration_days < 1)) {
      Alert.alert("Validation Error", "Please enter a valid number of days for card expiration.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createStamp({
        store_id: storeId,
        total_stamps,
        reward_id,
        expiration_mode,
        expiration_days: expiration_mode === "card" ? expiration_days : null,
      });
      reset();
      Alert.alert("Success", "Stamp program created successfully!");
      router.push({ pathname: "/(store_manager)/view-stamp", params: { storeId } });
    } catch (error) {
      Alert.alert("Error", (error as Error).message ?? "Failed to create stamp program.");
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
      <View
        className="bg-background dark:bg-[#111921] border-b border-slate-200 dark:border-slate-800 flex-row items-center px-2"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
      >
        <TouchableOpacity
          className="w-10 h-10 rounded-full items-center justify-center"
          activeOpacity={0.7}
          onPress={() => router.push({ pathname: "/(store_manager)/view-stamp", params: { storeId } })}
        >
          <MaterialIcons name="chevron-left" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-[17px] font-poppins-bold text-slate-900 dark:text-slate-100 pr-10">
          New Stamp Program
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, gap: 16 }}
      >
        {/* Program rules disclaimer */}
        <View className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 p-4 gap-y-3">
          <View className="flex-row items-center gap-x-2">
            <MaterialIcons name="info" size={18} color="#D97706" />
            <Text className="text-sm font-poppins-bold text-amber-700 dark:text-amber-400">
              Before You Start
            </Text>
          </View>
          <View className="gap-y-2">
            {[
              "Only 1 stamp program can be active per store at a time.",
              "Once created, this program cannot be edited — only ended.",
              "When you end a program, users cannot earn new stamps, but can still redeem during the grace period.",
              "Existing user stamp history is always preserved for reporting.",
              "Choose your expiration mode carefully — it cannot be changed after creation.",
            ].map((rule, i) => (
              <View key={i} className="flex-row items-start gap-x-2">
                <Text className="text-amber-500 text-xs mt-0.5">•</Text>
                <Text className="text-xs font-poppins text-amber-700 dark:text-amber-400 flex-1">
                  {rule}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Section: Basic Details */}
        <View className="gap-y-4">
          <View className="gap-y-1">
            <Text className="text-base font-poppins-bold text-slate-900 dark:text-slate-100">
              Stamp Details
            </Text>
            <Text className="text-sm font-poppins text-slate-500 dark:text-slate-400">
              Set the rules for your digital loyalty card.
            </Text>
          </View>

          {/* Total stamps */}
          <View className="gap-y-1.5">
            <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
              Stamps Required to Redeem
            </Text>
            <View className="relative">
              <TextInput
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 text-base font-poppins text-slate-900 dark:text-slate-100 pr-12"
                placeholder="e.g. 10"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={total_stamps > 0 ? String(total_stamps) : ""}
                onChangeText={(v) => setTotalStamps(parseInt(v) || 0)}
              />
              <View className="absolute right-4 top-0 bottom-0 justify-center">
                <MaterialIcons name="pin" size={20} color="#94A3B8" />
              </View>
            </View>
          </View>

          {/* Reward picker */}
          <View className="gap-y-1.5">
            <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
              Reward
            </Text>
            {rewards.length === 0 ? (
              <View className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-5 items-center gap-y-3">
                <MaterialIcons name="redeem" size={28} color="#94A3B8" />
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
                    router.push({ pathname: "/(store_manager)/rewards", params: { storeId } })
                  }
                >
                  <Text className="text-white text-xs font-poppins-bold">Create a Reward</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-y-2">
                {rewards.map((r) => {
                  const selected = reward_id === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      activeOpacity={0.8}
                      onPress={() => setRewardId(r.id!)}
                      className={`flex-row items-center gap-x-3 rounded-xl border px-4 py-3 ${
                        selected
                          ? "border-primary/10 bg-primary/10"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      }`}
                    >
                      {r.image_url ? (
                        <Image
                          source={{ uri: r.image_url }}
                          style={{ width: 40, height: 40, borderRadius: 10 }}
                          contentFit="cover"
                        />
                      ) : (
                        <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
                          <MaterialIcons name="redeem" size={20} color="#FF6600" />
                        </View>
                      )}
                      <View className="flex-1">
                        <Text
                          className={`text-sm font-poppins-semibold ${
                            selected ? "text-primary" : "text-slate-900 dark:text-slate-100"
                          }`}
                        >
                          {r.title}
                        </Text>
                        <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 mt-0.5">
                          {r.points_cost} pts
                        </Text>
                      </View>
                      <View
                        className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                          selected
                            ? "border-primary bg-primary"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {selected && <MaterialIcons name="check" size={12} color="#fff" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Section: Expiration Mode */}
        <View className="gap-y-3">
          <View className="gap-y-1">
            <Text className="text-base font-poppins-bold text-slate-900 dark:text-slate-100">
              Expiration Mode
            </Text>
            <Text className="text-sm font-poppins text-slate-500 dark:text-slate-400">
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
                className={`rounded-2xl border p-4 gap-y-1 ${
                  selected
                    ? "bg-primary/5 dark:bg-primary/10 border-primary/10"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-x-2 flex-1">
                    <View
                      className={`w-8 h-8 rounded-lg items-center justify-center ${
                        selected ? "bg-primary/20" : "bg-slate-100 dark:bg-slate-700"
                      }`}
                    >
                      <MaterialIcons
                        name={opt.icon as any}
                        size={16}
                        color={selected ? "#FF6600" : "#94A3B8"}
                      />
                    </View>
                    <Text
                      className={`text-sm font-poppins-bold ${
                        selected ? "text-primary" : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </View>
                  <View
                    className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                      selected ? "border-primary bg-primary" : "border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {selected && <MaterialIcons name="check" size={12} color="#fff" />}
                  </View>
                </View>
                <Text
                  className={`text-xs font-poppins pl-10 ${
                    selected ? "text-primary/70" : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {opt.description}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Card expiration days input */}
          {expiration_mode === "card" && (
            <View className="gap-y-1.5 pl-1">
              <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
                Expiration Period (days)
              </Text>
              <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
                The stamp card will expire this many days after the user's first stamp.
              </Text>
              <View className="relative">
                <TextInput
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 text-base font-poppins text-slate-900 dark:text-slate-100 pr-20"
                  placeholder="e.g. 30"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={expiration_days > 0 ? String(expiration_days) : ""}
                  onChangeText={(v) => setExpirationDays(parseInt(v) || 0)}
                />
                <View className="absolute right-4 top-0 bottom-0 justify-center">
                  <Text className="text-sm font-poppins text-slate-400">days</Text>
                </View>
              </View>
            </View>
          )}

          {/* Expiration mode info box */}
          <View className="rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-3 gap-y-2">
            {expiration_mode === "none" ? (
              <>
                <View className="flex-row items-center gap-x-1.5">
                  <MaterialIcons name="check-circle" size={13} color="#10B981" />
                  <Text className="text-xs font-poppins-semibold text-emerald-600 dark:text-emerald-400">
                    No Expiration Selected
                  </Text>
                </View>
                <Text className="text-xs font-poppins text-slate-500 dark:text-slate-400">
                  Users can collect stamps at their own pace — even over years. Stamps remain valid until the card is completed and the reward is redeemed.
                </Text>
              </>
            ) : (
              <>
                <View className="flex-row items-center gap-x-1.5">
                  <MaterialIcons name="timer" size={13} color="#F59E0B" />
                  <Text className="text-xs font-poppins-semibold text-amber-600 dark:text-amber-400">
                    Card Expiration Selected
                  </Text>
                </View>
                <Text className="text-xs font-poppins text-slate-500 dark:text-slate-400">
                  The stamp card will expire {expiration_days} day{expiration_days !== 1 ? "s" : ""} after the user's first stamp, regardless of progress. Users should be informed of this deadline.
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Actions */}
        <View className="gap-y-3 pt-2 pb-4">
          <TouchableOpacity
            className="w-full bg-primary rounded-xl py-4 items-center"
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-poppins-bold text-[15px]">
                Launch Stamp Program
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            className="w-full py-4 items-center rounded-xl bg-slate-100 border border-slate-200 dark:border-slate-700 dark:bg-slate-900"
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: "/(store_manager)/view-stamp", params: { storeId } })}
          >
            <Text className="text-sm font-poppins-medium text-slate-500 dark:text-slate-400">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
