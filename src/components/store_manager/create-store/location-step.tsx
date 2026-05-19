import React from "react";
import * as turf from "@turf/turf";
import { Platform } from "react-native";
import { MapPin } from "lucide-react-native";
import Slider from "@react-native-community/slider";
import { View, Text, TouchableOpacity } from "@/tw";
import { TextField } from "@/components/text-field";
import { shouldUseInteractiveMapbox } from "@/utils/mapbox-platform";
import { WebMapboxPicker } from "@/components/map/web-mapbox-picker";
import Mapbox, { MapView, Camera, PointAnnotation } from "@rnmapbox/maps";

type LocationStepProps = {
  address: string;
  setAddress: (v: string) => void;
  latitude: string;
  longitude: string;
  timezone: string;
  setTimezone: (v: string) => void;
  radius: number;
  setRadius: (v: number) => void;
  isDark: boolean;
  isResolvingTimezone: boolean;
  webMapUnavailable: boolean;
  onWebMapUnavailable: () => void;
  setPin: (lat: number, lng: number) => Promise<void>;
  onGetCurrent: () => Promise<void>;
  setScrollEnabled: (enabled: boolean) => void;
  translate: (key: string, options?: Record<string, unknown>) => string;
};

export function LocationStep({
  address,
  setAddress,
  latitude,
  longitude,
  timezone,
  setTimezone,
  radius,
  setRadius,
  isDark,
  isResolvingTimezone,
  webMapUnavailable,
  onWebMapUnavailable,
  setPin,
  onGetCurrent,
  setScrollEnabled,
  translate,
}: LocationStepProps) {
  const isWeb = Platform.OS === "web";
  const parsedLat = latitude ? Number(latitude) : NaN;
  const parsedLng = longitude ? Number(longitude) : NaN;
  const hasPin = Number.isFinite(parsedLat) && Number.isFinite(parsedLng);

  const radiusCircleFeature = React.useMemo(() => {
    if (!hasPin) return null;
    const km = (radius || 50) / 1000;
    return turf.circle([parsedLng, parsedLat], km, {
      steps: 64,
      units: "kilometers",
    });
  }, [hasPin, parsedLat, parsedLng, radius]);

  return (
    <View className="gap-2">
      <View className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 p-4 gap-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-poppins text-slate-500 dark:text-slate-400">
            {translate("storeManager.createStore.tapMapPin")}
          </Text>

          {!isWeb && (
            <TouchableOpacity
              className="flex-row items-center gap-1"
              activeOpacity={0.8}
              onPress={onGetCurrent}
            >
              <MapPin size={14} color="#FF6600" />
              <Text className="text-primary text-xs font-poppins-bold">
                {translate("storeManager.createStore.getCurrent")}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
          <View pointerEvents="box-none" style={{ minHeight: 400 }}>
            {isWeb ? (
              <>
                <WebMapboxPicker
                  latitude={hasPin ? parsedLat : null}
                  longitude={hasPin ? parsedLng : null}
                  isDark={isDark}
                  height={400}
                  markerColor="#FF6600"
                  radiusMeters={hasPin ? radius || 50 : null}
                  onChange={({ latitude: lat, longitude: lng }) =>
                    setPin(lat, lng)
                  }
                  onUnavailable={onWebMapUnavailable}
                />
                {!shouldUseInteractiveMapbox() && (
                  <View className="h-[400px] items-center justify-center gap-y-2 px-6 bg-slate-50 dark:bg-slate-900">
                    <MapPin color={isDark ? "#525252" : "#94A3B8"} />
                    <Text className="text-xs font-poppins text-center text-slate-500 dark:text-slate-400">
                      {translate("storeManager.createStore.mapFallbackWeb")}
                    </Text>
                  </View>
                )}
              </>
            ) : shouldUseInteractiveMapbox() ? (
              <MapView
                style={{ height: 400, width: "100%" }}
                styleURL={
                  isDark
                    ? "mapbox://styles/mapbox/navigation-night-v1"
                    : "mapbox://styles/mapbox/streets-v12"
                }
                onPress={async (e) => {
                  const coords = (e as any)?.geometry?.coordinates as
                    | [number, number]
                    | undefined;
                  if (!coords) return;
                  const [lng, lat] = coords;
                  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
                  await setPin(lat, lng);
                }}
                onTouchStart={() => setScrollEnabled(false)}
                onTouchEnd={() => setScrollEnabled(true)}
                onTouchCancel={() => setScrollEnabled(true)}
              >
                <Camera
                  zoomLevel={hasPin ? 15 : 18}
                  centerCoordinate={
                    hasPin ? [parsedLng, parsedLat] : [123.8854, 10.3157]
                  }
                />
                {hasPin && (
                  <PointAnnotation
                    id="storeLocation"
                    coordinate={[parsedLng, parsedLat]}
                  >
                    <View className="w-4 h-4 bg-orange-500 rounded-full border-2 border-white" />
                  </PointAnnotation>
                )}
                {radiusCircleFeature && (
                  <Mapbox.ShapeSource
                    id="storeRadius"
                    shape={radiusCircleFeature}
                  >
                    <Mapbox.FillLayer
                      id="storeRadiusFill"
                      style={{
                        fillColor: "#FF6600",
                        fillOpacity: 0.14,
                      }}
                    />
                  </Mapbox.ShapeSource>
                )}
              </MapView>
            ) : (
              <View className="h-[400px] items-center justify-center gap-y-2 px-6 bg-slate-50 dark:bg-slate-900">
                <MapPin color={isDark ? "#525252" : "#94A3B8"} />
                <Text className="text-xs font-poppins text-center text-slate-500 dark:text-slate-400">
                  {translate("storeManager.createStore.mapFallbackWeb")}
                </Text>
              </View>
            )}
          </View>
        </View>

        {isWeb && webMapUnavailable && (
          <View className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2.5 gap-2">
            <Text className="text-xs font-poppins text-amber-900 dark:text-amber-200">
              {translate("storeManager.createStore.mapUnavailableWeb")}
            </Text>
            <TouchableOpacity
              className="self-start flex-row items-center gap-1 rounded-xl bg-primary px-3 py-2"
              activeOpacity={0.8}
              onPress={onGetCurrent}
            >
              <MapPin size={14} color="#fff" />
              <Text className="text-xs font-poppins-bold text-white">
                {translate("storeManager.createStore.getCurrent")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TextField
          label={translate("storeManager.createStore.landmarkAddress")}
          required
          placeholder={translate("storeManager.createStore.addressPlaceholder")}
          value={address}
          onChangeText={setAddress}
          multiline
          sanitize={(v) => v}
        />

        {!isWeb && (
          <View className="flex-col gap-1.5 mt-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium px-1">
                {translate("storeManager.createStore.timezone")}{" "}
                <Text className="text-red-500 dark:text-red-400">*</Text>
              </Text>
              {isResolvingTimezone && (
                <Text className="text-xs text-slate-400 font-poppins italic">
                  {translate("storeManager.createStore.timezoneDetecting")}
                </Text>
              )}
            </View>
            <TextField
              placeholder={translate(
                "storeManager.createStore.timezonePlaceholder",
              )}
              value={timezone}
              onChangeText={setTimezone}
              sanitize={(v) => v}
            />
            {!isResolvingTimezone && !timezone.trim() && hasPin && (
              <Text className="text-xs text-amber-600 dark:text-amber-400 font-poppins px-1">
                {translate("storeManager.createStore.timezoneDetectFailed")}
              </Text>
            )}
            {timezone.trim() && (
              <Text className="text-xs text-slate-400 dark:text-slate-500 font-poppins px-1">
                {translate("storeManager.createStore.timezoneLocked")}
              </Text>
            )}
          </View>
        )}

        <View className="mt-2">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium">
              {translate("storeManager.createStore.storeRadius")}{" "}
              <Text className="text-red-500 dark:text-red-400">*</Text>
            </Text>
            <Text
              className={`text-primary text-sm ${
                isWeb ? "font-poppins-bold" : "font-poppins font-bold"
              }`}
            >
              {translate("storeManager.detailEdit.radiusMeters", {
                meters: radius || 50,
              })}
            </Text>
          </View>
          <Slider
            minimumValue={50}
            maximumValue={500}
            step={1}
            value={radius || 50}
            onValueChange={(v) => setRadius(Math.round(v))}
            minimumTrackTintColor="#FF6600"
            maximumTrackTintColor={isDark ? "#334155" : "#E2E8F0"}
            thumbTintColor="#FF6600"
          />
          <View className="flex-row justify-between mt-1">
            <Text className="text-xs text-slate-500 font-poppins">
              {translate("storeManager.detailEdit.radiusMin")}
            </Text>
            <Text className="text-xs text-slate-500 font-poppins">
              {translate("storeManager.detailEdit.radiusMax")}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
