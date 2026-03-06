import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { View, Text, TouchableOpacity, TextInput } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStreakStore } from "@/store/store-manager/streak-store";
import { createStreak } from "@/services/store-manager/streak-service";

export default function ConfigureStreaks() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
		points_per_day, 
		setPointsPerDay,
    streak_length,  
		setStreakLength,
    max_days_cap,   
		setMaxDaysCap,
    reward_description, 
		setRewardDescription,
    reset,
  } = useStreakStore();

  const progressFilled = Math.min(2, streak_length);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await createStreak({
        store_id: storeId,
        points_per_day,
        streak_length,
        max_days_cap,
        reward_description,
      });
      reset();
      Alert.alert("Success", "Streak configuration saved successfully");
      router.push({ pathname: "/(store_manager)/view-store/[id]", params: { id: storeId } });
    } catch (error) {
      Alert.alert("Error", (error as Error).message ?? "Failed to save streak configuration");
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
      <View
        className="bg-background dark:bg-[#111921] border-b border-slate-200 dark:border-slate-800 flex-row items-center px-2"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
      >
        <TouchableOpacity
          className="w-10 h-10 rounded-full items-center justify-center"
          activeOpacity={0.7}
          onPress={() => router.push({ pathname: "/(store_manager)/view-store/[id]", params: { id: storeId } })}
        >
          <MaterialIcons name="chevron-left" size={22} color="#0F172A" />
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
        <Text className="text-xl font-poppins-bold text-slate-900 dark:text-slate-100">
          Streak Rules
        </Text>
        <Text className="text-sm font-poppins text-slate-500 dark:text-slate-400">
          Define how customers earn loyalty points through consecutive daily actions.
        </Text>

        <View className="gap-y-2">
          <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
            Points per Day
          </Text>
          <View className="relative">
            <TextInput
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 text-base font-poppins text-slate-900 dark:text-slate-100 pr-12"
              placeholder="e.g. 10"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={String(points_per_day)}
              onChangeText={(v) => setPointsPerDay(parseInt(v) || 0)}
            />
            <View className="absolute right-4 top-0 bottom-0 justify-center">
              <MaterialIcons name="monetization-on" size={20} color="#94A3B8" />
            </View>
          </View>
        </View>

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
              value={String(streak_length)}
              onChangeText={(v) => setStreakLength(parseInt(v) || 0)}
            />
            <View className="absolute right-4 top-0 bottom-0 justify-center">
              <MaterialIcons name="calendar-today" size={20} color="#94A3B8" />
            </View>
          </View>
        </View>

        <View className="gap-y-2">
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
              Max Days Cap
            </Text>
            <Text className="text-xs font-poppins text-slate-400">(Optional)</Text>
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

        <View>
          <Text className="text-xs font-poppins-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 px-1">
            Customer Preview
          </Text>
          <View className="bg-primary/5 rounded-2xl p-5 flex-row gap-4 items-start">
            <View className="bg-primary rounded-full p-2 items-center justify-center">
              <MaterialIcons name="auto-awesome" size={24} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-[17px] font-poppins-bold text-primary">
                Daily Streak Active
              </Text>
              <Text className="text-sm font-poppins text-slate-600 dark:text-slate-300 mt-1">
                User earns{" "}
                <Text className="font-poppins-bold text-slate-900 dark:text-slate-100">
                  {points_per_day} points
                </Text>{" "}
                per day for{" "}
                <Text className="font-poppins-bold text-slate-900 dark:text-slate-100">
                  {streak_length} days
                </Text>.
              </Text>
              <View className="flex-row gap-1 mt-4">
                {Array.from({ length: Math.max(streak_length, 1) }).map((_, i) => (
                  <View
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${i < progressFilled ? "bg-primary" : "bg-primary/20"}`}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        <View className="gap-y-3 border-t border-slate-200 dark:border-slate-800 pt-3">
          <TouchableOpacity
            className="w-full bg-primary rounded-xl py-4 items-center"
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-poppins text-[15px]">
                Save Configuration
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            className="w-full py-4 items-center rounded-xl bg-slate-100 border border-slate-200 dark:border-slate-700 dark:bg-slate-900"
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: "/(store_manager)/view-store/[id]", params: { id: storeId } })}
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
