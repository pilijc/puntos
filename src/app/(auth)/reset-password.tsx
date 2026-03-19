import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "@/tw";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/supabase/supabase";
import { useTranslation } from "react-i18next";
import TranslateButton from "@/components/ui/translate-button";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { t: translate } = useTranslation();

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      Alert.alert(
        translate("onboarding.resetPassword.error.missingFields"),
        translate("onboarding.resetPassword.error.missingFieldsDetail")
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        translate("onboarding.resetPassword.error.passwordMismatch"),
        translate("onboarding.resetPassword.error.passwordMismatchDetail")
      );
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        translate("onboarding.resetPassword.error.weakPassword"),
        translate("onboarding.resetPassword.error.weakPasswordDetail")
      );
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        throw error;
      }

      Alert.alert(
        translate("onboarding.resetPassword.success.passwordUpdated"),
        translate("onboarding.resetPassword.success.passwordUpdatedDetail")
      );
      router.replace("/login");
    } catch (error: any) {
      const message =
        error?.msg ??
        (typeof error?.message === "string"
          ? error.message
          : translate("onboarding.resetPassword.error.somethingWentWrong"));
      Alert.alert(translate("onboarding.resetPassword.error.resetFailed"), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-darkBackground p-4">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Language Toggle */}
          <View className="items-end mb-2">
            <TranslateButton />
          </View>

          <View className="flex-1 justify-center gap-y-6 p-2">
            <View className="gap-y-2">
              <Text className="text-2xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary text-center">
                {translate("onboarding.resetPassword.title")}
              </Text>
              <Text className="text-neutral-600 dark:text-darkTextSecondary font-poppins text-center">
                {translate("onboarding.resetPassword.subtitle")}
              </Text>
            </View>

            <View className="gap-y-4">
              <View>
                <Text className="mb-2 text-sm font-poppins-medium text-neutral-700 dark:text-darkTextSecondary">
                  {translate("onboarding.resetPassword.label.newPassword")}
                </Text>
                <TextInput
                  placeholder={translate("onboarding.resetPassword.input.newPassword")}
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  autoCapitalize="none"
                  className="border border-neutral-300 dark:border-darkBorder rounded-xl px-4 py-4 font-poppins text-neutral-900 dark:text-darkTextPrimary bg-white dark:bg-darkBackgroundMuted"
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <View>
                <Text className="mb-2 text-sm font-poppins-medium text-neutral-700 dark:text-darkTextSecondary">
                  {translate("onboarding.resetPassword.label.confirmPassword")}
                </Text>
                <TextInput
                  placeholder={translate("onboarding.resetPassword.input.confirmPassword")}
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  autoCapitalize="none"
                  className="border border-neutral-300 dark:border-darkBorder rounded-xl px-4 py-4 font-poppins text-neutral-900 dark:text-darkTextPrimary bg-white dark:bg-darkBackgroundMuted"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              className="bg-primary py-4 rounded-xl items-center"
              onPress={handleReset}
              disabled={loading}
            >
              <Text className="text-white text-base font-poppins-semibold">
                {loading
                  ? translate("onboarding.resetPassword.saving")
                  : translate("onboarding.resetPassword.button")}
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center">
              <TouchableOpacity onPress={() => router.replace("/login")}>
                <Text className="font-poppins text-primary">
                  {translate("onboarding.resetPassword.backToLogin")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}