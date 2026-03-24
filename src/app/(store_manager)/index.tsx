import React, { useState, useCallback } from "react";
import { RefreshControl, Modal } from "react-native";
import { ScrollView, View, Text, SafeAreaView, TouchableOpacity, Pressable } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "expo-router";
import { useStores } from "@/hooks/use-stores";
import { DashboardStoreView } from "@/components/stores/dashboard-store-view";

export default function StoreManagerDashboard() {
    const { stores, filteredStores, refreshing, refresh } = useStores();

    // Dropdown state
    const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
    const [isDropdownVisible, setDropdownVisible] = useState(false);

    useFocusEffect(useCallback(() => { refresh(); }, []));

    const displayedStores = filteredStores.length > 0 ? filteredStores : stores;

    // Auto-select first store if none selected
    React.useEffect(() => {
        if (!selectedStoreId && displayedStores.length > 0) {
            setSelectedStoreId(displayedStores[0].id);
        }
    }, [displayedStores, selectedStoreId]);

    const selectedStore = displayedStores.find((s) => s.id === selectedStoreId) || displayedStores[0];

    return (
        <SafeAreaView className="flex-1 bg-backgroundMuted dark:bg-darkBackground p-5">
            {/* ── Dropdown Modal ── */}
            <Modal visible={isDropdownVisible} transparent={true} animationType="fade">
                <Pressable className="flex-1 bg-black/30 justify-start items-end pt-[80px] pr-[20px]" onPress={() => setDropdownVisible(false)}>
                    <View className="bg-white rounded-[16px] p-[8px] min-w-[200px] max-w-[250px] elevation-10">
                        {displayedStores.map((s) => {
                            const isActive = s.id === selectedStore?.id;
                            return (
                                <TouchableOpacity
                                    key={s.id}
                                    className={`flex-row items-center justify-between py-[12px] px-[16px] rounded-[10px] ${isActive ? 'bg-[#FFF7ED]' : ''}`}
                                    onPress={() => {
                                        setSelectedStoreId(s.id);
                                        setDropdownVisible(false);
                                    }}
                                >
                                    <View className="flex-1">
                                        <Text
                                            className={`text-[15px] font-poppins ${isActive ? 'text-[#EA580C] font-poppins-medium' : 'text-[#334155]'}`}
                                            numberOfLines={1}
                                        >
                                            {s.name}
                                        </Text>
                                    </View>
                                    {isActive && (
                                        <MaterialIcons name="check" size={18} color="#FF6600" />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Pressable>
            </Modal>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refresh}
                        tintColor="#FFFFFF"
                        colors={["#FF6600"]}
                    />
                }
            >
                {/* ── Header Row ── */}
                <View className="mb-[24px]">
                    <View className="flex-row justify-between items-center mb-[4px]">
                        <Text className="text-[22px] font-poppins-bold text-[#1E293B]">Dashboard</Text>

                        {selectedStore && (
                            <TouchableOpacity
                                className="bg-white px-[14px] py-[10px] rounded-full flex-row items-center gap-[8px] elevation-4"
                                onPress={() => setDropdownVisible(true)}
                            >
                                <Text className="text-[14px] font-poppins-medium text-[#1E293B] max-w-[120px]" numberOfLines={1}>
                                    {selectedStore.name}
                                </Text>
                                <MaterialIcons name="keyboard-arrow-down" size={18} color="#1E293B" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {selectedStore?.address && (
                        <View className="flex-row items-center">
                            <MaterialIcons name="location-on" size={14} color="#94A3B8" />
                            <Text className="text-[12px] font-poppins text-[#94A3B8] ml-[4px]">
                                {selectedStore.address}
                            </Text>
                        </View>
                    )}
                </View>

                {/* ── Store View ─────────────────────── */}
                <View className="mb-8">
                    {selectedStore ? (
                        <DashboardStoreView store={selectedStore} />
                    ) : (
                        <View className="py-10 items-center">
                            <Text className="font-poppins text-textPrimary">No stores available.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};
