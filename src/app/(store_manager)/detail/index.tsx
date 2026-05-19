import React, { useMemo, useRef, useState } from "react";
import { RefreshControl, Platform, ScrollView as RNScrollView } from "react-native";
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from "@/tw";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import Mapbox, { Camera, MapView, MarkerView } from "@rnmapbox/maps";
import { formatTime } from "@/utils/store_manager/store-utils";
import { useStoreDetail } from "@/hooks/store-manager/use-detail";
import { DetailsSkeleton } from "@/components/skeleton/store_manager/details-skeleton";
import { OptionsMenu } from "@/components/options";
import { AppHeader } from "@/components/header";
import { Modal } from "@/components/modal";
import { shouldUseInteractiveMapbox } from "@/utils/mapbox-platform";
import { Building2, ChevronLeft, ChevronRight, File, MapPin, MapPinOff, Pencil } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { store_types_options } from "@/type/store-manager/store";
import { STATUS_CONFIG } from "@/type/store-manager/detail";

function webContainerStyle(paddingTop = 16, paddingBottom = 48) {
  return {
    paddingBottom,
    paddingTop,
    paddingHorizontal: Platform.OS === "web" ? 0 : 16,
    gap: 16,
  } as const;
}

export default function DetailIndex() {
  const router = useRouter();
  const { t: translate } = useTranslation();
  const {
    storeId,
    detail,
    loading,
    refreshing,
    handleRefresh,
    pictures,
    hasCoords,
    isDark,
  } = useStoreDetail();

  const statusKey = detail?.status && detail.status in STATUS_CONFIG ? detail.status : "pending_review";
  const statusCfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.pending_review;
  const statusLabel = translate(`storeManager.detail.status.${statusKey}`);

  const storeTypeLabel = useMemo(() => {
    if (!detail?.type) return "—";
    if (store_types_options.some((o) => o.value === detail.type)) {
      return translate(`storeManager.storeTypes.${detail.type}`);
    }
    return detail.type;
  }, [detail?.type, translate]);

  const notSet = translate("storeManager.detail.notSet");
  const [docPreviewVisible, setDocPreviewVisible] = useState(false);
  const bannerScrollRef = useRef<RNScrollView>(null);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [bannerWidth, setBannerWidth] = useState(0);
  const validPictures = pictures.filter(Boolean) as string[];

  const scrollToIndex = (idx: number) => {
    if (!bannerScrollRef.current || bannerWidth === 0) return;
    const clamped = Math.max(0, Math.min(idx, validPictures.length - 1));
    setBannerIndex(clamped);
    bannerScrollRef.current.scrollTo({ x: clamped * bannerWidth, animated: true });
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-backgroundMuted dark:bg-darkBackgroundMuted">
      <AppHeader
        title={detail?.name || translate("storeManager.viewStore.fallbackTitle")}
        description={detail?.address || translate("storeManager.detail.headerDefaultDescription")}
        onBackPress={() => {
          router.push(`/(store_manager)/view-store/${storeId}`);
        }}
        rightIcon={
          <OptionsMenu
            options={[
              {
                label: translate("label.edit"),
                icon: <Pencil size={14} color="text-primary" />,
                onPress: () => router.push({ pathname: "/(store_manager)/detail/edit-details", params: { storeId } }),
              },
            ]}
          />
        }
        onRightIconPress={() => router.push({ pathname: "/(store_manager)/detail/edit-details", params: { storeId } })}
      />

      {loading ? (
        <DetailsSkeleton />
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={webContainerStyle()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#FF6600"]}
              tintColor="#FF6600"
            />
          }
        >
          <View style={Platform.OS === "web" ? { alignItems: "center", paddingHorizontal: 16 } : undefined}>
            <View
              className="gap-y-3"
              style={Platform.OS === "web" ? { width: "100%", maxWidth: 860 } : undefined}
            >

              <View className="bg-white dark:bg-darkBackgroundCard rounded-xl border border-slate-100 dark:border-darkBorder">
                <View
                  className="rounded-t-xl overflow-hidden"
                  style={{ height: 160 }}
                  onLayout={(e) => setBannerWidth(e.nativeEvent.layout.width)}
                >
                  <RNScrollView
                    ref={bannerScrollRef}
                    horizontal
                    pagingEnabled
                    scrollEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    style={{ height: 160 }}
                    onMomentumScrollEnd={(e) => {
                      if (bannerWidth > 0) {
                        setBannerIndex(Math.round(e.nativeEvent.contentOffset.x / bannerWidth));
                      }
                    }}
                  >
                    {validPictures.length > 0 ? (
                      validPictures.map((pic, idx) => (
                        <Image
                          key={idx}
                          source={{ uri: pic }}
                          style={{ width: bannerWidth || "100%", height: 160 }}
                          contentFit="cover"
                          transition={200}
                        />
                      ))
                    ) : (
                      <View style={{ width: bannerWidth || 320, height: 160 }} className="bg-slate-100 dark:bg-darkBackgroundCard" />
                    )}
                  </RNScrollView>

                  {validPictures.length > 1 && bannerIndex > 0 && (
                    <TouchableOpacity
                      onPress={() => scrollToIndex(bannerIndex - 1)}
                      activeOpacity={0.8}
                      className="absolute left-2 top-0 bottom-0 justify-center"
                    >
                      <View className="w-8 h-8 rounded-full bg-black/40 items-center justify-center">
                        <ChevronLeft size={18} color="#fff" />
                      </View>
                    </TouchableOpacity>
                  )}

                  {validPictures.length > 1 && bannerIndex < validPictures.length - 1 && (
                    <TouchableOpacity
                      onPress={() => scrollToIndex(bannerIndex + 1)}
                      activeOpacity={0.8}
                      className="absolute right-2 top-0 bottom-0 justify-center"
                    >
                      <View className="w-8 h-8 rounded-full bg-black/40 items-center justify-center">
                        <ChevronRight size={18} color="#fff" />
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
    

                <View
                  className={`flex-row items-center ${
                    Platform.OS === "web" ? "px-4" : Platform.OS === "android" ? "px-2" : ""
                  } pb-2`}
                  style={{ marginTop: -28 }}
                >
                  <View
                    className="rounded-full overflow-hidden bg-white dark:bg-darkBackgroundCard"
                    style={{
                      width: 100,
                      height: 100,
                      borderWidth: 6,
                      borderColor: isDark ? "#262626" : "#ffffff",
                    }}
                  >
                    {detail?.logo ? (
                      <Image
                        source={{ uri: detail.logo }}
                        style={{ width: 100, height: 100 }}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <View className="flex-1 bg-orange-50 dark:bg-orange-950 items-center justify-center">
                        <Building2 size={24} color="#FF6600" />
                      </View>
                    )}
                  </View>

                  <View className="flex-1 ml-3 pb-1 pt-10">
                    <View className="flex-row items-center flex-wrap gap-x-2">
                      <Text className="text-base font-poppins-bold text-slate-800 dark:text-darkTextPrimary">
                        {detail?.name || translate("storeManager.detail.unnamedStore")}
                      </Text>
                      <View className={`flex-row items-center gap-x-1 px-2 py-0.5 rounded-full ${statusCfg.bg}`}>
                        <View className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                        <Text className={`text-xs font-poppins-semibold ${statusCfg.text}`}>{statusLabel}</Text>
                      </View>
                    </View>

                    <View className="flex-row items-center flex-wrap mt-0.5 gap-x-1">
                      <Text className="text-xs font-poppins text-textSecondary dark:text-darkTextSecondary">{storeTypeLabel}</Text>
                      {(detail?.phone || detail?.registration_number) && (
                        <View className="w-1 h-4 justify-center items-center mx-2">
                          <View className="w-px h-full bg-slate-300 dark:bg-darkBackgroundCard opacity-60" />
                        </View>
                      )}
                      {detail?.phone && (
                        <>
                          <Text className="text-xs font-poppins text-textSecondary dark:text-darkTextSecondary">{detail.phone}</Text>
                        </>
                      )}
                      {detail?.phone && detail?.registration_number && (
                        <View className="w-1 h-4 justify-center items-center mx-2">
                          <View className="w-px h-full bg-slate-300 dark:bg-darkBackgroundCard opacity-60" />
                        </View>
                      )}
                      {detail?.registration_number && (
                        <>
                          <Text className="text-xs font-poppins text-textSecondary dark:text-darkTextSecondary">{detail.registration_number}</Text>
                        </>
                      )}
                    </View>
               

                    {(detail?.store_open || detail?.store_close || detail?.store_days) && (
                      <View className="flex-row items-center flex-wrap mt-0.5 gap-x-2">
                        <View className="flex-row items-center flex-wrap">
                          {detail?.store_open && (
                            <Text className="text-xs font-poppins text-textSecondary dark:text-darkTextSecondary">
                              {detail.store_open ? formatTime(detail.store_open) : notSet}
                            </Text>
                          )}
                          {detail?.store_open && detail?.store_close && (
                            <Text className="mx-1 text-xs font-poppins text-textSecondary dark:text-darkTextSecondary">-</Text>
                          )}
                          {detail?.store_close && (
                            <Text className="text-xs font-poppins text-textSecondary dark:text-darkTextSecondary">
                              {detail.store_close ? formatTime(detail.store_close) : notSet}
                            </Text>
                          )}
                        </View>

                        {(detail?.store_open || detail?.store_close) && detail?.store_days && (
                          <View className="w-1 h-4 justify-center items-center">
                            <View className="w-px h-full bg-slate-300 dark:bg-darkBackgroundCard opacity-60" />
                          </View>
                        )}

                        {detail?.store_days && (
                          <Text className="text-xs font-poppins text-textSecondary dark:text-darkTextSecondary">
                            {detail.store_days
                              .map((day: string) =>
                                ({
                                  monday: "Mon",
                                  tuesday: "Tue",
                                  wednesday: "Wed",
                                  thursday: "Thu",
                                  friday: "Fri",
                                  saturday: "Sat",
                                  sunday: "Sun"
                                }[day.toLowerCase()] ?? day)
                              )
                              .join(", ")}
                          </Text>
                        )}
                      </View>
                    )}
               
                  </View>
                </View>
           

                {detail?.business_document_image && (
                  <>
                    <View
                      className="py-3 gap-y-2"
                      style={{
                        paddingLeft: Platform.OS === "web" ? 24 : 16,
                        paddingRight: Platform.OS === "web" ? 24 : 16
                      }}
                    >
                      <Text className="text-xs font-poppins-semibold text-textSecondary dark:text-darkTextSecondary mb-1">
                        {translate("label.businessDocument")}
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => setDocPreviewVisible(true)}
                        className="flex-row items-center gap-x-3 border border-slate-100 dark:border-darkBorder rounded-xl px-3 py-2.5"
                      >
                        <View className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/10 items-center justify-center">
                          <File size={18} color="#FF6600" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs font-poppins-semibold text-textPrimary dark:text-darkTextPrimary" numberOfLines={1}>
                            {detail.business_document_image.split("/").pop() ?? translate("label.businessDocument")}
                          </Text>
                          <Text className="text-[10px] font-poppins text-textMuted dark:text-darkTextSecondary mt-0.5">
                            {translate("label.tapToView", "Tap to view")}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                    <Modal
                      visible={docPreviewVisible}
                      onClose={() => setDocPreviewVisible(false)}
                      title={translate("label.businessDocument")}
                      showCloseButton
                      dismissOnBackdrop
                    >
                      <Image
                        source={{ uri: detail.business_document_image }}
                        style={{ width: "100%", aspectRatio: 3 / 4, borderRadius: 8 }}
                        contentFit="contain"
                        transition={200}
                      />
                    </Modal>
                  </>
                )}

                <View className="px-6 py-3 gap-y-2">
                  <Text className="text-xs font-poppins-semibold text-textSecondary dark:text-darkTextSecondary mb-1">
                    {translate("label.location")}
                  </Text>
                  {detail?.address && (
                    <View className="flex-row items-start gap-x-1">
                      <MapPin size={12} color={isDark ? "#A3A3A3" : "#475569"} style={{ marginTop: 1 }} />
                      <Text className="text-xs font-poppins-semibold text-textSecondary dark:text-darkTextMuted flex-1">
                        {detail.address}
                      </Text>
                    </View>
                  )}
                </View>

                <View
                  className={`mb-4 rounded-xl overflow-hidden ${Platform.OS === "web" ? "mx-6" : "mx-4"}`}
                  style={{ height: 180 }}
                >
                  {hasCoords ? (
                    shouldUseInteractiveMapbox() ? (
                      <MapView
                        style={{ width: "100%", height: 180 }}
                        styleURL={isDark ? "mapbox://styles/mapbox/navigation-night-v1" : "mapbox://styles/mapbox/streets-v12"}
                        scrollEnabled={false}
                        zoomEnabled={false}
                        rotateEnabled={false}
                        pitchEnabled={false}
                        attributionEnabled={false}
                        logoEnabled={false}
                      >
                        <Camera
                          centerCoordinate={[Number(detail!.longitude), Number(detail!.latitude)]}
                          zoomLevel={15}
                          animationMode="none"
                        />
                        {Platform.OS === "web" ? (
                          <MarkerView
                            coordinate={[Number(detail!.longitude), Number(detail!.latitude)]}
                            anchor={{ x: 0.5, y: 1 }}
                          >
                            <View className="items-center justify-end">
                              <Image
                                source={require("../../../assets/images/markers/default.png")}
                                style={{ width: 36, height: 36 }}
                                contentFit="contain"
                              />
                            </View>
                          </MarkerView>
                        ) : (
                          <>
                            <Mapbox.Images images={{ default: require("../../../assets/images/markers/default.png") }} />
                            <Mapbox.ShapeSource
                              id="storePin"
                              shape={{
                                type: "Feature",
                                geometry: { type: "Point", coordinates: [Number(detail!.longitude), Number(detail!.latitude)] },
                                properties: { icon: "default" },
                              }}
                            >
                              <Mapbox.SymbolLayer
                                id="storePinLayer"
                                style={{ iconImage: ["get", "icon"], iconAllowOverlap: true, iconSize: 0.015 }}
                              />
                            </Mapbox.ShapeSource>
                          </>
                        )}
                      </MapView>
                    ) : (
                      <View className="flex-1 bg-slate-50 dark:bg-darkBackgroundCard items-center justify-center gap-y-1">
                        <MapPin size={24} color={isDark ? "#525252" : "#CBD5E1"} />
                        <Text className="text-xs font-poppins text-slate-400 dark:text-darkTextSecondary">
                          {translate("storeManager.detail.mapOnlyAndroidWeb")}
                        </Text>
                      </View>
                    )
                  ) : (
                    <View className="flex-1 bg-slate-50 dark:bg-darkBackgroundCard items-center justify-center gap-y-1">
                      <MapPinOff size={24} color={isDark ? "#525252" : "#CBD5E1"} />
                      <Text className="text-xs font-poppins text-slate-400 dark:text-darkTextSecondary">
                        {translate("storeManager.detail.noLocationSet")}
                      </Text>
                    </View>
                  )}
                </View>

              </View>

            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
