import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, useColorScheme, NativeSyntheticEvent, NativeScrollEvent, useWindowDimensions } from "react-native";
import { View, Text, TouchableOpacity, ScrollView, Image } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getStoreById } from "@/services/store-service";
import { Modal, ModalButton } from "@/components/modal";
import Ionicons from '@expo/vector-icons/Ionicons';

export default function ViewStore() {
  const { id } = useLocalSearchParams();
  const storeId = Number(id);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [store, setStore] = useState<Awaited<ReturnType<typeof getStoreById>> | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [modal, setModal] = useState<{
    title: string;
    message: string;
    buttons: ModalButton[];
    timer?: boolean;
  } | null>(null);

  const menuItems = useMemo(
    () => [
      { key: "staff",   label: "Staff",        description: "Manage team",        icon: { lib: "mc",  name: "account-group" },       route: "/(store_manager)/staff"  as const },
      { key: "streak",  label: "Streak",        description: "Daily rewards",      icon: { lib: "mc",  name: "fire" },                route: "/(store_manager)/streak/view-streak" as const },
      { key: "stamp",   label: "Stamp",         description: "Punch cards",        icon: { lib: "mc",  name: "stamper" },               route: "/(store_manager)/stamp/view-stamp"  as const },
      { key: "qr",      label: "QR Purchase",   description: "Scan rewards",       icon: { lib: "mi",  name: "qr-code-scanner" },     route: "/(store_manager)/qr"             as const },
      { key: "rewards", label: "Rewards",        description: "Redeemable items",   icon: { lib: "mc",  name: "gift-open" },           route: "/(store_manager)/reward"             as const },
      { key: "media",   label: "Details",          description: "Manage Store",       icon: { lib: "ion",  name: "storefront-sharp" },          route: "/(store_manager)/detail"       as const },
    ],
    []
  );

  const carouselImages = useMemo(() => {
    const pictures = (store?.store_pictures ?? []).filter((u): u is string => !!u);
    if (pictures.length > 0) return pictures;
    if (store?.logo) return [store.logo];
    return [require("@/assets/images/puntos-icon.png")];
  }, [store?.store_pictures, store?.logo]);

  const onCarouselScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const cardWidth = e.nativeEvent.layoutMeasurement.width;
    if (!cardWidth) return;
    const nextIndex = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
    setActiveImageIndex(nextIndex);
  }, []);

  const fetchStore = useCallback(async () => {
    const storeData = await getStoreById(storeId);
    setStore(storeData);
  }, [storeId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchStore();
    } finally {
      setRefreshing(false);
    }
  }, [fetchStore]);

  useEffect(() => {
    setStore(null);
    setActiveImageIndex(0);
    void fetchStore();
  }, [fetchStore]);

  return (
    <View className="flex-1 bg-backgroundMuted dark:bg-neutral-900">
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
        timer={modal?.timer ? 3000 : undefined}
      />
      <View
        className="border-b border-neutral-100 dark:border-neutral-700 bg-background dark:bg-neutral-800"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
      >
        <View className="flex-row items-center px-2">
          <TouchableOpacity
            onPress={() => router.push("/(store_manager)/stores")}
            className="w-10 h-10 rounded-full items-center justify-center"
            activeOpacity={0.7}
          >
            <MaterialIcons name="chevron-left" size={22} color={isDark ? "#F1F5F9" : "#0F172A"} />
          </TouchableOpacity>
          <View className="flex-1 items-center justify-center -ml-10">
            <Text className="text-md font-poppins-bold text-textPrimary dark:text-textPrimary">
              {store?.name || "Store Details"}
            </Text>
            <Text className="text-xs font-poppins text-textMuted dark:text-textMuted -mt-2">
              {store?.address || "View & manage store info"}
            </Text>
          </View>

        </View>
      </View>

      <ScrollView
        className="flex-1 gap-y-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#FF6600"]}
            tintColor="#FF6600"
          />
        }
      >
        <View className="items-center gap-y-2">
          <View className="w-full px-4">
            <View style={{ width: (screenWidth - 32), height: 144, borderRadius: 12, overflow: "hidden" }}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onCarouselScroll}
                scrollEventThrottle={16}
                style={{ width: (screenWidth - 32), height: 144 }}
              >
                {carouselImages.map((img, idx) => (
                  <Image
                    key={`${typeof img === "string" ? img : "default"}-${idx}`}
                    source={typeof img === "string" ? { uri: img } : img}
                    style={{ width: (screenWidth - 32), height: 144 }}
                    contentFit="cover"
                  />
                ))}
              </ScrollView>
              {carouselImages.length > 1 && (
                <View
                  className="flex-row items-center justify-center gap-x-1.5 absolute bottom-4 left-0 right-0"
                >
                  {carouselImages.map((_, i) => (
                    <View
                      key={`dot-${i}`}
                      className={`rounded-full ${activeImageIndex === i ? "bg-white w-5 h-1.5" : "bg-white/50 w-1.5 h-1.5"}`}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        <View className="px-4 py-3">
          <View className="flex-row flex-wrap gap-y-2 justify-between">
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: item.route, params: { storeId } })}
                style={{ width: "32.5%" }}
                className="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl p-3"
              >
                <View className="w-9 h-9 rounded-lg items-center justify-center mb-1 -ml-1">
                  {item.icon.lib === "mc" ? (
                    <MaterialCommunityIcons name={item.icon.name as any} size={18} color="#FF6600" />
                  ) : item.icon.lib === "ion" ? (
                    <Ionicons name={item.icon.name as any} size={18} color="#FF6600" />
                  ) : (
                    <MaterialIcons name={item.icon.name as any} size={18} color="#FF6600" />
                  )}
                </View>
                <Text className="text-[11px] font-poppins-semibold text-slate-800 dark:text-slate-100 leading-4">
                  {item.label}
                </Text>
                <Text className="text-[9px] font-poppins text-slate-400 dark:text-slate-500 mt-0.5">
                  {item.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="px-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-poppins-bold text-textSecondary dark:text-textSecondary ml-1">
              Recent Transactions
            </Text>
            <TouchableOpacity activeOpacity={0.7} className="flex-row items-center gap-x-0.5">
              <Text className="text-xs font-poppins text-primary">See all</Text>
              <MaterialIcons name="chevron-right" size={14} color="#FF6600" />
            </TouchableOpacity>
          </View>

          <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 px-4 py-10 items-center gap-y-2">
            <MaterialIcons name="receipt-long" size={32} color="#CBD5E1" />
            <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
              No transactions yet
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
