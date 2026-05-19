import React, { useCallback, useEffect, useState } from "react";
import {
  useColorScheme,
  ActivityIndicator,
  Modal as RNModal,
  Platform,
  useWindowDimensions,
} from "react-native";
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from "@/tw";
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
import { shouldUseInteractiveMapbox } from "@/utils/mapbox-platform";
import { AppHeader } from "@/components/header";
import { WebMapboxPicker } from "@/components/map/web-mapbox-picker";
import { useTranslation } from "react-i18next";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

const WEB_MAX_WIDTH = 896;

const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES_5 = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

function WebTimePicker({
  value,
  onChange,
  isDark,
}: {
  value: string | null | undefined;
  onChange: (v: string) => void;
  isDark: boolean;
}) {
  const [showH, setShowH] = useState(false);
  const [showM, setShowM] = useState(false);

  const parts = (value || "09:00").split(":");
  const currentH = (parts[0] ?? "09").padStart(2, "0");
  const rawM = parseInt(parts[1] ?? "0", 10);
  const currentM = String(Math.min(55, Math.round(rawM / 5) * 5)).padStart(2, "0");

  const dropBg = isDark ? "#262626" : "#fff";

  return (
    <View className="flex-row items-center gap-x-2">
      {/* Hour */}
      <View style={{ flex: 1, zIndex: 20 }}>
        <TouchableOpacity
          onPress={() => { setShowH(!showH); setShowM(false); }}
          activeOpacity={0.8}
          className="flex-row items-center justify-between rounded-xl border border-slate-200 dark:border-darkBorder bg-white dark:bg-darkBackgroundMuted px-3 h-[42px]"
        >
          <Text className="font-poppins text-slate-900 dark:text-darkTextPrimary">{currentH}</Text>
          <MaterialIcons name={showH ? "expand-less" : "expand-more"} size={16} color="#94A3B8" />
        </TouchableOpacity>
        {showH && (
          <ScrollView
            style={{ position: "absolute", top: 46, left: 0, right: 0, zIndex: 30, backgroundColor: dropBg, borderRadius: 12, maxHeight: 160, borderWidth: 1, borderColor: isDark ? "#404040" : "#e2e8f0" }}
            showsVerticalScrollIndicator={false}
          >
            {HOURS_24.map((h) => (
              <TouchableOpacity
                key={h}
                onPress={() => { onChange(`${h}:${currentM}`); setShowH(false); }}
                style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: h === currentH ? "rgba(255,102,0,0.1)" : "transparent" }}
              >
                <Text style={{ fontFamily: h === currentH ? "Poppins-SemiBold" : "Poppins", fontSize: 13, color: h === currentH ? "#FF6600" : isDark ? "#f1f5f9" : "#1e293b" }}>
                  {h}:00
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <Text className="font-poppins-semibold text-slate-400 text-base">:</Text>

      {/* Minute */}
      <View style={{ flex: 1, zIndex: 20 }}>
        <TouchableOpacity
          onPress={() => { setShowM(!showM); setShowH(false); }}
          activeOpacity={0.8}
          className="flex-row items-center justify-between rounded-xl border border-slate-200 dark:border-darkBorder bg-white dark:bg-darkBackgroundMuted px-3 h-[42px]"
        >
          <Text className="font-poppins text-slate-900 dark:text-darkTextPrimary">{currentM}</Text>
          <MaterialIcons name={showM ? "expand-less" : "expand-more"} size={16} color="#94A3B8" />
        </TouchableOpacity>
        {showM && (
          <ScrollView
            style={{ position: "absolute", top: 46, left: 0, right: 0, zIndex: 30, backgroundColor: dropBg, borderRadius: 12, maxHeight: 160, borderWidth: 1, borderColor: isDark ? "#404040" : "#e2e8f0" }}
            showsVerticalScrollIndicator={false}
          >
            {MINUTES_5.map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => { onChange(`${currentH}:${m}`); setShowM(false); }}
                style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: m === currentM ? "rgba(255,102,0,0.1)" : "transparent" }}
              >
                <Text style={{ fontFamily: m === currentM ? "Poppins-SemiBold" : "Poppins", fontSize: 13, color: m === currentM ? "#FF6600" : isDark ? "#f1f5f9" : "#1e293b" }}>
                  :{m}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

export default function EditDetails() {
  const { t: translate } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { width: windowWidth } = useWindowDimensions();
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
    reset,
  } = useDetailStore();

  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [showOpenPicker, setShowOpenPicker] = useState(false);
  const [showClosePicker, setShowClosePicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modal, setModal] = useState<{ title: string; message: string; buttons: ModalButton[] } | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(!detail);
  const isWeb = Platform.OS === "web";

  // Responsive map height: limited on mobile, fixed on web
  const mapHeight = isWeb ? 280 : Math.min(220, windowWidth * 0.55);

  useEffect(() => {
    let cancelled = false;
    const done = () => !cancelled && setLoadingInitial(false);

    if (detail) {
      initFromDetail(detail);
      return done();
    }

    reset();

    getStoreDetail(storeId)
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
        initFromDetail(data);
      })
      .catch(() => {
        if (cancelled) return;
        setDetail(null);
        reset();
        setModal({
          title: translate("storeManager.detailEdit.loadFailedTitle"),
          message: translate("storeManager.detailEdit.loadFailedMessage"),
          buttons: [{ label: translate("label.ok"), onPress: () => setModal(null), variant: "primary" }],
        });
      })
      .finally(done);

    return () => {
      cancelled = true;
    };
  }, [storeId, detail, setDetail, initFromDetail, reset, translate]);

  const showError = (message: string) =>
    setModal({
      title: translate("storeManager.detailEdit.errorTitle"),
      message,
      buttons: [{ label: translate("label.ok"), onPress: () => setModal(null), variant: "primary" }],
    });

  const pickImage = async (kind: PickImageType, index?: number) => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      showError(translate("storeManager.detailEdit.photoLibraryPermission"));
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
    if (!asset.base64) { showError(translate("storeManager.detailEdit.couldNotReadImage")); return; }

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
    if (status !== "granted") {
      showError(translate("storeManager.detailEdit.locationPermission"));
      return;
    }

    const loc =
      (await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }).catch(() => null)) ??
      (await Location.getLastKnownPositionAsync({}).catch(() => null));

    if (!loc) {
      showError(translate("storeManager.detailEdit.couldNotGetLocation"));
      return;
    }

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
    if (!logo) { showError(translate("storeManager.detailEdit.logoRequired")); return; }
    if (!name.trim()) { showError(translate("storeManager.detailEdit.nameRequired")); return; }
    if (!type) { showError(translate("storeManager.detailEdit.typeRequired")); return; }

    const validPics = pictures.filter(Boolean) as string[];
    if (validPics.length === 0) { showError(translate("storeManager.detailEdit.picturesRequired")); return; }

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
        title: translate("storeManager.detailEdit.savedTitle"),
        message: translate("storeManager.detailEdit.savedMessage"),
        buttons: [
          {
            label: translate("storeManager.detailEdit.done"),
            onPress: () => {
              setModal(null);
              router.push({ pathname: "/(store_manager)/detail", params: { storeId } });
            },
            variant: "primary",
          },
        ],
      });
    } catch (err: any) {
      showError(err?.message ?? translate("storeManager.detailEdit.saveFailed"));
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  if (loadingInitial) {
    return (
      <View className="flex-1 bg-backgroundMuted dark:bg-darkBackgroundMuted items-center justify-center">
        <ActivityIndicator size="large" color="#FF6600" />
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-backgroundMuted dark:bg-darkBackgroundMuted">
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
      />

      <AppHeader
        title={translate("storeManager.detailEdit.title")}
        description={translate("storeManager.detailEdit.description")}
        onBackPress={() => {
          router.push({ pathname: "/(store_manager)/detail", params: { storeId } });
        }}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 40,
          gap: 16,
          ...(isWeb ? { width: "100%", alignItems: "center" } : null),
        }}
      >
        <View
          className="bg-white dark:bg-darkBackgroundCard rounded-xl border border-slate-200 dark:border-darkBorder"
          style={isWeb ? { width: "100%", maxWidth: WEB_MAX_WIDTH } : undefined}
        >

          <View className="m-4 rounded-xl px-3 pt-2 pb-3 gap-y-3">
            <Text className="text-base font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
              {translate("storeManager.detailEdit.mediaBrand", "Media & Brand")}
            </Text>

            <Text className="text-sm font-poppins-semibold text-textSecondary dark:text-darkTextSecondary">
              {translate("label.storeLogo")}
            </Text>
            <View className="flex-row items-center gap-x-3">
              <TouchableOpacity
                onPress={() => pickImage("logo")}
                activeOpacity={0.85}
                className="relative overflow-hidden rounded-xl border-2 border-dashed border-slate-300 dark:border-darkBorder bg-slate-50 dark:bg-darkBackgroundMuted"
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
                    <Text className="text-[9px] font-poppins text-slate-400">{translate("storeManager.detailEdit.logo")}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <Text className="text-sm font-poppins-semibold text-textSecondary dark:text-darkTextSecondary">
              {translate("storeManager.detailEdit.storePictures")}
            </Text>
            <View
              className="flex-row gap-x-2"
              style={
                isWeb
                  ? { maxWidth: 300, width: "100%" }
                  : undefined
              }
            >
              {[0, 1, 2].map((i) => {
                const uri = pictures[i];
                return (
                  <View
                    key={i}
                    className="flex-1 aspect-square"
                    style={
                      isWeb
                        ? { maxWidth: 90, minWidth: 0 }
                        : undefined
                    }
                  >
                    {uri ? (
                      <View className="flex-1 rounded-xl overflow-hidden border border-slate-200 dark:border-darkBorder relative">
                        <Image
                          source={{ uri }}
                          style={
                            isWeb
                              ? { width: "100%", height: "100%", maxWidth: 90, maxHeight: 90 }
                              : { width: "100%", height: "100%" }
                          }
                          contentFit="cover"
                        />
                        <TouchableOpacity
                          onPress={() => {
                            const next = [...pictures];
                            next[i] = null;
                            setPictures(next);
                          }}
                          className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/55 items-center justify-center"
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
                        className="flex-1 rounded-xl border-2 border-dashed border-slate-300 dark:border-darkBorder bg-slate-50 dark:bg-darkBackgroundMuted items-center justify-center min-h-[60px]"
                        activeOpacity={0.8}
                        style={
                          isWeb
                            ? { maxWidth: 90, maxHeight: 90 }
                            : undefined
                        }
                      >
                        <MaterialIcons name="add-a-photo" size={20} color="#94A3B8" />
                        <Text className="text-[9px] font-poppins text-slate-400 mt-0.5">{translate("label.add")}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
        
            </View>
          </View>

          <View className="mx-4 rounded-xl px-3 pt-2 pb-3 gap-y-4">
            <Text className="text-base font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
              {translate("storeManager.detailEdit.storeInformation", "Store Information")}
            </Text>

            <TextField
              label={translate("label.storeName")}
              placeholder={translate("storeManager.detailEdit.storeNamePlaceholder")}
              value={name}
              onChangeText={setName}
              sanitize={(v) => v}
            />

            <View className="gap-y-2">
              <Text className="text-sm font-poppins-semibold text-textSecondary dark:text-darkTextSecondary mb-1.5">
                {translate("label.storeType")}
              </Text>
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
                          : "border border-slate-200 dark:border-darkBorder"
                      }`}
                    >
                      <Text
                        className={`text-xs font-poppins-semibold ${
                          selected ? "text-primary" : "text-textSecondary dark:text-darkTextSecondary"
                        }`}
                      >
                        {translate(`storeManager.storeTypes.${opt.value}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TextField
              label={translate("storeManager.detailEdit.phoneNumber")}
              placeholder={translate("storeManager.detailEdit.phonePlaceholder")}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <TextField
              label={translate("storeManager.detailEdit.registrationNumber")}
              placeholder={translate("storeManager.detailEdit.registrationPlaceholder")}
              value={registrationNumber}
              onChangeText={setRegistrationNumber}
              sanitize={(v) => v}
            />
          </View>

          <View className="mx-4 rounded-xl px-3 pt-2 pb-3 gap-y-4" style={{ zIndex: 10 }}>
            <Text className="text-base font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
              {translate("storeManager.detailEdit.operatingHours", "Operating Hours")}
            </Text>

            <View className="flex-row gap-x-3">
              <View className="flex-1" style={{ zIndex: 20 }}>
                <Text className="text-sm font-poppins-semibold text-textSecondary dark:text-darkTextSecondary mb-1.5">
                  {translate("storeManager.detailEdit.openingTime")}
                </Text>
                {isWeb ? (
                  <WebTimePicker value={storeOpen} onChange={setStoreOpen} isDark={isDark} />
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowOpenPicker(true)}
                    activeOpacity={0.8}
                    className="w-full rounded-xl border border-slate-200 dark:border-darkBorder bg-white dark:bg-darkBackgroundMuted px-4 justify-center h-[45px]"
                  >
                    <Text className="font-poppins text-slate-900 dark:text-darkTextPrimary">{storeOpen || "09:00"}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View className="flex-1" style={{ zIndex: 10 }}>
                <Text className="text-sm font-poppins-semibold text-textSecondary dark:text-darkTextSecondary mb-1.5">
                  {translate("storeManager.detailEdit.closingTime")}
                </Text>
                {isWeb ? (
                  <WebTimePicker value={storeClose} onChange={setStoreClose} isDark={isDark} />
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowClosePicker(true)}
                    activeOpacity={0.8}
                    className="w-full rounded-xl border border-slate-200 dark:border-darkBorder bg-white dark:bg-darkBackgroundMuted px-4 justify-center h-[45px]"
                  >
                    <Text className="font-poppins text-slate-900 dark:text-darkTextPrimary">{storeClose || "21:00"}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {!isWeb && showOpenPicker && Platform.OS === "android" && (
              <DateTimePicker
                value={timeStringToDate(storeOpen || "09:00", 9, 0)}
                mode="time"
                onChange={(_, d) => { if (d) setStoreOpen(dateToTimeString(d)); setShowOpenPicker(false); }}
              />
            )}
            {!isWeb && showClosePicker && Platform.OS === "android" && (
              <DateTimePicker
                value={timeStringToDate(storeClose || "21:00", 21, 0)}
                mode="time"
                onChange={(_, d) => { if (d) setStoreClose(dateToTimeString(d)); setShowClosePicker(false); }}
              />
            )}
          </View>

          <View className="mx-4 rounded-xl overflow-hidden gap-y-4">
            <View className="px-3 pt-2 flex-row items-center justify-between">
              <Text className="text-base font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
                {translate("label.location")}
              </Text>
              {!isWeb && (
                <TouchableOpacity
                  onPress={handleGetCurrentLocation}
                  className="flex-row items-center gap-x-1"
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="my-location" size={14} color="#FF6600" />
                  <Text className="text-xs font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
                    {translate("storeManager.detailEdit.useCurrent")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ height: mapHeight }}>
              {isWeb ? (
                <WebMapboxPicker
                  latitude={Number.isFinite(parsedLat) ? parsedLat : null}
                  longitude={Number.isFinite(parsedLng) ? parsedLng : null}
                  isDark={isDark}
                  height={mapHeight}
                  radiusMeters={hasPin ? (radius ?? 50) || 50 : null}
                  onChange={({ latitude: lat, longitude: lng }) => {
                    setLatitude(String(lat));
                    setLongitude(String(lng));
                  }}
                />
              ) : shouldUseInteractiveMapbox() ? (
                <>
                  <MapView
                    style={{ height: mapHeight, width: "100%" }}
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
                      {translate("storeManager.detailEdit.tapMapMovePin")}
                    </Text>
                  </View>
                </>
              ) : (
                <View className="flex-1 h-full bg-slate-50 dark:bg-darkBackgroundCard items-center justify-center gap-y-1 px-4">
                  <MaterialIcons name="map" size={28} color={isDark ? "#525252" : "#CBD5E1"} />
                  <Text className="text-xs font-poppins text-center text-slate-400 dark:text-darkTextSecondary">
                    {translate("storeManager.detailEdit.mapFallbackMessage")}
                  </Text>
                </View>
              )}
            </View>

            <View className="px-3 gap-y-4">
              <TextField
                label={translate("storeManager.detailEdit.addressLandmark")}
                placeholder={translate("storeManager.detailEdit.addressPlaceholder")}
                value={address}
                onChangeText={setAddress}
                multiline
                sanitize={(v) => v}
              />

              {/* Delivery radius — slider on both web and mobile */}
              <View className="gap-y-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm font-poppins-semibold text-textSecondary dark:text-darkTextSecondary">
                    {translate("storeManager.detailEdit.storeRadius")}
                  </Text>
                  <Text className="text-sm font-poppins-bold text-primary">
                    {translate("storeManager.detailEdit.radiusMeters", { meters: radius ?? 50 })}
                  </Text>
                </View>
                <Slider
                  minimumValue={50}
                  maximumValue={500}
                  step={1}
                  value={radius ?? 50}
                  onValueChange={(v) => setRadius(Math.round(v))}
                  minimumTrackTintColor="#FF6600"
                  maximumTrackTintColor={isDark ? "#334155" : "#E2E8F0"}
                  thumbTintColor="#FF6600"
                />
                <View className="flex-row justify-between">
                  <Text className="text-xs font-poppins text-slate-400">{translate("storeManager.detailEdit.radiusMin")}</Text>
                  <Text className="text-xs font-poppins text-slate-400">{translate("storeManager.detailEdit.radiusMax")}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Compliance ────────────────────────────────── */}
          <View className="m-4 rounded-xl px-3 pt-2 pb-3 gap-y-3">
            <Text className="text-base font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
              {translate("storeManager.detailEdit.compliance", "Compliance")}
            </Text>

            <Text className="text-sm font-poppins-semibold text-textSecondary dark:text-darkTextSecondary">
              {translate("label.businessDocument")}
            </Text>
            <TouchableOpacity
              onPress={() => { if (!businessDoc) pickImage("business_document"); }}
              disabled={!!businessDoc}
              activeOpacity={0.85}
              className="w-full rounded-xl border-2 border-dashed border-slate-300 dark:border-darkBorder bg-slate-50 dark:bg-darkBackgroundMuted overflow-hidden items-center justify-center"
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
                  <Text className="text-xs font-poppins text-slate-400 mt-1.5">
                    {translate("storeManager.detailEdit.uploadDocumentImage")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Save / Cancel ─────────────────────────────── */}
          <View className="m-4 gap-y-3">
            <Button
              label={isUploading ? translate("storeManager.detailEdit.uploadingImages") : translate("label.saveChanges")}
              onPress={handleSave}
              variant="primary"
              loading={isSaving}
              fullWidth
              disabled={isSaving}
            />
            <Button
              label={translate("label.cancel")}
              onPress={() => {
                router.push({ pathname: "/(store_manager)/detail", params: { storeId } });
              }}
              variant="secondary"
              fullWidth
              disabled={isSaving}
            />
          </View>

        </View>

        {/* iOS modal pickers */}
        {!isWeb && showOpenPicker && Platform.OS !== "android" && (
          <RNModal visible transparent animationType="slide">
            <TouchableOpacity className="flex-1 bg-black/40 justify-end" activeOpacity={1} onPress={() => setShowOpenPicker(false)}>
              <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} className="bg-white dark:bg-darkBackgroundCard rounded-t-2xl pb-8 pt-2">
                <DateTimePicker value={timeStringToDate(storeOpen || "09:00", 9, 0)} mode="time" onChange={(_, d) => { if (d) setStoreOpen(dateToTimeString(d)); }} />
                <View className="px-4">
                  <Button label={translate("storeManager.detailEdit.done")} onPress={() => setShowOpenPicker(false)} variant="primary" fullWidth />
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </RNModal>
        )}
        {!isWeb && showClosePicker && Platform.OS !== "android" && (
          <RNModal visible transparent animationType="slide">
            <TouchableOpacity className="flex-1 bg-black/40 justify-end" activeOpacity={1} onPress={() => setShowClosePicker(false)}>
              <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} className="bg-white dark:bg-darkBackgroundCard rounded-t-2xl pb-8 pt-2">
                <DateTimePicker value={timeStringToDate(storeClose || "21:00", 21, 0)} mode="time" onChange={(_, d) => { if (d) setStoreClose(dateToTimeString(d)); }} />
                <View className="px-4">
                  <Button label={translate("storeManager.detailEdit.done")} onPress={() => setShowClosePicker(false)} variant="primary" fullWidth />
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </RNModal>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
