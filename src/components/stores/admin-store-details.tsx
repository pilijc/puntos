import React, { useState, useRef } from "react";
import {
  ScrollView,
  PanResponder,
  Animated,
  Dimensions,
  Modal as RNModal,
  StatusBar,
} from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { ScreenWrapper } from "@/components/ui/screen-wrapper";
import { Button } from "@/components/button";
import { AdminStoreRow } from "@/services/store-service";

const twConfig = require("../../../tailwind.config.js");
const twColors = twConfig.theme.extend.colors;

const SCREEN = Dimensions.get("window");
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const SLIDER_HEIGHT = 220;

type StatusKey = "pending" | "active" | "inactive";

const STATUS_CONFIG: Record<StatusKey, {
  label: string; icon: "schedule" | "check-circle" | "cancel";
  bg: string; border: string; badgeBg: string; text: string;
}> = {
  pending:  { label: "PENDING",  icon: "schedule",     bg: "#ffffff", border: "#f5e4a8", badgeBg: "#fef0c0", text: "#7a5c00" },
  active:   { label: "ACTIVE",   icon: "check-circle", bg: "#ffffff", border: "#d4fce2", badgeBg: "#dcfce7", text: twColors.success },
  inactive: { label: "INACTIVE", icon: "cancel",       bg: "#ffffff", border: "#fecaca", badgeBg: "#fee2e2", text: twColors.danger },
};

