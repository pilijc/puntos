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
import { KeyboardAvoidingView, Platform } from "react-native";

export default function Login() {
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
      <View className="p-6 flex-1 justify-center">
        <View className="mb-10">
          <Text className="text-3xl font-poppins-bold text-neutral-900">
            Welcome Back 👋
          </Text>
          <Text className="mt-2 text-neutral-600 font-poppins">
            Sign in to continue earning rewards.
          </Text>
        </View>

        {/* Email Input */}
        <View className="mb-4">
          <Text className="mb-2 text-sm font-poppins-medium text-neutral-700">
            Email
          </Text>
          <TextInput
            placeholder="you@email.com"
            keyboardType="email-address"
            className="border border-neutral-300 rounded-xl px-4 py-4 font-poppins"
          />
        </View>

        {/* Password Input */}
        <View className="mb-6">
          <Text className="mb-2 text-sm font-poppins-medium text-neutral-700">
            Password
          </Text>
          <TextInput
            secureTextEntry
            className="border border-neutral-300 rounded-xl px-4 py-4 font-poppins"
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity className="bg-primary py-4 rounded-xl items-center">
          <Text className="text-white text-base font-poppins-semibold">
            Login
          </Text>
        </TouchableOpacity>

        {/* Forgot Password */}
        <TouchableOpacity className="mt-4 items-center">
          <Text className="text-primary font-poppins-medium">
            Forgot password?
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View className="my-8 flex-row items-center">
          <View className="flex-1 h-px bg-neutral-200" />
          <Text className="mx-3 text-neutral-500 font-poppins">OR</Text>
          <View className="flex-1 h-px bg-neutral-200" />
        </View>

        {/* Sign Up */}
        <View className="flex-row justify-center">
          <Text className="font-poppins text-neutral-600">
            Don’t have an account?
          </Text>
          <Text className="ml-1 font-poppins-semibold text-primary">
            Sign up
          </Text>
        </View>
      </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
