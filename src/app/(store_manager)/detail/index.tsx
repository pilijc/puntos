import React, { useState } from "react";
import { RefreshControl } from "react-native";
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import Mapbox, { Camera, MapView } from "@rnmapbox/maps";
import { formatTime } from "@/utils/store_manager/store-utils";
import { useStoreDetail } from "@/hooks/store-manager/use-detail";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { DetailsSkeleton } from "@/components/skeleton/store_manager/details-skeleton";
import { OptionsMenu } from "@/components/options";
import { AppHeader } from "@/components/header";

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
              icon: <MaterialIcons name="edit" size={14} color="black" />,
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
                  <MaterialIcons name="storefront" size={24} color="#FF6600" />
                </View>
              )}

              <View className="flex-1 items-start">
                <Text className="text-base font-poppins-bold text-slate-800 dark:text-slate-100 text-left">
                  {detail?.name || "Unnamed Store"}
                </Text>
                {(detail?.store_open || detail?.store_close) && (
                  <Text className="text-xs font-poppins-semibold text-textMuted dark:text-slate-500">
                    {formatTime(detail.store_open)} – {formatTime(detail.store_close)}
                  </Text>
                )}
                <Text className="text-xs font-poppins-semibold text-textMuted dark:text-slate-500">
                  {storeTypeLabelmap[detail?.type ?? ""] ?? detail?.type ?? "—"}
                </Text>
              </View>

              <View className={`self-start flex-row items-center gap-x-1 px-2.5 py-1 rounded-full ${statusCfg.bg}`}>
                <View className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                <Text className={`text-xs font-poppins-semibold ${statusCfg.text}`}>
                  {statusCfg.label}
                </Text>
              </View>
            </View>

            {(detail?.phone || detail?.registration_number) && (
              <View className="px-4 pb-4">
                {detail?.phone && (
                  <View className="flex-row items-center gap-x-2">
                    <FontAwesome name="phone" size={12} color="text-textSecondary" />
                    <Text className="text-xs font-poppins-semibold text-textSecondary dark:text-slate-500">
                      {detail.phone}
                    </Text>
                  </View>
                )}
                {detail?.registration_number && (
                  <View className="flex-row items-center gap-x-2">
                    <Ionicons name="document" size={12} color="text-textSecondary" />
                    <Text className="text-xs font-poppins-semibold text-textSecondary dark:text-slate-500">
                      {detail.registration_number}
                    </Text>
                  </View>
                )}
              </View>
            )}
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
                  <View style={{ width: mapWidth - 32, height: 180, borderRadius: 10, overflow: "hidden" }}>
                    <MapView
                      style={{ width: mapWidth - 32, height: 180 }}
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
                ) : (
                  <View
                    style={{ borderRadius: 12 }}
                    className="h-32 bg-slate-50 dark:bg-neutral-700 items-center justify-center gap-y-1"
                  >
                    <MaterialIcons name="location-off" size={24} color={isDark ? "#525252" : "#CBD5E1"} />
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
