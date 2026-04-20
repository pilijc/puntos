import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Linking, Platform, useColorScheme } from "react-native";
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Sparkles, Store } from "lucide-react-native";
import { supabase } from "@/supabase/supabase";
import { usePaymentReturnHandler } from "@/hooks/store-manager/use-payment-return-handler";
import {
	getManagerSubscription,
	useSubscriptionCheckout,
	getSubscriptionPlans,
	normalizeSubscriptionId,
	type ManagerSubscriptionRow,
} from "@/services/store-manager/subscription-service";
import { isPaidUnlimitedPlan } from "@/services/store-manager/subscription-limits";

const ACCENT = "#FF6600";
const CONTENT_MAX_WIDTH = 860;

function FeatureLine({ text }: { text: string }) {
	return (
		<View className="flex-row items-start gap-2.5 py-1.5">
			<Check size={16} color={ACCENT} style={{ marginTop: 2 }} />
			<Text className="flex-1 text-sm font-poppins leading-5 text-textPrimary dark:text-darkTextPrimary">
				{text}
			</Text>
		</View>
	);
}

export default function SubscriptionScreen() {
	const { t: translate } = useTranslation();
	const insets = useSafeAreaInsets();
	const isWeb = Platform.OS === "web";
	const isDark = useColorScheme() === "dark";
	const scrollBottom = Math.max(insets.bottom, 40);

	usePaymentReturnHandler();

	const [ownerId, setOwnerId] = useState<string | null>(null);
	const [plans, setPlans] = useState<Array<Record<string, unknown>>>([]);
	const [managerRow, setManagerRow] = useState<ManagerSubscriptionRow | null>(null);
	const [startingCheckout, setStartingCheckout] = useState(false);
	const [loading, setLoading] = useState(true);
	const [currentSubscriptionId, setCurrentSubscriptionId] = useState<number | null>(null);

	const isPaidUnlimited = useMemo(
		() => isPaidUnlimitedPlan(managerRow, plans as { id: number; slug?: string | null }[]),
		[managerRow, plans],
	);
	const showWelcome = !isPaidUnlimited;

	const mutedIcon = isDark ? "#a3a3a3" : "#64748b";

	const toAmountNumber = useCallback((value: unknown): number | null => {
		if (typeof value === "number" && Number.isFinite(value)) return value;
		if (typeof value === "string") {
			const n = Number(value);
			return Number.isFinite(n) ? n : null;
		}
		return null;
	}, []);

	const formatPeso = useCallback((amount: number | null) => {
		if (amount == null) return "";
		return `₱${amount.toFixed(2)}`;
	}, []);

	const basicPlan = useMemo(() => {
		const bySlug = plans.find((p) => String(p?.slug ?? "").toLowerCase() === "basic");
		return bySlug ?? plans[0] ?? null;
	}, [plans]);

	const premiumPlan = useMemo(() => {
		const bySlug = plans.find((p) =>
			["premium", "pro"].includes(String(p?.slug ?? "").toLowerCase()),
		);
		if (bySlug) return bySlug;
		return plans.length > 1 ? plans[1] : null;
	}, [plans]);

	useEffect(() => {
		let cancelled = false;

		(async () => {
			try {
				const {
					data: { session },
				} = await supabase.auth.getSession();
				const uid = session?.user?.id ?? null;
				if (!uid) {
					if (!cancelled) setLoading(false);
					return;
				}

				const [planList, mgr] = await Promise.all([
					getSubscriptionPlans(),
					getManagerSubscription(uid),
				]);

				if (cancelled) return;
				setOwnerId(uid);
				setPlans(planList);
				setManagerRow(mgr);
				setCurrentSubscriptionId(normalizeSubscriptionId(mgr?.subscription_id));
			} catch (e) {
				if (!cancelled) console.error("Subscription screen load error:", e);
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, []);

	const handleSubscribe = useCallback(
		async (amount: number, name: string) => {
			if (!ownerId) {
				Alert.alert("Error", "You must be signed in to subscribe.");
				return;
			}

			// Your `subscriptions` table uses `basic` and `pro`
			const selectedSlug = String(premiumPlan?.slug ?? "pro");

			try {
				setStartingCheckout(true);
				const checkoutUrl = await useSubscriptionCheckout(ownerId, selectedSlug, amount, name);
				if (checkoutUrl) {
					await Linking.openURL(checkoutUrl);
				} else {
					Alert.alert(
						"Error",
						"Could not start checkout. Your session may be invalid. Please log in again and retry.",
					);
				}
			} catch (e) {
				Alert.alert("Error", e instanceof Error ? e.message : "Please try again.");
			} finally {
				setStartingCheckout(false);
			}
		},
		[ownerId, premiumPlan],
	);

	const basicId = basicPlan?.id != null ? Number(basicPlan.id) : null;
	const showBasicBadge = basicId != null && currentSubscriptionId === basicId && !isPaidUnlimited;

	const premiumId = premiumPlan?.id != null ? Number(premiumPlan.id) : null;
	const showPremiumBadge =
		isPaidUnlimited && premiumId != null && currentSubscriptionId === premiumId;

	return (
		<SafeAreaView
			edges={["top", "left", "right"]}
			className="flex-1 bg-backgroundMuted dark:bg-neutral-900"
		>
			<View className="bg-white dark:bg-darkBackground border-b border-neutral-100 dark:border-darkBorder px-6 py-3 flex-row items-center justify-between">
				<Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary py-1">{translate("store_manager.subscription.title")}</Text>
			</View>
			{loading ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color={ACCENT} />
				</View>
			) : (
				<ScrollView
					className="flex-1"
					contentContainerStyle={{
						paddingHorizontal: 16,
						paddingTop: 16,
						paddingBottom: scrollBottom,
						...(isWeb ? { alignItems: "center" as const } : {}),
					}}
					showsVerticalScrollIndicator={false}
				>
					<View
						style={{ maxWidth: isWeb ? CONTENT_MAX_WIDTH : undefined }}
						className="w-full rounded-xl border border-slate-100 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden p-6 gap-6"
					>
						{showWelcome ? (
							<>
								<View className="items-center px-1">
									<View className="flex-row items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-[#431407]/60">
										<Text className="text-xs font-poppins-semibold text-primary dark:text-primary">
											{String(basicPlan?.name ?? translate("store_manager.subscription.welcome.planBadge"))}
										</Text>
									</View>
									<Text className="mt-4 text-2xl font-poppins-bold text-center text-textPrimary dark:text-darkTextPrimary">
										You're on {String(basicPlan?.name ?? translate("store_manager.subscription.welcome.basicTitle"))}
									</Text>
									<Text className="mt-2 text-sm font-poppins text-center leading-6 text-textSecondary dark:text-darkTextSecondary max-w-[520px]">
										Choose a plan below. Plan details come from your catalog.
									</Text>
								</View>

								<View
									className={
										isWeb ? "flex-row gap-4 items-stretch" : "flex-col gap-4"
									}
								>
									<View className="flex-1 min-w-0">
										<View className="relative rounded-2xl border border-slate-100 bg-white p-5 h-full dark:border-slate-700 dark:bg-neutral-900">
											{showBasicBadge ? (
												<View className="absolute -top-2.5 right-4 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
													<Text className="text-[10px] font-poppins-bold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">{translate("store_manager.subscription.welcome.currentPlan")}</Text>
												</View>
											) : null}
											<View className="flex-row items-center gap-2 mb-1">
												<Store size={20} color={mutedIcon} />
												<Text className="text-lg font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
													{String(basicPlan?.name ?? translate("store_manager.subscription.welcome.basicTitle"))}
												</Text>
											</View>
											<Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted mb-3">
												{toAmountNumber(basicPlan?.amount) === 0
													? translate("label.free")
													: `${formatPeso(toAmountNumber(basicPlan?.amount))}/month`}
											</Text>
											<View className="pt-1 border-t border-slate-100 dark:border-slate-700">
												<FeatureLine text={translate("store_manager.subscription.welcome.basicFeature1")} />
												<FeatureLine
													text={translate("store_manager.subscription.welcome.basicFeature2")}
												/>
												<FeatureLine text={translate("store_manager.subscription.welcome.basicFeature3")} />
											</View>
										</View>
									</View>

									<View className="flex-1 min-w-0">
										<View className="relative rounded-2xl border border-primary/35 dark:border-primary/45 bg-white dark:bg-neutral-900 p-5 h-full">
											<View className="absolute -top-2.5 right-4 px-2.5 py-1 rounded-full bg-[#FF6600] shadow-sm">
												<Text className="text-[10px] font-poppins-bold text-white uppercase tracking-wide">{translate("store_manager.subscription.welcome.recommended")}</Text>
											</View>
											<View className="flex-row items-center gap-2 mb-1 mt-1">
												<Sparkles size={20} color={ACCENT} />
												<Text className="text-lg font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
													{String(premiumPlan?.name ?? translate("store_manager.subscription.welcome.premiumTitle"))}
												</Text>
											</View>
											<Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted mb-3">
												{premiumPlan?.amount != null
													? `Built for multiple locations · ${formatPeso(
															toAmountNumber(premiumPlan.amount),
														)}/month`
													: "Built for multiple locations"}
											</Text>
											<View className="pt-1 border-t border-orange-100/80 dark:border-orange-900/40">
												<FeatureLine text={translate("store_manager.subscription.welcome.premiumFeature1")} />
												<FeatureLine text={translate("store_manager.subscription.welcome.premiumFeature2")} />
												<FeatureLine text={translate("store_manager.subscription.welcome.premiumFeature3")} />
												<FeatureLine
													text={translate("store_manager.subscription.welcome.premiumFeature4")}
												/>
											</View>
											<TouchableOpacity
												activeOpacity={0.85}
												className="mt-5 py-3.5 px-4 rounded-xl bg-[#FF6600] items-center justify-center"
												disabled={
													startingCheckout || toAmountNumber(premiumPlan?.amount) == null
												}
												onPress={() =>
													handleSubscribe(
														toAmountNumber(premiumPlan?.amount) ?? 0,
														String(premiumPlan?.name ?? translate("store_manager.subscription.welcome.premiumTitle")),
													)
												}
											>
												{startingCheckout ? (
													<ActivityIndicator size="small" color="#fff" />
												) : (
													<Text className="text-sm font-poppins-semibold text-white">
														Upgrade to {String(premiumPlan?.name ?? translate("store_manager.subscription.welcome.premiumTitle"))}
													</Text>
												)}
											</TouchableOpacity>
											<Text className="mt-2 text-[11px] font-poppins text-center text-textMuted dark:text-darkTextMuted leading-4">
												Secure checkout via PayMongo ·{" "}
												{premiumPlan?.amount != null
													? `${formatPeso(toAmountNumber(premiumPlan.amount))}/month`
													: "monthly"}{" "}
												(test mode)
											</Text>
										</View>
									</View>
								</View>
							</>
						) : (
							<View className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-neutral-900/40 p-6">
								{showPremiumBadge ? (
									<View className="self-start mb-3 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
										<Text className="text-[10px] font-poppins-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
											Current plan
										</Text>
									</View>
								) : null}
								<Text className="text-base font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
									You're on {String(premiumPlan?.name ?? translate("store_manager.subscription.welcome.premiumTitle"))}
								</Text>
								<Text className="mt-2 text-sm font-poppins text-textSecondary dark:text-darkTextSecondary">
									Thanks for subscribing. You can add unlimited stores from the dashboard.
								</Text>
							</View>
						)}
					</View>
				</ScrollView>
			)}
		</SafeAreaView>
	);
}
