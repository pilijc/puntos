import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable, Image
} from "@/tw";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/auth-store";
import signUpService from "../../services/auth-service";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

export default function SignUp() {
  const {
    name,
    setName,
    email,
    password,
    setEmail,
    setPassword,
    showPassword,
    setShowPassword,
    confirmPassword,
    setConfirmPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    reset,
  } = useAuthStore();
  
  const handleSignup = async () => {
    try {
      if (password !== confirmPassword) {
        Alert.alert("Passwords do not match");
        return;
      }
      await signUpService(email, password, name);
      Alert.alert("Sign up Successful", "You have successfully signed up.");
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Signup failed", error.message);
    } finally {
      reset();
      router.replace("/(tabs)");
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
          <View className="p-6 flex-1 justify-center gap-y-6">

            <View className="flex justify-center items-center">
              <Text className="text-3xl font-poppins-bold text-neutral-900">
                Create an account
              </Text>
              <Text className="text-neutral-600 font-poppins">
                Enter your details to get started.
              </Text>
            </View>

            <View className="gap-y-4">
              <View>
                <Text className="mb-2 text-sm font-poppins-medium text-neutral-700">
                  Name
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="John"
                  className="border border-neutral-200 rounded-xl px-4 py-4 font-poppins"
                />
              </View>

              <View>
                <Text className="mb-2 text-sm font-poppins-medium text-neutral-700">
                  Email Address
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="John"
                  className="border border-neutral-200 rounded-xl px-4 py-4 font-poppins"
                />
              </View>

              <View>
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

              <View>
                <Text className="mb-2 text-sm font-poppins-medium text-neutral-700">
                  Confirm Password
                </Text>
                <View className="relative">
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm your password"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    className="border border-neutral-200 rounded-xl px-4 py-4 pr-12 font-poppins"
                  />

                  <Pressable
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-4"
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={22}
                      color="#737373"
                    />
                  </Pressable>
                </View>
              </View>
              
            </View>

            <TouchableOpacity
              onPress={handleSignup}
              className="bg-primary py-4 rounded-xl items-center"
            >
              <Text className="text-white text-base font-poppins-semibold">
                Sign Up
              </Text>
            </TouchableOpacity>

            <View className="flex items-center justify-center">
              <Text className="font-poppins text-center text-neutral-600">
                By continuing, you agree to our <Text className="font-poppins-semibold text-primary">Terms of Service</Text> and <Text className="font-poppins-semibold text-primary">Privacy Policy</Text>.
              </Text>
            </View>

            <View className="flex-row items-center justify-center gap-x-4">
              <View className="bg-white rounded-lg p-2 border border-neutral-200">
                <Image source={require("../../assets/images/google-icon.png")} className="w-8 h-8" />
              </View>
              <View className="bg-white rounded-lg p-2 border border-neutral-200">
                <Image source={require("../../assets/images/apple-icon.png")} className="w-8 h-8" />
              </View>
            </View>

            <View className="flex-row justify-center">
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
