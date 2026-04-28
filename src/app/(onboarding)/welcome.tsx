import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
} from "@/tw";
import { router } from "expo-router";
import { Alert, Platform, useWindowDimensions } from "react-native";
import { signInWithGoogleLoginService } from "@/services/auth-service";
import { useTranslation, Trans } from "react-i18next";
import TranslateButton from "@/components/ui/translate-button";
import { Button } from "@/components/button";
import { Modal, type ModalButton } from "@/components/modal";

export default function OnboardingWelcome() {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const { t: translate } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideWeb = isWeb && windowWidth >= 900;
  const appName = "Puntos";
  const [modal, setModal] = useState<{
    title: string;
    message: string;
    buttons: ModalButton[];
  } | null>(null);
  
  const handleLogin = () => {
    router.push("/login");
  };

  const handleSignup = () => {
    router.push("/signup");
  };

  const handleSignInWithGoogle = async () => {
    try {
      setLoadingGoogle(true);
      const data = await signInWithGoogleLoginService();
      router.replace(data.homeRoute ?? "/(user)");
    } catch (error: any) {
      if (error.name === "AccountBlockedError") {
        const { useAuthStore } = require("@/store/auth-store");
        useAuthStore.getState().setRestricted(true);
        return;
      }
      setLoadingGoogle(false);
      const message =
        error?.msg ??
        (typeof error?.message === "string" ? error.message : "Something went wrong");
      Alert.alert("Sign In with Google Failed", message);
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <SafeAreaView className={isWeb ? "flex-1 bg-slate-50 dark:bg-darkBackground" : "flex-1 bg-white dark:bg-darkBackground"}>
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
      />
      <View className="absolute top-14 right-6 z-10">
        <TranslateButton />
      </View>
      {isWeb ? (
        <View className="flex-1 items-center justify-center p-4">
          <View className="w-full max-w-4xl border border-slate-100 dark:border-neutral-700 rounded-xl bg-white dark:bg-darkBackground overflow-hidden">
            <View style={{ flexDirection: isWideWeb ? "row" : "column" }} className="w-full">
              <View className={isWideWeb ? "w-1/2 border-r border-slate-100 dark:border-neutral-700" : "border-b border-slate-100 dark:border-neutral-700"}>
                <Image
                  source={require("../../assets/images/welcome-web.png")}
                  className="w-full h-full min-h-[220px]"
                  resizeMode="contain"
                />
              </View>
              <View className={isWideWeb ? "w-1/2 p-8" : "p-6"}>
                <View className="w-full gap-y-2">
                  <View className="items-center">
                    <Image
                      source={require("../../assets/images/puntos-person.png")}
                      className="w-20 h-20"
                    />
                  </View>
                  <View className="w-full items-center">
                    <Text className="text-lg font-poppins-bold text-textSecondary dark:text-darkTextPrimary text-left">
                      <Trans
                        i18nKey="onboarding.welcome"
                        values={{ appName }}
                        components={{
                          brand: <Text className="text-primary" />
                        }}
                      />
                    </Text>
                    <Text className="text-sm font-poppins text-textMuted dark:text-darkTextSecondary text-left">
                      {translate("onboarding.subhead")}
                    </Text>
                  </View>

                  <View className="flex-col gap-y-3 w-full items-center mt-4">
                    <Button
                      label={translate("onboarding.login.button")}
                      onPress={handleLogin}
                      variant="primary"
                      fullWidth={true}
                      authButton={true}
                    />
                    <Button
                      label={"Sign up as Store Manager"}
                      onPress={handleSignup}
                      variant="secondary"
                      fullWidth={true}
                      authButton={true}
                    />
                    <View className="flex-row items-center gap-x-4 my-1 w-full justify-center">
                      <View className="flex-1 h-px bg-neutral-300 dark:bg-darkBorder" />
                      <Text className="text-neutral-500 dark:text-darkTextMuted font-poppins text-sm">
                        {translate("onboarding.signup.divider")}
                      </Text>
                      <View className="flex-1 h-px bg-neutral-300 dark:bg-darkBorder" />
                    </View>
                    <Button
                      label={translate("onboarding.signup.google")}
                      onPress={handleSignInWithGoogle}
                      variant="secondary"
                      fullWidth={true}
                      authButton={true}
                      leftImage={require("../../assets/images/google-icon.png")}
                      leftImageSize={14}
                      loading={loadingGoogle}
                    />
                  </View>

                  <View className="pt-2 w-full items-center">
                    <Text className="text-neutral-400 dark:text-darkTextMuted text-sm font-poppins text-center leading-relaxed">
                      <Trans
                        i18nKey="label.termsAgreement"
                        components={{
                          legal: (
                            <Text
                              className="text-primary font-poppins-semibold"
                              onPress={() =>
                                setModal({
                                  title: "Terms of Service",
                                  message:
                                    "By continuing, you agree to our Terms of Service and Privacy Policy.\n\nTerms of Service includes: account eligibility, acceptable use (no abuse/fraud), security responsibilities, and service changes/availability.\n\nPrivacy Policy includes: what data we collect, how we use it, when we share it, how we protect it, how long we keep it, and your privacy choices/rights.\n\nThese policies may change over time.",
                                  buttons: [
                                    {
                                      label: "OK",
                                      variant: "primary",
                                      onPress: () => setModal(null),
                                    },
                                  ],
                                })
                              }
                            />
                          ),
                        }}
                      />
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center p-4">
          <View className="w-full max-w-md rounded-xl bg-white dark:bg-darkBackground overflow-hidden">
            <View className="p-6 items-center">
              <Image
                source={require("../../assets/images/puntos-person.png")}
                className="w-36 h-36"
              />

              <View className="w-full items-center mt-4">
                <Text className="text-3xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary text-center">
                  <Trans
                    i18nKey="onboarding.welcome"
                    values={{ appName }}
                    components={{
                      brand: <Text className="text-primary" />
                    }}
                  />
                </Text>
                <Text className="mt-2 text-base font-poppins text-neutral-600 dark:text-darkTextSecondary text-center">
                  {translate("onboarding.subhead")}
                </Text>
              </View>

              <View className="w-full pt-6">
                <View className="flex-col gap-y-3 w-full items-center">
                  <Button
                    label={translate("onboarding.login.button")}
                    onPress={handleLogin}
                    variant="primary"
                    fullWidth={true}
                    authButton={true}
                  />
                  <Button
                    label={translate("onboarding.signup.button")}
                    onPress={handleSignup}
                    variant="secondary"
                    fullWidth={true}
                    authButton={true}
                  />
                  <View className="flex-row items-center gap-x-4 my-1 w-full justify-center">
                    <View className="flex-1 h-px bg-neutral-300 dark:bg-darkBorder" />
                    <Text className="text-neutral-500 dark:text-darkTextMuted font-poppins text-sm">
                      {translate("onboarding.signup.divider")}
                    </Text>
                    <View className="flex-1 h-px bg-neutral-300 dark:bg-darkBorder" />
                  </View>
                  <Button
                    label={translate("onboarding.signup.google")}
                    onPress={handleSignInWithGoogle}
                    variant="secondary"
                    fullWidth={true}
                    authButton={true}
                    leftImage={require("../../assets/images/google-icon.png")}
                    leftImageSize={14}
                    loading={loadingGoogle}
                  />
                </View>
              </View>

              <View className="pt-6 w-full items-center">
                <Text className="text-neutral-400 dark:text-darkTextMuted text-sm font-poppins text-center leading-relaxed">
                  <Trans
                    i18nKey="label.termsAgreement"
                    components={{
                      legal: (
                        <Text
                          className="text-primary font-poppins-semibold"
                          onPress={() =>
                            setModal({
                              title: "Terms of Service",
                              message:
                                "By continuing, you agree to our Terms of Service and Privacy Policy.\n\nTerms of Service includes: account eligibility, acceptable use (no abuse/fraud), security responsibilities, and service changes/availability.\n\nPrivacy Policy includes: what data we collect, how we use it, when we share it, how we protect it, how long we keep it, and your privacy choices/rights.\n\nThese policies may change over time.",
                              buttons: [
                                {
                                  label: "OK",
                                  variant: "primary",
                                  onPress: () => setModal(null),
                                },
                              ],
                            })
                          }
                        />
                      ),
                    }}
                  />
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

