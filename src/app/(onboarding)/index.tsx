import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Image } from "@/tw";
import { SlideProps } from "@/type/auth";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useWindowDimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

const slides = [
  {
    titleKey: "onboarding.slide.title1",
    subtitleKey:
      "onboarding.slide.subtitle1",
    image: require("../../assets/images/1.png"),
  },
  {
    titleKey: "onboarding.slide.title2",
    subtitleKey:
      "onboarding.slide.subtitle2",
    image: require("../../assets/images/2.png"),
  },
  {
    titleKey: "onboarding.slide.title3",
    subtitleKey:
      "onboarding.slide.subtitle3",
    image: require("../../assets/images/3.png"),
  },
];

function Slide({ title, subtitle, width, image }: SlideProps) {
  return (
    <View style={{ width }} className="flex-1 justify-center items-center">
      <Image
        source={image}
        className="w-full h-96"
        resizeMode="contain"
      />
      <View className="gap-y-2 px-4">
        <Text className="text-center text-2xl font-poppins-bold text-textPrimary mt-4">
          {title}
        </Text>
        <Text className="text-center text-base font-poppins text-md text-neutral-600">
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
  const { t: translate } = useTranslation();

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
              title={translate(slide.titleKey)}
              subtitle={translate(slide.subtitleKey)}
              image={slide.image}
              width={slideWidth}
            />
          ))}
        </ScrollView>

        <View className="flex-row justify-center items-center gap-x-2">
          {slides.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full ${index === currentIndex ? "w-4 bg-primary" : "w-2 bg-neutral-300"
                }`}
            />
          ))}
        </View>
      </View>

      <View className="min-h-32 pb-2 justify-center">
        {currentIndex === slides.length - 1 && (
          <View>
            <TouchableOpacity
              onPress={async () => {
                await AsyncStorage.setItem("hasSeenOnboarding", "true");
                router.replace("/(onboarding)/welcome");
              }}
              className="bg-primary py-4 rounded-xl items-center"
            >
              <Text className="text-white text-base font-poppins-semibold">
                {translate("onboarding.slide.button")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}