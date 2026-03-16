import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Image,
} from "@/tw";
import { router } from "expo-router";
import { ActivityIndicator, Alert } from "react-native";
import { signInWithGoogleLoginService } from "@/services/auth-service";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function OnboardingWelcome() {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  
  const handleLogin = () => {
    router.push("/login");
  };

  const handleSignup = () => {
    router.push("/signup");
  };

  const handleSignInWithGoogle = async () => {
    try {
      setLoadingGoogle(true);
      const data = await signInWithGoogleLoginService();
      router.replace(data.homeRoute ?? "/(user)");
    } catch (error: any) {
      setLoadingGoogle(false);
      const message =
        error?.msg ??
        (typeof error?.message === "string" ? error.message : "Something went wrong");
      Alert.alert("Sign In with Google Failed", message);
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 w-full self-center bg-background items-center justify-center">
        <View className="w-full items-center px-6">
          <Image
            source={require("../../assets/images/puntos-person.png")}
            className="w-36 h-36"
          />
        </View>
        <View className="w-full items-center px-6 mt-4">
          <Text className="text-3xl font-poppins-bold text-neutral-900 text-center">
            Welcome to <Text className="text-primary">Puntos</Text>
          </Text>
          <Text className="mt-2 text-base font-poppins text-neutral-600 text-center">
            Start earning today
          </Text>
        </View>
        <View className="w-full items-center px-6 pt-6">
          <View className="flex-col gap-y-3 w-full items-center">
            <TouchableOpacity
              className="h-14 w-full px-5 rounded-xl bg-primary items-center justify-center"
              activeOpacity={0.9}
              onPress={handleLogin}
            >
              <Text className="text-white text-md font-poppins-medium">
                Log in
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="h-14 w-full px-5 rounded-xl items-center justify-center border border-neutral-300"
              activeOpacity={0.9}
              onPress={handleSignup}
            >
              <Text className="text-neutral-600 text-md font-poppins-medium">
                Sign up
              </Text>
            </TouchableOpacity>
            <View className="flex-row items-center gap-x-4 my-3 w-full justify-center">
              <View className="flex-1 h-px bg-neutral-300" />
              <Text className="text-neutral-500 font-poppins text-sm">
                OR CONTINUE WITH
              </Text>
              <View className="flex-1 h-px bg-neutral-300" />
            </View>
            <TouchableOpacity
              onPress={handleSignInWithGoogle}
              className="h-14 w-full px-5 rounded-xl border border-neutral-300 bg-transparent flex-row items-center justify-center gap-x-3"
              activeOpacity={0.9}
            >
              {loadingGoogle ? (
                <ActivityIndicator size="small" color="gray" />
              ) : (
                <>
                  <Image
                    source={require("../../assets/images/google-icon.png")}
                    className="w-5 h-5"
                  />
                  <Text className="text-neutral-600 text-md font-poppins-medium mt-1">
                    Continue with Google
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View className="px-8 pt-6 w-full items-center">
          <Text className="text-neutral-400 text-sm font-poppins text-center leading-relaxed">
            By continuing, you agree to Puntos&apos;{" "}
            <Text className="underline text-primary">Terms of Service</Text> and{" "}
            <Text className="underline text-primary">Privacy Policy</Text>
          </Text>
					{/* <TouchableOpacity onPress={async () => await AsyncStorage.removeItem("hasSeenOnboarding")}>
						<Text className="text-primary text-sm font-poppins">Testing here</Text>
					</TouchableOpacity> */}
        </View>
      </View>
    </SafeAreaView>
  );
}

