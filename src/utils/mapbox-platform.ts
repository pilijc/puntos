import { Platform } from "react-native";

export function shouldUseInteractiveMapbox(): boolean {
  return Platform.OS === "web" || Platform.OS === "android";
}
