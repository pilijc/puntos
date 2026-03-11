import React, { useState } from "react";
import { Modal, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, useColorScheme } from "react-native";
import { View, Text, SafeAreaView, TouchableOpacity, TextInput, ScrollView } from "@/tw";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/supabase/supabase";

type Props = {
    visible: boolean;
    onClose: () => void;
};

export default function ChangePasswordModal({ visible, onClose }: Props) {
    const isDark = useColorScheme() === "dark";

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [repeatNewPassword, setRepeatNewPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const resetForm = () => {
        setCurrentPassword("");
        setNewPassword("");
        setRepeatNewPassword("");
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleConfirm = async () => {
        if (!currentPassword || !newPassword || !repeatNewPassword) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }
        if (newPassword !== repeatNewPassword) {
            Alert.alert("Error", "New passwords do not match");
            return;
        }
        if (newPassword.length < 8) {
            Alert.alert("Error", "Password should be at least 8 characters");
            return;
        }

        setLoading(true);
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user?.email) throw new Error("Could not find authenticated user");

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });
            if (signInError) throw new Error("Current password is incorrect");

            const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
            if (updateError) throw updateError;

            Alert.alert("Success", "Your password has been changed successfully.");
            handleClose();
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent
            statusBarTranslucent
            visible={visible}
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={"padding"}
                style={{ flex: 1 }}
            >
                {/* Scrim */}
                <TouchableOpacity
                    className="absolute inset-0 bg-black/50"
                    activeOpacity={1}
                    onPress={handleClose}
                />

                {/* Sheet */}
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                    <SafeAreaView className="bg-background dark:bg-darkBackground rounded-t-[32px]">
                        <View className="px-6 pt-3 pb-2">
                            {/* Handle */}
                            <View className="w-10 h-1 rounded-full bg-neutral-200 dark:bg-darkBackgroundCard self-center mb-5" />

                            {/* Header */}
                            <View className="flex-row justify-between items-center mb-6">
                                <View>
                                    <Text className="text-xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">Change Password</Text>
                                    <Text className="text-sm font-poppins-regular text-neutral-500 dark:text-darkTextSecondary">Enter your current and new password</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={handleClose}
                                    disabled={loading}
                                    className="h-10 w-10 bg-neutral-100 dark:bg-darkBackgroundMuted rounded-full items-center justify-center"
                                >
                                    <Ionicons name="close-outline" size={22} color={isDark ? "#9ca3af" : "#4b5563"} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                {/* Current Password */}
                                <View className="mb-4">
                                    <Text className="text-xs font-poppins-bold text-neutral-600 dark:text-darkTextSecondary mb-1.5 ml-1">Current Password</Text>
                                    <View className="flex-row items-center bg-neutral-50 dark:bg-darkBackgroundMuted border border-neutral-200 dark:border-darkBorder rounded-xl px-4 py-1">
                                        <Ionicons name="lock-closed-outline" size={18} color={isDark ? "#6b7280" : "#9CA3AF"} />
                                        <TextInput
                                            className="flex-1 p-3 font-poppins-medium text-neutral-900 dark:text-darkTextPrimary"
                                            placeholder="Enter current password"
                                            secureTextEntry
                                            value={currentPassword}
                                            onChangeText={setCurrentPassword}
                                            editable={!loading}
                                            placeholderTextColor={isDark ? "#4b5563" : "#9CA3AF"}
                                        />
                                    </View>
                                </View>

                                {/* New Password */}
                                <View className="mb-4">
                                    <Text className="text-xs font-poppins-bold text-neutral-600 dark:text-darkTextSecondary mb-1.5 ml-1">New Password</Text>
                                    <View className="flex-row items-center bg-neutral-50 dark:bg-darkBackgroundMuted border border-neutral-200 dark:border-darkBorder rounded-xl px-4 py-1">
                                        <Ionicons name="lock-open-outline" size={18} color={isDark ? "#6b7280" : "#9CA3AF"} />
                                        <TextInput
                                            className="flex-1 p-3 font-poppins-medium text-neutral-900 dark:text-darkTextPrimary"
                                            placeholder="Enter new password"
                                            secureTextEntry
                                            value={newPassword}
                                            onChangeText={setNewPassword}
                                            editable={!loading}
                                            placeholderTextColor={isDark ? "#4b5563" : "#9CA3AF"}
                                        />
                                    </View>
                                </View>

                                {/* Repeat New Password */}
                                <View className="mb-6">
                                    <Text className="text-xs font-poppins-bold text-neutral-600 dark:text-darkTextSecondary mb-1.5 ml-1">Repeat New Password</Text>
                                    <View className="flex-row items-center bg-neutral-50 dark:bg-darkBackgroundMuted border border-neutral-200 dark:border-darkBorder rounded-xl px-4 py-1">
                                        <Ionicons name="shield-checkmark-outline" size={18} color={isDark ? "#6b7280" : "#9CA3AF"} />
                                        <TextInput
                                            className="flex-1 p-3 font-poppins-medium text-neutral-900 dark:text-darkTextPrimary"
                                            placeholder="Repeat new password"
                                            secureTextEntry
                                            value={repeatNewPassword}
                                            onChangeText={setRepeatNewPassword}
                                            editable={!loading}
                                            placeholderTextColor={isDark ? "#4b5563" : "#9CA3AF"}
                                        />
                                    </View>
                                </View>

                                {/* Actions */}
                                <View className="flex-row gap-3">
                                    <TouchableOpacity
                                        onPress={handleClose}
                                        disabled={loading}
                                        className="flex-1 py-4 rounded-2xl items-center bg-neutral-100 dark:bg-darkBackgroundMuted"
                                    >
                                        <Text className="text-neutral-900 dark:text-darkTextSoftest font-poppins-bold">Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleConfirm}
                                        disabled={loading}
                                        className={`flex-1 py-4 rounded-2xl items-center bg-primary ${loading ? "opacity-60" : ""}`}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text className="text-white font-poppins-bold">Confirm</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </SafeAreaView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
