import React, { useState } from "react";
import { ScrollView, type LayoutChangeEvent } from "react-native";
import { useTranslation } from "react-i18next";
import { View, Text, TouchableOpacity } from "@/tw";
import { Modal, type ModalButton } from "@/components/modal";

type Props = {
  onSectionLayout: (e: LayoutChangeEvent) => void;
  onLinkPress: () => void;
};

export function LandingFooterSection({ onSectionLayout, onLinkPress }: Props) {
  const { t } = useTranslation();
  const [modal, setModal] = useState<{
    title: string;
    content: React.ReactNode;
    buttons?: ModalButton[];
  } | null>(null);

  const handleLinkPress = (title: string) => {
    let contentNode: React.ReactNode = (
      <Text className="text-sm leading-6 font-poppins text-slate-500 dark:text-slate-400">
        {t("onboarding.landing.documentUpdating")}
      </Text>
    );
    
    if (title === t("onboarding.landing.linkPrivacy")) {
      contentNode = (
        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
          <Text className="text-sm leading-6 font-poppins text-textSecondary dark:text-darkTextSecondary">
            {t("onboarding.landing.privacyPolicyText")}
          </Text>
        </ScrollView>
      );
    } else if (title === t("onboarding.landing.linkTerms")) {
      contentNode = (
        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
          <Text className="text-sm leading-6 font-poppins text-textSecondary dark:text-darkTextSecondary">
            {t("onboarding.landing.termsConditionsText")}
          </Text>
        </ScrollView>
      );
    }
    setModal({
      title: title,
      content: contentNode,
    });
  };

  return (
    <>
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
                {t("onboarding.landing.colLegal")}
              </Text>
              <TouchableOpacity onPress={() => handleLinkPress(t("onboarding.landing.linkPrivacy"))}>
                <Text className="font-poppins text-sm text-textSecondary dark:text-darkTextSecondary">
                  {t("onboarding.landing.linkPrivacy")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleLinkPress(t("onboarding.landing.linkTerms"))}>
                <Text className="font-poppins text-sm text-textSecondary dark:text-darkTextSecondary">
                  {t("onboarding.landing.linkTerms")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        buttons={modal?.buttons}
        width={600}
      >
        {modal?.content}
      </Modal>
    </>
  );
}
