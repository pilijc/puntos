import { Text, SafeAreaView, View, Image } from "@/tw";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Mapbox, { MapView, PointAnnotation } from "@rnmapbox/maps";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { AppState, AppStateStatus, TextInput, TouchableOpacity, useColorScheme, Platform } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import * as Location from "expo-location";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { getRouteService, getSearchResultsService } from "@/services/discover-service";
import { useStoreStore } from "@/store/user/store-store";
import { Store } from "@/type/user/store";
import type * as GeoJSON from "geojson";
import { getOneSignalId, sendPushNotification, isOneSignalNativeAvailable } from "@/services/push-service";
import { getCurrentLocation, isStoreNearby, watchHeading, watchLocation } from "@/services/user/location-service";
import type { UserLocation } from "@/services/user/location-service";
import * as turf from "@turf/turf";
import { getStores } from "@/services/store-service";
import { storeIconKey } from "@/type/user/discover";
import { useTranslation } from "react-i18next";
import { useLanguageStore } from "@/store/language-store";
import { useProfile } from "@/hooks/user/use-profile";
import { X } from "lucide-react-native";
import { MapControlButtons } from "@/components/map/map-control-buttons";

let OneSignal: typeof import("react-native-onesignal").OneSignal | null = null;

if (Platform.OS !== "web") {
  OneSignal = require("react-native-onesignal").OneSignal;
}

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN);

const HEADING_SMOOTHING_FACTOR = 0.2;
const HEADING_CAMERA_MIN_DELTA_DEG = 1.25;
const HEADING_CAMERA_THROTTLE_MS = 120;

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function shortestHeadingDelta(from: number, to: number): number {
  return ((to - from + 540) % 360) - 180;
}

function smoothHeading(current: number | null, next: number): number {
  if (current == null) return normalizeDegrees(next);
  return normalizeDegrees(current + shortestHeadingDelta(current, next) * HEADING_SMOOTHING_FACTOR);
}

function mapboxStyleUrlToApiUrl(styleUrl: string): string | null {
  const accessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const match = styleUrl.match(/^mapbox:\/\/styles\/([^/]+)\/(.+)$/);
  if (!accessToken || !match) return null;

  const [, owner, styleId] = match;
  return `https://api.mapbox.com/styles/v1/${owner}/${styleId}?access_token=${encodeURIComponent(accessToken)}`;
}

function expressionReadsNameField(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  if (value[0] === "get" && typeof value[1] === "string" && value[1].startsWith("name")) {
    return true;
  }

  return value.some(expressionReadsNameField);
}

function localizedTextField(locale: "en" | "ja") {
  const primaryField = locale === "ja" ? "name_ja" : "name_en";
  return ["coalesce", ["get", primaryField], ["get", "name_en"], ["get", "name"]];
}

async function loadLocalizedMapStyle(styleUrl: string, locale: "en" | "ja"): Promise<string | null> {
  const apiUrl = mapboxStyleUrlToApiUrl(styleUrl);
  if (!apiUrl) return null;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`Mapbox style request failed with ${response.status}`);
  }

  const style = await response.json();
  if (!Array.isArray(style.layers)) return JSON.stringify(style);

  style.layers = style.layers.map((layer: any) => {
    const textField = layer?.layout?.["text-field"];
    if (layer?.type !== "symbol" || !expressionReadsNameField(textField)) {
      return layer;
    }

    return {
      ...layer,
      layout: {
        ...layer.layout,
        "text-field": localizedTextField(locale),
      },
    };
  });

  return JSON.stringify(style);
}

