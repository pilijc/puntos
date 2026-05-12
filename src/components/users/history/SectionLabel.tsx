import React from "react";
import { Text } from "@/tw";
import { useTranslation } from "react-i18next";

interface SectionLabelProps {
  label: string;
}

export default function SectionLabel({ label }: SectionLabelProps) {
  const { t: translate, i18n } = useTranslation();
  let display = label;
  
  if (label === "today") display = translate("user.activity.sections.today");
  else if (label === "yesterday") display = translate("user.activity.sections.yesterday");
  else {
    const d = new Date(label);
    if (!isNaN(d.getTime())) {
      display = d.toLocaleDateString(
        i18n.language === "ja" ? "ja-JP" : "en-US",
        { month: "long", day: "numeric" }
      );
    } else {
      display = label;
    }
  }
  
  return (
    <Text className="pl-2 text-sm font-poppins text-textSecondary dark:text-darkTextSecondary ml-4 mb-1">
      {display}
    </Text>
  );
}
