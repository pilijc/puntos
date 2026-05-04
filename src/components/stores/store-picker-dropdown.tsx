import React from "react";
import { Modal, useColorScheme } from "react-native";
import { View, Pressable, Text } from "@/tw";
import { Button } from "@/components/button";
import { Check } from "lucide-react-native";
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
                <Button
                    label={selectedStore.name}
                    onPress={onOpen}
                    variant="clear"
                    rightIcon="ChevronDown"
                    roundedFull
                    fitContent
                />
            )}

            {/* contents of drowpdown */}
            <Modal visible={isVisible} transparent={true} animationType="fade">
                <Pressable
                    className="flex-1 bg-black/30 justify-start items-end pt-[85px] pr-[20px]"
                    onPress={onClose}
                >
                    <View className="bg-white dark:bg-darkBackgroundCard rounded-xl min-w-[180px] max-w-[220px] shadow-2xl elevation-10 border border-slate-100 dark:border-darkBorder">
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
                                            className="px-2.5 py-2.5 flex-row items-center justify-between rounded-2xl"
                                            onPress={() => {
                                                onSelect(s.id);
                                                onClose();
                                            }}
                                        >
                                            <Text
                                                className={`text-sm font-poppins flex-1 ${isActive ? "text-[#FF6600] font-poppins-semibold" : "text-slate-600 dark:text-darkTextSecondary"}`}
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