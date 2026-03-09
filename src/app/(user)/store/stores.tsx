import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useMemo } from "react";
import { router } from "expo-router";
import SortPill from "@/components/rewards/SortPill";
import StoreCard from "@/components/rewards/StoreCard";
import { StoreItem } from "@/data/rewards";
import { useRewardsUiStore } from "@/store/rewards-ui-store";
import { useStoreStore } from "@/store/store-store";
import { useStamps } from "@/hooks/use-stamps";
import { useLocation } from "@/hooks/use-location";
import { enrichStoresWithLocation } from "@/utils/store-location";

const storeSortOptions = [
  { id: "nearby", label: "Nearby" },
  { id: "points", label: "Points" },
  { id: "az", label: "A-Z" },
] as const;

export default function Stores() {
  const { storeSort, storePointsOrder, setStoreSort, setStorePointsOrder } =
    useRewardsUiStore();

  const { stores: realStores } = useStoreStore();
  const { stamps } = useStamps();
  const { location } = useLocation();

  const allStores: StoreItem[] = useMemo(() => {
    const stampedIds = new Set(stamps.map((s) => s.store_id.toString()));
    const myStores = realStores.filter((s) => stampedIds.has(s.id.toString()));
    const enrichedStores = enrichStoresWithLocation(myStores, location);

    return enrichedStores.map((s) => {
      const stampProgress = stamps.find(
        (p) => p.store_id.toString() === s.id.toString()
      );
      return {
        id: s.id.toString(),
        name: s.name,
        location: s.address || "Unknown location",
        distanceMeters: s.distanceMeters,
        points: 0, // Points are a separate feature
        isNearby: s.isNearby,
        logo: s.logo,
      };
    });
  }, [realStores, stamps, location]);

  const sortedStores = useMemo(() => {
    const list = [...allStores];
    if (storeSort === "points") {
      list.sort((a, b) =>
        storePointsOrder === "desc" ? b.points - a.points : a.points - b.points
      );
    } else if (storeSort === "az") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list.sort((a, b) => a.distanceMeters - b.distanceMeters);
    }
    return list;
  }, [allStores, storeSort, storePointsOrder]);

  const totalPoints = allStores.reduce((sum, store) => sum + store.points, 0);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-darkBackground">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-6 pb-8 gap-y-4"
      >
        <View className="flex-row items-center gap-x-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white dark:bg-darkBackgroundMuted border border-neutral-200 dark:border-darkBorder items-center justify-center"
          >
            <MaterialIcons name="chevron-left" size={22} color="#0f172a" />
          </TouchableOpacity>
          <Text className="text-2xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">
            My Stores
          </Text>
        </View>

        <Text className="text-xs text-neutral-500 font-poppins">
          {allStores.length} stores • {totalPoints.toLocaleString()} pts total
        </Text>

        <View className="flex-row gap-x-2">
          {storeSortOptions.map((option) => {
            const isPoints = option.id === "points";
            const isActive = storeSort === option.id;
            const arrowColor = isActive ? "#FF6600" : "#94a3b8";
            const arrowName =
              storePointsOrder === "asc" ? "arrow-upward" : "arrow-downward";
            return (
              <SortPill
                key={option.id}
                label={option.label}
                active={isActive}
                rightIcon={
                  isPoints ? (
                    <MaterialIcons name={arrowName} size={12} color={arrowColor} />
                  ) : null
                }
                onPress={() => {
                  if (isPoints) {
                    if (storeSort === "points") {
                      setStorePointsOrder(
                        storePointsOrder === "desc" ? "asc" : "desc"
                      );
                    } else {
                      setStoreSort("points");
                    }
                  } else {
                    setStoreSort(option.id);
                  }
                }}
              />
            );
          })}
        </View>

        <View className="gap-y-3">
          {sortedStores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              onPress={() => router.push(`/store/${store.id}`)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
