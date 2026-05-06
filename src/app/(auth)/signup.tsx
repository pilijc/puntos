import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image
} from "@/tw";
import React, { useState, useRef, useMemo } from "react";
import { KeyboardAvoidingView, Alert, ActivityIndicator, Platform, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../store/auth-store";
import signUpService, { GoogleSignInCancelledError } from "../../services/auth-service";
import { signUpWithGoogleService, isEmailTaken } from "@/services/auth-service";
import { NameStep, EmailStep, PasswordStep, TermsStep, RoleStep, StepHeader } from "../../components/stepper";
import { useTranslation } from "react-i18next";
import TranslateButton from "@/components/ui/translate-button";
import { AppHeader } from "@/components/header";
import { Button } from "@/components/button";
import { Modal, type ModalButton } from "@/components/modal";
import { usePasswordValidation } from "@/hooks/use-password-validation";

export default function SignUp() {
  const { t: translate } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideWeb = isWeb && windowWidth >= 900;
  const [currentStep, setCurrentStep] = useState(() => (isWeb ? 1 : 0));
  const totalSteps = 4;
  const [loading, setLoading] = useState(false);
  const isSigningUp = useRef(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [role, setRole] = useState(() => (isWeb ? "manager" : "user"));
  const {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    confirmPassword,
    setConfirmPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    reset,
    resetAuthForm,
  } = useAuthStore();
  const [modal, setModal] = useState<{
    title: string;
    message: string;
    buttons: ModalButton[];
  } | null>(null);
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    terms: '',
  });

  const validateStep = async (): Promise<boolean> => {
    const newErrors = { ...errors };

    if (currentStep === 1) {
      console.log("Validating name:", name);
      if (!name.trim()) {
        newErrors.name = translate("onboarding.signup.error.nameRequired");
        setErrors(newErrors);
        return false;
      }
      if (!/^[a-zA-Z\s\-']+$/.test(name.trim())) {
        newErrors.name = translate("onboarding.signup.error.nameInvalid");
        setErrors(newErrors);
        return false;
      }
      console.log("Name validation passed");
      newErrors.name = '';
    }

    if (currentStep === 2) {
      console.log("Validating email step, email:", email);
      const trimmedEmail = email.trim();
      console.log("Testing email format:", trimmedEmail, "against regex");

      if (!trimmedEmail) {
        console.log("Email validation failed: empty");
        newErrors.email = translate("onboarding.signup.error.emailRequired");
        setErrors(newErrors);
        return false;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        console.log("Email validation failed: invalid format");
        newErrors.email = translate("onboarding.signup.error.emailInvalid");
        setErrors(newErrors);
        return false;
      }

      console.log("Checking if email is taken:", trimmedEmail);
      const emailTaken = await isEmailTaken(trimmedEmail);
      console.log("Email taken check result:", emailTaken);

      if (emailTaken) {
        console.log("Email validation failed: already exists");
        newErrors.email = translate("onboarding.signup.error.emailRegistered");
        setErrors(newErrors);
        return false;
      }

      console.log("Email validation passed");
      newErrors.email = '';
    }

    if (currentStep === 3) {
      if (!password) {
        newErrors.password = translate("onboarding.signup.error.passwordRequired");
        setErrors(newErrors);
        return false;
      }

      const isPasswordStrong =
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[@#$%^&+=!]/.test(password);

      if (!isPasswordStrong) {
        newErrors.password = translate("onboarding.signup.error.passwordLimit");
        setErrors(newErrors);
        return false;
      }

      if (!confirmPassword) {
        newErrors.confirmPassword = translate("onboarding.signup.error.passwordConfirm");
        setErrors(newErrors);
        return false;
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = translate("onboarding.signup.error.passwordMatch");
        setErrors(newErrors);
        return false;
      }
      newErrors.password = '';
      newErrors.confirmPassword = '';
    }

    if (currentStep === 4) {
      if (!acceptedTerms) {
        console.log("Terms validation failed: not accepted");
        newErrors.terms = translate("onboarding.signup.error.termsRequired");
        setErrors(newErrors);
        return false;
      }
      newErrors.terms = '';
    }

    setErrors(newErrors);
    return true;
  };

  const { allMet: isPasswordStrong } = usePasswordValidation(password);

  const handleNext = async () => {
    if (currentStep === 0) {
      setCurrentStep(1);
      return;
    }

    const isValid = await validateStep();
    if (!isValid) return;

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      if (role === 'manager') {
        handleStoreManagerSignup();
      } else {
        handleSignup();
      }
    }
  };

  const handleBack = () => {
    if (isWeb && currentStep <= 1) {
      router.replace("/(onboarding)/welcome");
      return;
    }
    if (currentStep === 0) {
      router.replace("/(onboarding)/welcome");
      return;
    }
    setCurrentStep(currentStep - 1);
  };

  const handleSignup = async () => {
    if (isSigningUp.current) {
      console.log("Signup already in progress (ref check), ignoring call");
      return;
    }

    isSigningUp.current = true;

    try {
      setLoading(true);
      const data = await signUpService(email, password, name, role);
      setAcceptedTerms(false);
      setRole('user');
      setCurrentStep(1);

      setModal({
        title: translate("onboarding.login.welcome"),
        message: translate("onboarding.signup.success"),
        buttons: [
          { label: "OK", variant: "primary", onPress: () => router.replace(data.homeRoute ?? "/(user)") },
        ],
      });
      resetAuthForm();
      router.replace(data.homeRoute ?? "/(user)");
    } catch (error: any) {
      if (error?.message?.includes("already registered") ||
        error?.message?.includes("User already registered") ||
        error?.message?.includes("user_already_registered")) {
        setErrors((prev) => ({
          ...prev,
          email: translate("onboarding.signup.error.emailRegistered"),
        }));
        setModal({
          title: translate("onboarding.signup.error.failed"),
          message: translate("onboarding.signup.error.emailRegistered"),
          buttons: [
            { label: "OK", variant: "primary", onPress: () => setCurrentStep(2) },
            { label: "Try Different Email", variant: "secondary", onPress: () => setCurrentStep(2) },
            { label: "Go to Login", variant: "secondary", onPress: () => router.replace("/(auth)/login") },
          ],
        });
      } else {
        if (error.name === "AccountBlockedError") {
        const { useAuthStore } = require("@/store/auth-store");
        useAuthStore.getState().setRestricted(true);
        return;
      }
      setErrors((prev) => ({
        ...prev,
        password: error?.message ?? translate("onboarding.signup.error.failed"),
      }));
      Alert.alert(translate("onboarding.signup.error.failed"), error?.message ?? translate("onboarding.signup.error.failed"));
      }
      setLoading(false);
      isSigningUp.current = false;
      console.log("Loading set to false after error");
    } finally {

      console.log("Signup process completed");
    }
  };

  const handleStoreManagerSignup = async () => {
    if (isSigningUp.current) {
      return;
    }

    isSigningUp.current = true;

    try {
      setLoading(true);
      const data = await signUpService(email, password, name, role);
      reset();
      setAcceptedTerms(false);
      setRole('user');
      setCurrentStep(1);

      setModal({
        title: translate("onboarding.login.welcome"),
        message: translate("onboarding.signup.successManager"),
        buttons: [
          { label: "OK", variant: "primary", onPress: () => router.replace(data.homeRoute ?? "/(store_manager)") },
        ],
      });
      router.replace(data.homeRoute ?? "/(store_manager)");
    } catch (error: any) {
      if (error?.message?.includes("already registered") ||
        error?.message?.includes("User already registered") ||
        error?.message?.includes("user_already_registered")) {
        setErrors((prev) => ({
          ...prev,
          email: translate("onboarding.signup.error.emailRegistered"),
        }));
        setModal({
          title: translate("onboarding.signup.error.failedManager"),
          message: translate("onboarding.signup.error.emailRegistered"),
          buttons: [
            { label: "OK", variant: "primary", onPress: () => setCurrentStep(2) },
            { label: "Try Different Email", variant: "secondary", onPress: () => setCurrentStep(2) },
            { label: "Go to Login", variant: "secondary", onPress: () => router.replace("/(auth)/login") },
          ],
        });
      } else {
        if (error.name === "AccountBlockedError") {
        const { useAuthStore } = require("@/store/auth-store");
        useAuthStore.getState().setRestricted(true);
        return;
      }
      setErrors((prev) => ({
        ...prev,
        password: error?.message ?? translate("onboarding.signup.error.failedManager"),
      }));
      setModal({
        title: translate("onboarding.signup.error.failedManager"),
        message: error?.message ?? translate("onboarding.signup.error.failedManager"),
        buttons: [
          { label: "OK", variant: "primary", onPress: () => setCurrentStep(2) },
        ],
      });
      }
      setLoading(false);
      isSigningUp.current = false;
      console.log("Store manager loading set to false after error");
    } finally {
      console.log("Store manager signup process completed");
    }
  };

  const handleSignupWithGoogle = async () => {
    try {
      setLoadingGoogle(true);
      const data = await signUpWithGoogleService();
      if (!data) { return; }

      setModal({
        title: translate("onboarding.login.welcome"),
        message: translate("onboarding.signup.success"),
        buttons: [
          { label: "OK", variant: "primary", onPress: () => router.replace(data.homeRoute ?? "/(user)") },
        ],
      });
      router.replace(data.homeRoute ?? "/(user)");
    } catch (error: any) {
      if (error.name === "AccountBlockedError") {
        const { useAuthStore } = require("@/store/auth-store");
        useAuthStore.getState().setRestricted(true);
        return;
      }
      setLoadingGoogle(false);
      reset();
      const message = error?.msg ?? error?.message ?? translate("label.somethingWentWrong");
      setModal({
        title: translate("onboarding.signup.error.googleFailed"),
        message,
        buttons: [
          { label: "OK", variant: "primary", onPress: () => router.replace("/(auth)/login") },
        ],
      });
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
      <AppHeader
        title={""}
        onBackPress={handleBack}
        rightIcon={<TranslateButton />}
      />
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
                <KeyboardAvoidingView
                  behavior={Platform.OS === "android" ? "padding" : "height"}
                  className="w-full"
                >
                  <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                  >
                    <View className="w-full gap-y-4">
                      <View>
                        {currentStep === 0 ? (
                          <RoleStep value={role} onChange={setRole} error={errors.role} />
                        ) : (
                          <>
                            <StepHeader currentStep={currentStep} />
                            {currentStep === 1 && (
                              <NameStep value={name} onChange={setName} error={errors.name} />
                            )}
                            {currentStep === 2 && (
                              <EmailStep value={email} onChange={setEmail} error={errors.email} />
                            )}
                            {currentStep === 3 && (
                              <PasswordStep
                                password={password}
                                confirmPassword={confirmPassword}
                                showPassword={showPassword}
                                setShowPassword={setShowPassword}
                                setShowConfirmPassword={setShowConfirmPassword}
                                showConfirmPassword={showConfirmPassword}
                                onPasswordChange={setPassword}
                                onConfirmPasswordChange={setConfirmPassword}
                                onTogglePassword={() => setShowPassword(!showPassword)}
                                onToggleConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)}
                                errors={errors}
                              />
                            )}
                            {currentStep === 4 && (
                              <TermsStep
                                accepted={acceptedTerms}
                                onToggle={() => setAcceptedTerms(!acceptedTerms)}
                                error={errors.terms}
                              />
                            )}
                          </>
                        )}
                      </View>

                      <View className="gap-y-2 w-full">
                        <Button
                          label={loading ? translate("onboarding.signup.creating") : (currentStep === totalSteps ? translate("onboarding.signup.button") : translate("onboarding.signup.continue"))}
                          onPress={handleNext}
                          disabled={loading || (currentStep === 3 && (!isPasswordStrong || !confirmPassword)) || (currentStep === 4 && !acceptedTerms)}
                          loading={loading}
                          fullWidth={true}
                          authButton={true}
                        />

                        {currentStep > 1 ? (
                          <Button
                            label={translate("onboarding.signup.back")}
                            onPress={handleBack}
                            variant="secondary"
                            fullWidth={true}
                            authButton={true}
                          />
                        ) : null}
                        
                        {currentStep <= 1 && (
                          <>
                            <View className="flex-row items-center gap-x-4">
                              <View className="flex-1 h-px bg-neutral-200 dark:bg-darkBorder" />
                              <Text className="text-neutral-500 dark:text-darkTextMuted font-poppins text-sm">
                                {translate("onboarding.signup.divider")}
                              </Text>
                              <View className="flex-1 h-px bg-neutral-200 dark:bg-darkBorder" />
                            </View>

                            <Button
                              label={translate("onboarding.signup.google")}
                              onPress={handleSignupWithGoogle}
                              loading={loadingGoogle}
                              disabled={loadingGoogle}
                              variant="secondary"
                              fullWidth={true}
                              authButton={true}
                              leftImage={require("../../assets/images/google-icon.png")}
                              leftImageSize={18}
                            />
                          </>
                        )}

                        <View className="flex-row justify-center">
                          <Text className="font-poppins text-neutral-600 dark:text-darkTextSecondary text-sm">
                            {translate("onboarding.signup.alreadyHaveAccount")}
                          </Text>
                          <TouchableOpacity onPress={() => router.replace("/login")}>
                            <Text className="ml-1 font-poppins-semibold text-primary text-sm">
                              {translate("onboarding.signup.login")}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
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
              <View className="flex-1 gap-y-4">
                <View>
                  {currentStep === 0 ? (
                    <RoleStep value={role} onChange={setRole} error={errors.role} />
                  ) : (
                    <>
                      <StepHeader currentStep={currentStep} />
                      {currentStep === 1 && (
                        <NameStep value={name} onChange={setName} error={errors.name} />
                      )}
                      {currentStep === 2 && (
                        <EmailStep value={email} onChange={setEmail} error={errors.email} />
                      )}
                      {currentStep === 3 && (
                        <PasswordStep
                          password={password}
                          confirmPassword={confirmPassword}
                          showPassword={showPassword}
                          setShowPassword={setShowPassword}
                          setShowConfirmPassword={setShowConfirmPassword}
                          showConfirmPassword={showConfirmPassword}
                          onPasswordChange={setPassword}
                          onConfirmPasswordChange={setConfirmPassword}
                          onTogglePassword={() => setShowPassword(!showPassword)}
                          onToggleConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)}
                          errors={errors}
                        />
                      )}
                      {currentStep === 4 && (
                        <TermsStep
                          accepted={acceptedTerms}
                          onToggle={() => setAcceptedTerms(!acceptedTerms)}
                          error={errors.terms}
                        />
                      )}
                    </>
                  )}
                </View>

                <View className="gap-y-4 w-full">
                  <Button
                    label={loading ? translate("onboarding.signup.creating") : (currentStep === totalSteps ? translate("onboarding.signup.button") : translate("onboarding.signup.continue"))}
                    onPress={handleNext}
                    disabled={loading || (currentStep === 3 && (!isPasswordStrong || !confirmPassword)) || (currentStep === 4 && !acceptedTerms)}
                    loading={loading}
                    fullWidth={true}
                    authButton={true}
                  />
                  
                  {currentStep <= 1 && (
                    <>
                      <View className="flex-row items-center gap-x-4">
                        <View className="flex-1 h-px bg-neutral-200 dark:bg-darkBorder" />
                        <Text className="text-neutral-500 dark:text-darkTextMuted font-poppins text-sm">
                          {translate("onboarding.signup.divider")}
                        </Text>
                        <View className="flex-1 h-px bg-neutral-200 dark:bg-darkBorder" />
                      </View>

                      <Button
                        label={translate("onboarding.signup.google")}
                        onPress={handleSignupWithGoogle}
                        loading={loadingGoogle}
                        disabled={loadingGoogle}
                        variant="secondary"
                        fullWidth={true}
                        authButton={true}
                        leftImage={require("../../assets/images/google-icon.png")}
                        leftImageSize={18}
                      />
                    </>
                  )}

                  <View className="flex-row justify-center">
                    <Text className="font-poppins text-neutral-600 dark:text-darkTextSecondary text-sm">
                      {translate("onboarding.signup.alreadyHaveAccount")}
                    </Text>
                    <TouchableOpacity onPress={() => router.replace("/login")}>
                      <Text className="ml-1 font-poppins-semibold text-primary text-sm">
                        {translate("onboarding.signup.login")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      )}
    </SafeAreaView>
  );
}