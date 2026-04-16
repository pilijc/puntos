import React, { useState, useRef, useMemo } from "react";
import { ScrollView, Platform, useColorScheme } from "react-native";
import Carousel from 'react-native-reanimated-carousel';
import { View, Text, TouchableOpacity } from "@/tw";
import { useTranslation } from "react-i18next";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ArrowLeft, Store as StoreIcon, Briefcase, BadgeCheck, AlertTriangle, Flame, Sun, Moon, RefreshCw, MapPin, Map, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import Mapbox, { Camera, MapView, MarkerView } from "@rnmapbox/maps";
import { ScreenWrapper } from "@/components/ui/screen-wrapper";
import { Button } from "@/components/button";
import { AdminStoreRow } from "@/services/store-service";
import { ImageViewerModal } from "@/components/ui/image-viewer-modal";
import { getStoreCategoryBadge, getEffectiveStatus, StoreStatusKey } from "@/type/super-admin/user";
import { shouldUseInteractiveMapbox } from "@/utils/mapbox-platform";
import { useSubscriptionConfigStore } from "@/store/super-admin/subscription-config";


Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

const isWeb = Platform.OS === "web";

const twConfig = require("../../../../tailwind.config.js");
const twColors = twConfig?.theme?.extend?.colors || { success: "#10b981", danger: "#ef4444" };

type StatusKey = StoreStatusKey;

const STATUS_CONFIG: Record<StatusKey, {
  icon: "schedule" | "check-circle" | "cancel";
  bg: string; border: string; badgeBg: string; text: string;
}> = {
  pending_review: { icon: "schedule", bg: "#ffffff", border: "#f5e4a8", badgeBg: "#fef0c0", text: "#7a5c00" },
  active: { icon: "check-circle", bg: "#ffffff", border: "#d4fce2", badgeBg: "#dcfce7", text: twColors.success },
  inactive: { icon: "cancel", bg: "#ffffff", border: "#fecaca", badgeBg: "#fee2e2", text: twColors.danger },
};