// ─── Field helpers ────────────────────────────────────────────────────────────
const SectionHeader = ({ title }: { title: string }) => (
  <Text className="text-base font-poppins-bold text-textPrimary dark:text-darkTextPrimary mb-3">{title}</Text>
);
const FieldLabel = ({ children }: { children: string }) => (
  <Text className="text-[10px] font-poppins-bold text-textSecondary uppercase tracking-wider mb-1 px-1">{children}</Text>
);
const FieldCard = ({ children, noPad }: { children: React.ReactNode; noPad?: boolean }) => (
  <View className={`bg-white dark:bg-darkBackgroundCard rounded-xl border border-[#e2e8f0] dark:border-darkBorder min-h-[48px] justify-center ${noPad ? 'p-2.5' : 'p-3'}`}>
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

// ─── Full-screen Image Viewer (uses RN Modal so it truly covers the screen) ───
function ImageViewerModal({ uri, onClose }: { uri: string; onClose: () => void }) {
  // ── zoom ──────────────────────────────────────────────────────────────────
  const zoomAnim  = useRef(new Animated.Value(MIN_ZOOM)).current;
  const zoomRef   = useRef(MIN_ZOOM);

  // ── pan ───────────────────────────────────────────────────────────────────
  const panX      = useRef(new Animated.Value(0)).current;
  const panY      = useRef(new Animated.Value(0)).current;
  const panBase   = useRef({ x: 0, y: 0 });

  // ── slider thumb ──────────────────────────────────────────────────────────
  // top (0) = MAX_ZOOM, bottom (SLIDER_HEIGHT) = MIN_ZOOM
  const thumbAnim = useRef(new Animated.Value(SLIDER_HEIGHT)).current;
  const thumbRef  = useRef(SLIDER_HEIGHT); // mirrors current thumb pixel pos

  // ── helpers ───────────────────────────────────────────────────────────────
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  const applyZoom = (next: number, springIt = true) => {
    const z = clamp(next, MIN_ZOOM, MAX_ZOOM);
    zoomRef.current = z;

    if (springIt) {
      Animated.spring(zoomAnim, { toValue: z, useNativeDriver: true, tension: 140, friction: 12 }).start();
    } else {
      zoomAnim.setValue(z);
    }

    // reset pan when fully zoomed out
    if (z <= MIN_ZOOM) {
      panBase.current = { x: 0, y: 0 };
      panX.setValue(0);
      panY.setValue(0);
    }

    // sync thumb
    const ratio    = (z - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM);
    const newThumb = (1 - ratio) * SLIDER_HEIGHT;
    thumbRef.current = newThumb;
    if (springIt) {
      Animated.spring(thumbAnim, { toValue: newThumb, useNativeDriver: false, tension: 140, friction: 12 }).start();
    } else {
      thumbAnim.setValue(newThumb);
    }
  };

  const maxPan = (axis: "x" | "y") => {
    const z = zoomRef.current;
    return ((z - 1) / z) * (axis === "x" ? SCREEN.width : SCREEN.height) * 0.55;
  };

  // ── image pan responder ───────────────────────────────────────────────────
  const imagePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => zoomRef.current > MIN_ZOOM,
      onMoveShouldSetPanResponder:  () => zoomRef.current > MIN_ZOOM,
      onPanResponderMove: (_, gs) => {
        panX.setValue(clamp(panBase.current.x + gs.dx, -maxPan("x"), maxPan("x")));
        panY.setValue(clamp(panBase.current.y + gs.dy, -maxPan("y"), maxPan("y")));
      },
      onPanResponderRelease: (_, gs) => {
        panBase.current = {
          x: clamp(panBase.current.x + gs.dx, -maxPan("x"), maxPan("x")),
          y: clamp(panBase.current.y + gs.dy, -maxPan("y"), maxPan("y")),
        };
      },
    })
  ).current;

  // ── slider drag responder ─────────────────────────────────────────────────
  const dragStart = useRef(SLIDER_HEIGHT); // thumb pos when gesture started

  const sliderResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: () => {
        dragStart.current = thumbRef.current;
      },
      onPanResponderMove: (_, gs) => {
        const newThumb = clamp(dragStart.current + gs.dy, 0, SLIDER_HEIGHT);
        thumbRef.current = newThumb;
        thumbAnim.setValue(newThumb);

        const ratio = 1 - newThumb / SLIDER_HEIGHT;
        const z     = MIN_ZOOM + ratio * (MAX_ZOOM - MIN_ZOOM);
        zoomRef.current = z;
        zoomAnim.setValue(z);

        if (z <= MIN_ZOOM) {
          panBase.current = { x: 0, y: 0 };
          panX.setValue(0);
          panY.setValue(0);
        }
      },
      onPanResponderRelease: () => {
        // thumbRef.current already updated in onMove
      },
    })
  ).current;

  const stepZoom = (delta: number) => applyZoom(zoomRef.current + delta);

  return (
    <RNModal visible animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <StatusBar hidden />

      {/* ── Full-screen black background ── */}
      <View style={{ flex: 1, backgroundColor: "#000" }}>

        {/* ── Zoomable / pannable image ── */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            transform: [{ scale: zoomAnim }, { translateX: panX }, { translateY: panY }],
          }}
          {...imagePanResponder.panHandlers}
        >
          <Image
            source={{ uri }}
            style={{ width: SCREEN.width, height: SCREEN.height }}
            contentFit="contain"
          />
        </Animated.View>

        {/* ── Close ── */}
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.8}
          style={{
            position: "absolute", top: 48, left: 16, zIndex: 60,
            width: 42, height: 42, borderRadius: 21,
            backgroundColor: "rgba(0,0,0,0.6)",
            borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <MaterialIcons name="close" size={22} color="#fff" />
        </TouchableOpacity>

        {/* ── Zoom slider (right side) ── */}
        <View
          style={{
            position: "absolute",
            right: 12,
            top: 0, bottom: 0,
            zIndex: 60,
            alignItems: "center",
            justifyContent: "center",
          }}
          pointerEvents="box-none"
        >
          <View style={{
            alignItems: "center",
            gap: 6,
            backgroundColor: "rgba(20,20,20,0.65)",
            borderRadius: 30,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
            paddingVertical: 8,
            paddingHorizontal: 6,
            shadowColor: "#000",
            shadowOpacity: 0.4,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 2 },
            elevation: 8,
          }}>

            {/* + */}
            <TouchableOpacity
              onPress={() => stepZoom(0.5)}
              activeOpacity={0.6}
              style={{ width: 26, height: 26, alignItems: "center", justifyContent: "center" }}
            >
              <MaterialIcons name="add" size={18} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>

            {/* Track */}
            <View
              style={{ width: 26, height: SLIDER_HEIGHT, alignItems: "center" }}
              {...sliderResponder.panHandlers}
            >
              {/* Track bg */}
              <View style={{
                position: "absolute",
                top: 0, bottom: 0,
                width: 3,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.18)",
              }} />

              {/* Active fill */}
              <Animated.View style={{
                position: "absolute",
                top: 0,
                width: 3,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.7)",
                height: thumbAnim,
              }} />

              {/* Thumb */}
              <Animated.View style={{
                position: "absolute",
                top: thumbAnim,
                marginTop: -12,
                width: 24, height: 24,
                borderRadius: 12,
                backgroundColor: "#fff",
                shadowColor: "#000",
                shadowOpacity: 0.35,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
                elevation: 6,
                alignItems: "center",
                justifyContent: "center",
              }}>
                <View style={{ width: 10, gap: 2.5, alignItems: "center" }}>
                  <View style={{ width: 10, height: 1.5, borderRadius: 1, backgroundColor: "#555" }} />
                  <View style={{ width: 10, height: 1.5, borderRadius: 1, backgroundColor: "#555" }} />
                  <View style={{ width: 10, height: 1.5, borderRadius: 1, backgroundColor: "#555" }} />
                </View>
              </Animated.View>
            </View>

            {/* − */}
            <TouchableOpacity
              onPress={() => stepZoom(-0.5)}
              activeOpacity={0.6}
              style={{ width: 26, height: 26, alignItems: "center", justifyContent: "center" }}
            >
              <MaterialIcons name="remove" size={18} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Bottom hint ── */}
        <View style={{
          position: "absolute", bottom: 36, left: 0, right: 0,
          alignItems: "center", zIndex: 60,
        }}>
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 6,
            backgroundColor: "rgba(0,0,0,0.55)",
            paddingHorizontal: 18, paddingVertical: 8, borderRadius: 24,
          }}>
            <MaterialIcons name="open-with" size={14} color="rgba(255,255,255,0.6)" />
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontFamily: "Poppins-Medium" }}>
              Drag to pan  •  Slide or tap +/− to zoom
            </Text>
          </View>
        </View>

      </View>
    </RNModal>
  );
}

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

  const isPending = store.status?.toLowerCase().includes("pending");
  const statusKey = isPending ? "pending" : (store.status as StatusKey);
  const statusCfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.pending;

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
        {/* Status banner */}
        <View style={{ backgroundColor: statusCfg.bg, borderColor: statusCfg.border }} className="rounded-2xl border p-3 flex-row items-center justify-between">
          <Text style={{ color: statusCfg.text }} className="text-[13px] font-poppins-bold">Application Status</Text>
          <View style={{ backgroundColor: statusCfg.badgeBg }} className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-full">
            <MaterialIcons name={statusCfg.icon} size={13} color={statusCfg.text} />
            <Text style={{ color: statusCfg.text }} className="text-[11px] font-poppins-bold tracking-wider">{statusCfg.label}</Text>
          </View>
        </View>

        {/* Store Details */}
        <View>
          <SectionHeader title="Store Details" />
          <ReadOnlyField label="STORE NAME" value={store.name} />

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
        </View>

        {/* Business Details */}
        <View>
          <SectionHeader title="Business Details" />
          <ReadOnlyField label="OWNER NAME" value={store.owner_name} />
          <ReadOnlyField label="PHONE NUMBER" value={store.phone} />

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
                    overflow: "hidden", margin: 4,
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
            <View className="bg-white dark:bg-darkBackgroundCard rounded-xl border border-[#e2e8f0] dark:border-darkBorder p-3 flex-row items-start gap-2.5">
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
                <Button variant="primary" label="Approve Store" onPress={() => onApprove(store)} fullWidth />
              </View>
              <View className="flex-1">
                <Button variant="danger" label="Reject Application" onPress={() => onReject(store)} fullWidth />
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