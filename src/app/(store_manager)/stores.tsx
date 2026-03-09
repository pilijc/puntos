import React, { useState, useCallback } from "react";
import { Switch, RefreshControl } from "react-native";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "@/tw";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { getMyStores, StoreRow } from "@/services/store-service";
import StoreDetailModal from "@/components/stores/StoreDetailModal";
import { useManagerStoresStore } from "@/store/manager-stores-store";

type TabKey = "all" | "active" | "pending" | "inactive";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "inactive", label: "Inactive" },
];

const STATUS_BADGE: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  active: {
    label: "Active",
    bg: "bg-green-100",
    text: "text-green-700",
  },
  pending_review: {
    label: "Pending",
    bg: "bg-amber-100",
    text: "text-amber-700",
  },
  inactive: {
    label: "Inactive",
    bg: "bg-slate-100",
    text: "text-slate-500",
  },
};

function StoreCard({ store }: { store: StoreRow }) {
  const status = store.status ?? "inactive";
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.inactive;

  return (
    <TouchableOpacity
      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden mb-3"
      activeOpacity={0.95}
      onPress={() =>
        router.push({
          pathname: `/(store_manager)/view-store/${store.id}`,
          params: { storeId: store.id },
        })
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
            <MaterialIcons name="storefront" size={26} color="#94A3B8" />
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
            <View className={`px-2 py-0.5 rounded-full ${badge.bg}`}>
              <Text
                className={`text-[9px] font-poppins-bold uppercase tracking-wider ${badge.text}`}
              >
                {badge.label}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-1">
            <MaterialIcons name="location-on" size={12} color="#94A3B8" />
            <Text
              className="text-xs font-poppins text-slate-400 dark:text-slate-500 flex-1"
              numberOfLines={1}
            >
              {store.address ?? "No address provided"}
            </Text>
          </View>
          {store.type ? (
            <View className="flex-row items-center gap-1">
              <MaterialIcons name="category" size={12} color="#94A3B8" />
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

      <View className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex-row items-center justify-between bg-slate-50 dark:bg-slate-800/30">
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-poppins-medium text-slate-500 dark:text-slate-400">
            {store?.type ? store.type.charAt(0).toUpperCase() + store.type.slice(1) : ""}
          </Text>
        </View>
        <TouchableOpacity
          className="bg-primary/10 py-2 px-3 rounded-lg flex-row items-center gap-1"
          activeOpacity={0.8}
          onPress={() =>
            router.push({
              pathname: `/(store_manager)/view-store/${store.id}`,
              params: { storeId: store.id },
            })
          }
        >
          <Text className="text-primary text-xs font-poppins-bold">Manage</Text>
          <MaterialIcons name="chevron-right" size={14} color="#FF6600" />
        </TouchableOpacity>
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
    const [activeTab, setActiveTab] = useState<TabKey>("all");
    const [refreshing, setRefreshing] = useState(false);

    const { stores, loading, error, hasFetchedOnce, fetchStores } = useManagerStoresStore();

    const [selectedStore, setSelectedStore] = useState<StoreRow | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const filtered = React.useMemo(() => {
        if (activeTab === "all") return stores;
        if (activeTab === "pending") return stores.filter(s => s.status === "pending_review");
        return stores.filter(s => s.status === activeTab);
    }, [stores, activeTab]);

    // Initial Fetch (Only hits the network if it's the very first time opening the tab)
    React.useEffect(() => {
        if (!hasFetchedOnce) {
            fetchStores();
        }
    }, [hasFetchedOnce, fetchStores]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchStores(true);
        setRefreshing(false);
    };

    const handleStoreSaved = (updated: StoreRow) => {
        useManagerStoresStore.getState().updateStoreOptimistically(updated);
        setSelectedStore(updated);
    };

  return (
    <SafeAreaView className="flex-1 bg-backgroundMuted dark:bg-slate-950">
			
      <View className="bg-white border-b border-slate-100 dark:bg-slate-900 dark:border-slate-800 px-6 py-4 flex-row items-center justify-start">
        <View className="flex-row items-center gap-2 py-1">
          <MaterialIcons name="storefront" size={22} color="black" className="mt-1" />
          <Text className="text-2xl font-poppins-bold text-slate-900 dark:text-slate-100">
            Merchant Stores
          </Text>
        </View>
      </View>

      <View className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex-row px-6">
        {TABS.map((tab) => {
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
              className="flex-1 py-3 items-center flex-row justify-center gap-1.5"
              style={{
                borderBottomWidth: 2,
                borderBottomColor: active ? "#FF6600" : "transparent",
              }}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text
                className={
                  active
                    ? "text-xs font-poppins-bold text-primary"
                    : "text-xs font-poppins-medium text-slate-400 dark:text-slate-500"
                }
              >
                {tab.label}
              </Text>
              {count > 0 && (
                <View
                  className={`rounded-full px-1.5 min-w-[18px] items-center ${
                    active
                      ? "bg-primary/10"
                      : "bg-neutral-100 dark:bg-neutral-700"
                  }`}
                >
                  <Text
                    className={`text-[9px] font-poppins-bold ${
                      active
                        ? "text-primary"
                        : "text-neutral-500 dark:text-neutral-400"
                    }`}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
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
              <MaterialIcons
                name="error-outline"
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
          {!loading &&
            filtered.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          {!loading && filtered.length === 0 && !error && (
            <View className="items-center pt-16 gap-3">
              <MaterialIcons
                name="storefront"
                size={52}
                color="#CBD5E1"
              />
              <Text className="text-base font-poppins-bold text-slate-600 dark:text-slate-300">
                {activeTab === "all"
                  ? "No stores yet"
                  : `No ${activeTab} stores`}
              </Text>
              <Text className="text-sm font-poppins text-slate-400 text-center px-8">
                {activeTab === "all"
                  ? "Tap the + button to create your first store."
                  : "Try a different tab or add a new store."}
              </Text>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity
          className="absolute bottom-5 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center"
          onPress={() => router.push("/(store_manager)/create-store")}
        >
          <MaterialIcons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
