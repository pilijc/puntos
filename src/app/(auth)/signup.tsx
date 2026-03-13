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
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignUp() {
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
         newErrors.name = 'Name is required';
        setErrors(newErrors);
        return false;
      }
      // Allow names with letters, spaces, hyphens, and apostrophes
      if (!/^[a-zA-Z\s\-']+$/.test(name.trim())) {
         newErrors.name = 'Name can only contain letters, spaces, hyphens, and apostrophes';
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
        newErrors.email = 'Email is required';
        setErrors(newErrors);
        return false;
      }
      
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        console.log("Email validation failed: invalid format");
        newErrors.email = 'Please enter a valid email';
        setErrors(newErrors);
        return false;
      }
      
      // Use isEmailTaken function that queries users table
      console.log("Checking if email is taken:", trimmedEmail);
      const emailTaken = await isEmailTaken(trimmedEmail);
      console.log("Email taken check result:", emailTaken);
      
      if(emailTaken) {
        console.log("Email validation failed: already exists");
        newErrors.email = 'Email is already registered. Please login instead.';
        setErrors(newErrors);
        return false;
      }
      
      console.log("Email validation passed");
      newErrors.email = '';
    }
    
    if (currentStep === 3) {
       if (!password) {
         newErrors.password = 'Password is required';
        setErrors(newErrors);
        return false;
      }
      if (!confirmPassword) {
         newErrors.confirmPassword = 'Please confirm your password';
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
        console.log("Terms validation failed: not accepted");
        newErrors.terms = 'You must accept the terms';
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
  
      Alert.alert("Success", "Account created!");
      console.log("About to redirect to:", data.homeRoute ?? "/(user)");
      router.replace(data.homeRoute ?? "/(user)");
    } catch (error: any) {
      // Handle specific error messages
       if (error?.message?.includes("already registered") || 
          error?.message?.includes("User already registered") ||
          error?.message?.includes("user_already_registered")) {
        setErrors((prev) => ({
          ...prev,
          email: "Email is already registered. Please login instead.",
        }));
        Alert.alert("Signup Failed", "Email is already registered. Please login instead.", [
          {
            text: "Try Different Email",
            onPress: () => setCurrentStep(2) 
          },
          {
            text: "Go to Login",
            onPress: () => router.replace("/(auth)/login")
          }
        ]);
      } else {
        setErrors((prev) => ({
          ...prev,
          password: error?.message ?? "Signup failed",
        }));
        Alert.alert("Signup Failed", error?.message ?? "Signup failed. Please try again.");
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
  
      Alert.alert("Success", "Store Manager account created!");
      console.log("About to redirect to:", data.homeRoute ?? "/(store_manager)");
      router.replace(data.homeRoute ?? "/(store_manager)");
    } catch (error: any) {
      if (error?.message?.includes("already registered") || 
          error?.message?.includes("User already registered") ||
          error?.message?.includes("user_already_registered")) {
        setErrors((prev) => ({
          ...prev,
          email: "Email is already registered. Please login instead.",
        }));
        Alert.alert("Store Manager Signup Failed", "Email is already registered. Please login instead.", [
          {
            text: "Try Different Email",
            onPress: () => setCurrentStep(2) 
          },
          {
            text: "Go to Login",
            onPress: () => router.replace("/(auth)/login")
          }
        ]);
      } else {
        setErrors((prev) => ({
          ...prev,
          password: error?.message ?? "Store manager signup failed",
        }));
        Alert.alert("Store Manager Signup Failed", error?.message ?? "Store manager signup failed. Please try again.");
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
            {role === 'manager' ? "Sign Up as Store Manager" : "Sign Up"}
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
                    {loading ? "Creating Account..." : (currentStep === totalSteps ? "Create Account" : "Continue")}
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

                    <View className="flex-row justify-center mt-2">
                        <Text className="font-poppins text-neutral-600">
                          Sign up as Store Owner?
                        </Text>

                        <TouchableOpacity
                          onPress={() => {
                            console.log("Store Owner button clicked, setting role to manager");
                            setRole("manager");
                          }}
                          className="flex-row items-center ml-1"
                        >
                          <Text
                            className={`font-poppins-semibold ${
                              role === "manager" ? "text-green-600" : "text-primary"
                            }`}
                          >
                            Sign up
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