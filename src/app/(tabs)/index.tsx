import { Text, SafeAreaView, View } from "@/tw";
import React, { useEffect, useRef } from "react";
import Mapbox from "@rnmapbox/maps";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

export default function Discover() {
  const bottomSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN);
  }, []);

  const stores = [
    {
      id: "1",
      name: "Punto asdas",
      address: "Cebu IT Park",
      distance: "0.4 km",
      rating: 4.6,
    },
    {
      id: "2",
      name: "Punto Market",
      address: "Ayala Center Cebu",
      distance: "1.2 km",
      rating: 4.4,
    },
    {
      id: "3",
      name: "Punto Express",
      address: "SM City Cebu",
      distance: "2.0 km",
      rating: 4.2,
    },
  ];

  
  return (
    <GestureHandlerRootView className="">
      <Mapbox.MapView style={{ width: "100%", height: "100%" }}>
          <Mapbox.Camera
            zoomLevel={6}
            centerCoordinate={[123.8854, 10.3157]}
          />
        </Mapbox.MapView>
        <BottomSheet ref={bottomSheetRef} snapPoints={["25%", "50%", "90%"]}>
        <BottomSheetView className="flex-1 bg-white">
          <Text className="px-4 pt-4 pb-2 text-lg font-bold text-gray-900">
            Nearby Stores
          </Text>

          <View>
            {stores.map((store) => (
              <View
                key={store.id}
                className="px-4 py-4 border-b border-gray-200"
              >
                <Text className="text-base font-semibold text-gray-900">
                  {store.name}
                </Text>

                <Text className="text-sm text-gray-500">
                  {store.address}
                </Text>

                <Text className="mt-1 text-sm text-gray-700">
                  ⭐ {store.rating} • {store.distance}
                </Text>
              </View>
            ))}
          </View>
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
}
