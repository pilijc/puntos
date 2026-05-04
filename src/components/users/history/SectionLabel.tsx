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
    display = d.toLocaleDateString(
      i18n.language === "ja" ? "ja-JP" : "en-US",
      { month: "long", day: "numeric" }
    );
  }
  
  return (
    <Text className="text-xs font-poppins-semibold text-neutral-400 dark:text-darkTextSecondary tracking-widest uppercase ml-1 mb-2">
      {display}
    </Text>
  );
}
