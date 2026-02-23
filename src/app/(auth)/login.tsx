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
import React from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { useAuthStore } from "../../store/auth-store";
import { Ionicons } from "@expo/vector-icons";
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
    <SafeAreaView className="flex-1 bg-background p-4">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
      <View className="p-2 flex-1 justify-center gap-y-6">
        <View className="gap-y-4">
          <View className="items-center justify-center">
            <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center">
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
              placeholder="john@example.com"
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
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  className="flex-1 border border-neutral-200 rounded-xl px-4 py-4 font-poppins"
                  autoFocus
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="ml-[-40px] p-2"
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={22}
                    color="#737373"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
        

        <TouchableOpacity className="bg-primary py-4 rounded-xl items-center" onPress={handleLogin}>
          <Text className="text-white text-base font-poppins-semibold">
            Login
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
