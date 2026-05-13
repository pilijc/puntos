import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Redirect, router } from "expo-router";
import {  Platform, ScrollView as RNScrollView, useWindowDimensions, type LayoutChangeEvent } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "@/tw";
import {  getSubscriptionPlans,  pickBasicAndProPlans, } from "@/services/store-manager/subscription-service";
import {
  createSectionLayoutHandlers,
  LandingCtaSection,
  LandingFeaturesSection,
  LandingFooterSection,
  LandingHeroBandSection,
  LandingHowSection,
  LandingPricingSection,
  type LandingSection,
} from "./landing-sections";

const WELCOME_ROUTE = "/(onboarding)/welcome";
const LOGIN_ROUTE = "/login";

export default function MarketingLanding() {
  const { t: translate } = useTranslation();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const isWeb = Platform.OS === "web";
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
              : translate("onboarding.landing.pricingLoadError"),
          );
        }
      } finally {
        if (!cancelled) setPlansLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isWeb, translate]);

  const sectionLayoutHandlers = useMemo(
    () => createSectionLayoutHandlers(sectionY),
    [sectionY],
  );

  const scrollNavTo = useCallback((key: LandingSection) => {
    const y = sectionY.current[key];
    scrollRef.current?.scrollTo({ y: Math.max(0, y), animated: true });
  }, []);

  const goWelcome = useCallback(() => {
    void router.replace(WELCOME_ROUTE);
  }, []);

  const goLogin = useCallback(() => {
    void router.replace(LOGIN_ROUTE);
  }, []);

  const onHeroBandLayout = useCallback((e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setHeroBandSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
  }, []);

  if (!isWeb) {
    return <Redirect href={WELCOME_ROUTE} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-darkBackground">
      <RNScrollView
        ref={scrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <LandingHeroBandSection
          isWide={isWide}
          heroBandSize={heroBandSize}
          onHeroBandLayout={onHeroBandLayout}
          onHeroSectionLayout={sectionLayoutHandlers.hero}
          scrollNavTo={scrollNavTo}
          goLogin={goLogin}
          goWelcome={goWelcome}
        />

        <LandingFeaturesSection
          onSectionLayout={sectionLayoutHandlers.features}
        />

        <LandingHowSection onSectionLayout={sectionLayoutHandlers.how} />

        <LandingPricingSection
          onSectionLayout={sectionLayoutHandlers.pricing}
          plansLoading={plansLoading}
          plansError={plansError}
          basicPlan={basicPlan}
          proPlan={proPlan}
        />

        <LandingCtaSection onSectionLayout={sectionLayoutHandlers.cta} />

        <LandingFooterSection
          onSectionLayout={sectionLayoutHandlers.footer}
          onLinkPress={goWelcome}
        />
      </RNScrollView>
    </SafeAreaView>
  );
}
