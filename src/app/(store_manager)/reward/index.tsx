import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@/components/header";
import { Reward } from "@/type/store-manager/reward";
import { Modal, type ModalButton } from "@/components/modal";
import { Plus, CircleStar, Gift } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { formatDate } from "@/utils/store_manager/stamp-utils";
import React, { useCallback, useEffect, useState } from "react";
import { useRewardsByStoreQuery } from "@/hooks/store-manager/rq";
import { RefreshControl, ActivityIndicator, Platform } from "react-native";
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from "@/tw";
import { useStorePremiumCampaignEdit } from "@/hooks/store-manager/use-store-premium-campaign-edit";

const WEB_MAX_WIDTH = 896;

export default function RewardIndex() {
  const { t: translate } = useTranslation();
  const router = useRouter();
  const { storeId } = useLocalSearchParams<{ storeId: string }>();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState<{
    title: string;
    message: string;
    buttons: ModalButton[];
  } | null>(null);

  const { canEdit, loading: permLoading, expiresAtIso } = useStorePremiumCampaignEdit(storeId);
  const campaignsLocked = !permLoading && !canEdit;

  const { data, isPending, refetch } = useRewardsByStoreQuery(storeId);

  useEffect(() => {
    if (data) setRewards(data);
  }, [data, setRewards]);

  useEffect(() => {
    setLoading(isPending);
  }, [isPending, setLoading]);

  const refetchRewards = useCallback(() => {
    void refetch();
  }, [refetch]);

  useFocusEffect(
    useCallback(() => {
      refetchRewards();
    }, [refetchRewards]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const formatPoints = (pts: number) =>
    pts >= 1000 ? `${(pts / 1000).toFixed(pts % 1000 === 0 ? 0 : 1)}k` : `${pts}`;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-backgroundMuted dark:bg-darkBackgroundMuted">
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
      />

      <AppHeader
        title={translate("label.rewards")}
        description={translate("storeManager.reward.description")}
        onBackPress={() => {
          router.push(`/(store_manager)/view-store/${storeId}`);
        }}
      />

      {campaignsLocked ? (
        <View className={Platform.OS === "web" ? "mx-4 mt-3 items-center" : "mx-4 mt-3"} style={Platform.OS === "web" ? { width: "100%" } : undefined}>
          <View style={Platform.OS === "web" ? { width: "100%", maxWidth: WEB_MAX_WIDTH } : undefined} className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2.5">
            <Text className="text-xs font-poppins text-amber-900 dark:text-amber-200 leading-5">
              {expiresAtIso
                ? translate("storeManager.premiumCampaigns.bannerWithExpiry", { date: formatDate(expiresAtIso) })
                : translate("storeManager.premiumCampaigns.banner")}
            </Text>
          </View>
        </View>
      ) : null}

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 32,
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
            <View className="mx-4 mb-4 flex-row items-center bg-white dark:bg-darkBackgroundCard rounded-xl px-4 py-3 gap-x-3">
              <View className="w-10 h-10 rounded-xl items-center justify-center">
                <Gift size={20} color="#FF6600" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-poppins-bold text-slate-800 dark:text-darkTextPrimary">
                  {loading ? "—" : translate("storeManager.reward.rewardCount", { count: rewards.length })}
                </Text>
                <Text className="text-xs font-poppins text-slate-400 dark:text-darkTextSecondary">
                  {translate("storeManager.reward.subtitle")}
                </Text>
              </View>
              <TouchableOpacity
                disabled={campaignsLocked}
                onPress={() =>
                  router.push({
                    pathname: "/(store_manager)/reward/add-rewards",
                    params: { storeId },
                  })
                }
                className="flex-row items-center gap-x-1"
                activeOpacity={campaignsLocked ? 1 : 0.7}
              >
                <Text className={`text-xs font-poppins-semibold ${campaignsLocked ? "text-slate-400 dark:text-darkTextSecondary" : "text-primary"}`}>{translate("label.add")}</Text>
                <Plus size={14} color={campaignsLocked ? "#CBD5E1" : "#FF6600"} strokeWidth={3} style={{ marginTop: -1.5 }}/>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View className="items-center justify-center py-20">
                <ActivityIndicator size="large" color="#FF6600" />
                <Text className="text-xs font-poppins text-slate-400 dark:text-darkTextSecondary mt-3">{translate("storeManager.reward.loading")}</Text>
              </View>
            ) : rewards.length === 0 ? (
              <View className="mx-4 bg-white dark:bg-darkBackgroundCard rounded-xl border border-slate-100 dark:border-darkBorder px-4 py-14 items-center gap-y-2">
                <Gift size={36} color="#CBD5E1" />
                <Text className="text-sm font-poppins-semibold text-slate-400 dark:text-darkTextSecondary">{translate("storeManager.reward.emptyTitle")}</Text>
                <Text className="text-xs font-poppins text-slate-400 dark:text-darkTextSecondary text-center px-8">
                  {translate("storeManager.reward.emptyBody")}
                </Text>
                <TouchableOpacity
                  disabled={campaignsLocked}
                  onPress={() =>
                    router.push({
                      pathname: "/(store_manager)/reward/add-rewards",
                      params: { storeId },
                    })
                  }
                  className={`mt-3 px-6 py-2.5 rounded-xl ${campaignsLocked ? "bg-slate-200 dark:bg-darkBackgroundCard" : "bg-primary"}`}
                  activeOpacity={campaignsLocked ? 1 : 0.85}
                >
                  <Text className={`text-xs font-poppins-semibold ${campaignsLocked ? "text-slate-500 dark:text-darkTextMuted" : "text-white"}`}>{translate("storeManager.reward.addFirst")}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="mx-4 gap-y-2">
                {rewards.map((reward) => (
                  <TouchableOpacity
                    key={reward.id ?? reward.title}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (reward.id == null) return;
                      router.push({
                        pathname: "/(store_manager)/reward/view-reward",
                        params: { storeId, rewardId: String(reward.id) },
                      });
                    }}
                    className="bg-white dark:bg-darkBackgroundCard rounded-xl border border-slate-100 dark:border-darkBorder flex-row items-stretch p-3 gap-2.5"
                  >
                    <View
                      className="self-start rounded-lg overflow-hidden bg-white dark:bg-darkBackgroundCard border border-slate-100 dark:border-darkBorder shrink-0"
                      style={{ width: 60, height: 60 }}
                    >
                      {reward.image_url ? (
                        <Image source={{ uri: reward.image_url }} style={{ width: 60, height: 60 }} contentFit="cover" />
                      ) : (
                        <View className="w-full h-full bg-slate-50 dark:bg-darkBackgroundCard items-center justify-center">
                          <Gift size={24} color="#CBD5E1" />
                        </View>
                      )}
                    </View>

                    <View className="min-h-[60px] flex-1 flex-row gap-2 min-w-0">
                      <View className="min-w-0 flex-1">
                        <Text
                          className="text-sm font-poppins-semibold text-slate-800 dark:text-darkTextPrimary leading-5"
                          numberOfLines={1}
                        >
                          {reward.title}
                        </Text>
                        {!!reward.description && (
                          <Text
                            className="mt-0.5 text-xs font-poppins text-slate-400 dark:text-darkTextSecondary"
                            numberOfLines={2}
                          >
                            {reward.description}
                          </Text>
                        )}
                      </View>

                      <View className="shrink-0 justify-between self-stretch items-end">
                        <View className="flex-row items-center gap-x-1">
                          <CircleStar size={13} color="#FF6600" />
                          <Text className="text-xs font-poppins-semibold text-primary">
                            {translate("store_manager.reward.pts", {
                              points: formatPoints(reward.points_cost),
                            })}
                          </Text>
                        </View>
                        <Text className="text-right text-xs font-poppins text-textMuted dark:text-darkTextMuted">
                          {reward.stock > 0
                            ? translate("store_manager.reward.stockLeft", { count: reward.stock })
                            : translate("store_manager.reward.outOfStock")}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