const SectionHeader = ({ title }: { title: string }) => (
  <Text className="text-base font-poppins-bold text-textPrimary dark:text-darkTextPrimary mb-3">{title}</Text>
);
const FieldLabel = ({ children }: { children: string }) => (
  <Text className="text-[10px] font-poppins-bold text-textSecondary uppercase tracking-wider mb-1 px-1">{children}</Text>
);
const FieldCard = ({ children, noPad }: { children: React.ReactNode; noPad?: boolean }) => (
  <View className={`bg-white dark:bg-darkBackgroundCard rounded-xl min-h-[48px] justify-center ${noPad ? 'p-2.5' : 'p-3'}`}>
    {children}
  </View>
);
const ReadOnlyField = ({ label, value }: { label: string; value?: string | null }) => (
  <View className="mb-1.5">
    <FieldLabel>{label}</FieldLabel>
    <FieldCard>
      <Text className="text-sm font-poppins-medium text-textPrimary dark:text-darkTextPrimary">{value || "—"}</Text>
    </FieldCard>
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
  const config = useSubscriptionConfigStore();

  const STATUS_LABELS: Record<StatusKey, string> = {
    pending_review: translate("superAdmin.stores.status.pending"),
    active: translate("superAdmin.stores.status.active"),
    inactive: translate("superAdmin.stores.status.inactive"),
  };

  const [viewingDocUri, setViewingDocUri] = useState<string | null>(null);
  const [currentPicIndex, setCurrentPicIndex] = useState(0);
  const scrollRef = useRef<any>(null);
  const [layoutWidth, setLayoutWidth] = useState(0);

  const isDark = useColorScheme() === "dark";

  const statusKey = getEffectiveStatus(store);
  const statusCfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.pending_review;
  const isPending = statusKey === "pending_review";

  const registeredDate = useMemo(() => {
    return new Date(store.created_at).toLocaleDateString(i18n.language === "ja" ? "ja-JP" : "en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  }, [store.created_at, i18n.language]);

  return (
    <ScreenWrapper className="flex-1 bg-backgroundMuted dark:bg-darkBackgroundMuted">




      <ScrollView
        className="flex-1"
        contentContainerStyle={[
          { paddingBottom: isPending ? 60 : 20 },
          require('react-native').Platform.OS === 'web' && {
            width: '100%',
            maxWidth: 950,
            alignSelf: 'center',
            backgroundColor: 'transparent',
          }
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        style={require('react-native').Platform.OS === 'web' ? { backgroundColor: isDark ? '#000000' : '#F8FAFC' } : { backgroundColor: '#F8FAFC' }}
      >
        <View 
          className="relative w-full bg-slate-900 overflow-visible"
          style={require('react-native').Platform.OS === 'web' ? { height: 240 } : { height: 170 }}
        >
          <View className="absolute top-6 left-6 z-50">
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.7}
              className="w-10 h-10 rounded-full items-center justify-center overflow-hidden border border-white/20 dark:border-black/20 shadow-lg shadow-black/20"
            >
              {BlurView ? (
                <BlurView
                  intensity={80}
                  tint={isDark ? "dark" : "light"}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
              ) : (
                <View 
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
                  className="bg-white/80 dark:bg-black/60" 
                />
              )}
              <ArrowLeft size={22} color={isDark ? "#ffffff" : "#0F172A"} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
             activeOpacity={0.9} 
             onPress={() => store.store_pictures?.[0] && setViewingDocUri(store.store_pictures[0])}
             className="w-full h-full"
          >
             {store.store_pictures && store.store_pictures.length > 0 ? (
                <View className="w-full h-full overflow-hidden">
                  <Image 
                    source={{ uri: store.store_pictures[0] }} 
                    style={{ width: "100%", height: "100%" }} 
                    contentFit="cover" 
                    contentPosition="center"
                  />
                </View>
             ) : (
                <View className="w-full h-full overflow-hidden bg-[#F1F5F9] dark:bg-neutral-800 items-center justify-center">
                   <MaterialIcons name="storefront" size={64} color={isDark ? "#52525B" : "#CBD5E1"} />
                </View>
             )}
          </TouchableOpacity>
           
           {/* Removed bottom blur overlay */}
          <View className="absolute top-0 bottom-0 left-0 right-0 bg-black/25 dark:bg-black/45" pointerEvents="none" />

          <View className="absolute top-6 right-6 px-3.5 py-1.5 rounded-full flex-row items-center gap-1.5 bg-white/95 dark:bg-darkBackground/95 shadow-sm shadow-black/20 z-10">
            <View className={`w-2 h-2 rounded-full`} style={{ backgroundColor: statusCfg.text }} />
            <Text className="text-[10px] font-poppins-bold tracking-wider text-slate-800 dark:text-slate-200 mt-[1px] uppercase">
              {STATUS_LABELS[statusKey]}
            </Text>
          </View>

          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => store.logo && setViewingDocUri(store.logo)}
            className="absolute left-6 w-[88px] h-[88px] rounded-full overflow-hidden z-20 shadow-xl shadow-black/30 bg-white"
            style={require('react-native').Platform.OS === 'web' ? { bottom: -30 } : { bottom: -40 }}
          >
             {store.logo ? (
               <Image source={{ uri: store.logo }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
             ) : (
               <MaterialIcons name="storefront" size={36} color="#94A3B8" />
             )}
          </TouchableOpacity>
        </View>

        <View 
          className="px-5 space-y-3"
          style={require('react-native').Platform.OS === 'web' ? { paddingTop: 60 } : { paddingTop: 40 }}
        >

          <View className="bg-white dark:bg-darkBackgroundCard rounded-3xl p-6 shadow-sm shadow-slate-200/40 dark:shadow-none mb-4 border border-slate-100 dark:border-neutral-800/50">
            <View className="flex-row justify-between items-start mb-1">
              <Text className="flex-1 text-lg font-poppins-bold text-slate-800 dark:text-slate-100 leading-[26px]" numberOfLines={2}>
                {store.name || "Unnamed Store"}
              </Text>
              <View className="pt-1">
                <MaterialIcons name="work-outline" size={18} color="#CBD5E1" />
              </View>
            </View>

            <Text className="text-xs font-poppins-medium text-slate-500 mb-2">
              {store.owner_name ? `By: ${store.owner_name}` : "By: Not specified"}
            </Text>

            {/* SUBSCRIPTION INDICATOR */}
            {subscription ? (
               <View className={`flex-row items-center gap-1 self-start px-2 py-0.5 rounded-full border mb-3 ${subscription.payment_status === 'paid' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'}`}>
                 <MaterialIcons name={subscription.payment_status === 'paid' ? "verified" : "warning"} size={10} color={subscription.payment_status === 'paid' ? "#10B981" : "#EF4444"} />
                 <Text className={`text-[9px] font-poppins-bold tracking-wider uppercase ${subscription.payment_status === 'paid' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                    Subscription {subscription.payment_status}
                 </Text>
               </View>
            ) : ((ownerActiveStoresCount + (statusKey === 'active' ? 1 : 0)) > config.FREE_STORES_LIMIT) && (
               <View className="flex-row items-center gap-1 self-start px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 mb-3">
                 <MaterialIcons name="local-fire-department" size={10} color="#2563EB" />
                 <Text className="text-[9px] font-poppins-bold tracking-wider text-blue-700 dark:text-blue-400 uppercase">
                    Subscription Required
                 </Text>
               </View>
            )}

            <View className={`self-start px-2 py-0.5 rounded-full ${getStoreCategoryBadge(store.type).bg} mb-1.5 flex-row items-center justify-center`}>
              <Text
                className={`text-[10px] font-poppins-semibold ${getStoreCategoryBadge(store.type).text}`}
                style={{ lineHeight: 16, includeFontPadding: false } as any}
              >
                {store.type || "General"}
              </Text>
            </View>

            {store.registration_number && (
              <View className="mb-1.5">
                <Text className="text-[10px] font-poppins-semibold tracking-wider text-[#94A3B8] uppercase mb-1">{translate("superAdmin.stores.details.registrationNumber", { defaultValue: "Registration No." })}</Text>
                <Text className="text-xs font-poppins-semibold text-slate-800 dark:text-slate-200">
                  {store.registration_number}
                </Text>
              </View>
            )}

            <View className="mb-1.5">
              <Text className="text-[10px] font-poppins-semibold tracking-wider text-[#94A3B8] uppercase mb-1.5">{translate("superAdmin.stores.details.operatingHours", { defaultValue: "Operating Hours" })}</Text>
              <View className="bg-[#F8FAFC] dark:bg-darkBackgroundMuted rounded-xl p-3 border border-slate-100 dark:border-neutral-800">
                <View className="flex-row items-center px-1">
                  <View className="flex-1 flex-row items-center justify-center gap-2">
                    <MaterialIcons name="wb-sunny" size={14} color="#FF6600" />
                    <Text className="text-xs font-poppins-semibold text-slate-800 dark:text-slate-100">
                      {store.store_open ? store.store_open.slice(0, 5) : "09:00"}
                    </Text>
                  </View>
                  <View className="w-[1.5px] h-3 bg-slate-300 dark:bg-neutral-600 rounded-full mx-2" />
                  <View className="flex-1 flex-row items-center justify-center gap-2">
                    <MaterialIcons name="nights-stay" size={14} color="#FF6600" />
                    <Text className="text-xs font-poppins-semibold text-slate-800 dark:text-slate-100">
                      {store.store_close ? store.store_close.slice(0, 5) : "21:00"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View>
              <Text className="text-[10px] font-poppins-semibold tracking-wider text-[#94A3B8] uppercase mb-1.5">About This Store</Text>
              <Text className="text-[11px] font-poppins text-slate-400 dark:text-slate-500 italic leading-5">
                No store information has been provided yet by the manager.
              </Text>
              {store.status !== 'pending_review' && (
                <View className={`mt-4 flex-row text-center items-center gap-2 self-start px-3 py-2 rounded-xl border ${statusKey === 'inactive' ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800/30' : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30'}`}>
                  <View className={`w-5 h-5 rounded-full items-center justify-center ${statusKey === 'inactive' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                    <MaterialIcons name={statusKey === 'inactive' ? 'refresh' : 'verified'} size={12} color="#ffffff" />
                  </View>
                  <Text
                    className={`text-[10px] font-poppins-bold uppercase tracking-wider ${statusKey === 'inactive' ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}
                    style={{ lineHeight: 14, includeFontPadding: false } as any}
                  >
                    {statusKey === 'inactive'
                      ? 'Requires Resubmission'
                      : `Approved Date: ${store.approved_at ? new Date(store.approved_at).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }) : "N/A"}`}
                  </Text>
                </View>
              )}
            </View>

            {store.store_pictures && store.store_pictures.length > 0 && (
              <View className="mt-8 border-t border-slate-100 dark:border-neutral-800 pt-6">
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-sm font-poppins-bold text-slate-800 dark:text-slate-100">Store Pictures</Text>
                  <Text className="text-[10px] font-poppins-semibold text-textMuted dark:text-slate-500 uppercase tracking-widest">
                    {store.store_pictures.length} {store.store_pictures.length === 1 ? 'PHOTO' : 'PHOTOS'}
                  </Text>
                </View>

                <View 
                  className="relative w-full rounded-[16px] overflow-hidden bg-[#F8FAFC] dark:bg-darkBackgroundMuted" 
                  onLayout={(e) => setLayoutWidth(e.nativeEvent.layout.width)}
                  style={require('react-native').Platform.OS === 'web' ? { height: 450 } : { height: 180 }}
                >
                  {(layoutWidth > 0 && Carousel) ? (
                    <View className="flex-1 relative">
                      <Carousel
                        ref={scrollRef}
                        loop
                        width={layoutWidth}
                        height={require('react-native').Platform.OS === 'web' ? 450 : 180}
                        autoPlay={false}
                        data={store.store_pictures}
                        scrollAnimationDuration={1000}
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

                      {/* Web Navigation Arrows */}
                      {require('react-native').Platform.OS === 'web' && store.store_pictures.length > 1 && (
                        <>
                          <TouchableOpacity
                            onPress={() => scrollRef.current?.prev()}
                            className="absolute left-4 top-1/2 -mt-6 w-12 h-12 bg-black/30 hover:bg-black/50 rounded-full items-center justify-center z-30 transition-colors"
                          >
                            <ChevronLeft size={32} color="white" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => scrollRef.current?.next()}
                            className="absolute right-4 top-1/2 -mt-6 w-12 h-12 bg-black/30 hover:bg-black/50 rounded-full items-center justify-center z-30 transition-colors"
                          >
                            <ChevronRight size={32} color="white" />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      {store.store_pictures[0] && (
                        <Image source={{ uri: store.store_pictures[0] }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                      )}
                    </View>
                  )}
 
                  {store.store_pictures.length > 1 && (
                    <View className="absolute bottom-2 left-0 right-0 flex-row justify-center gap-1.5 z-10" pointerEvents="none">
                      {store.store_pictures.map((_, idx) => (
                        <View key={idx} className={`h-1.5 rounded-full transition-all ${idx === currentPicIndex ? 'w-4 bg-primary' : 'w-1.5 bg-white/70'}`} />
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>

          <View className="bg-white dark:bg-darkBackgroundCard rounded-3xl p-6 shadow-sm shadow-slate-200/40 dark:shadow-none mb-4 border border-slate-100 dark:border-neutral-800/50">
            <View className="flex-row items-center gap-1.5 mb-5">
              <MaterialIcons name="location-on" size={18} color="#D93025" />
              <Text className="text-sm font-poppins-bold text-slate-800 dark:text-slate-100">Location & Contact</Text>
            </View>

            {(store.latitude !== null && store.longitude !== null && store.latitude !== undefined && store.longitude !== undefined) ? (
              <View style={{ width: "100%", height: 160, borderRadius: 16, overflow: "hidden", marginBottom: 20 }} className="bg-slate-50 dark:bg-neutral-800">
                {(shouldUseInteractiveMapbox() && MapView && Mapbox) ? (
                  <View style={{ flex: 1, position: "relative" }}>
                    <MapView
                      style={{ flex: 1, width: "100%", height: "100%" }}
                      surfaceView={false}
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
                        centerCoordinate={[Number(store.longitude), Number(store.latitude)]}
                        zoomLevel={15}
                        animationMode="none"
                      />
                      <MarkerView
                        coordinate={[Number(store.longitude), Number(store.latitude)]}
                        anchor={{ x: 0.5, y: 1 }}
                      >
                        <View style={{ alignItems: "center", justifyContent: "flex-end" }}>
                          <Image
                            source={require("../../../assets/images/markers/default.png")}
                            style={{ width: 36, height: 36 }}
                            contentFit="contain"
                          />
                        </View>
                      </MarkerView>
                    </MapView>
                  </View>
                ) : (
                  <View className="flex-1 w-full h-full items-center justify-center gap-y-1">
                    <MaterialIcons name="map" size={28} color={isDark ? "#525252" : "#CBD5E1"} />
                    <Text className="text-[10px] font-poppins text-slate-400 dark:text-slate-500 px-3 text-center">
                      Map only on Android & Web
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View className="h-[120px] bg-slate-50 dark:bg-neutral-800/50 rounded-2xl items-center justify-center mb-5 border border-slate-100 dark:border-neutral-800">
                <MaterialIcons name="map" size={28} color="#CBD5E1" />
                <Text className="text-xs font-poppins text-slate-400 mt-2">No map coordinates</Text>
              </View>
            )}

            <View>
              <Text className="text-[10px] font-poppins-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-1">Store Address</Text>
              <Text className="text-xs font-poppins-medium text-slate-700 dark:text-slate-300 leading-5">{store.address || "—"}</Text>
            </View>

            {store.phone && (
              <View className="mt-5">
                <Text className="text-[10px] font-poppins-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-1">Phone Number</Text>
                <Text className="text-xs font-poppins-medium text-slate-700 dark:text-slate-300">{store.phone}</Text>
              </View>
            )}
          </View>

          <View className="bg-white dark:bg-darkBackgroundCard rounded-3xl p-6 shadow-sm shadow-slate-200/40 dark:shadow-none mb-6 border border-slate-100 dark:border-neutral-800/50">
            <View className="flex-row items-center gap-1.5 mb-5">
              <MaterialIcons name="verified" size={18} color="#15803d" />
              <Text className="text-sm font-poppins-bold text-slate-800 dark:text-slate-100">Verification</Text>
            </View>

            {store.business_document_image ? (
              <TouchableOpacity
                onPress={() => setViewingDocUri(store.business_document_image)}
                activeOpacity={0.7}
                className="bg-[#F8FAFC] dark:bg-neutral-800/40 rounded-2xl p-4 flex-row items-center mb-4 border border-slate-100 dark:border-neutral-800"
              >
                <View className="w-10 h-10 bg-white dark:bg-darkBackgroundCard rounded drop-shadow-sm border border-slate-100 dark:border-neutral-700 items-center justify-center overflow-hidden">
                  <Image source={{ uri: store.business_document_image }} style={{ width: 40, height: 40 }} contentFit="cover" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-xs font-poppins-semibold text-slate-800 dark:text-slate-100">Business License</Text>
                  <Text className="text-[9px] font-poppins-medium text-slate-400 mt-0.5 uppercase tracking-wider">IMG • Tap to View</Text>
                </View>
                <MaterialIcons name="check-circle" size={18} color="#15803d" />
              </TouchableOpacity>
            ) : (
              <View className="bg-[#F8FAFC] dark:bg-neutral-800/40 rounded-2xl p-4 items-center justify-center border border-slate-100 dark:border-neutral-800 mb-1.5">
                <Text className="text-[10px] font-poppins-semibold text-slate-400 uppercase tracking-widest">No Documents Provided</Text>
              </View>
            )}


          </View>

          {isPending && (
            <View className="flex-row gap-3 pt-2">
              <View className="flex-1">
                <Button variant="danger" label={translate("superAdmin.stores.details.rejectApplication")} onPress={() => onReject(store)} fullWidth />
              </View>
              <View className="flex-1">
                <Button variant="primary" label={translate("superAdmin.stores.details.approveStore")} onPress={() => onApprove(store)} fullWidth />
              </View>
            </View>
          )}

        </View>
      </ScrollView>

      {viewingDocUri && (
        <ImageViewerModal
          uri={viewingDocUri}
          onClose={() => setViewingDocUri(null)}
        />
      )}
    </ScreenWrapper>
  );
}
