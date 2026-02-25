import { Text, SafeAreaView, View, Image } from "@/tw";
import React, { useEffect, useRef, useState } from "react";
import Mapbox, { MapView, UserLocation, Camera, PointAnnotation, UserTrackingMode } from "@rnmapbox/maps";
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
          <View className="bg-white rounded-2xl flex-row justify-between items-center px-4 py-2">
            <TextInput
              className="flex-1 text-base text-black"
              placeholderTextColor="gray"
              placeholder="Search a place"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={searchPlaces}
              returnKeyType="search"

            />
            <Ionicons name="search-outline" size={24} color="darkorange" />
          </View>
  
          {searchResults.length > 0 && (
            <View className="bg-white mt-2 rounded-2xl p-2 max-h-72 border border-neutral-100">
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerClassName="divide-y divide-neutral-100"
              >
                {searchResults.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => handleSearchResultPress(r)}
                    activeOpacity={0.75}
                    className="flex-row items-center rounded-xl px-3 py-3 gap-x-3 gap-y-2"
                    style={{ marginHorizontal: 4 }}
                  >
                    <View className="flex-1 gap-y-1">
                      <Text className="font-semibold text-base text-neutral-900">{r.text}</Text>
                      <Text numberOfLines={1} className="text-xs text-neutral-500">
                        {r.place_name}
                      </Text>
                    </View>
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
          <Mapbox.Camera
            ref={cameraRef}
            followUserLocation={true}
            followUserMode={Mapbox.UserTrackingMode.FollowWithHeading}
            followZoomLevel={16}
            animationMode="easeTo"
            animationDuration={300}
          />
          <Mapbox.UserLocation 
            visible 
            androidRenderMode="normal"
            showsUserHeadingIndicator={true}
          /> 
  
          {selectedSearchResult && (
            <PointAnnotation
              id="search-location"
              coordinate={selectedSearchResult.center}
              children={<View className="w-4 h-4 bg-orange-500 rounded-full" />}
            />
          )}
        </MapView>
  
        <BottomSheet ref={bottomSheetRef} snapPoints={["30%", "60%"]} index={0}>
          <BottomSheetView className="flex-1 bg-white">
            <ScrollView
              horizontal
              pagingEnabled={false}
              snapToAlignment="start"
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
              className="flex-1 pb-4"
            >

              <View
                className="bg-white p-2 flex-row items-center gap-x-3"
              >
                <Image
                  source={{
                    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuC4UoIc5vV5FsC0GfTTA75QiDrtMiMWtt6tFc38XKl5LuFnQw44le3ELNt73nsTAZjzI-LsorNZ4J6gPThjuNutUG2gc0FRc28x32itJuxsbctOi-CTpqY0IciSSDhEW2D_W1HXd4CD76pkUY8zeFOJaseJmsrJWE9GR41XiIsGFBT1LngvIvhlPFBhCuDi0HyB0wgetKeYbvj19Q6ewuYHYo7Hd8NOQrkxpsSZuYEXDgvA6MysHT_fhPQoKSf657uhwFNqQeM9LQ",
                  }}
                  className="w-24 h-24 rounded-2xl bg-slate-100"
                />
                <View className="flex-1">
                  <View className="flex-row justify-between items-start">
                    <Text className="text-lg text-neutral-900 flex-1 font-poppins-semibold" numberOfLines={1}>
                      The Artisan Brew
                    </Text>
                    <View className="flex-row items-center">
                      <Ionicons name="star" size={14} color="#FB8500" />
                      <Text className="text-xs text-orange-500 ml-0.5 font-poppins">4.9</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2 mt-1">
                    <Text className="text-xs text-slate-500 font-poppins">0.4 km away</Text>
                    <View className="w-1 h-1 rounded-full bg-slate-300" />
                    <Text className="text-xs text-slate-500 font-poppins">Cafe</Text>
                  </View>
                  <View className="flex-row items-center justify-between mt-3">
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="star" size={18} color="#FB8500" />
                      <Text className="text-sm text-orange-500 font-poppins">akakaka pts</Text>
                    </View>
                    <TouchableOpacity className="bg-orange-500/10 px-3 py-1.5 rounded-xl">
                      <Text className="text-xs text-orange-500 font-poppins">Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
          </BottomSheetView>
        </BottomSheet>
      </SafeAreaView>
    );
}