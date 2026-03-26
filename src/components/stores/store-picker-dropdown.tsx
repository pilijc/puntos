import React from "react";
import { Modal } from "react-native";
import { View, Text, TouchableOpacity, Pressable } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StoreRow } from "@/services/store-service";
import { StorePickerDropdownProps } from "@/type/store-manager/metric";

export function StorePickerDropdown({
    stores,
    selectedStore,
    isVisible,
    onOpen,
    onClose,
    onSelect,
}: StorePickerDropdownProps) {
    return (
        <>
            {/* button for dropdown */}
            {selectedStore && (
                <TouchableOpacity
                    className="bg-white px-[14px] py-[10px] rounded-full flex-row items-center gap-[8px] elevation-4"
                    onPress={onOpen}
                >
                    <Text
                        className="text-[14p] font-poppins-medium text-textPrimary"
                        numberOfLines={1}
                    >
                        {selectedStore.name}
                    </Text>
                    <MaterialIcons name="keyboard-arrow-down" size={18} color="#1e293b" />
                </TouchableOpacity>
            )}

            {/* contents of drowpdown */}
            <Modal visible={isVisible} transparent={true} animationType="fade">
                <Pressable
                    className="flex-1 bg-black/30 justify-start items-end pt-[80px] pr-[20px]"
                    onPress={onClose}
                >
                    <View className="bg-white rounded-[16px] p-[8px] min-w-[200px] max-w-[250px] elevation-10">
                        {stores.map((s) => {
                            const isActive = s.id === selectedStore?.id;
                            return (
                                <TouchableOpacity
                                    key={s.id}
                                    className={`flex-row items-center justify-between py-[12px] px-[16px] rounded-[10px] ${isActive ? "bg-orange-50" : ""}`}
                                    onPress={() => {
                                        onSelect(s.id);
                                        onClose();
                                    }}
                                >
                                    <View className="flex-1">
                                        <Text
                                            className={`text-sm font-poppins ${isActive ? "text-primary font-poppins-medium" : "textSecondary"}`}
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
        </>
    );
}