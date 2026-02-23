import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image
} from "@/tw";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Alert } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../store/auth-store";
import signUpService from "../../services/auth-service";
import { signInWithGoogleService } from "@/services/auth-service";
import { Stepper, NameStep, EmailStep, PasswordStep, TermsStep, StepHeader } from "../../components/stepper";
import { Ionicons } from "@expo/vector-icons";

export default function SignUp() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
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
      if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
        setErrors(newErrors);
        return false;
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
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
      await signUpService(email, password, name);
      Alert.alert("Success", "Account created!");
      router.replace("/(user)");
    } catch (error: any) {
      Alert.alert("Signup failed", error?.message);
    } finally {
      reset();
      setAcceptedTerms(false);
      setCurrentStep(1);
    }
  };

  const handleSignupWithGoogle = async () => {
    try {
      await signInWithGoogleService();
      Alert.alert("Success", "Account created!");
      router.replace("/(user)");
    } catch (error: any) {
      reset();
      Alert.alert("Google Sign-Up Failed", error?.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="px-6 py-4 flex-row items-center">
          {currentStep > 1 ? (
            <TouchableOpacity onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          ) : (
            <View className="w-6" />
          )}
          <Text className="flex-1 text-center font-poppins-semibold text-lg">
            Create Account
          </Text>
          <View className="w-6" />
        </View>
              
        <Stepper currentStep={currentStep} totalSteps={totalSteps} />
        
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="p-6 flex-1 justify-between">
            <View className="flex-1 justify-center">
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
            </View>
            
            <View className="gap-y-4 mt-6">
              <TouchableOpacity
                onPress={handleNext}
                className="bg-primary py-4 rounded-xl items-center"
              >
                <Text className="text-white text-base font-poppins-semibold">
                  {currentStep === totalSteps ? 'Create Account' : 'Continue'}
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
                    className="bg-white rounded-xl p-4 border border-neutral-200 flex-row items-center justify-center gap-x-3"
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
    </SafeAreaView>
  );
}