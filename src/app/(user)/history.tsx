import React, { useState, useEffect, useRef } from "react";
import { Animated, TextInput, useColorScheme } from "react-native";
import { FadeInDown, FadeInUp } from "react-native-reanimated";
import {
  AnimatedView,
  SafeAreaView,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
} from "@/tw";
import { getUserTransactionHistory } from "@/services/qr-service";
import { supabase } from "@/supabase/supabase";
import { useTranslation } from "react-i18next";

const TABS = ["all", "earned", "claimed"];

export default function History() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { t: translate, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    const fetchTransactionHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const history = await getUserTransactionHistory(user.id);
        setTransactionHistory(history);
      } catch (error) {
        console.error('Error fetching transaction history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionHistory();
  }, []);

  const filteredData = transactionHistory.filter((item) => {
    const matchesTab =
      activeTab === 0
        ? true
        : activeTab === 1
          ? item.type === "earned"
          : item.type === "claimed";
    const matchesSearch = item.title.toLowerCase().includes(searchText.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const sections = [...new Set(filteredData.map((item) => item.section))];

  const parsePoints = (value) => Number(value.replace(/[+\-]/g, ''));

  const totalEarnedPoints = transactionHistory.filter((item) => item.type === "earned").reduce(
    (sum, item) => sum + parsePoints(item.points),
    0
  );

  const formattedTotal =
    totalEarnedPoints > 0
      ? `+${totalEarnedPoints.toLocaleString()}`
      : totalEarnedPoints.toLocaleString();

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-darkBackground">
      <AnimatedView entering={FadeInDown.duration(500)}>
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row justify-between items-center mb-5">
            {!searchOpen ? (
              <>
                <View>
                  <Text className="text-neutral-900 dark:text-darkTextPrimary text-2xl font-poppins-bold">
                    {translate("activity.title")}
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <View className="bg-orange-50 dark:bg-darkPrimarySecondary/20 px-4 py-2 rounded-xl items-center">
                    <Text className="text-orange-600 dark:text-darkPrimaryText text-xl font-poppins-bold leading-tight">
                      {formattedTotal}
                    </Text>
                    <Text className="text-orange-400 dark:text-darkPrimarySecondary text-[7px] font-poppins-medium tracking-wide">
                      {translate("activity.unclaimed")}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSearchOpen(true)}
                    className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-darkBackgroundMuted items-center justify-center"
                  >
                    <Text className="text-4xl font-bold text-neutral-500 dark:text-darkTextSoft">⌕</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View className="flex-row items-center bg-neutral-100 dark:bg-darkBackgroundMuted rounded-xl px-1 py-1 w-full">
                <View className="flex-1 mx-1">
                  <TextInput
                    autoFocus
                    placeholder={translate("activity.searchPlaceholder")}
                    placeholderTextColor={isDark ? "#9CA3AF" : "#999"}
                    style={{ color: isDark ? "#FFFFFF" : "#000000" }}
                    className="text-base px-3 py-2"
                    value={searchText}
                    onChangeText={setSearchText}
                  />
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setSearchOpen(false);
                    setSearchText("");
                  }}
                  className="px-3 justify-center items-center"
                >
                  <Text
                    style={{ color: isDark ? "#FFFFFF" : "#FF6600" }}
                    className="font-bold text-base"
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>


          {/* Tabs */}
          <View className="flex-row bg-neutral-200/70 dark:bg-darkBackgroundMuted/70 p-1 rounded-xl">
            {TABS.map((tab, i) => {
              const isActive = activeTab === i;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(i)}
                  className={`flex-1 py-3 rounded-lg items-center ${isActive ? "bg-orange-500" : ""}`}
                >
                  <Text className={`text-sm font-poppins-semibold ${isActive ? "text-white" : "text-neutral-500 dark:text-darkTextPrimary"}`}>
                    {translate(`activity.filter.${tab}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </AnimatedView>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-neutral-500 dark:text-darkTextSoft">{translate("activity.loading")}</Text>
          </View>
        ) : sections.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-neutral-500 dark:text-darkTextSoft">{translate("activity.empty")}</Text>
          </View>
        ) : (
          sections.map((section) => (
            <AnimatedView key={section} entering={FadeInUp.duration(500)}>
              <SectionLabel label={section} />
              <View className="mt-1">
                {filteredData
                  .filter((item) => item.section === section)
                  .map((item) => (
                    <HistoryItem key={item.id} {...item} />
                  ))}
              </View>
            </AnimatedView>
          ))
        )}

        <AnimatedView entering={FadeInUp.delay(200).duration(600)}>
          <View className="items-center pt-6 pb-4">
            <Text className="text-[10px] tracking-[2px] text-neutral-300 font-poppins-medium">
              {translate("activity.footer")}
            </Text>
          </View>
        </AnimatedView>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ label }) {
  const { t: translate, i18n } = useTranslation();

  let displayLabel = label;
  if (label === 'today') {
    displayLabel = translate('activity.sections.today');
  } else if (label === 'yesterday') {
    displayLabel = translate('activity.sections.yesterday');
  } else {
    // Format the date string
    const date = new Date(label);
    displayLabel = date.toLocaleDateString(i18n.language === 'ja' ? 'ja-JP' : 'en-US', { month: 'long', day: 'numeric' });
  }

  return (
    <View className="mt-6 mb-3">
      <Text className="text-xs font-poppins-semibold text-neutral-400 tracking-widest">
        {displayLabel.toUpperCase()}
      </Text>
    </View>
  );
}

function HistoryItem({ title, subtitle, time, points, positive, image, icon }) {
  const { t: translate, i18n } = useTranslation();
  const isPositive = positive ?? points?.startsWith("+");
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <TouchableOpacity activeOpacity={1} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={{ transform: [{ scale: scaleAnim }] }}
        className="bg-white dark:bg-darkBackgroundMuted rounded-2xl p-4 mb-3 border border-neutral-100 dark:border-darkBorder"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 my-3 rounded-xl bg-background dark:bg-darkBackgroundCard items-center justify-center mr-3">
              {icon && <Text className="text-xl text-orange-500 dark:text-darkPrimaryText">{icon}</Text>}
              {image && <Image source={{ uri: image }} className="w-12 h-12" />}
            </View>

            <View className="flex-1">
              <Text numberOfLines={1} className="text-base font-poppins-semibold text-neutral-900 dark:text-darkTextPrimary">
                {translate(title)}
              </Text>
              <Text className="text-xs font-poppins-regular text-neutral-400">
                {translate(subtitle)} {time ? `• ${new Date(time).toLocaleTimeString(i18n.language === 'ja' ? 'ja-JP' : 'en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}` : ""}
              </Text>
            </View>
          </View>

          <View className={`px-3 py-1 rounded-full ${isPositive ? "bg-emerald-50" : "bg-red-50"}`}>
            <Text className={`text-sm font-poppins-bold ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
              {points}
            </Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}