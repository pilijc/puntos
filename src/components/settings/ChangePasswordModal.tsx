import React, { useState } from "react";
import { Modal, Alert, ActivityIndicator, KeyboardAvoidingView } from "react-native";
import { View, Text, SafeAreaView, TouchableOpacity, TextInput, ScrollView } from "@/tw";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/supabase/supabase";

type Props = {
    visible: boolean;
    onClose: () => void;
};

export default function ChangePasswordModal({ visible, onClose }: Props) {
    // Local state for holding the input values for the password
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [repeatNewPassword, setRepeatNewPassword] = useState("");

    // Loading state to disable inputs/buttons while fetching from Supabase
    const [loading, setLoading] = useState(false);

    // Reset the form fields to blank, typically called after a successful update or when the modal closes
    const resetForm = () => {
        setCurrentPassword("");
        setNewPassword("");
        setRepeatNewPassword("");
    };

    // Helper function to handle closing the modal and clearing state
    const handleClose = () => {
        resetForm();
        onClose();
    };

    // Triggered when the user presses "Confirm"
    const handleConfirm = async () => {
        // Validation: Verify all fields are populated
        if (!currentPassword || !newPassword || !repeatNewPassword) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        // Validation: Verify the two new passwords actually match
        if (newPassword !== repeatNewPassword) {
            Alert.alert("Error", "New passwords do not match");
            return;
        }

        // Validation: Supabase has a default minimum of 6 characters
        if (newPassword.length < 6) {
            Alert.alert("Error", "Password should be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            // 1. Get current authenticated user to fetch their email
            // We need this email to attempt a sign-in with the current password
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user?.email) throw new Error("Could not find authenticated user");

            // 2. Verify the current password by attempting to sign in
            // This ensures the user typing in the old password is correct before allowing a change
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });

            if (signInError) {
                // If sign-in fails, the user typed the wrong current password
                throw new Error("Current password is incorrect");
            }

            // 3. If correct, update the user's password to the new one
            // We are already authenticated so updateUser works against the currently logged-in user
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (updateError) throw updateError;

            Alert.alert("Success", "Your password has been changed successfully.");
            handleClose(); // Successfully done, wipe state and close modal
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal animationType="slide" visible={visible} onRequestClose={handleClose}>
            <SafeAreaView className="flex-1 p-6">
                <TouchableOpacity
                    className="flex-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    activeOpacity={1}
                    onPress={handleClose}
                />

                <KeyboardAvoidingView
                    behavior="height"
                    className="bg-white rounded-t-3xl"
                >
                    <ScrollView className="p-6 pb-8">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-poppins-bold text-neutral-900">Change Password</Text>
                            <TouchableOpacity onPress={handleClose} disabled={loading}>
                                <Ionicons name="close-outline" size={25} color="#EF4444" />
                            </TouchableOpacity>
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-poppins-medium text-neutral-700 mb-2">Current Password</Text>
                            <TextInput
                                className="border-neutral-500 border rounded-lg p-3 font-poppins-regular text-neutral-900"
                                placeholder="Enter current password"
                                secureTextEntry
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                editable={!loading}
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-poppins-medium text-neutral-700 mb-2">New Password</Text>
                            <TextInput
                                className="border-neutral-500 border rounded-lg p-3 font-poppins-regular text-neutral-900"
                                placeholder="Enter new password"
                                secureTextEntry
                                value={newPassword}
                                onChangeText={setNewPassword}
                                editable={!loading}
                            />
                        </View>

                        <View className="mb-6">
                            <Text className="text-sm font-poppins-medium text-neutral-700 mb-2">Repeat New Password</Text>
                            <TextInput
                                className="border-neutral-500 border rounded-lg p-3 font-poppins-regular text-neutral-900"
                                placeholder="Repeat new password"
                                secureTextEntry
                                value={repeatNewPassword}
                                onChangeText={setRepeatNewPassword}
                                editable={!loading}
                            />
                        </View>

                        <View className="flex-row items-center gap-4">
                            <TouchableOpacity
                                onPress={handleClose}
                                disabled={loading}
                                className="flex-1 py-4 rounded-xl items-center bg-neutral-100 Will-change-pressable"
                            >
                                <Text className="text-neutral-900 font-poppins-semibold">Cancel</Text>
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
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}
