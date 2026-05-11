import React, { useState } from "react";
import { View, SafeAreaView, ScrollView } from "@/tw";
import { router } from "expo-router";
import { Button } from "@/components/button";
import * as ImagePicker from "expo-image-picker";
import { Modal, type ModalButton } from "@/components/modal";
import {
  createStore,
  updateStore,
  uploadStoreImage,
  StoreImageKind,
  resolveStoreTimezone,
} from "@/services/store-service";
import { canOwnerCreateAnotherStore } from "@/services/store-manager/subscription-limits";
import { supabase } from "@/supabase/supabase";
import Mapbox from "@rnmapbox/maps";
import { useColorScheme, Platform } from "react-native";
import { useCreateStoreStore } from "@/store/store-manager/create-store-store";
import {
  aspect_ratios,
  DEFAULT_STORE_CLOSE,
  DEFAULT_STORE_OPEN,
  type PickImageType,
  STEPS,
} from "@/type/store-manager/store";
import * as Location from "expo-location";
import { AppHeader } from "@/components/header";
import { useTranslation } from "react-i18next";
import {
  StoreStep,
  BusinessStep,
  LocationStep,
} from "@/components/store_manager/create-store";

const WEB_MAX_WIDTH = 896;
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN);

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
    const dataUri = `data:${mimeType};base64,${asset.base64}`;

    if (type === "logo") {
      setIsUploadingImage(true);
      try {
        setLogo(dataUri);
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
        setBusinessDocumentImage(dataUri);
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
        const next = [...current];
        const index =
          pictureIndex !== undefined && pictureIndex >= 0 && pictureIndex < next.length
            ? pictureIndex
            : next.length;
        if (index < next.length) next[index] = dataUri;
        else next.push(dataUri);
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

  const submitCreateStore = async () => {
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
        radius,
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

    void submitCreateStore();
  };

  const renderActiveStep = () => {
    if (activeStep === "store") {
      return (
        <StoreStep
          storeName={storeName}
          setStoreName={setStoreName}
          storeType={storeType}
          setStoreType={setStoreType}
          logo={logo}
          setLogo={setLogo}
          pictures={pictures}
          setPictures={setPictures}
          isUploadingImage={isUploadingImage}
          pickImage={pickImage}
          t={t}
        />
      );
    }

    if (activeStep === "business") {
      return (
        <BusinessStep
          phone={phone}
          setPhone={setPhone}
          registrationNumber={registrationNumber}
          setRegistrationNumber={setRegistrationNumber}
          businessDocumentImage={businessDocumentImage}
          setBusinessDocumentImage={setBusinessDocumentImage}
          storeOpen={storeOpen}
          setStoreOpen={setStoreOpen}
          storeClose={storeClose}
          setStoreClose={setStoreClose}
          storeDays={storeDays}
          toggleStoreDay={toggleStoreDay}
          isUploadingImage={isUploadingImage}
          pickImage={pickImage}
          isDark={isDark}
          t={t}
        />
      );
    }

    return (
      <LocationStep
        address={address}
        setAddress={setAddress}
        latitude={latitude}
        longitude={longitude}
        timezone={timezone}
        setTimezone={setTimezone}
        radius={radius}
        setRadius={setRadius}
        isDark={isDark}
        isResolvingTimezone={isResolvingTimezone}
        webMapUnavailable={webMapUnavailable}
        onWebMapUnavailable={handleWebMapUnavailable}
        setPin={setPin}
        onGetCurrent={handleGetCurrent}
        setScrollEnabled={setScrollEnabled}
        t={t}
      />
    );
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
          ...(isWeb ? { width: "100%", alignItems: "center" } : null),
        }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      >
        {isWeb ? (
          <View style={{ width: "100%", maxWidth: WEB_MAX_WIDTH }}>
            {renderActiveStep()}
          </View>
        ) : (
          renderActiveStep()
        )}
      </ScrollView>

      <View className="px-4 py-4 bg-white">
        <View
          className={isWeb ? "items-center" : ""}
          style={isWeb ? { width: "100%" } : undefined}
        >
          <View style={isWeb ? { width: "100%", maxWidth: WEB_MAX_WIDTH } : undefined}>
            <View className="flex-row gap-3">
              {activeStep !== "store" && (
                <View className="flex-1">
                  <Button
                    label={t("store_manager.createStore.back")}
                    onPress={goBack}
                    variant="secondary"
                    loading={false}
                    fullWidth
                  />
                </View>
              )}
              <View className="flex-1">
                <Button
                  label={
                    activeStep === "location"
                      ? t("store_manager.createStore.createStore")
                      : t("store_manager.createStore.continue")
                  }
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
