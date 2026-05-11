import React, { useState } from "react";
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from "@/tw";
import { router, useLocalSearchParams } from "expo-router";
import { Button } from "@/components/button";
import { TextField } from "@/components/text-field";
import * as ImagePicker from "expo-image-picker";
import { Modal, type ModalButton } from "@/components/modal";
import { createStore, updateStore, uploadStoreImage, StoreImageKind, resolveStoreTimezone } from "@/services/store-service";
import { canOwnerCreateAnotherStore } from "@/services/store-manager/subscription-limits";
import { supabase } from "@/supabase/supabase";
import Mapbox, { MapView, Camera, PointAnnotation } from "@rnmapbox/maps";
import { useColorScheme, Platform } from "react-native";
import { Image } from "expo-image";
import { useCreateStoreStore } from "@/store/store-manager/create-store-store";
import {
  aspect_ratios,
  DEFAULT_STORE_CLOSE,
  DEFAULT_STORE_OPEN,
  type PickImageType,
  STEPS,
  store_types_options,
  STORE_DAYS,
} from "@/type/store-manager/store";
import * as Location from "expo-location";
import Slider from "@react-native-community/slider";
import * as turf from "@turf/turf";
import { AppHeader } from "@/components/header";
import { shouldUseInteractiveMapbox } from "@/utils/mapbox-platform";
import { WebMapboxPicker } from "@/components/map/web-mapbox-picker";
import { useTranslation } from "react-i18next";
import { CalendarDays, ChevronDown, ChevronUp, CircleX, Clock, FileText, ImagePlus, MapPin } from "lucide-react-native";

const WEB_MAX_WIDTH = 896;
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN);

const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES_5 = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

import { Pressable } from "react-native";

