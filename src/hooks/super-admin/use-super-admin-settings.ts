import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useProfile } from "@/hooks/use-profile";
import { useTranslation } from "react-i18next";

export function useSuperAdminSettings() {
    const [editModalVisible, setEditModalVisible] = useState(false);
    const { t: translate } = useTranslation();

    const {
        user,
        profile,
        refreshProfile,
    } = useProfile();

    useFocusEffect(
        useCallback(() => {
            refreshProfile();
        }, [])
    );

    const handleProfilePress = () => {
        setEditModalVisible(true);
    };

    return {
        editModalVisible,
        setEditModalVisible,
        translate,
        user,
        profile,
        handleProfilePress,
    };
}
