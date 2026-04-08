import React, { useCallback, useEffect, useState } from "react";
import {
  useColorScheme,
  ActivityIndicator,
  Modal as RNModal,
  Platform,
} from "react-native";
import { View, Text, TouchableOpacity, ScrollView } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import DateTimePicker from "@react-native-community/datetimepicker";
import Mapbox, { MapView, Camera, PointAnnotation } from "@rnmapbox/maps";
import Slider from "@react-native-community/slider";
import * as turf from "@turf/turf";
import { Modal, type ModalButton } from "@/components/modal";
import { Button } from "@/components/button";
import { TextField } from "@/components/text-field";
import { getStoreDetail, updateStoreDetail, uploadDetailImage } from "@/services/store-manager/detail-service";
import { useDetailStore, useDetailViewStore } from "@/store/store-manager/detail-store";
import { store_types_options, aspect_ratios, type PickImageType } from "@/type/store-manager/store";
import { dateToTimeString, timeStringToDate } from "@/utils/date-helpers";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

export default function EditDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { detail, setDetail } = useDetailViewStore();
  const {
    name, setName,
    type, setType,
    logo, setLogo,
    pictures, setPictures,
    phone, setPhone,
    registrationNumber, setRegistrationNumber,
    businessDoc, setBusinessDoc,
    storeOpen, setStoreOpen,
    storeClose, setStoreClose,
    address, setAddress,
    latitude, setLatitude,
    longitude, setLongitude,
    radius, setRadius,
    initFromDetail,
  } = useDetailStore();

  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [showOpenPicker, setShowOpenPicker] = useState(false);
  const [showClosePicker, setShowClosePicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modal, setModal] = useState<{ title: string; message: string; buttons: ModalButton[] } | null>(null);

  const [loadingInitial, setLoadingInitial] = useState(!detail);
  useEffect(() => {
    let cancelled = false;
    const done = () => !cancelled && setLoadingInitial(false);

    if (detail) {
      initFromDetail(detail);
      return done();
    }

    getStoreDetail(storeId)
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
        initFromDetail(data);
      })
      .catch(() => {})
      .finally(done);

    return () => {
      cancelled = true;
    };
  }, [storeId, detail, setDetail, initFromDetail]);

  const showError = (message: string) =>
    setModal({
      title: "Something went wrong",
      message,
      buttons: [{ label: "OK", onPress: () => setModal(null), variant: "primary" }],
    });

  const pickImage = async (kind: PickImageType, index?: number) => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      showError("Photo library permission is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: aspect_ratios[kind],
      quality: 0.9,
      base64: true,
    });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) { showError("Could not read image."); return; }

    const dataUri = `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`;

    if (kind === "logo") { setLogo(dataUri); return; }
    if (kind === "business_document") { setBusinessDoc(dataUri); return; }
    if (kind === "picture" && index !== undefined) {
      setPictures((() => {
        const next = [...pictures];
        next[index] = dataUri;
        return next;
      })());
    }
  };

  const parsedLat = latitude ? Number(latitude) : NaN;
  const parsedLng = longitude ? Number(longitude) : NaN;
  const hasPin = Number.isFinite(parsedLat) && Number.isFinite(parsedLng);

  const radiusCircle = React.useMemo(() => {
    if (!hasPin) return null;
    return turf.circle([parsedLng, parsedLat], ((radius ?? 50) || 50) / 1000, { steps: 64, units: "kilometers" });
  }, [hasPin, parsedLat, parsedLng, radius]);

  const handleGetCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") { showError("Location permission is required."); return; }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null);
    if (!loc) { showError("Could not get location."); return; }
    setLatitude(String(loc.coords.latitude));
    setLongitude(String(loc.coords.longitude));
  };

  const uploadDataUri = useCallback(
    async (uri: string, kind: "logo" | "picture" | "business_document"): Promise<string> => {
      if (!uri.startsWith("data:")) return uri;
      const [header, b64] = uri.split(",");
      const mt = header.split(":")[1]?.split(";")[0] ?? "image/jpeg";
      return uploadDetailImage(storeId, kind, b64, mt);
    },
    [storeId]
  );

  const handleSave = async () => {
    if (!logo) {
      showError("Store logo is required. Please upload a logo before saving.");
      return;
    }
    if (!name.trim()) { showError("Store name is required."); return; }
    if (!type) { showError("Please select a store type."); return; }

    const validPics = pictures.filter(Boolean) as string[];
    if (validPics.length === 0) { showError("Please upload at least 1 store picture."); return; }

    setIsSaving(true);
    try {
      setIsUploading(true);
      const uploadedLogo = logo ? await uploadDataUri(logo, "logo") : null;
      const uploadedPics = await Promise.all(validPics.map((p) => uploadDataUri(p, "picture")));
      const uploadedDoc = businessDoc ? await uploadDataUri(businessDoc, "business_document") : null;
      setIsUploading(false);

      await updateStoreDetail(storeId, {
        name: name.trim(),
        type,
        logo: uploadedLogo,
        store_pictures: uploadedPics.length > 0 ? uploadedPics : null,
        phone: phone.trim() || null,
        registration_number: registrationNumber.trim() || null,
        business_document_image: uploadedDoc,
        store_open: storeOpen || null,
        store_close: storeClose || null,
        address: address.trim() || null,
        latitude: hasPin ? parsedLat : null,
        longitude: hasPin ? parsedLng : null,
        radius: radius || null,
      });

      setDetail(null);
      initFromDetail(null);
      setModal({
        title: "Saved",
        message: "Store details updated successfully.",
        buttons: [{ label: "Done", onPress: () => { setModal(null); router.back(); }, variant: "primary" }],
      });
    } catch (err: any) {
      showError(err?.message ?? "Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  if (loadingInitial) {
    return (
      <View className="flex-1 bg-backgroundMuted dark:bg-backgroundMuted items-center justify-center">
        <ActivityIndicator size="large" color="#FF6600" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-backgroundMuted dark:bg-backgroundMuted">
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
      />

      {/* Header */}
      <View
        className="bg-background dark:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-700"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
      >
        <View className="flex-row items-center px-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center"
            activeOpacity={0.7}
          >
            <MaterialIcons name="chevron-left" size={22} color={isDark ? "#F1F5F9" : "#0F172A"} />
          </TouchableOpacity>
          <View className="flex-1 items-center justify-center -ml-10">
            <Text className="text-md font-poppins-bold text-textPrimary dark:text-textPrimary">
              Edit Details
            </Text>
            <Text className="text-xs font-poppins text-textMuted dark:text-textMuted -mt-1">
              Store, business & location
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 20 }}
      >
        <View className="bg-white dark:bg-neutral-800 rounded-2xl border border-slate-100 dark:border-neutral-700 p-4 gap-y-4">
          <View className="gap-y-4">
            <TextField
              label="Store Name"
              placeholder="e.g. Blue Bottle Coffee"
              value={name}
              onChangeText={setName}
              sanitize={(v) => v}
            />

            <View className="gap-y-2">
              <Text className="text-sm font-poppins-semibold text-textSecondary dark:text-textSecondary mb-1.5">Store Type</Text>
              <View className="flex-row flex-wrap gap-2">
                {store_types_options.map((opt) => {
                  const selected = type === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => setType(opt.value)}
                      activeOpacity={0.8}
                      className={`px-3.5 py-1.5 rounded-full bg-white ${
                        selected
                          ? "border border-primary"
                          : "border border-slate-100 dark:border-slate-800"
                      }`}
                    >
                      <Text
                        className={`text-xs font-poppins-semibold ${
                          selected
                            ? 'text-primary'
                            : 'text-textSecondary dark:text-textSecondary'
                        }`}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Opening / Closing times */}
            <View className="flex-row gap-x-3">
              <View className="flex-1">
                <Text className="text-sm font-poppins-semibold text-textSecondary dark:text-textSecondary mb-1.5">Opening Time</Text>
                <TouchableOpacity
                  onPress={() => setShowOpenPicker(true)}
                  activeOpacity={0.8}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 justify-center h-[45px]"
                >
                  <Text className="font-poppins text-slate-900 dark:text-slate-100">{storeOpen || "09:00"}</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-1">
                <Text className="text-sm font-poppins-semibold text-textSecondary dark:text-textSecondary mb-1.5">Closing Time</Text>
                <TouchableOpacity
                  onPress={() => setShowClosePicker(true)}
                  activeOpacity={0.8}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 justify-center h-[45px]"
                >
                  <Text className="font-poppins text-slate-900 dark:text-slate-100">{storeClose || "21:00"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Opening time picker */}
            {showOpenPicker && (
              Platform.OS === "android" ? (
                <DateTimePicker
                  value={timeStringToDate(storeOpen || "09:00", 9, 0)}
                  mode="time"
                  onChange={(_, d) => { if (d) setStoreOpen(dateToTimeString(d)); setShowOpenPicker(false); }}
                />
              ) : (
                <RNModal visible transparent animationType="slide">
                  <TouchableOpacity className="flex-1 bg-black/40 justify-end" activeOpacity={1} onPress={() => setShowOpenPicker(false)}>
                    <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-800 rounded-t-2xl pb-8 pt-2">
                      <DateTimePicker value={timeStringToDate(storeOpen || "09:00", 9, 0)} mode="time" onChange={(_, d) => { if (d) setStoreOpen(dateToTimeString(d)); }} />
                      <View className="px-4"><Button label="Done" onPress={() => setShowOpenPicker(false)} variant="primary" fullWidth /></View>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </RNModal>
              )
            )}

            {/* Closing time picker */}
            {showClosePicker && (
              Platform.OS === "android" ? (
                <DateTimePicker
                  value={timeStringToDate(storeClose || "21:00", 21, 0)}
                  mode="time"
                  onChange={(_, d) => { if (d) setStoreClose(dateToTimeString(d)); setShowClosePicker(false); }}
                />
              ) : (
                <RNModal visible transparent animationType="slide">
                  <TouchableOpacity className="flex-1 bg-black/40 justify-end" activeOpacity={1} onPress={() => setShowClosePicker(false)}>
                    <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-800 rounded-t-2xl pb-8 pt-2">
                      <DateTimePicker value={timeStringToDate(storeClose || "21:00", 21, 0)} mode="time" onChange={(_, d) => { if (d) setStoreClose(dateToTimeString(d)); }} />
                      <View className="px-4"><Button label="Done" onPress={() => setShowClosePicker(false)} variant="primary" fullWidth /></View>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </RNModal>
              )
            )}
          </View>
          <View className="h-px bg-slate-100 dark:bg-neutral-700" />
          <View>
            <Text className="text-sm font-poppins-semibold text-textSecondary dark:text-textSecondary mb-1.5">Store Logo</Text>
            <View className="flex-row items-center gap-x-3">
              <TouchableOpacity
                onPress={() => pickImage("logo")}
                activeOpacity={0.85}
                className="relative overflow-hidden rounded-xl border-2 border-dashed border-slate-300 dark:border-neutral-600 bg-slate-50 dark:bg-neutral-900"
                style={{ width: 80, height: 80 }}
              >
                {logo ? (
                  <>
                    <Image source={{ uri: logo }} style={{ width: 80, height: 80 }} contentFit="cover" />
                    <TouchableOpacity
                      onPress={() => setLogo(null)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 items-center justify-center"
                      activeOpacity={0.8}
                    >
                      <MaterialIcons name="close" size={13} color="#fff" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <View className="flex-1 items-center justify-center gap-y-1">
                    <MaterialIcons name="add-a-photo" size={20} color="#94A3B8" />
                    <Text className="text-[9px] font-poppins text-slate-400">Logo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Pictures */}
          <View>
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-sm font-poppins-semibold text-textSecondary dark:text-textSecondary mb-1.5">Store Pictures</Text>
            </View>
            <View className="flex-row gap-x-2">
              {[0, 1, 2].map((i) => {
                const uri = pictures[i];
                return (
                  <View key={i} className="flex-1 aspect-square">
                    {uri ? (
                      <View className="flex-1 rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-700 relative">
                        <Image source={{ uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                        <TouchableOpacity
                          onPress={() => { const next = [...pictures]; next[i] = null; setPictures(next); }}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/55 items-center justify-center"
                          activeOpacity={0.85}
                        >
                          <MaterialIcons name="close" size={13} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => pickImage("picture", i)}
                          className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-black/55 items-center justify-center"
                          activeOpacity={0.85}
                        >
                          <MaterialIcons name="edit" size={11} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => pickImage("picture", i)}
                        className="flex-1 rounded-xl border-2 border-dashed border-slate-300 dark:border-neutral-600 bg-slate-50 dark:bg-neutral-900 items-center justify-center min-h-[84px]"
                        activeOpacity={0.8}
                      >
                        <MaterialIcons name="add-a-photo" size={20} color="#94A3B8" />
                        <Text className="text-[9px] font-poppins text-slate-400 mt-0.5">Add</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
          <View className="h-px bg-slate-100 dark:bg-neutral-700" />
          <TextField
            label="Phone Number"
            placeholder="0912 - 234 - 5678"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <TextField
            label="Business Registration Number"
            placeholder="e.g. TAX-ID-123456"
            value={registrationNumber}
            onChangeText={setRegistrationNumber}
            sanitize={(v) => v}
          />

          <View>
            <Text className="text-sm font-poppins-semibold text-textSecondary dark:text-textSecondary mb-1.5">Business Document</Text>
            <TouchableOpacity
              onPress={() => { if (!businessDoc) pickImage("business_document"); }}
              disabled={!!businessDoc}
              activeOpacity={0.85}
              className="w-full rounded-xl border-2 border-dashed border-slate-300 dark:border-neutral-600 bg-slate-50 dark:bg-neutral-900 overflow-hidden items-center justify-center"
              style={{ height: 160 }}
            >
              {businessDoc ? (
                <>
                  <Image source={{ uri: businessDoc }} style={{ width: "100%", height: "100%" }} contentFit="contain" />
                  <TouchableOpacity
                    onPress={() => setBusinessDoc(null)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 items-center justify-center"
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="close" size={15} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => pickImage("business_document")}
                    className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/60 items-center justify-center"
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="edit" size={13} color="#fff" />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <MaterialIcons name="description" size={26} color="#94A3B8" />
                  <Text className="text-xs font-poppins text-slate-400 mt-1.5">Upload document image</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          <View className="h-px bg-slate-100 dark:bg-neutral-700" />

          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-poppins-semibold text-textSecondary dark:text-textSecondary">
              Location
            </Text>
            <TouchableOpacity
              onPress={handleGetCurrentLocation}
              className="flex-row items-center gap-x-1"
              activeOpacity={0.8}
            >
              <MaterialIcons name="my-location" size={14} color="#FF6600" />
              <Text className="text-xs font-poppins-semibold text-textPrimary dark:text-textPrimary">Use Current</Text>
            </TouchableOpacity>
          </View>

          <View className="rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-700" style={{ height: 280 }}>
            <MapView
              style={{ height: 280, width: "100%" }}
              styleURL={isDark ? "mapbox://styles/mapbox/navigation-night-v1" : "mapbox://styles/mapbox/streets-v12"}
              onPress={(e) => {
                const coords = (e as any)?.geometry?.coordinates as [number, number] | undefined;
                if (!coords) return;
                const [lng, lat] = coords;
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
                setLatitude(String(lat));
                setLongitude(String(lng));
              }}
              onTouchStart={() => setScrollEnabled(false)}
              onTouchEnd={() => setScrollEnabled(true)}
              onTouchCancel={() => setScrollEnabled(true)}
            >
              <Camera
                zoomLevel={hasPin ? 14 : 12}
                centerCoordinate={hasPin ? [parsedLng, parsedLat] : [123.8854, 10.3157]}
              />
              {hasPin && (
                <PointAnnotation id="pin" coordinate={[parsedLng, parsedLat]}>
                  <View className="w-4 h-4 bg-orange-500 rounded-full border-2 border-white" />
                </PointAnnotation>
              )}
              {radiusCircle && (
                <Mapbox.ShapeSource id="radius" shape={radiusCircle}>
                  <Mapbox.FillLayer id="radiusFill" style={{ fillColor: "#FF6600", fillOpacity: 0.14 }} />
                </Mapbox.ShapeSource>
              )}
            </MapView>
            <View className="absolute bottom-2 left-2 bg-black/50 rounded-lg px-2 py-1">
              <Text style={{ color: "#fff", fontSize: 10, fontFamily: "Poppins-Regular" }}>
                Tap map to move pin
              </Text>
            </View>
          </View>

          <TextField
            label="Address / Landmark"
            placeholder="Enter full physical address"
            value={address}
            onChangeText={setAddress}
            multiline
            sanitize={(v) => v}
          />

          <View>
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-sm font-poppins-semibold text-textSecondary dark:text-textSecondary mb-1.5">Store Radius</Text>
              <Text className="text-sm font-poppins-bold text-primary">{radius}m</Text>
            </View>
            <Slider
              minimumValue={50}
              maximumValue={500}
              step={1}
              value={radius}
              onValueChange={(v) => setRadius(Math.round(v))}
              minimumTrackTintColor="#FF6600"
              maximumTrackTintColor={isDark ? "#334155" : "#E2E8F0"}
              thumbTintColor="#FF6600"
            />
            <View className="flex-row justify-between">
              <Text className="text-xs font-poppins text-slate-400">50m</Text>
              <Text className="text-xs font-poppins text-slate-400">500m</Text>
            </View>
          </View>
          <View className="h-px bg-slate-100 dark:bg-neutral-700" />

          <View className="gap-y-3">
            <Button
              label={isUploading ? "Uploading images…" : "Save Changes"}
              onPress={handleSave}
              variant="primary"
              loading={isSaving}
              fullWidth
              disabled={isSaving}
            />
            <Button
              label="Cancel"
              onPress={() => router.back()}
              variant="secondary"
              fullWidth
              disabled={isSaving}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
