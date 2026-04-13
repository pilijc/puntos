import React from "react";
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

export default function DetailIndex() {
  const router = useRouter();
  const {
    storeId,
    detail,
    loading,
    refreshing,
    handleRefresh,
    pictures,
    storeTypeLabelmap,
    statusCfg,
    hasCoords,
    isDark,
    mapWidth,
  } = useStoreDetail();

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-backgroundMuted dark:bg-neutral-900">
      <AppHeader
        title={detail?.name || "Store Details"}
        description={detail?.address || "View & manage store info"}
        onBackPress={() => router.replace(`/(store_manager)/view-store/${storeId}`)}
        rightIcon={<OptionsMenu
          options={[
            {
              label: "Edit",
              icon: <Pencil size={14} color="text-primary" />,
              onPress: () => router.push({ pathname: "/(store_manager)/detail/edit-details", params: { storeId } }),
            },
          ]}
        />}
        onRightIconPress={() => router.push({ pathname: "/(store_manager)/detail/edit-details", params: { storeId } })}
      />

      {loading ? (
        <DetailsSkeleton />
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 48, paddingTop: 16, paddingHorizontal: 16, gap: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#FF6600"]}
              tintColor="#FF6600"
            />
          }
        >
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
                    {detail?.name || "Unnamed Store"}
                  </Text>
                  <View className={`flex-row items-center gap-x-1 px-2.5 py-1 rounded-full ${statusCfg.bg}`}>
                    <View className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                    <Text className={`text-xs font-poppins-semibold ${statusCfg.text}`}>
                      {statusCfg.label}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs font-poppins-semibold text-textMuted dark:text-slate-500 mt-0.5">
                  {storeTypeLabelmap[detail?.type ?? ""] ?? detail?.type ?? "—"}
                </Text>
              </View>
            </View>
         

            <View className="px-4 pb-4">
              <View className="flex-row gap-x-6">
                <View className="flex-1 gap-y-2">
                  <View className="flex-row items-center gap-x-2">
                    <Phone size={12} color={isDark ? "#A3A3A3" : "#475569"} />
                    <Text className="text-xs font-poppins-semibold text-textSecondary dark:text-slate-500">
                      {detail?.phone ?? "Not set"}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-x-2">
                    <File size={12} color={isDark ? "#A3A3A3" : "#475569"} />
                    <Text className="text-xs font-poppins-semibold text-textSecondary dark:text-slate-500">
                      {detail?.registration_number ?? "Not set"}
                    </Text>
                  </View>
                </View>

                <View className="flex-1 gap-y-2">
                  <View className="flex-row items-center gap-x-2">
                    <Clock size={12} color={isDark ? "#A3A3A3" : "#475569"} />
                    <Text className="text-xs font-poppins-semibold text-textSecondary dark:text-slate-500">
                      Open: {detail?.store_open ? formatTime(detail.store_open) : "Not set"}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-x-2">
                    <Clock size={12} color={isDark ? "#A3A3A3" : "#475569"} />
                    <Text className="text-xs font-poppins-semibold text-textSecondary dark:text-slate-500">
                      Close: {detail?.store_close ? formatTime(detail.store_close) : "Not set"}
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
                    Business Document
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
                <Text className="text-xs font-poppins text-textMuted dark:text-slate-500">Location</Text>
                {detail?.address && (
                  <>
                    <Text className="text-xs font-poppins-semibold text-textPrimary dark:text-textPrimary -mt-4">
                      {detail.address}
                    </Text>
                  </>
                )}
                {hasCoords ? (
                  shouldUseInteractiveMapbox() ? (
                    <View
                      style={
                        Platform.OS === "web"
                          ? { paddingRight: 16, alignSelf: "stretch" }
                          : undefined
                      }
                    >
                      <View
                        style={{
                          height: 180,
                          borderRadius: 10,
                          overflow: "hidden",
                          width: Platform.OS === "web" ? "100%" : mapWidth - 32,
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
                          {Platform.OS === "web" ? (
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
                          ) : (
                            <>
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
                            </>
                          )}
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
                        Map only available on Android & Web
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
                      No location set
                    </Text>
                  </View>
                )}
            </View>
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}
