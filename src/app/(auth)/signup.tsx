import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable,
} from "@/tw";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Alert } from "react-native";
import { addDoc, collection, setDoc } from "firebase/firestore";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../store/auth-store";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { signUp } from "../services/auth-service";
import { supabase } from "@/supabase/supabase";

export default function SignUp() {
  const {
    username,
    setUsername,
    email,
    password,
    setEmail,
    setPassword,
    showPassword,
    setShowPassword,
    reset
  } = useAuthStore();
  

  const handleSignup = async () => {
    try {
      await supabase.auth.signUp({email, password});
      Alert.alert("hahahaha")

    } catch {
      Alert.alert("huhuhuhuhu")
    }
  }

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
            {/* Header */}
            <View className="mb-10">
              <Text className="text-3xl font-poppins-bold text-neutral-900">
                Create Account ✨
              </Text>
              <Text className="mt-2 text-neutral-600 font-poppins">
                Enter your details to get started.
              </Text>
            </View>

            {/* First Name */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-poppins-medium text-neutral-700">
                Username
              </Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="John"
                className="border border-neutral-300 rounded-xl px-4 py-4 font-poppins"
              />
            </View>

            <View className="mb-4">
              <Text className="mb-2 text-sm font-poppins-medium text-neutral-700">
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="John"
                className="border border-neutral-300 rounded-xl px-4 py-4 font-poppins"
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
                  className="border border-neutral-300 rounded-xl px-4 py-4 pr-12 font-poppins"
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

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleSignup}
              className="bg-primary py-4 rounded-xl items-center"
            >
              <Text className="text-white text-base font-poppins-semibold">
                Sign Up
              </Text>
            </TouchableOpacity>

            {/* Login Redirect */}
            <View className="flex-row justify-center mt-6">
              <Text className="font-poppins text-neutral-600">
                Already have an account?
              </Text>
              <Text className="ml-1 font-poppins-semibold text-primary" onPress={() => router.replace("/login")}>
                Login
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
