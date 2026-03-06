import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { View, Text, TouchableOpacity, TextInput } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useStampStore } from "@/store/store-manager/stamp-store";
import { createStamp } from "@/services/store-manager/stamp-service";
import { getRewardsByStoreId } from "@/services/store-manager/reward-service";
import { Reward } from "@/type/store-manager/reward";

export default function ConfigureStamp() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { 
    total_stamps, 
    reward_id, 
    setTotalStamps, 
    setRewardId, 
    reset,
  } = useStampStore();

  const [rewards, setRewards] = useState<Reward[]>([]);

  useEffect(() => {
    if (!storeId) return;
    getRewardsByStoreId(storeId).then(setRewards).catch(() => setRewards([]));
  }, [storeId]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await createStamp({
        store_id: storeId,
        total_stamps,
        reward_id,
      });
      Alert.alert("Success", "Stamp configuration saved successfully");
      router.push({ pathname: "/(store_manager)/view-store/[id]", params: { id: storeId } });
    } catch (error) {
      Alert.alert("Error", (error as Error).message ?? "Failed to save stamp configuration");
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
          Configure Stamps
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16 }}
      >
       <View className="gap-y-2">
					<View className="gap-y-1">
						<Text className="text-xl font-poppins-bold text-slate-900 dark:text-slate-100">
							Stamp Details
						</Text>
						<Text className="text-sm font-poppins text-slate-500 dark:text-slate-400">
							Set up the rules for your digital loyalty card.
						</Text>
					</View>

					<View className="mt-2">
						<Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
							Total Stamps Required
						</Text>
						<View className="relative">
							<TextInput
								className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 text-base font-poppins text-slate-900 dark:text-slate-100 pr-12"
								placeholder="e.g. 10"
								placeholderTextColor="#94A3B8"
								keyboardType="numeric"
								value={String(total_stamps)}
								onChangeText={(v) => setTotalStamps(parseInt(v) || 0)}
							/>
							<View className="absolute right-4 top-0 bottom-0 justify-center">
								<MaterialIcons name="pin" size={20} color="#94A3B8" />
							</View>
						</View>
					</View>

					<View className="gap-y-2">
						<Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
							Reward
						</Text>
						{rewards.length === 0 ? (
							<View className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-5 items-center gap-y-1">
								<MaterialIcons name="redeem" size={24} color="#94A3B8" />
								<Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
									No rewards found for this store
								</Text>
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
													? "border-primary/0 bg-primary/10"
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
												<Text className={`text-sm font-poppins-semibold ${selected ? "text-primary" : "text-slate-900 dark:text-slate-100"}`}>
													{r.title}
												</Text>
												<Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 mt-0.5" numberOfLines={1}>
													{r.points_cost} pts
												</Text>
											</View>
											<View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${selected ? "border-primary bg-primary" : "border-slate-300 dark:border-slate-600"}`}>
												{selected && <MaterialIcons name="check" size={12} color="#fff" />}
											</View>
										</TouchableOpacity>
									);
								})}
							</View>
						)}
					</View>

					<View className="gap-y-3">
						<Text className="text-xs font-poppins-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">
							Card Preview
						</Text>
						<View
							className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
							<View className="flex-row justify-between items-start mb-6">
								<View>
									<Text className="text-sm font-poppins-semibold text-primary dark:text-slate-100 uppercase tracking-widest">
										Loyalty Rewards
									</Text>
									<Text className="text-lg font-poppins-bold text-primary dark:text-slate-100 mt-0.5">
										Stamp Card
									</Text>
								</View>
								<View className="bg-primary/10 dark:bg-slate-700 p-2 rounded-xl">
									<MaterialIcons name="loyalty" size={22} color="#FF6600" />
								</View>
							</View>

							<View className="flex-row flex-wrap gap-2 mb-6">
								{Array.from({ length: Math.max(total_stamps, 1) }).map((_, i) => (
									<View
										key={i}
										className="w-8 h-8 rounded-full border-2 border-dashed border-primary/40 bg-primary/10 items-center justify-center"
									>
										{i === 0 && (
											<MaterialIcons name="star" size={14} color="#FF6600" />
										)}
									</View>
								))}
							</View>

							<View className="bg-primary/10 rounded-xl p-4">
								<Text className="text-sm font-poppins text-primary mt-0.5">
									Collect{" "}
									<Text className="text-primary">{total_stamps || "N"}</Text>{" "}
									stamps to redeem:
								</Text>
								<Text className="text-base font-poppins-bold text-primary mt-1">
									{rewards.find((r) => r.id === reward_id)?.title || "[Reward Title]"}
								</Text>
							</View>
						</View>
					</View>

					<View className="gap-y-3 pt-3">
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
			 </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
