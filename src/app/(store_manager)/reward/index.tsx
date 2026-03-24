import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, useColorScheme, ActivityIndicator } from "react-native";
import { View, Text, TouchableOpacity, ScrollView } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { getRewardsByStoreId } from "@/services/store-manager/reward-service";
import { Reward } from "@/type/store-manager/reward";
import { Modal, type ModalButton } from "@/components/modal";

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
    <View className="flex-1 bg-backgroundMuted dark:bg-neutral-900">
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
      />

      {/* Header */}
      <View
        className="bg-background dark:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-700"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
      >
        <View className="flex-row items-center px-2">
          <TouchableOpacity
            onPress={() => router.push({ pathname: "/(store_manager)/view-store/[id]", params: { id: storeId } })}
            className="w-10 h-10 rounded-full items-center justify-center"
            activeOpacity={0.7}
          >
            <MaterialIcons name="chevron-left" size={22} color={isDark ? "#F1F5F9" : "#0F172A"} />
          </TouchableOpacity>

          <View className="flex-1 items-center justify-center -ml-10">
            <Text className="text-lg font-poppins-bold text-textPrimary dark:text-textPrimary">
              Rewards
            </Text>
            <Text className="text-xs font-poppins text-textMuted dark:text-textMuted -mt-1">
              Redeemable items for your customers
            </Text>
          </View>
        </View>
      </View>

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
          <View className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950 items-center justify-center">
            <MaterialIcons name="card-giftcard" size={20} color="#FF6600" />
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
            <MaterialIcons name="chevron-right" size={14} color="#FF6600" />
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
            <MaterialIcons name="card-giftcard" size={36} color="#CBD5E1" />
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
                className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 overflow-hidden flex-row"
              >
                {/* Image */}
                {reward.image_url ? (
                  <Image
                    source={{ uri: reward.image_url }}
                    style={{ width: 88, height: 88 }}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    className="bg-slate-100 dark:bg-neutral-700 items-center justify-center"
                    style={{ width: 88, height: 88 }}
                  >
                    <MaterialIcons name="card-giftcard" size={28} color="#CBD5E1" />
                  </View>
                )}

                {/* Details */}
                <View className="flex-1 px-3 py-3 justify-between">
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

                  <View className="flex-row items-center justify-between mt-2">
                    {/* Points cost */}
                    <View className="flex-row items-center gap-x-1">
                      <MaterialIcons name="stars" size={13} color="#FF6600" />
                      <Text className="text-xs font-poppins-bold text-primary">
                        {formatPoints(reward.points_cost)} pts
                      </Text>
                    </View>

                    {/* Stock */}
                    <View className={`flex-row items-center gap-x-1 px-2 py-0.5 rounded-full ${reward.stock > 0 ? "bg-green-50 dark:bg-green-950" : "bg-slate-100 dark:bg-neutral-700"}`}>
                      <View className={`w-1.5 h-1.5 rounded-full ${reward.stock > 0 ? "bg-green-500" : "bg-slate-300"}`} />
                      <Text className={`text-[10px] font-poppins-semibold ${reward.stock > 0 ? "text-green-600 dark:text-green-400" : "text-slate-400"}`}>
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
    </View>
  );
}
