import React, { useMemo } from "react";
import { RefreshControl, Platform } from "react-native";
import { View, Text, ScrollView, SafeAreaView } from "@/tw";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import Mapbox, { Camera, MapView, MarkerView } from "@rnmapbox/maps";
import { formatTime } from "@/utils/store_manager/store-utils";
import { useStoreDetail } from "@/hooks/store-manager/use-detail";
import { DetailsSkeleton } from "@/components/skeleton/store_manager/details-skeleton";
import { OptionsMenu } from "@/components/options";
import { AppHeader } from "@/components/header";
import { shouldUseInteractiveMapbox } from "@/utils/mapbox-platform";
import { Building2, Clock, File, MapPin, MapPinOff, Pencil, Phone } from "lucide-react-native";
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
  const { t } = useTranslation();
  const {
    storeId,
    detail,
    loading,
    refreshing,
    handleRefresh,
    pictures,
    hasCoords,
    isDark,
    mapWidth,
  } = useStoreDetail();

  const statusKey =
    detail?.status && detail.status in STATUS_CONFIG ? detail.status : "pending_review";
  const statusCfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.pending_review;
  const statusLabel = t(`store_manager.detail.status.${statusKey}`);

  const storeTypeLabel = useMemo(() => {
    if (!detail?.type) return "—";
    if (store_types_options.some((o) => o.value === detail.type)) {
      return t(`store_manager.storeTypes.${detail.type}`);
    }
    return detail.type;
  }, [detail?.type, t]);

  const notSet = t("store_manager.detail.notSet");
  const openLine = (time: string | null | undefined) =>
    t("store_manager.detail.open", { time: time ? formatTime(time) : notSet });
  const closeLine = (time: string | null | undefined) =>
    t("store_manager.detail.close", { time: time ? formatTime(time) : notSet });

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-backgroundMuted dark:bg-neutral-900">
      <AppHeader
        title={detail?.name || t("store_manager.viewStore.fallbackTitle")}
        description={detail?.address || t("store_manager.detail.headerDefaultDescription")}
        onBackPress={() => {
          router.push(`/(store_manager)/view-store/${storeId}`);
        }}
        rightIcon={
          <OptionsMenu
            options={[
              {
                label: t("label.edit"),
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
          {Platform.OS === "web" ? (
            <View className="items-center px-4">
              <View className="w-full max-w-4xl bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 overflow-hidden">
                <View className="flex-row items-center p-4 gap-x-3">
                  {detail?.logo ? (
                    <Image
                      source={{ uri: detail.logo }}
                      style={{ width: 60, height: 60, borderRadius: 14 }}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <View
                      style={{ width: 60, height: 60, borderRadius: 14 }}
                      className="bg-orange-50 dark:bg-orange-950 border-2 border-dashed border-orange-200 dark:border-orange-800 items-center justify-center"
                    >
                      <Building2 size={24} color="text-primary" />
                    </View>
                  )}

                  <View className="flex-1 items-start justify-start">
                    <View className="flex-row items-center w-full">
                      <Text className="text-base font-poppins-bold text-slate-800 dark:text-slate-100 text-left mr-2">
                        {detail?.name || t("store_manager.detail.unnamedStore")}
                      </Text>
                      <View className={`flex-row items-center gap-x-1 px-2.5 py-1 rounded-full ${statusCfg.bg}`}>
                        <View className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                        <Text className={`text-xs font-poppins-semibold ${statusCfg.text}`}>{statusLabel}</Text>
                      </View>
                    </View>
                    <Text className="text-xs font-poppins-semibold text-textMuted dark:text-slate-500 mt-0.5">
                      {storeTypeLabel}
                    </Text>
                  </View>
                </View>

                <View className="px-4 pb-4">
                  <View className="flex-row gap-x-6">
                    <View className="flex-1 gap-y-2">
                      <View className="flex-row items-center gap-x-2">
                        <Phone size={12} color={isDark ? "#A3A3A3" : "#475569"} />
                        <Text className="text-xs font-poppins-semibold text-textSecondary dark:text-slate-500">
                          {detail?.phone ?? notSet}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-x-2">
                        <File size={12} color={isDark ? "#A3A3A3" : "#475569"} />
                        <Text className="text-xs font-poppins-semibold text-textSecondary dark:text-slate-500">
                          {detail?.registration_number ?? notSet}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-1 gap-y-2">
                      <View className="flex-row items-center gap-x-2">
                        <Clock size={12} color={isDark ? "#A3A3A3" : "#475569"} />
                        <Text className="text-xs font-poppins-semibold text-textSecondary dark:text-slate-500">
                          {openLine(detail?.store_open)}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-x-2">
                        <Clock size={12} color={isDark ? "#A3A3A3" : "#475569"} />
                        <Text className="text-xs font-poppins-semibold text-textSecondary dark:text-slate-500">
                          {closeLine(detail?.store_close)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View className="flex-row gap-x-2 p-4">
                  {[0, 1, 2].map((i) => {
                    const uri = pictures[i];
                    return uri ? (
                      <Image
                        key={i}
                        source={{ uri }}
                        style={{ flex: 1, height: 80, borderRadius: 10 }}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <View key={i} style={{ flex: 1, height: 80 }} />
                    );
                  })}
                </View>

                {detail?.business_document_image && (
                  <>
                    <View className="h-px bg-slate-100 dark:bg-neutral-700 mx-4" />
                    <View className="px-4 py-3.5">
                      <Text className="text-xs font-poppins text-textMuted dark:text-slate-500 mb-2">
                        {t("label.businessDocument")}
                      </Text>
                      <Image
                        source={{ uri: detail.business_document_image }}
                        style={{ width: 64, height: 64, borderRadius: 10 }}
                        contentFit="contain"
                        transition={200}
                      />
                    </View>
                  </>
                )}

                <View className="h-px bg-slate-100 dark:bg-neutral-700 mx-4" />
                <View className="px-4 pb-4 py-4 gap-y-4">
                  <Text className="text-xs font-poppins text-textMuted dark:text-slate-500">{t("label.location")}</Text>
                  {detail?.address && (
                    <Text className="text-xs font-poppins-semibold text-textPrimary dark:text-textPrimary -mt-4">
                      {detail.address}
                    </Text>
                  )}

                  {hasCoords ? (
                    shouldUseInteractiveMapbox() ? (
                      <View>
                        <View
                          style={{
                            height: 180,
                            borderRadius: 10,
                            overflow: "hidden",
                            width: "100%",
                          }}
                        >
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
                              centerCoordinate={[Number(detail.longitude), Number(detail.latitude)]}
                              zoomLevel={15}
                              animationMode="none"
                            />
                            <MarkerView
                              coordinate={[Number(detail.longitude), Number(detail.latitude)]}
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
                          </MapView>
                        </View>
                      </View>
                    ) : (
                      <View style={{ borderRadius: 12 }} className="h-32 bg-slate-50 dark:bg-neutral-700 items-center justify-center gap-y-1">
                        <MapPin size={24} color={isDark ? "#525252" : "#CBD5E1"} />
                        <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
                          {t("store_manager.detail.mapOnlyAndroidWeb")}
                        </Text>
                      </View>
                    )
                  ) : (
                    <View style={{ borderRadius: 12 }} className="h-32 bg-slate-50 dark:bg-neutral-700 items-center justify-center gap-y-1">
                      <MapPinOff size={24} color={isDark ? "#525252" : "#CBD5E1"} />
                      <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">{t("store_manager.detail.noLocationSet")}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ) : (
            <View className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 overflow-hidden">
            <View className="flex-row items-center p-4 gap-x-3">
              {detail?.logo ? (
                <Image
                  source={{ uri: detail.logo }}
                  style={{ width: 60, height: 60, borderRadius: 14 }}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View
                  style={{ width: 60, height: 60, borderRadius: 14 }}
                  className="bg-orange-50 dark:bg-orange-950 border-2 border-dashed border-orange-200 dark:border-orange-800 items-center justify-center"
                >
                  <Building2 size={24} color="text-primary" />
                </View>
              )}

              <View className="flex-1 items-start justify-start">
                <View className="flex-row items-center w-full">
                  <Text className="text-base font-poppins-bold text-slate-800 dark:text-slate-100 text-left mr-2">
                    {detail?.name || t("store_manager.detail.unnamedStore")}
                  </Text>
                  <View className={`flex-row items-center gap-x-1 px-2.5 py-1 rounded-full ${statusCfg.bg}`}>
                    <View className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                    <Text className={`text-xs font-poppins-semibold ${statusCfg.text}`}>
                      {statusLabel}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs font-poppins-semibold text-textMuted dark:text-slate-500 mt-0.5">
                  {storeTypeLabel}
                </Text>
              </View>
            </View>
         

            <View className="px-4 pb-4">
              <View className="flex-row gap-x-6">
                <View className="flex-1 gap-y-2">
                  <View className="flex-row items-center gap-x-2">
                    <Phone size={12} color={isDark ? "#A3A3A3" : "#475569"} />
                    <Text className="text-xs font-poppins-semibold text-textSecondary dark:text-slate-500">
                      {detail?.phone ?? notSet}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-x-2">
                    <File size={12} color={isDark ? "#A3A3A3" : "#475569"} />
                    <Text className="text-xs font-poppins-semibold text-textSecondary dark:text-slate-500">
                      {detail?.registration_number ?? notSet}
                    </Text>
                  </View>
                </View>

                <View className="flex-1 gap-y-2">
                  <View className="flex-row items-center gap-x-2">
                    <Clock size={12} color={isDark ? "#A3A3A3" : "#475569"} />
                    <Text className="text-xs font-poppins-semibold text-textSecondary dark:text-slate-500">
                      {openLine(detail?.store_open)}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-x-2">
                    <Clock size={12} color={isDark ? "#A3A3A3" : "#475569"} />
                    <Text className="text-xs font-poppins-semibold text-textSecondary dark:text-slate-500">
                      {closeLine(detail?.store_close)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <View className="flex-row gap-x-2 p-4">
              {[0, 1, 2].map((i) => {
                const uri = pictures[i];
                return uri ? (
                  <Image
                    key={i}
                    source={{ uri }}
                    style={{ flex: 1, height: 80, borderRadius: 10 }}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View key={i} style={{ flex: 1, height: 80 }} />
                );
              })}
            </View>

            {detail?.business_document_image && (
              <>
                <View className="h-px bg-slate-100 dark:bg-neutral-700 mx-4" />
                <View className="px-4 py-3.5">
                  <Text className="text-xs font-poppins text-textMuted dark:text-slate-500 mb-2">
                    {t("label.businessDocument")}
                  </Text>
                  <Image
                    source={{ uri: detail.business_document_image }}
                    style={{ width: 64, height: 64, borderRadius: 10 }}
                    contentFit="contain"
                    transition={200}
                  />
                </View>
              </>
            )}
            <View className="h-px bg-slate-100 dark:bg-neutral-700 mx-4" />
              <View className="px-4 pb-4 py-4 gap-y-4">
                <Text className="text-xs font-poppins text-textMuted dark:text-slate-500">{t("label.location")}</Text>
                {detail?.address && (
                  <>
                    <Text className="text-xs font-poppins-semibold text-textPrimary dark:text-textPrimary -mt-4">
                      {detail.address}
                    </Text>
                  </>
                )}
                {hasCoords ? (
                  shouldUseInteractiveMapbox() ? (
                    <View>
                      <View
                        style={{
                          height: 180,
                          borderRadius: 10,
                          overflow: "hidden",
                          width: mapWidth - 32,
                        }}
                      >
                        <MapView
                          style={{ width: "100%", height: 180 }}
                          styleURL={
                            isDark
                              ? "mapbox://styles/mapbox/navigation-night-v1"
                              : "mapbox://styles/mapbox/streets-v12"
                          }
                          scrollEnabled={false}
                          zoomEnabled={false}
                          rotateEnabled={false}
                          pitchEnabled={false}
                          attributionEnabled={false}
                          logoEnabled={false}
                        >
                          <Camera
                            centerCoordinate={[Number(detail.longitude), Number(detail.latitude)]}
                            zoomLevel={15}
                            animationMode="none"
                          />
                          <Mapbox.Images
                            images={{
                              default: require("../../../assets/images/markers/default.png"),
                            }}
                          />
                          <Mapbox.ShapeSource
                            id="storePin"
                            shape={{
                              type: "Feature",
                              geometry: {
                                type: "Point",
                                coordinates: [Number(detail.longitude), Number(detail.latitude)],
                              },
                              properties: { icon: "default" },
                            }}
                          >
                            <Mapbox.SymbolLayer
                              id="storePinLayer"
                              style={{
                                iconImage: ["get", "icon"],
                                iconAllowOverlap: true,
                                iconSize: 0.015,
                              }}
                            />
                          </Mapbox.ShapeSource>
                        </MapView>
                      </View>
                    </View>
                  ) : (
                    <View
                      style={{ borderRadius: 12 }}
                      className="h-32 bg-slate-50 dark:bg-neutral-700 items-center justify-center gap-y-1"
                    >
                      <MapPin size={24} color={isDark ? "#525252" : "#CBD5E1"} />
                      <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
                        {t("store_manager.detail.mapOnlyAndroidWeb")}
                      </Text>
                    </View>
                  )
                ) : (
                  <View
                    style={{ borderRadius: 12 }}
                    className="h-32 bg-slate-50 dark:bg-neutral-700 items-center justify-center gap-y-1"
                  >
                    <MapPinOff size={24} color={isDark ? "#525252" : "#CBD5E1"} />
                    <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
                      {t("store_manager.detail.noLocationSet")}
                    </Text>
                  </View>
                )}
            </View>
          </View>
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}
