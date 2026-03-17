import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image
} from "@/tw";
import React, { useState, useRef } from "react";
import { KeyboardAvoidingView, Alert, ActivityIndicator, Platform } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../store/auth-store";
import signUpService, { GoogleSignInCancelledError } from "../../services/auth-service";
import { signUpWithGoogleService, isEmailTaken } from "@/services/auth-service";
import { NameStep, EmailStep, PasswordStep, TermsStep, RoleStep, StepHeader } from "../../components/stepper";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation, Trans } from "react-i18next";

export default function SignUp() {
  const { t: translate } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const isSigningUp = useRef(false);
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
  } = useAuthStore();

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [role, setRole] = useState('user');

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
      // Allow names with letters, spaces, hyphens, and apostrophes
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

      // Use isEmailTaken function that queries users table
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
      if (password.length < 8) {
        newErrors.password = translate("onboarding.signup.error.passwordLimit");
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

  const handleNext = async () => {
    const isValid = await validateStep();
    console.log("Validation result:", isValid);
    if (!isValid) return;

    if (currentStep < totalSteps) {
      console.log("Moving to step:", currentStep + 1);
      setCurrentStep(currentStep + 1);
    } else {
      console.log("Final step reached, calling signup");
      console.log("Current role value:", role);
      if (role === 'manager') {
        console.log("Calling handleStoreManagerSignup");
        handleStoreManagerSignup();
      } else {
        console.log("Calling handleSignup for regular user");
        handleSignup();
      }
    }

  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSignup = async () => {
    if (isSigningUp.current) {
      console.log("Signup already in progress (ref check), ignoring call");
      return;
    }

    isSigningUp.current = true;

    try {
      setLoading(true);
      console.log("Starting signup with role:", role);
      const data = await signUpService(email, password, name, role);
      console.log("Signup service completed successfully, data:", data);
      reset();
      setAcceptedTerms(false);
      setRole('user');
      setCurrentStep(1);

      Alert.alert(translate("onboarding.login.welcome"), translate("onboarding.signup.success"));
      console.log("About to redirect to:", data.homeRoute ?? "/(user)");
      router.replace(data.homeRoute ?? "/(user)");
    } catch (error: any) {
      // Handle specific error messages
      if (error?.message?.includes("already registered") ||
        error?.message?.includes("User already registered") ||
        error?.message?.includes("user_already_registered")) {
        setErrors((prev) => ({
          ...prev,
          email: translate("onboarding.signup.error.emailRegistered"),
        }));
        Alert.alert(translate("onboarding.signup.error.failed"), translate("onboarding.signup.error.emailRegistered"), [
          {
            text: translate("onboarding.signup.error.tryDifferentEmail"),
            onPress: () => setCurrentStep(2)
          },
          {
            text: translate("onboarding.signup.error.goToLogin"),
            onPress: () => router.replace("/(auth)/login")
          }
        ]);
      } else {
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
    // Prevent multiple simultaneous calls using ref for immediate check
    if (isSigningUp.current) {
      console.log("Store Manager signup already in progress (ref check), ignoring call");
      return;
    }

    isSigningUp.current = true;

    try {
      setLoading(true);
      console.log("Starting store manager signup with role:", role);
      const data = await signUpService(email, password, name, role);
      console.log("Store manager signup service completed successfully, data:", data);
      reset();
      setAcceptedTerms(false);
      setRole('user');
      setCurrentStep(1);

      Alert.alert(translate("onboarding.login.welcome"), translate("onboarding.signup.successManager"));
      console.log("About to redirect to:", data.homeRoute ?? "/(store_manager)");
      router.replace(data.homeRoute ?? "/(store_manager)");
    } catch (error: any) {
      if (error?.message?.includes("already registered") ||
        error?.message?.includes("User already registered") ||
        error?.message?.includes("user_already_registered")) {
        setErrors((prev) => ({
          ...prev,
          email: translate("onboarding.signup.error.emailRegistered"),
        }));
        Alert.alert(translate("onboarding.signup.error.failedManager"), translate("onboarding.signup.error.emailRegistered"), [
          {
            text: translate("onboarding.signup.error.tryDifferentEmail"),
            onPress: () => setCurrentStep(2)
          },
          {
            text: translate("onboarding.signup.error.goToLogin"),
            onPress: () => router.replace("/(auth)/login")
          }
        ]);
      } else {
        setErrors((prev) => ({
          ...prev,
          password: error?.message ?? translate("onboarding.signup.error.failedManager"),
        }));
        Alert.alert(translate("onboarding.signup.error.failedManager"), error?.message ?? translate("onboarding.signup.error.failedManager"));
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

      Alert.alert(translate("onboarding.login.welcome"), translate("onboarding.signup.success"));
      router.replace(data.homeRoute ?? "/(user)");
    } catch (error: any) {
      setLoadingGoogle(false);
      reset();
      const message =
        error?.msg ??
        (typeof error?.message === "string" ? error.message : "Something went wrong");
      Alert.alert(translate("onboarding.signup.error.googleFailed"), message);
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-darkBackground">
      <View className="flex-row items-center justify-center shadow-xs p-4 bg-background dark:bg-darkBackground">
        <TouchableOpacity
          onPress={
            currentStep === 1
              ? () => router.replace("/(onboarding)/welcome")
              : handleBack
          }
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={18} color="#9ca3af" />
        </TouchableOpacity>
        <View className="flex-1 items-center -ml-10">
          <Text className="text-xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">
            {role === 'manager' ? translate("onboarding.signup.titleManager") : translate("onboarding.signup.title")}
          </Text>
        </View>
      </View>

      <View className="flex-1 justify-start p-6">
        <KeyboardAvoidingView
          behavior={Platform.OS === "android" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1 gap-y-6">
              <View className="w-full">
                <StepHeader currentStep={currentStep} />

                {currentStep === 1 && (
                  <NameStep
                    value={name}
                    onChange={setName}
                    error={errors.name}
                  />
                )}
                {currentStep === 2 && (
                  <EmailStep
                    value={email}
                    onChange={setEmail}
                    error={errors.email}
                  />
                )}
                {currentStep === 3 && (
                  <PasswordStep
                    password={password}
                    confirmPassword={confirmPassword}
                    showPassword={showPassword}
                    showConfirmPassword={showConfirmPassword}
                    onPasswordChange={setPassword}
                    onConfirmPasswordChange={setConfirmPassword}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                    onToggleConfirmPassword={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
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
              </View>

              <View className="mt-2 gap-y-4 w-full">
                <TouchableOpacity
                  onPress={handleNext}
                  disabled={loading}
                  className={`bg-primary py-4 rounded-xl items-center ${loading ? 'opacity-50' : ''}`}
                >
                  <Text className="text-white text-base font-poppins-semibold">
                    {loading ? translate("onboarding.signup.creating") : (currentStep === totalSteps ? translate("onboarding.signup.button") : translate("onboarding.signup.continue"))}
                  </Text>
                </TouchableOpacity>

                {currentStep === 1 && (
                  <>
                    <View className="flex-row items-center gap-x-4">
                      <View className="flex-1 h-px bg-neutral-200 dark:bg-darkBorder" />
                      <Text className="text-neutral-500 dark:text-darkTextMuted font-poppins text-sm">
                        {translate("onboarding.signup.divider")}
                      </Text>
                      <View className="flex-1 h-px bg-neutral-200 dark:bg-darkBorder" />
                    </View>

                    <TouchableOpacity
                      onPress={handleSignupWithGoogle}
                      className="bg-transparent rounded-xl p-4 border border-neutral-200 dark:border-darkBorder flex-row items-center justify-center gap-x-3"
                    >
                      <Image
                        source={require("../../assets/images/google-icon.png")}
                        className="w-5 h-5"
                      />
                      <Text className="font-poppins-medium text-neutral-700 dark:text-darkTextSecondary">
                        {translate("onboarding.signup.google")}
                      </Text>
                    </TouchableOpacity>

                    <View className="flex-row justify-center mt-2">
                      <Text className="font-poppins text-neutral-600 dark:text-darkTextSecondary">
                        {translate("onboarding.signup.ownerPrompt")}
                      </Text>

                      <TouchableOpacity
                        onPress={() => {
                          console.log("Store Owner button clicked, setting role to manager");
                          setRole("manager");
                        }}
                        className="flex-row items-center ml-1"
                      >
                        <Text
                          className={`font-poppins-semibold ${role === "manager" ? "text-green-600" : "text-primary"
                            }`}
                        >
                          {translate("onboarding.signup.button")}
                        </Text>

                        {role === "manager" && (
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color="#22C55E"
                            style={{ marginLeft: 4 }}
                          />
                        )}
                      </TouchableOpacity>
                    </View>

                  </>
                )}

                <View className="flex-row justify-center">
                  <Text className="font-poppins text-neutral-600 dark:text-darkTextSecondary">
                    {translate("onboarding.signup.alreadyHaveAccount")}
                  </Text>
                  <TouchableOpacity onPress={() => router.replace("/login")}>
                    <Text className="ml-1 font-poppins-semibold text-primary">
                      {translate("onboarding.signup.login")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}