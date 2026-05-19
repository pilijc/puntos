import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { StoreRow } from "@/services/store-service";
import { useRouter, useFocusEffect } from "expo-router";
import { RefreshControl, Platform } from "react-native";
import React, { useState, useCallback, useMemo } from "react";
import { Modal, type ModalButton } from "@/components/modal";
import { useManagerStoresStore } from "@/store/manager-stores-store";
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from "@/tw";
import { checkStoreCreationLimit } from "@/services/store-manager/subscription-limits";
import { AlertCircle, ChartBarStacked, ChevronRight, MapPin, Plus, Store } from "lucide-react-native";
import { useStorePremiumCampaignEdit } from "@/hooks/store-manager/use-store-premium-campaign-edit";

type TabKey = "all" | "active" | "pending" | "inactive";

const WEB_MAX_WIDTH = 896;
const WEB_TAB_PILL_STYLE = { flexGrow: 1, flexBasis: 120, minWidth: 0 };

const STATUS_BADGE_STYLE: Record<
  "active" | "pending_review" | "inactive",
  { bg: string; text: string }
> = {
  active: {
    bg: "bg-green-100",
    text: "text-green-700",
  },
  pending_review: {
    bg: "bg-amber-100",
    text: "text-amber-700",
  },
  inactive: {
    bg: "bg-slate-100",
    text: "text-slate-500",
  },
};

function storeStatusBadgeStyle(status: string) {
  if (
    status === "active" ||
    status === "pending_review" ||
    status === "inactive"
  ) {
    return STATUS_BADGE_STYLE[status];
  }
  return STATUS_BADGE_STYLE.inactive;
}

