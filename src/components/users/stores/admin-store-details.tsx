import React, { useEffect, useState, useRef, useMemo } from "react";
import { ScrollView, Platform, useColorScheme } from "react-native";
import Carousel from 'react-native-reanimated-carousel';
import { View, Text, TouchableOpacity } from "@/tw";
import { useTranslation } from "react-i18next";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Image } from "expo-image";
import Mapbox, { Camera, MapView, MarkerView } from "@rnmapbox/maps";
import { ScreenWrapper } from "@/components/ui/screen-wrapper";
import { AdminStoreRow } from "@/services/store-service";
import { ImageViewerModal } from "@/components/ui/image-viewer-modal";
import { getStoreCategoryBadge, getEffectiveStatus, StoreStatusKey } from "@/type/super-admin/user";
import { shouldUseInteractiveMapbox } from "@/utils/mapbox-platform";
import { canOwnerCreateAnotherStore } from "@/services/store-manager/subscription-limits";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

const isWeb = Platform.OS === "web";

const twConfig = require("../../../../tailwind.config.js");
const twColors = twConfig?.theme?.extend?.colors || { success: "#10b981", danger: "#ef4444" };

type StatusKey = StoreStatusKey;

const STATUS_CONFIG: Record<StatusKey, {
  icon: "schedule" | "check-circle" | "cancel";
  color: string; bg: string; border: string;
}> = {
  pending_review: { icon: "schedule",    color: "#92400e", bg: "#fef3c7", border: "#fde68a" },
  active:         { icon: "check-circle", color: twColors.success, bg: "#dcfce7", border: "#bbf7d0" },
  inactive:       { icon: "cancel",       color: twColors.danger,  bg: "#fee2e2", border: "#fecaca" },
};

const InfoRow = ({
  icon, label, value,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  value?: string | null;
}) => (
  <View className="flex-row items-start gap-3 py-3 border-b border-slate-50 dark:border-neutral-800/60 last:border-0">
    <View className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-neutral-800 items-center justify-center mt-0.5">
      <MaterialIcons name={icon} size={16} color="#94A3B8" />
    </View>
    <View className="flex-1">
      <Text className="text-[10px] font-poppins-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{label}</Text>
      <Text className="text-sm font-poppins-medium text-slate-700 dark:text-slate-200 leading-5">{value || "—"}</Text>
    </View>
  </View>
);

