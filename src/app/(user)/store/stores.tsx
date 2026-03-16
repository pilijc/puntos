import { TextInput, ActivityIndicator, RefreshControl } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import React, { useMemo, useCallback } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTranslation } from "react-i18next";
import { useStoreStore } from "@/store/user/store-store";
import { useRewardsUiStore } from "@/store/user/rewards-ui-store";
import { useStamps } from "@/hooks/use-stamps";
import { useLocation } from "@/hooks/use-location";
import StoreHeader from "@/components/ui/store-header";
import UserStoreListItem from "@/components/stores/user-store-list-item";
import StoreScreenContainer from "@/components/ui/store-screen-container";
import { buildStampedStoreList } from "@/utils/store-helpers";

export default function StoreListScreen() {
  const { t: translate } = useTranslation();
  const {
    storeSearchQuery: searchQuery,
    setStoreSearchQuery: setSearchQuery,
    refreshing,
    setRefreshing,
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
    return buildStampedStoreList(
      realStores,
      stamps,
      location,
      translate("rewards.unknownLocation"),
    );
  }, [location, realStores, stamps, translate]);

  const filteredStores = useMemo(() => {
    if (!searchQuery) return allStores;
    return allStores.filter((store) =>
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.location.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [allStores, searchQuery]);

  const { nearbyStoresSection, joinedStoresSection } = useMemo(() => {
    return {
      nearbyStoresSection: filteredStores.filter((store) => store.isNearby),
      joinedStoresSection: filteredStores.filter((store) => !store.isNearby),
    };
  }, [filteredStores]);

  const isLoading = stampsLoading && !refreshing;

  return (
    <StoreScreenContainer
      backgroundClassName="bg-backgroundMuted dark:bg-darkBackground"
      contentGap={24}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#FF6600"
          colors={["#FF6600"]}
        />
      }
    >
      <StoreHeader title={translate("rewards.storesList.title")} />

      <View className="flex-row items-center bg-white dark:bg-darkBackgroundCard rounded-2xl px-4 py-1 border border-neutral-100 dark:border-darkBorder shadow-sm shadow-neutral-100 dark:shadow-none mt-2">
        <MaterialIcons name="search" size={20} color="#9CA3AF" />
        <TextInput
          placeholder={translate("rewards.storesList.searchPlaceholder")}
          placeholderTextColor="#9CA3AF"
          className="flex-1 ml-3 font-poppins text-sm text-neutral-900 dark:text-white pt-0 pb-0"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{ textAlignVertical: "center" }}
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
          <Text className="mt-4 font-poppins text-neutral-400">
            {translate("rewards.storesList.loading")}
          </Text>
        </View>
      ) : (
        <View className="mt-6 gap-y-8">
          {filteredStores.length === 0 ? (
            <View className="items-center justify-center py-20">
              <View className="w-24 h-24 rounded-full bg-neutral-100 dark:bg-white/5 items-center justify-center mb-6">
                <MaterialIcons name="storefront" size={48} color="#CBD5E1" />
              </View>
              <Text className="text-xl font-poppins-bold text-neutral-900 dark:text-white text-center">
                {searchQuery
                  ? translate("rewards.storesList.noMatching")
                  : translate("rewards.storesList.noJoined")}
              </Text>
              <Text className="text-sm text-neutral-500 font-poppins text-center px-10 mt-2">
                {searchQuery
                  ? translate("rewards.storesList.noMatchingDetail", { query: searchQuery })
                  : translate("rewards.storesList.noJoinedDetail")}
              </Text>
            </View>
          ) : (
            <>
              {nearbyStoresSection.length > 0 && (
                <View className="gap-y-4">
                  <Text className="text-xs font-poppins-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest ml-1">
                    {translate("rewards.storesList.nearbySection")}
                  </Text>
                  {nearbyStoresSection.map((store, index) => (
                    <UserStoreListItem key={store.id} store={store} index={index} />
                  ))}
                </View>
              )}

              {joinedStoresSection.length > 0 && (
                <View className="gap-y-4">
                  <Text className="text-xs font-poppins-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest ml-1">
                    {translate("rewards.storesList.myStoresSection")}
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
    </StoreScreenContainer>
  );
}
