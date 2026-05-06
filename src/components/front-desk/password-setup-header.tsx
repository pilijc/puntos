import React from "react";
import { View, Text } from "@/tw";
import { useTranslation } from "react-i18next";

interface PasswordSetupHeaderProps {
  isInitialSetup: boolean;
}

export default function PasswordSetupHeader({ isInitialSetup }: PasswordSetupHeaderProps) {
  const { t: translate } = useTranslation();
  return (
    <View className="mb-8">
      <Text className="text-2xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">
        {isInitialSetup ? translate("frontdesk.transaction.passwordSetup.title") : translate("frontdesk.password.updateButton")}
      </Text>
      <Text className="text-sm font-poppins text-neutral-500 dark:text-darkTextSecondary mt-2">
        {isInitialSetup 
          ? translate("frontdesk.password.header.createSecure")
          : translate("frontdesk.password.header.enterCurrent")}
      </Text>
    </View>
  );
}
