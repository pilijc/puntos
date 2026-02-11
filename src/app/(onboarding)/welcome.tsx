import React from "react";
import { FadeInDown, FadeInUp } from "react-native-reanimated";

import { AnimatedView, Link, Text, View } from "@/tw";

export default function Welcome() {
  return (
    <View className="flex-1 justify-between bg-amber-50 px-6">
      <AnimatedView
        entering={FadeInDown.duration(500)}
        className="mt-24 items-center"
      >
        <View className="h-20 w-20 items-center justify-center rounded-3xl bg-neutral-900">
          <Text className="text-3xl font-poppins-bold text-white">P</Text>
        </View>

        <Text className="mt-4 text-2xl font-poppins-bold text-neutral-900">
          Puntos
        </Text>

        <Text className="mt-1 text-sm font-poppins text-neutral-500">
          Rewards that move with you
        </Text>
      </AnimatedView>

      <AnimatedView
        entering={FadeInUp.delay(100).duration(600)}
        className="items-center px-4"
      >
        <Text className="text-center text-3xl font-poppins-bold text-neutral-900">
          Welcome
        </Text>

        <Text className="mt-3 text-center text-base font-poppins text-neutral-600">
          Track your rewards, stay on top of points, and redeem with ease.
        </Text>
      </AnimatedView>

      <AnimatedView
        entering={FadeInUp.delay(200).duration(600)}
        className="mb-12"
      >
        <Link href="/(tabs)/home" className="rounded-full bg-primary px-6 py-4">
          <Text className="text-center text-base font-poppins-semibold text-white">
            Continue
          </Text>
        </Link>
      </AnimatedView>
    </View>
  );
}
