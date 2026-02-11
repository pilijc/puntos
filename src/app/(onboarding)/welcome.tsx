import { View, Image, Text, TouchableOpacity, SafeAreaView } from "@/tw";
import { useRouter } from "expo-router";

export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background p-4">
      <View className="flex-1 justify-center items-center">
        <Image
          source={require("../assets/images/puntos-icon.png")}
          className="w-28 h-28"
        />

        <Text className="mt-6 text-3xl font-poppins-bold text-neutral-900">
          Welcome to Puntos
        </Text>

        <Text className="mt-3 text-center text-base font-poppins text-neutral-600">
          Earn rewards effortlessly.  
          Track your points, discover offers,
          and redeem anytime.
        </Text>
      </View>

      <View className="">
        <TouchableOpacity
          onPress={() => router.push("/login")}
          className="bg-primary py-4 rounded-xl items-center"
        >
          <Text className="text-white text-base font-poppins-semibold" onPress={() => router.push("/(auth)/login")}>
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
