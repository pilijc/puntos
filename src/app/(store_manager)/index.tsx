import React, { useState, useCallback } from "react";
import { RefreshControl, useColorScheme, FlatList, Dimensions } from "react-native";
import { ScrollView, View, Text, SafeAreaView } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "expo-router";

import { StoreRow } from "@/services/store-service";

//hooks
import { useStores } from "@/hooks/use-stores";
import { useStoreDashboardMetrics } from "@/hooks/use-store-metrics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HORIZONTAL_PADDING = 20; // consistent with p-5
const CARD_WIDTH = SCREEN_WIDTH - (HORIZONTAL_PADDING * 2);

// ── Store Card Component ──────────────────────────────────────────────────
function StoreCard({ store }: { store: StoreRow }) {
    const { activeUsers, todayTransactions, weeklyActivity, loading: metricsLoading } = useStoreDashboardMetrics(
        store.id,
        store.latitude,
        store.longitude,
        store.radius ?? 100
    );

    const maxActivity = Math.max(...weeklyActivity, 1);
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7DaysLabels = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return dayLabels[d.getDay()];
    });

    return (
        <View style={{ width: CARD_WIDTH }}>
            <View className="bg-white rounded-[24px] p-4 dark:bg-darkBackgroundCard min-h-[250px]">

                {/* Store Header Info */}
                <View className="mb-6">
                    <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary" numberOfLines={1}>
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
                    <View className="flex-1 bg-orange-50/50 rounded-xl p-4 mr-2 dark:bg-orange-900/20">
                        <View className="flex-row items-center mb-2">
                            <View className="bg-orange-100 p-1.5 rounded-full mr-1 dark:bg-orange-800">
                                <MaterialIcons name="people" size={16} color="#FF6600" />
                            </View>
                            <Text className="text-[11px] font-poppins-bold text-orange-600 tracking-wider dark:text-darkPrimarySecondary uppercase">In-Store</Text>
                        </View>
                        <Text className="text-3xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                            {metricsLoading ? "-" : activeUsers}
                        </Text>
                    </View>

                    {/* Today's Transactions Section */}
                    <View className="flex-1 bg-orange-50/50 rounded-xl p-4 ml-2 dark:bg-orange-900/20">
                        <View className="flex-row items-center mb-2">
                            <View className="bg-orange-100 p-1.5 rounded-full mr-1 dark:bg-orange-800">
                                <MaterialIcons name="receipt" size={16} color="#FF6600" />
                            </View>
                            <Text className="text-[11px] font-poppins-bold text-orange-600 tracking-wider dark:text-darkPrimarySecondary uppercase">Today's Scans</Text>
                        </View>
                        <Text className="text-3xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                            {metricsLoading ? "-" : todayTransactions}
                        </Text>
                    </View>
                </View>

                {/* Transaction Activity Graph Section */}
                <View className="mt-2">
                    <Text className="text-[11px] font-poppins-bold text-textMuted tracking-widest mb-3 dark:text-darkTextSecondary uppercase">
                        Weekly Scan Activity
                    </Text>
                    <View className="flex-row justify-between px-1">
                        {weeklyActivity.map((count, i) => (
                            <View key={i} className="items-center" style={{ width: (CARD_WIDTH - 40) / 7 }}>
                                <View className="h-16 w-full items-center justify-end">
                                    <View
                                        className={`w-6 rounded-t-sm ${i === 6 ? "bg-primary" : "bg-primary/20"}`}
                                        style={{ height: `${Math.max((count / maxActivity) * 100, 5)}%` }}
                                    />
                                </View>
                                <Text className={`text-[9px] font-poppins-bold mt-2 ${i === 6 ? "text-primary" : "text-textMuted dark:text-darkTextSecondary"}`}>
                                    {last7DaysLabels[i].toUpperCase()}
                                </Text>
                            </View>
                        ))}
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

    const { stores, filteredStores, refreshing, refresh } = useStores();

    useFocusEffect(useCallback(() => { refresh(); }, []));

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

    return (
        <SafeAreaView className="flex-1 bg-backgroundMuted dark:bg-darkBackground p-5">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#FFFFFF" colors={["#FF6600"]}
                    />
                }
            >
                {/* ── NEW HEADER
                ──────────────────────────────────────── */}
                <View className="justify-between mb-6">
                    <Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
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
                        snapToInterval={CARD_WIDTH + 8} // CARD_WIDTH + gap
                        snapToAlignment="start"
                        decelerationRate="fast"
                        disableIntervalMomentum={true}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                        ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
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
