import { supabase } from "@/supabase/supabase";
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
import React from "react";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useAuthStore } from "../../store/auth-store";
import { Feather, Ionicons } from "@expo/vector-icons";
import { getHomeRouteForUserId } from "@/services/access-service";
import { loginService, signInWithGoogleLoginService } from "@/services/auth-service";

export default function Login() {
  const { name, email, password, setEmail, setPassword, showPassword, setShowPassword } = useAuthStore();
 
  const handleLogin = async () => {
    try {
      const user = await loginService(email, password);
      router.replace("/(tabs)");
    } catch (error: any) {
      const message =
        error?.msg ??
        (typeof error?.message === "string" ? error.message : "Something went wrong");
      Alert.alert("Login Failed", message);
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      const user = await signInWithGoogleLoginService();
      router.replace("/(tabs)");
    } catch (error: any) {
      const message =
        error?.msg ??
        (typeof error?.message === "string" ? error.message : "Something went wrong");
      Alert.alert("Sign In with Google Failed", message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-center mb-6 shadow-xs p-4">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={18} color="black" />
        </TouchableOpacity>
        <View className="flex-1 items-center -ml-10">
          <Text className="text-xl font-poppins-bold text-neutral-900">Login</Text>
        </View>
      </View>
      <View className="flex-1 justify-center p-6">
        <KeyboardAvoidingView
          behavior={Platform.OS === "android" ? "padding" : "height"}
          className="bg-blue-50"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1 gap-y-4">
              <View className="items-center justify-center">
                <Image
                  source={require("../../assets/images/puntos-icon.png")}
                  className="w-24 h-24"
                />
              </View>
              <View className="gap-y-4 w-full items-center">
                <View className="flex-col items-center justify-center gap-y-1">
                  <Text className="text-2xl font-poppins-bold text-neutral-900 text-center">
                    Welcome back!
                  </Text>
                  <Text className="text-neutral-600 font-poppins text-center">
                    Sign in to your account to continue.
                  </Text>
                </View>
              </View>

              <View className="gap-y-2 w-full items-center">
                <View className="w-full">
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

                <View className="w-full">
                  <View className="flex-row items-center justify-between">
                    <Text className="mb-2 text-sm font-poppins-medium text-textSecondary">
                      Password
                    </Text>
                    <TouchableOpacity
                      className="items-center"
                      onPress={() => router.push("/forgot-pass")}
                    >
                      <Text className="text-primary text-sm font-poppins">
                        Forgot password?
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View className="relative">
                    <View className="flex-row items-center">
                      <TextInput
                        placeholderTextColor="#404040"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        className="flex-1 border border-neutral-200 rounded-xl px-4 py-4 font-poppins text-black"
                        autoFocus
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        className="ml-[-32px] p-2"
                        activeOpacity={0.7}
                      >
                        <Feather
                          name={showPassword ? "eye" : "eye-off"}
                          size={18}
                          color="gray"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              <TouchableOpacity className="bg-primary py-4 rounded-xl items-center w-full max-w-md" onPress={handleLogin}>
                <Text className="text-white text-base font-poppins-semibold">
                  Login
                </Text>
              </TouchableOpacity>

              <View className="flex-row items-center gap-x-4 w-full max-w-md">
                <View className="flex-1 h-px bg-neutral-200" />
                <Text className="text-neutral-500 font-poppins text-sm text-center">
                  OR CONTINUE WITH
                </Text>
                <View className="flex-1 h-px bg-neutral-200" />
              </View>
              
              <TouchableOpacity
                onPress={handleSignInWithGoogle}
                className="rounded-xl p-4 border border-neutral-200 flex-row items-center justify-center gap-x-3 w-full max-w-md"
              >
                <Image
                  source={require("../../assets/images/google-icon.png")}
                  className="w-5 h-5"
                />
                <Text className="font-poppins-medium text-neutral-700">
                  Continue with Google
                </Text>
              </TouchableOpacity>

              <View className="flex-row justify-center items-center w-full">
                <Text className="font-poppins text-neutral-600 text-center">
                  Don’t have an account?
                </Text>
                <Text className="ml-1 font-poppins-semibold text-primary text-center" onPress={() => router.replace("/signup")}>
                  Sign up
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}
