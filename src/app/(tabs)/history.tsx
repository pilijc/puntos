import React from "react";
import { FadeInDown, FadeInUp } from "react-native-reanimated";
import { AnimatedView, SafeAreaView, Text, View, Image, ScrollView } from "../../tw";

export default function History() {
  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      
      {/* Header */}
      <AnimatedView
        entering={FadeInDown.duration(400)}
        className="px-6 pt-4 pb-3 border-b border-stone-200 dark:border-stone-800"
      >
        <View className="flex-row items-center justify-between mb-5">
          <Text className="text-2xl font-800 text-stone-900 dark:text-stone-100">
            Activity
          </Text>

          <View className="flex-row items-center space-x-1 bg-primary/10 dark:bg-primary/20 px-3 py-1.5 rounded-full">
            <Text className="text-primary font-800 text-sm">⭐</Text>
            <Text className="text-primary font-bold text-sm">
              2,450 pts
            </Text>
          </View>
        </View>

        {/* Segmented Control */}
        <View className="flex-row bg-stone-200/60 dark:bg-stone-800/60 p-1 rounded-xl">
          <View className="flex-1 bg-white dark:bg-stone-700 rounded-lg py-2">
            <Text className="text-center text-xs font-700">All</Text>
          </View>

          <View className="flex-1 rounded-lg py-2">
            <Text className="text-center text-xs font-600 text-stone-500 dark:text-stone-400">
              Earned
            </Text>
          </View>

          <View className="flex-1 rounded-lg py-2">
            <Text className="text-center text-xs font-600 text-stone-500 dark:text-stone-400">
              Claimed
            </Text>
          </View>
        </View>
      </AnimatedView>

      {/* Content */}
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
      >
        {/* TODAY */}
        <AnimatedView entering={FadeInUp.delay(100).duration(500)} className="mt-8">
          <Text className="text-xs font-800 uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-4">
            Today
          </Text>

          <View className="space-y-6">
            <HistoryItem
              title="The Daily Brew"
              subtitle="Purchase Points • 10:24 AM"
              points="+45"
              positive
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuB5UrWxqFKu85Q6t5k1XYZX5msC9nEcivRLk_W8Egr5k12jVaYNYvQ1Q5wh_w7lzH0J6q9RJFJv1_rla_RVoS_QYDE5YKHkVRanYFOlk3kIv27V41DeqICTsa-dXdiVRHJTSDtZwL6DpyIkYTzBXGh-MEPn-yUZp34ClrLZSxdDkdCz3UgOMu8ok-Gf0-YR1lIJ1vEe-2Szd54GnwwHxg14sJJ6JT-1cv4y4N74zcpTZMwjzJo6rn4UHn8e1cefHZ6X_Be4qJoyXQ"
            />

            <HistoryItem
              title="Burger Hub"
              subtitle="Redeemed Burger • 08:15 AM"
              points="-800"
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuCDzVbbcDnW0KxdXyzYto5A0eD3-MrP-HJyQuJ16GJWpd8LXKUo5Fndi_Ifv3ShnX0mqyNijarrU4eVmtQeqq3pNto-Ho2-d5QqJMvZw8AQSkuKiEO3GlpYlCX_fRKgXKtLei5HXTcAwbBzR8JaocCw_2-YnssPSnELptffzKui7ClKlpMLtqcded1E2fm59P9sYC1Kh4wgNuGcbq9t7QKDBoGy0wABF9xGh2YUQq9qxJM7tpCn8otxtJSxsmGafagpq3TKXKcYHg"
            />
          </View>
        </AnimatedView>

        {/* YESTERDAY */}
        <AnimatedView entering={FadeInUp.delay(200).duration(500)} className="mt-10">
          <Text className="text-xs font-800 uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-4">
            Yesterday
          </Text>

          <View className="space-y-6">
            <HistoryItem
              title="System Reward"
              subtitle="7-Day Streak Bonus"
              points="+150"
              positive
              icon="✨"
            />

            <HistoryItem
              title="Bella Bakery"
              subtitle="Purchase Points • 4:30 PM"
              points="+32"
              positive
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuBMNKkMJqZhTJ3-sPoTS6RM5-3PofP5W9h3KKmZ5ButaYD7bcOSj_VPOLGbRXT9CL_9dPR0k3rYPpU-dgHvEUaFL8Sv9bCB-qZz517H4LgXnNbg7SXNn5xHZSPQdzWufMp0Q_SqSAli49mnZ92bwiV3T2_KUenYkcmojk3vdeIToslg5SKCPGMs7Pn7khoMuxWOswEWEjP-TZ465YdtWBUGRxH2yghWPhyBX-I4mpXitqA5iuhHGk5N7BM2EoMIQITg2wpnKf4ORw"
            />
          </View>
        </AnimatedView>

        {/* OCTOBER 14 */}
        <AnimatedView entering={FadeInUp.delay(300).duration(500)} className="mt-10">
          <Text className="text-xs font-800 uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-4">
            October 14
          </Text>

          <View className="space-y-6">
            <HistoryItem
              title="Iron Gym"
              subtitle="Location Check-in • 6:00 AM"
              points="+10"
              positive
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuCkbOOvlwTwDNwhkROLzoIwvBgyEScWV8Flwxtl3QlyNWfSuOfeWFjRwsXD-G0_G2HRxeyOg7oK9dfzvtzqfRzDahy1xdLfHj5vqDkbwHfvasndc16rHw3wXCywrQoNY5unEh4cHmFofmUrPv0XH2Pglbt-QLgU-UBRRB6BxxatssPU2fqevQub5yoetDMEoHOJpCuyT9jy0AT7qfAI5GIKkk0ttASL1eL5y9p8msRE6sOrEKMU-G_1E8X-pcms3LLSa4a3wLICQw"
            />

            <HistoryItem
              title="Zen Studio"
              subtitle="Discount Voucher • 11:45 AM"
              points="-500"
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuCWjyL0GY6w2llQQhUrAZYxiS9wzf9Zkww8zwknp6802tWHgFiGobSBFCYQgC7SSJsNkbeZ_NBfE7a8NTlYfUVy_28_afCiqDppV1HJBEKJ03NtqamvYGXLia5m3Yy_7dkIOa4MuDo3Am49S5HSFj4a1N4QphPqVHiQ99eY-kbwtNyTCmrMRAQr11NN6FtrQq7oRt9lAjtgbcPxOCGLZx4jm8-tndrGLx9MHn6yPsn8w4XvoPae2wYDals8hmRBNtE7ZPKqaNZXeQ"
            />
          </View>
        </AnimatedView>

        {/* LOAD MORE */}
        <View className="mt-12 mb-24">
          <View className="py-4 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
            <Text className="text-center text-sm font-700 text-stone-400">
              Load older activity
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* Reusable Item */
function HistoryItem({ title, subtitle, points, positive, image, icon }) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-row items-center space-x-3">
        <View className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 items-center justify-center overflow-hidden">
          {image ? (
            <Image source={{ uri: image }} className="w-full h-full" />
          ) : (
            <Text className="text-lg">{icon}</Text>
          )}
        </View>

        <View>
          <Text className="font-700 text-[15px] text-stone-900 dark:text-stone-100">
            {title}
          </Text>
          <Text className="text-[13px] text-stone-500 dark:text-stone-400">
            {subtitle}
          </Text>
        </View>
      </View>

      <Text
        className={`font-800 text-lg ${
          positive
            ? "text-emerald-500 dark:text-emerald-400"
            : "text-primary"
        }`}
      >
        {points}
      </Text>
    </View>
  );
}