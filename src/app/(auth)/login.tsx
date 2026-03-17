import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
} from "@/tw";
import { router } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useAuthStore } from "../../store/auth-store";
import { Feather, Ionicons } from "@expo/vector-icons";
import { loginService, signInWithGoogleLoginService } from "@/services/auth-service";
import { useTranslation, Trans } from "react-i18next";
import OnboardingLayout from "../(onboarding)/_layout";
import { Modal, type ModalButton } from "@/components/modal";
import { supabase } from "@/supabase/supabase";



export default function Login() {
  const { name, email, password, setEmail, setPassword, showPassword, setShowPassword } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const { t: translate } = useTranslation();
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
  const [modal, setModal] = useState<{
    title: string;
    message: string;
    buttons: ModalButton[];
  } | null>(null);

  const handleLogin = async () => {
    const nextErrors = { ...errors };

    const trimmedEmail = email.trim();
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
    setErrors({ email: "", password: "" });

    try {
      setLoading(true);
      const data = await loginService(trimmedEmail, password);
      console.log("login component", data);
      if (!data.success) {
        //  Alert.alert("Login Failed", data.message);
        setModal({
          title: "You are not assigned to a store",
          message: data.message,
          buttons: [
            {
              label: "OK",
              variant: "secondary",
              onPress: async () => {
                await supabase.auth.signOut();
                setModal(null);

              }
            },
          ],
        });
        return;
      }
      router.replace(data.homeRoute);
    } catch (error: any) {
      console.log("error login component", error);
      let message = error?.msg ?? error?.message;

      if (message === "Invalid login credentials") {
        message = translate("onboarding.login.error.invalidLogin");
      } else if (!message) {
        message = translate("onboarding.login.error.invalidLogin");
      }

      setErrors({ email: "", password: message });
    } finally {
      setLoading(false);
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      setLoadingGoogle(true);
      const data = await signInWithGoogleLoginService();
      console.log("data", data);
      router.replace(data.homeRoute ?? "/(user)");
    } catch (error: any) {
      const message = error?.message ?? "Something went wrong";
      setErrors({ email: "", password: message });
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-darkBackground">
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
      />
      <View className="flex-row items-center justify-center shadow-xs p-4 bg">
        <TouchableOpacity
          onPress={() => router.replace("/welcome")}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={18} color="#9ca3af" />
        </TouchableOpacity>
        <View className="flex-1 items-center -ml-10">
          <Text className="text-xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">{translate("onboarding.login.button")}</Text>
        </View>
      </View>
      <View className="flex-1 justify-start p-4">
        <KeyboardAvoidingView
          behavior={Platform.OS === "android" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1 gap-y-4 px-2">
              <View className="items-center justify-center">
                <Image
                  source={require("../../assets/images/puntos-icon.png")}
                  className="w-16 h-16"
                />
              </View>
              <View className="gap-y-4 w-full items-center">
                <View className="flex-col items-center justify-center gap-y-1">
                  <Text className="text-2xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary text-center">
                    {translate("onboarding.login.welcome")}
                  </Text>
                  <Text className="text-neutral-600 dark:text-darkTextSecondary font-poppins text-center">
                    {translate("onboarding.login.subhead")}
                  </Text>
                </View>
              </View>

              <View className="gap-y-2 w-full items-center">
                <View className="w-full">
                  <Text className="mb-2 text-sm font-poppins-medium text-neutral-700 dark:text-darkTextSecondary">
                    {translate("onboarding.login.label.email")}
                  </Text>
                  <TextInput
                    placeholder={translate("onboarding.login.input.email")}
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    className="border border-neutral-300 dark:border-darkBorder bg-neutral-50 dark:bg-darkBackgroundMuted rounded-xl px-4 py-4 font-poppins text-neutral-900 dark:text-darkTextPrimary"
                    onChangeText={setEmail}
                    value={email}
                    autoFocus
                  />
                </View>

                <View className="w-full">
                  <View className="flex-row items-center justify-between">
                    <Text className="mb-2 text-sm font-poppins-medium text-neutral-700 dark:text-darkTextSecondary">
                      {translate("onboarding.login.label.password")}
                    </Text>
                    <TouchableOpacity
                      className="items-center"
                      onPress={() => router.push("/forgot-pass")}
                    >
                      <Text className="text-primary text-sm font-poppins">
                        {translate("onboarding.login.forgotPassword")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View className="relative">
                    <View className="flex-row items-center">
                      <TextInput
                        placeholderTextColor="#9ca3af"
                        value={password}
                        onChangeText={setPassword}
                        placeholder={translate("onboarding.login.input.password")}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        className="flex-1 border border-neutral-300 dark:border-darkBorder bg-neutral-50 dark:bg-darkBackgroundMuted rounded-xl px-4 py-4 font-poppins text-neutral-900 dark:text-darkTextPrimary"
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        className="ml-[-32px] p-2"
                        activeOpacity={0.7}
                      >
                        <Feather
                          name={showPassword ? "eye" : "eye-off"}
                          size={18}
                          color="#9ca3af"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                </View>
                {(errors.password || errors.email) ? (
                  <Text className="mt-2 text-sm font-poppins text-red-500 dark:text-red-400 text-center bg-red-50 dark:bg-red-900/20 rounded-xl p-4 w-full border border-red-100 dark:border-red-900/30">
                    {errors.password || errors.email}
                  </Text>
                ) : null}
              </View>

              <TouchableOpacity className="bg-primary py-4 rounded-xl items-center w-full max-w-md" onPress={handleLogin}>
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Text className="text-white text-base font-poppins-semibold">
                      {translate("onboarding.login.button")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View className="flex-row items-center gap-x-4 w-full max-w-md">
                <View className="flex-1 h-px bg-neutral-200 dark:bg-darkBorder" />
                <Text className="text-neutral-500 dark:text-darkTextMuted font-poppins text-sm text-center">
                  {translate("onboarding.signup.divider")}
                </Text>
                <View className="flex-1 h-px bg-neutral-200 dark:bg-darkBorder" />
              </View>

              <TouchableOpacity
                onPress={handleSignInWithGoogle}
                className="rounded-xl p-4 border border-neutral-200 dark:border-darkBorder bg-transparent flex-row items-center justify-center gap-x-3 w-full max-w-md"
              >
                {loadingGoogle ? (
                  <ActivityIndicator size="small" color="#9ca3af" />
                ) : (
                  <>
                    <Image
                      source={require("../../assets/images/google-icon.png")}
                      className="w-5 h-5"
                    />
                    <Text className="font-poppins-medium text-neutral-700 dark:text-darkTextSecondary">
                      {translate("onboarding.signup.google")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View className="flex-row justify-center items-center w-full">
                <Text className="font-poppins text-neutral-600 dark:text-darkTextSecondary text-center">
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
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}
