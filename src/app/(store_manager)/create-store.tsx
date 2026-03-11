import React, { useState } from "react";
import { View, Text, SafeAreaView, TouchableOpacity, TextInput, ScrollView } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import { Button } from "@/components/button";
import * as ImagePicker from "expo-image-picker";
import { Modal, type ModalButton } from "@/components/modal";
import { createStore } from "@/services/store-service";
import { supabase } from "@/supabase/supabase";
import Mapbox, { MapView, Camera, PointAnnotation } from "@rnmapbox/maps";
import { useColorScheme, Platform, Modal as RNModal } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import { useCreateStoreStore } from "@/store/store-manager/create-store-store";
import { aspect_ratios, type PickImageType, STEPS, store_types_options } from "@/type/store-manager/store";
import * as Location from "expo-location";
import Slider from "@react-native-community/slider";
import * as turf from "@turf/turf";
import { uploadStoreImage } from "@/services/store-service";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN);

function timeStringToDate(s: string, fallbackHour = 9, fallbackMin = 0): Date {
  const match = s.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return new Date(2000, 0, 1, fallbackHour, fallbackMin);
  const h = Math.min(23, Math.max(0, parseInt(match[1], 10)));
  const m = Math.min(59, Math.max(0, parseInt(match[2], 10)));
  return new Date(2000, 0, 1, h, m);
}

