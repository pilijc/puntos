import type { LayoutChangeEvent } from "react-native";
import type React from "react";

export type LandingSection =
  | "hero"
  | "features"
  | "how"
  | "pricing"
  | "cta"
  | "footer";

export const LANDING_SECTIONS: LandingSection[] = [
  "hero",
  "features",
  "how",
  "pricing",
  "cta",
  "footer",
];

export function createSectionLayoutHandlers(
  sectionY: React.MutableRefObject<Record<LandingSection, number>>,
): Record<LandingSection, (e: LayoutChangeEvent) => void> {
  return LANDING_SECTIONS.reduce(
    (acc, key) => {
      acc[key] = (e: LayoutChangeEvent) => {
        sectionY.current[key] = e.nativeEvent.layout.y;
      };
      return acc;
    },
    {} as Record<LandingSection, (e: LayoutChangeEvent) => void>,
  );
}
