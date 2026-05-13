import { View, Text, TouchableOpacity, ScrollView, Image, SafeAreaView } from "@/tw";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import { KeyboardAvoidingView, Platform, useWindowDimensions } from "react-native";
import { useAuthStore } from "../../store/auth-store";
import { loginService, signInWithGoogleLoginService } from "@/services/auth-service";
import { useTranslation, Trans } from "react-i18next";
import { Modal, type ModalButton } from "@/components/modal";
import { supabase } from "@/supabase/supabase";
import { markIntentionalSignOut } from "@/lib/intentional-signout";
import TranslateButton from "@/components/ui/translate-button";
import { AppHeader } from "@/components/header";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/button";
import { LucideEye, LucideEyeOff } from "lucide-react-native";
import { useDeviceSession } from "@/hooks/store-manager/use-device-session";
import { DeviceLimitModal } from "@/components/store_manager/session/device-limit-modal";

export default function Login() {
  const {email, password, setEmail, setPassword, showPassword, setShowPassword, resetAuthForm, reset } = useAuthStore();
  const { restricted } = useLocalSearchParams();
  const emptyState = { email: "", password: "" };
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const { t: translate } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideWeb = isWeb && windowWidth >= 900;
  const [errors, setErrors] = useState(emptyState);
  const [modal, setModal] = useState<{
    title: string;
    message: string;
    buttons: ModalButton[];
  } | null>(null);

  const { checkAndRegisterSession, blockedSessions, validateHomeRouteSession } = useDeviceSession();
  const [showDeviceLimitModal, setShowDeviceLimitModal] = useState(false);

  const handleCheckAgain = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const sessionCheck = await checkAndRegisterSession(user.id);
    if (sessionCheck.allowed) {
      setShowDeviceLimitModal(false);
      router.replace("/(store_manager)");
    }
  };

  const showRestrictedAccountModal = () =>
    setModal({
      title: "Account Restricted",
      message:
        "Your account has been restricted. To verify your account status, please contact support.",
      buttons: [
        { label: "OK", variant: "primary", onPress: () => setModal(null) },
      ],
    });

  useEffect(() => {
    if (restricted === "true") showRestrictedAccountModal();
  }, [restricted]);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const nextErrors = { ...emptyState }; 
    if (!trimmedEmail) {
      nextErrors.email = translate("onboarding.login.error.emailRequired");
    } else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      nextErrors.email = translate("onboarding.login.error.emailValid");
    }
    if (!password) {
      nextErrors.password = translate("onboarding.login.error.passwordRequired");
    }

    if (nextErrors.email || nextErrors.password) {
      setErrors(nextErrors);
      return;
    }
    setErrors(emptyState);

    try {
      setLoading(true);
      const data = await loginService(trimmedEmail, password);
      if (!data.success) {
        setModal({
          title: "You are not assigned to a store",
          message: data.message,
          buttons: [
            {
              label: "OK",
              variant: "secondary",
              onPress: async () => {
                markIntentionalSignOut();
                await supabase.auth.signOut();
                setModal(null);
              }
            },
          ],
        });
        return;
      }

      const isAllowed = await validateHomeRouteSession(data.homeRoute);
      if (!isAllowed) {
        setShowDeviceLimitModal(true);
        return;
      }
      resetAuthForm();
      reset();
      router.replace(data.homeRoute);
    } catch (error: any) {
      if (error?.name === "AccountBlockedError") {
        useAuthStore.getState().setRestricted(true);
        return;
      }

      const rawMessage = error?.msg ?? error?.message;
      const message =
        !rawMessage || rawMessage === "Invalid login credentials"
          ? translate("onboarding.login.error.invalidLogin")
          : rawMessage;

      setErrors({ email: "", password: message });
    } finally {
      setLoading(false);
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      setLoadingGoogle(true);
      const data = await signInWithGoogleLoginService();

      const isAllowed = await validateHomeRouteSession(data.homeRoute);
      if (!isAllowed) {
        setShowDeviceLimitModal(true);
        return;
      }
      resetAuthForm();
      router.replace(data.homeRoute ?? "/(user)");
    } catch (error: any) {
      if (error?.name === "AccountBlockedError") {
        useAuthStore.getState().setRestricted(true);
        return;
      }
      const message = error?.message ?? "Something went wrong";
      setErrors({ email: "", password: message });
    } finally {
      setLoadingGoogle(false);
    }
  };

  const LoginForm = (
    <>
      <View className="w-full items-center gap-y-3">
        <View className="w-full">
          <TextField
            label={translate("label.email")}
            value={email}
            onChangeText={setEmail}
            placeholder={translate("label.emailPlaceholder")}
            keyboardType="email-address"
            onSubmitEditing={isWeb ? handleLogin : undefined}
          />
        </View>

        <View className="w-full">
          <TextField
            label={translate("label.password")}
            value={password}
            onChangeText={setPassword}
            placeholder={translate("onboarding.login.input.password")}
            keyboardType="default"
            secureTextEntry={!showPassword}
            onSubmitEditing={isWeb ? handleLogin : undefined}
            rightAccessory={
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="ml-[-32px] p-2"
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <LucideEye color="#9ca3af" size={16} />
                ) : (
                  <LucideEyeOff color="#9ca3af" size={16} />
                )}
              </TouchableOpacity>
            }
          />
        </View>
        <View className="w-full">
          {(errors.password || errors.email) ? (
            <Text className="text-sm font-poppins text-red-500 dark:text-red-400 text-center bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 w-full">
              {errors.password || errors.email}
            </Text>
          ) : null}
        </View>
      </View>

      <Button
        label={translate("onboarding.login.button")}
        onPress={handleLogin}
        loading={loading}
        disabled={loading}
        fullWidth={true}
        authButton={true}
      />

      {!isWeb && (
        <>
          <View className="flex-row items-center gap-x-4 w-full max-w-md">
            <View className="flex-1 h-px bg-neutral-100 dark:bg-darkBorder" />
            <Text className="text-neutral-500 dark:text-darkTextMuted font-poppins text-sm text-center">
              {translate("onboarding.signup.divider")}
            </Text>
            <View className="flex-1 h-px bg-neutral-100 dark:bg-darkBorder" />
          </View>
          <Button
            label={translate("onboarding.signup.google")}
            onPress={handleSignInWithGoogle}
            loading={loadingGoogle}
            disabled={loadingGoogle}
            variant="secondary"
            fullWidth={true}
            authButton={true}
            leftImage={require("../../assets/images/google-icon.png")}
            leftImageSize={14}
          />
        </>
      )}

      <View className="flex-row justify-center items-center w-full">
        <Text className="text-sm font-poppins text-neutral-600 dark:text-darkTextSecondary text-center">
          <Trans
            i18nKey="onboarding.login.signup"
            components={{
              signup: (
                <Text
                  className="ml-1 font-poppins-semibold text-primary text-center"
                  onPress={() => router.replace("/signup")}
                />
              )
            }}
          />
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView className={isWeb ? "flex-1 bg-slate-50 dark:bg-darkBackground" : "flex-1 bg-white dark:bg-darkBackground"}>
      <DeviceLimitModal
        visible={showDeviceLimitModal}
        sessions={blockedSessions}
        onCheckAgain={handleCheckAgain}
        onCancel={async () => {
          setShowDeviceLimitModal(false);
          markIntentionalSignOut();
          await supabase.auth.signOut();
        }}
      />
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
      />
      <AppHeader
        title={""}
        onBackPress={() =>
          router.replace(
            Platform.OS === "web" ? "/(onboarding)/landing" : "/welcome",
          )
        }
        rightIcon={<TranslateButton />}
      />
      {isWeb ? (
        <View className="flex-1 items-center justify-center p-4">
          <View className="w-full max-w-4xl border border-slate-100 dark:border-neutral-700 rounded-xl bg-white dark:bg-darkBackground overflow-hidden">
            <View
              style={{ flexDirection: isWideWeb ? "row" : "column" }}
              className="w-full"
            >
              <View className={isWideWeb ? "w-1/2 border-r border-slate-100 dark:border-neutral-700" : "border-b border-slate-100 dark:border-neutral-700"}>
                <Image
                  source={require("../../assets/images/welcome-web.png")}
                  className="w-full h-full min-h-[220px]"
                  resizeMode="contain"
                />
              </View>
              <View className={isWideWeb ? "w-1/2 p-8" : "p-6"}>
                <KeyboardAvoidingView
                  behavior={Platform.OS === "android" ? "padding" : "height"}
                  className="w-full"
                >
                  <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                  >
                    <View className="w-full gap-y-4">
                      <View className="items-start">
                        <Image
                          source={require("../../assets/images/puntos-icon.png")}
                          className="w-16 h-16"
                        />
                      </View>
                      <View className="w-full">
                        <Text className="text-lg font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                          {translate("onboarding.login.welcome")}
                        </Text>
                        <Text className="text-sm font-poppins text-textSecondary dark:text-darkTextSecondary">
                          {translate("onboarding.login.subhead")}
                        </Text>
                      </View>
                      {LoginForm}
                    </View>
                  </ScrollView>
                </KeyboardAvoidingView>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View className="flex-1 justify-center pb-40 p-4">
          <KeyboardAvoidingView
            behavior={Platform.OS === "android" ? "padding" : "height"}
            className="flex-1"
          >
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
            >
              <View className="flex-1 gap-y-3 px-2">
                <View className="items-center justify-center">
                  <Image
                    source={require("../../assets/images/puntos-icon.png")}
                    className="w-16 h-16"
                  />
                </View>
                <View className="gap-y-4 w-full items-center">
                  <View className="flex-col items-center justify-center">
                    <Text className="text-lg font-poppins-bold text-textSecondary dark:text-darkTextPrimary text-center">
                      {translate("onboarding.login.welcome")}
                    </Text>
                    <Text className="text-textMuted dark:text-darkTextSecondary font-poppins text-center text-sm">
                      {translate("onboarding.login.subhead")}
                    </Text>
                  </View>
                </View>
                {LoginForm}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      )}
    </SafeAreaView>
  );
}