function dateToTimeString(d: Date): string {
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export default function CreateStore() {
  const isDark = useColorScheme() === "dark";
  const [activeStep, setActiveStep] = useState<(typeof STEPS)[number]["key"]>("store");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [showOpenTimePicker, setShowOpenTimePicker] = useState(false);
  const [showCloseTimePicker, setShowCloseTimePicker] = useState(false);
  const { storeId } = useLocalSearchParams<{ storeId?: string }>();
  const {
    storeName,
    storeType,
    latitude,
    longitude,
    radius,
    logo,
    pictures,
    address,
    phone,
    registrationNumber,
    businessDocumentImage,
    storeOpen,
    storeClose,
    setStoreName,
    setStoreType,
    setLogo,
    setPictures,
    setAddress,
    setLatitude,
    setLongitude,
    setPhone,
    setRegistrationNumber,
    setBusinessDocumentImage,
    setStoreOpen,
    setStoreClose,
    setRadius,
    resetForm,
  } = useCreateStoreStore();
  const [modal, setModal] = useState<{
    title: string;
    message: string;
    buttons: ModalButton[];
  } | null>(null);

  const showError = (message: string) =>
    setModal({
      title: "Error",
      message,
      buttons: [{ label: "OK", onPress: () => setModal(null), variant: "secondary" }],
    });

  const pickImage = async (type: PickImageType, pictureIndex?: number) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      setModal({
        title: "Permission Required",
        message: "We need access to your photos to upload images.",
        buttons: [{ label: "OK", onPress: () => setModal(null), variant: "secondary" }],
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
      showError("Could not read image data. Please try again.");
      return;
    }

    const mimeType = asset.mimeType ?? "image/jpeg";

    const maybeUpload = async () => {
      if (!storeId) return `data:${mimeType};base64,${asset.base64}`;
      const id = String(storeId);
      const kind = type === "picture" ? "picture" : type;
      return await uploadStoreImage(id, kind, asset.base64, mimeType);
    };

    if (type === "logo") {
      setIsUploadingImage(true);
      try {
        const url = await maybeUpload();
        setLogo(url);
      } catch (e: any) {
        showError(e?.message ?? "Upload failed. Please try again.");
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
        showError(e?.message ?? "Upload failed. Please try again.");
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
        showError(e?.message ?? "Upload failed. Please try again.");
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
    if (!storeName.trim()) missing.push("Store Name");
    if (!storeType.trim()) missing.push("Store Type");
    if (!logo) missing.push("Store Logo");
    if (picturesCount < 3) missing.push("At least 3 Store Pictures");
    if (picturesCount > 6) missing.push("Maximum 6 Store Pictures");
    return missing;
  };

  const getBusinessStepMissing = () => {
    const missing: string[] = [];
    if (!registrationNumber.trim()) missing.push("Registration Number");
    if (!businessDocumentImage) missing.push("Business Document Image");
    return missing;
  };

  const getLocationStepMissing = () => {
    const missing: string[] = [];
    if (!address.trim()) missing.push("Address");
    if (!hasPin) missing.push("Pin location on the map");
    if (effectiveRadius < 50 || effectiveRadius > 500) missing.push("Radius (50–500m)");
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

  const setPin = (lat: number, lng: number) => {
    setLatitude(String(lat));
    setLongitude(String(lng));
  };

  const handleGetCurrent = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setModal({
        title: "Permission Required",
        message: "Location permission is required to get your current location.",
        buttons: [{ label: "OK", onPress: () => setModal(null), variant: "secondary" }],
      });
      return;
    }

    const loc =
      (await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }).catch(() => null)) ??
      (await Location.getLastKnownPositionAsync({}).catch(() => null));

    if (!loc) {
      showError("Could not get current location. Please try again.");
      return;
    }

    setPin(loc.coords.latitude, loc.coords.longitude);
  };

  const goBack = () => {
    if (activeStep === "business") setActiveStep("store");
    else if (activeStep === "location") setActiveStep("business");
  };

  const goNext = () => {
    if (activeStep === "store") {
      const missing = getStoreStepMissing();
      if (missing.length > 0) {
        setModal({
          title: "Store details required",
          message: `Please complete: ${missing.join(", ")}.`,
          buttons: [{ label: "OK", onPress: () => setModal(null), variant: "secondary" }],
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
          title: "Business details required",
          message: `Please complete: ${missing.join(", ")}.`,
          buttons: [{ label: "OK", onPress: () => setModal(null), variant: "secondary" }],
        });
        return;
      }
      setActiveStep("location");
      return;
    }

    if (!isFormValid) {
      const missing = getLocationStepMissing();

      setModal({
        title: "Missing details",
        message:
          missing.length > 0
            ? `Please complete: ${missing.join(", ")}.`
            : "Please complete all required fields before creating the store.",
        buttons: [{ label: "OK", onPress: () => setModal(null), variant: "secondary" }],
      });
      return;
    }

    const create = async () => {
      try {
        setIsSubmitting(true);
        const {  data: { user }, } = await supabase.auth.getUser();
        const newStore = await createStore({
          name: storeName.trim(),
          type: storeType,
          address: address.trim(),
          latitude: hasPin ? parsedLat : null,
          longitude: hasPin ? parsedLng : null,
          phone: phone.trim() || undefined,
          registrationNumber: registrationNumber.trim() || undefined,
          businessDocumentImage: businessDocumentImage ?? null,
          storeOpen: storeOpen.trim() || null,
          storeClose: storeClose.trim() || null,
          ownerId: user.id,
          storeLogo: logo ?? null,
          storePictures: pictures ?? null,
          radius: radius,
        });

        setModal({
          title: "Store created",
          message: "Your store has been submitted for review.",
          buttons: [
            {
              label: "View store",
              variant: "primary",
              onPress: () => {
                setModal(null);
                router.replace(`/(store_manager)/view-store/${newStore.id}`);
              },
            },
          ],
        });
        resetForm();
      } catch (e: any) {
        showError(e?.message ?? "Failed to create store. Please try again.");
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
      <View
				className="bg-background dark:bg-[#111921] border-b border-slate-200 dark:border-slate-800 flex-row items-center h-15 px-2"
			>
				<TouchableOpacity
					className="w-10 h-10 rounded-full items-center justify-center"
					activeOpacity={0.7}
					onPress={() => router.push("/(store_manager)/stores")}
				>
					<MaterialIcons name="chevron-left" size={22} color="#0F172A" />
				</TouchableOpacity>
	
				<Text className="flex-1 text-center text-[17px] font-poppins-bold text-slate-900 dark:text-slate-100 pr-10">
					Create Store
				</Text>
			</View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      >
        {activeStep === "store" && (
          <View className="gap-2">
            <Text className="text-slate-900 dark:text-slate-100 text-md font-poppins-bold">
              Store Details
            </Text>
            <View className="gap-4">
              <View className="flex flex-col gap-2">
                <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium">
                  Store Name <Text className="text-red-500 dark:text-red-400">*</Text>
                </Text>
                <TextInput
                  className="w-full rounded-xl bg-white dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 h-12 px-4 font-poppins"
                  placeholder="e.g. Blue Bottle Coffee"
                  placeholderTextColor="#94A3B8"
                  value={storeName}
                  onChangeText={setStoreName}
                />
              </View>

              <View className="flex-1 flex-col gap-2 justify-start">
                <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium px-1">
                  Store Type <Text className="text-red-500 dark:text-red-400">*</Text>
                </Text>
                <View className="flex-row flex-wrap gap-2 mt-1">
                  {store_types_options.map((type) => {
                    const selected = storeType === type.value;
                    return (
                      <TouchableOpacity
                        key={type.value}
                        activeOpacity={0.8}
                        onPress={() => setStoreType(type.value)}
                        className={`px-3 py-1.5 rounded-full border ${
                          selected
                            ? "bg-primary/10 dark:bg-primary/10 border-primary/10 dark:border-primary/10"
                            : "bg-slate-200 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800/50"
                        }`}
                      >
                        <Text
                          className={`text-xs font-poppins-medium ${
                            selected
                              ? "text-primary dark:text-slate-100"
                              : "text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View className="flex-row gap-4 gap-y-2">
                <View className="flex-1 flex-col gap-2">
                  <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium px-1">
                    Store Logo <Text className="text-red-500 dark:text-red-400">*</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() => pickImage("logo")}
                    disabled={isUploadingImage}
                    className="relative w-32 h-32 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 flex flex-col items-center justify-center gap-1 overflow-hidden"
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
                          <MaterialIcons name="close" size={14} color="#fff" />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <MaterialIcons name="add-a-photo" size={18} color="#94A3B8" />
                        <Text className="text-[10px] text-slate-500 font-poppins">Logo</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              
              <View className="flex-1 flex-col gap-2">
                <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium px-1">
                  Store Pictures <Text className="text-red-500 dark:text-red-400">*</Text>
                </Text>
                <Text className="text-slate-600 dark:text-slate-400 text-xs font-poppins mb-3 px-1">
                  You must add at least 3, and up to 6, store pictures. Tap any box to add or replace a photo.
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
                              <MaterialIcons name="close" size={14} color="#fff" />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => pickImage("picture", index)}
                            disabled={isUploadingImage || (pictures?.length ?? 0) >= 6}
                            className="flex-1 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 items-center justify-center min-h-[80px]"
                          >
                            <MaterialIcons name="add-a-photo" size={20} color="#94A3B8" />
                            <Text className="text-[10px] text-slate-500 font-poppins mt-0.5">Add</Text>
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
          <View className="gap-5">
            <Text className="text-slate-900 dark:text-slate-100 text-base font-poppins-bold">
              Business Details
            </Text>

            <View className="gap-4">
              <View className="flex flex-col gap-1.5">
                <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium px-1">
                  Phone Number
                </Text>
                <View className="relative">
                  <TextInput
                    className="w-full rounded-xl bg-white dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 h-12 pl-4 pr-4 font-poppins"
                    placeholder="0912 - 234 - 5678"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </View>

              <View className="flex flex-col gap-1.5">
                <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium px-1">
                  Business Registration Number <Text className="text-red-500 dark:text-red-400">*</Text>
                </Text>
                <TextInput
                  className="w-full rounded-xl bg-white dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 h-12 px-4 font-poppins"
                  placeholder="e.g. TAX-ID-123456"
                  placeholderTextColor="#94A3B8"
                  value={registrationNumber}
                  onChangeText={setRegistrationNumber}
                />
              </View>

              <View className="flex flex-col gap-2">
                <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium px-1">
                  Business Document <Text className="text-red-500 dark:text-red-400">*</Text>
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
                        <MaterialIcons name="close" size={16} color="gray" />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <MaterialIcons name="description" size={24} color="#94A3B8" />
                      <Text className="text-xs text-slate-500 font-poppins mt-1">
                        Upload document image
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1 flex-col gap-1.5">
                  <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium px-1">
                    Opening time
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowOpenTimePicker(true)}
                    className="w-full rounded-xl bg-white dark:bg-slate-800/50 h-12 px-4 justify-center border border-slate-200 dark:border-slate-700"
                    activeOpacity={0.8}
                  >
                    <Text className="text-slate-900 dark:text-slate-100 font-poppins">
                      {storeOpen || "09:00"}
                    </Text>
                  </TouchableOpacity>
                  {showOpenTimePicker && (
                    Platform.OS === "android" ? (
                      <DateTimePicker
                        value={timeStringToDate(storeOpen || "09:00", 9, 0)}
                        mode="time"
                        onChange={(_, d) => {
                          if (d) setStoreOpen(dateToTimeString(d));
                          setShowOpenTimePicker(false);
                        }}
                      />
                    ) : (
                      <RNModal visible transparent animationType="slide">
                        <TouchableOpacity
                          className="flex-1 bg-black/40 justify-end"
                          activeOpacity={1}
                          onPress={() => setShowOpenTimePicker(false)}
                        >
                          <TouchableOpacity
                            activeOpacity={1}
                            onPress={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-800 rounded-t-2xl pb-8 pt-2"
                          >
                            <DateTimePicker
                              value={timeStringToDate(storeOpen || "09:00", 9, 0)}
                              mode="time"
                              onChange={(_, d) => {
                                if (d) setStoreOpen(dateToTimeString(d));
                              }}
                            />
                            <View className="px-4">
                              <Button
                                label="Done"
                                onPress={() => setShowOpenTimePicker(false)}
                                variant="primary"
                                fullWidth
                              />
                            </View>
                          </TouchableOpacity>
                        </TouchableOpacity>
                      </RNModal>
                    )
                  )}
                </View>
                <View className="flex-1 flex-col gap-1.5">
                  <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium px-1">
                    Closing time
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowCloseTimePicker(true)}
                    className="w-full rounded-xl bg-white dark:bg-slate-800/50 h-12 px-4 justify-center border border-slate-200 dark:border-slate-700"
                    activeOpacity={0.8}
                  >
                    <Text className="text-slate-900 dark:text-slate-100 font-poppins">
                      {storeClose || "21:00"}
                    </Text>
                  </TouchableOpacity>
                  {showCloseTimePicker && (
                    Platform.OS === "android" ? (
                      <DateTimePicker
                        value={timeStringToDate(storeClose || "21:00", 21, 0)}
                        mode="time"
                        onChange={(_, d) => {
                          if (d) setStoreClose(dateToTimeString(d));
                          setShowCloseTimePicker(false);
                        }}
                      />
                    ) : (
                      <RNModal visible transparent animationType="slide">
                        <TouchableOpacity
                          className="flex-1 bg-black/40 justify-end"
                          activeOpacity={1}
                          onPress={() => setShowCloseTimePicker(false)}
                        >
                          <TouchableOpacity
                            activeOpacity={1}
                            onPress={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-800 rounded-t-2xl pb-8 pt-2"
                          >
                            <DateTimePicker
                              value={timeStringToDate(storeClose || "21:00", 21, 0)}
                              mode="time"
                              onChange={(_, d) => {
                                if (d) setStoreClose(dateToTimeString(d));
                              }}
                            />
                            <Button
                              label="Done"
                              onPress={() => setShowCloseTimePicker(false)}
                              variant="primary"
                              fullWidth
                            />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      </RNModal>
                    )
                  )}
                </View>
              </View>
            </View>
          </View>
        )}

        {activeStep === "location" && (
          <View className="gap-5">
            <Text className="text-slate-900 dark:text-slate-100 text-base font-poppins-bold">
              Location Details
            </Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-poppins text-slate-500 dark:text-slate-400">
                Tap the map to drop a pin.
              </Text>
              <TouchableOpacity
                className="flex-row items-center gap-1"
                activeOpacity={0.8}
                onPress={handleGetCurrent}
              >
                <MaterialIcons name="my-location" size={16} color="#FF6600" />
                <Text className="text-primary text-xs font-poppins-bold">
                  Get Current
                </Text>
              </TouchableOpacity>
            </View>

            <View className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
              <View pointerEvents="box-none">
                <MapView
                  style={{ height: 400, width: "100%" }}
                  styleURL={
                    isDark
                      ? "mapbox://styles/mapbox/navigation-night-v1"
                      : "mapbox://styles/mapbox/streets-v12"
                  }
                  onPress={(e) => {
                    const coords = (e as any)?.geometry?.coordinates as [number, number] | undefined;
                    if (!coords) return;
                    const [lng, lat] = coords;
                    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
                    setPin(lat, lng);
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
                  <PointAnnotation
                    id="storeLocation"
                    coordinate={[parsedLng, parsedLat]}
                  >
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
              </View>
            </View>

            <View className="flex flex-col gap-1.5">
              <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium px-1">
                Landmark / Address <Text className="text-red-500 dark:text-red-400">*</Text>
              </Text>
              <TextInput
                className="w-full rounded-xl bg-white dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 px-4 py-3 font-poppins"
                placeholder="Enter full physical address"
                placeholderTextColor="#94A3B8"
                multiline
                textAlignVertical="top"
                value={address}
                onChangeText={setAddress}
              />
            </View>

            <View className="mt-2">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-slate-700 dark:text-slate-300 text-sm font-poppins-medium">
                 Store Radius <Text className="text-red-500 dark:text-red-400">*</Text>
                </Text>
                <Text className="text-primary text-sm font-poppins-bold">{radius || 50}m</Text>
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
                <Text className="text-xs text-slate-500 font-poppins">50m</Text>
                <Text className="text-xs text-slate-500 font-poppins">500m</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View className="px-4 py-4">
        <View className="flex-row gap-3">
          {activeStep !== "store" && (
            <View className="flex-1">
              <Button
                label="Back"
                onPress={goBack}
                variant="secondary"
                loading={false}
                fullWidth={true}
              />
            </View>
          )}
          <View className="flex-1">
            <Button
              label={activeStep === "location" ? "Create Store" : "Continue"}
              onPress={goNext}
              variant="primary"
              icon={activeStep === "location" ? "add" : undefined}
              loading={isSubmitting}
              fullWidth={true}
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
    </SafeAreaView>
  );
}
