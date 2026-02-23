import { Text, SafeAreaView, View } from "@/tw";
import React, { useEffect, useRef, useState } from "react";
import Mapbox, { MapView, UserLocation, Camera, PointAnnotation } from "@rnmapbox/maps";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Alert, PermissionsAndroid, Platform, ScrollView, TextInput, TextInputSubmitEditingEvent, TouchableOpacity } from "react-native";
import * as Location from 'expo-location'
import { supabase } from "@/supabase/supabase";
import { Ionicons } from "@expo/vector-icons";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN);

export default function Discover() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const cameraRef = useRef(null);
  
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedSearchResult, setSelectedSearchResult] = useState<any>(null);
  
    const searchPlaces = async () => {
      if (!searchQuery.trim()) return;
  
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            searchQuery
          )}.json?limit=5&country=ph&access_token=${process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}`
        );
  
        const data = await res.json();
        setSearchResults(data.features || []);
      } catch (e) {
        console.error("Search error", e);
      }
    };
  
    const handleSearchResultPress = (result: any) => {
      setSelectedSearchResult(result);
      setSearchResults([]);
  
      cameraRef.current?.setCamera({
        centerCoordinate: result.center,
        zoomLevel: 14,
        animationDuration: 1000,
      });
    };
  
    useEffect(() => {
      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
  
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
  
        cameraRef.current?.setCamera({
          centerCoordinate: [loc.coords.longitude, loc.coords.latitude],
          zoomLevel: 14,
          animationDuration: 1000,
        });
      })();
    }, []);
  
    return (
      <SafeAreaView className="flex-1">
        <View className="absolute top-15 left-4 right-4 z-20">
          <View className="bg-white rounded-2xl flex-row justify-between items-center shadow px-4 py-2">
            <TextInput
              className="flex-1 text-base text-black"
              placeholder="Search a place"
              style={{ color: "gray" }}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={searchPlaces}
              returnKeyType="search"

            />
            <Ionicons name="search-outline" size={24} color="darkorange" />
          </View>
  
          {searchResults.length > 0 && (
            <View className="bg-white mt-2 rounded-xl shadow max-h-56">
              <ScrollView keyboardShouldPersistTaps="handled">
                {searchResults.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => handleSearchResultPress(r)}
                    className="px-10 py-2 border-b border-gray-100"
                  >
                    <Text className="font-semibold p-2">{r.text}</Text>
                    <Text className="text-xs text-gray-500 p-2">
                      {r.place_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
  
        <MapView
          style={{ flex: 1 }}
          styleURL="mapbox://styles/mapbox/streets-v12"
        >
          <Mapbox.Camera ref={cameraRef} zoomLevel={6} />
          <Mapbox.UserLocation visible />
  
          {selectedSearchResult && (
            <PointAnnotation
              id="search-location"
              coordinate={selectedSearchResult.center}
              children={<View className="w-4 h-4 bg-orange-500 rounded-full" />}
            />
          )}
        </MapView>
  
        <BottomSheet ref={bottomSheetRef} snapPoints={["25%", "50%", "90%"]}>
          <BottomSheetView className="flex-1 bg-white">
            <Text className="px-4 pt-4 pb-2 text-lg font-bold">
              Nearby Stores
            </Text>
          </BottomSheetView>
        </BottomSheet>
      </SafeAreaView>
    );
}