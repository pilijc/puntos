import React, { useState, useEffect } from "react";
import { TextInput } from "react-native";
import { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { AnimatedView, Text, View, Image, TouchableOpacity } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { RefreshControl } from "react-native";
import { getUserTransactionHistory } from "@/services/qr-service";
import { supabase } from "@/supabase/supabase";
import { useTranslation } from "react-i18next";
import StoreScreenContainer from "@/components/ui/store-screen-container";

const TABS = ["all", "earned", "claimed"];

export default function History() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { t: translate, i18n } = useTranslation();

  const fetchTransactionHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const history = await getUserTransactionHistory(user.id);
      setTransactionHistory(history);
    } catch (error) {
      console.error("Error fetching transaction history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactionHistory(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactionHistory();
    setRefreshing(false);
  };

  const parsePoints = (value: string) => Number(value.replace(/[+\-]/g, ""));

  const filteredData = transactionHistory.filter((item) => {
    const matchesTab =
      activeTab === 0 ? true
        : activeTab === 1 ? item.type === "earned"
          : item.type === "claimed";
    return matchesTab && item.title.toLowerCase().includes(searchText.toLowerCase());
  });

  const sections = [...new Set(filteredData.map((item) => item.section))] as string[];

  const totalEarned = transactionHistory
    .filter((i) => i.type === "earned")
    .reduce((sum, i) => sum + parsePoints(i.points), 0);

  const totalSpent = transactionHistory
    .filter((i) => i.type === "claimed")
    .reduce((sum, i) => sum + parsePoints(i.points), 0);

  return (
    <StoreScreenContainer
      backgroundClassName="bg-backgroundMuted dark:bg-darkBackground"
      contentGap={16}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#FF6600"
          colors={["#FF6600"]}
        />
      }
    >
      {/* ── Header ── */}
      <AnimatedView entering={FadeInDown.duration(400)}>
        {!searchOpen ? (
          <View className="flex-row justify-between items-center ml-1 mt-7.5">
            <Text className="text-xl font-poppins-bold text-neutral-900 dark:text-darkTextPrimary">
              {translate("user.activity.title")}
            </Text>
            <TouchableOpacity
              onPress={() => setSearchOpen(true)}
              className="w-10 h-10 rounded-xl bg-white dark:bg-darkBackgroundCard items-center justify-center border border-neutral-100 dark:border-darkBorder"
            >
              <MaterialIcons name="search" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-1 flex-row items-center bg-white dark:bg-darkBackgroundCard rounded-2xl px-4 py-1 border border-neutral-100 dark:border-darkBorder mt-7.5">
            <MaterialIcons name="search" size={20} color="#9CA3AF" />
            <TextInput
              autoFocus
              placeholder={translate("user.activity.searchPlaceholder")}
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-3 font-poppins text-sm text-neutral-900 dark:text-white pt-0 pb-0"
              style={{ textAlignVertical: "center" }}
              value={searchText}
              onChangeText={setSearchText}
            />
            <TouchableOpacity onPress={() => { setSearchOpen(false); setSearchText(""); }}>
              <MaterialIcons name="close" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        )}
      </AnimatedView>

      {/* ── Summary Card ── */}
      <AnimatedView entering={FadeInDown.delay(60).duration(400)}>
        <View className="bg-white dark:bg-darkBackgroundCard rounded-2xl border border-neutral-100 dark:border-darkBorder overflow-hidden">
          {/* Top gradient accent strip */}
          <View className="h-1 bg-primary" />
          <View className="flex-row p-4">
            {/* Earned */}
            <View className="flex-1 items-center py-2">
              <View className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-500/10 items-center justify-center mb-2">
                <MaterialIcons name="trending-up" size={18} color="#10b981" />
              </View>
              <Text className="text-xl font-poppins-bold text-emerald-500">
                +{totalEarned.toLocaleString()}
              </Text>
              <Text className="text-[10px] font-poppins-medium text-neutral-400 dark:text-darkTextSecondary tracking-wide mt-0.5">
                {translate("user.activity.filter.earned").toUpperCase()}
              </Text>
            </View>

            {/* Divider */}
            <View className="w-[1px] bg-neutral-100 dark:bg-darkBorder my-2" />

            {/* Spent */}
            <View className="flex-1 items-center py-2">
              <View className="w-9 h-9 rounded-full bg-orange-50 dark:bg-primary/10 items-center justify-center mb-2">
                <MaterialIcons name="redeem" size={18} color="#FF6600" />
              </View>
              <Text className="text-xl font-poppins-bold text-primary">
                {totalSpent.toLocaleString()}
              </Text>
              <Text className="text-[10px] font-poppins-medium text-neutral-400 dark:text-darkTextSecondary tracking-wide mt-0.5">
                {translate("user.activity.filter.claimed").toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </AnimatedView>

      {/* ── Filter Chips ── */}
      <AnimatedView entering={FadeInDown.delay(100).duration(400)}>
        <View className="flex-row gap-x-2">
          {TABS.map((tab, i) => {
            const isActive = activeTab === i;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(i)}
                className={`px-3.5 py-1.5 rounded-full border ${isActive
                    ? "bg-primary border-primary"
                    : "bg-white dark:bg-darkBackgroundCard border-neutral-200 dark:border-darkBorder"
                  }`}
              >
                <Text
                  className={`text-xs font-poppins-semibold ${isActive ? "text-white" : "text-neutral-500 dark:text-darkTextSecondary"
                    }`}
                >
                  {translate(`user.activity.filter.${tab}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </AnimatedView>

      {/* ── Transaction List ── */}
      {loading ? (
        <HistorySkeleton />
      ) : sections.length === 0 ? (
        <AnimatedView entering={FadeIn.duration(400)} className="items-center justify-center py-20">
          <View className="w-24 h-24 rounded-full bg-neutral-100 dark:bg-white/5 items-center justify-center mb-6">
            <MaterialIcons name="receipt-long" size={44} color="#CBD5E1" />
          </View>
          <Text className="text-xl font-poppins-bold text-neutral-900 dark:text-white text-center">
            {translate("user.activity.empty")}
          </Text>
          <Text className="text-sm font-poppins text-neutral-400 text-center mt-2 px-10">
            {translate("user.activity.loading")}
          </Text>
        </AnimatedView>
      ) : (
        sections.map((section, sIdx) => {
          const items = filteredData.filter((item) => item.section === section);
          return (
            <AnimatedView key={section} entering={FadeInUp.delay(sIdx * 60).duration(400)}>
              {/* Floating uppercase section label */}
              <SectionLabel label={section} />

              {/* Grouped card with dividers — mirrors Settings cards */}
              <View className="bg-white dark:bg-darkBackgroundCard rounded-2xl border border-neutral-100 dark:border-darkBorder overflow-hidden">
                {items.map((item, idx) => (
                  <View key={item.id}>
                    <HistoryRow {...item} />
                    {idx < items.length - 1 && (
                      <View className="h-[1px] bg-neutral-100 dark:bg-darkBorder ml-[68px]" />
                    )}
                  </View>
                ))}
              </View>
            </AnimatedView>
          );
        })
      )}

      {/* Footer */}
      <View className="items-center pt-2">
        <Text className="text-[10px] tracking-[2px] text-neutral-300 font-poppins-medium">
          {translate("label.poweredBy")}
        </Text>
      </View>
    </StoreScreenContainer>
  );
}

/* ── Skeleton ── */
function HistorySkeleton() {
  return (
    <View className="gap-y-5">
      {/* Summary card skeleton */}
      <View className="bg-white dark:bg-darkBackgroundCard rounded-2xl border border-neutral-100 dark:border-darkBorder overflow-hidden">
        <View className="h-1 bg-neutral-100 dark:bg-white/10" />
        <View className="flex-row p-4">
          {[0, 1].map((i) => (
            <View key={i} className="flex-1 items-center gap-y-2 py-2">
              <View className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-white/10" />
              <View className="h-5 w-16 rounded-full bg-neutral-100 dark:bg-white/10" />
              <View className="h-2.5 w-12 rounded-full bg-neutral-50 dark:bg-white/5" />
            </View>
          ))}
        </View>
      </View>

      {/* Transaction groups */}
      {[2, 3].map((count, g) => (
        <View key={g}>
          <View className="h-3 w-20 rounded-full bg-neutral-200 dark:bg-white/10 mb-2 ml-1" />
          <View className="bg-white dark:bg-darkBackgroundCard rounded-2xl border border-neutral-100 dark:border-darkBorder overflow-hidden">
            {[...Array(count)].map((_, i) => (
              <View key={i}>
                <View className="flex-row items-center gap-x-3 px-4 py-3.5">
                  <View className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-white/10" />
                  <View className="flex-1 gap-y-2">
                    <View className="h-3.5 w-2/3 rounded-full bg-neutral-100 dark:bg-white/10" />
                    <View className="h-2.5 w-1/3 rounded-full bg-neutral-50 dark:bg-white/5" />
                  </View>
                  <View className="h-5 w-14 rounded-full bg-neutral-100 dark:bg-white/10" />
                </View>
                {i < count - 1 && <View className="h-[1px] bg-neutral-100 dark:bg-darkBorder ml-[68px]" />}
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

/* ── Section Label ── */
function SectionLabel({ label }: { label: string }) {
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

/* ── History Row ── */
function HistoryRow({ title, subtitle, time, points, positive, image, icon }: any) {
  const { t: translate, i18n } = useTranslation();
  const isPositive = positive ?? points?.startsWith("+");

  const timeStr = time
    ? new Date(time).toLocaleTimeString(
      i18n.language === "ja" ? "ja-JP" : "en-US",
      { hour: "numeric", minute: "2-digit", hour12: true }
    )
    : null;

  return (
    <View className="flex-row items-center px-4 py-3.5">
      {/* Circular icon well */}
      <View
        className={`w-10 h-10 rounded-full items-center justify-center flex-shrink-0 ${isPositive ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-orange-50 dark:bg-primary/10"
          }`}
      >
        {icon ? (
          <Text className={`text-base ${isPositive ? "text-emerald-500" : "text-primary"}`}>
            {icon}
          </Text>
        ) : image ? (
          <Image source={{ uri: image }} className="w-10 h-10 rounded-full" />
        ) : (
          <MaterialIcons
            name={isPositive ? "add-circle-outline" : "redeem"}
            size={18}
            color={isPositive ? "#10b981" : "#FF6600"}
          />
        )}
      </View>

      {/* Text */}
      <View className="flex-1 ml-3">
        <Text
          numberOfLines={1}
          className="text-sm font-poppins-semibold text-neutral-800 dark:text-darkTextPrimary"
        >
          {translate(title)}
        </Text>
        <Text className="text-xs font-poppins text-neutral-400 dark:text-darkTextSecondary mt-0.5">
          {translate(subtitle)}{timeStr ? ` • ${timeStr}` : ""}
        </Text>
      </View>

      {/* Points pill */}
      <View
        className={`px-2.5 py-1 rounded-full ml-3 ${isPositive ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-orange-50 dark:bg-primary/10"
          }`}
      >
        <Text
          className={`text-sm font-poppins-bold ${isPositive ? "text-emerald-500" : "text-primary"
            }`}
        >
          {points}
        </Text>
      </View>
    </View>
  );
}