import React, { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView } from "react-native";
import { View, Text, SafeAreaView } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { deleteReward, getRewardById } from "@/services/store-manager/reward-service";
import { isStoreRewardLinkedToStampProgram } from "@/services/store-manager/stamp-service";
import { Reward } from "@/type/store-manager/reward";
import { Modal, type ModalButton } from "@/components/modal";
import { AppHeader } from "@/components/header";
import { Button } from "@/components/button";
import { Gift } from "lucide-react-native";

export default function ViewReward() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId, rewardId } = useLocalSearchParams<{ storeId: string; rewardId: string }>();
  const [reward, setReward] = useState<Reward | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [modal, setModal] = useState<{
    title: string;
    message: string;
    buttons: ModalButton[];
  } | null>(null);

  const load = useCallback(async () => {
    if (!storeId || !rewardId) return;
    try {
      const row = await getRewardById(storeId, rewardId);
      setReward(row);
    } catch {
      setReward(null);
    }
  }, [storeId, rewardId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const formatPoints = (pts: number) =>
    pts >= 1000 ? `${(pts / 1000).toFixed(pts % 1000 === 0 ? 0 : 1)}k` : `${pts}`;

  const handleDelete = async () => {
    if (!reward?.title || !storeId || !rewardId) return;

    try {
      const linkedToStamp = await isStoreRewardLinkedToStampProgram(storeId, rewardId);
      if (linkedToStamp && reward.stock > 0) {
        setModal({
          title: "Oops!",
          message:
            "This reward is currently being used as a prize in an active stamp program and cannot be deleted while it has remaining stock. Please deplete the reward's stock or update the stamp program before trying again.",
          buttons: [{ label: "OK", variant: "secondary", onPress: () => setModal(null) }],
        });
        return;
      }
    } catch (e) {
      setModal({
        title: "Error",
        message: (e as Error).message ?? "Could not verify stamp program link.",
        buttons: [{ label: "OK", onPress: () => setModal(null), variant: "secondary" }],
      });
      return;
    }

    setModal({
      title: "Delete reward?",
      message: `"${reward.title}" will be removed. This cannot be undone.`,
      buttons: [
        { label: "Cancel", variant: "secondary", onPress: () => setModal(null) },
        {
          label: "Delete",
          variant: "danger",
          onPress: async () => {
            setModal(null);
            setDeleting(true);
            try {
              await deleteReward(storeId, rewardId);
              router.replace({ pathname: "/(store_manager)/reward", params: { storeId } });
            } catch (e) {
              setModal({
                title: "Error",
                message: (e as Error).message ?? "Could not delete reward.",
                buttons: [{ label: "OK", onPress: () => setModal(null), variant: "secondary" }],
              });
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    });
  };

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
        title="Reward"
        description="Redeemable item details"
        onBackPress={() => router.replace({ pathname: "/(store_manager)/reward", params: { storeId } })}
        className="bg-backgroundMuted dark:bg-neutral-900"
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#FF6600"]}
            tintColor="#FF6600"
          />
        }
      >
        {loading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#FF6600" />
            <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 mt-3">
              Loading reward...
            </Text>
          </View>
        ) : !reward ? (
          <View className="mx-4 bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 px-4 py-14 items-center gap-y-2">
            <Gift size={36} color="#CBD5E1" />
            <Text className="text-sm font-poppins-semibold text-slate-400 dark:text-slate-500">
              Reward not found
            </Text>
          </View>
        ) : (
          <View className="mx-4 bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 p-4 gap-y-4">
            <View className="rounded-xl overflow-hidden bg-slate-100 dark:bg-neutral-700">
              {reward.image_url ? (
                <Image
                  source={{ uri: reward.image_url }}
                  style={{ width: "100%", height: 200 }}
                  contentFit="cover"
                />
              ) : (
                <View className="w-full items-center justify-center" style={{ height: 160 }}>
                  <Gift size={48} color="#CBD5E1" />
                </View>
              )}
            </View>

            <View>
              <Text className="text-md font-poppins-bold text-slate-800 dark:text-slate-100">
                {reward.title}
              </Text>
              <Text className="text-sm font-poppins text-slate-700 dark:text-slate-200">
                {reward.description || "—"}
              </Text>
            </View>

            <View className="flex-row border-t border-slate-100 dark:border-neutral-700 pt-2 gap-y-2">
              <View className="flex-1 border-r border-slate-100 dark:border-neutral-700 pr-3">
                <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">Points cost</Text>
                <View className="flex-row items-center gap-x-1 mt-0.5">
                  <Text className="text-sm font-poppins-semibold text-textPrimary">
                    {formatPoints(reward.points_cost)} pts
                  </Text>
                </View>
              </View>
              <View className="flex-1 pl-3">
                <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">Stock</Text>
                <Text className="text-sm font-poppins-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                  {reward.stock > 0 ? `${reward.stock} left` : "Out of stock"}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-x-2 pt-2">
              <View className="flex-1">
                <Button
                  label="Delete"
                  onPress={handleDelete}
                  variant="danger"
                  fullWidth
                  disabled={deleting}
                  loading={deleting}
                />
              </View>
              <View className="flex-1">
                <Button
                  label="Edit"
                  onPress={() =>
                    router.push({
                      pathname: "/(store_manager)/reward/add-rewards",
                      params: { storeId, rewardId },
                    })
                  }
                  variant="primary"
                  fullWidth
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
