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
import { shouldUseInteractiveMapbox } from "@/utils/mapbox-platform";
import { AppHeader } from "@/components/header";
import { WebMapboxPicker } from "@/components/map/web-mapbox-picker";
import { useTranslation } from "react-i18next";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

const WEB_MAX_WIDTH = 896;

export default function EditDetails() {
  const { t } = useTranslation();
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
          title: t("storeManager.detailEdit.loadFailedTitle"),
          message: t("storeManager.detailEdit.loadFailedMessage"),
          buttons: [{ label: t("label.ok"), onPress: () => setModal(null), variant: "primary" }],
        });
      })
      .finally(done);

    return () => {
      cancelled = true;
    };
  }, [storeId, detail, setDetail, initFromDetail, reset, t]);

  const showError = (message: string) =>
    setModal({
      title: t("storeManager.detailEdit.errorTitle"),
      message,
      buttons: [{ label: t("label.ok"), onPress: () => setModal(null), variant: "primary" }],
    });

  const pickImage = async (kind: PickImageType, index?: number) => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      showError(t("storeManager.detailEdit.photoLibraryPermission"));
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
    if (!asset.base64) { showError(t("storeManager.detailEdit.couldNotReadImage")); return; }

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
      showError(t("storeManager.detailEdit.locationPermission"));
      return;
    }

    const loc =
      (await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }).catch(() => null)) ??
      (await Location.getLastKnownPositionAsync({}).catch(() => null));

    if (!loc) {
      showError(t("storeManager.detailEdit.couldNotGetLocation"));
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
    if (!logo) {
      showError(t("storeManager.detailEdit.logoRequired"));
      return;
    }
    if (!name.trim()) { showError(t("storeManager.detailEdit.nameRequired")); return; }
    if (!type) { showError(t("storeManager.detailEdit.typeRequired")); return; }

    const validPics = pictures.filter(Boolean) as string[];
    if (validPics.length === 0) { showError(t("storeManager.detailEdit.picturesRequired")); return; }

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
        title: t("storeManager.detailEdit.savedTitle"),
        message: t("storeManager.detailEdit.savedMessage"),
        buttons: [
          {
            label: t("storeManager.detailEdit.done"),
            onPress: () => {
              setModal(null);
              router.push({ pathname: "/(store_manager)/detail", params: { storeId } });
            },
            variant: "primary",
          },
        ],
      });
    } catch (err: any) {
      showError(err?.message ?? t("storeManager.detailEdit.saveFailed"));
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

      <AppHeader
        title={t("storeManager.detailEdit.title")}
        description={t("storeManager.detailEdit.description")}
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
          gap: 20,
          ...(isWeb ? { width: "100%", alignItems: "center" } : null),
        }}
      >
        <View
          className="bg-white dark:bg-neutral-800 rounded-2xl border border-slate-100 dark:border-neutral-700 p-4 gap-y-4"
          style={isWeb ? { width: "100%", maxWidth: WEB_MAX_WIDTH } : undefined}
        >
          <View className="gap-y-4">
            <TextField
              label={t("storeManager.detailEdit.storeName")}
              placeholder={t("storeManager.detailEdit.storeNamePlaceholder")}
              value={name}
              onChangeText={setName}
              sanitize={(v) => v}
            />

            <View className="gap-y-2">
              <Text className="text-sm font-poppins-semibold text-textSecondary dark:text-textSecondary mb-1.5">{t("storeManager.detailEdit.storeType")}</Text>
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
                        {t(`storeManager.storeTypes.${opt.value}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View className="flex-row gap-x-3">
              <View className="flex-1">
                <Text className="text-sm font-poppins-semibold text-textSecondary dark:text-textSecondary mb-1.5">{t("storeManager.detailEdit.openingTime")}</Text>
                {isWeb ? (
                  <TextField
                    label=""
                    placeholder={t("storeManager.detailEdit.timePlaceholderOpen")}
                    value={storeOpen ?? ""}
                    onChangeText={setStoreOpen}
                    sanitize={(v) => v}
                  />
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowOpenPicker(true)}
                    activeOpacity={0.8}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 justify-center h-[45px]"
                  >
                    <Text className="font-poppins text-slate-900 dark:text-slate-100">{storeOpen || "09:00"}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View className="flex-1">
                <Text className="text-sm font-poppins-semibold text-textSecondary dark:text-textSecondary mb-1.5">{t("storeManager.detailEdit.closingTime")}</Text>
                {isWeb ? (
                  <TextField
                    label=""
                    placeholder={t("storeManager.detailEdit.timePlaceholderClose")}
                    value={storeClose ?? ""}
                    onChangeText={setStoreClose}
                    sanitize={(v) => v}
                  />
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowClosePicker(true)}
                    activeOpacity={0.8}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 justify-center h-[45px]"
                  >
                    <Text className="font-poppins text-slate-900 dark:text-slate-100">{storeClose || "21:00"}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {!isWeb && showOpenPicker && (
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
                      <View className="px-4"><Button label={t("storeManager.detailEdit.done")} onPress={() => setShowOpenPicker(false)} variant="primary" fullWidth /></View>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </RNModal>
              )
            )}

            {!isWeb && showClosePicker && (
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
                      <View className="px-4"><Button label={t("storeManager.detailEdit.done")} onPress={() => setShowClosePicker(false)} variant="primary" fullWidth /></View>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </RNModal>
              )
            )}
          </View>
          <View className="h-px bg-slate-100 dark:bg-neutral-700" />
          <View>
            <Text className="text-sm font-poppins-semibold text-textSecondary dark:text-textSecondary mb-1.5">{t("storeManager.detailEdit.storeLogo")}</Text>
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
                    <Text className="text-[9px] font-poppins text-slate-400">{t("storeManager.detailEdit.logo")}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

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
                        <Text className="text-[9px] font-poppins text-slate-400 mt-0.5">{t("storeManager.detailEdit.add")}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
          <View className="h-px bg-slate-100 dark:bg-neutral-700" />
          <TextField
            label={t("storeManager.detailEdit.phoneNumber")}
            placeholder={t("storeManager.detailEdit.phonePlaceholder")}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <TextField
            label={t("storeManager.detailEdit.registrationNumber")}
            placeholder={t("storeManager.detailEdit.registrationPlaceholder")}
            value={registrationNumber}
            onChangeText={setRegistrationNumber}
            sanitize={(v) => v}
          />

          <View>
            <Text className="text-sm font-poppins-semibold text-textSecondary dark:text-textSecondary mb-1.5">{t("storeManager.detailEdit.businessDocument")}</Text>
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
                  <Text className="text-xs font-poppins text-slate-400 mt-1.5">{t("storeManager.detailEdit.uploadDocumentImage")}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          <View className="h-px bg-slate-100 dark:bg-neutral-700" />

          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-poppins-semibold text-textSecondary dark:text-textSecondary">
              {t("storeManager.detailEdit.location")}
            </Text>
            {!isWeb && (
              <TouchableOpacity
                onPress={handleGetCurrentLocation}
                className="flex-row items-center gap-x-1"
                activeOpacity={0.8}
              >
                <MaterialIcons name="my-location" size={14} color="#FF6600" />
                <Text className="text-xs font-poppins-semibold text-textPrimary dark:text-textPrimary">{t("storeManager.detailEdit.useCurrent")}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-700" style={{ height: 280 }}>
            {isWeb ? (
              <WebMapboxPicker
                latitude={Number.isFinite(parsedLat) ? parsedLat : null}
                longitude={Number.isFinite(parsedLng) ? parsedLng : null}
                isDark={isDark}
                height={280}
<<<<<<< Updated upstream
=======
                radiusMeters={hasPin ? (radius ?? 50) || 50 : null}
>>>>>>> Stashed changes
                onChange={({ latitude: lat, longitude: lng }) => {
                  setLatitude(String(lat));
                  setLongitude(String(lng));
                }}
              />
            ) : shouldUseInteractiveMapbox() ? (
              <>
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
                    {t("storeManager.detailEdit.tapMapMovePin")}
                  </Text>
                </View>
              </>
            ) : (
              <View className="flex-1 h-full bg-slate-50 dark:bg-neutral-800 items-center justify-center gap-y-1 px-4">
                <MaterialIcons name="map" size={28} color={isDark ? "#525252" : "#CBD5E1"} />
                <Text className="text-xs font-poppins text-center text-slate-400 dark:text-slate-500">
                  {t("storeManager.detailEdit.mapFallbackMessage")}
                </Text>
              </View>
            )}
          </View>

          <TextField
            label={t("storeManager.detailEdit.addressLandmark")}
            placeholder={t("storeManager.detailEdit.addressPlaceholder")}
            value={address}
            onChangeText={setAddress}
            multiline
            sanitize={(v) => v}
          />

          <View>
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-sm font-poppins-semibold text-textSecondary dark:text-textSecondary mb-1.5">{t("storeManager.detailEdit.storeRadius")}</Text>
              <Text className="text-sm font-poppins-bold text-primary">{t("storeManager.detailEdit.radiusMeters", { meters: radius })}</Text>
            </View>
            {isWeb ? (
              <TextField
                label=""
                placeholder="50"
                keyboardType="numeric"
                value={radius ? String(radius) : ""}
                onChangeText={(v) => setRadius(Math.max(50, Math.min(500, parseInt(v, 10) || 50)))}
                sanitize={(v) => v}
              />
            ) : (
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
            )}
            <View className="flex-row justify-between">
              <Text className="text-xs font-poppins text-slate-400">{t("storeManager.detailEdit.radiusMin")}</Text>
              <Text className="text-xs font-poppins text-slate-400">{t("storeManager.detailEdit.radiusMax")}</Text>
            </View>
          </View>
          <View className="h-px bg-slate-100 dark:bg-neutral-700" />

          <View className="gap-y-3">
            <Button
              label={isUploading ? t("storeManager.detailEdit.uploadingImages") : t("storeManager.detailEdit.saveChanges")}
              onPress={handleSave}
              variant="primary"
              loading={isSaving}
              fullWidth
              disabled={isSaving}
            />
            <Button
              label={t("storeManager.detailEdit.cancel")}
              onPress={() => {
                router.push({ pathname: "/(store_manager)/detail", params: { storeId } });
              }}
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
