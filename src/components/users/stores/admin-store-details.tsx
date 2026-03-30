import React, { useState, useRef } from "react";
import { ScrollView } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { ScreenWrapper } from "@/components/ui/screen-wrapper";
import { Button } from "@/components/button";
import { AdminStoreRow } from "@/services/store-service";
import { ImageViewerModal } from "@/components/ui/image-viewer-modal";

const twConfig = require("../../../../tailwind.config.js");
const twColors = twConfig.theme.extend.colors;

type StatusKey = "pending_review" | "active" | "inactive";

const STATUS_CONFIG: Record<StatusKey, {
  label: string; icon: "schedule" | "check-circle" | "cancel";
  bg: string; border: string; badgeBg: string; text: string;
}> = {
  pending_review: { label: "PENDING", icon: "schedule", bg: "#ffffff", border: "#f5e4a8", badgeBg: "#fef0c0", text: "#7a5c00" },
  active: { label: "ACTIVE", icon: "check-circle", bg: "#ffffff", border: "#d4fce2", badgeBg: "#dcfce7", text: twColors.success },
  inactive: { label: "INACTIVE", icon: "cancel", bg: "#ffffff", border: "#fecaca", badgeBg: "#fee2e2", text: twColors.danger },
};

// ─── Field helpers ────────────────────────────────────────────────────────────
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
  <View className="mb-2.5">
    <FieldLabel>{label}</FieldLabel>
    <FieldCard>
      <Text className="text-sm font-poppins-medium text-textPrimary dark:text-darkTextPrimary">{value || "—"}</Text>
    </FieldCard>
  </View>
);


