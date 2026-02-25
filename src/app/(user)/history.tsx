import React, { useState, useRef } from "react";
import { Animated } from "react-native";
import { FadeInDown, FadeInUp } from "react-native-reanimated";
import {
  AnimatedView,
  SafeAreaView,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
} from "@/tw";

const TABS = ["All", "Earned", "Claimed"];

const HISTORY_DATA = [
  {
    id: 1,
    section: "Today",
    type: "earned",
    title: "The Daily Brew",
    subtitle: "Purchase Points",
    time: "10:24 AM",
    points: "+45",
    positive: true,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB5UrWxqFKu85Q6t5k1XYZX5msC9nEcivRLk_W8Egr5k12jVaYNYvQ1Q5wh_w7lzH0J6q9RJFJv1_rla_RVoS_QYDE5YKHkVRanYFOlk3kIv27V41DeqICTsa-dXdiVRHJTSDtZwL6DpyIkYTzBXGh-MEPn-yUZp34ClrLZSxdDkdCz3UgOMu8ok-Gf0-YR1lIJ1vEe-2Szd54GnwwHxg14sJJ6JT-1cv4y4N74zcpTZMwjzJo6rn4UHn8e1cefHZ6X_Be4qJoyXQ",
  },
  {
    id: 2,
    section: "Today",
    type: "claimed",
    title: "Burger Hub",
    subtitle: "Redeemed Burger",
    time: "08:15 AM",
    points: "-800",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCDzVbbcDnW0KxdXyzYto5A0eD3-MrP-HJyQuJ16GJWpd8LXKUo5Fndi_Ifv3ShnX0mqyNijarrU4eVmtQeqq3pNto-Ho2-d5QqJMvZw8AQSkuKiEO3GlpYlCX_fRKgXKtLei5HXTcAwbBzR8JaocCw_2-YnssPSnELptffzKui7ClKlpMLtqcded1E2fm59P9sYC1Kh4wgNuGcbq9t7QKDBoGy0wABF9xGh2YUQq9qxJM7tpCn8otxtJSxsmGafagpq3TKXKcYHg",
  },
  {
    id: 3,
    section: "Today",
    type: "earned",
    title: "Bella Bakery",
    subtitle: "Purchase Points",
    time: "4:30 PM",
    points: "+32",
    positive: true,
    icon: "🥐",
  },
  {
    id: 4,
    section: "Yesterday",
    type: "earned",
    title: "System Reward",
    subtitle: "7-Day Streak Bonus",
    points: "+150",
    positive: true,
    icon: "🔥",
  },
  {
    id: 5,
    section: "Yesterday",
    type: "claimed",
    title: "Zen Studio",
    subtitle: "Discount Voucher",
    time: "11:45 AM",
    points: "-500",
    icon: "🎟️",
  },
  {
      id: 6,
  section: "October 14",
  type: "earned",
  title: "Iron Gym",
  subtitle: "Location Check-in",
  time: "6:00 AM",
  points: "+10",
  positive: true,
  image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCkbOOvlwTwDNwhkROLzoIwvBgyEScWV8Flwxtl3QlyNWfSuOfeWFjRwsXD-G0_G2HRxeyOg7oK9dfzvtzqfRzDahy1xdLfHj5vqDkbwHfvasndc16rHw3wXCywrQoNY5unEh4cHmFofmUrPv0XH2Pglbt-QLgU-UBRRB6BxxatssPU2fqevQub5yoetDMEoHOJpCuyT9jy0AT7qfAI5GIKkk0ttASL1eL5y9p8msRE6sOrEKMU-G_1E8X-pcms3LLSa4a3wLICQw",
},
{
  id: 7,
  section: "October 14",
  type: "claimed",
  title: "Zen Studio",
  subtitle: "Reward Claimed",
  time: "8:20 PM",
  points: "-300",
  image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWjyL0GY6w2llQQhUrAZYxiS9wzf9Zkww8zwknp6802tWHgFiGobSBFCYQgC7SSJsNkbeZ_NBfE7a8NTlYfUVy_28_afCiqDppV1HJBEKJ03NtqamvYGXLia5m3Yy_7dkIOa4MuDo3Am49S5HSFj4a1N4QphPqVHiQ99eY-kbwtNyTCmrMRAQr11NN6FtrQq7oRt9lAjtgbcPxOCGLZx4jm8-tndrGLx9MHn6yPsn8w4XvoPae2wYDals8hmRBNtE7ZPKqaNZXeQ",
},
{ 
  id: 8,
  section: "October 14",
  type: "earned",
  title: "Bella Bakery",
  subtitle: "Morning Coffee Purchase",
  time: "9:10 AM",
  points: "+18",
  positive: true,
  icon: "☕",
},
{
  id: 9,
  section: "February 21",
  type: "earned",
  title: "Burger Hub",
  subtitle: "Combo Meal Purchase",
  time: "12:45 PM",
  points: "+64",
  positive: true,
  icon: "🍔", 
},
{
  id: 10,
  section: "February 20",
  type: "claimed",
  title: "Bella Bakery",
  subtitle: "Free Pastry Reward",
  time: "3:15 PM",
  points: "-120",
  icon: "🎁", 
},
];

