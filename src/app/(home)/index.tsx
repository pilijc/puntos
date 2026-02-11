import React from "react";

import { Text, View } from "@/tw";

export default function Home() {
  return (
    <View className="flex-1">
      <View className="py-12 md:py-24 lg:py-32 xl:py-48">
        <View className="px-4 md:px-6">
          <View className="flex flex-col items-center gap-4 text-center">
            <Text
              role="heading"
              className="text-3xl text-center native:text-5xl font-bold sm:text-4xl md:text-5xl lg:text-6xl font-rounded text-red-500"
            >
              Welcome to Project ACME
            </Text>
            <Text className="font-semibold x-auto max-w-[700px] text-lg text-center text-orange-500 md:text-xl dark:text-orange-400">
              Discover and collaborate on acme. Explore our services now.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
