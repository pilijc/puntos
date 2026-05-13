import React, { useEffect, useRef, useState } from "react";
import { Redirect, router } from "expo-router";
import {
  ActivityIndicator,
  Platform,
  ScrollView as RNScrollView,
  useColorScheme,
  useWindowDimensions,
  type LayoutChangeEvent,
} from "react-native";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from "@/tw";
import {
  Smartphone,
  QrCode,
  Gift,
  BarChart3,
  Ticket,
  Monitor,
  Check,
  Store,
  Sparkles,
  Rocket,
  ChevronRight,
  ChevronDown,
  Users,
  LineChart,
  DollarSign,
} from "lucide-react-native";
import Svg, { Path } from "react-native-svg";
import { Button } from "@/components/button";
import {
  getSubscriptionPlans,
  pickBasicAndProPlans,
} from "@/services/store-manager/subscription-service";

const WELCOME_ROUTE = "/(onboarding)/welcome";
const LOGIN_ROUTE = "/login";

const PRIMARY_ICON = "#FF6600";
const HERO_WAVE_FILL_LIGHT = "#fff7ed";
const HERO_WAVE_FILL_DARK = "rgba(251, 146, 60, 0.14)";

const HOW_STEP_BADGE_COLORS = ["#FF6600", "#FF6600", "#FF6600"] as const;
const HOW_STEP_IMAGES = [
  require("../../assets/images/step-1.png"),
  require("../../assets/images/step-2.png"),
  require("../../assets/images/step-3.png"),
] as const;

