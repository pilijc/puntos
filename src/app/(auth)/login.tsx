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

export default function Login() {
  const { name, email, password, setEmail, setPassword, showPassword, setShowPassword } = useAuthStore();

  const handleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        Alert.alert("Login error", error.message);
        return;
      }

      if (data.session) {
        router.replace("/(tabs)");
      }
    } catch (error) {
      Alert.alert("Login error", error.message);
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
      <View className="p-2 flex-1 justify-center">
        <View className="mb-10">
          <Text className="text-2xl font-poppins-bold text-neutral-900">
            Welcome Back
          </Text>
          <Text className="mt-2 text-neutral-600 font-poppins">
            Sign in to continue earning rewards.
          </Text>
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-poppins-medium text-neutral-700">
            Email
          </Text>
          <TextInput
            placeholder="you@email.com"
            keyboardType="email-address"
            className="border border-neutral-300 rounded-xl px-4 py-4 font-poppins"
            onChangeText={setEmail}
            value={email}
          />
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-poppins-medium text-neutral-700">
            Password
          </Text>
          <View className="relative">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              className="border border-neutral-200 rounded-xl px-4 py-4 pr-12 font-poppins"
              autoFocus
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4"
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={22}
                  color="#737373"
                />
            </Pressable>
          </View>
        </View>

        <TouchableOpacity className="bg-primary py-4 rounded-xl items-center" onPress={handleLogin}>
          <Text className="text-white text-base font-poppins-semibold">
            Login
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="mt-4 items-center">
          <Text className="text-primary font-poppins-medium">
            Forgot password?
          </Text>
        </TouchableOpacity>

        <View className="my-8 flex-row items-center">
          <View className="flex-1 h-px bg-neutral-200" />
          <Text className="mx-3 text-neutral-500 font-poppins">OR</Text>
          <View className="flex-1 h-px bg-neutral-200" />
        </View>

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
