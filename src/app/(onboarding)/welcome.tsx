import { View, Image, Text, TouchableOpacity, SafeAreaView } from "@/tw";
import { useRouter } from "expo-router";
import React from "react";

export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background p-4">
      <View className="flex-1 justify-center items-center">
        <View className="w-full h-96 gradient-to-b from-primary to-primary/50 object-contain bg-primary absolute top-20 left-0 rounded-3xl opacity-10" />
        <Image
          source={require("../../assets/images/welcome-icon.png")}
          className="w-full h-88 object-contain"
        />

        <View className="gap-y-2">
          <Text className="text-center text-2xl font-poppins-bold text-textPrimary mt-4">
            Earn rewards effortlessly.
          </Text>

          <Text className="text-center text-base font-poppins text-sm text-neutral-600">
            Track your points, discover offers,
            and redeem anytime.
          </Text>
        </View>
      </View>

      <View>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/signup")}
          className="bg-primary py-4 rounded-xl items-center"
        >
          <Text className="text-white text-base font-poppins-semibold">
            Get Started
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/login")}
          className="mt-4 items-center"
        >
          <Text className="text-neutral-500 font-poppins">
            I already have an account
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