export default function Discover() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const cameraRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [location, setLocation] = useState<UserLocation | null>(null);
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
  const headingWatchRef = useRef<Location.LocationSubscription | null>(null);
  const headingRef = useRef<number | null>(null);
  const locationRef = useRef<UserLocation | null>(null);
  const isHeadingUpEnabledRef = useRef(false);
  const cameraHeadingRef = useRef<number | null>(null);
  const lastCameraHeadingUpdateRef = useRef(0);
  const hasCenteredOnUserRef = useRef(false);
  const isFollowingRef = useRef(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [mapHeading, setMapHeading] = useState(0);
  const [isHeadingUpEnabled, setIsHeadingUpEnabled] = useState(false);
  const [userHeading, setUserHeading] = useState<number | null>(null);
  const [localizedMapStyleJSON, setLocalizedMapStyleJSON] = useState<string | null>(null);
  const { t: translate } = useTranslation();
  const language = useLanguageStore((s) => s.language);
  const { preferences } = useProfile();

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  const discoverMoreStores = useMemo(() => {
    if (!location) return [];
    const user = turf.point([location.longitude, location.latitude]);
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

  const userLocationFeature = useMemo<GeoJSON.Feature<GeoJSON.Point> | null>(() => {
    if (!location) return null;

    const { latitude, longitude } = location;
    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return null;
    }

    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      properties: {
        bearing:
          typeof userHeading === "number" && Number.isFinite(userHeading)
            ? userHeading
            : typeof location.heading === "number" && Number.isFinite(location.heading)
              ? location.heading
              : 0,
      },
    };
  }, [location, userHeading]);

  const setSmoothedHeading = useCallback((nextHeading: number) => {
    const smoothed = smoothHeading(headingRef.current, nextHeading);
    headingRef.current = smoothed;
    setUserHeading(smoothed);
    return smoothed;
  }, []);

  const maybeRotateCameraToHeading = useCallback((heading: number) => {
    if (!isHeadingUpEnabledRef.current || !isFollowingRef.current) return;

    const now = Date.now();
    const previousHeading = cameraHeadingRef.current;
    const delta = previousHeading == null
      ? Number.POSITIVE_INFINITY
      : Math.abs(shortestHeadingDelta(previousHeading, heading));

    if (
      previousHeading != null &&
      delta < HEADING_CAMERA_MIN_DELTA_DEG &&
      now - lastCameraHeadingUpdateRef.current < 350
    ) {
      return;
    }

    if (now - lastCameraHeadingUpdateRef.current < HEADING_CAMERA_THROTTLE_MS) return;

    cameraHeadingRef.current = heading;
    lastCameraHeadingUpdateRef.current = now;
    cameraRef.current?.setCamera({
      heading,
      animationDuration: 180,
      animationMode: "easeTo",
    });
  }, []);

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
    if (!isOneSignalNativeAvailable() || !OneSignal) return;
  
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
  
          const allStores = useStoreStore.getState().stores;
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
      OneSignal?.Notifications.removeEventListener("click", handleNotificationClick);
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

    const stopLocationWatch = () => {
      locationWatchRef.current?.remove();
      locationWatchRef.current = null;
    };

    const stopHeadingWatch = () => {
      headingWatchRef.current?.remove();
      headingWatchRef.current = null;
    };

    const startLocationWatch = async () => {
      stopLocationWatch();
      stopHeadingWatch();

      if (!preferences.location_enabled) {
        setLocation(null);
        locationRef.current = null;
        headingRef.current = null;
        setUserHeading(null);
        return;
      }

      const initial = await getCurrentLocation();
      if (initial && !cancelled) {
        if (typeof initial.heading === "number" && Number.isFinite(initial.heading)) {
          setSmoothedHeading(initial.heading);
        }
        const nextLocation = {
          ...initial,
          heading: headingRef.current ?? initial.heading,
        };
        locationRef.current = nextLocation;
        setLocation(nextLocation);
      }

      const headingSub = await watchHeading(
        ({ heading }) => {
          if (cancelled) return;
          const smoothed = setSmoothedHeading(heading);
          if (locationRef.current) {
            locationRef.current = {
              ...locationRef.current,
              heading: smoothed,
            };
          }
          maybeRotateCameraToHeading(smoothed);
        },
        { requestPermission: false },
      );

      if (!cancelled) {
        headingWatchRef.current = headingSub;
      } else {
        headingSub?.remove();
      }

      const sub = await watchLocation(
        async (position) => {
          if (cancelled) return;

          try {
            if (typeof position.heading === "number" && Number.isFinite(position.heading) && headingRef.current == null) {
              setSmoothedHeading(position.heading);
            }

            const nextLocation = {
              ...position,
              heading: headingRef.current ?? position.heading,
            };
            locationRef.current = nextLocation;
            setLocation(nextLocation);

            // Follow mode — re-center the camera every time location updates
            if (isFollowingRef.current) {
              cameraRef.current?.setCamera({
                centerCoordinate: [position.longitude, position.latitude],
                heading: isHeadingUpEnabledRef.current
                  ? headingRef.current ?? position.heading ?? undefined
                  : undefined,
                zoomLevel: 16,
                animationDuration: 400,
                animationMode: "easeTo",
              });
            }

            // Skip push notification geofencing if user has disabled location settings
            if (!preferences?.location_enabled) return;

            const { latitude: uLat, longitude: uLon } = position;
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

            nearbyStoreIds.forEach((id) => notifiedStoreIds.current.add(id));

          } catch (err) {
            console.error("[Geofence] Error in location callback:", err);
          }
        },
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 1000,
          distanceInterval: 0,
          requestPermission: true,
        },

      );

      if (!cancelled) {
        locationWatchRef.current = sub;
      } else {
        sub?.remove();
      }
    };

    startLocationWatch();

    const appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        startLocationWatch();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        stopLocationWatch();
        stopHeadingWatch();
      }
    });

    return () => {
      cancelled = true;
      appStateSubscription.remove();
      stopLocationWatch();
      stopHeadingWatch();
    };
  }, [maybeRotateCameraToHeading, preferences.location_enabled, setSmoothedHeading, translate]);

  const centerOnUser = useCallback(async () => {
    let targetLocation = location;

    if (!targetLocation) {
      targetLocation = await getCurrentLocation();
      if (targetLocation) setLocation(targetLocation);
    }

    if (!targetLocation) return;

    setSelectedSearchResult(null);
    isFollowingRef.current = true;
    setIsFollowing(true);
    const heading = isHeadingUpEnabledRef.current ? headingRef.current ?? targetLocation.heading : undefined;
    cameraRef.current?.setCamera({
      centerCoordinate: [targetLocation.longitude, targetLocation.latitude],
      zoomLevel: 16,
      heading,
      animationDuration: 650,
      animationMode: "easeTo",
    });
    if (typeof heading === "number" && Number.isFinite(heading)) {
      cameraHeadingRef.current = heading;
    }
    hasCenteredOnUserRef.current = true;
  }, [location]);

  const orientNorth = useCallback(() => {
    isHeadingUpEnabledRef.current = false;
    setIsHeadingUpEnabled(false);
    cameraHeadingRef.current = 0;
    lastCameraHeadingUpdateRef.current = Date.now();
    cameraRef.current?.setCamera({
      heading: 0,
      animationDuration: 350,
      animationMode: "easeTo",
    });
    setMapHeading(0);
  }, []);

  const toggleHeadingUp = useCallback(() => {
    const nextEnabled = !isHeadingUpEnabledRef.current;
    isHeadingUpEnabledRef.current = nextEnabled;
    setIsHeadingUpEnabled(nextEnabled);
    if (!nextEnabled) return;

    const heading = headingRef.current ?? userHeading;
    const currentLocation = locationRef.current;
    if (currentLocation) {
      isFollowingRef.current = true;
      setIsFollowing(true);
    }

    cameraHeadingRef.current = heading ?? null;
    lastCameraHeadingUpdateRef.current = Date.now();
    cameraRef.current?.setCamera({
      ...(currentLocation
        ? {
            centerCoordinate: [currentLocation.longitude, currentLocation.latitude],
            zoomLevel: 16,
          }
        : {}),
      heading: heading ?? mapHeading,
      animationDuration: 350,
      animationMode: "easeTo",
    });
  }, [mapHeading, userHeading]);

  useEffect(() => {
    if (!mapReady || !location || hasCenteredOnUserRef.current || selectedSearchResult) return;

    cameraRef.current?.setCamera({
      centerCoordinate: [location.longitude, location.latitude],
      zoomLevel: 16,
      heading: isHeadingUpEnabledRef.current ? headingRef.current ?? location.heading ?? 0 : 0,
      animationDuration: 1000,
      animationMode: "easeTo",
    });
    hasCenteredOnUserRef.current = true;
    isFollowingRef.current = true;
    setIsFollowing(true);
  }, [mapReady, location, selectedSearchResult]);

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
    isFollowingRef.current = false;
    setIsFollowing(false);
    bottomSheetRef.current?.snapToIndex(1);

    if (!location) return;
    const start: [number, number] = [location.longitude, location.latitude];
    const end: [number, number] = [store.longitude, store.latitude];
    const route = await getRouteService(start, end);
    setRouteGeoJSON(route ?? null);
    setRouteDrawProgress(0);
    cameraRef.current?.fitBounds(start, end, 80, 1000);
  };

  const handleSearchResultPress = (result: any) => {
    setSelectedSearchResult(result);
    setSearchResults([]);
    isFollowingRef.current = false;
    setIsFollowing(false);
    cameraRef.current?.setCamera({
      centerCoordinate: result.center,
      zoomLevel: 14,
      animationDuration: 1000,
      animationMode: "flyTo",
    });
  };


  const storeFeatures = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: "FeatureCollection",
    features: stores
      .filter((s) => Number.isFinite(s.longitude) && Number.isFinite(s.latitude))
      .map((s) => ({
        type: "Feature",
        id: s.id,
        geometry: {
          type: "Point",
          coordinates: [s.longitude!, s.latitude!],
        },
        properties: {
          storeId: String(s.id),
          icon: storeIconKey(s.type),
        },
      })),
  }), [stores]);

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
  const normalizedHeading = ((mapHeading % 360) + 360) % 360;
  const isNorthUp = normalizedHeading < 1 || normalizedHeading > 359;
  const mapboxLocale = language === "ja" ? "ja" : "en";
  const mapStyleURL = isDark ? "mapbox://styles/mapbox/navigation-night-v1" : "mapbox://styles/mapbox/streets-v12";

  useEffect(() => {
    let cancelled = false;
    setLocalizedMapStyleJSON(null);

    loadLocalizedMapStyle(mapStyleURL, mapboxLocale)
      .then((styleJSON) => {
        if (!cancelled) setLocalizedMapStyleJSON(styleJSON);
      })
      .catch((error) => {
        console.warn("[Mapbox] Failed to localize style JSON:", error);
        if (!cancelled) setLocalizedMapStyleJSON(null);
      });

    return () => {
      cancelled = true;
    };
  }, [mapStyleURL, mapboxLocale]);

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
        key={`${mapStyleURL}:${mapboxLocale}:${localizedMapStyleJSON ? "localized" : "remote"}`}
        style={{ flex: 1 }}
        onDidFinishLoadingMap={() => setMapReady(true)}
        onCameraChanged={(state) => {
          const nextHeading = state.properties.heading;
          setMapHeading(nextHeading);
          if (state.gestures.isGestureActive && isFollowingRef.current) {
            isFollowingRef.current = false;
            setIsFollowing(false);
          }
        }}
        styleURL={localizedMapStyleJSON ? undefined : mapStyleURL}
        styleJSON={localizedMapStyleJSON ?? undefined}
      >
        <Mapbox.Images
          images={{
            bar: require("../../assets/images/markers/bar.png"),
            coffee: require("../../assets/images/markers/cafe.png"),
            restaurant: require("../../assets/images/markers/restau.png"),
            market: require("../../assets/images/markers/market.png"),
            shop: require("../../assets/images/markers/shop.png"),
            default: require("../../assets/images/markers/default.png"),
          }}
          nativeAssetImages={[]}
        >
          {/* Heading cone: a soft blue teardrop wedge rendered as a RN view */}
          <Mapbox.Image name="heading-cone">
            <View
              style={{
                width: 24,
                height: 32,
                alignItems: "center",
                justifyContent: "flex-start",
                overflow: "hidden",
              }}
            >
              {/* Triangle shape via borders */}
              <View
                style={{
                  width: 0,
                  height: 0,
                  borderLeftWidth: 12,
                  borderRightWidth: 12,
                  borderBottomWidth: 28,
                  borderLeftColor: "transparent",
                  borderRightColor: "transparent",
                  borderBottomColor: "rgba(37, 99, 235, 0.45)",
                }}
              />
            </View>
          </Mapbox.Image>
        </Mapbox.Images>
        <Mapbox.Camera
          ref={cameraRef}
          animationMode="easeTo"
          animationDuration={300}
        />

        {userLocationFeature && (
          <Mapbox.ShapeSource id="currentUserLocationSource" shape={userLocationFeature}>
            {/* Heading cone — sits below the dot, rotates with device bearing */}
            <Mapbox.SymbolLayer
              id="currentUserHeadingCone"
              style={{
                iconImage: "heading-cone",
                iconSize: 1,
                iconRotate: ["get", "bearing"],
                iconRotationAlignment: "map",
                iconPitchAlignment: "map",
                iconAllowOverlap: true,
                iconIgnorePlacement: true,
                iconOffset: [0, -18],
              }}
            />
            {/* Accuracy halo */}
            <Mapbox.CircleLayer
              id="currentUserAccuracyHalo"
              style={{
                circleRadius: 13,
                circleColor: "#3B82F6",
                circleOpacity: 0.16,
                circlePitchAlignment: "map",
              }}
            />
            {/* Blue dot */}
            <Mapbox.CircleLayer
              id="currentUserLocationDot"
              style={{
                circleRadius: 7,
                circleColor: "#2563EB",
                circleStrokeColor: "#FFFFFF",
                circleStrokeWidth: 3,
                circlePitchAlignment: "map",
              }}
            />
          </Mapbox.ShapeSource>
        )}

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
              iconSize: 0.025,
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

      <MapControlButtons
        isFollowing={isFollowing}
        isHeadingUpEnabled={isHeadingUpEnabled}
        isNorthUp={isNorthUp}
        normalizedHeading={normalizedHeading}
        hasRoute={!!routeGeoJSON}
        onCenterPress={centerOnUser}
        onHeadingUpPress={toggleHeadingUp}
        onNorthPress={orientNorth}
      />

      {routeGeoJSON && (
        <TouchableOpacity
          className="absolute right-4 top-[148px] z-50 rounded-full border border-slate-200 bg-white p-2 shadow-lg dark:border-neutral-600 dark:bg-darkBackgroundMuted"
          onPress={() => {
            setRouteGeoJSON(null);
            setSelectedStore(null);
            setSheetStores([]);
            setSheetView("detail");
          }}
        >
          <X size={24} strokeWidth={2.35} color="#FB8500" />
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
                          {translate("label.rewards")}
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
