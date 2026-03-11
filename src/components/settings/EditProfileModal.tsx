import React, { useState, useEffect } from "react";
import { Modal, ActivityIndicator, KeyboardAvoidingView, useColorScheme } from "react-native";
import { View, Text, SafeAreaView, TouchableOpacity, TextInput, ScrollView } from "@/tw";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { Image } from "expo-image";
import { supabase } from "@/supabase/supabase";

type Props = {
  visible: boolean;
  onClose: () => void;
  initialUsername?: string;
  initialEmail?: string;
  initialAvatar?: string | null;
  userId?: string;
  onSave: (newName: string, newEmail: string, newAvatarUrl?: string | null) => Promise<void>;
};

export default function EditProfileModal({
  visible,
  onClose,
  initialUsername = "",
  initialEmail = "",
  initialAvatar = null,
  userId = "",
  onSave,
}: Props) {
  const isDark = useColorScheme() === "dark";

  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(initialEmail);
  const initialAvatarUrl = initialAvatar || (initialAvatar as any)?.avatarUrl || (initialAvatar as any)?.logo;
  const [avatarUri, setAvatarUri] = useState<string | null>(initialAvatarUrl || null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setUsername(initialUsername);
      setEmail(initialEmail);
      const url = initialAvatar || (initialAvatar as any)?.avatarUrl || (initialAvatar as any)?.logo;
      setAvatarUri(url || null);
    }
  }, [visible, initialUsername, initialEmail, initialAvatar]);

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

  const uploadImage = async (uri: string): Promise<string | null> => {
    if (!userId) return null;
    if (uri.startsWith('http')) return uri;

    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpeg';
    const fileName = `${userId}_${Math.random()}.${fileExt}`;
    const filePath = `profile-pictures/${fileName}`;
    const fileType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

    const formData = new FormData();
    formData.append('file', {
      uri,
      name: fileName,
      type: fileType,
    } as any);

    const { error: uploadError } = await supabase.storage
      .from('puntos-public')
      .upload(filePath, formData, {
        contentType: fileType,
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('puntos-public')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSave = async () => {
    if (isSaving || isUploading) return;
    setIsSaving(true);
    try {
      const effectiveInitialAvatar = initialAvatar || (initialAvatar as any)?.avatarUrl || (initialAvatar as any)?.logo;
      let finalAvatarUrl = effectiveInitialAvatar;

      if (avatarUri && avatarUri !== effectiveInitialAvatar) {
        setIsUploading(true);
        finalAvatarUrl = await uploadImage(avatarUri);
        setIsUploading(false);
      }

      await onSave(username, email, finalAvatarUrl);
      onClose();
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      statusBarTranslucent
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={"padding"}
        style={{ flex: 1 }}
      >
        {/* Scrim */}
        <TouchableOpacity
          className="absolute inset-0 bg-black/50"
          activeOpacity={1}
          onPress={onClose}
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
                  <Text className="text-xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">Edit Profile</Text>
                  <Text className="text-sm font-poppins-regular text-neutral-500 dark:text-darkTextSecondary">Update your account information</Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  disabled={loading}
                  className="h-10 w-10 bg-neutral-100 dark:bg-darkBackgroundMuted rounded-full items-center justify-center"
                >
                  <Ionicons name="close-outline" size={22} color={isDark ? "#9ca3af" : "#4b5563"} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Avatar Picker */}
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
                      placeholderTextColor={isDark ? "#4b5563" : "#9CA3AF"}
                      editable={!isSaving}
                    />
                  </View>
                </View>

                {/* Email */}
                <View className="mb-6">
                  <Text className="text-xs font-poppins-bold text-neutral-600 dark:text-darkTextSecondary mb-1.5 ml-1">Email Address</Text>
                  <View className="flex-row items-center bg-neutral-50 dark:bg-darkBackgroundMuted border border-neutral-200 dark:border-darkBorder rounded-xl px-4 py-1">
                    <Ionicons name="mail-outline" size={18} color={isDark ? "#6b7280" : "#9CA3AF"} />
                    <TextInput
                      className="flex-1 p-3 font-poppins-medium text-neutral-900 dark:text-darkTextPrimary"
                      placeholder="Enter email"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor={isDark ? "#4b5563" : "#9CA3AF"}
                      editable={false}
                    />
                  </View>
                  <Text className="text-[10px] font-poppins-regular text-neutral-400 dark:text-darkTextMuted mt-1.5 ml-1">
                    Email verification is required to update your email address.
                  </Text>
                </View>

                {/* Actions */}
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={onClose}
                    disabled={isSaving}
                    className="flex-1 py-4 rounded-2xl items-center bg-neutral-100 dark:bg-darkBackgroundMuted"
                  >
                    <Text className="text-neutral-900 dark:text-darkTextSoftest font-poppins-bold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={isSaving}
                    className={`flex-1 py-4 rounded-2xl items-center bg-primary ${isSaving ? "opacity-60" : ""}`}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white font-poppins-bold">Save Changes</Text>
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
