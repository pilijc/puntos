import { Text, SafeAreaView, View, Image } from "@/tw";
import React, { useEffect, useRef, useState } from "react";
import Mapbox, { MapView, UserLocation, Camera, PointAnnotation, UserTrackingMode } from "@rnmapbox/maps";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Alert, PermissionsAndroid, Platform, TextInput, TextInputSubmitEditingEvent, TouchableOpacity } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import * as Location from 'expo-location'
import { supabase } from "@/supabase/supabase";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { getSearchResultsService, getStoresService } from "@/services/discover-service";
import { useStoreStore } from "@/store/store-store";
import { Store } from "@/type/store";
import type * as GeoJSON from "geojson";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN);

export default function Discover() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const cameraRef = useRef(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const { stores, setStores } = useStoreStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedSearchResult, setSelectedSearchResult] = useState<any>(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState<GeoJSON.LineString | null>(null);

  useEffect(() => {
    (async () => {
      const data = await getStoresService();
      setStores(data ?? []);
    })();
  }, []);

  const searchPlaces = async () => {
    if (!searchQuery.trim()) return;
    try {
      const data = await getSearchResultsService(searchQuery);
      setSearchResults(data.features || []);
    } catch (e) {
      console.error("Search error", e);
    }
  };

  const getRoute = async (
    start: [number, number],
    end: [number, number]
  ): Promise<GeoJSON.LineString | null> => {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}`;

    const res = await fetch(url);
    const json = await res.json();

    return json.routes?.[0]?.geometry ?? null; 
  };

  const handleStoreSelect = async (store: Store) => {
    if (!location) return;
  
    const start: [number, number] = [
      location.coords.longitude,
      location.coords.latitude,
    ];
  
    const end: [number, number] = [
      store.longitude,
      store.latitude,
    ];
  
    const route = await getRoute(start, end);
    setRouteGeoJSON(route);
    // if (route && Array.isArray(route.coordinates) && route.coordinates.length >= 2) {
    //   const coords = [...route.coordinates];
    //   // ensure the line starts/ends exactly at the same coordinates as the markers
    //   coords[0] = start;
    //   coords[coords.length - 1] = end;

    //   setRouteGeoJSON({
    //     ...route,
    //     coordinates: coords,
    //   });
    // } else {
    //   setRouteGeoJSON(null);
    // }
  
    cameraRef.current?.fitBounds(start, end, 80, 1000);
  };

  const handleSearchResultPress = (result: any) => {
    setSelectedSearchResult(result);
    setSearchResults([]);

    cameraRef.current?.setCamera({
      centerCoordinate: result.center,
      zoomLevel: 14,
      animationDuration: 1000,
      animationMode: "flyTo",
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

  console.log(location);

  return (
    <SafeAreaView className="flex-1">
      <View className="absolute top-15 left-4 right-4 z-20">
        <View className="bg-white rounded-xl flex-row justify-between items-center px-4 py-1">
          <TextInput
            className="flex-1 text-base text-black font-poppins-semibold items-center justify-center"
            style={{ fontFamily: "Poppins-Regular" }}
            placeholderTextColor="gray"
            placeholder="Search a place"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchPlaces}
            returnKeyType="search"
          />
          { searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-outline" size={24} color="darkorange" />
            </TouchableOpacity>
          ): (
            <Ionicons name="search-outline" size={24} color="darkorange" className="font-poppins-bold" />
          )}
        </View>

        {searchResults.length > 0 && (
          <View className="bg-white mt-2 rounded-xl p-2 max-h-72 border border-neutral-100">
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerClassName="divide-y divide-neutral-100"
            >
              {searchResults.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => handleSearchResultPress(r)}
                  activeOpacity={0.75}
                  className="flex-row items-center rounded-xl px-4 gap-x-3"
                  style={{ marginHorizontal: 4 }}
                >
                  <View className="flex-1 py-2">
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
          followUserLocation={searchQuery ? false : true}
          followUserMode={Mapbox.UserTrackingMode.FollowWithHeading}
          followZoomLevel={16}
          animationMode="easeTo"
          animationDuration={300}
        />
        <Mapbox.UserLocation 
          visible 
          showsUserHeadingIndicator={true}
          androidRenderMode="compass"
        /> 

       {selectedSearchResult && (
          <PointAnnotation
            id="search-location"
            coordinate={selectedSearchResult.center}
            children={<View className="w-4 h-4 bg-orange-500 rounded-full" />}
          /> 
        )}

        {stores.map((s) => (
          <PointAnnotation
            key={s.id.toString()}
            id={`store-${s.id}`}
            coordinate={[s.longitude, s.latitude]}
            onSelected={() => handleStoreSelect(s)}
            children={<View className="" />}
          />
        ))}

        {routeGeoJSON && !searchQuery && (
          <Mapbox.ShapeSource
            id="routeSource"
            shape={{
              type: "Feature",
              geometry: routeGeoJSON,
              properties: {},
            }}
          >
            <Mapbox.LineLayer
              id="routeLine"
              style={{
                lineColor: "#f97316",
                lineWidth: 4,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </Mapbox.ShapeSource>
        )}
      </MapView>

      <BottomSheet ref={bottomSheetRef} snapPoints={["20%", "55%"]} index={0}>
        <BottomSheetView className="flex-1 bg-white">
          <ScrollView
            horizontal={false}
            pagingEnabled={false}
            nestedScrollEnabled
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
                className="w-24 h-24 rounded-xl bg-slate-100"
              />
              <View className="flex-1">
                <View className="flex-row justify-between items-start">
                  <Text className="text-lg text-neutral-900 flex-1 font-poppins-semibold" numberOfLines={1}>
                    The Artisan Brew
                  </Text>
                </View>
                <View className="flex-col items-start gap-1 mt-1">
                  <View className="flex-row items-center gap-2">
                    <MaterialCommunityIcons name="map-marker-radius-outline" size={14} color="gray" />
                    <Text className="text-xs text-slate-500 font-poppins">123 Address St, City, PH</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <FontAwesome6 name="clock" size={12} color="gray" />
                    <Text className="text-xs text-slate-500 font-poppins">Open 10:00 AM - 10:00 PM</Text>
                  </View>
                </View>
                <View className="flex-row items-center justify-between mt-3">
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="star" size={14} color="#FB8500" />
                    <Text className="text-xs text-orange-500 ml-0.5 font-poppins">4.9</Text>
                  </View>

                  <TouchableOpacity className="bg-orange-500/10 px-3 py-1.5 rounded-xl ">
                    <Text className="text-xs text-orange-500 font-poppins-semibold">Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View className="mt-2">
              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator
                contentContainerStyle={{ gap: 12, paddingHorizontal: 4 }}
              >
                {[
                  "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg",
                  "https://images.pexels.com/photos/373888/pexels-photo-373888.jpeg",
                  "https://images.pexels.com/photos/414630/pexels-photo-414630.jpeg",
                  "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg",
                ].map((uri, index) => (
                  <Image
                    key={index}
                    source={{ uri }}
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 12,
                      backgroundColor: "#f1f5f9",
                    }}
                  />
                ))}
              </ScrollView>
            </View>

            <View className="bg-white p-2 flex-row items-center gap-x-3">
              <View className="flex-1 justify-between">
                <View className="flex-row items-center gap-x-2">
                  <Text className="text-lg text-neutral-900 flex-1 font-poppins-semibold">
                    Rewards
                  </Text>
                  <TouchableOpacity className="bg-orange-500/10 px-3 py-1.5 rounded-xl">
                    <Text className="text-xs text-orange-500 font-poppins-semibold">View All</Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-col items-center gap-y-2">
                  <View className="w-full flex-row items-center justify-between py-3 rounded-xl">
                    <Image
                      source={{
                        uri: "https://images.pexels.com/photos/414630/pexels-photo-414630.jpeg",
                      }}
                      className="w-24 h-24 rounded-xl bg-slate-100"
                    />
                    <View className="flex-1 flex-col justify-between ml-3 py-1">
                      <View className="flex-1 flex-col items-start justify-start">
                        <Text className="text-base font-poppins-semibold text-neutral-900">
                          Free Coffee
                        </Text>
                        <Text className="text-xs font-poppins text-neutral-500" numberOfLines={2}>
                          Any medium drink of your choice
                        </Text>
                      </View>

                      <View className="flex-row justify-start items-center mt-2">
                        <View className="flex-row items-center gap-x-2 flex-shrink">
                          <FontAwesome6 name="coins" size={12} color="#FB8500" />
                          <Text className="text-sm font-poppins-bold text-primary">
                            1,200 pts
                          </Text>
                        </View>
                      </View>

                    </View>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </BottomSheetView>
      </BottomSheet>

      { routeGeoJSON && (
        <TouchableOpacity style={{
          position: "absolute",
          right: 16,
          bottom: 215,
          zIndex: 999,
          elevation: 20, 
        }} className="bg-white rounded-full p-2" onPress={() => setRouteGeoJSON(null)}>
          <MaterialIcons name="clear" size={35} color="#FB8500" />
        </TouchableOpacity>
      )}

      {location && (
        <TouchableOpacity
          style={{
            position: "absolute",
            right: 16,
            bottom: 170,
            zIndex: 999,
            elevation: 20, 
          }}
          className="bg-white rounded-full p-2"
          onPress={() => {
            cameraRef.current?.setCamera({
              centerCoordinate: [
                location.coords.longitude,
                location.coords.latitude,
              ],
              zoomLevel: 14,
              animationDuration: 600,
              animationMode: "flyTo",
            });
          }}
        >
          <MaterialIcons name="filter-center-focus" size={35} color="#FB8500" />
        </TouchableOpacity>
      )}
      <Text>Testing</Text>
    </SafeAreaView>
  );
}