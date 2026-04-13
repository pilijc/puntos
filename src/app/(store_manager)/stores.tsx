import React, { useState, useCallback, useMemo } from "react";
import { RefreshControl, Platform } from "react-native";
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from "@/tw";
import { Image } from "expo-image";
import { useRouter, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { StoreRow } from "@/services/store-service";
import { useManagerStoresStore } from "@/store/manager-stores-store";
import { AlertCircle, ChartBarStacked, ChevronRight, MapPin, Plus, Store } from "lucide-react-native";

type TabKey = "all" | "active" | "pending" | "inactive";

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
  if (status === "active" || status === "pending_review" || status === "inactive") {
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

  return (
    <TouchableOpacity
      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden mb-3"
      activeOpacity={0.95}
      onPress={() =>
        router.push(`/(store_manager)/view-store/${store.id}`)
      }
    >
      <View className="p-4 flex-row gap-3">
        <View className="w-[60px] h-[60px] rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center overflow-hidden">
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
              className="font-poppins-bold text-[15px] text-slate-900 dark:text-slate-100 flex-1 mr-2"
              numberOfLines={1}
            >
              {store.name}
            </Text>
            <View className={`self-center h-5 px-2 rounded-full ${badgeStyle.bg} items-center justify-center`}>
              <Text
                className={`text-[9px] leading-4 font-poppins-bold uppercase tracking-wider ${badgeStyle.text}`}
              >
                {translate(`storeManager.stores.badge.${badgeLabelKey}`)}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-1">
            <MapPin size={12} color="#94A3B8" />
            <Text
              className="text-xs font-poppins text-slate-400 dark:text-slate-500 flex-1"
              numberOfLines={1}
            >
              {store.address ?? translate("storeManager.stores.noAddress")}
            </Text>
          </View>
          {store.type ? (
            <View className="flex-row items-center gap-1">
              <ChartBarStacked size={12} color="#94A3B8" />
              <Text
                className="text-xs font-poppins text-slate-400 dark:text-slate-500"
                numberOfLines={1}
              >
                {store.type}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function SkeletonCard() {
  return (
    <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden mb-3">
      <View className="p-4 flex-row gap-3">
        <View className="w-[60px] h-[60px] rounded-xl bg-slate-100 dark:bg-slate-800" />
        <View className="flex-1 justify-center gap-y-2">
          <View
            className="h-4 rounded-lg bg-slate-100 dark:bg-slate-800"
            style={{ width: "55%" }}
          />
          <View
            className="h-3 rounded-lg bg-slate-100 dark:bg-slate-800"
            style={{ width: "75%" }}
          />
          <View
            className="h-3 rounded-lg bg-slate-100 dark:bg-slate-800"
            style={{ width: "40%" }}
          />
        </View>
      </View>
      <View className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex-row justify-between items-center">
        <View className="h-5 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
        <View className="h-7 w-20 rounded-lg bg-slate-100 dark:bg-slate-800" />
      </View>
    </View>
  );
}

export default function StoreManagerStores() {
  const { t: translate } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const router = useRouter();
  const { stores, loading, error, hasFetchedOnce, fetchStores } = useManagerStoresStore();
  const [refreshing, setRefreshing] = useState(false);

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
    if (activeTab === "pending") return stores.filter(s => s.status === "pending_review");
    return stores.filter(s => s.status === activeTab);
  }, [stores, activeTab]);

  React.useEffect(() => {
    if (!hasFetchedOnce) {
      fetchStores();
    }
  }, [hasFetchedOnce, fetchStores]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStores(true);
  };

  useFocusEffect(
    useCallback(() => {
      if (hasFetchedOnce) {
        fetchStores();
      }
    }, [hasFetchedOnce, fetchStores])
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-backgroundMuted dark:bg-slate-950">
      <View className="bg-white border-b border-slate-100 dark:bg-slate-900 dark:border-slate-800 px-6 py-4 flex-row items-center justify-start">
        <View className="flex-row items-center gap-2">
          <Text className="text-xl font-poppins-bold text-slate-900 dark:text-slate-100">
            {translate("storeManager.stores.title")}
          </Text>
        </View>
      </View>

      {Platform.OS === "web" ? (
        <View className="bg-backgroundMuted dark:bg-slate-950 px-4 pt-4 items-center">
          <View className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden flex-row">
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              const count =
                tab.key === "all"
                  ? stores.length
                  : stores.filter((s) =>
                    tab.key === "pending"
                      ? s.status === "pending_review"
                      : s.status === tab.key
                  ).length;

              return (
                <TouchableOpacity
                  key={tab.key}
                  className={[
                    "flex-1 py-3 items-center flex-row justify-center gap-1.5 rounded-xl mx-1 my-1",
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
                        ? "text-xs font-poppins-bold text-white"
                        : "text-xs font-poppins-medium text-slate-400 dark:text-slate-500"
                    }
                  >
                    {tab.label}
                  </Text>
                  {count > 0 && (
                    <View
                      className="rounded-full min-w-[18px] items-center bg-white/20"
                    >
                      <Text className="text-[10px] font-poppins-semibold text-white">{count}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : (
        <View className="border-b border-slate-100 dark:border-slate-800 px-4 py-3">
          <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden flex-row p-1">
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              const count =
                tab.key === "all"
                  ? stores.length
                  : stores.filter((s) =>
                    tab.key === "pending"
                      ? s.status === "pending_review"
                      : s.status === tab.key
                  ).length;

              return (
                <TouchableOpacity
                  key={tab.key}
                  className={[
                    "flex-1 py-2 items-center flex-row justify-center gap-1.5 rounded-xl",
                    active ? "bg-primary" : "bg-white dark:bg-slate-900",
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
                        : "text-xs font-poppins-medium text-slate-400 dark:text-slate-500"
                    }
                  >
                    {tab.label}
                  </Text>
                  {count > 0 && (
                    <View
                      className={`rounded-full min-w-[18px] items-center px-1.5 ${active ? "bg-white/20" : ""}`}
                    >
                      <Text
                        className={`text-[9px] font-poppins-bold ${active ? "text-white" : "text-neutral-500 dark:text-neutral-400"}`}
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
              <AlertCircle
                size={16}
                color="#DC2626"
              />
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
          {!loading && filtered.length > 0 && !error && Platform.OS === "web" ? (
            <View className="items-center">
              <View
                className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden"
              >
                {filtered.map((store, idx) => {
                  const status = store.status ?? "inactive";
                  const badgeStyle = storeStatusBadgeStyle(status);
                  const badgeLabelKey =
                    status === "active" || status === "pending_review" || status === "inactive"
                      ? status
                      : "inactive";

                  return (
                    <View key={store.id}>
                      <TouchableOpacity
                        activeOpacity={0.95}
                        onPress={() =>
                          router.push(`/(store_manager)/view-store/${store.id}`)
                        }
                        className="flex-row items-center gap-x-3 px-4 py-4"
                      >
                        <View className="w-[52px] h-[52px] rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center overflow-hidden">
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
                              className="font-poppins-bold text-[15px] text-slate-900 dark:text-slate-100 flex-1"
                              numberOfLines={1}
                            >
                              {store.name}
                            </Text>
                          </View>

                          <View className="flex-row items-center gap-1">
                            <MapPin size={12} color="#94A3B8" />
                            <Text
                              className="text-xs font-poppins text-slate-400 dark:text-slate-500 flex-1"
                              numberOfLines={1}
                            >
                              {store.address ?? translate("storeManager.stores.noAddress")}
                            </Text>
                          </View>
                        </View>
                        <View className={`h-5 px-2 rounded-full ${badgeStyle.bg} items-center justify-center`}>
                          <Text className={`text-[10px] leading-4 font-poppins-semibold ${badgeStyle.text}`}>
                            {translate(`storeManager.stores.badge.${badgeLabelKey}`)}
                          </Text>
                        </View>
                        <ChevronRight size={20} color="#94A3B8" />
                      </TouchableOpacity>

                      {idx < filtered.length - 1 ? (
                        <View className="h-px bg-slate-100 dark:bg-slate-800" />
                      ) : null}
                    </View>
                  );
                })}
          
              </View>
            </View>
          ) : !loading && filtered.length > 0 && !error && Platform.OS === "android" ? (
            <View>
              <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                {filtered.map((store, idx) => {
                  const status = store.status ?? "inactive";
                  const badgeStyle = storeStatusBadgeStyle(status);
                  const badgeLabelKey =
                    status === "active" || status === "pending_review" || status === "inactive"
                      ? status
                      : "inactive";

                  return (
                    <View key={store.id}>
                      <TouchableOpacity
                        activeOpacity={0.95}
                        onPress={() =>
                          router.push(`/(store_manager)/view-store/${store.id}`)
                        }
                        className="flex-row items-center gap-x-3 px-4 py-4"
                      >
                        <View className="w-[52px] h-[52px] rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center overflow-hidden">
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
                              className="font-poppins-bold text-[15px] text-slate-900 dark:text-slate-100 flex-1"
                              numberOfLines={1}
                            >
                              {store.name}
                            </Text>
                          </View>

                          <View className="flex-row items-center gap-1">
                            <MapPin size={12} color="#94A3B8" />
                            <Text
                              className="text-xs font-poppins text-slate-400 dark:text-slate-500 flex-1"
                              numberOfLines={1}
                            >
                              {store.address ?? translate("storeManager.stores.noAddress")}
                            </Text>
                          </View>
                        </View>

                        <View className={`h-5 px-2 rounded-full ${badgeStyle.bg} items-center justify-center`}>
                          <Text className={`text-[10px] leading-4 font-poppins-semibold ${badgeStyle.text}`}>
                            {translate(`storeManager.stores.badge.${badgeLabelKey}`)}
                          </Text>
                        </View>

                      </TouchableOpacity>

                      {idx < filtered.length - 1 ? (
                        <View className="h-px bg-slate-100 dark:bg-slate-800" />
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
            <View className="items-center pt-16 gap-3">
              <Store
                size={52}
                color="#CBD5E1"
              />
              <Text className="text-base font-poppins-bold text-slate-600 dark:text-slate-300">
                {activeTab === "all"
                  ? translate("storeManager.stores.empty.allTitle")
                  : activeTab === "active"
                    ? translate("storeManager.stores.empty.activeTitle")
                    : activeTab === "pending"
                      ? translate("storeManager.stores.empty.pendingTitle")
                      : translate("storeManager.stores.empty.inactiveTitle")}
              </Text>
              <Text className="text-sm font-poppins text-slate-400 text-center px-8">
                {activeTab === "all"
                  ? translate("storeManager.stores.empty.hintAll")
                  : translate("storeManager.stores.empty.hintFiltered")}
              </Text>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity
          className="absolute bottom-5 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center"
          onPress={() => {
            router.push("/(store_manager)/store/create-store");
          }}
        >
          <Plus size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