function HeroWaveBackground({
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

type LandingSection = "hero" | "features" | "how" | "pricing" | "cta" | "footer";

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

function PricingTierCard({
  plan,
  tier,
  nameFallback,
  features,
}: {
  plan: Record<string, unknown> | null;
  tier: "basic" | "pro";
  nameFallback: string; 
  onChoose: () => void;
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

function HowItWorksStepCard({
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
          <View className="h-36 w-full md:h-40 relative">
            <Image
              source={imageSource}
              className="absolute top-0 left-0 h-full w-full"
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

function NavLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="link">
      <Text className="px-2 py-1 font-poppins-medium text-sm text-textSecondary dark:text-darkTextSecondary">
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function FeatureCard({
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

export default function MarketingLanding() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const isWeb = Platform.OS === "web";
  const isDark = useColorScheme() === "dark";
  const scrollRef = useRef<RNScrollView>(null);
  const sectionY = useRef<Record<LandingSection, number>>({
    hero: 0,
    features: 0,
    how: 0,
    pricing: 0,
    cta: 0,
    footer: 0,
  });

  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [basicPlan, setBasicPlan] = useState<Record<string, unknown> | null>(
    null,
  );
  const [proPlan, setProPlan] = useState<Record<string, unknown> | null>(null);
  const [heroBandSize, setHeroBandSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!isWeb) return;
    let cancelled = false;
    void (async () => {
      setPlansLoading(true);
      setPlansError(null);
      try {
        const rows = await getSubscriptionPlans();
        if (cancelled) return;
        const picked = pickBasicAndProPlans(
          rows as Array<Record<string, unknown>>,
        );
        setBasicPlan(picked.basicPlan);
        setProPlan(picked.proPlan);
      } catch (e) {
        if (!cancelled) {
          setPlansError(
            e instanceof Error
              ? e.message
              : t("onboarding.landing.pricingLoadError"),
          );
        }
      } finally {
        if (!cancelled) setPlansLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isWeb, t]);

  if (!isWeb) {
    return <Redirect href={WELCOME_ROUTE} />;
  }

  const onSectionLayout =
    (key: LandingSection) =>
    (e: LayoutChangeEvent) => {
      sectionY.current[key] = e.nativeEvent.layout.y;
    };

  const scrollToSection = (key: LandingSection) => () => {
    const y = sectionY.current[key];
    scrollRef.current?.scrollTo({ y: Math.max(0, y), animated: true });
  };

  const goWelcome = () => router.push(WELCOME_ROUTE);
  const goLogin = () => router.push(LOGIN_ROUTE);

  const basicPricingInclusions = [
    t("onboarding.landing.pricingBasicInc1"),
    t("onboarding.landing.pricingBasicInc2"),
    t("onboarding.landing.pricingBasicInc3"),
    t("onboarding.landing.pricingBasicInc4"),
    t("onboarding.landing.pricingBasicInc5"),
  ];

  const proPricingInclusions = [
    t("onboarding.landing.pricingProInc1"),
    t("onboarding.landing.pricingProInc2"),
    t("onboarding.landing.pricingProInc3"),
    t("onboarding.landing.pricingProInc4"),
    t("onboarding.landing.pricingProInc6"),
    t("onboarding.landing.pricingProInc7"),
    t("onboarding.landing.pricingProInc8"),
  ];

  const features = [
    {
      title: t("onboarding.landing.feat1Title"),
      description: t("onboarding.landing.feat1Desc"),
      Icon: Smartphone,
    },
    {
      title: t("onboarding.landing.feat2Title"),
      description: t("onboarding.landing.feat2Desc"),
      Icon: QrCode,
    },
    {
      title: t("onboarding.landing.feat3Title"),
      description: t("onboarding.landing.feat3Desc"),
      Icon: Gift,
    },
    {
      title: t("onboarding.landing.feat4Title"),
      description: t("onboarding.landing.feat4Desc"),
      Icon: BarChart3,
    },
    {
      title: t("onboarding.landing.feat5Title"),
      description: t("onboarding.landing.feat5Desc"),
      Icon: Ticket,
    },
    {
      title: t("onboarding.landing.feat6Title"),
      description: t("onboarding.landing.feat6Desc"),
      Icon: Monitor,
    },
  ] as const;

  const steps = [
    {
      n: 1,
      title: t("onboarding.landing.step1Title"),
      desc: t("onboarding.landing.step1Desc"),
    },
    {
      n: 2,
      title: t("onboarding.landing.step2Title"),
      desc: t("onboarding.landing.step2Desc"),
    },
    {
      n: 3,
      title: t("onboarding.landing.step3Title"),
      desc: t("onboarding.landing.step3Desc"),
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-darkBackground">
      <RNScrollView
        ref={scrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <View
          className="relative w-full overflow-hidden"
          onLayout={(e) => {
            const { width: w, height: h } = e.nativeEvent.layout;
            setHeroBandSize({ w, h });
          }}
        >
          <HeroWaveBackground
            width={heroBandSize.w}
            height={heroBandSize.h}
            isDark={isDark}
          />
          <View className="relative z-10 px-4 py-2 md:pt-4 md:pb-2 md:px-10">
            <View className="mx-auto w-full max-w-6xl flex-row flex-wrap items-center justify-between gap-y-3">
              <Image
                source={require("../../assets/images/puntos-icon.png")}
                className="w-12 h-12"
                resizeMode="contain"
              />
              <View className="hidden flex-1 flex-row flex-wrap items-center justify-center gap-1 lg:flex">
                <NavLink
                  label={t("onboarding.landing.nav.overview")}
                  onPress={scrollToSection("hero")}
                />
                <NavLink
                  label={t("onboarding.landing.nav.features")}
                  onPress={scrollToSection("features")}
                />
                <NavLink
                  label={t("onboarding.landing.nav.howItWorks")}
                  onPress={scrollToSection("how")}
                />
                <NavLink
                  label={t("onboarding.landing.nav.pricing")}
                  onPress={scrollToSection("pricing")}
                />
                <NavLink
                  label={t("onboarding.landing.nav.footer")}
                  onPress={scrollToSection("footer")}
                />
              </View>
              <View className="flex-row items-center gap-3">
                <Button
                  label={t("onboarding.landing.signIn")}
                  onPress={goLogin}
                  variant="primary"
                  roundedFull={true}
                  fitContent={true}
                />
              </View>
            </View>
          </View>

          <View
            onLayout={onSectionLayout("hero")}
            className="relative z-10 mx-auto w-full max-w-6xl py-6 md:py-10"
          >
            <View
              className={`flex-col gap-10 ${isWide ? "md:flex-row md:items-center" : ""}`}
            >
              <View className="flex-1 gap-5">
                <Text className="font-poppins-bold text-4xl leading-tight text-textPrimary dark:text-darkTextPrimary md:text-5xl">
                  {t("onboarding.landing.heroLine1")}{" "}
                  <Text className="text-primary dark:text-darkPrimaryText">
                    {t("onboarding.landing.heroHighlight")}
                  </Text>
                </Text>
                <Text className="max-w-xl font-poppins text-sm leading-relaxed text-textSecondary dark:text-darkTextSecondary md:text-base">
                  {t("onboarding.landing.heroSub")}
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  <TouchableOpacity
                    onPress={goWelcome}
                    className="rounded-full bg-primary px-6 py-3"
                    accessibilityRole="button"
                  >
                    <Text className="font-poppins-semibold text-base text-white">
                      {t("onboarding.landing.getStarted")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View className="flex-1 items-center justify-center">
                <View className="w-full max-w-2xl overflow-hidden rounded-2xl p-6">
                  <Image
                    source={require("../../assets/images/landing.png")}
                    className="w-full h-[480px] rounded-lg md:h-[520px]"
                    resizeMode="contain"
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        <View
          onLayout={onSectionLayout("features")}
          className="bg-white px-4 py-14 dark:border-darkBorder dark:bg-darkBackground md:px-10 md:py-16"
        >
          <View className="mx-auto w-full max-w-6xl">
            <View className="mx-auto mb-10 max-w-xl md:mb-12">
              <Text className="mb-2 text-center font-poppins-bold text-2xl tracking-tight text-textPrimary dark:text-darkTextPrimary md:text-3xl">
                {t("onboarding.landing.featuresTitle")}
              </Text>
              <Text className="text-center font-poppins text-sm leading-6 text-textSecondary dark:text-darkTextSecondary md:text-[15px]">
                {t("onboarding.landing.featuresSub")}
              </Text>
            </View>
            <View className="flex-row flex-wrap justify-center gap-x-6 gap-y-8 md:gap-x-8 md:gap-y-10">
              {features.map((f) => (
                <FeatureCard key={f.title} {...f} />
              ))}
            </View>
          </View>
        </View>

        <View
          onLayout={onSectionLayout("how")}
          className="bg-white px-4 py-14 dark:border-darkBorder dark:bg-darkBackground md:px-10 md:py-20"
        >
          <View className="mx-auto w-full max-w-6xl">
            <View className="mb-10 items-center md:mb-14">
              <Text className="mb-1 text-center font-poppins-bold text-2xl tracking-tight text-textPrimary dark:text-darkTextPrimary md:text-3xl">
                {t("onboarding.landing.howTitleMain")}
              </Text>
              <Text className="text-center font-poppins-bold text-xl text-primary dark:text-darkTextSecondary md:text-2xl">
                {t("onboarding.landing.howTitleSub")}
              </Text>
            </View>

            <View className="flex-col items-stretch gap-8 md:flex-row md:items-start md:justify-center md:gap-3 lg:gap-4">
              {steps.map((s, index) => (
                <React.Fragment key={s.n}>
                  {index > 0 ? (
                    <View className="items-center justify-center py-0 md:w-6 md:shrink-0 md:self-center md:py-12">
                      <View className="md:hidden">
                        <ChevronDown size={22} color="#cbd5e1" />
                      </View>
                      <View className="hidden md:flex">
                        <ChevronRight size={22} color="#cbd5e1" />
                      </View>
                    </View>
                  ) : null}
                  <HowItWorksStepCard
                    stepNumber={s.n}
                    title={s.title}
                    description={s.desc}
                    badgeColor={HOW_STEP_BADGE_COLORS[index] ?? HOW_STEP_BADGE_COLORS[0]}
                    imageSource={HOW_STEP_IMAGES[index] ?? HOW_STEP_IMAGES[0]}
                  />
                </React.Fragment>
              ))}
            </View>
          </View>
        </View>

        <View
          onLayout={onSectionLayout("pricing")}
          className="bg-white px-4 py-16 dark:bg-darkBackgroundMuted md:px-10"
        >
          <View className="mx-auto w-full max-w-6xl">
            <Text className="mb-3 text-center font-poppins-bold text-3xl text-textPrimary dark:text-darkTextPrimary">
              {t("onboarding.landing.pricingTitle")}
            </Text>
            <Text className="mb-10 text-center font-poppins text-textSecondary dark:text-darkTextSecondary">
              {t("onboarding.landing.pricingSub")}
            </Text>
            {plansLoading ? (
              <View className="items-center py-10">
                <ActivityIndicator size="large" color={PRIMARY_ICON} />
              </View>
            ) : plansError ? (
              <Text className="text-center font-poppins text-textSecondary dark:text-darkTextSecondary">
                {plansError}
              </Text>
            ) : !basicPlan && !proPlan ? (
              <Text className="text-center font-poppins text-textSecondary dark:text-darkTextSecondary">
                {t("onboarding.landing.pricingEmpty")}
              </Text>
            ) : (
              <View className="mx-auto flex w-full max-w-[900px] flex-row flex-nowrap items-center justify-center gap-6 overflow-x-auto px-2 py-1">
                  {basicPlan ? (
                    <PricingTierCard
                      plan={basicPlan}
                      tier="basic"
                      nameFallback={t(
                        "onboarding.landing.pricingFallbackBasic",
                      )}
                      onChoose={goWelcome}
                      features={basicPricingInclusions}
                    />
                  ) : null}
                  {proPlan ? (
                    <PricingTierCard
                      plan={proPlan}
                      tier="pro"
                      nameFallback={t("onboarding.landing.pricingFallbackPro")}
                      onChoose={goWelcome}
                      features={proPricingInclusions}
                    />
                  ) : null}
              </View>
            )}
          </View>
        </View>

        <View
          onLayout={onSectionLayout("cta")}
          className="bg-primary px-4 py-10 md:px-10 md:py-10"
        >
          <View className="mx-auto w-full max-w-3xl items-center gap-y-1">
            <Text className="text-center font-poppins-bold text-2xl leading-tight text-white">
              {t("onboarding.landing.ctaTitle")}
            </Text>
            <Text className="text-center font-poppins text-base leading-relaxed text-white/90">
              {t("onboarding.landing.ctaSub")}
            </Text>
          </View>
        </View>

        <View
          onLayout={onSectionLayout("footer")}
          className="border-t border-border px-4 py-12 md:px-10 dark:border-darkBorder"
        >
          <View className="mx-auto w-full max-w-6xl flex-col gap-10 md:flex-row md:justify-between">
            <View className="max-w-sm gap-3">
              <Text className="font-poppins-bold text-xl text-primary dark:text-darkPrimaryText">
                {t("onboarding.landing.brand")}
              </Text>
              <Text className="font-poppins text-sm text-textSecondary dark:text-darkTextSecondary">
                {t("onboarding.landing.footerBlurb")}
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-10">
              <View className="gap-2">
                <Text className="font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
                  {t("onboarding.landing.colProduct")}
                </Text>
                <TouchableOpacity onPress={goWelcome}>
                  <Text className="font-poppins text-sm text-textSecondary dark:text-darkTextSecondary">
                    {t("onboarding.landing.linkOverview")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={goWelcome}>
                  <Text className="font-poppins text-sm text-textSecondary dark:text-darkTextSecondary">
                    {t("onboarding.landing.linkSecurity")}
                  </Text>
                </TouchableOpacity>
              </View>
              <View className="gap-2">
                <Text className="font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
                  {t("onboarding.landing.colCompany")}
                </Text>
                <TouchableOpacity onPress={goWelcome}>
                  <Text className="font-poppins text-sm text-textSecondary dark:text-darkTextSecondary">
                    {t("onboarding.landing.linkAbout")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={goWelcome}>
                  <Text className="font-poppins text-sm text-textSecondary dark:text-darkTextSecondary">
                    {t("onboarding.landing.linkCareers")}
                  </Text>
                </TouchableOpacity>
              </View>
              <View className="gap-2">
                <Text className="font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
                  {t("onboarding.landing.colLegal")}
                </Text>
                <TouchableOpacity onPress={goWelcome}>
                  <Text className="font-poppins text-sm text-textSecondary dark:text-darkTextSecondary">
                    {t("onboarding.landing.linkPrivacy")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={goWelcome}>
                  <Text className="font-poppins text-sm text-textSecondary dark:text-darkTextSecondary">
                    {t("onboarding.landing.linkTerms")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </RNScrollView>
    </SafeAreaView>
  );
}
