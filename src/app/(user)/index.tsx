import { Text, SafeAreaView, View, Image } from "@/tw";
import React, { useEffect, useRef, useState } from "react";
import Mapbox, { MapView, UserLocation, Camera, PointAnnotation, UserTrackingMode } from "@rnmapbox/maps";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Alert, PermissionsAndroid, Platform, TextInput, TextInputSubmitEditingEvent, TouchableOpacity, useColorScheme } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import * as Location from 'expo-location'
import { supabase } from "@/supabase/supabase";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { getSearchResultsService, getStoresService } from "@/services/discover-service";
import { useStoreStore } from "@/store/store-store";
import { Store } from "@/type/store";
import type * as GeoJSON from "geojson";
import { OneSignal } from "react-native-onesignal";
import { getOneSignalId } from "@/services/push-notif";
import { getStores } from "@/services/store-service";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN);

const storeIconKey = (type: string | number) => {
  const t = String(type).toLowerCase();
  switch (t) {
    case "bar":
      return "bar";
    case "coffee":
      return "coffee";
    case "restaurant":
      return "restaurant";
    case "market":
      return "market";
    case "shop":
    default:
      return "default";
  }
};

export default function Discover() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const cameraRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const { stores, setStores } = useStoreStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedSearchResult, setSelectedSearchResult] = useState<any>(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState<GeoJSON.LineString | null>(null);
  const [routeDrawProgress, setRouteDrawProgress] = useState(0);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const routeAnimationRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  const getToken = async () => {
    try {
      const subscriptionId = await getOneSignalId();
      if (!subscriptionId) {
        Alert.alert(
          "No subscription",
          "Push isn't ready yet. Allow notifications and try again."
        );
        return;
      }

      console.log("subscriptionId:", subscriptionId);
      const sessionData = await supabase.auth.getSession();
      const token = sessionData.data?.session?.access_token ?? process.env.EXPO_PUBLIC_ANON_KEY;
      const { data, error } = await supabase.functions.invoke("notify-nearby-stores", {
        body: {
          subscriptionId,
          title: "Nearby Store",
          body: "You are near a store",
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (error) {
        console.log("notify-nearby-store error full:", JSON.stringify(error, null, 2));
        Alert.alert("Error", "Could not send test notification. Check logs.");
        return;
      }

      if (data?.ok) {
        Alert.alert("Sent", "Check the top of your screen for the push.");
      } else {
        Alert.alert("Push failed", data?.data?.errors?.[0] ?? "OneSignal returned an error.");
      }
    } catch (err) {
      console.error("Error calling notify-nearby-store:", err);
      Alert.alert("Error", "Something went wrong while sending the notification.");
    }
  };

  useEffect(() => {
    (async () => {
      const data = await getStores();
      setStores(data ?? []);
    })();
  }, []);

  useEffect(() => {
    if (!routeGeoJSON?.coordinates?.length) return;
    const durationMs = 1800;
    const startTime = Date.now();
    const run = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      setRouteDrawProgress(progress);
      if (progress < 1) {
        routeAnimationRef.current = requestAnimationFrame(run);
      }
    };
    routeAnimationRef.current = requestAnimationFrame(run);
    return () => {
      if (routeAnimationRef.current != null) cancelAnimationFrame(routeAnimationRef.current);
    };
  }, [routeGeoJSON]);

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
    setSelectedStore(store);
    bottomSheetRef.current?.snapToIndex(1);

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
    setRouteDrawProgress(0);
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
  
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
  
      setLocation(loc);
    })();
  }, []);

  useEffect(() => {
    if (!mapReady || !location) return;
    const { longitude, latitude } = location.coords;
  
    cameraRef.current?.setCamera({
      centerCoordinate: [longitude, latitude],
      zoomLevel: 14,
      animationDuration: 1000,
    });
  }, [mapReady, location]);

  const storeFeatures: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: stores.map((s) => ({
      type: "Feature",
      id: s.id,
      geometry: {
        type: "Point",
        coordinates: [s.longitude, s.latitude],
      },
      properties: {
        storeId: String(s.id),
        icon: storeIconKey(s.type), // <-- "bar" | "coffee" | ...
      },
    })),
  };

  return (
    <View className="flex-1">
      <SafeAreaView className="absolute top-0 left-0 right-0 z-20">
        <View className="mt-4 mx-4">
          <View className="bg-white dark:bg-neutral-800 rounded-xl flex-row justify-between items-center px-4 py-1">
            <TextInput
              className="flex-1 text-base text-black dark:text-white font-poppins-semibold items-center justify-center"
              style={{ fontFamily: "Poppins-Regular" }}
              placeholderTextColor="gray"
              placeholder="Search a place"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={searchPlaces}
              returnKeyType="search"
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-outline" size={24} color="darkorange" />
              </TouchableOpacity>
            ) : (
              <Ionicons name="search-outline" size={24} color="darkorange" className="font-poppins-bold" />
            )}
          </View>

          {searchResults.length > 0 && (
            <View className="bg-white dark:bg-neutral-800 mt-2 rounded-xl p-2 max-h-72 border border-neutral-100 dark:border-neutral-700">
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
                      <Text className="font-semibold text-base text-neutral-900 dark:text-white">{r.text}</Text>
                      <Text numberOfLines={1} className="text-xs text-neutral-500 dark:text-neutral-400">
                        {r.place_name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </SafeAreaView>

      <MapView
        style={{ flex: 1 }}
        onDidFinishLoadingMap={() => setMapReady(true)}
        styleURL={isDark ? "mapbox://styles/mapbox/navigation-night-v1" : "mapbox://styles/mapbox/streets-v12"}
      >
        <Mapbox.Images
          images={{
            bar: require("../../assets/images/icons/bar.png"),
            coffee: require("../../assets/images/icons/cafe.png"),
            restaurant: require("../../assets/images/icons/restau.png"),
            market: require("../../assets/images/icons/market.png"),
            shop: require("../../assets/images/icons/shop.png"),
            default: require("../../assets/images/icons/default.png"),
          }}
        />
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

        <Mapbox.ShapeSource
          id="storesSource"
          shape={storeFeatures}
          onPress={(e) => {
            const p = e.features?.[0]?.properties;
            const storeId = p?.storeId;
            const store = stores.find((x) => String(x.id) === String(storeId));
            if (store) handleStoreSelect(store);
          }}
        >
          <Mapbox.SymbolLayer
            id="storesLayer"
            style={{
              iconImage: ["get", "icon"],
              iconAllowOverlap: true,
              iconSize: [
                "interpolate",
                ["linear"],
                ["zoom"],
                5, 0.025,
                10, 0.02,
              ],
            }}
          />
        </Mapbox.ShapeSource>

        {routeGeoJSON && !searchQuery && (() => {
          const coords = routeGeoJSON.coordinates;
          const total = coords.length;
          const visibleCount = Math.max(2, Math.ceil(total * routeDrawProgress));
          const animatedCoords = coords.slice(0, visibleCount);
          const animatedLine: GeoJSON.LineString = {
            type: "LineString",
            coordinates: animatedCoords,
          };
          return (
            <Mapbox.ShapeSource
              id="routeSource"
              shape={{
                type: "Feature",
                geometry: animatedLine,
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
          );
        })()}
      </MapView>

      {routeGeoJSON && (
        <TouchableOpacity
          style={{
            position: "absolute",
            right: 16,
            bottom: 215,
            zIndex: 999,
            elevation: 20,
          }}
          className="bg-white dark:bg-neutral-800 rounded-full p-2"
          onPress={() => {
            setRouteGeoJSON(null);
            setSelectedStore(null);
          }}
        >
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
          className="bg-white dark:bg-neutral-800 rounded-full p-2"
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

      {selectedStore && (
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={["20%", "55%"]}
          index={0}
          backgroundStyle={{ backgroundColor: isDark ? '#171717' : '#FFFFFF' }}
          handleIndicatorStyle={{ backgroundColor: isDark ? '#525252' : '#D4D4D4' }}
        >
        <BottomSheetView className="flex-1">
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
            {stores.map((s) => (
              <View
                key={s.id}
                className="bg-white dark:bg-neutral-800 p-2 flex-row items-center gap-x-3"
              >
                <Image
                  source={{
                    uri: s.logo ||
                      "https://lh3.googleusercontent.com/aida-public/AB6AXuC4UoIc5vV5FsC0GfTTA75QiDrtMiMWtt6tFc38XKl5LuFnQw44le3ELNt73nsTAZjzI-LsorNZ4J6gPThjuNutUG2gc0FRc28x32itJuxsbctOi-CTpqY0IciSSDhEW2D_W1HXd4CD76pkUY8zeFOJaseJmsrJWE9GR41XiIsGFBT1LngvIvhlPFBhCuDi0HyB0wgetKeYbvj19Q6ewuYHYo7Hd8NOQrkxpsSZuYEXDgvA6MysHT_fhPQoKSf657uhwFNqQeM9LQ",
                  }}
                  className="w-24 h-24 rounded-xl bg-slate-100"
                />
                <View className="flex-1">
                  
                  <View className="flex-row justify-between items-start">
                    <Text className="text-lg text-neutral-900 dark:text-white flex-1 font-poppins-semibold" numberOfLines={1}>
                      {s.name}
                    </Text>
                  </View>
                  <View className="flex-col items-start gap-1 mt-1">
                    <View className="flex-row items-center gap-2">
                      <MaterialCommunityIcons name="map-marker-radius-outline" size={14} color="gray" />
                      <Text className="text-xs text-slate-500 font-poppins" numberOfLines={1}>
                        {s.address}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-2">
                      <FontAwesome6 name="clock" size={12} color="gray" />
                      <Text className="text-xs text-slate-500 font-poppins">
                        Open 10:00 AM - 10:00 PM
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity className="bg-orange-500/10 px-3 py-1.5 rounded-xl" onPress={getToken}>
                    <Text className="text-xs text-orange-500 font-poppins-semibold">Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View className="mt-2">
              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
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

            <View className="bg-white dark:bg-neutral-800 p-2 flex-row items-center gap-x-3">
              <View className="flex-1 justify-between">
                <View className="flex-row items-center gap-x-2">
                  <Text className="text-lg text-neutral-900 dark:text-white flex-1 font-poppins-semibold">
                    Rewards
                  </Text>
                  <TouchableOpacity className="bg-orange-500/10 px-3 py-1.5 rounded-xl" onPress={getToken}>
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
                        <Text className="text-base font-poppins-semibold text-neutral-900 dark:text-white">
                          Free Coffee
                        </Text>
                        <Text className="text-xs font-poppins text-neutral-500 dark:text-neutral-400" numberOfLines={2}>
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
      )}
    </View>
  );
}