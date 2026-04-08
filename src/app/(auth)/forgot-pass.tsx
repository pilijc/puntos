import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "@/tw";
import React, { useState } from "react";
import { Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { resetPasswordService } from "@/services/auth-service";
import { useAuthStore } from "@/store/auth-store";
import { useTranslation } from "react-i18next";
import TranslateButton from "@/components/ui/translate-button";

export default function ForgotPassword() {
  const { email, setEmail, reset } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const { t: translate } = useTranslation();

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        translate("onboarding.forgotPassword.error.emailRequired"),
        translate("onboarding.forgotPassword.error.emailRequiredDetail")
      );
      return;
    }

    setLoading(true);
    try {
      await resetPasswordService(email.trim());
      Alert.alert(
        translate("onboarding.forgotPassword.success.checkEmail"),
        translate("onboarding.forgotPassword.success.checkEmailDetail")
      );
      reset();
      router.replace("/login");
    } catch (error: any) {
      const message =
        error?.msg ??
        (typeof error?.message === "string"
          ? error.message
          : translate("label.somethingWentWrong"));
      Alert.alert(translate("onboarding.forgotPassword.error.resetFailed"), message);
    } finally {
      reset();
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
            <View className="gap-y-4">
              <View className="items-center justify-center">
                <View className="w-16 h-16 rounded-full items-center justify-center">
                  <Image
                    source={require("../../assets/images/puntos-icon.png")}
                    className="w-16 h-16"
                  />
                </View>
              </View>

              <View className="flex-col items-center justify-center gap-y-1">
                <Text className="text-2xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">
                  {translate("onboarding.forgotPassword.title")}
                </Text>
                <Text className="text-neutral-600 dark:text-darkTextSecondary font-poppins text-center">
                  {translate("onboarding.forgotPassword.subtitle")}
                </Text>
              </View>
            </View>

            <View className="gap-y-4">
              <View>
                <Text className="mb-2 text-sm font-poppins-medium text-neutral-700 dark:text-darkTextSecondary">
                  {translate("onboarding.forgotPassword.label.email")}
                </Text>
                <TextInput
                  placeholder={translate("onboarding.forgotPassword.input.email")}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="border border-neutral-300 dark:border-darkBorder rounded-xl px-4 py-4 font-poppins text-neutral-900 dark:text-darkTextPrimary bg-white dark:bg-darkBackgroundMuted"
                  onChangeText={setEmail}
                  value={email}
                />
              </View>
            </View>

            <TouchableOpacity
              className="bg-primary py-4 rounded-xl items-center"
              onPress={handleResetPassword}
              disabled={loading}
            >
              <Text className="text-white text-base font-poppins-semibold">
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  translate("onboarding.forgotPassword.button")
                )}
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center">
              <Text className="font-poppins text-neutral-600 dark:text-darkTextSecondary">
                {translate("onboarding.forgotPassword.remembered")}
              </Text>
              <TouchableOpacity onPress={() => router.replace("/login")}>
                <Text className="ml-1 font-poppins-semibold text-primary">
                  {translate("onboarding.forgotPassword.backToLogin")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
