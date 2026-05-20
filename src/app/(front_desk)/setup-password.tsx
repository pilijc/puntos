import React, { useState } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView, ScrollView, View } from "@/tw";
import { Modal, type ModalButton } from "@/components/modal";
import { useTranslation } from "react-i18next";
import {
  setupInitialPassword,
  updatePassword,
  checkPasswordSetupRequired,
} from "@/services/frontdesk/password-service";
import { supabase } from "@/supabase/supabase";
import type { PasswordSetupState } from "@/type/frontdesk/password";
import { getRoleTypeForUser } from "@/services/access-service";
import PasswordSetupHeader from "@/components/front-desk/password-setup-header";
import PasswordSetupForm from "@/components/front-desk/password-setup-form";

export default function SetupPasswordScreen() {
  const router = useRouter();
  const { t: translate } = useTranslation();
  const [isInitialSetup, setIsInitialSetup] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [state, setState] = useState<PasswordSetupState>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false,
    isSubmitting: false,
    errors: {},
  });
  const [modal, setModal] = useState<{
    title: string;
    message: string;
    buttons: ModalButton[];
  } | null>(null);

  React.useEffect(() => {
    checkSetupType();
  }, []);

  const checkSetupType = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const requiresSetup = await checkPasswordSetupRequired(user.id);
      setIsInitialSetup(requiresSetup);
    } catch (error) {}
  };

  const updateState = (updates: Partial<PasswordSetupState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return "Password must contain uppercase, lowercase, and numbers";
    }
    return null;
  };

  const handleSubmit = async () => {
    const errors: PasswordSetupState["errors"] = {};

    // Validate new password
    const passwordError = validatePassword(state.newPassword);
    if (passwordError) {
      errors.newPassword = passwordError;
    }

    // Validate confirm password
    if (state.newPassword !== state.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    // For password update (not initial setup), validate current password
    if (!isInitialSetup && !state.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (Object.keys(errors).length > 0) {
      updateState({ errors });
      return;
    }

    updateState({ isSubmitting: true, errors: {} });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not found");
      }

      // Add timeout to prevent hanging
      const setupPromise = isInitialSetup
        ? setupInitialPassword(user.id, state.newPassword)
        : updatePassword(state.currentPassword, state.newPassword);

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Password update timeout")), 8000);
      });

      let result;
      try {
        result = (await Promise.race([setupPromise, timeoutPromise])) as any;
      } catch (timeoutError) {
        // Assume success after timeout to not block user
        result = {
          success: true,
          message:
            "Password update initiated. If you have trouble logging in, please try again.",
        };
      }

      if (result.success && !isCompleted) {
        setIsCompleted(true); // Mark as completed

        // Clear any cached profile data
        try {
          // Clear AsyncStorage (React Native equivalent of localStorage)
          const keys = await AsyncStorage.getAllKeys();
          const profileKeys = keys.filter(
            (key) =>
              key.includes("profile") ||
              key.includes("user") ||
              key.includes("staff") ||
              key.includes("password"),
          );
          await AsyncStorage.multiRemove(profileKeys);

          // Force refresh
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (cacheError) {}

        setModal({
          title: "Success",
          message: result.message || "Password updated successfully!",
          buttons: [
            {
              label: "Continue",
              variant: "primary",
              onPress: () => {
                router.replace("/(front_desk)");
              },
            },
          ],
        });
      } else if (result.success && isCompleted) {
        setModal({
          title: "Error",
          message: result.message || "Failed to update password",
          buttons: [
            {
              label: "OK",
              variant: "secondary",
              onPress: () => setModal(null),
            },
          ],
        });
      }
    } catch (error) {
      setModal({
        title: "Error",
        message: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
        buttons: [
          {
            label: "OK",
            variant: "secondary",
            onPress: () => setModal(null),
          },
        ],
      });
    } finally {
      updateState({ isSubmitting: false });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-darkBackground">
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
      />

      <ScrollView className="flex-1 px-6 pt-16">
        <View className="bg-white dark:bg-darkBackgroundCard p-6 rounded-2xl">
          {/* Header */}
          <PasswordSetupHeader isInitialSetup={isInitialSetup} />

          {/* Form */}
          <PasswordSetupForm
            state={state}
            isInitialSetup={isInitialSetup}
            onStateUpdate={updateState}
            onSubmit={handleSubmit}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
