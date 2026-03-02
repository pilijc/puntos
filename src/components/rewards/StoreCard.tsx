import { View, Text, Pressable, Image } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { storeLogos, type StoreItem } from "@/data/rewards";

type StoreCardProps = {
  store: StoreItem;
  onPress?: () => void;
};

export default function StoreCard({ store, onPress }: StoreCardProps) {
  const logoSource = storeLogos[store.id];

  return (
    <Pressable
      onPress={onPress}
      className="bg-white dark:bg-neutral-800 rounded-2xl p-3 border border-neutral-100 dark:border-neutral-700 flex-row gap-x-3 items-center"
    >
      <View className="w-14 h-14 rounded-xl bg-neutral-100 dark:bg-neutral-700 items-center justify-center overflow-hidden">
        {logoSource ? (
          <Image
            source={logoSource}
            className="w-full h-full"
            contentFit="cover"
            contentPosition="center"
          />
        ) : (
          <Text className="text-[10px] text-neutral-400 font-poppins">IMAGE</Text>
        )}
      </View>
      <View className="flex-1">
        <Text className="font-poppins-semibold text-neutral-900 dark:text-white">
          {store.name}
        </Text>
        <Text className="text-xs text-neutral-500 dark:text-neutral-400 font-poppins mt-1">
          {store.location} • {store.distanceMiles.toFixed(1)} miles away
        </Text>
        <Text className="text-primary font-poppins-semibold mt-2">
          {store.points.toLocaleString()} pts
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color="#94a3b8" />
    </Pressable>
  );
}
