import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Modal as RNModal,
  StatusBar,
  Platform,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

const SCREEN = Dimensions.get("window");
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

export function ImageViewerModal({ uri, onClose }: { uri: string; onClose: () => void }) {

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const maxPan = (axis: "x" | "y", z: number) => {
    'worklet';
    return ((z - 1) / z) * (axis === "x" ? SCREEN.width : SCREEN.height) * 0.55;
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const nextScale = savedScale.value * e.scale;
      scale.value = Math.max(0.8, Math.min(6, nextScale));
    })
    .onEnd(() => {
      if (scale.value < MIN_ZOOM) {
        scale.value = withSpring(MIN_ZOOM);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        savedScale.value = MIN_ZOOM;
      } else if (scale.value > MAX_ZOOM) {
        scale.value = withSpring(MAX_ZOOM);
        savedScale.value = MAX_ZOOM;
      } else {
        savedScale.value = scale.value;
      }
    });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
    })
    .onUpdate((e) => {
      if (scale.value > MIN_ZOOM) {
        const maxX = maxPan("x", scale.value);
        const maxY = maxPan("y", scale.value);
        const nextX = savedTranslateX.value + e.translationX;
        const nextY = savedTranslateY.value + e.translationY;
        
        translateX.value = Math.max(-maxX, Math.min(maxX, nextX));
        translateY.value = Math.max(-maxY, Math.min(maxY, nextY));
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      isDragging.value = false;
    })
    .onFinalize(() => {
      isDragging.value = false;
    });

  const gesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateX: translateX.value },
        { translateY: translateY.value },
      ] as any,
      cursor: Platform.OS === 'web' 
        ? (isDragging.value ? 'grabbing' : 'grab') 
        : 'auto'
    };
  });

  const imagePanResponder = {};

  return (
    <RNModal visible animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <StatusBar hidden />

      <GestureHandlerRootView 
        style={{ flex: 1, backgroundColor: "#000" }}
        {...(Platform.OS === 'web' ? {
          onWheel: (e: any) => {
            const zoomSpeed = 0.001;
            const delta = -e.deltaY;
            const nextScale = scale.value + delta * zoomSpeed;
            scale.value = Math.max(0.8, Math.min(6, nextScale));
            savedScale.value = scale.value;
          }
        } : {})}
      >

        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[
              {
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                alignItems: "center",
                justifyContent: "center",
                cursor: Platform.OS === 'web' ? 'grab' : 'auto'
              },
              animatedStyle
            ]}
          >
            <Image
              source={{ uri }}
              style={{ width: SCREEN.width, height: SCREEN.height }}
              contentFit="contain"
              {...(Platform.OS === 'web' ? { draggable: false } : {})}
            />
          </Animated.View>
        </GestureDetector>

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


        <View style={{
          position: "absolute", bottom: 36, left: 0, right: 0,
          alignItems: "center", zIndex: 60,
        }}>
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 6,
            backgroundColor: "rgba(0,0,0,0.55)",
            paddingHorizontal: 18, paddingVertical: 8, borderRadius: 24,
          }}>
            <MaterialIcons name={Platform.OS === 'web' ? "mouse" : "open-with"} size={14} color="rgba(255,255,255,0.6)" />
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontFamily: "Poppins-Medium" }}>
              {Platform.OS === 'web' 
                ? "Scroll to zoom  •  Click and drag to pan"
                : "Pinch to zoom  •  Drag to pan"}
            </Text>
          </View>
        </View>

      </GestureHandlerRootView>
    </RNModal>
  );
}
