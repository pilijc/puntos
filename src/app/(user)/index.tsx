import { Text, SafeAreaView, View, Image } from "@/tw";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Mapbox, { MapView, PointAnnotation } from "@rnmapbox/maps";
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { TextInput, TouchableOpacity, useColorScheme } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import * as Location from 'expo-location'
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { getRouteService, getSearchResultsService } from "@/services/discover-service";
import { useStoreStore } from "@/store/user/store-store";
import { Store } from "@/type/user/store";
import type * as GeoJSON from "geojson";
import { getOneSignalId, sendPushNotification, isOneSignalNativeAvailable } from "@/services/push-notif";
import { isStoreNearby } from "@/services/user/location-service";
import * as turf from "@turf/turf";
import { getStores } from "@/services/store-service";
import { OneSignal } from "react-native-onesignal";
import { storeIconKey } from "@/type/user/discover";
import Svg, { Path } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { useLanguageStore } from "@/store/language-store";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN);

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
  const [sheetStores, setSheetStores] = useState<Store[]>([]);
  const [sheetView, setSheetView] = useState<"list" | "detail">("detail");
  const routeAnimationRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const notifiedStoreIds = useRef<Set<number>>(new Set());
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);
  const hasCenteredOnUserRef = useRef(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; heading?: number } | null>(null);
  const { t: translate } = useTranslation();
  const language = useLanguageStore((s) => s.language);

  const discoverMoreStores = useMemo(() => {
    if (!location) return [];
    const user = turf.point([location.coords.longitude, location.coords.latitude]);
    const nearbyIds = new Set(sheetStores.map((s) => String(s.id)));

    const candidates = stores
      .filter((s) => s.latitude && s.longitude)
      .filter((s) => !nearbyIds.has(String(s.id)))
      .map((s) => {
        const p = turf.point([s.longitude, s.latitude]);
        const meters = turf.distance(user, p, { units: "kilometers" }) * 1000;
        return { store: s, meters };
      })
      .filter(({ meters }) => meters >= 50 && meters <= 200)
      .sort((a, b) => a.meters - b.meters)
      .slice(0, 10);

    return candidates;
  }, [location, sheetStores, stores]);

  useEffect(() => {
    (async () => {
      const data = await getStores();
      setStores(data ?? []);
    })();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSelectedSearchResult(null);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (!isOneSignalNativeAvailable()) return;

    const handleNotificationClick = (event: any) => {
      (async () => {
        try {
          const notification = event.notification as any;
          const data = (notification.additionalData ?? notification.data) as
            | { store_id?: number | string; store_ids?: (number | string)[] }
            | undefined;

          const rawIds: (number | string)[] = [];
          if (data?.store_id != null) rawIds.push(data.store_id);
          if (Array.isArray(data?.store_ids)) rawIds.push(...data.store_ids);

          const storeIds = Array.from(
            new Set(rawIds.map((id) => Number(id)).filter((n) => !Number.isNaN(n))),
          );
          if (storeIds.length === 0) return;

          const allStores = (await getStores()) ?? [];
          const matchedStores = allStores.filter((s) =>
            storeIds.includes(Number(s.id)),
          ) as Store[];

          if (matchedStores.length === 0) return;

          setSheetStores(matchedStores);
          if (matchedStores.length > 1) {
            setSheetView("list");
            setSelectedStore(null);
          } else {
            setSheetView("detail");
            setSelectedStore(matchedStores[0]);
          }
          bottomSheetRef.current?.snapToIndex(1);
        } catch (e) {
          console.error("[NearbyPush] error handling notification click:", e);
        }
      })();
    };

    OneSignal.Notifications.addEventListener("click", handleNotificationClick);
    return () => {
      OneSignal.Notifications.removeEventListener("click", handleNotificationClick);
    };
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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const initial = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      }).catch(() => null)
        ?? await Location.getLastKnownPositionAsync({}).catch(() => null);

      if (initial && !cancelled) {
        setLocation(initial);
      }

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 0,
        },
        async (position) => {
          if (cancelled) return;

          try {
            setLocation(position);

            const { latitude: uLat, longitude: uLon } = position.coords;
            const { mutedStoreIds, isMutedStoresHydrated } = useStoreStore.getState();
            
            if (!isMutedStoresHydrated) return;

            const currentStores = useStoreStore.getState().stores;

            const nearbyStoreIds: number[] = [];
            for (const store of currentStores) {
              if (notifiedStoreIds.current.has(store.id)) continue;
              if (Array.isArray(mutedStoreIds) && mutedStoreIds.includes(store.id)) continue;
              if (!store.latitude || !store.longitude) continue;
              if (!store.radius) continue;

              const nearby = isStoreNearby(
                uLat,
                uLon,
                store.latitude,
                store.longitude,
                store.radius
              );

              if (nearby) nearbyStoreIds.push(store.id);
            }

            const nearbyCount = nearbyStoreIds.length;
            if (nearbyCount === 0) return;

            let title: string;
            let body: string;

            if (nearbyCount === 1) {
              const onlyStoreId = nearbyStoreIds[0];
              const onlyStore = currentStores.find((s) => s.id === onlyStoreId);
              const storeName = onlyStore?.name ?? "A store";
              title = translate("user.discover.geofence.singleTitle", { name: storeName });
              body = translate("user.discover.geofence.singleBody", { name: storeName });
            } else {
              title = translate("user.discover.geofence.multiTitle", { count: nearbyCount });
              body = translate("user.discover.geofence.multiBody");
            }

            const subscriptionId = await getOneSignalId();
            if (!subscriptionId) return;

            const res = await sendPushNotification(subscriptionId, title, body, {
              store_ids: nearbyStoreIds,
            });

            if (res instanceof Response) {
              console.log(`[Geofence] Push sent (${nearbyCount} nearby stores):`, res.status);
            }

            nearbyStoreIds.forEach((id) => notifiedStoreIds.current.add(id));

          } catch (err) {
            console.error("[Geofence] Error in location callback:", err);
          }
        }

      );

      if (!cancelled) {
        locationWatchRef.current = sub;
      } else {
        sub.remove();
      }
    })();

    return () => {
      cancelled = true;
      locationWatchRef.current?.remove();
      locationWatchRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !location) return;
    if (hasCenteredOnUserRef.current) return;
    const { longitude, latitude } = location.coords;
    cameraRef.current?.setCamera({
      centerCoordinate: [longitude, latitude],
      zoomLevel: 10,
      animationDuration: 1000,
    });
    hasCenteredOnUserRef.current = true;
  }, [mapReady, location]);

  useEffect(() => {
    if (!mapReady) return;

    const localizeMap = async () => {
      try {
        const mapboxLanguage = language === 'ja' ? 'ja' : 'en';

        const labelLayerPatterns = [
          'label',
          'place',
          'town',
          'city',
          'country',
          'road',
          'boundary'
        ];
      } catch (e) {
        console.warn("Failed to localize Mapbox labels", e);
      }
    };

    localizeMap();
  }, [mapReady, language]);

  const searchPlaces = async () => {
    if (!searchQuery.trim()) return;
    try {
      const data = await getSearchResultsService(searchQuery, language);
      setSearchResults(data.features || []);
    } catch (e) {
      console.error("Search error", e);
    }
  };

  const handleStoreSelect = async (store: Store) => {
    setSelectedStore(store);
    setSheetStores([store]);
    setSheetView("detail");
    bottomSheetRef.current?.snapToIndex(1);

    if (!location) return;
    const start: [number, number] = [location.coords.longitude, location.coords.latitude];
    const end: [number, number] = [store.longitude, store.latitude];
    const route = await getRouteService(start, end);
    setRouteGeoJSON(route ?? null);
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
        icon: storeIconKey(s.type),
      },
    })),
  };

  const circlesFC = useMemo(() => {
    const features = stores
      .filter((s) => s.latitude && s.longitude)
      .map((s) => {
        const circle = turf.circle(
          [s.longitude, s.latitude],
          s.radius! / 1000,
          { steps: 64, units: "kilometers" }
        );
        circle.properties = { storeId: String(s.id) };
        return circle;
      });

    return turf.featureCollection(features);
  }, [stores]);

  return (
    <View className="flex-1">
      <SafeAreaView className="absolute top-0 left-0 right-0 z-20">
        <View className="mt-4 mx-4">
          <View className="bg-white dark:bg-darkBackgroundMuted rounded-xl flex-row justify-between items-center px-4 py-1">
            <TextInput
              className="flex-1 text-base text-black dark:text-darkTextPrimary font-poppins-semibold items-center justify-center"
              style={{ fontFamily: "Poppins-Regular" }}
              placeholderTextColor="gray"
              placeholder={translate("user.discover.searchBar")}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={searchPlaces}
              returnKeyType="search"
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => {
                setSearchQuery("");
                setSearchResults([]);
                setSelectedSearchResult(null);
              }}>
                <Ionicons name="close-outline" size={24} color="darkorange" />
              </TouchableOpacity>
            ) : (
              <Ionicons name="search-outline" size={24} color="darkorange" className="font-poppins-bold" />
            )}
          </View>

          {searchResults.length > 0 && (
            <View className="bg-white dark:bg-darkBackgroundMuted mt-2 rounded-xl p-2 max-h-72 border border-neutral-100 dark:border-darkBorder">
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
                      <Text className="font-semibold text-base text-neutral-900 dark:text-darkTextPrimary">{r.text}</Text>
                      <Text numberOfLines={1} className="text-xs text-neutral-500 dark:text-darkTextSecondary">
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

        <Mapbox.UserLocation
          visible
          showsUserHeadingIndicator={true}
          androidRenderMode="compass"
        />

        <Mapbox.Images
          images={{
            bar: require("../../assets/images/markers/bar.png"),
            coffee: require("../../assets/images/markers/cafe.png"),
            restaurant: require("../../assets/images/markers/restau.png"),
            market: require("../../assets/images/markers/market.png"),
            shop: require("../../assets/images/markers/shop.png"),
            default: require("../../assets/images/markers/default.png"),
          }}
        />
        <Mapbox.Camera
          ref={cameraRef}
          followUserMode={Mapbox.UserTrackingMode.FollowWithHeading}
          followZoomLevel={16}
          animationMode="easeTo"
          animationDuration={300}
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

        <Mapbox.ShapeSource id="storeCirclesSource" shape={circlesFC}>
          <Mapbox.FillLayer
            id="storeCirclesFill"
            style={{
              fillColor: "#f97316",
              fillOpacity: 0.08,
            }}
            belowLayerID="storesLayer"
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
            top: 120,
            right: 16,
            zIndex: 101,
            elevation: 4,
          }}
          className="bg-white dark:bg-darkBackgroundMuted rounded-full p-2"
          onPress={() => {
            setRouteGeoJSON(null);
            setSelectedStore(null);
            setSheetStores([]);
            setSheetView("detail");
          }}
        >
          <MaterialIcons name="clear" size={35} color="#FB8500" />
        </TouchableOpacity>
      )}

      {(selectedStore || sheetStores.length > 0) && (
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
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              className="flex-1"
            >
              {sheetStores.length > 1 && sheetView === "list" ? (
                <>
                  <Text className="text-lg font-poppins-bold text-slate-900 dark:text-slate-100">
                    {translate("user.discover.nearbyStores")}
                  </Text>
                  {sheetStores.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedStore(s);
                        setSheetView("detail");
                      }}
                      style={{
                        backgroundColor: isDark ? '#171717' : '#fff',
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 12,
                        gap: 8,
                      }}
                    >
                      <Image
                        source={{
                          uri: s.logo ||
                            "https://lh3.googleusercontent.com/aida-public/AB6AXuC4UoIc5vV5FsC0GfTTA75QiDrtMiMWtt6tFc38XKl5LuFnQw44le3ELNt73nsTAZjzI-LsorNZ4J6gPThjuNutUG2gc0FRc28x32itJuxsbctOi-CTpqY0IciSSDhEW2D_W1HXd4CD76pkUY8zeFOJaseJmsrJWE9GR41XiIsGFBT1LngvIvhlPFBhCuDi0HyB0wgetKeYbvj19Q6ewuYHYo7Hd8NOQrkxpsSZuYEXDgvA6MysHT_fhPQoKSf657uhwFNqQeM9LQ",
                        }}
                        style={{
                          width: 54,
                          height: 54,
                          borderRadius: 14,
                          backgroundColor: isDark ? "#262837" : "#f3f4f6",
                          flexShrink: 0,
                          marginRight: 12,
                        }}
                      />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={{
                            fontSize: 15,
                            fontFamily: 'Poppins-SemiBold',
                            color: isDark ? '#f1f5f9' : '#0f172a',
                          }}
                          numberOfLines={1}
                        >
                          {s.name}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: isDark ? "#a3a3a3" : "#64748b",
                            fontFamily: 'Poppins-Regular',
                          }}
                          numberOfLines={2}
                        >
                          {s.address}
                        </Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={24} color={isDark ? "#94A3B8" : "#64748B"} />
                    </TouchableOpacity>
                  ))}

                  {discoverMoreStores.length > 0 && (
                    <>
                      <View className="mt-2">
                        <Text className="text-lg font-poppins-bold text-slate-900 dark:text-slate-100">
                          {translate("user.discover.discoverMore")}
                        </Text>
                      </View>

                      {discoverMoreStores.map(({ store: s, meters }) => (
                        <TouchableOpacity
                          key={`discover-${s.id}`}
                          activeOpacity={0.7}
                          onPress={() => handleStoreSelect(s)}
                          style={{
                            backgroundColor: isDark ? '#171717' : '#fff',
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 12,
                            gap: 8,
                          }}
                        >
                          <Image
                            source={{
                              uri: s.logo ||
                                "https://lh3.googleusercontent.com/aida-public/AB6AXuC4UoIc5vV5FsC0GfTTA75QiDrtMiMWtt6tFc38XKl5LuFnQw44le3ELNt73nsTAZjzI-LsorNZ4J6gPThjuNutUG2gc0FRc28x32itJuxsbctOi-CTpqY0IciSSDhEW2D_W1HXd4CD76pkUY8zeFOJaseJmsrJWE9GR41XiIsGFBT1LngvIvhlPFBhCuDi0HyB0wgetKeYbvj19Q6ewuYHYo7Hd8NOQrkxpsSZuYEXDgvA6MysHT_fhPQoKSf657uhwFNqQeM9LQ",
                            }}
                            style={{
                              width: 54,
                              height: 54,
                              borderRadius: 14,
                              backgroundColor: isDark ? "#262837" : "#f3f4f6",
                              flexShrink: 0,
                              marginRight: 12,
                            }}
                          />
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 8,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 15,
                                  fontFamily: 'Poppins-SemiBold',
                                  color: isDark ? '#f1f5f9' : '#0f172a',
                                  flex: 1,
                                }}
                                numberOfLines={1}
                              >
                                {s.name}
                              </Text>
                            </View>
                            <Text
                              style={{
                                fontSize: 12,
                                color: isDark ? "#a3a3a3" : "#64748b",
                                fontFamily: 'Poppins-Regular',
                              }}
                              numberOfLines={2}
                            >
                              {s.address}
                            </Text>
                          </View>
                          <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 4 }}>
                            <Text
                              style={{
                                fontFamily: 'Poppins-Regular',
                                color: isDark ? "#a3a3a3" : "#64748b",
                                marginRight: 4,
                              }}
                              className="font-poppins-regular text-xs"
                            >
                              {translate("user.discover.metersAway", { meters: Math.round(meters) })}
                            </Text>
                            <MaterialIcons name="chevron-right" size={24} color={isDark ? "#94A3B8" : "#64748B"} />
                          </View>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}
                </>
              ) : (
                <>
                  {sheetStores.length > 1 && sheetView === "detail" && selectedStore && (
                    <TouchableOpacity
                      onPress={() => setSheetView("list")}
                      className="flex-row items-center gap-x-2 py-1"
                    >
                      <View className="flex-row items-center gap-x-2">
                        <MaterialIcons name="chevron-left" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
                        <Text className="text-sm font-poppins-semibold text-slate-600 dark:text-slate-400">{translate("user.discover.backToList")}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  {(sheetStores.length > 0 ? sheetStores : stores).length <= 2 || sheetView === "detail" ? (
                    (() => {
                      const toShow = sheetStores.length > 1 && selectedStore ? [selectedStore] : (sheetStores.length > 0 ? sheetStores : stores);
                      return toShow.map((s) => (
                        <View
                          key={s.id}
                          className="bg-white dark:bg-darkBackgroundMuted py-4 flex-row items-start gap-x-4 rounded-2xl"
                        >
                          <Image
                            source={{
                              uri: s.logo ||
                                "https://lh3.googleusercontent.com/aida-public/AB6AXuC4UoIc5vV5FsC0GfTTA75QiDrtMiMWtt6tFc38XKl5LuFnQw44le3ELNt73nsTAZjzI-LsorNZ4J6gPThjuNutUG2gc0FRc28x32itJuxsbctOi-CTpqY0IciSSDhEW2D_W1HXd4CD76pkUY8zeFOJaseJmsrJWE9GR41XiIsGFBT1LngvIvhlPFBhCuDi0HyB0wgetKeYbvj19Q6ewuYHYo7Hd8NOQrkxpsSZuYEXDgvA6MysHT_fhPQoKSf657uhwFNqQeM9LQ",
                            }}
                            className="w-24 h-24 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0"
                          />
                          <View className="flex-1 min-w-0 gap-y-2">
                            <Text className="text-lg text-neutral-900 dark:text-darkTextPrimary font-poppins-semibold" numberOfLines={2}>
                              {s.name}
                            </Text>
                            <View className="flex-col items-start gap-2">
                              <View className="flex-row items-start gap-2 w-full">
                                <MaterialCommunityIcons name="map-marker-radius-outline" size={14} color="gray" />
                                <Text className="text-xs text-slate-500 dark:text-slate-400 font-poppins flex-1 min-w-0" numberOfLines={3}>
                                  {s.address}
                                </Text>
                              </View>
                              <View className="flex-row items-center gap-2">
                                <FontAwesome6 name="clock" size={12} color="gray" />
                                <Text className="text-xs text-slate-500 dark:text-slate-400 font-poppins">
                                  {translate("user.discover.storeHoursPlaceholder")}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      ));
                    })()
                  ) : null}

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

                  <View className="bg-white dark:bg-darkBackgroundMuted p-2 flex-row items-center gap-x-3">
                    <View className="flex-1 justify-between">
                      <View className="flex-row items-center gap-x-2">
                        <Text className="text-lg text-neutral-900 dark:text-darkTextPrimary flex-1 font-poppins-semibold">
                          {translate("user.discover.rewards")}
                        </Text>
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
                              <Text className="text-base font-poppins-semibold text-neutral-900 dark:text-darkTextPrimary">
                                {translate("user.discover.rewardPlaceholder.title")}
                              </Text>
                              <Text className="text-xs font-poppins text-neutral-500 dark:text-darkTextSecondary" numberOfLines={2}>
                                {translate("user.discover.rewardPlaceholder.description")}
                              </Text>
                            </View>
                            <View className="flex-row justify-start items-center mt-2">
                              <View className="flex-row items-center gap-x-2 flex-shrink">
                                <FontAwesome6 name="coins" size={12} color="#FB8500" />
                                <Text className="text-sm font-poppins-bold text-primary">
                                  {translate("user.discover.rewardPlaceholder.points", { points: "1,200" })}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </BottomSheetView>
        </BottomSheet>
      )}
    </View>
  );
}
