import React from "react";
import { Dimensions } from "react-native";
import { MapPin, Store } from "lucide-react-native";
import Carousel from "react-native-reanimated-carousel";
import { useTranslation } from "react-i18next";
import { View, Text, Image } from "@/tw";
import { storeLogos } from "@/data/rewards";

const { width: screenWidth } = Dimensions.get("window");

export interface UserStoreHeroCarouselProps {
  nearbyStores: any[];
  storesWithLocation: any[];
  setHeroIndex: (index: number) => void;
  heroIndex: number;
  swipeIndicatorStyle: any;
}

export default function UserStoreHeroCarousel({
  nearbyStores,
  storesWithLocation,
  setHeroIndex,
}: UserStoreHeroCarouselProps) {
  const { t: translate } = useTranslation();

  const getHeroImage = (store: any) => {
    if (store.logo) {
      return { uri: store.logo };
    }
    if (store.id && storeLogos[store.id.toString()]) {
      return storeLogos[store.id.toString()];
    }
    return undefined;
  };

  return (
    <View className="-mx-6 overflow-hidden bg-neutral-300 h-64 relative">
      {nearbyStores.length > 0 ? (
        <Carousel
          width={screenWidth}
          height={256}
          data={nearbyStores}
          scrollAnimationDuration={1000}
          enabled={nearbyStores.length > 1}
          loop={nearbyStores.length > 1}
          autoPlay={false}
          autoPlayInterval={4000}
          onSnapToItem={(index) => setHeroIndex(index)}
          renderItem={({ item: store }) => (
            <View className="w-full h-full relative">
              <Image
                source={getHeroImage(store)}
                className="absolute inset-0 w-full h-full"
                contentFit="cover"
                contentPosition="center"
              />
              <View className="absolute inset-0 bg-neutral-900/40" />

              <View className="absolute bottom-20 left-6 right-6 z-10">
                <Text className="text-2xl font-poppins-bold text-white" numberOfLines={1}>
                  {store.name}
                </Text>

                <View className="flex-col gap-y-1 mt-1">
                  <View className="bg-white/20 px-2 py-0.5 self-start rounded-lg">
                    <Text className="text-[10px] text-white font-poppins-medium uppercase">
                      {store.type || translate("user.rewards.store")}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-x-1">
                    <MapPin size={14} color="#FFFFFF" />
                    <Text className="text-white/90 font-poppins text-xs flex-1" numberOfLines={1}>
                      {store.address || translate("user.rewards.unknownLocation")}{" "}
                      •{" "}
                      {translate("user.rewards.distanceMeters", {
                        meters:
                          store.distanceMeters?.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          }) ?? "0",
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        />
      ) : (
        <>
          <View className="absolute top-15 left-6 z-20">
            <View className="bg-primary/90 self-start px-2 py-0.5 rounded-sm mb-2">
              <Text className="text-[10px] text-white font-poppins-semibold tracking-wider">
                {translate("user.rewards.discoverPartners")}
              </Text>
            </View>
          </View>
          <Carousel
            width={screenWidth}
            height={256}
            data={storesWithLocation.filter((store) => store.is_active)}
            scrollAnimationDuration={1500}
            loop={true}
            autoPlay={false}
            autoPlayInterval={4000}
            renderItem={({ item: store }) => (
              <View className="w-full h-full relative">
                <Image
                  source={getHeroImage(store)}
                  className="absolute inset-0 w-full h-full"
                  contentFit="cover"
                  contentPosition="center"
                />
                <View className="absolute inset-0 bg-neutral-900/40" />
                <View className="absolute top-22 left-6 right-6 z-10">
                  <Text className="text-2xl font-poppins-bold text-white" numberOfLines={1}>
                    {store.name}
                  </Text>

                  <View className="flex-col gap-y-1 mt-1">
                    <View className="bg-white/20 px-2 py-0.5 self-start rounded-lg">
                      <Text className="text-[10px] text-white font-poppins-medium uppercase">
                        {store.type || translate("user.rewards.store")}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-x-1">
                      <Store size={14} color="#FFFFFF" />
                      <Text className="text-white/90 font-poppins text-xs flex-1" numberOfLines={1}>
                        {store.address}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}
