import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  PanResponder,
  Animated,
  Dimensions,
  Modal as RNModal,
  StatusBar,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";

const SCREEN = Dimensions.get("window");
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const SLIDER_HEIGHT = 220;

export function ImageViewerModal({ uri, onClose }: { uri: string; onClose: () => void }) {

  const zoomAnim  = useRef(new Animated.Value(MIN_ZOOM)).current;
  const zoomRef   = useRef(MIN_ZOOM);
  const panX      = useRef(new Animated.Value(0)).current;
  const panY      = useRef(new Animated.Value(0)).current;
  const panBase   = useRef({ x: 0, y: 0 });
  const thumbAnim = useRef(new Animated.Value(SLIDER_HEIGHT)).current;
  const thumbRef  = useRef(SLIDER_HEIGHT);

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  const applyZoom = (next: number, springIt = true) => {
    const z = clamp(next, MIN_ZOOM, MAX_ZOOM);
    zoomRef.current = z;

    if (springIt) {
      Animated.spring(zoomAnim, { toValue: z, useNativeDriver: true, tension: 140, friction: 12 }).start();
    } else {
      zoomAnim.setValue(z);
    }

    if (z <= MIN_ZOOM) {
      panBase.current = { x: 0, y: 0 };
      panX.setValue(0);
      panY.setValue(0);
    }

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
  const dragStart = useRef(SLIDER_HEIGHT);

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
      },
    })
  ).current;

  const stepZoom = (delta: number) => applyZoom(zoomRef.current + delta);

  return (
    <RNModal visible animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <StatusBar hidden />

      <View style={{ flex: 1, backgroundColor: "#000" }}>

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

            <TouchableOpacity
              onPress={() => stepZoom(0.5)}
              activeOpacity={0.6}
              style={{ width: 26, height: 26, alignItems: "center", justifyContent: "center" }}
            >
              <MaterialIcons name="add" size={18} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>

            <View
              style={{ width: 26, height: SLIDER_HEIGHT, alignItems: "center" }}
              {...sliderResponder.panHandlers}
            >
              <View style={{
                position: "absolute",
                top: 0, bottom: 0,
                width: 3,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.18)",
              }} />

              <Animated.View style={{
                position: "absolute",
                top: 0,
                width: 3,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.7)",
                height: thumbAnim,
              }} />

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

            <TouchableOpacity
              onPress={() => stepZoom(-0.5)}
              activeOpacity={0.6}
              style={{ width: 26, height: 26, alignItems: "center", justifyContent: "center" }}
            >
              <MaterialIcons name="remove" size={18} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
          </View>
        </View>

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