// ─── Main Screen ──────────────────────────────────────────────────────────────
export function AdminStoreDetails({
  store,
  onBack,
  onApprove,
  onReject,
}: {
  store: AdminStoreRow;
  onBack: () => void;
  onApprove: (store: AdminStoreRow) => void;
  onReject: (store: AdminStoreRow) => void;
}) {
  const [viewingDoc, setViewingDoc] = useState(false);
  const [currentPicIndex, setCurrentPicIndex] = useState(0);
  const scrollRef = useRef<any>(null);
  const [layoutWidth, setLayoutWidth] = useState(0);

  const getEffectiveStatus = (s: AdminStoreRow): StatusKey => {
    if (s.status === "pending_review" || !s.status) return "pending_review";
    if (s.status === "inactive") return "inactive";
    return s.is_active ? "active" : "inactive";
  };
  const statusKey = getEffectiveStatus(store);
  const statusCfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.pending_review;
  const isPending = statusKey === "pending_review";

  const registeredDate = new Date(store.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <ScreenWrapper className="flex-1 bg-backgroundMuted dark:bg-darkBackgroundMuted">

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 h-[60px]">
        <View className="flex-row items-center gap-1.5">
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} className="w-9 h-9 items-center justify-center rounded-full">
            <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text className="text-[17px] font-poppins-bold text-textPrimary dark:text-darkTextPrimary ml-1">Store Details</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 bg-backgroundMuted dark:bg-darkBackgroundMuted"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >

        {/* Store Details */}
        <View>
          <View className="mb-2.5">
            <FieldLabel>STORE NAME</FieldLabel>
            <FieldCard>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-poppins-medium text-textPrimary dark:text-darkTextPrimary flex-1 mr-2" numberOfLines={1}>
                  {store.name || "—"}
                </Text>
                <View style={{ backgroundColor: statusCfg.badgeBg }} className="flex-row items-center gap-1 px-2 py-1 rounded-full">
                  <MaterialIcons name={statusCfg.icon} size={12} color={statusCfg.text} />
                  <Text style={{ color: statusCfg.text }} className="text-[10px] font-poppins-bold tracking-wider">{statusCfg.label}</Text>
                </View>
              </View>
            </FieldCard>
          </View>

          <View className="mb-2.5">
            <FieldLabel>STORE TYPE</FieldLabel>
            <FieldCard noPad>
              {store.type ? (
                <View className="bg-primary rounded-full px-3.5 py-1.5 self-start m-1">
                  <Text className="text-xs font-poppins-bold text-white">{store.type}</Text>
                </View>
              ) : (
                <Text className="text-sm font-poppins-medium text-textMuted p-1">—</Text>
              )}
            </FieldCard>
          </View>

          {/* Logo — static, no tap */}
          <View className="mb-2.5">
            <FieldLabel>STORE LOGO</FieldLabel>
            <FieldCard noPad>
              <View className="w-[60px] h-[60px] rounded-xl overflow-hidden bg-[#f1f5f9] dark:bg-darkBackgroundCard items-center justify-center m-1">
                {store.logo
                  ? <Image source={{ uri: store.logo }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                  : <MaterialIcons name="storefront" size={26} color="#94A3B8" />
                }
              </View>
            </FieldCard>
          </View>

          <View className="mb-2.5">
            <FieldLabel>STORE PICTURES</FieldLabel>
            <FieldCard noPad>
              {store.store_pictures && store.store_pictures.length > 0 ? (
                <View 
                  className="relative w-full h-[200px] rounded-xl overflow-hidden bg-[#f1f5f9] dark:bg-darkBackgroundCard my-1"
                  onLayout={(e) => setLayoutWidth(e.nativeEvent.layout.width)}
                >
                  <ScrollView
                    ref={scrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={(e) => {
                      if (layoutWidth > 0) {
                        const idx = Math.round(e.nativeEvent.contentOffset.x / layoutWidth);
                        if (idx !== currentPicIndex && idx >= 0 && idx < store.store_pictures!.length) {
                          setCurrentPicIndex(idx);
                        }
                      }
                    }}
                    scrollEventThrottle={16}
                    bounces={false}
                  >
                    {store.store_pictures.map((uri, idx) => (
                      <View key={idx} style={{ width: layoutWidth > 0 ? layoutWidth : '100%', height: '100%' }}>
                        <Image 
                          source={{ uri }} 
                          style={{ width: "100%", height: "100%" }} 
                          contentFit="cover" 
                        />
                      </View>
                    ))}
                  </ScrollView>
                  
                  {store.store_pictures.length > 1 && (
                    <>
                      {currentPicIndex > 0 && (
                        <TouchableOpacity 
                          activeOpacity={0.8} 
                          onPress={() => {
                            scrollRef.current?.scrollTo({ x: (currentPicIndex - 1) * layoutWidth, animated: true });
                          }}
                          className="absolute left-2 top-1/2 -mt-4 w-8 h-8 rounded-full bg-black/50 items-center justify-center z-10"
                        >
                          <MaterialIcons name="chevron-left" size={24} color="#fff" />
                        </TouchableOpacity>
                      )}

                      {currentPicIndex < store.store_pictures.length - 1 && (
                        <TouchableOpacity 
                          activeOpacity={0.8} 
                          onPress={() => {
                            scrollRef.current?.scrollTo({ x: (currentPicIndex + 1) * layoutWidth, animated: true });
                          }}
                          className="absolute right-2 top-1/2 -mt-4 w-8 h-8 rounded-full bg-black/50 items-center justify-center z-10"
                        >
                          <MaterialIcons name="chevron-right" size={24} color="#fff" />
                        </TouchableOpacity>
                      )}

                      <View className="absolute bottom-2 left-0 right-0 flex-row justify-center gap-1.5 z-10">
                        {store.store_pictures.map((_, idx) => (
                          <View 
                            key={idx} 
                            className={`h-2 rounded-full transition-all ${idx === currentPicIndex ? 'w-5 bg-primary' : 'w-2 bg-white/60'}`} 
                          />
                        ))}
                      </View>
                    </>
                  )}
                </View>
              ) : (
                <Text className="text-sm font-poppins-medium text-textMuted p-1">—</Text>
              )}
            </FieldCard>
          </View>
        </View>

        {/* Business Details */}
        <View>
          <SectionHeader title="Business Details" />
          <ReadOnlyField label="OWNER NAME" value={store.owner_name} />
          <ReadOnlyField label="PHONE NUMBER" value={store.phone} />
          
          <View className="mb-2.5">
            <FieldLabel>OPERATING HOURS</FieldLabel>
            <FieldCard>
              <View className="flex-row items-center px-1">
                <View className="flex-1 flex-row items-center justify-center gap-2">
                  <MaterialIcons name="wb-sunny" size={16} color="#FF6600" />
                  <Text className="text-sm font-poppins-medium text-textPrimary dark:text-darkTextPrimary">
                    {store.store_open ? store.store_open.slice(0, 5) : "09:00"}
                  </Text>
                </View>
                
                <View className="w-[1.5px] h-4 bg-slate-300 dark:bg-slate-700 rounded-full mx-2" />
                
                <View className="flex-1 flex-row items-center justify-center gap-2">
                  <MaterialIcons name="nights-stay" size={16} color="#FF6600" />
                  <Text className="text-sm font-poppins-medium text-textPrimary dark:text-darkTextPrimary">
                    {store.store_close ? store.store_close.slice(0, 5) : "21:00"}
                  </Text>
                </View>
              </View>
            </FieldCard>
          </View>

          <View className="flex-row gap-2.5">
            <View className="flex-1">
              <FieldLabel>BUSINESS REGISTRATION #</FieldLabel>
              <FieldCard>
                <Text className="text-sm font-poppins-medium text-textPrimary dark:text-darkTextPrimary" numberOfLines={1}>
                  {store.registration_number || "—"}
                </Text>
              </FieldCard>
            </View>
            <View className="flex-1">
              <FieldLabel>REGISTERED ON</FieldLabel>
              <FieldCard>
                <Text className="text-sm font-poppins-medium text-textPrimary dark:text-darkTextPrimary" numberOfLines={1}>
                  {registeredDate}
                </Text>
              </FieldCard>
            </View>
          </View>

          {/* Business document — taps into full-screen viewer */}
          <View className="mb-2.5 mt-2.5">
            <FieldLabel>BUSINESS DOCUMENT</FieldLabel>
            <FieldCard noPad>
              {store.business_document_image ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setViewingDoc(true)}
                  style={{
                    width: "100%", height: 160, borderRadius: 10,
                    overflow: "hidden"
                  }}
                >
                  <Image
                    source={{ uri: store.business_document_image }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                  {/* Tap overlay */}
                  <View style={{
                    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.28)",
                    alignItems: "center", justifyContent: "center",
                    gap: 8,
                  }}>
                    <View style={{
                      width: 52, height: 52, borderRadius: 26,
                      backgroundColor: "rgba(0,0,0,0.5)",
                      borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <MaterialIcons name="zoom-in" size={26} color="#fff" />
                    </View>
                    <View style={{
                      backgroundColor: "rgba(0,0,0,0.5)",
                      paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14,
                    }}>
                      <Text style={{ color: "#fff", fontSize: 11, fontFamily: "Poppins-Medium" }}>
                        Tap to view & zoom
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ) : (
                <Text className="text-sm font-poppins-medium text-textMuted p-1">—</Text>
              )}
            </FieldCard>
          </View>
        </View>

        {/* Location */}
        <View>
          <SectionHeader title="Location Details" />
          <View className="mb-2.5">
            <FieldLabel>LANDMARK / ADDRESS</FieldLabel>
            <View className="bg-white dark:bg-darkBackgroundCard rounded-xl p-3 flex-row items-start gap-2.5">
              <View className="mt-0.5"><MaterialIcons name="location-on" size={20} color="#FF6600" /></View>
              <Text className="flex-1 text-[13px] font-poppins-medium text-textPrimary dark:text-darkTextPrimary leading-5">
                {store.address || "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* Approve / Reject */}
        {isPending && (
          <View className="-mt-1">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button variant="danger" label="Reject Application" onPress={() => onReject(store)} fullWidth />
              </View>
              <View className="flex-1">
                <Button variant="primary" label="Approve Store" onPress={() => onApprove(store)} fullWidth />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Full-screen document viewer */}
      {viewingDoc && store.business_document_image && (
        <ImageViewerModal
          uri={store.business_document_image}
          onClose={() => setViewingDoc(false)}
        />
      )}
    </ScreenWrapper>
  );
}