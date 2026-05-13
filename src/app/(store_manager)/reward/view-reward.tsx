import React, { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Platform } from "react-native";
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
import { useTranslation } from "react-i18next";
import { useStorePremiumCampaignEdit } from "@/hooks/store-manager/use-store-premium-campaign-edit";

const WEB_MAX_WIDTH = 896;

export default function ViewReward() {
  const { t: translate } = useTranslation();
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

  const { canEdit, loading: permLoading } = useStorePremiumCampaignEdit(storeId);
  const campaignsLocked = !permLoading && !canEdit;

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
          title: translate("label.oops"),
          message: translate("storeManager.rewardView.deleteBlockedMessage"),
          buttons: [{ label: translate("label.ok"), variant: "secondary", onPress: () => setModal(null) }],
        });
        return;
      }
    } catch (e) {
      setModal({
        title: translate("label.error"),
        message: (e as Error).message ?? translate("storeManager.rewardView.verifyStampError"),
        buttons: [{ label: translate("label.ok"), onPress: () => setModal(null), variant: "secondary" }],
      });
      return;
    }

    setModal({
      title: translate("storeManager.rewardView.deleteTitle"),
      message: translate("storeManager.rewardView.deleteMessage", { title: reward.title }),
      buttons: [
        { label: translate("label.cancel"), variant: "secondary", onPress: () => setModal(null) },
        {
          label: translate("label.delete"),
          variant: "danger",
          onPress: async () => {
            setModal(null);
            setDeleting(true);
            try {
              await deleteReward(storeId, rewardId);
              router.push({ pathname: "/(store_manager)/reward", params: { storeId } });
            } catch (e) {
              setModal({
                title: translate("label.error"),
                message: (e as Error).message ?? translate("storeManager.rewardView.deleteError"),
                buttons: [{ label: translate("label.ok"), onPress: () => setModal(null), variant: "secondary" }],
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
        title={translate("storeManager.rewardView.title")}
        description={translate("storeManager.rewardView.description")}
        onBackPress={() => {
          router.push({ pathname: "/(store_manager)/reward", params: { storeId } });
        }}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
          paddingTop: 12,
          paddingHorizontal: Platform.OS === "web" ? 16 : 0,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#FF6600"]}
            tintColor="#FF6600"
          />
        }
      >
        <View className={Platform.OS === "web" ? "items-center" : ""} style={Platform.OS === "web" ? { width: "100%" } : undefined}>
          <View style={Platform.OS === "web" ? { width: "100%", maxWidth: WEB_MAX_WIDTH } : undefined}>
            {loading ? (
              <View className="items-center justify-center py-20">
                <ActivityIndicator size="large" color="#FF6600" />
                <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 mt-3">{translate("storeManager.rewardView.loading")}</Text>
              </View>
            ) : !reward ? (
              <View className="mx-4 bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 px-4 py-14 items-center gap-y-2">
                <Gift size={36} color="#CBD5E1" />
                <Text className="text-sm font-poppins-semibold text-slate-400 dark:text-slate-500">{translate("storeManager.rewardView.notFoundTitle")}</Text>
              </View>
            ) : (
              <View className="mx-4 bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 p-4 gap-y-4">
                <View className="rounded-xl overflow-hidden bg-slate-100 dark:bg-neutral-700">
                  {reward.image_url ? (
                    <Image source={{ uri: reward.image_url }} style={{ width: "100%", height: 200 }} contentFit="cover" />
                  ) : (
                    <View className="w-full items-center justify-center" style={{ height: 160 }}>
                      <Gift size={48} color="#CBD5E1" />
                    </View>
                  )}
                </View>

                <View>
                  <Text className="text-md font-poppins-bold text-slate-800 dark:text-slate-100">{reward.title}</Text>
                  <Text className="text-sm font-poppins text-slate-700 dark:text-slate-200">{reward.description || "—"}</Text>
                </View>

                <View className="flex-row border-t border-slate-100 dark:border-neutral-700 pt-2 gap-y-2">
                  <View className="flex-1 border-r border-slate-100 dark:border-neutral-700 pr-3">
                    <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">{translate("storeManager.rewardView.pointsCost")}</Text>
                    <View className="flex-row items-center gap-x-1 mt-0.5">
                      <Text className="text-sm font-poppins-semibold text-textPrimary">{translate("storeManager.reward.pts", { points: formatPoints(reward.points_cost) })}</Text>
                    </View>
                  </View>
                  <View className="flex-1 pl-3">
                    <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">{translate("storeManager.rewardView.stock")}</Text>
                    <Text className="text-sm font-poppins-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                      {reward.stock > 0 ? translate("storeManager.reward.stockLeft", { count: reward.stock }) : translate("storeManager.reward.outOfStock")}
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-x-2 pt-2">
                  <View className="flex-1">
                    <Button
                      label={translate("storeManager.rewardView.delete")}
                      onPress={handleDelete}
                      variant="danger"
                      fullWidth
                      disabled={campaignsLocked || deleting}
                      loading={deleting}
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      label={translate("label.edit")}
                      onPress={() =>
                        router.push({
                          pathname: "/(store_manager)/reward/add-rewards",
                          params: { storeId, rewardId },
                        })
                      }
                      variant="primary"
                      fullWidth
                      disabled={campaignsLocked}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
