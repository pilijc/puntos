import React, { useState } from "react";
import { Modal, Alert, ActivityIndicator, KeyboardAvoidingView, useColorScheme } from "react-native";
import { View, Text, SafeAreaView, TouchableOpacity, TextInput, ScrollView } from "@/tw";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/supabase/supabase";

type Props = {
    visible: boolean;
    onClose: () => void;
};

export default function ChangePasswordModal({ visible, onClose }: Props) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [repeatNewPassword, setRepeatNewPassword] = useState("");

    const [loading, setLoading] = useState(false);

    const isDark = useColorScheme() === 'dark';

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

            if (signInError) {
                throw new Error("Current password is incorrect");
            }

            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });

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
                behavior="padding"
                style={{ flex: 1 }}
            >
                <TouchableOpacity
                    className="absolute inset-0 bg-black/50"
                    activeOpacity={1}
                    onPress={handleClose}
                />

                <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                    <SafeAreaView className="bg-background dark:bg-neutral-800 rounded-t-3xl">
                        <ScrollView className="p-6 pb-8" keyboardShouldPersistTaps="handled">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-xl font-poppins-bold text-neutral-900 dark:text-white">Change Password</Text>
                                <TouchableOpacity onPress={handleClose} disabled={loading}>
                                    <Ionicons name="close-outline" size={25} color="#EF4444" />
                                </TouchableOpacity>
                            </View>

                            <View className="mb-4">
                                <Text className="text-sm font-poppins-medium text-neutral-700 dark:text-neutral-300 mb-2">Current Password</Text>
                                <TextInput
                                    className="border-neutral-300 dark:border-neutral-600 border rounded-lg p-3 font-poppins-regular text-neutral-900 dark:text-white dark:bg-neutral-700"
                                    placeholder="Enter current password"
                                    secureTextEntry
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    editable={!loading}
                                    placeholderTextColor={isDark ? '#6b7280' : '#9CA3AF'}
                                />
                            </View>

                            <View className="mb-4">
                                <Text className="text-sm font-poppins-medium text-neutral-700 dark:text-neutral-300 mb-2">New Password</Text>
                                <TextInput
                                    className="border-neutral-300 dark:border-neutral-600 border rounded-lg p-3 font-poppins-regular text-neutral-900 dark:text-white dark:bg-neutral-700"
                                    placeholder="Enter new password"
                                    secureTextEntry
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    editable={!loading}
                                    placeholderTextColor={isDark ? '#6b7280' : '#9CA3AF'}
                                />
                            </View>

                            <View className="mb-6">
                                <Text className="text-sm font-poppins-medium text-neutral-700 dark:text-neutral-300 mb-2">Repeat New Password</Text>
                                <TextInput
                                    className="border-neutral-300 dark:border-neutral-600 border rounded-lg p-3 font-poppins-regular text-neutral-900 dark:text-white dark:bg-neutral-700"
                                    placeholder="Repeat new password"
                                    secureTextEntry
                                    value={repeatNewPassword}
                                    onChangeText={setRepeatNewPassword}
                                    editable={!loading}
                                    placeholderTextColor={isDark ? '#6b7280' : '#9CA3AF'}
                                />
                            </View>

                            <View className="flex-row items-center gap-4">
                                <TouchableOpacity
                                    onPress={handleClose}
                                    disabled={loading}
                                    className="flex-1 py-4 rounded-xl items-center bg-neutral-100 dark:bg-neutral-700"
                                >
                                    <Text className="text-neutral-900 dark:text-neutral-200 font-poppins-semibold">Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleConfirm}
                                    disabled={loading}
                                    className="flex-1 py-4 rounded-xl items-center bg-primary"
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text className="text-white font-poppins-semibold">Confirm</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </SafeAreaView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
