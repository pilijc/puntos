import React, { useState } from "react";
import { ScrollView, Switch, TouchableOpacity, useColorScheme } from "react-native";
import { View, Text } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { usePathname, useRouter } from "expo-router";
import { getStoreById } from "@/services/store-service";

type Feature = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  enabled: boolean;
  badge: string | null;
};

const INITIAL_FEATURES: Feature[] = [
  {
    id: "streaks",
    title: "Streaks",
    description: "Reward daily consecutive visits.",
    icon: "local-fire-department",
    iconColor: "#F97316",
    iconBg: "rgba(249,115,22,0.10)",
    enabled: true,
    badge: "5 points/day • 7-day streak",
  },
  {
    id: "stamps",
    title: "Stamps",
    description: "Digital punch cards for purchases.",
    icon: "loyalty",
    iconColor: "#3B82F6",
    iconBg: "rgba(59,130,246,0.10)",
    enabled: true,
    badge: "Buy 9 get 1 free • Hot Drinks",
  },
  {
    id: "qr",
    title: "QR Purchase Rewards",
    description: "Scan at checkout to earn.",
    icon: "qr-code-2",
    iconColor: "#A855F7",
    iconBg: "rgba(168,85,247,0.10)",
    enabled: false,
    badge: null,
  },
];

const TABS = ["Overview", "Features & Settings", "Media"];

export default async function ViewStore() {
  const pathname = usePathname();
  const storeId = pathname.split("/").pop() as string;
  const store = await getStoreById(Number(storeId));
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  console.log("View Store", store);

  const [activeTab, setActiveTab] = useState(1);
  const [features, setFeatures] = useState<Feature[]>(INITIAL_FEATURES);

  const toggleFeature = (id: string) =>
    setFeatures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );



  return (
    <View className="flex-1 bg-background dark:bg-neutral-900">

      <View
        className="border-b border-neutral-200 dark:border-neutral-700 bg-background dark:bg-neutral-800"
        style={{ paddingTop: insets.top }}
      >
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity
            onPress={() => router.push("/(store_manager)/stores")}
            className="w-10 h-10 rounded-full items-center justify-center"
            activeOpacity={0.7}
          >
            <MaterialIcons name="chevron-left" size={24} color={isDark ? "#F1F5F9" : "#0F172A"} />
          </TouchableOpacity>

          <Text className="flex-1 text-center text-[17px] font-poppins-bold text-[#0F172A] dark:text-[#F1F5F9]">
            Store Details
          </Text>

          <TouchableOpacity
            className="w-10 h-10 items-end justify-center"
            activeOpacity={0.7}
          >
            <MaterialIcons name="more-vert" size={24} color={isDark ? "#F1F5F9" : "#0F172A"} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >

        <View className="items-center gap-y-3 py-7 px-6">
          <View className="w-24 h-24 rounded-[24px] bg-primary/10 border-2 border-primary/20 items-center justify-center">
            <MaterialIcons name="local-cafe" size={42} color="primary" />
          </View>

          <View className="items-center gap-y-1">
            <Text className="text-[22px] font-poppins-bold text-textPrimary dark:text-textPrimary">
              Main Street Coffee
            </Text>
            <Text className="text-[13px] font-poppins text-textMuted dark:text-textMuted">
              Merchant ID: 882931
            </Text>
          </View>
        </View>

        <View className="flex-row border-b border-neutral-200 dark:border-neutral-700 px-4 bg-background dark:bg-neutral-800">
          {TABS.map((tab, i) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(i)}
              className="flex-1 items-center gap-y-1.5 py-3"
              style={{
                borderBottomWidth: 2,
                borderBottomColor: activeTab === i ? "primary" : "transparent",
              }}
              activeOpacity={0.7}
            >
              <Text
                className={`text-xs font-poppins-bold ${
                  activeTab === i
                    ? "text-[#197FE6]"
                    : "text-slate-500 dark:text-slate-500"
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 1 && (
          <View className="px-4 pt-6 gap-y-3">

            <Text className="text-[11px] font-poppins-bold text-slate-500 dark:text-slate-500 tracking-widest uppercase px-1 mb-1">
              Active Loyalty Programs
            </Text>

            {features.map((feature) => (
              <View
                key={feature.id}
                className="rounded-2xl p-4 border border-[#E2E8F0] dark:border-[#1E2D3D] bg-white dark:bg-[#0F1928]/80"
                style={{
                  opacity: feature.enabled ? 1 : 0.55,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0 : 0.06,
                  shadowRadius: 8,
                  elevation: feature.enabled ? 2 : 0,
                }}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row gap-x-3 flex-1">
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center"
                      style={{ backgroundColor: feature.iconBg }}
                    >
                      <MaterialIcons name={feature.icon} size={24} color={feature.iconColor} />
                    </View>

                    <View className="flex-1 justify-center">
                      <Text className="text-[15px] font-poppins-bold text-[#0F172A] dark:text-[#F1F5F9]">
                        {feature.title}
                      </Text>
                      <Text className="text-[13px] font-poppins text-slate-500 dark:text-slate-500 mt-0.5">
                        {feature.description}
                      </Text>
                    </View>
                  </View>

                  <Switch
                    value={feature.enabled}
                    onValueChange={() => toggleFeature(feature.id)}
                    trackColor={{ false: isDark ? "#374151" : "#D1D5DB", true: "#197FE6" }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {feature.enabled && feature.badge && (
                  <View className="mt-3 pt-3 border-t border-[#F1F5F9] dark:border-[#1E2D3D] flex-row items-center justify-between">
                    <View className="flex-row items-center gap-x-1.5 bg-[#197FE6]/10 px-2.5 py-1 rounded-lg">
                      <MaterialIcons name="info-outline" size={13} color="#197FE6" />
                      <Text className="text-xs font-poppins-semibold text-[#197FE6]">
                        {feature.badge}
                      </Text>
                    </View>

                    <TouchableOpacity activeOpacity={0.7}>
                      <Text className="text-[13px] font-poppins-bold text-[#197FE6]">
                        Configure
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}

            <TouchableOpacity
              activeOpacity={0.85}
              className="bg-[#197FE6] rounded-[14px] py-4 items-center mt-2"
              style={{
                shadowColor: "#197FE6",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.30,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Text className="text-[15px] font-poppins-bold text-white">
                Save Changes
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab !== 1 && (
          <View className="pt-16 items-center gap-y-3">
            <MaterialIcons name="construction" size={40} color="#64748B" />
            <Text className="text-sm font-poppins text-slate-500 dark:text-slate-500">
              Coming soon
            </Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}
