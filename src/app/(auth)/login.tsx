import { supabase } from "@/supabase/supabase";
import {
  View,
  Text,
  SafeAreaView,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "@/tw";
import { router } from "expo-router";
import React, { useState, useTransition } from "react";
import { Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useAuthStore } from "../../store/auth-store";
import { Feather, Ionicons } from "@expo/vector-icons";
import { getHomeRouteForUserId } from "@/services/access-service";
import { loginService, signInWithGoogleLoginService } from "@/services/auth-service";

export default function Login() {
  const { name, email, password, setEmail, setPassword, showPassword, setShowPassword } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
 
  const handleLogin = async () => {
    const nextErrors = { ...errors };
  
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      nextErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      nextErrors.email = "Please enter a valid email address.";
    }
    if (!password) {
      nextErrors.password = "Password is required.";
    }
    if (nextErrors.email || nextErrors.password) {
      setErrors(nextErrors);
      return;
    }
    setErrors({ email: "", password: "" });
  
    try {
      setLoading(true);
      const data = await loginService(trimmedEmail, password);
      router.replace(data.homeRoute ?? "/(user)");
      setLoading(false);
    } catch (error: any) {
      const message = error?.message ?? "Something went wrong";
      setErrors({ ...errors, password: message });
    } finally {
      setLoading(false);
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      setLoadingGoogle(true);
      const data = await signInWithGoogleLoginService();
      router.replace(data.homeRoute ?? "/(user)");
      setLoadingGoogle(false);
    } catch (error: any) {
      const message = error?.message ?? "Something went wrong";
      setErrors({ ...errors, password: message });
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-4">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="p-2 flex-1 justify-center gap-y-4">
            <View className="gap-y-4">
              <View className="items-center justify-center">
                <View className="w-16 h-16 rounded-full items-center justify-center">
                  <Image
                    source={require("../../assets/images/puntos-icon.png")}
                    className="w-16 h-16"
                  />
                </View>
              </View>

              <View className="flex-col items-center justify-center gap-y-1">
                <Text className="text-2xl font-poppins-bold text-neutral-900">
                  Log In
                </Text>
                <Text className=" text-neutral-600 font-poppins">
                  Sign in to continue earning rewards.
                </Text>
              </View>
            </View>

            <View className="gap-y-4">
              <View>
                <Text className="mb-2 text-sm font-poppins-medium text-neutral-700">
                  Email
                </Text>
                <TextInput
                  placeholder="email@domain.com"
                  placeholderTextColor="#404040"
                  keyboardType="email-address"
                  className="border border-neutral-300 rounded-xl px-4 py-4 font-poppins"
                  onChangeText={setEmail}
                  value={email}
                />
              </View>

              <View>
                <View className="flex-row items-center justify-between">
                  <Text className="mb-2 text-sm font-poppins-medium text-textSecondary">
                    Password
                  </Text>
                  <TouchableOpacity className="items-center">
                    <Text className="text-primary text-sm font-poppins">
                      Forgot password?
                    </Text>
                  </TouchableOpacity>
                </View>
                <View>
                  <View className="flex-row items-center">
                    <TextInput
                      placeholderTextColor="#404040"
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      className="flex-1 border border-neutral-200 rounded-xl px-4 py-4 font-poppins text-black"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      className="ml-[-40px] p-2"
                      activeOpacity={0.7}
                    >
                      <Feather
                        name={showPassword ? "eye" : "eye-off"}
                        size={22}
                        color="gray"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <View className="h-auto">
                {(errors.password || errors.email) && (
                  <Text className="text-red-500 text-sm font-poppins rounded-xl p-4 text-center bg-red-50">
                    {errors.password || errors.email}
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity className="bg-primary py-4 rounded-xl items-center" onPress={handleLogin}>
              <Text className="text-white text-base font-poppins-semibold">
                {loading ? <ActivityIndicator size="small" color="white" /> : "Login"}
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center gap-x-4">
              <View className="flex-1 h-px bg-neutral-200" />
              <Text className="text-neutral-500 font-poppins text-sm">
                OR CONTINUE WITH
              </Text>
              <View className="flex-1 h-px bg-neutral-200" />
            </View>
            
            <TouchableOpacity
              onPress={handleSignInWithGoogle}
              className="rounded-xl p-4 border border-neutral-200 flex-row items-center justify-center gap-x-3"
            >
              { loadingGoogle ? <ActivityIndicator size="small" color="gray" /> : (
              <>
                <Image
                  source={require("../../assets/images/google-icon.png")}
                  className="w-5 h-5"
                />
                <Text className="font-poppins-medium text-neutral-700">
                  Continue with Google
                </Text>
                </>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center">
              <Text className="font-poppins text-neutral-600">
                Don’t have an account?
              </Text>
              <Text className="ml-1 font-poppins-semibold text-primary" onPress={() => router.replace("/signup")}>
                Sign up
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
