import React, { useState, useEffect, useRef } from "react";
import {
    Modal,
    KeyboardAvoidingView,
    useColorScheme,
    StyleSheet,
    PanResponder,
} from "react-native";
import { View, Text, SafeAreaView, TouchableOpacity, TextInput, ScrollView } from "@/tw";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

//store
import { useProfileStore } from "@/store/profile-store";

// components
import { Button } from "@/components/button";
import { Modal as AppModal } from "@/components/modal";

type Props = {
    visible: boolean;
    onClose: () => void;
};

export default function EditProfileModal({ visible, onClose }: Props) {
    const isDark = useColorScheme() === "dark";

    const {
        user,
        profile,
        isSaving,
        saveProfile
    } = useProfileStore();
    const [username, setUsername] = useState(profile?.name || "");
    const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url || null);
    const [errorVisible, setErrorVisible] = useState(false);

    useEffect(() => {
        if (visible) {
            setUsername(profile?.name || "");
            setAvatarUri(profile?.avatar_url || null);
        }
    }, [visible, profile]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 80) {
                    onClose();
                }
            },
        })
    ).current;

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setAvatarUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (isSaving) return;

        const result = await saveProfile({
            username,
            avatarUri,
            initialAvatar: profile?.avatar_url || null,
        });

        if (result.success) {
            onClose();
        } else {
            setErrorVisible(true);
        }
    };

    return (
        <>
            <Modal
                animationType="slide"
                transparent
                statusBarTranslucent
                visible={visible}
                onRequestClose={onClose}
            >
                <TouchableOpacity
                    style={[StyleSheet.absoluteFill, styles.backdrop]}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <KeyboardAvoidingView behavior="padding" style={styles.container}>
                    <SafeAreaView className="bg-background dark:bg-darkBackground rounded-t-3xl">
                        <View className="px-6 pt-2 pb-4">

                            {/* Handle bar */}
                            <View
                                className="items-center py-3"
                                {...panResponder.panHandlers}
                            >
                                <View className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                            </View>

                            {/* header */}
                            <View className="flex-row justify-between items-center mb-6">
                                <View>
                                    <Text className="text-xl font-poppins-bold text-textSecondary dark:text-darkTextPrimary">Edit Profile</Text>
                                    <Text className="text-sm font-poppins-regular text-textSecondary dark:text-darkTextSecondary">Update your account information</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={onClose}
                                    disabled={isSaving}
                                    className="h-10 w-10 bg-backgroundMuted dark:bg-darkBackgroundMuted rounded-full items-center justify-center"
                                >
                                    <Ionicons name="close-outline" size={22} color={isDark ? "#9ca3af" : "#4b5563"} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                            >
                                <View className="items-center mb-6">
                                    <View className="relative">
                                        <View className="h-24 w-24 rounded-full bg-primary/10 items-center justify-center overflow-hidden border-2 border-primary/20">
                                            {avatarUri ? (
                                                <Image
                                                    source={{ uri: avatarUri }}
                                                    style={{ width: '100%', height: '100%' }}
                                                    contentFit="cover"
                                                    cachePolicy="none"
                                                />
                                            ) : (
                                                <Ionicons name="person-outline" size={40} color="#FF6600" />
                                            )}
                                        </View>
                                        <TouchableOpacity
                                            onPress={pickImage}
                                            className="absolute bottom-0 right-0 bg-primary h-8 w-8 rounded-full items-center justify-center border-2 border-white dark:border-darkBackground"
                                        >
                                            <Ionicons name="camera" size={16} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                    <Text className="text-xs font-poppins-medium text-primary mt-2">Change profile photo</Text>
                                </View>

                                {/* Username */}
                                <View className="mb-4">
                                    <Text className="text-xs font-poppins-bold text-neutral-600 dark:text-darkTextSecondary mb-1.5 ml-1">Username</Text>
                                    <View className="flex-row items-center bg-neutral-50 dark:bg-darkBackgroundMuted border border-neutral-200 dark:border-darkBorder rounded-xl px-4 py-1">
                                        <Ionicons name="person-outline" size={18} color={isDark ? "#6b7280" : "#9CA3AF"} />
                                        <TextInput
                                            className="flex-1 p-3 font-poppins-medium text-neutral-900 dark:text-darkTextPrimary"
                                            placeholder="Enter username"
                                            value={username}
                                            onChangeText={setUsername}
                                            placeholderTextColor={isDark ? "#4b5563" : "#9ca3af"}
                                            editable={!isSaving}
                                        />
                                    </View>
                                </View>

                                {/* Email Input (read-only) */}
                                <View className="mb-6">
                                    <Text className="text-xs font-poppins-bold text-neutral-600 dark:text-darkTextSecondary mb-1.5 ml-1">Email Address</Text>
                                    <View className="flex-row items-center bg-neutral-50 dark:bg-darkBackgroundMuted border border-neutral-200 dark:border-darkBorder rounded-xl px-4 py-1">
                                        <Ionicons name="mail-outline" size={18} color={isDark ? "#6b7280" : "#9CA3AF"} />
                                        <TextInput
                                            className="flex-1 p-3 font-poppins-medium text-neutral-900 dark:text-darkTextPrimary"
                                            placeholder="Enter email"
                                            value={user?.email || ""}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            placeholderTextColor={isDark ? "#4b5563" : "#9ca3af"}
                                            editable={false}
                                        />
                                    </View>
                                    <Text className="text-[10px] font-poppins-regular text-textMuted dark:text-darkTextMuted mt-1.5 ml-1">
                                        Email verification is required to update your email address.
                                    </Text>
                                </View>

                                {/* Action Buttons */}
                                <View className="flex-row gap-3 mb-2">
                                    <View className="flex-1">
                                        <Button
                                            label="Cancel"
                                            variant="secondary"
                                            fullWidth
                                            onPress={onClose}
                                            disabled={isSaving}
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Button
                                            label="Save Changes"
                                            variant="primary"
                                            fullWidth
                                            onPress={handleSave}
                                            loading={isSaving}
                                        />
                                    </View>
                                </View>

                            </ScrollView>
                        </View>
                    </SafeAreaView>
                </KeyboardAvoidingView>
            </Modal>

            <AppModal
                visible={errorVisible}
                onClose={() => setErrorVisible(false)}
                title="Error"
                message="Failed to save profile. Please try again."
                buttons={[
                    {
                        label: "OK",
                        variant: "danger",
                        onPress: () => setErrorVisible(false),
                    }
                ]}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "flex-end",
    },
    backdrop: {
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
});