function TimeDropdown({
  value,
  onChange,
  isDark,
  defaultValue = "09:00",
}: {
  value: string | null | undefined;
  onChange: (v: string) => void;
  isDark: boolean;
  defaultValue?: string;
}) {
  const [showH, setShowH] = useState(false);
  const [showM, setShowM] = useState(false);

  const parts = (value || defaultValue).split(":");
  const currentH = (parts[0] ?? "09").padStart(2, "0");
  const rawM = parseInt(parts[1] ?? "0", 10);
  const currentM = String(Math.min(55, Math.round(rawM / 5) * 5)).padStart(2, "0");

  const dropBg = isDark ? "#262626" : "#fff";
  const dropBorder = isDark ? "#404040" : "#e2e8f0";

  const closeDropdowns = () => {
    setShowH(false);
    setShowM(false);
  };

  return (
    <View className="flex-row items-center gap-x-2" style={{ position: "relative" }}>
      {(showH || showM) && (
        <Pressable
          style={{
            position: "absolute",
            left: -1000,
            top: -1000,
            width: 3000,
            height: 3000,
            zIndex: 20,
            backgroundColor: "transparent",
          }}
          onPress={closeDropdowns}
        />
      )}

      <View style={{ flex: 1, zIndex: 30 }}>
        <TouchableOpacity
          onPress={() => { setShowH(!showH); setShowM(false); }}
          activeOpacity={0.8}
          className="flex-row items-center justify-between rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 h-12"
        >
          <Text className="font-poppins text-slate-900 dark:text-slate-100">{currentH}</Text>
          {showH ? (
            <ChevronUp size={16} color="#94A3B8" />
          ) : (
            <ChevronDown size={16} color="#94A3B8" />
          )}
        </TouchableOpacity>
        {showH && (
          <ScrollView
            style={{
              position: "absolute",
              top: 52,
              left: 0,
              right: 0,
              zIndex: 40,
              backgroundColor: dropBg,
              borderRadius: 12,
              maxHeight: 180,
              borderWidth: 1,
              borderColor: dropBorder,
              elevation: 6,
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
            }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {HOURS_24.map((h) => (
              <TouchableOpacity
                key={h}
                onPress={() => { onChange(`${h}:${currentM}`); setShowH(false); }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  backgroundColor: h === currentH ? "rgba(255,102,0,0.10)" : "transparent",
                }}
              >
                <Text
                  className="font-poppins text-sm text-textPrimary"
                >
                  {h}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <Text className="font-poppins-semibold text-slate-400 text-base">:</Text>

      <View style={{ flex: 1, zIndex: 30 }}>
        <TouchableOpacity
          onPress={() => { setShowM(!showM); setShowH(false); }}
          activeOpacity={0.8}
          className="flex-row items-center justify-between rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 h-12"
        >
          <Text className="font-poppins text-slate-900 dark:text-slate-100">{currentM}</Text>
          {showM ? (
            <ChevronUp size={16} color="#94A3B8" />
          ) : (
            <ChevronDown size={16} color="#94A3B8" />
          )}
        </TouchableOpacity>
        {showM && (
          <ScrollView
            style={{
              position: "absolute",
              top: 52,
              left: 0,
              right: 0,
              zIndex: 40,
              backgroundColor: dropBg,
              borderRadius: 12,
              maxHeight: 180,
              borderWidth: 1,
              borderColor: dropBorder,
              elevation: 6,
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
            }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {MINUTES_5.map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => { onChange(`${currentH}:${m}`); setShowM(false); }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  backgroundColor: m === currentM ? "rgba(255,102,0,0.10)" : "transparent",
                }}
              >
                <Text
                  className="font-poppins text-sm text-textPrimary"
                >
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

function DaysBadgeSelector({
  selectedDays,
  onToggle,
  t,
}: {
  selectedDays: string[];
  onToggle: (day: string) => void;
  t: (key: string) => string;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {STORE_DAYS.map((day) => {
        const selected = selectedDays.includes(day.value);
        return (
          <TouchableOpacity
            key={day.value}
            activeOpacity={0.8}
            onPress={() => onToggle(day.value)}
            className={`px-3 py-1.5 rounded-full border ${
              selected
                ? "border-primary dark:border-primary "
                : "border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-800/50"
            }`}
          >
            <Text
              className={`text-xs font-poppins-medium ${
                selected ? "text-primary" : "text-slate-600 dark:text-slate-300"
              }`}
            >
              {t(`store_manager.createStore.days.${day.shortKey}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function CreateStore() {
  const { t } = useTranslation();
  const isWeb = Platform.OS === "web";
  const isDark = useColorScheme() === "dark";
  const [activeStep, setActiveStep] = useState<(typeof STEPS)[number]["key"]>("store");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [webMapUnavailable, setWebMapUnavailable] = useState(false);
  const {
    storeName,
    storeType,
    latitude,
    longitude,
    timezone,
    radius,
    logo,
    pictures,
    address,
    phone,
    registrationNumber,
    businessDocumentImage,
    storeOpen,
    storeClose,
    storeDays,
    setStoreName,
    setStoreType,
    setLogo,
    setPictures,
    setAddress,
    setLatitude,
    setLongitude,
    setTimezone,
    setPhone,
    setRegistrationNumber,
    setBusinessDocumentImage,
    setStoreOpen,
    setStoreClose,
    toggleStoreDay,
    setRadius,
    resetForm,
  } = useCreateStoreStore();
  const [isResolvingTimezone, setIsResolvingTimezone] = useState(false);
  const [modal, setModal] = useState<{
    title: string;
    message: string;
    buttons: ModalButton[];
  } | null>(null);

  const showError = (message: string) =>
    setModal({
      title: t("store_manager.createStore.errorTitle"),
      message,
      buttons: [{ label: t("label.ok"), onPress: () => setModal(null), variant: "secondary" }],
    });

  const getCreateStoreErrorMessage = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error ?? "");
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes("store_open") ||
      lowerMessage.includes("store_close") ||
      lowerMessage.includes("not-null constraint")
    ) {
      return t("store_manager.createStore.storeHoursRequired");
    }

    return t("store_manager.createStore.createFailedMessage");
  };

  const showCreateStoreError = (error: unknown) =>
    setModal({
      title: t("store_manager.createStore.createFailedTitle"),
      message: getCreateStoreErrorMessage(error),
      buttons: [{ label: t("label.ok"), onPress: () => setModal(null), variant: "secondary" }],
    });

  const pickImage = async (type: PickImageType, pictureIndex?: number) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      setModal({
        title: t("store_manager.createStore.permissionPhotosTitle"),
        message: t("store_manager.createStore.permissionPhotos"),
        buttons: [{ label: t("label.ok"), onPress: () => setModal(null), variant: "secondary" }],
      });
      return;
    }

    const aspect = aspect_ratios[type];
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect,
      quality: 0.9,
      base64: true,
    });

    if (pickerResult.canceled || !pickerResult.assets?.[0]) return;

    const asset = pickerResult.assets[0];
    if (!asset.base64) {
      showError(t("store_manager.createStore.couldNotReadImage"));
      return;
    }

    const mimeType = asset.mimeType ?? "image/jpeg";

    const maybeUpload = async () => {
      return `data:${mimeType};base64,${asset.base64}`;
    };

    if (type === "logo") {
      setIsUploadingImage(true);
      try {
        const url = await maybeUpload();
        setLogo(url);
      } catch (e: any) {
        showError(e?.message ?? t("store_manager.createStore.uploadFailed"));
      } finally {
        setIsUploadingImage(false);
      }
      return;
    }

    if (type === "business_document") {
      setIsUploadingImage(true);
      try {
        const url = await maybeUpload();
        setBusinessDocumentImage(url);
      } catch (e: any) {
        showError(e?.message ?? t("store_manager.createStore.uploadFailed"));
      } finally {
        setIsUploadingImage(false);
      }
      return;
    }

    if (type === "picture") {
      const current = useCreateStoreStore.getState().pictures ?? [];
      if (current.length >= 6 && (pictureIndex == null || pictureIndex >= current.length)) return;

      setIsUploadingImage(true);
      try {
        const url = await maybeUpload();
        const next = [...current];
        const index =
          pictureIndex !== undefined && pictureIndex >= 0 && pictureIndex < next.length
            ? pictureIndex
            : next.length;
        if (index < next.length) next[index] = url;
        else next.push(url);
        setPictures(next);
      } catch (e: any) {
        showError(e?.message ?? t("store_manager.createStore.uploadFailed"));
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const parsedLat = latitude ? Number(latitude) : NaN;
  const parsedLng = longitude ? Number(longitude) : NaN;
  const hasPin = Number.isFinite(parsedLat) && Number.isFinite(parsedLng);

  const picturesCount = pictures?.length ?? 0;
  const effectiveRadius = radius || 50;

  const getStoreStepMissing = () => {
    const missing: string[] = [];
    if (!storeName.trim()) missing.push(t("label.storeName"));
    if (!storeType.trim()) missing.push(t("label.storeType"));
    if (!logo) missing.push(t("label.storeLogo"));
    if (picturesCount < 3) missing.push(t("store_manager.createStore.missing.storePicturesMin"));
    if (picturesCount > 6) missing.push(t("store_manager.createStore.missing.storePicturesMax"));
    return missing;
  };

  const getBusinessStepMissing = () => {
    const missing: string[] = [];
    if (!registrationNumber.trim()) missing.push(t("store_manager.createStore.missing.registrationNumber"));
    if (!businessDocumentImage) missing.push(t("store_manager.createStore.missing.businessDocumentImage"));
    if (!storeDays || storeDays.length === 0) missing.push(t("store_manager.createStore.missing.storeDays"));
    return missing;
  };

  const getLocationStepMissing = () => {
    const missing: string[] = [];
    if (!address.trim()) missing.push(t("store_manager.createStore.missing.address"));
    if (!hasPin) missing.push(t("store_manager.createStore.missing.pinLocation"));
    if (effectiveRadius < 50 || effectiveRadius > 500) missing.push(t("store_manager.createStore.missing.radius"));
    return missing;
  };

  const isStoreStepValid = getStoreStepMissing().length === 0;
  const isBusinessStepValid = getBusinessStepMissing().length === 0;
  const isLocationStepValid = getLocationStepMissing().length === 0;

  const isFormValid = isStoreStepValid && isBusinessStepValid && isLocationStepValid;

  const radiusCircleFeature = React.useMemo(() => {
    if (!hasPin) return null;
    const km = (radius || 50) / 1000;
    const circle = turf.circle([parsedLng, parsedLat], km, {
      steps: 64,
      units: "kilometers",
    });
    return circle;
  }, [hasPin, parsedLat, parsedLng, radius]);

  const setPin = async (lat: number, lng: number) => {
    setLatitude(String(lat));
    setLongitude(String(lng));
    setIsResolvingTimezone(true);
    try {
      const tz = await resolveStoreTimezone(lng, lat);
      if (tz) setTimezone(tz);
    } catch (e) {
      console.warn("[create-store] timezone resolve failed:", e);
    } finally {
      setIsResolvingTimezone(false);
    }
  };  

  const handleGetCurrent = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setModal({
        title: t("store_manager.createStore.permissionLocationTitle"),
        message: t("store_manager.createStore.permissionLocationBody"),
        buttons: [{ label: t("label.ok"), onPress: () => setModal(null), variant: "secondary" }],
      });
      return;
    }

    const loc =
      (await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }).catch(() => null)) ??
      (await Location.getLastKnownPositionAsync({}).catch(() => null));

    if (!loc) {
      showError(t("store_manager.createStore.couldNotGetLocation"));
      return;
    }

    await setPin(loc.coords.latitude, loc.coords.longitude);
  };

  const handleWebMapUnavailable = React.useCallback(() => {
    setWebMapUnavailable(true);
  }, []);

  const goBack = () => {
    if (activeStep === "business") setActiveStep("store");
    else if (activeStep === "location") setActiveStep("business");
  };

  const goNext = () => {
    if (activeStep === "store") {
      const missing = getStoreStepMissing();
      if (missing.length > 0) {
        setModal({
          title: t("store_manager.createStore.storeDetailsRequired"),
          message: t("store_manager.createStore.pleaseComplete", { fields: missing.join(", ") }),
          buttons: [{ label: t("label.ok"), onPress: () => setModal(null), variant: "secondary" }],
        });
        return;
      }
      setActiveStep("business");
      return;
    }

    if (activeStep === "business") {
      const missing = getBusinessStepMissing();
      if (missing.length > 0) {
        setModal({
          title: t("store_manager.createStore.businessDetailsRequired"),
          message: t("store_manager.createStore.pleaseComplete", { fields: missing.join(", ") }),
          buttons: [{ label: t("label.ok"), onPress: () => setModal(null), variant: "secondary" }],
        });
        return;
      }
      setActiveStep("location");
      return;
    }

    if (!isFormValid) {
      const missing = getLocationStepMissing();

      setModal({
        title: t("store_manager.createStore.missingDetails"),
        message:
          missing.length > 0
            ? t("store_manager.createStore.pleaseComplete", { fields: missing.join(", ") })
            : t("store_manager.createStore.completeAllFields"),
        buttons: [{ label: t("label.ok"), onPress: () => setModal(null), variant: "secondary" }],
      });
      return;
    }

    const create = async () => {
      try {
        setIsSubmitting(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) {
          showError(t("store_manager.createStore.createFailed"));
          return;
        }

        const guard = await canOwnerCreateAnotherStore(user.id);
        if (!guard.allowed) {
          setModal({
            title: "Upgrade required",
            message:
              "You've reached the Free plan limit of one store. To add more stores, please subscribe to the Pro plan.",
            buttons: [
              {
                label: "Go to Subscriptions",
                variant: "primary",
                onPress: () => {
                  setModal(null);
                  router.push("/(store_manager)/subscription");
                },
              },
              {
                label: t("label.cancel"),
                variant: "secondary",
                onPress: () => setModal(null),
              },
            ],
          });
          return;
        }

        const newStore = await createStore({
          name: storeName.trim(),
          type: storeType,
          address: address.trim(),
          latitude: hasPin ? parsedLat : null,
          longitude: hasPin ? parsedLng : null,
          timezone: timezone.trim() || null,
          phone: phone.trim() || undefined,
          registrationNumber: registrationNumber.trim() || undefined,
          storeOpen: storeOpen.trim() || DEFAULT_STORE_OPEN,
          storeClose: storeClose.trim() || DEFAULT_STORE_CLOSE,
          storeDays: storeDays && storeDays.length > 0 ? storeDays : undefined,
          ownerId: user.id,
          radius: radius,
        });

        const id = String(newStore.id);

        const uploadDataUri = async (uri: string, kind: StoreImageKind): Promise<string> => {
          if (!uri.startsWith("data:")) return uri;
          const [header, b64] = uri.split(",");
          const mt = header.split(":")[1]?.split(";")[0] ?? "image/jpeg";
          return await uploadStoreImage(id, kind, b64, mt);
        };

        const uploadedLogo = logo ? await uploadDataUri(logo, "logo") : null;
        const uploadedPictures = pictures?.length
          ? await Promise.all(pictures.map((p) => uploadDataUri(p, "picture")))
          : null;
        const uploadedDoc = businessDocumentImage
          ? await uploadDataUri(businessDocumentImage, "business_document")
          : null;

        await updateStore(newStore.id, {
          logo: uploadedLogo,
          store_pictures: uploadedPictures,
          business_document_image: uploadedDoc,
        });

        setModal({
          title: t("store_manager.createStore.storeCreatedTitle"),
          message: t("store_manager.createStore.storeCreatedMessage"),
          buttons: [
            {
              label: t("store_manager.createStore.viewStore"),
              variant: "primary",
              onPress: () => {
                setModal(null);
                router.push(`/(store_manager)/view-store/${newStore.id}`);
              },
            },
          ],
        });
        resetForm();
        setActiveStep("store");
      } catch (e: any) {
        showCreateStoreError(e);
      } finally {
        setIsSubmitting(false);
      }
    };

    void create();
  };

	return (
		<SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-backgroundMuted dark:bg-[#111921]">
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
      />
      <AppHeader
        title={t("store_manager.createStore.title")}
        onBackPress={() => {
          router.push("/(store_manager)/stores");
        }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 24,
          ...(Platform.OS === "web" ? { width: "100%", alignItems: "center" } : null),
        }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      >
        {Platform.OS === "web" ? (
          <View style={{ width: "100%", maxWidth: WEB_MAX_WIDTH }}>
            {activeStep === "store" && (
              <View className="gap-2">
                <View className="w-full bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 p-4 gap-4 overflow-hidden">
                  <TextField
                    label={t("label.storeName")}
                    required
                    placeholder={t("store_manager.detailEdit.storeNamePlaceholder")}
                    value={storeName}
                    onChangeText={setStoreName}
                    sanitize={(v) => v}
                  />
    
                  <View className="flex-col gap-2 justify-start">
                    <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium px-1">
                      {t("label.storeType")} <Text className="text-red-500 dark:text-red-400">*</Text>
                    </Text>
                    <View className="flex-row flex-wrap gap-2 mt-1">
                      {store_types_options.map((type) => {
                        const selected = storeType === type.value;
                        return (
                          <TouchableOpacity
                            key={type.value}
                            activeOpacity={0.8}
                            onPress={() => setStoreType(type.value)}
                            className={`px-3 py-1.5 rounded-full border bg-white dark:bg-slate-800/50 ${
                              selected
                                ? "border-primary dark:border-primary"
                                : "border-slate-200 dark:border-slate-800/50"
                            }`}
                          >
                            <Text
                              className={`text-xs font-poppins-medium ${
                                selected ? "text-primary dark:text-slate-100" : "text-slate-600 dark:text-slate-300"
                              }`}
                            >
                          {t(`store_manager.storeTypes.${type.value}`)}
                        </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
    
                  <View className="flex-row gap-4 gap-y-2">
                    <View className="flex-1 flex-col gap-2">
                      <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium px-1">
                        {t("label.storeLogo")} <Text className="text-red-500 dark:text-red-400">*</Text>
                      </Text>
                      <TouchableOpacity
                        onPress={() => pickImage("logo")}
                        disabled={isUploadingImage}
                        className="relative w-32 h-32 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 flex flex-col items-center justify-center gap-1 overflow-hidden"
                      >
                        {logo ? (
                          <>
                            <Image source={{ uri: logo }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                            <TouchableOpacity
                              onPress={() => setLogo(null)}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 items-center justify-center"
                              activeOpacity={0.8}
                            >
                              <CircleX size={14} color="#fff" />
                            </TouchableOpacity>
                          </>
                        ) : (
                          <>
                            <ImagePlus size={18} color="#94A3B8" />
                            <Text className="text-[10px] text-slate-500 font-poppins">{t("store_manager.createStore.logo")}</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
    
                  <View className="flex-col gap-2">
                    <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium px-1">
                      {t("store_manager.createStore.storePictures")} <Text className="text-red-500 dark:text-red-400">*</Text>
                    </Text>
                    <Text className="text-slate-600 dark:text-slate-400 text-xs font-poppins mb-3 px-1">
                      {t("store_manager.createStore.storePicturesHint")}
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {[0, 1, 2, 3, 4, 5].map((index) => {
                        const uri = pictures?.[index];
                        return (
                          <View
                            key={index}
                            style={{ flexBasis: "32%", aspectRatio: 1 }}
                            className="min-w-[96px]"
                          >
                            {uri ? (
                              <View className="flex-1 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                                <Image source={{ uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                                <TouchableOpacity
                                  onPress={() => {
                                    const next = (pictures ?? []).filter((_, i) => i !== index);
                                    setPictures(next.length > 0 ? next : null);
                                  }}
                                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 items-center justify-center"
                                >
                                  <CircleX size={14} color="#fff" />
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <TouchableOpacity
                                onPress={() => pickImage("picture", index)}
                                disabled={isUploadingImage || (pictures?.length ?? 0) >= 6}
                                className="flex-1 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 items-center justify-center min-h-[80px]"
                              >
                                <ImagePlus size={20} color="#94A3B8" />
                                <Text className="text-[10px] text-slate-500 font-poppins mt-0.5">{t("label.add")}</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>
              </View>
            )}
    
            {activeStep === "business" && (
              <View className="gap-2">
                <View className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 p-4 gap-4">
                  <TextField
                    label={t("store_manager.createStore.phoneNumber")}
                    placeholder={t("store_manager.detailEdit.phonePlaceholder")}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={(t) => {
                      if (t.length <= 11) {
                        setPhone(t);
                      } else if (t.length < (phone?.length ?? 0)) {
                        setPhone(t);
                      }
                    }}
                  />
    
                  <TextField
                    label={t("store_manager.createStore.registrationNumber")}
                    required
                    placeholder={t("store_manager.detailEdit.registrationPlaceholder")}
                    value={registrationNumber}
                    onChangeText={setRegistrationNumber}
                    sanitize={(v) => v}
                  />
    
                  <View className="flex flex-col gap-2">
                    <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium px-1">
                      {t("label.businessDocument")} <Text className="text-red-500 dark:text-red-400">*</Text>
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        if (!businessDocumentImage) pickImage("business_document");
                      }}
                      disabled={isUploadingImage || !!businessDocumentImage}
                      className="w-full rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 items-center justify-center overflow-hidden"
                      style={{ height: 220 }}
                    >
                      {businessDocumentImage ? (
                        <>
                          <Image
                            source={{ uri: businessDocumentImage }}
                            style={{ width: "100%", height: "100%", resizeMode: "cover" }}
                            contentFit="contain"
                          />
                          <TouchableOpacity
                            onPress={() => setBusinessDocumentImage(null)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/65 items-center justify-center"
                            activeOpacity={0.8}
                          >
                            <CircleX size={16} color="gray" />
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <FileText size={24} color="#94A3B8" />
                          <Text className="text-xs text-slate-500 font-poppins mt-1">{t("store_manager.createStore.uploadDocumentImage")}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
    
                  <View className="flex-row gap-3" style={{ zIndex: 30 }}>
                    <View className="flex-1 flex-col gap-1.5" style={{ zIndex: 30 }}>
                      <View className="flex-row items-center gap-1 px-1">
                        <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium">
                          {t("store_manager.createStore.openingTime")}
                          <Text className="text-red-500 dark:text-red-400 ml-1">*</Text>
                        </Text>
                      </View>
                      <TimeDropdown
                        value={storeOpen}
                        onChange={setStoreOpen}
                        isDark={isDark}
                        defaultValue={DEFAULT_STORE_OPEN}
                      />
                    </View>
                    <View className="flex-1 flex-col gap-1.5" style={{ zIndex: 30 }}>
                      <View className="flex-row items-center gap-1 px-1">
                        <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium">
                          {t("store_manager.createStore.closingTime")}
                          <Text className="text-red-500 dark:text-red-400 ml-1  ">*</Text>
                        </Text>
                      </View>
                      <TimeDropdown
                        value={storeClose}
                        onChange={setStoreClose}
                        isDark={isDark}
                        defaultValue={DEFAULT_STORE_CLOSE}
                      />
                    </View>
                  </View>

                  <View className="flex-col gap-2" style={{ zIndex: 1 }}>
                    <View className="flex-row items-center gap-1 px-1">
                      <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium">
                        {t("store_manager.createStore.storeDays")}{" "}
                        <Text className="text-red-500 dark:text-red-400">*</Text>
                      </Text>
                    </View>
                    <Text className="text-slate-600 dark:text-slate-400 text-xs font-poppins px-1">
                      {t("store_manager.createStore.storeDaysHint")}
                    </Text>
                    <DaysBadgeSelector
                      selectedDays={storeDays}
                      onToggle={toggleStoreDay}
                      t={t}
                    />
                    {storeDays.length === 7 && (
                      <Text className="text-xs text-slate-400 dark:text-slate-500 font-poppins px-1">
                        {t("store_manager.createStore.storeDaysAllSelected")}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}
    
            {activeStep === "location" && (
              <View className="gap-2">
                <View className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 p-4 gap-5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-poppins text-slate-500 dark:text-slate-400">{t("store_manager.createStore.tapMapPin")}</Text>
                  </View>
    
                  <View className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                    <View pointerEvents="box-none" style={{ minHeight: 400 }}>
                      <WebMapboxPicker
                        latitude={Number.isFinite(parsedLat) ? parsedLat : null}
                        longitude={Number.isFinite(parsedLng) ? parsedLng : null}
                        isDark={isDark}
                        height={400}
                        markerColor="#FF6600"
                        radiusMeters={hasPin ? radius || 50 : null}
                        onChange={({ latitude: lat, longitude: lng }) => setPin(lat, lng)}
                        onUnavailable={handleWebMapUnavailable}
                      />
                      {shouldUseInteractiveMapbox() ? null : (
                        <View className="h-[400px] items-center justify-center gap-y-2 px-6 bg-slate-50 dark:bg-slate-900">
                          <MapPin color={isDark ? "#525252" : "#94A3B8"} />
                          <Text className="text-xs font-poppins text-center text-slate-500 dark:text-slate-400">
                            {t("store_manager.createStore.mapFallbackWeb")}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {webMapUnavailable && (
                    <View className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2.5 gap-2">
                      <Text className="text-xs font-poppins text-amber-900 dark:text-amber-200">
                        {t("store_manager.createStore.mapUnavailableWeb")}
                      </Text>
                      <TouchableOpacity
                        className="self-start flex-row items-center gap-1 rounded-xl bg-primary px-3 py-2"
                        activeOpacity={0.8}
                        onPress={handleGetCurrent}
                      >
                        <MapPin size={14} color="#fff" />
                        <Text className="text-xs font-poppins-bold text-white">
                          {t("store_manager.createStore.getCurrent")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
    
                  <TextField
                    label={t("store_manager.createStore.landmarkAddress")}
                    required
                    placeholder={t("store_manager.createStore.addressPlaceholder")}
                    value={address}
                    onChangeText={setAddress}
                    multiline
                    sanitize={(v) => v}
                  />
    
                  <View className="mt-2">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium">
                        {t("store_manager.createStore.storeRadius")} <Text className="text-red-500 dark:text-red-400">*</Text>
                      </Text>
                      <Text className="text-primary text-sm font-poppins-bold">{t("store_manager.detailEdit.radiusMeters", { meters: radius || 50 })}</Text>
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
                      <Text className="text-xs text-slate-500 font-poppins">{t("store_manager.detailEdit.radiusMin")}</Text>
                      <Text className="text-xs text-slate-500 font-poppins">{t("store_manager.detailEdit.radiusMax")}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        ) : null}

        {!isWeb && activeStep === "store" && (
          <View className="gap-2">
            <View className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 p-4 gap-4">
              <TextField
                label={t("label.storeName")}
                required
                placeholder={t("store_manager.detailEdit.storeNamePlaceholder")}
                value={storeName}
                onChangeText={setStoreName}
                sanitize={(v) => v}
              />

              <View className="flex-1 flex-col gap-2 justify-start">
                <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium px-1">
                  {t("label.storeType")} <Text className="text-red-500 dark:text-red-400">*</Text>
                </Text>
                <View className="flex-row flex-wrap gap-2 mt-1">
                  {store_types_options.map((type) => {
                    const selected = storeType === type.value;
                    return (
                      <TouchableOpacity
                        key={type.value}
                        activeOpacity={0.8}
                        onPress={() => setStoreType(type.value)}
                        className={`px-3 py-1.5 rounded-full border bg-white dark:bg-slate-800/50 ${
                          selected
                            ? "border-primary dark:border-primary"
                            : "border-slate-200 dark:border-slate-800/50"
                        }`}
                      >
                        <Text
                          className={`text-xs font-poppins-medium ${
                            selected
                              ? "text-primary dark:text-slate-100"
                              : "text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {t(`store_manager.storeTypes.${type.value}`)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View className="flex-row gap-4 gap-y-2">
                <View className="flex-1 flex-col gap-2">
                  <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium px-1">
                    {t("label.storeLogo")} <Text className="text-red-500 dark:text-red-400">*</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() => pickImage("logo")}
                    disabled={isUploadingImage}
                    className="relative w-32 h-32 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 flex flex-col items-center justify-center gap-1 overflow-hidden"
                  >
                    {logo ? (
                      <>
                        <Image
                          source={{ uri: logo }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                        <TouchableOpacity
                          onPress={() => setLogo(null)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 items-center justify-center"
                          activeOpacity={0.8}
                        >
                          <CircleX size={14} color="#fff" />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <ImagePlus size={18} color="#94A3B8" />
                        <Text className="text-[10px] text-slate-500 font-poppins">{t("store_manager.createStore.logo")}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              
              <View className="flex-1 flex-col gap-2">
                <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium px-1">
                  {t("store_manager.createStore.storePictures")} <Text className="text-red-500 dark:text-red-400">*</Text>
                </Text>
                <Text className="text-slate-600 dark:text-slate-400 text-xs font-poppins mb-3 px-1">
                  {t("store_manager.createStore.storePicturesHint")}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => {
                    const uri = pictures?.[index];
                    return (
                      <View key={index} className="w-[31%] aspect-square">
                        {uri ? (
                          <View className="flex-1 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                            <Image
                              source={{ uri }}
                              style={{ width: "100%", height: "100%" }}
                              contentFit="cover"
                            />
                            <TouchableOpacity
                              onPress={() => {
                                const next = (pictures ?? []).filter((_, i) => i !== index);
                                setPictures(next.length > 0 ? next : null);
                              }}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 items-center justify-center"
                            >
                              <CircleX size={14} color="#fff" />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => pickImage("picture", index)}
                            disabled={isUploadingImage || (pictures?.length ?? 0) >= 6}
                            className="flex-1 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 items-center justify-center min-h-[80px]"
                          >
                            <ImagePlus size={20} color="#94A3B8" />
                            <Text className="text-[10px] text-slate-500 font-poppins mt-0.5">{t("label.add")}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        )}

        {!isWeb && activeStep === "business" && (
          <View className="gap-2">
            <View className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 p-4 gap-4">
              <TextField
                label={t("store_manager.createStore.phoneNumber")}
                placeholder={t("store_manager.detailEdit.phonePlaceholder")}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={t => {
                  if (t.length <= 11) {
                    setPhone(t);
                  } else if (t.length < (phone?.length ?? 0)) {
                    setPhone(t);
                  }
                }}
              />

              <TextField
                label={t("store_manager.createStore.registrationNumber")}
                required
                placeholder={t("store_manager.detailEdit.registrationPlaceholder")}
                value={registrationNumber}
                onChangeText={setRegistrationNumber}
                sanitize={(v) => v}
              />

              <View className="flex flex-col gap-2">
                <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium px-1">
                  {t("label.businessDocument")} <Text className="text-red-500 dark:text-red-400">*</Text>
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (!businessDocumentImage) pickImage("business_document");
                  }}
                  disabled={isUploadingImage || !!businessDocumentImage}
                  className="w-full rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 items-center justify-center overflow-hidden"
                  style={{ height: 220 }}
                >
                  {businessDocumentImage ? (
                    <>
                      <Image
                        source={{ uri: businessDocumentImage }}
                        style={{ width: "100%", height: "100%", resizeMode: "cover" }}
                        contentFit="contain"
                      />
                      <TouchableOpacity
                        onPress={() => setBusinessDocumentImage(null)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/65 items-center justify-center"
                        activeOpacity={0.8}
                      >
                        <CircleX size={16} color="gray" />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <FileText size={24} color="#94A3B8" />
                      <Text className="text-xs text-slate-500 font-poppins mt-1">
                        {t("store_manager.detailEdit.uploadDocumentImage")}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View className="flex-row gap-3" style={{ zIndex: 30 }}>
                <View className="flex-1 flex-col gap-1.5" style={{ zIndex: 30 }}>
                  <View className="flex-row items-center gap-1 px-1">
                    <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium">
                      {t("store_manager.createStore.openingTime")}
                    </Text>
                  </View>
                  <TimeDropdown
                    value={storeOpen}
                    onChange={setStoreOpen}
                    isDark={isDark}
                    defaultValue={DEFAULT_STORE_OPEN}
                  />
                </View>
                <View className="flex-1 flex-col gap-1.5" style={{ zIndex: 30 }}>
                  <View className="flex-row items-center gap-1 px-1">
                    <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium">
                      {t("store_manager.createStore.closingTime")}
                    </Text>
                  </View>
                  <TimeDropdown
                    value={storeClose}
                    onChange={setStoreClose}
                    isDark={isDark}
                    defaultValue={DEFAULT_STORE_CLOSE}
                  />
                </View>
              </View>

              <View className="flex-col gap-2" style={{ zIndex: 1 }}>
                <View className="flex-row items-center gap-1 px-1">
                  <CalendarDays size={14} color={isDark ? "#cbd5e1" : "#475569"} />
                  <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium">
                    {t("store_manager.createStore.storeDays")}{" "}
                    <Text className="text-red-500 dark:text-red-400">*</Text>
                  </Text>
                </View>
                <Text className="text-slate-600 dark:text-slate-400 text-xs font-poppins px-1">
                  {t("store_manager.createStore.storeDaysHint")}
                </Text>
                <DaysBadgeSelector
                  selectedDays={storeDays}
                  onToggle={toggleStoreDay}
                  t={t}
                />
                {storeDays.length === 7 && (
                  <Text className="text-xs text-slate-400 dark:text-slate-500 font-poppins px-1">
                    {t("store_manager.createStore.storeDaysAllSelected")}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {!isWeb && activeStep === "location" && (
          <View className="gap-2">
            <View className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 p-4 gap-5">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-poppins text-slate-500 dark:text-slate-400">
                  {t("store_manager.createStore.tapMapPin")}
                </Text>
                
                {Platform.OS !== "web" && (
                  <TouchableOpacity
                    className="flex-row items-center gap-1"
                    activeOpacity={0.8}
                    onPress={handleGetCurrent}
                  >
                    <MapPin size={14} color="#FF6600" />
                    <Text className="text-primary text-xs font-poppins-bold">
                      {t("store_manager.createStore.getCurrent")}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                <View pointerEvents="box-none" style={{ minHeight: 400 }}>
                  {shouldUseInteractiveMapbox() ? (
                    <MapView
                      style={{ height: 400, width: "100%" }}
                      styleURL={
                        isDark
                          ? "mapbox://styles/mapbox/navigation-night-v1"
                          : "mapbox://styles/mapbox/streets-v12"
                      }
                      onPress={async (e) => {
                        const coords = (e as any)?.geometry?.coordinates as [number, number] | undefined;
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
                        centerCoordinate={hasPin ? [parsedLng, parsedLat] : [123.8854, 10.3157]}
                      />
                      {hasPin && (
                        <PointAnnotation id="storeLocation" coordinate={[parsedLng, parsedLat]}>
                          <View className="w-4 h-4 bg-orange-500 rounded-full border-2 border-white" />
                        </PointAnnotation>
                      )}
                      {radiusCircleFeature && (
                        <Mapbox.ShapeSource id="storeRadius" shape={radiusCircleFeature}>
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
                        {t("store_manager.createStore.mapFallbackWeb")}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <TextField
                label={t("store_manager.createStore.landmarkAddress")}
                required
                placeholder={t("store_manager.createStore.addressPlaceholder")}
                value={address}
                onChangeText={setAddress}
                multiline
                sanitize={(v) => v}
              />

              {/* Timezone — auto-filled from PostGIS when boundary data is loaded; manual entry otherwise */}
              <View className="flex-col gap-1.5 mt-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium px-1">
                    Store Timezone{" "}
                    <Text className="text-red-500 dark:text-red-400">*</Text>
                  </Text>
                  {isResolvingTimezone && (
                    <Text className="text-xs text-slate-400 font-poppins italic">Detecting…</Text>
                  )}
                </View>
                <TextField
                  placeholder={t("store_manager.createStore.timezonePlaceholder")}
                  value={timezone}
                  onChangeText={setTimezone}
                  sanitize={(v) => v}
                />
                {!isResolvingTimezone && !timezone.trim() && hasPin && (
                  <Text className="text-xs text-amber-600 dark:text-amber-400 font-poppins px-1">
                    Could not auto-detect timezone. Please enter it manually (e.g. Asia/Manila, America/New_York).
                  </Text>
                )}
                {timezone.trim() && (
                  <Text className="text-xs text-slate-400 dark:text-slate-500 font-poppins px-1">
                    Timezone locked in. You can correct it if needed.
                  </Text>
                )}
              </View>

            <View className="mt-2">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium">
                  {t("store_manager.createStore.storeRadius")}{" "}
                  <Text className="text-red-500 dark:text-red-400">*</Text>
                </Text>
                <Text className="text-primary text-sm font-poppins font-bold">
           
                  {t("store_manager.detailEdit.radiusMeters", { meters: radius || 50 })}
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
                <Text className="text-xs text-slate-500 font-poppins">{t("store_manager.detailEdit.radiusMin")}</Text>
                <Text className="text-xs text-slate-500 font-poppins">{t("store_manager.detailEdit.radiusMax")}</Text>
              </View>
            </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View className="px-4 py-4 bg-white">
        <View
          className={Platform.OS === "web" ? "items-center" : ""}
          style={Platform.OS === "web" ? { width: "100%" } : undefined}
        >
          <View style={Platform.OS === "web" ? { width: "100%", maxWidth: WEB_MAX_WIDTH } : undefined}>
            <View className="flex-row gap-3">
              {activeStep !== "store" && (
                <View className="flex-1">
                  <Button label={t("store_manager.createStore.back")} onPress={goBack} variant="secondary" loading={false} fullWidth />
                </View>
              )}
              <View className="flex-1">
                <Button
                  label={activeStep === "location" ? t("store_manager.createStore.createStore") : t("store_manager.createStore.continue")}
                  onPress={goNext}
                  variant="primary"
                  loading={isSubmitting}
                  fullWidth
                  disabled={
                    isUploadingImage ||
                    isSubmitting ||
                    (activeStep === "store" && !isStoreStepValid) ||
                    (activeStep === "business" && !isBusinessStepValid) ||
                    (activeStep === "location" && !isFormValid)
                  }
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
