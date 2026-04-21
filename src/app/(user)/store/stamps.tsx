import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, Image, TouchableOpacity } from "@/tw";
import {
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useStamps } from "@/hooks/use-stamps";
import { getActiveStampProgramRewards, getStampEventsForStore, getUserStampEvents, getUserRewardRedemptions } from "@/services/stamp-service";
import { getStoreById } from "@/services/store-service";
import { storeLogos } from "@/data/rewards";
import { supabase } from "@/supabase/supabase";
import {
  ChevronLeft,
  Stamp,
  Store,
  Gem,
  Gift,
  PackageOpen,
  History,
  Clock,
  AlertCircle,
  TicketPercent
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StampDetailSkeleton } from "@/components/skeleton/user/stamp-detail-skeleton";

// ─── Single Punch Card ────────────────────────────────────────────────────────
function StampCard({
  stamp,
  rewardTitle,
}: {
  stamp: any;
  rewardTitle?: string | null;
}) {
  const { t: translate } = useTranslation();
  const storeStr = stamp.stores as {
    name?: string;
    logo?: string;
    address?: string;
    is_active?: boolean;
    status?: string;
  } | undefined;

  const storeName = storeStr?.name ?? translate("user.rewards.store");
  const storeAddress = storeStr?.address ?? "";
  const count = stamp.stamps_count ?? 0;
  const target = stamp.target ?? 7;
  const clampedCount = Math.min(Math.max(count, 0), target);

  const isCompleted = clampedCount >= target || stamp.card_status === 'completed';

  const getLogoImage = () => {
    if (storeStr?.logo) return { uri: storeStr.logo };
    if (storeLogos[stamp.store_id?.toString()]) return storeLogos[stamp.store_id.toString()];
    // return require("../../../assets/images/rewards/coffee-shop.png");
  };

  // ─── 5x2 (10-stamp) Pagination Logic ───
  const pageCapacity = 10;

  // If the user has completed the target, show the final page (e.g. target 30 -> page 2)
  // Otherwise show their current active page.
  const activePage = clampedCount >= target
    ? Math.max(0, Math.ceil(target / pageCapacity) - 1)
    : Math.floor(clampedCount / pageCapacity);

  const startNum = activePage * pageCapacity + 1;
  const endNum = Math.min((activePage + 1) * pageCapacity, target);

  const displayDays = [];
  for (let i = startNum; i <= endNum; i++) {
    displayDays.push({
      number: i,
      state: i <= clampedCount ? "completed" : i === clampedCount + 1 ? "current" : "upcoming"
    });
  }

  // Expiration logic
  let deadlineStr = null;
  let deadlineUrgent = false;

  if (stamp.card_expires_at && !isCompleted && stamp.card_status !== 'expired') {
    const expiresAt = new Date(stamp.card_expires_at);
    expiresAt.setHours(23, 59, 59, 999);
    const msLeft = expiresAt.getTime() - Date.now();
    const daysUntilEnd = Math.ceil(msLeft / 86400000);

    if (daysUntilEnd <= 0) {
      deadlineStr = translate("user.activity.stampLog.expired");
      deadlineUrgent = true;
    } else if (daysUntilEnd === 1) {
      deadlineStr = translate("user.activity.stampLog.expiresToday");
      deadlineUrgent = true;
    } else if (daysUntilEnd <= 7) {
      deadlineStr = translate("user.activity.stampLog.expiresInDays", { count: daysUntilEnd });
      deadlineUrgent = true;
    } else {
      deadlineStr = translate("user.activity.stampLog.validUntil", { date: expiresAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) });
      deadlineUrgent = false;
    }
  } else if (stamp.card_status === 'expired') {
    deadlineStr = translate("user.activity.stampLog.programExpired");
    deadlineUrgent = true;
  }

  return (
    <View
      className={`border bg-white dark:bg-darkBackgroundCard rounded-3xl overflow-hidden shadow-sm shadow-neutral-100 dark:shadow-none border-neutral-100 dark:border-darkBorder`}
    >
      {/* ─── Header Top ─── */}
      <View className="px-4 py-4 flex-row items-center gap-x-3">
        <View className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-darkBackgroundMuted items-center justify-center overflow-hidden border border-neutral-100 dark:border-darkBorder">
          {storeStr?.logo || storeLogos[stamp.store_id?.toString()] ? (
            <Image source={getLogoImage()} className="w-full h-full" contentFit="cover" />
          ) : (
            <Store size={18} color="#9ca3af" />
          )}
        </View>
        <View className="flex-1">
          <Text className="font-poppins-bold text-neutral-900 dark:text-white text-base" numberOfLines={1}>
            {storeName}
          </Text>
          <Text className="text-[11px] font-poppins text-neutral-500 line-clamp-1" numberOfLines={1}>
            {storeAddress || translate("user.activity.stampLog.rewardProgram")}
          </Text>
        </View>
        <View className="items-end justify-center pr-1">
          <Text className={`font-poppins-bold text-lg leading-6 ${isCompleted ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-800 dark:text-neutral-200'}`}>
            {clampedCount}
            <Text className="font-poppins-medium text-neutral-400 text-[11px]"> / {target}</Text>
          </Text>
        </View>
      </View>

      {/* ─── Perforated separator (Ticket Effect) ─── */}
      <View className="relative h-4 flex-row items-center overflow-hidden">
        <View className="absolute -left-2 w-4 h-4 bg-neutral-50 dark:bg-darkBackground rounded-full border border-neutral-200 dark:border-darkBorder" />
        <View className="flex-1 border-t border-dashed border-neutral-200 dark:border-darkBorder mx-4" />
        <View className="absolute -right-2 w-4 h-4 bg-neutral-50 dark:bg-darkBackground rounded-full border border-neutral-200 dark:border-darkBorder" />
      </View>

      {/* ─── Punch Grid ─── */}
      <View className="px-4 py-8 gap-y-7">
        {(() => {
          const totalInPage = displayDays.length;
          const numTop = Math.ceil(totalInPage / 2);
          const topRow = displayDays.slice(0, numTop);
          const bottomRow = displayDays.slice(numTop);

          // Dynamically adjust size to fill space. 
          // 4-per-row can be larger (w-20) than 5-per-row (w-16)
          const stampSizeClass = numTop <= 4 ? "w-[72px] h-[72px]" : "w-[62px] h-[62px]";
          const stampMargin = numTop <= 4 ? "gap-x-3" : "gap-x-2";
          const iconSize = numTop <= 4 ? 36 : 30;

          const renderRow = (rowItems: typeof displayDays, extraClass = "") => (
            <View className={`flex-row justify-start ${stampMargin} ${extraClass}`}>
              {rowItems.map((day, i) => {
                const isFilled = day.state === "completed";
                const isNext = day.state === "current";

                return (
                  <View key={i} className="items-center">
                    <View
                      className={`${stampSizeClass} rounded-2xl items-center justify-center overflow-hidden ${isFilled
                        ? "bg-white dark:bg-darkBackgroundCard border border-neutral-300 dark:border-neutral-600 shadow-sm"
                        : "bg-neutral-50 dark:bg-darkBackgroundMuted border border-neutral-200 dark:border-darkBorder border-dashed"
                        }`}
                      style={isNext ? { borderColor: "#FF6600" } : undefined}
                    >
                      {isFilled ? (
                        <View className="w-full h-full items-center justify-center">
                          {/* Tilted, faded store logo */}
                          {(storeStr?.logo || storeLogos[stamp.store_id?.toString()]) ? (
                            <Image
                              source={getLogoImage()}
                              className="w-full h-full p-1 opacity-45 rotate-12"
                              contentFit="contain"
                            />
                          ) : (
                            <Store size={iconSize} color="#e5e5e5" strokeWidth={1.5} className="rotate-12" />
                          )}

                          {/* Centered Stamp Icon (The "Ink") with subtle shadow for emphasis */}
                          <View
                            className="absolute inset-0 items-center justify-center pointer-events-none"
                            style={{
                              shadowColor: "#000",
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.15,
                              shadowRadius: 1.5,
                              elevation: 1,
                            }}
                          >
                            <Image
                              source={require("../../../assets/images/stamp/stamp_orange.png")}
                              style={{ width: iconSize * 1.4, height: iconSize * 1.4 }}
                              contentFit="contain"
                            />
                          </View>
                        </View>
                      ) : (
                        /* Empty slot — same logo style as stamped, no ink overlay */
                        <View className="w-full h-full items-center justify-center">
                          {(storeStr?.logo || storeLogos[stamp.store_id?.toString()]) ? (
                            <Image
                              source={getLogoImage()}
                              className="w-full h-full p-1 opacity-45 rotate-12"
                              contentFit="contain"
                            />
                          ) : (
                            <Store
                              size={iconSize}
                              color="#e5e5e5"
                              strokeWidth={1.5}
                              style={{ transform: [{ rotate: "12deg" }], opacity: 0.45 }}
                            />
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          );

          return (
            <View className="items-center w-full px-1">
              <View>
                {renderRow(topRow)}
                {bottomRow.length > 0 && renderRow(bottomRow, "mt-3")}
              </View>
            </View>
          );
        })()}
      </View>

      {/* ─── Footer (Rewards & Deadlines) ─── */}
      <View className={`px-4 py-3 flex-row items-center border-t justify-between ${isCompleted
        ? 'bg-neutral-50/50 dark:bg-darkBackgroundMuted border-neutral-100 dark:border-darkBorder'
        : 'bg-neutral-50 dark:bg-darkBackgroundMuted border-neutral-100 dark:border-darkBorder'
        }`}>

        {/* Left: Reward Info */}
        <View className="flex-row items-center gap-x-2.5 flex-1 mr-2">
          <View className={`w-8 h-8 rounded-lg items-center justify-center bg-white border border-neutral-200 dark:border-darkBorder dark:bg-darkBackgroundCard`}>
            <Gift size={15} color={isCompleted ? "#171717" : "#9ca3af"} />
          </View>
          <Text
            className={`text-[11px] font-poppins-semibold flex-1 ${isCompleted ? 'text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}
            numberOfLines={1}
          >
            {rewardTitle ? rewardTitle : translate("user.activity.stampLog.stampsReward", { count: target })}
          </Text>
        </View>

        {/* Right: Redeem button — always visible, disabled when incomplete */}
        {isCompleted ? (
          <TouchableOpacity
            className="bg-primary pt-[6px] pb-[6px] px-4 rounded-full shadow-sm flex-row items-center justify-center"
            activeOpacity={0.7}
          >
            <Text className="text-[10px] font-poppins-bold text-white tracking-[1px]">{translate("user.rewards.claim")}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            disabled
            className="bg-neutral-100 dark:bg-darkBackgroundCard pt-[6px] pb-[6px] px-3 rounded-full flex-row items-center gap-x-1 border border-neutral-200 dark:border-darkBorder"
            activeOpacity={1}
          >
            <Text className="text-[10px] font-poppins-bold text-neutral-400 dark:text-neutral-500 tracking-[1px]">
              CLAIM
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function StampLogScreen() {
  const { t: translate } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { storeId } = useLocalSearchParams<{ storeId?: string }>();

  const { stamps, isLoading: isStampsLoading, fetchStamps } = useStamps();
  const [activePrograms, setActivePrograms] = useState<any[]>([]);
  const [stampEvents, setStampEvents] = useState<any[]>([]);
  const [rewardEvents, setRewardEvents] = useState<any[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  // Virtual card: shown when storeId is set but no stamp_progress row exists yet
  const [virtualCard, setVirtualCard] = useState<any | null>(null);

  const parsedStoreId = storeId ? Number(storeId) : null;

  useEffect(() => {
    fetchStamps();
  }, []);

  useEffect(() => {
    let active = true;
    setIsEventsLoading(true);

    const loadEvents = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;

      try {
        const [stamps, rewards] = await Promise.all([
          parsedStoreId
            ? getStampEventsForStore(user.id, parsedStoreId)
            : getUserStampEvents(user.id),
          getUserRewardRedemptions(user.id, parsedStoreId || undefined)
        ]);

        if (active) {
          setStampEvents(stamps);
          setRewardEvents(rewards);
        }
      } catch (err) {
        console.error("Error loading events:", err);
      } finally {
        if (active) setIsEventsLoading(false);
      }
    };

    loadEvents();
    return () => { active = false; };
  }, [parsedStoreId]);

  const storeStamps = useMemo(() => {
    if (!parsedStoreId) return stamps;
    return stamps.filter(s => s.store_id === parsedStoreId);
  }, [stamps, parsedStoreId]);

  // When viewing a specific store but the user has no progress yet (e.g. erased),
  // build a virtual zero-stamp card so the UI still shows the punch card.
  useEffect(() => {
    if (!parsedStoreId) {
      setVirtualCard(null);
      return;
    }
    if (storeStamps.length > 0) {
      setVirtualCard(null);
      return;
    }

    let active = true;
    (async () => {
      try {
        const [storeRow, programs] = await Promise.all([
          getStoreById(parsedStoreId),
          getActiveStampProgramRewards([parsedStoreId]),
        ]);
        if (!active) return;

        const program = programs[0];
        setVirtualCard({
          id: `virtual-${parsedStoreId}`,
          store_id: parsedStoreId,
          stamps_count: 0,
          target: program?.total_stamps ?? 7,
          card_status: 'active',
          stores: {
            name: storeRow?.name ?? 'Store',
            logo: storeRow?.logo ?? null,
            address: storeRow?.address ?? '',
            is_active: storeRow?.is_active ?? true,
            status: storeRow?.status ?? 'active',
          },
        });
        // Also seed the active programs list so reward title shows
        if (programs.length > 0) setActivePrograms(programs);
      } catch (e) {
        console.error('[StampLog] Failed to build virtual card:', e);
      }
    })();
    return () => { active = false; };
  }, [parsedStoreId, storeStamps.length]);

  useEffect(() => {
    if (storeStamps.length === 0) return;
    const storeIds = parsedStoreId ? [parsedStoreId] : storeStamps.map((s) => s.store_id);
    getActiveStampProgramRewards(storeIds)
      .then(setActivePrograms)
      .catch(console.error);
  }, [storeStamps, parsedStoreId]);

  // Handle active cards
  const activeCards = storeStamps.filter((s) => (s.stamps_count ?? 0) < (s.target ?? 7) && (s as any).card_status !== 'completed' && (s as any).card_status !== 'expired');
  const readyToClaim = storeStamps.filter((s) => (s.stamps_count ?? 0) >= (s.target ?? 7) || (s as any).card_status === 'completed');

  // Show real cards first, then the virtual zero-card as fallback
  const cardsToDisplay = [...readyToClaim, ...activeCards];
  const showVirtualCard = cardsToDisplay.length === 0 && virtualCard !== null;

  const storeObj = (storeStamps[0]?.stores as any) ?? (virtualCard?.stores);
  const displayStoreName = storeObj?.name ?? 'Store';

  const isLoading = isStampsLoading || isEventsLoading;

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-darkBackground">
      {/* ─── Header ─── */}
      <View
        className="bg-white dark:bg-darkBackgroundMuted border-b border-neutral-100 dark:border-darkBorder"
        style={{ paddingTop: insets.top }}
      >
        <View className="flex-row items-center px-4 py-4 gap-x-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-darkBackgroundCard items-center justify-center"
          >
            <ChevronLeft size={20} color="#171717" className="dark:text-white" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-base font-poppins-bold text-neutral-900 dark:text-white tracking-[0.2px]" numberOfLines={1}>
              {parsedStoreId ? `${displayStoreName} ${translate("user.activity.stampLog.stampsSuffix")}` : translate("user.rewards.stampLog")}
            </Text>
            <Text className="text-[11px] font-poppins text-neutral-500">
              {translate("user.activity.stampLog.loyaltyProgress")}
            </Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <StampDetailSkeleton />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
        {/* ─── The Single Active Punch Card ─── */}
        {(cardsToDisplay.length > 0 || showVirtualCard) && (
          <View className="mb-2">
            {showVirtualCard ? (
              <StampCard
                key={virtualCard.id}
                stamp={virtualCard}
                rewardTitle={activePrograms.find(p => p.store_id === parsedStoreId)?.reward_title ?? null}
              />
            ) : (
              cardsToDisplay.map((stamp) => {
                const program = activePrograms.find((p) => p.store_id === stamp.store_id);
                return (
                  <StampCard
                    key={stamp.id}
                    stamp={stamp}
                    rewardTitle={program?.reward_title ?? null}
                  />
                );
              })
            )}

            {/* How to Earn Banner Text */}
            <Text className="text-[11px] font-poppins text-neutral-500 text-center mt-3 mb-6 px-4">
              {translate("user.activity.stampLog.earnInfo")}
            </Text>
          </View>
        )}

        {/* ─── Vertical Timeline Stamp History ─── */}
        <View className="mb-8">
          <View className="flex-row items-center gap-x-2 mb-4 px-1">
            <History size={16} color="#475569" className="dark:text-neutral-400" />
            <Text className="text-sm font-poppins-bold text-neutral-800 dark:text-neutral-200">
              {translate("user.activity.stampLog.stampHistory")}
            </Text>
          </View>

          <View className="bg-white dark:bg-darkBackgroundCard rounded-3xl p-5 border border-neutral-100 dark:border-darkBorder">
            {stampEvents.length === 0 ? (
              <View className="items-center py-4">
                <Clock size={24} color="#d1d5db" className="mb-2" />
                <Text className="text-center text-[11px] font-poppins text-neutral-400">
                  {translate("user.activity.stampLog.noStampsYet")}
                </Text>
              </View>
            ) : (
              <View className="mt-2">
                {stampEvents.map((evt, idx) => (
                  <View key={evt.id} className="flex-row items-stretch">
                    <View className="w-8 items-center">
                      <View className="w-2.5 h-2.5 rounded-full bg-[#FF6600] mt-1" />
                      {idx !== stampEvents.length - 1 && (
                        <View className="flex-1 w-px bg-orange-200 dark:bg-orange-900/50 my-1.5" />
                      )}
                    </View>
                    <View className={`flex-1 flex-row pb-${idx !== stampEvents.length - 1 ? '6' : '1'} items-start justify-between`}>
                      <View>
                        <Text className="text-xs font-poppins-semibold text-neutral-800 dark:text-neutral-200">
                          {translate("user.activity.stampLog.stampEarned")}
                        </Text>
                        <Text className="text-[10px] font-poppins text-neutral-500 mt-0.5">
                          {new Date(evt.created_at).toLocaleDateString("en-US", {
                            year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit'
                          })}
                        </Text>
                      </View>
                      {(evt as any).points && (
                        <View className="bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded flex-row items-center border border-orange-100 dark:border-orange-800/50">
                          <Text className="text-[10px] font-poppins-semibold text-[#FF6600]">
                            {translate("user.activity.stampLog.ptsEarned", { count: (evt as any).points })}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ─── Vertical Timeline Reward History ─── */}
        <View className="mb-4">
          <View className="flex-row items-center gap-x-2 mb-4 px-1">
            <Gift size={16} color="#d97706" />
            <Text className="text-sm font-poppins-bold text-neutral-800 dark:text-neutral-200">
              {translate("user.activity.stampLog.rewardHistory")}
            </Text>
          </View>

          <View className="bg-white dark:bg-darkBackgroundCard rounded-3xl p-5 border border-neutral-100 dark:border-darkBorder">
            {rewardEvents.length === 0 ? (
              <View className="items-center py-4">
                <Gift size={24} color="#d1d5db" className="mb-2" />
                <Text className="text-center text-[11px] font-poppins text-neutral-400">
                  {translate("user.activity.stampLog.noRewardsYet")}
                </Text>
              </View>
            ) : (
              <View className="mt-2">
                {rewardEvents.map((evt, idx) => (
                  <View key={evt.id} className="flex-row items-stretch">
                    <View className="w-8 items-center">
                      <View className="w-6 h-6 rounded-full bg-amber-50 border border-amber-200 items-center justify-center -mt-1 dark:bg-amber-900/40 dark:border-amber-800 overflow-hidden">
                        {evt.image_url ? (
                          <Image source={{ uri: evt.image_url }} className="w-full h-full" contentFit="cover" />
                        ) : (
                          <Gem size={10} color="#d97706" />
                        )}
                      </View>
                      {idx !== rewardEvents.length - 1 && (
                        <View className="flex-1 w-px bg-amber-100 dark:bg-amber-900/50 my-1.5" />
                      )}
                    </View>
                    <View className={`flex-1 flex-row pb-${idx !== rewardEvents.length - 1 ? '6' : '1'} items-start justify-between`}>
                      <View className="flex-1 mr-2">
                        <Text className="text-xs font-poppins-semibold text-neutral-800 dark:text-neutral-200 line-clamp-1" numberOfLines={1}>
                          {evt.title}
                        </Text>
                        <Text className="text-[10px] font-poppins text-neutral-500 mt-0.5">
                          {new Date(evt.redeemed_at).toLocaleDateString("en-US", {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </Text>
                      </View>
                      <View className="bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded flex-row items-center border border-amber-100 dark:border-amber-800/50">
                        <Text className="text-[10px] font-poppins-semibold text-amber-600 dark:text-amber-500">
                          {translate("user.activity.stampLog.claimed")}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        </ScrollView>
      )}
    </View>
  );
}
