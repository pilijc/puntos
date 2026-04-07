import React from "react";
import { ActivityIndicator } from "react-native";
import { TouchableOpacity } from "@/tw";
import { BellOff, Bell } from "lucide-react-native";
import { useStoreMute } from "@/hooks/user/use-store-mute";

interface MuteStoreIconButtonProps {
    storeId: number;
}

export const MuteStoreIconButton = ({ storeId }: MuteStoreIconButtonProps) => {
    const { isMuted, loading, toggling, toggleMute } = useStoreMute(storeId);

    if (loading) {
        return (
            <TouchableOpacity
                disabled
                className="w-10 h-10 items-center justify-center rounded-full shadow-sm"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
            >
                <ActivityIndicator size="small" color="#FFFFFF" />
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={toggleMute}
            disabled={toggling}
            className="w-10 h-10 items-center justify-center rounded-full shadow-sm"
            style={{ backgroundColor: isMuted ? "rgba(239, 68, 68, 0.9)" : "rgba(0, 0, 0, 0.5)" }}
            activeOpacity={0.7}
        >
            {isMuted ? (
                <BellOff size={20} color="#FFFFFF" />
            ) : (
                <Bell size={20} color="#FFFFFF" />
            )}
        </TouchableOpacity>
    );
};
