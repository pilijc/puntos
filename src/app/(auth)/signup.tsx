import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image
} from "@/tw";
import React, { useState } from "react";
import { KeyboardAvoidingView, Alert, ActivityIndicator, Platform } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../store/auth-store";
import signUpService, { GoogleSignInCancelledError } from "../../services/auth-service";
import { signUpWithGoogleService } from "@/services/auth-service";
import { NameStep, EmailStep, PasswordStep, TermsStep, StepHeader } from "../../components/stepper";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignUp() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
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
  
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: '',
  });

  const validateStep = (): boolean => {
    const newErrors = { ...errors };
    
    if (currentStep === 1) {
      if (!name.trim()) {
        newErrors.name = 'Name is required';
        setErrors(newErrors);
        return false;
      }
      newErrors.name = '';
    }
    
    if (currentStep === 2) {
      if (!email.trim()) {
        newErrors.email = 'Email is required';
        setErrors(newErrors);
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = 'Please enter a valid email';
        setErrors(newErrors);
        return false;
      }
      newErrors.email = '';
    }
    
    if (currentStep === 3) {
      if (!password) {
        newErrors.password = 'Password is required';
        setErrors(newErrors);
        return false;
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
        setErrors(newErrors);
        return false;
      }
      if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
        setErrors(newErrors);
        return false;
      }
      newErrors.password = '';
      newErrors.confirmPassword = '';
    }
    
    if (currentStep === 4) {
      if (!acceptedTerms) {
        newErrors.terms = 'You must accept the terms';
        setErrors(newErrors);
        return false;
      }
      newErrors.terms = '';
    }
    
    setErrors(newErrors);
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
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
    try {
      setLoading(true);
      const data = await signUpService(email, password, name);
      reset();
      setAcceptedTerms(false);
      setCurrentStep(1);
  
      Alert.alert("Success", "Account created!");
      router.replace(data.homeRoute ?? "/(user)");
    } catch (error: any) {
      setErrors((prev) => ({
        ...prev,
        password: error?.message ?? "Signup failed",
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSignupWithGoogle = async () => {
    try {
      setLoadingGoogle(true);
      const data = await signUpWithGoogleService();
      if (!data) {  return; }

      Alert.alert("Success", "Account created!");
      router.replace(data.homeRoute ?? "/(user)");
    } catch (error: any) {
      setLoadingGoogle(false);
      reset();
      const message =
        error?.msg ??
        (typeof error?.message === "string" ? error.message : "Something went wrong");
      Alert.alert("Google Sign-Up Failed", message);
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-centershadow-xs p-4">
        <TouchableOpacity
          onPress={
            currentStep === 1
              ? () => router.replace("/(onboarding)/welcome")
              : handleBack
          }
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={18} color="black" />
        </TouchableOpacity>
        <View className="flex-1 items-center -ml-10">
          <Text className="text-xl font-poppins-bold text-neutral-900">
            Sign Up
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
                  className="bg-primary py-4 rounded-xl items-center"
                >
                  <Text className="text-white text-base font-poppins-semibold">
                    {currentStep === totalSteps ? "Create Account" : "Continue"}
                  </Text>
                </TouchableOpacity>

                {currentStep === 1 && (
                  <>
                    <View className="flex-row items-center gap-x-4">
                      <View className="flex-1 h-px bg-neutral-200" />
                      <Text className="text-neutral-500 font-poppins text-sm">
                        OR CONTINUE WITH
                      </Text>
                      <View className="flex-1 h-px bg-neutral-200" />
                    </View>

                    <TouchableOpacity
                      onPress={handleSignupWithGoogle}
                      className="bg-background rounded-xl p-4 border border-neutral-200 flex-row items-center justify-center gap-x-3"
                    >
                      <Image
                        source={require("../../assets/images/google-icon.png")}
                        className="w-5 h-5"
                      />
                      <Text className="font-poppins-medium text-neutral-700">
                        Continue with Google
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                <View className="flex-row justify-center">
                  <Text className="font-poppins text-neutral-600">
                    Already have an account?
                  </Text>
                  <TouchableOpacity onPress={() => router.replace("/login")}>
                    <Text className="ml-1 font-poppins-semibold text-primary">
                      Login
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