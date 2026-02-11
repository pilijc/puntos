import "../global.css";
import { Slot, Stack } from "expo-router";
import { useFonts } from "expo-font";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { Text, View, Image, Link } from "@/tw";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function Layout() {

  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../app/assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../app/assets/fonts/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("../app/assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Bold": require("../app/assets/fonts/Poppins-Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null; // prevents flashing default font
  }

  return (
    // <View className="flex flex-1 bg-white">
    //   <Header />
    //   <Slot />
    //   <Footer />
    // </View>

    <Stack screenOptions={{ headerShown: false }} />

  );
}

function Header() {
  const { top } = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: top }}>
      <View className="px-4 lg:px-6 h-14 flex items-center flex-row">
        <Image
          source="https://simpleicons.org/icons/expo.svg"
          className="w-6 h-6 object-contain mr-2"
        />
        <Link className="font-bold flex-1 items-center justify-center" href="/">
          ACME
        </Link>
        <View className="flex flex-row gap-4 sm:gap-6">
          <Link
            className="text-md font-medium hover:underline web:underline-offset-4"
            href="/"
          >
            About
          </Link>
          <Text>HAhAH</Text>
          <Link
            className="text-md font-medium hover:underline web:underline-offset-4"
            href="/"
          >
            Product
          </Link>
          <Link
            className="text-md font-medium hover:underline web:underline-offset-4"
            href="/"
          >
            Pricingx``
          </Link>
        </View>
      </View>
    </View>
  );
}

function Footer() {
  const { bottom } = useSafeAreaInsets();
  return (
    <View
      className="flex shrink-0 bg-gray-100 native:hidden"
      style={{ paddingBottom: bottom }}
    >
      <View className="py-6 flex-1 items-start px-4 md:px-6 ">
        <Text className={"text-center text-gray-700"}>
          © {new Date().getFullYear()} Me
        </Text>
      </View>
    </View>
  );
}
