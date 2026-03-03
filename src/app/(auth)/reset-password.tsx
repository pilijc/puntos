import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "@/tw";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/supabase/supabase";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      Alert.alert("Missing fields", "Please enter and confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match", "Please make sure both passwords match.");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Weak password", "Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        throw error;
      }

      Alert.alert("Password updated", "Your password has been reset. Please log in again.");
      router.replace("/login");
    } catch (error: any) {
      const message =
        error?.msg ??
        (typeof error?.message === "string" ? error.message : "Something went wrong");
      Alert.alert("Reset failed", message);
    } finally {
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
            <View className="gap-y-2">
              <Text className="text-2xl font-poppins-bold text-neutral-900 text-center">
                Reset password
              </Text>
              <Text className="text-neutral-600 font-poppins text-center">
                Choose a new password for your account.
              </Text>
            </View>

            <View className="gap-y-4">
              <View>
                <Text className="mb-2 text-sm font-poppins-medium text-neutral-700">
                  New password
                </Text>
                <TextInput
                  placeholder="Enter new password"
                  placeholderTextColor="#404040"
                  secureTextEntry
                  autoCapitalize="none"
                  className="border border-neutral-300 rounded-xl px-4 py-4 font-poppins"
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <View>
                <Text className="mb-2 text-sm font-poppins-medium text-neutral-700">
                  Confirm new password
                </Text>
                <TextInput
                  placeholder="Re-enter new password"
                  placeholderTextColor="#404040"
                  secureTextEntry
                  autoCapitalize="none"
                  className="border border-neutral-300 rounded-xl px-4 py-4 font-poppins"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              className="bg-primary py-4 rounded-xl items-center"
              onPress={handleReset}
              disabled={loading}
            >
              <Text className="text-white text-base font-poppins-semibold">
                {loading ? "Saving..." : "Update password"}
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center">
              <TouchableOpacity onPress={() => router.replace("/login")}>
                <Text className="font-poppins text-primary">Back to login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}