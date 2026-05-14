import React from "react";
import type { LayoutChangeEvent } from "react-native";
import { useTranslation } from "react-i18next";
import { View, Text, TouchableOpacity } from "@/tw";

type Props = {
  onSectionLayout: (e: LayoutChangeEvent) => void;
  onLinkPress: () => void;
};

export function LandingFooterSection({ onSectionLayout, onLinkPress }: Props) {
  const { t } = useTranslation();

  return (
    <View
      onLayout={onSectionLayout}
      className="border-t border-border px-4 py-12 dark:border-darkBorder md:px-10"
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
            <TouchableOpacity onPress={onLinkPress}>
              <Text className="font-poppins text-sm text-textSecondary dark:text-darkTextSecondary">
                {t("onboarding.landing.linkOverview")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onLinkPress}>
              <Text className="font-poppins text-sm text-textSecondary dark:text-darkTextSecondary">
                {t("onboarding.landing.linkSecurity")}
              </Text>
            </TouchableOpacity>
          </View>
          <View className="gap-2">
            <Text className="font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
              {t("onboarding.landing.colCompany")}
            </Text>
            <TouchableOpacity onPress={onLinkPress}>
              <Text className="font-poppins text-sm text-textSecondary dark:text-darkTextSecondary">
                {t("onboarding.landing.linkAbout")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onLinkPress}>
              <Text className="font-poppins text-sm text-textSecondary dark:text-darkTextSecondary">
                {t("onboarding.landing.linkCareers")}
              </Text>
            </TouchableOpacity>
          </View>
          <View className="gap-2">
            <Text className="font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
              {t("onboarding.landing.colLegal")}
            </Text>
            <TouchableOpacity onPress={onLinkPress}>
              <Text className="font-poppins text-sm text-textSecondary dark:text-darkTextSecondary">
                {t("onboarding.landing.linkPrivacy")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onLinkPress}>
              <Text className="font-poppins text-sm text-textSecondary dark:text-darkTextSecondary">
                {t("onboarding.landing.linkTerms")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
