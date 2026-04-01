import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, useColorScheme, ActivityIndicator } from "react-native";
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { getRewardsByStoreId } from "@/services/store-manager/reward-service";
import { Reward } from "@/type/store-manager/reward";
import { Modal, type ModalButton } from "@/components/modal";
import { AppHeader } from "@/components/header";
import { ChevronRight, CircleStar, Coins, Gift, Star } from "lucide-react-native";

export default function RewardIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState<{
    title: string;
    message: string;
    buttons: ModalButton[];
  } | null>(null);

  const fetchRewards = useCallback(async () => {
    try {
      const data = await getRewardsByStoreId(storeId);
      setRewards(data);
    } catch {
      setRewards([]);
    }
  }, [storeId]);

  useEffect(() => {
    setLoading(true);
    fetchRewards().finally(() => setLoading(false));
  }, [fetchRewards]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRewards();
    setRefreshing(false);
  }, [fetchRewards]);

  const formatPoints = (pts: number) =>
    pts >= 1000 ? `${(pts / 1000).toFixed(pts % 1000 === 0 ? 0 : 1)}k` : `${pts}`;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-backgroundMuted dark:bg-neutral-900">
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
      />

      <AppHeader
        title="Rewards"
        description="Redeemable items for your customers"
        onBackPress={() => router.replace({ pathname: "/(store_manager)/view-store/[id]", params: { id: storeId } })}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32, paddingTop: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#FF6600"]}
            tintColor="#FF6600"
          />
        }
      >
        {/* Summary banner */}
        <View className="mx-4 mb-4 flex-row items-center bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 px-4 py-3 gap-x-3">
          <View className="w-10 h-10 rounded-xl items-center justify-center">
            <Gift size={20} color="#FF6600" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-poppins-bold text-slate-800 dark:text-slate-100">
              {loading ? "—" : `${rewards.length} reward${rewards.length !== 1 ? "s" : ""}`}
            </Text>
            <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
              Items customers can redeem with points
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(store_manager)/reward/add-rewards",
                params: { storeId },
              })
            }
            className="flex-row items-center gap-x-0.5"
            activeOpacity={0.7}
          >
            <Text className="text-xs font-poppins-semibold text-primary">Add</Text>
            <ChevronRight size={14} color="#FF6600" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#FF6600" />
            <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 mt-3">
              Loading rewards...
            </Text>
          </View>
        ) : rewards.length === 0 ? (
          <View className="mx-4 bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 px-4 py-14 items-center gap-y-2">
            <Gift size={36} color="#CBD5E1" />
            <Text className="text-sm font-poppins-semibold text-slate-400 dark:text-slate-500">
              No rewards yet
            </Text>
            <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 text-center px-8">
              Create redeemable rewards that customers can claim using their loyalty points.
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(store_manager)/reward/add-rewards",
                  params: { storeId },
                })
              }
              className="mt-3 bg-primary px-6 py-2.5 rounded-xl"
              activeOpacity={0.85}
            >
              <Text className="text-xs font-poppins-semibold text-white">Add First Reward</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="mx-4 gap-y-2">
            {rewards.map((reward) => (
              <View
                key={reward.id ?? reward.title}
                className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 flex-row items-center p-2 gap-2.5"
              >
                <View
                  className="rounded-lg overflow-hidden bg-white dark:bg-neutral-700 border border-slate-100 dark:border-neutral-600 shrink-0"
                  style={{ width: 64, height: 64 }}
                >
                  {reward.image_url ? (
                    <Image
                      source={{ uri: reward.image_url }}
                      style={{ width: 64, height: 64 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="w-full h-full bg-slate-50 dark:bg-neutral-600 items-center justify-center">
                      <Gift size={24} color="#CBD5E1" />
                    </View>
                  )}
                </View>

                {/* Details */}
                <View className="flex-1 min-w-0 justify-between">
                  <View>
                    <Text
                      className="text-sm font-poppins-semibold text-slate-800 dark:text-slate-100 leading-5"
                      numberOfLines={1}
                    >
                      {reward.title}
                    </Text>
                    {!!reward.description && (
                      <Text
                        className="text-xs font-poppins text-slate-400 dark:text-slate-500 mt-0.5"
                        numberOfLines={2}
                      >
                        {reward.description}
                      </Text>
                    )}
                  </View>

                  <View className="flex-row items-center justify-between mt-1">
                    {/* Points cost */}
                    <View className="flex-row items-center gap-x-1">
                      <CircleStar size={13} color="#FF6600" />
                      <Text className="text-xs font-poppins-semibold text-primary">
                        {formatPoints(reward.points_cost)} pts
                      </Text>
                    </View>

                    {/* Stock */}
                    <View className="flex-row items-center gap-x-1 px-2 py-0.5 rounded-full">
                      <Text className="text-xs font-poppins text-textMuted dark:text-textMuted">
                        {reward.stock > 0 ? `${reward.stock} left` : "Out of stock"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
