import React, { useState, useCallback } from "react";
import { ActivityIndicator, RefreshControl, useColorScheme, FlatList, Dimensions } from "react-native";
import { ScrollView, View, Text, TouchableOpacity, SafeAreaView } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { useFocusEffect } from "expo-router";

import { StoreRow } from "@/services/store-service";

//hooks
import { useStores, StoreStatusFilter } from "@/hooks/use-stores";
import { useStoreDashboardMetrics } from "@/hooks/use-store-metrics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ── Store Card Component ──────────────────────────────────────────────────
function StoreCard({ store }: { store: StoreRow }) {
    const { activeUsers, todayTransactions, loading: metricsLoading } = useStoreDashboardMetrics(
        store.id,
        store.latitude,
        store.longitude,
        store.radius ?? 100
    );

    return (
        <View style={{ width: SCREEN_WIDTH }} className="px-5">
            <View className="bg-white rounded-[32px] p-6 shadow-sm dark:bg-darkBackgroundCard min-h-[250px]">

                {/* Store Header Info */}
                <View className="mb-6">
                    <Text className="text-2xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary" numberOfLines={1}>
                        {store.name}
                    </Text>
                    {store.address && (
                        <View className="flex-row items-center mt-1">
                            <MaterialIcons name="location-on" size={16} color="#94A3B8" />
                            <Text className="text-sm font-poppins text-textMuted ml-1 dark:text-darkTextSecondary" numberOfLines={1}>
                                {store.address}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Metrics Row */}
                <View className="flex-row justify-between mb-6">
                    {/* Active Users Section */}
                    <View className="flex-1 bg-blue-50/50 rounded-2xl p-4 mr-2 dark:bg-blue-900/20">
                        <View className="flex-row items-center mb-2">
                            <View className="bg-blue-100 p-1.5 rounded-full mr-2 dark:bg-blue-800">
                                <MaterialIcons name="people" size={16} color="#3B82F6" />
                            </View>
                            <Text className="text-[11px] font-poppins-bold text-blue-600 tracking-wider dark:text-blue-400 uppercase">In-Store</Text>
                        </View>
                        <Text className="text-3xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                            {metricsLoading ? "-" : activeUsers}
                        </Text>
                    </View>

                    {/* Today's Transactions Section */}
                    <View className="flex-1 bg-green-50/50 rounded-2xl p-4 ml-2 dark:bg-green-900/20">
                        <View className="flex-row items-center mb-2">
                            <View className="bg-green-100 p-1.5 rounded-full mr-2 dark:bg-green-800">
                                <MaterialIcons name="receipt" size={16} color="#22C55E" />
                            </View>
                            <Text className="text-[11px] font-poppins-bold text-green-600 tracking-wider dark:text-green-400 uppercase">Today's Scans</Text>
                        </View>
                        <Text className="text-3xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                            {metricsLoading ? "-" : todayTransactions}
                        </Text>
                    </View>
                </View>

                {/* Transaction Activity Graph Section */}
                <View className="mt-2">
                    <Text className="text-[11px] font-poppins-bold text-textMuted tracking-widest mb-3 dark:text-darkTextSecondary uppercase">
                        Activity Overview
                    </Text>
                    <View className="h-16 flex-row items-end justify-between px-1">
                        {/* Simple placeholder bars for a "graph" feel */}
                        {[0.3, 0.5, 0.8, 0.4, 0.9, 0.6, 0.7].map((val, i) => (
                            <View
                                key={i}
                                className="w-[10%] bg-primary/20 rounded-t-sm"
                                style={{ height: `${val * 100}%` }}
                            />
                        ))}
                    </View>
                    <View className="flex-row justify-between mt-1">
                        <Text className="text-[9px] font-poppins text-textMuted dark:text-darkTextSecondary">EARLY</Text>
                        <Text className="text-[9px] font-poppins text-textMuted dark:text-darkTextSecondary">PEAK</Text>
                        <Text className="text-[9px] font-poppins text-textMuted dark:text-darkTextSecondary">LATE</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

// ── Dashboard screen ───────────────────────────────────────────────────────
export default function StoreManagerDashboard() {
    const isDark = useColorScheme() === "dark";
    const insets = useSafeAreaInsets();

    const { stores, filteredStores, loading, refreshing, error, activeFilter, setActiveFilter, refresh } = useStores();

    useFocusEffect(useCallback(() => { refresh(); }, []));

    const [selectedStore, setSelectedStore] = useState<StoreRow | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index || 0);
        }
    }, []);

    //render card
    const renderStoreCard = useCallback(({ item: store }: { item: StoreRow }) => (
        <StoreCard store={store} />
    ), []);

    const firstStore = filteredStores[0] ?? stores[0];

    return (
        <SafeAreaView className="flex-1 bg-backgroundMuted dark:bg-darkBackground">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#FFFFFF" colors={["#FF6600"]} />
                }
            >
                {/* ── NEW HEADER
                ──────────────────────────────────────── */}
                <View
                    className="flex-row justify-between items-center px-6 mb-4"
                    style={{ paddingTop: insets.top + 12 }}
                >
                    <Text className="text-2xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">
                        Dashboard
                    </Text>
                </View>

                {/* ── Store Performance Carousel ──────────────────────── */}
                <View className="mb-8">
                    <FlatList
                        data={filteredStores.length > 0 ? filteredStores : stores}
                        renderItem={renderStoreCard}
                        keyExtractor={(item) => item.id.toString()}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={SCREEN_WIDTH}
                        snapToAlignment="start"
                        decelerationRate="fast"
                        disableIntervalMomentum={true}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                    />

                    {/* ── Dot Indicators ── */}
                    {(filteredStores.length > 0 ? filteredStores : stores).length > 1 && (
                        <View className="flex-row justify-center items-center mt-5 gap-x-2">
                            {(filteredStores.length > 0 ? filteredStores : stores).map((_, index) => (
                                <View
                                    key={index}
                                    className={`h-2 rounded-full transition-all ${currentIndex === index
                                        ? "w-6 bg-primary"
                                        : "w-2 bg-slate-200 dark:bg-slate-700"
                                        }`}
                                />
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
