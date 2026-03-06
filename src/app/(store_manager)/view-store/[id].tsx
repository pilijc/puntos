import React, { useEffect, useState } from "react";
import { Switch, useColorScheme } from "react-native";
import { View, Text, TouchableOpacity, ScrollView, Image } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getStoreById } from "@/services/store-service";

// Manual base for features
const MANUAL_FEATURES = [
  {
    id: "streaks",
    title: "Streaks",
    description: "Reward daily consecutive visits.",
    icon: "local-fire-department" as const,
    iconColor: "#F97316",
    iconBg: "rgba(249,115,22,0.10)",
    enabled: true,
    badge: "5 points/day • 7-day streak"
  },
  {
    id: "stamps",
    title: "Stamps",
    description: "Digital punch cards for purchases.",
    icon: "loyalty" as const,
    iconColor: "#3B82F6",
    iconBg: "rgba(59,130,246,0.10)",
    enabled: true,
    badge: "Buy 9 get 1 free • Hot Drinks"
  },
  {
    id: "purchased",
    title: "QR Purchase Rewards",
    description: "Scan at checkout to earn.",
    icon: "qr-code-2" as const,
    iconColor: "#A855F7",
    iconBg: "rgba(168,85,247,0.10)",
    enabled: false,
    badge: null
  }
];

const TABS = ["Overview", "Features", "Media"];

export default function ViewStore() {
  const { id } = useLocalSearchParams();
  const storeId = Number(id);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [store, setStore] = useState<Awaited<ReturnType<typeof getStoreById>> | null>(null);
  const [activeTab, setActiveTab] = useState(1);
  const [features, setFeatures] = useState(MANUAL_FEATURES);

  const navigateToConfig = (featureId: string) => {
    if (featureId === "streaks") {
      router.push({ pathname: "/(store_manager)/configure-streaks", params: { storeId } });
    }
    // You can add conditions for other features here.
  };

  const handleToggle = (featureId: string, currentEnabled: boolean) => {
    const nextEnabled = !currentEnabled;
    setFeatures((prev) =>
      prev.map((f) => (f.id === featureId ? { ...f, enabled: nextEnabled } : f))
    );
    if (nextEnabled) {
      navigateToConfig(featureId);
    }
  };

  useEffect(() => {
    (async () => {
      const store = await getStoreById(storeId);
      setStore(store);
    })();
  }, [storeId]);

  return (
    <View className="flex-1 bg-backgroundMuted dark:bg-neutral-900">
      <View
        className="border-b border-neutral-100 dark:border-neutral-700 bg-background dark:bg-neutral-800"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
      >
        <View className="flex-row items-center px-2">
          <TouchableOpacity
            onPress={() => router.push("/(store_manager)/stores")}
            className="w-10 h-10 rounded-full items-center justify-center"
            activeOpacity={0.7}
          >
            <MaterialIcons name="chevron-left" size={22} color={isDark ? "#F1F5F9" : "#0F172A"} />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-[17px] font-poppins-bold text-[#0F172A] dark:text-[#F1F5F9] pr-10">
            Store Details
          </Text>
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center"
            activeOpacity={0.7}
          >
            <MaterialIcons name="more-vert" size={24} color={isDark ? "#F1F5F9" : "#0F172A"} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 gap-y-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >

        <View className="items-center gap-y-1">
          <View className="w-full h-30 items-center justify-center overflow-hidden">
            {store?.logo ? (
              <Image
                source={{ uri: store.logo }}
                className="w-full h-full"
                contentFit="cover"
              />
            ) : (
              <Image
                source={require("@/assets/images/puntos-icon.png")}
                className="w-full h-full object-cover"
              />
            )}
          </View>

          <View className="items-center w-full space-y-2 py-2 bg-white">
            <Text className="text-2xl font-poppins-bold text-textbg-Primary dark:text-textbg-Primary">
              {store?.name}
            </Text>
            {store?.address && (
              <Text className="text-sm font-poppins text-textMuted dark:text-textMuted">
                {store?.address}
              </Text>
            )}
          </View>
        </View>

        <View className="flex-row dark:border-neutral-700 px-4 pt-2 bg-white dark:bg-neutral-800">
          {TABS.map((tab, i) => {
            const selected = activeTab === i;
            return (
              <View key={tab} className="flex-1 items-center justify-center">
                <TouchableOpacity
                  onPress={() => setActiveTab(i)}
                  className="w-full items-center justify-center"
                  activeOpacity={0.7}
                >
                  <View
                    className={`items-center pb-2 border-b-2 w-full ${
                      selected ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <Text
                      className={`text-sm font-poppins-semibold text-center ${
                        selected
                          ? "text-primary"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {tab}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {activeTab === 1 && (
          <View className="px-4 elevation-0.5 mt-4">
            {features.map((feature) => (
              <View
                key={feature.id}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden mb-3"
              >
                <View className="p-4 flex-row items-start justify-between">
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
                    onValueChange={() => handleToggle(feature.id, feature.enabled)}
                    trackColor={{ false: "#E2E8F0", true: "#FF6600" }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                {feature.enabled && feature.badge && (
                  <View className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex-row items-center justify-between bg-slate-50 dark:bg-slate-800/30">
                    <View
                      className="flex-row items-center gap-x-1.5 px-2.5 py-1 rounded-lg"
                      style={{
                        backgroundColor: isDark ? "textPrimary" : "#197FE61A"
                      }}
                    >
                      <MaterialIcons
                        name="info-outline"
                        size={13}
                        color={isDark ? "textPrimary" : "#197FE6"}
                      />
                      <Text
                        className="text-xs font-poppins-semibold"
                        style={{ color: isDark ? "textPrimary" : "#197FE6" }}
                      >
                        {feature.badge}
                      </Text>
                    </View>
                    <TouchableOpacity
                      className="flex-row items-center gap-x-1"
                      activeOpacity={0.7}
                      onPress={() => navigateToConfig(feature.id)}
                    >
                      <Text className="text-sm font-poppins-semibold text-primary">
                        Configure
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}

            <TouchableOpacity
              className="rounded-xl items-center mt-2 px-6 py-4 bg-primary"
            >
              <Text className="text-sm font-poppins-bold text-white">
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
