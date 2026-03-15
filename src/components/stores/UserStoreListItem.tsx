import { View, Text, TouchableOpacity, Image, AnimatedView } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { FadeInDown, Layout } from "react-native-reanimated";
import React from "react";
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

  return (
    <AnimatedView
      entering={FadeInDown.delay(sectionDelay + index * 100).duration(400)}
      layout={Layout.springify()}
    >
      <TouchableOpacity
        onPress={() => router.push(`/store/${store.id}`)}
        activeOpacity={0.7}
        className="bg-white dark:bg-darkBackgroundCard rounded-3xl p-4 flex-row items-center border border-neutral-100 dark:border-darkBorder shadow-sm shadow-neutral-100 dark:shadow-none"
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

          <View className="flex-row items-center mb-2">
            <MaterialIcons name="place" size={14} color="#9CA3AF" />
            <Text className="text-xs text-neutral-400 font-poppins ml-1 flex-1" numberOfLines={1}>
              {store.location}
            </Text>
          </View>

          <View>
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-[10px] font-poppins-semibold text-neutral-500 dark:text-neutral-400">
                STAMP PROGRESS
              </Text>
              <Text className="text-[10px] font-poppins-bold text-primary">
                {store.stampsCount}/{store.targetStamps}
              </Text>
            </View>
            <View className="h-1.5 w-full bg-neutral-100 dark:bg-white/10 rounded-full overflow-hidden">
              <View
                className="h-full bg-primary rounded-full"
                style={{ width: `${Math.min((store.stampsCount / store.targetStamps) * 100, 100)}%` }}
              />
            </View>
          </View>
        </View>

        <View className="ml-3">
          <View className="w-8 h-8 rounded-full bg-neutral-50 dark:bg-white/5 items-center justify-center">
            <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
          </View>
        </View>
      </TouchableOpacity>
    </AnimatedView>
  );
}
