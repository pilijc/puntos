import { ScrollView, SafeAreaView, TextInput, ActivityIndicator, RefreshControl } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import React, { useMemo, useCallback } from "react";
import { useStoreStore } from "@/store/store-store";
import { useRewardsUiStore } from "@/store/rewards-ui-store";
import { useStamps } from "@/hooks/use-stamps";
import { useLocation } from "@/hooks/use-location";
import { enrichStoresWithLocation } from "@/utils/store-location";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StoreHeader from "@/components/ui/StoreHeader";
import UserStoreListItem from "@/components/stores/UserStoreListItem";

export default function StoreListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    storeSearchQuery: searchQuery,
    setStoreSearchQuery: setSearchQuery,
    refreshing,
    setRefreshing
  } = useRewardsUiStore();

  const { stores: realStores } = useStoreStore();
  const { stamps, isLoading: stampsLoading, refetch: refetchStamps } = useStamps();
  const { location } = useLocation();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchStamps();
    setRefreshing(false);
  }, [refetchStamps, setRefreshing]);

  const allStores = useMemo(() => {
    const stampedIds = new Set(stamps.map((s) => s.store_id.toString()));
    const myStores = realStores.filter((s) => stampedIds.has(s.id.toString()));
    const enrichedStores = enrichStoresWithLocation(myStores, location);

    return enrichedStores.map((s) => {
      const stampData = stamps.find(st => st.store_id.toString() === s.id.toString());
      return {
        id: s.id.toString(),
        name: s.name,
        location: s.address || "Unknown location",
        distanceMeters: s.distanceMeters,
        stampsCount: stampData?.stamps_count || 0,
        targetStamps: stampData?.target || 7,
        isNearby: s.isNearby,
        logo: s.logo,
      };
    });
  }, [realStores, stamps, location]);

  const filteredStores = useMemo(() => {
    if (!searchQuery) return allStores;
    return allStores.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allStores, searchQuery]);

  const { nearbyStoresSection, joinedStoresSection } = useMemo(() => {
    return {
      nearbyStoresSection: filteredStores.filter(s => s.isNearby),
      joinedStoresSection: filteredStores.filter(s => !s.isNearby)
    };
  }, [filteredStores]);

  const isLoading = stampsLoading && !refreshing;

  return (
    <SafeAreaView className="flex-1 bg-backgroundMuted dark:bg-darkBackground">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: Math.max(insets.top, 24),
          paddingBottom: Math.max(insets.bottom, 40)
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
        <StoreHeader title="Stores" />

        <View className="flex-row items-center bg-white dark:bg-darkBackgroundCard rounded-2xl px-4 py-1 border border-neutral-100 dark:border-darkBorder shadow-sm shadow-neutral-100 dark:shadow-none mt-2">
          <MaterialIcons name="search" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search your stores..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-3 font-poppins text-sm text-neutral-900 dark:text-white pt-0 pb-0"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ textAlignVertical: 'center' }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialIcons name="close" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#FF6600" />
            <Text className="mt-4 font-poppins text-neutral-400">Loading your stores...</Text>
          </View>
        ) : (
          <View className="mt-6 gap-y-8">
            {filteredStores.length === 0 ? (
              <View className="items-center justify-center py-20">
                <View className="w-24 h-24 rounded-full bg-neutral-100 dark:bg-white/5 items-center justify-center mb-6">
                  <MaterialIcons name="storefront" size={48} color="#CBD5E1" />
                </View>
                <Text className="text-xl font-poppins-bold text-neutral-900 dark:text-white text-center">
                  {searchQuery ? "No matching stores" : "No stores joined yet"}
                </Text>
                <Text className="text-sm text-neutral-500 font-poppins text-center px-10 mt-2">
                  {searchQuery
                    ? `We couldn't find any store matching "${searchQuery}"`
                    : "Visit a store and get a stamp to see them here and start earning rewards!"}
                </Text>
              </View>
            ) : (
              <>
                {nearbyStoresSection.length > 0 && (
                  <View className="gap-y-4">
                    <Text className="text-xs font-poppins-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest ml-1">
                      Nearby Stores
                    </Text>
                    {nearbyStoresSection.map((store, index) => (
                      <UserStoreListItem key={store.id} store={store} index={index} />
                    ))}
                  </View>
                )}

                {joinedStoresSection.length > 0 && (
                  <View className="gap-y-4">
                    <Text className="text-xs font-poppins-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest ml-1">
                      My Stores
                    </Text>
                    {joinedStoresSection.map((store, index) => (
                      <UserStoreListItem
                        key={store.id}
                        store={store}
                        index={index}
                        sectionDelay={nearbyStoresSection.length * 100}
                      />
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