export default function History() {
  const [activeTab, setActiveTab] = useState(0);

  const filteredData =
    activeTab === 0
      ? HISTORY_DATA
      : HISTORY_DATA.filter((item) =>
          activeTab === 1 ? item.type === "earned" : item.type === "claimed"
        );

  const sections = [...new Set(filteredData.map((item) => item.section))];

  const parsePoints = (value) => Number(value || 0);

  const totalEarnedPoints = HISTORY_DATA
    .filter((item) => item.type === "earned")
    .reduce((sum, item) => sum + parsePoints(item.points), 0);

  const formattedTotal =
    totalEarnedPoints > 0
      ? `+${totalEarnedPoints.toLocaleString()}`
      : totalEarnedPoints.toLocaleString();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AnimatedView entering={FadeInDown.duration(500)}>
        <View className="px-6 pt-6 pb-6 bg-primary">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-white text-2xl font-poppins-bold">
                Activity
              </Text>
              <Text className="text-white/70 text-sm font-poppins-regular">
                 Unclaimed Points
              </Text>
            </View>

            <Text className="text-white text-3xl font-poppins-bold">
              {formattedTotal}
            </Text>
          </View>

          <View className="flex-row bg-white/20 mt-5 p-1 rounded-xl">
            {TABS.map((tab, i) => {
              const isActive = activeTab === i;

              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(i)}
                  className={`flex-1 py-2 rounded-lg items-center ${
                    isActive ? "bg-white" : ""
                  }`}
                >
                  <Text
                    className={`text-sm font-poppins-semibold ${
                      isActive ? "text-primary" : "text-white"
                    }`}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </AnimatedView>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 30,
          paddingTop: 10,
        }}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section) => (
          <AnimatedView key={section} entering={FadeInUp.duration(500)}>
            <SectionLabel label={section} />

            <View className="mt-1">
              {filteredData
                .filter((item) => item.section === section)
                .map((item) => (
                  <HistoryItem key={item.id} {...item} />
                ))}
            </View>
          </AnimatedView>
        ))}

        <AnimatedView entering={FadeInUp.delay(200).duration(600)}>
          <View className="items-center pt-6 pb-4">
            <Text className="text-[10px] tracking-[2px] text-neutral-300 font-poppins-medium">
              POWERED BY PUNTOS
            </Text>
          </View>
        </AnimatedView>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ label }) {
  return (
    <View className="mt-6 mb-3">
      <Text className="text-xs font-poppins-semibold text-neutral-400 tracking-widest">
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

function HistoryItem({ title, subtitle, time, points, positive, image, icon }) {
  const isPositive = positive ?? points?.startsWith("+");
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={{ transform: [{ scale: scaleAnim }] }}
        className="bg-white rounded-2xl p-4 mb-3 border border-neutral-100"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 my-3 rounded-xl bg-background items-center justify-center mr-3 overflow-hidden">
              {image ? (
                <Image source={{ uri: image }} className="w-12 h-12" />
              ) : (
                <Text className="text-xl">{icon}</Text>
              )}
            </View>

            <View className="flex-1">
              <Text
                numberOfLines={1}
                className="text-base font-poppins-semibold text-neutral-900"
              >
                {title}
              </Text>

              <Text className="text-xs font-poppins-regular text-neutral-400">
                {subtitle} {time ? `• ${time}` : ""}
              </Text>
            </View>
          </View>

          <View
            className={`px-3 py-1 rounded-full ${
              isPositive ? "bg-emerald-50" : "bg-red-50"
            }`}
          >
            <Text
              className={`text-sm font-poppins-bold ${
                isPositive ? "text-emerald-500" : "text-red-500"
              }`}
            >
              {points}
            </Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}