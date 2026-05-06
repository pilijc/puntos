import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "@/tw";
import React, { useState, useMemo } from "react";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/supabase/supabase";
import { useTranslation } from "react-i18next";
import TranslateButton from "@/components/ui/translate-button";
import { CheckCircle2, Circle } from "lucide-react-native";
import { usePasswordValidation } from "@/hooks/use-password-validation";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { t: translate } = useTranslation();

  const { requirements, allMet } = usePasswordValidation(password);

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      Alert.alert(
        translate("onboarding.resetPassword.error.missingFields"),
        translate("onboarding.resetPassword.error.missingFieldsDetail")
      );
      return;
    }

    if (!allMet) {
      Alert.alert(
        translate("onboarding.resetPassword.error.weakPassword"),
        translate("onboarding.resetPassword.error.weakPasswordDetail")
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
          : translate("label.somethingWentWrong"));
      Alert.alert(translate("onboarding.resetPassword.error.resetFailed"), message);
    } finally {
      setLoading(false);
    }
  };

  const RequirementItem = ({ label, met }: { label: string; met: boolean }) => (
    <View className="flex-row items-center gap-x-2 mb-1">
      {met ? (
        <CheckCircle2 size={16} color="#10B981" />
      ) : (
        <Circle size={16} color="#9CA3AF" />
      )}
      <Text
        className={`text-xs font-poppins ${
          met
            ? "text-emerald-600 dark:text-emerald-500"
            : "text-neutral-500 dark:text-darkTextSecondary"
        }`}
      >
        {label}
      </Text>
    </View>
  );

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

              {/* Password Requirements */}
              <View className="bg-neutral-50 dark:bg-darkBackgroundMuted/50 p-4 rounded-xl border border-neutral-100 dark:border-darkBorder/50">
                <Text className="text-sm font-poppins-semibold text-neutral-700 dark:text-darkTextPrimary mb-2">
                  {translate("onboarding.resetPassword.requirements.title")}
                </Text>
                <RequirementItem
                  label={translate("onboarding.resetPassword.requirements.minLength")}
                  met={requirements.hasMinLength}
                />
                <RequirementItem
                  label={translate("onboarding.resetPassword.requirements.uppercase")}
                  met={requirements.hasUppercase}
                />
                <RequirementItem
                  label={translate("onboarding.resetPassword.requirements.lowercase")}
                  met={requirements.hasLowercase}
                />
                <RequirementItem
                  label={translate("onboarding.resetPassword.requirements.number")}
                  met={requirements.hasNumber}
                />
                <RequirementItem
                  label={translate("onboarding.resetPassword.requirements.special")}
                  met={requirements.hasSpecial}
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
              className={`py-4 rounded-xl items-center ${
                allMet ? "bg-primary" : "bg-neutral-300 dark:bg-neutral-700"
              }`}
              onPress={handleReset}
              disabled={loading || !allMet}
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