import React from "react";
import {
  Modal as RNModal,
  Pressable,
  useColorScheme,
  View as RNView,
  Dimensions,
  StyleSheet,
  Platform,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, Text, TouchableOpacity } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Button } from "@/components/button";
import { BlurView } from "expo-blur";

type ButtonVariant = "primary" | "success" | "danger" | "secondary" | "ghost";

export interface ModalButton {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  timer?: number;
}

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  buttons?: ModalButton[];
  children?: React.ReactNode;
  dismissOnBackdrop?: boolean;
  showCloseButton?: boolean;
  timer?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MODAL_WIDTH = Math.min(SCREEN_WIDTH - 32, 420);

export function UsersModal({
  visible,
  onClose,
  title,
  message,
  buttons = [],
  children,
  dismissOnBackdrop = true,
  showCloseButton = true,
  timer,
}: ModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  React.useEffect(() => {
    if (!visible || typeof timer !== "number") return;

    const id = setTimeout(onClose, timer);

    return () => clearTimeout(id);
  }, [visible, typeof timer, onClose]);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RNView style={styles.overlay}>
        <BlurView
          intensity={75}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
        <Pressable
          style={styles._invisibleBackdrop}
          onPress={dismissOnBackdrop ? onClose : undefined}
        />

        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            styles.card,
            {
              width: MODAL_WIDTH,
              backgroundColor: isDark ? "#262626" : "#ffffff",
              borderColor: isDark ? "#404040" : "#e2e8f0",
            },
          ]}
        >
          <View className="flex-row items-start justify-between px-5 pt-5 pb-3">
            <View className="flex-1 pr-3">
              <Text className="text-lg font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                {title}
              </Text>
            </View>

            {showCloseButton && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onClose}
                className="items-center justify-center rounded-full"
                style={{ width: 32, height: 32 }}
              >
                <MaterialIcons
                  name="close"
                  size={18}
                  color={isDark ? "#ffffff" : "#64748B"}
                />
              </TouchableOpacity>
            )}
          </View>

          {(message || children) && (
            <View className="px-5 pb-4">
              {!!message && (
                <Text className="text-sm leading-6 font-poppins text-slate-500 dark:text-slate-400">
                  {message}
                </Text>
              )}

              {!!children && (
                <View style={message ? { marginTop: 16 } : undefined}>
                  {children}
                </View>
              )}
            </View>
          )}

          {buttons.length > 0 && (
            <View className="px-5 pb-5 pt-2">
              {buttons.length === 3 ? (
                <View>
                  <View style={{ marginBottom: 8 }}>
                    <Button
                      label={buttons[0].label}
                      onPress={buttons[0].onPress}
                      variant={buttons[0].variant ?? "secondary"}
                      loading={buttons[0].loading}
                      disabled={buttons[0].disabled}
                    />
                  </View>
                  <View style={{ marginBottom: 8 }}>
                    <Button
                      label={buttons[1].label}
                      onPress={buttons[1].onPress}
                      variant={buttons[1].variant ?? "primary"}
                      loading={buttons[1].loading}
                      disabled={buttons[1].disabled}
                    />
                  </View>
                  <View>
                    <Button
                      label={buttons[2].label}
                      onPress={buttons[2].onPress}
                      variant={buttons[2].variant ?? "primary"}
                      loading={buttons[2].loading}
                      disabled={buttons[2].disabled}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.row}>
                  {buttons.map((btn, i) => (
                    <View
                      key={i}
                      style={{
                        flex: 1,
                        marginLeft: i === 0 ? 0 : 6,
                        marginRight: i === buttons.length - 1 ? 0 : 6,
                      }}
                    >
                      <Button
                        label={btn.label}
                        onPress={btn.onPress}
                        variant={btn.variant ?? (i === 0 && buttons.length === 2 ? "secondary" : "primary")}
                        loading={btn.loading}
                        disabled={btn.disabled}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </Pressable>
        </RNView>
      </GestureHandlerRootView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  _invisibleBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    zIndex: 1,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    zIndex: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
