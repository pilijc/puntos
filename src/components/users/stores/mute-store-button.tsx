import React from "react";
import { TouchableOpacity } from "@/tw";
import { Bell, BellOff } from "lucide-react-native";
import { useMuteStore } from "@/hooks/user/use-mute-store";

export const MuteStoreButton = ({ storeId }: { storeId: number }) => {
    const { isMuted, toggleMute, isLoading } = useMuteStore(storeId);
    return (
        <TouchableOpacity 
            onPress={toggleMute}
            disabled={isLoading}
            className="p-2 bg-black/40 border border-white/20 rounded-full items-center justify-center m-1"
        >
            {isMuted ? (
                <BellOff size={22} color="#ff6600" />
            ) : (
                <Bell size={22} color="#ffffff" />
            )}
        </TouchableOpacity>
    );
};