export function AdminStoreDetails({
  store,
  subscription,
  ownerActiveStoresCount = 0,
  onBack,
  onApprove,
  onReject,
}: {
  store: AdminStoreRow;
  subscription?: any;
  ownerActiveStoresCount?: number;
  onBack: () => void;
  onApprove: (store: AdminStoreRow) => void;
  onReject: (store: AdminStoreRow) => void;
}) {
  const { t: translate, i18n } = useTranslation();

  const STATUS_LABELS: Record<StatusKey, string> = {
    pending_review: translate("super_admin.stores.status.pending"),
    active:         translate("super_admin.stores.status.active"),
    inactive:       translate("super_admin.stores.status.inactive"),
  };

  const [viewingDocUri, setViewingDocUri] = useState<string | null>(null);
  const [currentPicIndex, setCurrentPicIndex] = useState(0);
  const scrollRef = useRef<any>(null);
  const [layoutWidth, setLayoutWidth] = useState(0);

  const isDark = useColorScheme() === "dark";

  const statusKey = getEffectiveStatus(store);
  const statusCfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.pending_review;
  const isPending = statusKey === "pending_review";

  const [canCreateAnotherStore, setCanCreateAnotherStore] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const ownerId = store.owner_id;
    if (!ownerId) return;

    (async () => {
      try {
        const res = await canOwnerCreateAnotherStore(ownerId);
        if (!cancelled) setCanCreateAnotherStore(res.allowed);
      } catch {
        if (!cancelled) setCanCreateAnotherStore(true);
      }
    })();

    return () => { cancelled = true; };
  }, [store.owner_id]);

  const registeredDate = useMemo(() => {
    return new Date(store.created_at).toLocaleDateString(
      i18n.language === "ja" ? "ja-JP" : "en-US",
      { month: "short", day: "numeric", year: "numeric" }
    );
  }, [store.created_at, i18n.language]);

  const approvedDate = useMemo(() => {
    if (!store.approved_at) return null;
    return new Date(store.approved_at).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  }, [store.approved_at]);

  const BANNER_HEIGHT = isWeb ? 260 : 190;
  const LOGO_SIZE = isWeb ? 96 : 84;
  const LOGO_OFFSET = isWeb ? -LOGO_SIZE / 2 : -LOGO_SIZE / 2 + 4;

  return (
    <ScreenWrapper className="flex-1 bg-[#F1F5F9] dark:bg-darkBackgroundMuted">
      <ScrollView
        className="flex-1"
        contentContainerStyle={[
          { paddingBottom: isPending ? 80 : 32 },
          isWeb && { width: "100%", maxWidth: 840, alignSelf: "center", backgroundColor: "transparent" },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        style={{ backgroundColor: isDark ? "#0A0A0A" : "#F1F5F9" }}
      >
        {/* ── Banner ── */}
        <View className="relative w-full overflow-visible" style={{ height: BANNER_HEIGHT, backgroundColor: "#0F172A" }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => store.store_pictures?.[0] && setViewingDocUri(store.store_pictures[0])}
            className="w-full h-full"
          >
            {store.store_pictures && store.store_pictures.length > 0 ? (
              <Image
                source={{ uri: store.store_pictures[0] }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                contentPosition="center"
              />
            ) : (
              <View className="w-full h-full items-center justify-center bg-slate-800">
                <MaterialIcons name="storefront" size={56} color="#334155" />
              </View>
            )}
          </TouchableOpacity>

          {/* Scrim */}
          <View
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.28)" }}
            pointerEvents="none"
          />

          {/* Back button */}
          <View className="absolute top-5 left-5 z-50">
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.75}
              className="w-9 h-9 rounded-full bg-white/90 dark:bg-neutral-900/90 items-center justify-center shadow-md shadow-black/20"
            >
              <ChevronLeft size={20} color={isDark ? "#F1F5F9" : "#0F172A"} />
            </TouchableOpacity>
          </View>

          {/* Status pill */}
          <View
            className="absolute top-5 right-5 z-10 flex-row items-center gap-1.5 px-3 py-1.5 rounded-full shadow-sm shadow-black/20"
            style={{ backgroundColor: statusCfg.bg, borderWidth: 1, borderColor: statusCfg.border }}
          >
            <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusCfg.color }} />
            <Text className="text-[10px] font-poppins-bold uppercase tracking-wider" style={{ color: statusCfg.color }}>
              {STATUS_LABELS[statusKey]}
            </Text>
          </View>

          {/* Logo */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => store.logo && setViewingDocUri(store.logo)}
            className="absolute left-5 z-20 rounded-full bg-white shadow-xl shadow-black/30 overflow-hidden"
            style={{ width: LOGO_SIZE, height: LOGO_SIZE, bottom: LOGO_OFFSET, borderWidth: 3, borderColor: "#ffffff" }}
          >
            {store.logo ? (
              <Image source={{ uri: store.logo }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
            ) : (
              <View className="flex-1 items-center justify-center bg-slate-100">
                <MaterialIcons name="storefront" size={32} color="#94A3B8" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Content ── */}
        <View className="px-4 gap-y-3" style={{ paddingTop: LOGO_SIZE / 2 + 16 }}>

          {/* Store Identity Card */}
          <View className="bg-white dark:bg-darkBackgroundCard rounded-3xl p-5 border border-slate-100 dark:border-neutral-800/50 shadow-sm shadow-slate-100 dark:shadow-none">
            {/* Name + owner */}
            <View className="mb-3">
              <Text className="text-xl font-poppins-bold text-slate-900 dark:text-slate-50 leading-7" numberOfLines={2}>
                {store.name || "Unnamed Store"}
              </Text>
              <Text className="text-xs font-poppins-medium text-slate-400 dark:text-slate-500 mt-0.5">
                {store.owner_name ? `Owner: ${store.owner_name}` : "Owner not specified"}
              </Text>
            </View>

            {/* Badges row */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {/* Category */}
              <View className={`px-2.5 py-1 rounded-full ${getStoreCategoryBadge(store.type).bg} flex-row items-center gap-1`}>
                <Text className={`text-[10px] font-poppins-bold uppercase tracking-wide ${getStoreCategoryBadge(store.type).text}`}>
                  {store.type || "General"}
                </Text>
              </View>

              {/* Subscription */}
              {subscription ? (
                <View
                  className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full border ${
                    subscription.payment_status === "paid"
                      ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  }`}
                >
                  <MaterialIcons
                    name={subscription.payment_status === "paid" ? "verified" : "warning"}
                    size={11}
                    color={subscription.payment_status === "paid" ? "#10B981" : "#EF4444"}
                  />
                  <Text className={`text-[10px] font-poppins-bold uppercase tracking-wide ${
                    subscription.payment_status === "paid"
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-red-700 dark:text-red-400"
                  }`}>
                    Subscription {subscription.payment_status}
                  </Text>
                </View>
              ) : !canCreateAnotherStore && (
                <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <MaterialIcons name="star-outline" size={11} color="#D97706" />
                  <Text className="text-[10px] font-poppins-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                    Subscription Required
                  </Text>
                </View>
              )}

              {/* Registered date */}
              <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700">
                <MaterialIcons name="calendar-today" size={10} color="#94A3B8" />
                <Text className="text-[10px] font-poppins-semibold text-slate-400 dark:text-slate-500">
                  {registeredDate}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View className="h-px bg-slate-100 dark:bg-neutral-800 mb-4" />

            {/* Info rows */}
            {store.registration_number && (
              <InfoRow
                icon="badge"
                label={translate("super_admin.stores.details.registrationNumber", { defaultValue: "Registration No." })}
                value={store.registration_number}
              />
            )}

            {/* Operating Hours */}
            <View className="flex-row items-start gap-3 py-3 border-b border-slate-50 dark:border-neutral-800/60">
              <View className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-neutral-800 items-center justify-center mt-0.5">
                <MaterialIcons name="schedule" size={16} color="#94A3B8" />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-poppins-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  {translate("super_admin.stores.details.operatingHours", { defaultValue: "Operating Hours" })}
                </Text>
                <View className="flex-row items-center gap-2">
                  <View className="flex-row items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-xl border border-amber-100 dark:border-amber-800/40">
                    <MaterialIcons name="wb-sunny" size={13} color="#F59E0B" />
                    <Text className="text-xs font-poppins-semibold text-amber-700 dark:text-amber-400">
                      {store.store_open ? store.store_open.slice(0, 5) : "09:00"}
                    </Text>
                  </View>
                  <View className="w-4 h-px bg-slate-200 dark:bg-neutral-700" />
                  <View className="flex-row items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800/40">
                    <MaterialIcons name="nights-stay" size={13} color="#6366F1" />
                    <Text className="text-xs font-poppins-semibold text-indigo-700 dark:text-indigo-400">
                      {store.store_close ? store.store_close.slice(0, 5) : "21:00"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Approval status (non-pending) */}
            {store.status !== "pending_review" && (
              <View
                className={`mt-3 flex-row items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border self-start ${
                  statusKey === "inactive"
                    ? "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800/30"
                    : "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30"
                }`}
              >
                <View
                  className={`w-6 h-6 rounded-full items-center justify-center ${
                    statusKey === "inactive" ? "bg-red-500" : "bg-emerald-500"
                  }`}
                >
                  <MaterialIcons
                    name={statusKey === "inactive" ? "refresh" : "verified"}
                    size={13}
                    color="#ffffff"
                  />
                </View>
                <Text
                  className={`text-[10px] font-poppins-bold uppercase tracking-wider ${
                    statusKey === "inactive"
                      ? "text-red-700 dark:text-red-400"
                      : "text-emerald-700 dark:text-emerald-400"
                  }`}
                  style={{ lineHeight: 14, includeFontPadding: false } as any}
                >
                  {statusKey === "inactive"
                    ? "Requires Resubmission"
                    : `Approved ${approvedDate ?? "N/A"}`}
                </Text>
              </View>
            )}

            {/* Store Photos */}
            {store.store_pictures && store.store_pictures.length > 0 && (
              <View className="mt-5 pt-5 border-t border-slate-100 dark:border-neutral-800">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-sm font-poppins-bold text-slate-800 dark:text-slate-100">Store Photos</Text>
                  <View className="bg-slate-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full">
                    <Text className="text-[10px] font-poppins-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      {store.store_pictures.length} {store.store_pictures.length === 1 ? "Photo" : "Photos"}
                    </Text>
                  </View>
                </View>

                <View
                  className="relative w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-neutral-800"
                  onLayout={(e) => setLayoutWidth(e.nativeEvent.layout.width)}
                  style={{ height: isWeb ? 420 : 200 }}
                >
                  {layoutWidth > 0 && Carousel ? (
                    <View className="flex-1 relative">
                      <Carousel
                        ref={scrollRef}
                        loop
                        width={layoutWidth}
                        height={isWeb ? 420 : 200}
                        autoPlay={false}
                        data={store.store_pictures}
                        scrollAnimationDuration={700}
                        onSnapToItem={(index) => setCurrentPicIndex(index)}
                        renderItem={({ item: uri }) => (
                          <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => setViewingDocUri(uri)}
                            className="w-full h-full"
                          >
                            <Image source={{ uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                          </TouchableOpacity>
                        )}
                      />

                      {isWeb && store.store_pictures.length > 1 && (
                        <>
                          <TouchableOpacity
                            onPress={() => scrollRef.current?.prev()}
                            className="absolute left-3 top-1/2 -mt-5 w-10 h-10 bg-black/40 rounded-full items-center justify-center z-30"
                          >
                            <ChevronLeft size={22} color="white" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => scrollRef.current?.next()}
                            className="absolute right-3 top-1/2 -mt-5 w-10 h-10 bg-black/40 rounded-full items-center justify-center z-30"
                          >
                            <ChevronRight size={22} color="white" />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  ) : (
                    <View className="w-full h-full">
                      {store.store_pictures[0] && (
                        <Image source={{ uri: store.store_pictures[0] }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                      )}
                    </View>
                  )}

                  {store.store_pictures.length > 1 && (
                    <View className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-1.5 z-10" pointerEvents="none">
                      {store.store_pictures.map((_, idx) => (
                        <View
                          key={idx}
                          className={`h-1.5 rounded-full ${idx === currentPicIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"}`}
                        />
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* Location & Contact Card */}
          <View className="bg-white dark:bg-darkBackgroundCard rounded-3xl overflow-hidden border border-slate-100 dark:border-neutral-800/50 shadow-sm shadow-slate-100 dark:shadow-none">
            <View className="flex-row items-center gap-2 px-5 pt-5 pb-4">
              <View className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 items-center justify-center">
                <MaterialIcons name="location-on" size={16} color="#EF4444" />
              </View>
              <Text className="text-sm font-poppins-bold text-slate-800 dark:text-slate-100">Location & Contact</Text>
            </View>

            {/* Map */}
            {store.latitude != null && store.longitude != null ? (
              <View style={{ width: "100%", height: 170 }}>
                {shouldUseInteractiveMapbox() && MapView && Mapbox ? (
                  <MapView
                    style={{ flex: 1 }}
                    surfaceView={false}
                    styleURL={isDark ? "mapbox://styles/mapbox/navigation-night-v1" : "mapbox://styles/mapbox/streets-v12"}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    rotateEnabled={false}
                    pitchEnabled={false}
                    attributionEnabled={false}
                    logoEnabled={false}
                  >
                    <Camera
                      centerCoordinate={[Number(store.longitude), Number(store.latitude)]}
                      zoomLevel={15}
                      animationMode="none"
                    />
                    <MarkerView
                      coordinate={[Number(store.longitude), Number(store.latitude)]}
                      anchor={{ x: 0.5, y: 1 }}
                    >
                      <Image
                        source={require("../../../assets/images/markers/default.png")}
                        style={{ width: 36, height: 36 }}
                        contentFit="contain"
                      />
                    </MarkerView>
                  </MapView>
                ) : (
                  <View className="flex-1 items-center justify-center gap-y-1 bg-slate-50 dark:bg-neutral-800">
                    <MaterialIcons name="map" size={28} color={isDark ? "#525252" : "#CBD5E1"} />
                    <Text className="text-[10px] font-poppins text-slate-400 dark:text-slate-500 text-center px-4">
                      Map preview available on Android & Web
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View className="mx-5 mb-1 h-[100px] bg-slate-50 dark:bg-neutral-800/50 rounded-2xl items-center justify-center border border-slate-100 dark:border-neutral-800">
                <MaterialIcons name="map" size={26} color="#CBD5E1" />
                <Text className="text-[11px] font-poppins text-slate-400 mt-1.5">No coordinates provided</Text>
              </View>
            )}

            <View className="px-5 pt-4 pb-5 gap-y-0.5">
              <InfoRow icon="place" label="Store Address" value={store.address} />
              {store.phone && <InfoRow icon="phone" label="Phone Number" value={store.phone} />}
            </View>
          </View>

          {/* Verification Card */}
          <View className="bg-white dark:bg-darkBackgroundCard rounded-3xl p-5 border border-slate-100 dark:border-neutral-800/50 shadow-sm shadow-slate-100 dark:shadow-none">
            <View className="flex-row items-center gap-2 mb-4">
              <View className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 items-center justify-center">
                <MaterialIcons name="verified" size={16} color="#10B981" />
              </View>
              <Text className="text-sm font-poppins-bold text-slate-800 dark:text-slate-100">Verification</Text>
            </View>

            {store.business_document_image ? (
              <TouchableOpacity
                onPress={() => setViewingDocUri(store.business_document_image)}
                activeOpacity={0.7}
                className="bg-slate-50 dark:bg-neutral-800/50 rounded-2xl p-3.5 flex-row items-center border border-slate-100 dark:border-neutral-800"
              >
                <View className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 dark:border-neutral-700 bg-white">
                  <Image source={{ uri: store.business_document_image }} style={{ width: 48, height: 48 }} contentFit="cover" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-poppins-semibold text-slate-800 dark:text-slate-100">Business License</Text>
                  <Text className="text-[10px] font-poppins-medium text-slate-400 mt-0.5 uppercase tracking-wider">Tap to view full document</Text>
                </View>
                <View className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 items-center justify-center">
                  <MaterialIcons name="check-circle" size={18} color="#10B981" />
                </View>
              </TouchableOpacity>
            ) : (
              <View className="bg-slate-50 dark:bg-neutral-800/40 rounded-2xl p-5 items-center justify-center border border-dashed border-slate-200 dark:border-neutral-700">
                <MaterialIcons name="folder-off" size={24} color="#CBD5E1" />
                <Text className="text-[11px] font-poppins-semibold text-slate-400 mt-2 uppercase tracking-widest">No Documents Provided</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          {isPending && (
            <View className="flex-row gap-3 pt-1">
              <TouchableOpacity
                onPress={() => onReject(store)}
                activeOpacity={0.8}
                className="flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
              >
                <MaterialIcons name="cancel" size={18} color="#EF4444" />
                <Text className="text-sm font-poppins-bold text-red-600 dark:text-red-400">
                  {translate("super_admin.stores.details.rejectApplication")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onApprove(store)}
                activeOpacity={0.8}
                className="flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-500"
              >
                <MaterialIcons name="check-circle" size={18} color="#ffffff" />
                <Text className="text-sm font-poppins-bold text-white">
                  {translate("super_admin.stores.details.approveStore")}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {viewingDocUri && (
        <ImageViewerModal uri={viewingDocUri} onClose={() => setViewingDocUri(null)} />
      )}
    </ScreenWrapper>
  );
}