function StoreCard({ store, router }: { store: StoreRow; router: any }) {
  const { t: translate } = useTranslation();
  const status = store.status ?? "inactive";
  const badgeStyle = storeStatusBadgeStyle(status);
  const badgeLabelKey =
    status === "active" || status === "pending_review" || status === "inactive"
      ? status
      : "inactive";
  const isLocked = Boolean(store.billing_suspended);

  return (
    <TouchableOpacity
      className="bg-white dark:bg-darkBackgroundMuted border border-slate-100 dark:border-darkBorder rounded-xl overflow-hidden mb-3"
      activeOpacity={0.95}
      onPress={() => router.push(`/(store_manager)/view-store/${store.id}`)}
    >
      <View className="p-4 flex-row gap-3">
        <View className="w-[60px] h-[60px] rounded-xl bg-slate-100 dark:bg-darkBackgroundCard items-center justify-center overflow-hidden">
          {store.logo ? (
            <Image
              source={{ uri: store.logo }}
              style={{ width: 60, height: 60 }}
              contentFit="cover"
            />
          ) : (
            <Store size={26} color="#94A3B8" />
          )}
        </View>
        <View className="flex-1 justify-center gap-y-1">
          <View className="flex-row items-center justify-between">
            <Text
              className="font-poppins-bold text-[15px] text-slate-900 dark:text-darkTextPrimary flex-1 mr-2"
              numberOfLines={1}
            >
              {store.name}
            </Text>
            <View className="flex-row items-center gap-1.5">
              {isLocked ? (
                <View className="self-center h-5 px-2 rounded-full bg-slate-200 dark:bg-darkBackgroundCard items-center justify-center">
                  <Text className="text-[9px] leading-4 font-poppins-bold uppercase tracking-wider text-slate-600 dark:text-darkTextSoft">
                    {translate("storeManager.stores.locked")}
                  </Text>
                </View>
              ) : null}
              <View
                className={`self-center h-5 px-2 rounded-full ${badgeStyle.bg} items-center justify-center`}
              >
                <Text
                  className={`text-[9px] leading-4 font-poppins-bold uppercase tracking-wider ${badgeStyle.text}`}
                >
                  {translate(`storeManager.stores.badge.${badgeLabelKey}`)}
                </Text>
              </View>
            </View>
          </View>
          <View className="flex-row items-center gap-1">
            <MapPin size={12} color="#94A3B8" />
            <Text
              className="text-xs font-poppins text-slate-400 dark:text-darkTextSecondary flex-1"
              numberOfLines={1}
            >
              {store.address ?? translate("storeManager.stores.noAddress")}
            </Text>
          </View>
          {store.type ? (
            <View className="flex-row items-center gap-1">
              <ChartBarStacked size={12} color="#94A3B8" />
              <Text
                className="text-xs font-poppins text-slate-400 dark:text-darkTextSecondary"
                numberOfLines={1}
              >
                {store.type}
              </Text>
            </View>
          ) : null}
          {isLocked ? (
            <Text className="text-[11px] font-poppins text-slate-500 dark:text-darkTextMuted">
              {translate("storeManager.stores.lockedSubscriptionEnded")}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function SkeletonCard() {
  return (
    <View className="bg-white dark:bg-darkBackgroundMuted border border-slate-200 dark:border-darkBorder rounded-xl overflow-hidden mb-3">
      <View className="p-4 flex-row gap-3">
        <View className="w-[60px] h-[60px] rounded-xl bg-slate-100 dark:bg-darkBackgroundCard" />
        <View className="flex-1 justify-center gap-y-2">
          <View
            className="h-4 rounded-lg bg-slate-100 dark:bg-darkBackgroundCard"
            style={{ width: "55%" }}
          />
          <View
            className="h-3 rounded-lg bg-slate-100 dark:bg-darkBackgroundCard"
            style={{ width: "75%" }}
          />
          <View
            className="h-3 rounded-lg bg-slate-100 dark:bg-darkBackgroundCard"
            style={{ width: "40%" }}
          />
        </View>
      </View>
      <View className="px-4 py-3 border-t border-slate-100 dark:border-darkBorder bg-slate-50 dark:bg-darkBackgroundCard/30 flex-row justify-between items-center">
        <View className="h-5 w-20 rounded-full bg-slate-100 dark:bg-darkBackgroundCard" />
        <View className="h-7 w-20 rounded-lg bg-slate-100 dark:bg-darkBackgroundCard" />
      </View>
    </View>
  );
}

export default function StoreManagerStores() {
  const { t: translate } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const router = useRouter();
  const { stores, loading, error, hasFetchedOnce, fetchStores } =
    useManagerStoresStore();
  const [refreshing, setRefreshing] = useState(false);
  const anyLocked = stores.some((s) => Boolean(s.billing_suspended));
  const ownerStoreIdForCampaigns = stores.find((s) => s.owner_id != null)?.id;
  const { canEdit, loading: permLoading } = useStorePremiumCampaignEdit(
    ownerStoreIdForCampaigns != null
      ? String(ownerStoreIdForCampaigns)
      : undefined,
  );
  const campaignsLocked = !permLoading && !canEdit;
  const [createGuard, setCreateGuard] = useState<{
    checked: boolean;
    allowed: boolean;
  }>({
    checked: false,
    allowed: true,
  });
  const [modal, setModal] = useState<{
    title: string;
    message: string;
    buttons: ModalButton[];
  } | null>(null);

  const tabs = useMemo(
    () =>
      (["all", "active", "pending", "inactive"] as const).map((key) => ({
        key,
        label: translate(`storeManager.stores.tabs.${key}`),
      })),
    [translate],
  );

  const filtered = React.useMemo(() => {
    if (activeTab === "all") return stores;
    if (activeTab === "pending")
      return stores.filter((s) => s.status === "pending_review");
    return stores.filter((s) => s.status === activeTab);
  }, [stores, activeTab]);

  React.useEffect(() => {
    if (!hasFetchedOnce) {
      fetchStores();
    }
  }, [hasFetchedOnce, fetchStores]);

  const refreshCreateGuard = useCallback(async () => {
    try {
      const guard = await checkStoreCreationLimit();
      setCreateGuard({ checked: true, allowed: guard.allowed });
    } catch (e) {
      setCreateGuard({ checked: true, allowed: true });
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStores(true);
    await refreshCreateGuard();
  };

  useFocusEffect(
    useCallback(() => {
      if (hasFetchedOnce) {
        fetchStores(true);
      }
      void refreshCreateGuard();
    }, [hasFetchedOnce, fetchStores, refreshCreateGuard]),
  );

  const handleCreatePress = useCallback(() => {
    if (createGuard.checked && !createGuard.allowed) {
      setModal({
        title: "Upgrade required",
        message:
          "You've reached the Free plan limit of one store. To add more stores, please subscribe to the Pro plan.",
        buttons: [
          {
            label: "Subscribe",
            variant: "primary",
            onPress: () => {
              setModal(null);
              router.push("/(store_manager)/subscription");
            },
          },
          {
            label: translate("label.cancel"),
            variant: "secondary",
            onPress: () => setModal(null),
          },
        ],
      });
      return;
    }

    router.push("/(store_manager)/store/create-store");
  }, [createGuard.allowed, createGuard.checked, router, translate]);

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-backgroundMuted dark:bg-darkBackground"
    >
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
      />
      <View className="bg-white border-b border-slate-100 dark:bg-darkBackgroundMuted dark:border-darkBorder px-6 py-4 flex-row items-center justify-start">
        <View className="flex-row items-center gap-2">
          <Text className="text-xl font-poppins-bold text-slate-900 dark:text-darkTextPrimary">
            {translate("storeManager.stores.title")}
          </Text>
        </View>
      </View>

      {(anyLocked || campaignsLocked) && (
        <View className="px-4 pt-3">
          <View className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2.5">
            <Text className="text-xs font-poppins text-amber-900 dark:text-amber-200 leading-5">
              {translate("storeManager.premiumCampaigns.banner")}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(store_manager)/subscription")}
              activeOpacity={0.85}
              className="self-start mt-2 bg-primary px-4 py-2 rounded-xl"
            >
              <Text className="text-xs font-poppins-semibold text-white">
                {translate("storeManager.stores.upgrade")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {Platform.OS === "web" ? (
        <View className="bg-backgroundMuted dark:bg-darkBackground px-4 pt-4 items-center">
          <View className="w-full max-w-4xl bg-white dark:bg-darkBackgroundMuted border border-slate-100 dark:border-darkBorder rounded-xl overflow-hidden flex-row flex-wrap p-1 gap-1">
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              const count =
                tab.key === "all"
                  ? stores.length
                  : stores.filter((s) =>
                      tab.key === "pending"
                        ? s.status === "pending_review"
                        : s.status === tab.key,
                    ).length;

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={WEB_TAB_PILL_STYLE}
                  className={[
                    "py-3 px-2 items-center flex-row justify-center gap-1.5 rounded-xl",
                    active && "bg-primary",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    className={
                      active
                        ? "min-w-0 text-xs font-poppins-bold text-white"
                        : "min-w-0 text-xs font-poppins-medium text-slate-400 dark:text-darkTextSecondary"
                    }
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                  {count > 0 && (
                    <View
                      className={`rounded-full min-w-[18px] items-center px-1.5 ${active ? "bg-white/20" : "bg-slate-100 dark:bg-darkBackgroundCard"}`}
                    >
                      <Text
                        className={`text-[10px] font-poppins-semibold ${active ? "text-white" : "text-slate-500 dark:text-darkTextMuted"}`}
                      >
                        {count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : (
        <View className="border-b border-slate-100 dark:border-darkBorder px-4 py-3">
          <View className="bg-white dark:bg-darkBackgroundMuted border border-slate-100 dark:border-darkBorder rounded-xl overflow-hidden flex-row p-1">
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              const count =
                tab.key === "all"
                  ? stores.length
                  : stores.filter((s) =>
                      tab.key === "pending"
                        ? s.status === "pending_review"
                        : s.status === tab.key,
                    ).length;

              return (
                <TouchableOpacity
                  key={tab.key}
                  className={[
                    "flex-1 py-2 items-center flex-row justify-center gap-1.5 rounded-xl",
                    active
                      ? "bg-primary"
                      : "bg-white dark:bg-darkBackgroundMuted",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    className={
                      active
                        ? "text-xs font-poppins-bold text-white"
                        : "text-xs font-poppins-medium text-slate-400 dark:text-darkTextSecondary"
                    }
                  >
                    {tab.label}
                  </Text>
                  {count > 0 && (
                    <View
                      className={`rounded-full min-w-[18px] items-center px-1.5 ${active ? "bg-white/20" : ""}`}
                    >
                      <Text
                        className={`text-[9px] font-poppins-bold ${active ? "text-white" : "text-neutral-500 dark:text-darkTextMuted"}`}
                      >
                        {count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: Platform.OS === "web" ? 16 : 1,
            paddingBottom: Platform.OS === "web" ? 20 : 0,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF6600"
              colors={["#FF6600"]}
            />
          }
        >
          {error && !loading && (
            <View className="flex-row items-center gap-2 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl p-3 mb-4">
              <AlertCircle size={16} color="#DC2626" />
              <Text className="flex-1 text-sm font-poppins text-red-600 dark:text-red-400">
                {error}
              </Text>
            </View>
          )}
          {loading && (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}
          {!loading &&
          filtered.length > 0 &&
          !error &&
          Platform.OS === "web" ? (
            <View className="items-center">
              <View className="w-full max-w-4xl bg-white dark:bg-darkBackgroundMuted border border-slate-100 dark:border-darkBorder rounded-xl overflow-hidden">
                {filtered.map((store, idx) => {
                  const status = store.status ?? "inactive";
                  const badgeStyle = storeStatusBadgeStyle(status);
                  const badgeLabelKey =
                    status === "active" ||
                    status === "pending_review" ||
                    status === "inactive"
                      ? status
                      : "inactive";
                  const isLocked = Boolean(store.billing_suspended);

                  return (
                    <View key={store.id}>
                      <TouchableOpacity
                        activeOpacity={0.95}
                        onPress={() =>
                          router.push(`/(store_manager)/view-store/${store.id}`)
                        }
                        className="flex-row items-center gap-x-3 px-4 py-4"
                      >
                        <View className="w-[52px] h-[52px] rounded-xl bg-slate-100 dark:bg-darkBackgroundCard items-center justify-center overflow-hidden">
                          {store.logo ? (
                            <Image
                              source={{ uri: store.logo }}
                              style={{ width: 52, height: 52 }}
                              contentFit="cover"
                            />
                          ) : (
                            <Store size={24} color="#94A3B8" />
                          )}
                        </View>

                        <View className="flex-1 min-w-0 gap-y-1">
                          <View className="flex-row items-center justify-between gap-x-2">
                            <Text
                              className="font-poppins-bold text-[15px] text-slate-900 dark:text-darkTextPrimary flex-1"
                              numberOfLines={1}
                            >
                              {store.name}
                            </Text>
                          </View>

                          <View className="flex-row items-center gap-1">
                            <MapPin size={12} color="#94A3B8" />
                            <Text
                              className="text-xs font-poppins text-slate-400 dark:text-darkTextSecondary flex-1"
                              numberOfLines={1}
                            >
                              {store.address ??
                                translate("storeManager.stores.noAddress")}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row items-center gap-1.5">
                          {isLocked ? (
                            <View className="h-5 px-2 rounded-full bg-slate-200 dark:bg-darkBackgroundCard items-center justify-center">
                              <Text className="text-[10px] leading-4 font-poppins-semibold text-slate-600 dark:text-darkTextSoft">
                                {translate("storeManager.stores.locked")}
                              </Text>
                            </View>
                          ) : null}
                          <View
                            className={`h-5 px-2 rounded-full ${badgeStyle.bg} items-center justify-center`}
                          >
                            <Text
                              className={`text-[10px] leading-4 font-poppins-semibold ${badgeStyle.text}`}
                            >
                              {translate(
                                `storeManager.stores.badge.${badgeLabelKey}`,
                              )}
                            </Text>
                          </View>
                        </View>
                        <ChevronRight size={20} color="#94A3B8" />
                      </TouchableOpacity>

                      {idx < filtered.length - 1 ? (
                        <View className="h-px bg-slate-100 dark:bg-darkBackgroundCard" />
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          ) : !loading &&
            filtered.length > 0 &&
            !error &&
            Platform.OS === "android" ? (
            <View>
              <View className="bg-white dark:bg-darkBackgroundMuted border border-slate-100 dark:border-darkBorder rounded-xl overflow-hidden">
                {filtered.map((store, idx) => {
                  const status = store.status ?? "inactive";
                  const badgeStyle = storeStatusBadgeStyle(status);
                  const badgeLabelKey =
                    status === "active" ||
                    status === "pending_review" ||
                    status === "inactive"
                      ? status
                      : "inactive";
                  const isLocked = Boolean(store.billing_suspended);

                  return (
                    <View key={store.id}>
                      <TouchableOpacity
                        activeOpacity={0.95}
                        onPress={() =>
                          router.push(`/(store_manager)/view-store/${store.id}`)
                        }
                        className="flex-row items-center gap-x-3 px-4 py-4"
                      >
                        <View className="w-[52px] h-[52px] rounded-xl bg-slate-100 dark:bg-darkBackgroundCard items-center justify-center overflow-hidden">
                          {store.logo ? (
                            <Image
                              source={{ uri: store.logo }}
                              style={{ width: 52, height: 52 }}
                              contentFit="cover"
                            />
                          ) : (
                            <Store size={24} color="#94A3B8" />
                          )}
                        </View>

                        <View className="flex-1 min-w-0 gap-y-1">
                          <View className="flex-row items-center justify-between gap-x-2">
                            <Text
                              className="font-poppins-bold text-[15px] text-slate-900 dark:text-darkTextPrimary flex-1"
                              numberOfLines={1}
                            >
                              {store.name}
                            </Text>
                          </View>

                          <View className="flex-row items-center gap-1">
                            <MapPin size={12} color="#94A3B8" />
                            <Text
                              className="text-xs font-poppins text-slate-400 dark:text-darkTextSecondary flex-1"
                              numberOfLines={1}
                            >
                              {store.address ??
                                translate("storeManager.stores.noAddress")}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-center gap-1.5">
                          {isLocked ? (
                            <View className="h-5 px-2 rounded-full bg-slate-200 dark:bg-darkBackgroundCard items-center justify-center">
                              <Text className="text-[10px] leading-4 font-poppins-semibold text-slate-600 dark:text-darkTextSoft">
                                {translate("storeManager.stores.locked")}
                              </Text>
                            </View>
                          ) : null}
                          <View
                            className={`h-5 px-2 rounded-full ${badgeStyle.bg} items-center justify-center`}
                          >
                            <Text
                              className={`text-[10px] leading-4 font-poppins-semibold ${badgeStyle.text}`}
                            >
                              {translate(
                                `storeManager.stores.badge.${badgeLabelKey}`,
                              )}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>

                      {idx < filtered.length - 1 ? (
                        <View className="h-px bg-slate-100 dark:bg-darkBackgroundCard" />
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            !loading &&
            filtered.map((store) => (
              <StoreCard key={store.id} store={store} router={router} />
            ))
          )}
          {!loading && filtered.length === 0 && !error && (
            <View className="items-center">
              <View className="w-full max-w-4xl bg-white dark:bg-darkBackgroundMuted border border-slate-100 dark:border-darkBorder rounded-xl px-6 py-8 items-center gap-4">
                <View className="bg-white dark:bg-darkBackgroundMuted rounded-xl">
                  <Image
                    source={require("@/assets/images/found.png")}
                    style={{
                      width: Platform.OS === "web" ? 180 : 120,
                      height: Platform.OS === "web" ? 180 : 120,
                    }}
                    contentFit="contain"
                  />
                </View>
                <View className="items-center">
                  <Text className="text-base font-poppins-bold text-slate-600 dark:text-darkTextSoft text-center">
                    {activeTab === "all"
                      ? translate("storeManager.stores.empty.allTitle")
                      : activeTab === "active"
                        ? translate("storeManager.stores.empty.activeTitle")
                        : activeTab === "pending"
                          ? translate("storeManager.stores.empty.pendingTitle")
                          : translate(
                              "storeManager.stores.empty.inactiveTitle",
                            )}
                  </Text>
                  <Text className="text-xs font-poppins text-slate-400 dark:text-darkTextSecondary text-center px-8">
                    {activeTab === "all"
                      ? translate("storeManager.stores.empty.hintAll")
                      : translate("storeManager.stores.empty.hintFiltered")}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {Platform.OS === "web" ? (
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 60,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: "100%",
                maxWidth: WEB_MAX_WIDTH,
                paddingHorizontal: 16,
                alignItems: "flex-end",
              }}
            >
              <TouchableOpacity
                className="w-14 h-14 rounded-full bg-primary items-center justify-center"
                onPress={() => {
                  handleCreatePress();
                }}
              >
                <Plus size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            className="absolute bottom-5 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center"
            onPress={() => {
              handleCreatePress();
            }}
          >
            <Plus size={28} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
