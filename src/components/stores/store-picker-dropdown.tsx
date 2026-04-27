import React from "react";
import { Modal, useColorScheme } from "react-native";
import { View, Text, TouchableOpacity, Pressable } from "@/tw";
import { ChevronDown, Check } from "lucide-react-native";
import { StorePickerDropdownProps } from "@/type/store-manager/metric";

export function StorePickerDropdown({
    stores,
    selectedStore,
    isVisible,
    onOpen,
    onClose,
    onSelect,
}: StorePickerDropdownProps) {
    const isDark = useColorScheme() === "dark";

    return (
        <>
            {/* button for dropdown */}
            {selectedStore && (
                <TouchableOpacity
                    className="bg-slate-50 dark:bg-darkBackgroundMuted border border-slate-200 dark:border-darkBorder px-[14px] py-[8px] rounded-full flex-row items-center gap-[6px]"
                    onPress={onOpen}
                >
                    <Text
                        className="text-[14p] font-poppins-medium text-textPrimary dark:text-darkTextPrimary"
                        numberOfLines={1}
                    >
                        {selectedStore.name}
                    </Text>
                    <ChevronDown
                        size={18}
                        color={isDark ? "#D4D4D4" : "#1e293b"}
                    />
                </TouchableOpacity>
            )}

            {/* contents of drowpdown */}
            <Modal visible={isVisible} transparent={true} animationType="fade">
                <Pressable
                    className="flex-1 bg-black/30 justify-start items-end pt-[80px] pr-[20px]"
                    onPress={onClose}
                >
                    <View className="bg-white dark:bg-darkBackgroundCard rounded-[24px] p-2 min-w-[220px] max-w-[280px] shadow-2xl elevation-10 border border-slate-100 dark:border-darkBorder">
                        {stores.map((s, index) => {
                            const isActive = s.id === selectedStore?.id;
                            const isLast = index === stores.length - 1;
                            return (
                                <View key={s.id}>
                                    <View className="px-1">
                                        <Pressable
                                            style={({ pressed }) => [
                                                { backgroundColor: pressed ? (isDark ? '#262626' : '#f8fafc') : 'transparent' },
                                                isActive ? { backgroundColor: '#fff7ed' } : {}
                                            ]}
                                            className="px-4 py-3.5 flex-row items-center justify-between rounded-2xl"
                                            onPress={() => {
                                                onSelect(s.id);
                                                onClose();
                                            }}
                                        >
                                            <Text
                                                className={`text-[15px] font-poppins flex-1 ${isActive ? "text-[#FF6600] font-poppins-bold" : "text-slate-600 dark:text-darkTextSecondary"}`}
                                                numberOfLines={1}
                                            >
                                                {s.name}
                                            </Text>
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
                        })}
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}