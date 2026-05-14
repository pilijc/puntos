import React from "react";
import { useColorScheme } from "react-native";
import { useTranslation } from "react-i18next";
import { View, Text, Image, TouchableOpacity } from "@/tw";
import {
  Check,
  Store,
  Sparkles,
} from "lucide-react-native";
import Svg, { Path } from "react-native-svg";

import type { LandingSection } from "./types";

export const PRIMARY_ICON = "#FF6600";
const HERO_WAVE_FILL_LIGHT = "#fff7ed";
const HERO_WAVE_FILL_DARK = "rgba(251, 146, 60, 0.14)";

export function HeroWaveBackground({
  width,
  height,
  isDark,
}: {
  width: number;
  height: number;
  isDark: boolean;
}) {
  if (width <= 0 || height <= 0) return null;
  return (
    <View
      pointerEvents="none"
      className="absolute left-0 top-0 z-0"
      style={{ width, height }}
    >
      <Svg
        width={width}
        height={height}
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
      >
        <Path
          d="M1,0 L1,1 L0.5,1 C0.3,0.96 0.36,0.76 0.42,0.56 C0.48,0.38 0.54,0.24 0.72,0.12 C0.88,0.03 0.96,0 1,0 Z"
          fill={isDark ? HERO_WAVE_FILL_DARK : HERO_WAVE_FILL_LIGHT}
        />
      </Svg>
    </View>
  );
}

function toAmountNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function PricingFeatureLine({ text }: { text: string }) {
  return (
    <View className="flex-row items-start gap-2.5 py-1.5">
      <Check size={15} color="#FF6600" style={{ marginTop: 3 }} />
      <Text className="flex-1 text-[13px] font-poppins leading-5 text-textSecondary dark:text-darkTextSecondary">
        {text}
      </Text>
    </View>
  );
}

export function PricingTierCard({
  plan,
  tier,
  nameFallback,
  features,
}: {
  plan: Record<string, unknown> | null;
  tier: "basic" | "pro";
  nameFallback: string;
  features: string[];
}) {
  const { t } = useTranslation();
  const isDark = useColorScheme() === "dark";
  const mutedIcon = isDark ? "#a3a3a3" : "#64748b";
  const name = plan ? String(plan.name ?? nameFallback) : nameFallback;
  const amt = plan ? toAmountNumber(plan.amount) : null;
  const featured = tier === "pro";

  const hasPaidAmount = amt != null && amt > 0;
  const priceMain = featured
    ? hasPaidAmount
      ? `PHP ${amt.toFixed(2)}`
      : "—"
    : hasPaidAmount
      ? `PHP ${amt.toFixed(2)}`
      : t("superAdmin.subscription.basic.price");

  const showPerMonth = hasPaidAmount;

  const blurb = featured
    ? t("onboarding.landing.pricingProBlurb")
    : t("onboarding.landing.pricingBasicBlurb");

  const shellClass = featured
    ? "flex w-[400px] shrink-0 flex-col rounded-2xl border border-primary bg-white dark:bg-darkBackgroundCard md:min-h-[420px]"
    : "flex w-[400px] shrink-0 flex-col rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-darkBorder dark:bg-darkBackgroundCard md:min-h-[400px]";

  return (
    <View className={shellClass}>
      <View className="flex-1 justify-between px-6 pb-2 pt-5">
        <View className="gap-5">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-orange-50 dark:bg-darkPrimaryBgMuted">
              {featured ? (
                <Sparkles size={20} color="#FF6600" />
              ) : (
                <Store size={20} color={mutedIcon} />
              )}
            </View>
            <Text
              className="flex-1 font-poppins-semibold text-lg text-textPrimary dark:text-darkTextPrimary"
              numberOfLines={2}
            >
              {name}
            </Text>
          </View>

          <View className="flex-row flex-wrap items-baseline gap-x-2 gap-y-0">
            <Text className="font-poppins-bold tracking-tight text-4xl text-textPrimary dark:text-darkTextPrimary">
              {priceMain}
            </Text>
            {showPerMonth ? (
              <Text className="font-poppins text-sm text-textMuted dark:text-darkTextMuted">
                {t("onboarding.landing.pricingPerMonth")}
              </Text>
            ) : null}
          </View>

          <Text className="font-poppins text-sm leading-6 text-textSecondary dark:text-darkTextSecondary">
            {blurb}
          </Text>

          <View className="mt-1 flex flex-col gap-0.5 border-t border-slate-100 pt-4 dark:border-darkBorder">
            {features.map((line, idx) => (
              <PricingFeatureLine key={`${tier}-${idx}`} text={line} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

export function HowItWorksStepCard({
  stepNumber,
  title,
  description,
  badgeColor,
  imageSource,
}: {
  stepNumber: number;
  title: string;
  description: string;
  badgeColor: string;
  imageSource: number;
}) {
  return (
    <View className="w-full min-w-0 flex-1 md:max-w-[320px] lg:max-w-[340px]">
      <View className="mb-3 items-center md:mb-4">
        <View
          className="h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: badgeColor }}
        >
          <Text className="font-poppins-bold text-lg text-white">
            {stepNumber}
          </Text>
        </View>
      </View>
      <View className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-darkBorder dark:bg-darkBackgroundCard md:p-4">
        <View className="mb-3 overflow-hidden rounded-xl bg-slate-100 dark:bg-darkBackgroundMuted">
          <View className="relative h-36 w-full md:h-40">
            <Image
              source={imageSource}
              className="absolute left-0 top-0 h-full w-full"
              resizeMode="cover"
            />
          </View>
        </View>
        <Text className="mb-1.5 font-poppins-semibold text-base leading-snug text-textPrimary dark:text-darkTextPrimary">
          {title}
        </Text>
        <Text className="font-poppins text-[13px] leading-6 text-textSecondary dark:text-darkTextSecondary">
          {description}
        </Text>
      </View>
    </View>
  );
}

export function NavLink({
  label,
  section,
  onNavigate,
}: {
  label: string;
  section: LandingSection;
  onNavigate: (key: LandingSection) => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => onNavigate(section)}
      accessibilityRole="link"
    >
      <Text className="px-2 py-1 font-poppins-medium text-sm text-textSecondary dark:text-darkTextSecondary">
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function FeatureCard({
  title,
  description,
  Icon,
}: {
  title: string;
  description: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
}) {
  return (
    <View className="min-w-[240px] max-w-[300px] flex-1 rounded-xl border border-slate-200 bg-white px-5 py-6 dark:border-darkBorder dark:bg-darkBackgroundCard">
      <View className="mb-3">
        <Icon size={20} color={PRIMARY_ICON} />
      </View>
      <Text className="mb-1.5 font-poppins-semibold text-base leading-snug text-textPrimary dark:text-darkTextPrimary">
        {title}
      </Text>
      <Text className="font-poppins text-[13px] leading-6 text-textSecondary dark:text-darkTextSecondary">
        {description}
      </Text>
    </View>
  );
}
