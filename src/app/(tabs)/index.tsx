import { Text, SafeAreaView, View } from "@/tw";
import React, { useEffect } from "react";
import Mapbox from "@rnmapbox/maps";

export default function Discover() {

  useEffect(() => {
    Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN);
  }, []);
  
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 pt-6">
        <Text className="text-2xl font-poppins-bold text-neutral-900 mb-6">
          Discover
        </Text>
        <Text className="text-base font-poppins mb-4 text-neutral-700">
          Welcome to Puntos! Here you can:
        </Text>
        <View>
          <Mapbox.MapView style={styles.map}>
            <Mapbox.Camera
              zoomLevel={14}
              centerCoordinate={[123.8854, 10.3157]} // Cebu
            />
          </Mapbox.MapView>
        </View>
      </View>
    </SafeAreaView>
  );
}
