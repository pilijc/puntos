import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, Switch, useColorScheme } from "react-native";
import { View, Text, TouchableOpacity, ScrollView, Image } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getStoreById } from "@/services/store-service";
import { getStoreFeaturesById, updateStoreFeatures } from "@/services/store-manager/feature-service";
import { getRewardsByStoreId } from "@/services/store-manager/reward-service";
import { Reward } from "@/type/store-manager/reward";
import { getActiveStampProgram } from "@/services/store-manager/stamp-service";
import { Stamp } from "@/type/store-manager/stamp";
import { Button } from "@/components/button";
import { Modal, ModalButton, ModalProps } from "@/components/modal";

const FEATURES = [
  {
    id: "streaks",
    title: "Streaks",
    description: "Reward daily consecutive visits.",
    icon: "local-fire-department" as const,
    iconColor: "#F97316",
    iconBg: "rgba(249,115,22,0.10)",
    badge: "5 points/day • 7-day streak",
  },
  {
    id: "stamps",
    title: "Stamps",
    description: "Digital punch cards for purchases.",
    icon: "loyalty" as const,
    iconColor: "#F97316",
    iconBg: "rgba(249,115,22,0.10)",
    badge: null,
  },
  {
    id: "purchased",
    title: "QR Purchase Rewards",
    description: "Scan at checkout to earn.",
    icon: "qr-code-2" as const,
    iconColor: "#F97316",
    iconBg: "rgba(249,115,22,0.10)",
    badge: null,
  },
];

const TABS = ["Overview", "Features", "Rewards"];

