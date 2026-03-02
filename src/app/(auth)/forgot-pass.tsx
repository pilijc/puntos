import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "@/tw";
import React, { useState } from "react";
import { Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { resetPasswordService } from "@/services/auth-service";
import { useAuthStore } from "@/store/auth-store";

export default function ForgotPassword() {
  const { email, setEmail, reset } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Email required", "Please enter the email you used to sign up.");
      return;
    }

    setLoading(true);
    try {
      await resetPasswordService(email.trim());
      Alert.alert(
        "Check your email",
        "If an account exists with that email, we've sent a password reset link."
      );
      reset();
      router.replace("/login");
    } catch (error: any) {
      const message =
        error?.msg ??
        (typeof error?.message === "string" ? error.message : "Something went wrong");
      Alert.alert("Reset failed", message);
    } finally {
      reset();
      setLoading(false);
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
          <View className="flex-1 justify-center gap-y-6 p-2">
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
                  Forgot password
                </Text>
                <Text className="text-neutral-600 font-poppins text-center">
                  Enter your email address and we&apos;ll send you a link to reset your
                  password.
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
                  autoCapitalize="none"
                  className="border border-neutral-300 rounded-xl px-4 py-4 font-poppins"
                  onChangeText={setEmail}
                  value={email}
                />
              </View>
            </View>

            <TouchableOpacity
              className="bg-primary py-4 rounded-xl items-center"
              onPress={handleResetPassword}
              disabled={loading}
            >
              <Text className="text-white text-base font-poppins-semibold">
                {loading ? <ActivityIndicator size="small" color="white" /> : "Send reset link"}
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center">
              <Text className="font-poppins text-neutral-600">
                Remembered your password?
              </Text>
              <TouchableOpacity onPress={() => router.replace("/login")}>
                <Text className="ml-1 font-poppins-semibold text-primary">
                  Back to login
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
