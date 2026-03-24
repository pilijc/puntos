import { View, Text, TouchableOpacity, Image, AnimatedView, Pressable } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { FadeInDown, Layout, FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import React, { useState } from "react";
import { useRouter } from "expo-router";

interface UserStoreListItemProps {
  store: {
    id: string;
    name: string;
    location: string;
    distanceMeters?: number;
    stampsCount: number;
    targetStamps: number;
    isNearby: boolean;
    logo?: string | null;
  };
  index: number;
  sectionDelay?: number;
}

export default function UserStoreListItem({ store, index, sectionDelay = 0 }: UserStoreListItemProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const clampedCount = Math.min(Math.max(store.stampsCount, 0), Math.max(store.targetStamps, 1));

  const scale = useSharedValue(1);
  const animatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 200, mass: 1 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200, mass: 1 });
  };

  return (
    <AnimatedView
      entering={FadeInDown.delay(sectionDelay + index * 100).duration(400)}
      layout={Layout.springify()}
      style={animatedScaleStyle}
      className="bg-white dark:bg-darkBackgroundCard rounded-3xl p-4 border border-neutral-100 dark:border-darkBorder shadow-sm shadow-neutral-100 dark:shadow-none overflow-hidden"
    >
      <View className="flex-row items-center">
        {/* Main tappable area for routing */}
        <Pressable
          onPress={() => router.push(`/store/${store.id}`)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          className="flex-1 flex-row items-center"
        >
          <View className="w-16 h-16 rounded-2xl bg-neutral-50 dark:bg-white/5 items-center justify-center overflow-hidden border border-neutral-100 dark:border-darkBorder">
            {store.logo ? (
              <Image
                source={{ uri: store.logo }}
                className="w-full h-full"
                contentFit="cover"
              />
            ) : (
              <MaterialIcons name="storefront" size={32} color="#FF6600" />
            )}
          </View>

          <View className="flex-1 ml-4 justify-center">
            <View className="flex-row items-center justify-between mb-0.5">
              <Text className="text-lg font-poppins-bold text-neutral-900 dark:text-white flex-1" numberOfLines={1}>
                {store.name}
              </Text>
              {store.isNearby && (
                <View className="bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-lg">
                  <Text className="text-[9px] font-poppins-bold text-green-700 dark:text-green-400">NEARBY</Text>
                </View>
              )}
            </View>

            <View className="flex-row items-center">
              <MaterialIcons name="place" size={14} color="#9CA3AF" />
              <Text className="text-xs text-neutral-400 font-poppins ml-1 flex-1" numberOfLines={1}>
                {store.location}
              </Text>
            </View>
          </View>
        </Pressable>

        {/* Dedicated toggle button on the right */}
        <TouchableOpacity 
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.7}
          className="ml-2 pl-2 py-2"
        >
          <MaterialIcons name={isExpanded ? "expand-less" : "expand-more"} size={28} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Expanded Progress Bars Section */}
      {isExpanded && (
        <AnimatedView entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} className="mt-4 pt-3 border-t border-neutral-100 dark:border-darkBorder">
          {/* Static Streak Progress */}
          <View>
            <View className="flex-row items-center justify-between mb-1.5">
              <View className="flex-row items-center gap-x-1">
                <MaterialIcons name="local-fire-department" size={14} color="#3b82f6" />
                <Text className="text-[10px] font-poppins-medium text-neutral-500 dark:text-neutral-400">
                  Streak Progress
                </Text>
              </View>
              <Text className="text-[10px] font-poppins-bold text-blue-500">
                1/3
              </Text>
            </View>
            <View className="h-1.5 w-full bg-neutral-100 dark:bg-white/10 rounded-full overflow-hidden">
              <View
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `33%` }}
              />
            </View>
          </View>

          {/* Stamp Progress */}
          <View className="mt-3">
            <View className="flex-row items-center justify-between mb-1.5">
              <View className="flex-row items-center gap-x-1">
                <MaterialIcons name="stars" size={14} color="#FF6600" />
                <Text className="text-[10px] font-poppins-medium text-neutral-500 dark:text-neutral-400">
                  Stamp Progress
                </Text>
              </View>
              <Text className="text-[10px] font-poppins-bold text-primary">
                {clampedCount}/{Math.max(store.targetStamps, 1)}
              </Text>
            </View>
            <View className="h-1.5 w-full bg-neutral-100 dark:bg-white/10 rounded-full overflow-hidden">
              <View
                className="h-full bg-primary rounded-full"
                style={{ width: `${(clampedCount / Math.max(store.targetStamps, 1)) * 100}%` }}
              />
            </View>
          </View>
        </AnimatedView>
      )}
    </AnimatedView>
  );
}
