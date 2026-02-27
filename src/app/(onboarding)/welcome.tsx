import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from "@/tw";
import { SlideProps } from "@/type/auth";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useWindowDimensions } from "react-native";
import LottieView from "lottie-react-native";

const slides = [
  {
    title: "Get rewarded for every step.",
    subtitle: "Start walking and let every step bring you closer to exciting rewards and nearby stores.",
    image: require("../../assets/gif/walking.json"),
  },
  {
    title: "Redeem points for perks.",
    subtitle: "Exchange your collected points for exclusive offers and treat yourself anytime.",
    image: require("../../assets/gif/rewards-1.json"),
  },
];

function Slide({ title, subtitle, width, image }: SlideProps) {
  return (
    <View style={{ width }} className="flex-1 justify-center items-center">
      <LottieView
        source={image}
        autoPlay
        loop
        style={{ width: "100%", height: 384 }}
      />
      <View className="gap-y-2 px-4">
        <Text className="text-center text-2xl font-poppins-bold text-textPrimary mt-4">
          {title}
        </Text>
        <Text className="text-center text-base font-poppins text-sm text-neutral-600">
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

export default function Welcome() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const { width: windowWidth } = useWindowDimensions();
  const slideWidth = windowWidth - 32;

  return (
    <SafeAreaView className="flex-1 bg-background p-4 justify-between" >
      <View className="flex-1" style={{ width: slideWidth }}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const { contentOffset, layoutMeasurement } = e.nativeEvent;
            const index = Math.round(contentOffset.x / layoutMeasurement.width);
            setCurrentIndex(index);
          }}
          style={{ flex: 1 }}
          contentContainerStyle={{ width: slideWidth * slides.length }}
        >
          {slides.map((slide, index) => (
            <Slide
              key={index}
              title={slide.title}
              subtitle={slide.subtitle}
              image={slide.image}
              width={slideWidth}
            />
          ))}
        </ScrollView>

        <View className="flex-row justify-center items-center mt-4 gap-x-2">
          {slides.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full ${
                index === currentIndex ? "w-4 bg-primary" : "w-2 bg-neutral-300"
              }`}
            />
          ))}
        </View>
      </View>

      <View className="min-h-32 pb-2 justify-end">
        {currentIndex === slides.length - 1 && (
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
        )}
      </View>
    </SafeAreaView>
  );
}