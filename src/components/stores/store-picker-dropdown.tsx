import React, { useState, useMemo, useEffect } from "react";
import { Modal, useColorScheme, FlatList, TextInput, useWindowDimensions } from "react-native";
import { View, Pressable, Text } from "@/tw";
import { Check, ChevronDown, Search, Store, X } from "lucide-react-native";
import { StorePickerDropdownProps } from "@/type/store-manager/metric";
import { useTranslation } from "react-i18next";

export function StorePickerDropdown({
    stores,
    selectedStore,
    isVisible,
    onOpen,
    onClose,
    onSelect,
}: StorePickerDropdownProps) {
    const isDark = useColorScheme() === "dark";
    const { t: translate } = useTranslation();
    const { width: windowWidth } = useWindowDimensions();
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (!isVisible) {
            setSearchQuery("");
        }
    }, [isVisible]);

    const filteredStores = useMemo(() => {
        if (!searchQuery.trim()) return stores;
        const query = searchQuery.toLowerCase();
        return stores.filter(s => s.name.toLowerCase().includes(query));
    }, [stores, searchQuery]);

    const showSearch = stores.length > 5;
    const triggerWidth = windowWidth < 360
        ? Math.max(120, windowWidth - 188)
        : windowWidth < 420
            ? 160
            : 220;
    const dropdownWidth = Math.min(280, Math.max(240, windowWidth - 40));

    return (
        <>
            {/* button for dropdown */}
            {selectedStore && (
                <Pressable
                    onPress={onOpen}
                    className="h-10 flex-row items-center justify-between rounded-full border border-slate-200 dark:border-darkBorder bg-white dark:bg-darkBackgroundCard px-3"
                    style={{ width: triggerWidth }}
                >
                    <View className="flex-row items-center flex-1 min-w-0">
                        <Store size={15} color={isDark ? "#A3A3A3" : "#64748B"} className="mr-2" />
                        <Text
                            className="flex-1 text-[13px] font-poppins-semibold text-textPrimary dark:text-darkTextPrimary"
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {selectedStore.name}
                        </Text>
                    </View>
                    <ChevronDown size={16} color="#FF6600" />
                </Pressable>
            )}

            {/* contents of drowpdown */}
            <Modal visible={isVisible} transparent={true} animationType="fade">
                <Pressable
                    className="flex-1 bg-black/30 justify-start items-end pt-[85px] pr-[20px]"
                    onPress={onClose}
                >
                    <View
                        className="bg-white dark:bg-darkBackgroundCard rounded-xl shadow-2xl elevation-10 border border-slate-100 dark:border-darkBorder max-h-[400px] py-2"
                        style={{ width: dropdownWidth }}
                    >
                        {showSearch && (
                            <View className="px-3 pb-3 pt-1 border-b border-slate-50 dark:border-darkBorder/30">
                                <View className="flex-row items-center bg-slate-50 dark:bg-[#262626] rounded-xl px-3 py-2 border border-slate-100 dark:border-darkBorder/50">
                                    <Search size={16} color={isDark ? "#A3A3A3" : "#94A3B8"} className="mr-2" />
                                    <TextInput
                                        className="flex-1 text-[13px] font-poppins text-textPrimary dark:text-darkTextPrimary py-0.5 min-w-[140px]"
                                        placeholder={translate("storeManager.storesList.searchPlaceholder", "Search your stores...")}
                                        placeholderTextColor={isDark ? "#A3A3A3" : "#94A3B8"}
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        style={{ outlineStyle: "none" } as any}
                                    />
                                    {searchQuery.length > 0 && (
                                        <Pressable onPress={() => setSearchQuery("")} className="p-1 -mr-1">
                                            <X size={14} color={isDark ? "#A3A3A3" : "#94A3B8"} />
                                        </Pressable>
                                    )}
                                </View>
                            </View>
                        )}
                        <FlatList
                            data={filteredStores}
                            keyExtractor={(s) => s.id.toString()}
                            showsVerticalScrollIndicator={true}
                            contentContainerStyle={{ flexGrow: 1 }}
                            ListEmptyComponent={
                                <View className="py-8 px-4 items-center justify-center">
                                    <Store size={24} color={isDark ? "#404040" : "#E2E8F0"} className="mb-2" />
                                    <Text className="text-sm font-poppins text-textSecondary dark:text-darkTextSecondary text-center">
                                        {translate("storeManager.storesList.noMatching", "No matching stores")}
                                    </Text>
                                </View>
                            }
                            renderItem={({ item: s, index }) => {
                                const isActive = s.id === selectedStore?.id;
                                const isLast = index === filteredStores.length - 1;
                                return (
                                    <View>
                                        <View className="px-1.5 py-0.5">
                                            <Pressable
                                                style={({ pressed }) => [
                                                    { backgroundColor: pressed ? (isDark ? '#262626' : '#f8fafc') : 'transparent' },
                                                    isActive ? { backgroundColor: isDark ? '#262626' : '#fff7ed' } : {}
                                                ]}
                                                className="px-3 py-3 flex-row items-center justify-between rounded-xl"
                                                onPress={() => {
                                                    onSelect(s.id);
                                                    onClose();
                                                }}
                                            >
                                                <View className="flex-row items-center flex-1 mr-2">
                                                    <Store size={16} color={isActive ? "#FF6600" : (isDark ? "#A3A3A3" : "#94A3B8")} className="mr-3" />
                                                    <Text
                                                        className={`text-sm font-poppins flex-1 ${isActive ? "text-[#FF6600] font-poppins-semibold" : "text-slate-600 dark:text-darkTextSecondary"}`}
                                                        numberOfLines={1}
                                                    >
                                                        {s.name}
                                                    </Text>
                                                </View>
                                                {isActive && (
                                                    <Check size={18} color="#FF6600" strokeWidth={2.5} />
                                                )}
                                            </Pressable>
                                        </View>
                                        {!isLast && (
                                            <View className="mx-6 border-b border-slate-50 dark:border-darkBorder/30" />
                                        )}
                                    </View>
                                );
                            }}
                        />
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}
