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
                    className="bg-white dark:bg-darkBackgroundCard px-[14px] py-[10px] rounded-full flex-row items-center gap-[8px] elevation-4"
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
                    <View className="bg-white dark:bg-darkBackgroundCard rounded-[16px] p-[8px] min-w-[200px] max-w-[250px] elevation-10 border border-transparent dark:border-darkBorder">
                        {stores.map((s, index) => {
                            const isActive = s.id === selectedStore?.id;
                            const isLast = index === stores.length - 1;
                            return (
                                <React.Fragment key={s.id}>
                                    <TouchableOpacity
                                        className={`flex-row items-center justify-between py-[12px] px-[16px] rounded-[10px] ${isActive ? "bg-orange-50 dark:bg-orange-950/30" : ""}`}
                                        onPress={() => {
                                            onSelect(s.id);
                                            onClose();
                                        }}
                                    >
                                        <View className="flex-1">
                                            <Text
                                                className={`text-sm font-poppins ${isActive ? "text-primary font-poppins-medium" : "text-textSecondary dark:text-darkTextSecondary"}`}
                                                numberOfLines={1}
                                            >
                                                {s.name}
                                            </Text>
                                        </View>
                                        {isActive && (
                                            <Check size={18} color="#FF6600" />
                                        )}
                                    </TouchableOpacity>
                                    {!isLast && (
                                        <View className="h-[1px] bg-gray-100 dark:bg-neutral-600 mx-2 my-[1px]" />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}