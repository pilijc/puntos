import { ScrollView, SafeAreaView, TextInput, ActivityIndicator, RefreshControl } from "react-native";
import { View, Text, TouchableOpacity, Image, AnimatedView } from "@/tw";
import React, { useMemo, useState, useCallback } from "react";
import { useStoreStore } from "@/store/store-store";
import { useStamps } from "@/hooks/use-stamps";
import { useLocation } from "@/hooks/use-location";
import { enrichStoresWithLocation } from "@/utils/store-location";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { FadeInDown, Layout } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function StoreListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { stores: realStores } = useStoreStore();
  const { stamps, isLoading: stampsLoading, refetch: refetchStamps } = useStamps();
  const { location } = useLocation();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchStamps();
    setRefreshing(false);
  }, [refetchStamps]);

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

  const totalStamps = allStores.reduce((sum, store) => sum + store.stampsCount, 0);
  const isLoading = stampsLoading && !refreshing;

  const renderStoreItem = (store: any, index: number, sectionDelay: number = 0) => (
    <AnimatedView
      key={store.id}
      entering={FadeInDown.delay(sectionDelay + index * 100).duration(400)}
      layout={Layout.springify()}
    >
      <TouchableOpacity
        onPress={() => router.push(`/store/${store.id}`)}
        activeOpacity={0.7}
        className="bg-white dark:bg-darkBackgroundCard rounded-3xl p-4 flex-row items-center border border-neutral-100 dark:border-darkBorder shadow-sm shadow-neutral-100 dark:shadow-none"
      >
        <View className="w-16 h-16 rounded-2xl bg-neutral-50 dark:bg-white/5 items-center justify-center overflow-hidden border border-neutral-100 dark:border-darkBorder">
          {store.logo ? (
            <Image
              source={{ uri: store.logo }}
              className="w-full h-full"
              contentFit="cover"
            />
          ) : (
            <MaterialIcons name="storefront" size={32} color="#FF6600" />
          )}
        </View>

        <View className="flex-1 ml-4 justify-center">
          <View className="flex-row items-center justify-between mb-0.5">
            <Text className="text-lg font-poppins-bold text-neutral-900 dark:text-white flex-1" numberOfLines={1}>
              {store.name}
            </Text>
            {store.isNearby && (
              <View className="bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-lg">
                <Text className="text-[9px] font-poppins-bold text-green-700 dark:text-green-400">NEARBY</Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center mb-2">
            <MaterialIcons name="place" size={14} color="#9CA3AF" />
            <Text className="text-xs text-neutral-400 font-poppins ml-1 flex-1" numberOfLines={1}>
              {store.location}
            </Text>
          </View>

          <View>
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-[10px] font-poppins-semibold text-neutral-500 dark:text-neutral-400">
                STAMP PROGRESS
              </Text>
              <Text className="text-[10px] font-poppins-bold text-primary">
                {store.stampsCount}/{store.targetStamps}
              </Text>
            </View>
            <View className="h-1.5 w-full bg-neutral-100 dark:bg-white/10 rounded-full overflow-hidden">
              <View
                className="h-full bg-primary rounded-full"
                style={{ width: `${Math.min((store.stampsCount / store.targetStamps) * 100, 100)}%` }}
              />
            </View>
          </View>
        </View>

        <View className="ml-3">
          <View className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-white/5 items-center justify-center">
            <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
          </View>
        </View>
      </TouchableOpacity>
    </AnimatedView>
  );

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
        {/* Header - Aligned to match main Rewards title */}
        {/* EDIT mt-4.5 BELOW TO MANUALLY ADJUST VERTICAL POSITION */}
        <View className="flex-row items-center mb-2 mt-4.5">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="-ml-3 mr-1"
          >
            <MaterialIcons name="chevron-left" size={36} color="#FF6600" />
          </TouchableOpacity>
          <Text className="text-2xl font-poppins-bold text-neutral-900 dark:text-white">
            Stores
          </Text>
        </View>

        {/* Search Bar */}
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
                    {nearbyStoresSection.map((store, index) => renderStoreItem(store, index))}
                  </View>
                )}

                {joinedStoresSection.length > 0 && (
                  <View className="gap-y-4">
                    <Text className="text-xs font-poppins-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest ml-1">
                      My Stores
                    </Text>
                    {joinedStoresSection.map((store, index) =>
                      renderStoreItem(store, index, nearbyStoresSection.length * 100)
                    )}
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
