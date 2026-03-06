import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { View, Text, TouchableOpacity, TextInput } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ConfigureStreaks() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId } = useLocalSearchParams<{ storeId: string }>();

  const [pointsPerDay, setPointsPerDay] = useState("10");
  const [streakLength, setStreakLength] = useState("7");
  const [maxDaysCap, setMaxDaysCap] = useState("");
  const [rewardDescription, setRewardDescription] = useState(
    "Maintain your streak to unlock exclusive weekend multipliers!"
  );

  const points = parseInt(pointsPerDay) || 0;
  const days = parseInt(streakLength) || 0;
  const progressFilled = Math.min(2, days);

  const handleSave = () => {
    router.back();
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
          onPress={() => router.back()}
        >
          <MaterialIcons name="chevron-left" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-[17px] font-poppins-bold text-slate-900 dark:text-slate-100 pr-10">
          Configure Streaks
        </Text>
      </View>

      <ScrollView
        className="flex-1 gap-y-5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        <Text className="text-xl font-poppins-bold text-slate-900 dark:text-slate-100 mb-1">
          Streak Rules
        </Text>
        <Text className="text-sm font-poppins text-slate-500 dark:text-slate-400 mb-6">
          Define how customers earn loyalty points through consecutive daily actions.
        </Text>

        <View className="gap-y-5">
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
                value={pointsPerDay}
                onChangeText={setPointsPerDay}
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
                value={streakLength}
                onChangeText={setStreakLength}
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
              <Text className="text-xs font-poppins text-slate-400">
                (Optional)
              </Text>
            </View>
            <View className="relative">
              <TextInput
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 text-base font-poppins text-slate-900 dark:text-slate-100 pr-12"
                placeholder="e.g. 30"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={maxDaysCap}
                onChangeText={setMaxDaysCap}
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
              value={rewardDescription}
              onChangeText={setRewardDescription}
              style={{ textAlignVertical: "top", minHeight: 88 }}
            />
          </View>
        </View>

        <View className="mt-3">
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
                  {points} points
                </Text>{" "}
                per day for{" "}
                <Text className="font-poppins-bold text-slate-900 dark:text-slate-100">
                  {days} days
                </Text>
                .
              </Text>

              <View className="flex-row gap-1 mt-4">
                {Array.from({ length: Math.max(days, 1) }).map((_, i) => (
                  <View
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${
                      i < progressFilled ? "bg-primary" : "bg-primary/20"
                    }`}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        <View
          className="dark:bg-[#111921] border-t border-slate-200 dark:border-slate-800 gap-y-3 mt-3"
        >
          <TouchableOpacity
            className="w-full bg-primary rounded-xl py-4 items-center"
            activeOpacity={0.85}
            onPress={handleSave}
          >
            <Text className="text-white font-poppins text-[15px]">
              Save Configuration
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="w-full py-4 items-center rounded-xl bg-slate-100 border border-slate-200 dark:border-slate-700 dark:bg-slate-900"
            activeOpacity={0.7}
            onPress={() => router.back()}
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