export default function ViewStore() {
  const { id } = useLocalSearchParams();
  const storeId = Number(id);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [store, setStore] = useState<Awaited<ReturnType<typeof getStoreById>> | null>(null);
  const [activeTab, setActiveTab] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [activeStamp, setActiveStamp] = useState<Stamp | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState<{
    title: string;
    message: string;
    buttons: ModalButton[];
    timer?: boolean;
  } | null>(null);

  const [savedFeatures, setSavedFeatures] = useState({
    streak_enabled: false,
    stamp_enabled: false,
    reward_enabled: false,
  });

  const [streakEnabled, setStreakEnabled] = useState(false);
  const [stampEnabled, setStampEnabled] = useState(false);
  const [rewardEnabled, setRewardEnabled] = useState(false);

  const toggleStreak = () => setStreakEnabled(prev => !prev);
  const toggleStamp  = () => setStampEnabled(prev => !prev);
  const toggleReward = () => setRewardEnabled(prev => !prev);

  const featureToggles: Record<string, { enabled: boolean; toggle: () => void }> = {
    streaks:   { enabled: streakEnabled, toggle: toggleStreak },
    stamps:    { enabled: stampEnabled,  toggle: toggleStamp  },
    purchased: { enabled: rewardEnabled, toggle: toggleReward },
  };

  const hasChanges =
    streakEnabled !== savedFeatures.streak_enabled ||
    stampEnabled  !== savedFeatures.stamp_enabled  ||
    rewardEnabled !== savedFeatures.reward_enabled;

    const navigateToView = (featureId: string) => {
      if (featureId === "streaks") {
        router.push({ pathname: "/(store_manager)/view-streak", params: { storeId } });
      } else if (featureId === "stamps") {
        router.push({ pathname: "/(store_manager)/view-stamp", params: { storeId } });
      }
    };
    
    const navigateToConfigure = (featureId: string) => {
      if (featureId === "streaks") {
        router.push({ pathname: "/(store_manager)/configure-streaks", params: { storeId } });
      } else if (featureId === "stamps") {
        router.push({ pathname: "/(store_manager)/configure-stamp", params: { storeId } });
      }
    };

  const fetchDynamicData = useCallback(async () => {
    const [rewardsData, stampData] = await Promise.all([
      getRewardsByStoreId(String(storeId)),
      getActiveStampProgram(String(storeId)),
    ]);
    setRewards(rewardsData);
    setActiveStamp(stampData);
  }, [storeId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchDynamicData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchDynamicData]);

  useEffect(() => {
    (async () => {
      const [storeData, featureData] = await Promise.all([
        getStoreById(storeId),
        getStoreFeaturesById(String(storeId)),
      ]);
      setStore(storeData);

      const saved = {
        streak_enabled: featureData?.streak_enabled ?? false,
        stamp_enabled:  featureData?.stamp_enabled  ?? false,
        reward_enabled: featureData?.reward_enabled ?? false,
      };
      setSavedFeatures(saved);
      setStreakEnabled(saved.streak_enabled);
      setStampEnabled(saved.stamp_enabled);
      setRewardEnabled(saved.reward_enabled);

      await fetchDynamicData();
    })();
  }, [storeId]);

  const handleSaveChanges = async () => {
    try {
      setIsSubmitting(true);
      await updateStoreFeatures({
        store_id: storeId,
        streak_enabled: streakEnabled,
        stamp_enabled: stampEnabled,
        reward_enabled: rewardEnabled,
      });
      setSavedFeatures({ streak_enabled: streakEnabled, stamp_enabled: stampEnabled, reward_enabled: rewardEnabled });
      setModal({
        title: "Success",
        message: "Changes saved successfully",
        buttons: [{ label: "OK", onPress: () => setModal(null) }],
        timer: 3000,
      });
    } catch (error) {
      setModal({
        title: "Error",
        message: (error as Error).message ?? "Failed to save changes",
        buttons: [{ label: "OK", onPress: () => setModal(null) }],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-backgroundMuted dark:bg-neutral-900">
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
        timer={modal?.timer}
      />
      <View
        className="border-b border-neutral-100 dark:border-neutral-700 bg-background dark:bg-neutral-800"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
      >
        <View className="flex-row items-center px-2">
          <TouchableOpacity
            onPress={() => router.push("/(store_manager)/stores")}
            className="w-10 h-10 rounded-full items-center justify-center"
            activeOpacity={0.7}
          >
            <MaterialIcons name="chevron-left" size={22} color={isDark ? "#F1F5F9" : "#0F172A"} />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-[17px] font-poppins-bold text-[#0F172A] dark:text-[#F1F5F9] pr-10">
            Store Details
          </Text>
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center"
            activeOpacity={0.7}
          >
            <MaterialIcons name="more-vert" size={24} color={isDark ? "#F1F5F9" : "#0F172A"} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 gap-y-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#FF6600"]}
            tintColor="#FF6600"
          />
        }
      >

        <View className="items-center gap-y-1">
          <View className="w-full h-30 items-center justify-center overflow-hidden">
            {store?.logo ? (
              <Image
                source={{ uri: store.logo }}
                className="w-full h-full"
                contentFit="cover"
              />
            ) : (
              <Image
                source={require("@/assets/images/puntos-icon.png")}
                className="w-full h-full object-cover"
              />
            )}
          </View>

          <View className="items-center w-full space-y-2 py-2 bg-white">
            <Text className="text-2xl font-poppins-bold text-textbg-Primary dark:text-textbg-Primary">
              {store?.name}
            </Text>
            {store?.address && (
              <Text className="text-sm font-poppins text-textMuted dark:text-textMuted">
                {store?.address}
              </Text>
            )}
          </View>
        </View>

        <View className="flex-row dark:border-neutral-700 px-4 pt-2 bg-white dark:bg-neutral-800">
          {TABS.map((tab, i) => {
            const selected = activeTab === i;
            return (
              <View key={tab} className="flex-1 items-center justify-center">
                <TouchableOpacity
                  onPress={() => setActiveTab(i)}
                  className="w-full items-center justify-center"
                  activeOpacity={0.7}
                >
                  <View
                    className={`items-center pb-2 border-b-2 w-full ${
                      selected ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <Text
                      className={`text-sm font-poppins-semibold text-center ${
                        selected
                          ? "text-primary"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {tab}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {activeTab === 1 && (
          <View className="px-4 elevation-0.5 mt-4">
            {FEATURES.map((feature) => {
              const { enabled, toggle } = featureToggles[feature.id];
              return (
                <View
                  key={feature.id}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden mb-3"
                >
                  <View className="p-4 flex-row items-start justify-between">
                    <TouchableOpacity
                      className="flex-row gap-x-3 flex-1"
                      activeOpacity={0.7}
                      onPress={() => navigateToView(feature.id)}
                    >
                      <View
                        className="w-12 h-12 rounded-xl items-center justify-center"
                      >
                        <MaterialIcons name={feature.icon} size={24} color={feature.iconColor} />
                      </View>
                      <View className="flex-1 justify-center">
                        <Text className="text-base font-poppins-bold text-[#0F172A] dark:text-[#F1F5F9]">
                          {feature.title}
                        </Text>
                        <Text className="text-xs font-poppins text-slate-500 dark:text-slate-500 mt-0.5">
                          {feature.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <Switch
                      value={enabled}
                      onValueChange={toggle}
                      trackColor={{ false: "#E2E8F0", true: "#FF6600" }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                  {enabled && (feature.badge || feature.id === "stamps") && (() => {
                    const badgeText = feature.id === "stamps"
                      ? activeStamp
                        ? `${activeStamp.total_stamps} stamps • ${rewards.find(r => r.id === activeStamp.reward_id)?.title ?? "Reward"}`
                        : "No active program"
                      : feature.badge;
                    return (
                      <View className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex-row items-center justify-between bg-slate-50 dark:bg-slate-900">
                        <View
                          className="flex-row items-center gap-x-1.5 px-2.5 py-1 rounded-lg"
                        >
                          <MaterialIcons
                            name="info-outline"
                            size={13}
                            color="#334155"
                          />
                          <Text
                            className="text-xs font-poppins-semibold text-slate-700 dark:text-slate-200"
                          >
                            {badgeText}
                          </Text>
                        </View>
                        <TouchableOpacity
                          className="flex-row items-center gap-x-1"
                          activeOpacity={0.7}
                          onPress={() => navigateToConfigure(feature.id)}
                        >
                          <Text className="text-sm font-poppins-semibold text-primary">
                            Configure
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })()}
                </View>
              );
            })}

            {hasChanges && (
              <Button
                label="Save Changes"
                onPress={handleSaveChanges}
                variant="primary"
                loading={isSubmitting}
                disabled={!hasChanges || isSubmitting}
                fullWidth={true}
              />
            )}
          </View>
        )}

        {activeTab === 0 && (
          <View className="pt-16 items-center gap-y-3">
            <MaterialIcons name="construction" size={40} color="#64748B" />
            <Text className="text-sm font-poppins text-slate-500 dark:text-slate-500">
              Coming soon
            </Text>
          </View>
        )}

        {activeTab === 2 && (
          <View className="px-4 mt-4 gap-y-3">
            {rewards.length === 0 ? (
              <View className="pt-12 items-center gap-y-3">
                <MaterialIcons name="redeem" size={40} color="#94A3B8" />
                <Text className="text-sm font-poppins text-slate-400 dark:text-slate-500">
                  No rewards yet. Create your first one!
                </Text>
              </View>
            ) : (
              rewards.map((reward) => (
                <View
                  key={reward.id}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex-row items-start gap-x-3"
                >
                  {reward.image_url ? (
                    <Image
                      source={{ uri: reward.image_url }}
                      className="w-20 h-20 rounded-xl"
                    />
                  ) : (
                    <View className="w-20 h-20 rounded-xl bg-primary/10 items-center justify-center">
                      <MaterialIcons name="redeem" size={32} color="#FF6600" />
                    </View>
                  )}
                  <View className="flex-1">
                    <View className="flex-row justify-between items-start">
                      <Text
                        className="text-md font-poppins-bold text-slate-900 dark:text-slate-100 flex-shrink"
                        numberOfLines={1}
                      >
                        {reward.title}
                      </Text>
                      {reward.type === "stamp" ? (
                        <View className="ml-2 flex-row items-center gap-x-1 px-2 py-0.5 rounded-lg bg-primary/10">
                          <MaterialIcons name="loyalty" size={11} color="#FF6600" />
                          <Text className="text-xs font-poppins-semibold text-primary">Stamp</Text>
                        </View>
                      ) : (
                        <Text className="text-sm font-poppins-bold text-primary ml-2 whitespace-nowrap">
                          {reward.points_cost} pts
                        </Text>
                      )}
                    </View>
                    <Text className="text-xs font-poppins text-slate-500 dark:text-slate-400" numberOfLines={2}>
                      {reward.description}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {activeTab === 2 && (
        <TouchableOpacity
          className="absolute bottom-8 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
          activeOpacity={0.85}
          onPress={() => router.push({ pathname: "/(store_manager)/rewards", params: { storeId } })}
        >
          <MaterialIcons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}
