import React, { useState, useEffect } from "react";
import { KeyboardAvoidingView, useColorScheme } from "react-native";
import { View, Text, TouchableOpacity, ScrollView } from "@/tw";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { User, Camera } from "lucide-react-native";
import { useProfileStore } from "@/store/profile-store";
import { Modal } from "@/components/modal";
import { TextField } from "@/components/text-field";
import { useTranslation } from "react-i18next";

type Props = {
    visible: boolean;
    onClose: () => void;
};

export default function EditProfileModal({ visible, onClose }: Props) {
    const isDark = useColorScheme() === "dark";
    const { t: translate } = useTranslation();

    const { user, profile, isSaving, saveProfile } = useProfileStore();
    const [username, setUsername] = useState(profile?.name || "");
    const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url || null);
    const [errorVisible, setErrorVisible] = useState(false);

    useEffect(() => {
        if (visible) {
            setUsername(profile?.name || "");
            setAvatarUri(profile?.avatar_url || null);
        }
    }, [visible, profile]);

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
                visible={visible}
                onClose={onClose}
                title={translate("settings.profile.title")}
                message={translate("settings.profile.description")}
                buttons={[
                    {
                        label: translate("label.cancel"),
                        variant: "secondary",
                        onPress: onClose,
                        disabled: isSaving
                    },
                    {
                        label: translate("label.save"),
                        variant: "primary",
                        onPress: handleSave,
                        disabled: isSaving
                    }
                ]}
            >
                <KeyboardAvoidingView behavior="padding">
                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {/* avatar picker section */}
                        <View className="items-center mb-6">
                            <View className="relative">
                                <View className="h-24 w-24 rounded-full bg-primary/10 items-center justify-center overflow-hidden border-2 border-primary/20">
                                    {avatarUri ? (
                                        <Image
                                            source={{ uri: avatarUri }}
                                            style={{ width: '100%', height: '100%' }}
                                            contentFit="cover"
                                        />
                                    ) : (
                                        <User size={40} color="#ff6600" />
                                    )}
                                </View>
                                <TouchableOpacity
                                    onPress={pickImage}
                                    className="absolute bottom-0 right-0 bg-primary h-8 w-8 rounded-full items-center justify-center border-2 border-border dark:border-darkBorder"
                                >
                                    <Camera size={16} color="white" />
                                </TouchableOpacity>
                            </View>
                            <Text className="text-xs font-poppins-medium text-primary mt-2">
                                {translate("settings.profile.label.pic")}
                            </Text>
                        </View>

                        {/* form field */}
                        <TextField
                            label={translate("settings.profile.label.name")}
                            placeholder={translate("settings.profile.input.name")}
                            value={username}
                            onChangeText={setUsername}
                        />

                        <View pointerEvents="none" className="opacity-60">
                            <TextField
                                label={translate("settings.profile.label.email")}
                                value={user?.email || ""}
                                onChangeText={() => { }}
                                placeholder={translate("settings.profile.input.email")}
                                hint={translate("settings.profile.emailDescription")}
                            />
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>

            <Modal
                visible={errorVisible}
                onClose={() => setErrorVisible(false)}
                title={translate("label.error")}
                message={translate("settings.profile.error.failed")}
                buttons={[
                    {
                        label: translate("label.confirm"),
                        variant: "danger",
                        onPress: () => setErrorVisible(false),
                    }
                ]}
            />
        </>
    );
}