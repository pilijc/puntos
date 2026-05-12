import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Animated, Linking, Platform, useColorScheme } from "react-native";
import { View, Text, SafeAreaView, ScrollView } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePaymentReturnHandler } from "@/hooks/store-manager/use-payment-return-handler";
import { Button } from "@/components/button";
import { isPaidUnlimitedPlan } from "@/services/store-manager/subscription-limits";
import { Table, type TableColumn } from "@/components/ui/table";
import { Modal } from "@/components/modal";
import { useStoreManagerSubscriptionStore } from "@/store/store-manager/subscription-store";
import {
	getAuthenticatedUserId,
	getManagerSubscription,
	getManagerSubscriptionPayments,
	useSubscriptionCheckout,
	getSubscriptionPlans,
	normalizeSubscriptionId,
	cancelManagerSubscription,
	subscribeToManagerSubscriptionRealtime,
	type ManagerSubscriptionPaymentRow,
} from "@/services/store-manager/subscription-service";

function toAmountNumber(value: unknown): number | null {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string") {
		const n = Number(value);
		return Number.isFinite(n) ? n : null;
	}
	return null;
}

function formatPhpAmount(value: number | null | undefined): string {
	const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
	return `PHP ${n.toFixed(2)}`;
}

function formatDateLong(value: string | number | Date | null | undefined): string {
	if (!value) return "—";
	const d = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(d.getTime())) return "—";
	return new Intl.DateTimeFormat(undefined, {
		year: "numeric",
		month: "long",
		day: "numeric",
	}).format(d);
}

function pickBasicAndProPlans(plans: Array<Record<string, unknown>>) {
	const basicPlan =
		plans.find((p) => String(p?.slug ?? "").toLowerCase() === "basic") ?? plans[0] ?? null;
	const proPlan = plans.find((p) => String(p?.slug ?? "").toLowerCase() === "pro") ?? null;
	return { basicPlan, proPlan };
}

export default function SubscriptionScreen() {
	const { t: translate } = useTranslation();
	const insets = useSafeAreaInsets();
	const isWeb = Platform.OS === "web";
	const scrollBottom = Math.max(insets.bottom, 40);
	const colorScheme = useColorScheme();
	const {
		ownerId,
		plans,
		managerRow,
		invoices,
		loading,
		loadingInvoices,
		startingCheckout,
		cancellingSubscription,
		modal,
		clearModal,
	} = useStoreManagerSubscriptionStore();
	usePaymentReturnHandler();

	useEffect(() => {
		let cancelled = false;
		const { reset, setLoading, setLoadingInvoices, hydrate } =
			useStoreManagerSubscriptionStore.getState();

		reset();

		void (async () => {
			try {
				const uid = await getAuthenticatedUserId();
				if (!uid) {
					if (!cancelled) setLoading(false);
					return;
				}

				setLoadingInvoices(true);
				const [planList, mgr, paymentRows] = await Promise.all([
					getSubscriptionPlans(),
					getManagerSubscription(uid),
					getManagerSubscriptionPayments(uid),
				]);

				if (cancelled) {
					setLoadingInvoices(false);
					return;
				}

				hydrate({
					ownerId: uid,
					plans: planList,
					managerRow: mgr,
					invoices: paymentRows,
				});
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

	// Realtime refresh when subscription/payment rows change.
	useEffect(() => {
		if (!ownerId) return;

		let cancelled = false;
		let refreshTimer: any = null;

		const scheduleRefresh = () => {
			if (cancelled) return;
			if (refreshTimer) clearTimeout(refreshTimer);
			// small debounce to collapse bursty events
			refreshTimer = setTimeout(async () => {
				try {
					const [mgr, paymentRows] = await Promise.all([
						getManagerSubscription(ownerId),
						getManagerSubscriptionPayments(ownerId),
					]);
					if (cancelled) return;
					useStoreManagerSubscriptionStore.setState({
						managerRow: mgr,
						invoices: paymentRows,
						loadingInvoices: false,
					});
				} catch (e) {
					if (!cancelled) console.warn("[subscription] realtime refresh failed:", e);
				}
			}, 250);
		};

		const unsubscribe = subscribeToManagerSubscriptionRealtime({
			ownerId,
			onChange: scheduleRefresh,
		});

		return () => {
			cancelled = true;
			if (refreshTimer) clearTimeout(refreshTimer);
			unsubscribe();
		};
	}, [ownerId]);

	const { basicPlan, proPlan } = useMemo(() => pickBasicAndProPlans(plans), [plans]);

	const currentSubscriptionId = useMemo(
		() => normalizeSubscriptionId(managerRow?.subscription_id),
		[managerRow?.subscription_id],
	);

	const basicId = basicPlan?.id != null ? Number(basicPlan.id) : null;
	const proId = proPlan?.id != null ? Number(proPlan.id) : null;

	const activePlanName = useMemo(() => {
		if (loading) return "—";
		if (currentSubscriptionId == null) return String(basicPlan?.name ?? translate("storeManager.subscription.billing.fallbackPlanName.basic", "Basic plan"));
		if (proId != null && currentSubscriptionId === proId)
			return String(proPlan?.name ?? translate("storeManager.subscription.billing.fallbackPlanName.pro", "Pro plan"));
		if (basicId != null && currentSubscriptionId === basicId)
			return String(basicPlan?.name ?? translate("storeManager.subscription.billing.fallbackPlanName.basic", "Basic plan"));
		return String(proPlan?.name ?? basicPlan?.name ?? translate("storeManager.subscription.title", "Plan"));
	}, [basicId, basicPlan?.name, currentSubscriptionId, proId, proPlan?.name, translate, loading]);

	const activePlanAmount = useMemo(() => {
		if (loading) return 0;
		const active =
			proId != null && currentSubscriptionId === proId
				? toAmountNumber(proPlan?.amount)
				: toAmountNumber(basicPlan?.amount);
		if (active == null) return 0;
		return active;
	}, [basicPlan, currentSubscriptionId, proId, proPlan]);

	const nextPaymentDate = managerRow?.current_period_end ?? null;
	const upcomingBillingAmount = activePlanAmount;

	const lastPaidAmount = useMemo(() => {
		const paidRows = invoices.filter(
			(r) => String(r.payment_status ?? "").toLowerCase() === "paid",
		);
		if (paidRows.length === 0) return null;
		return toAmountNumber(paidRows[0].amount_paid) ?? null;
	}, [invoices]);

	const planListForGate = useMemo(
		() =>
			plans
				.map((p) => ({
					id: Number(p.id),
					slug: p.slug != null ? String(p.slug) : null,
				}))
				.filter((p) => Number.isFinite(p.id)),
		[plans],
	);

	const isPaidPro = isPaidUnlimitedPlan(managerRow, planListForGate);
	const cancelScheduled = Boolean(managerRow?.cancel_at_period_end);
	const isBasicPlanSelected =
		currentSubscriptionId == null || (basicId != null && currentSubscriptionId === basicId);
	const isBasicFree = !isPaidPro && isBasicPlanSelected && upcomingBillingAmount === 0;

	const shouldShowUpcomingBill = useMemo(() => {
		if (cancelScheduled || isBasicFree) return false;
		if (lastPaidAmount === null) return false;
		return upcomingBillingAmount !== lastPaidAmount;
	}, [cancelScheduled, isBasicFree, lastPaidAmount, upcomingBillingAmount]);

	const periodLabel = cancelScheduled
		? translate("storeManager.subscription.billing.period.accessUntil")
		: translate("storeManager.subscription.billing.period.nextPayment");
	const accessEndMessage = useMemo(() => {
		const end = nextPaymentDate;
		if (!end) return null;
		return translate("storeManager.subscription.billing.messages.accessUntilNoBill", {
			date: formatDateLong(end),
		});
	}, [nextPaymentDate, translate]);

	const invoiceColumns = useMemo((): Array<TableColumn<ManagerSubscriptionPaymentRow>> => {
		return [
			{
				key: "payment_reference",
				header: translate("storeManager.subscription.billing.invoices.columns.paymentReference"),
				flex: 3,
				align: "left",
				render: (r) => (
					<View className="min-w-0">
						<Text
							className="text-xs font-poppins text-textSecondary"
							numberOfLines={1}
						>
							{String(r.payment_reference ?? "—")}
						</Text>
					</View>
				),
			},
			{
				key: "paid_date",
				header: translate("storeManager.subscription.billing.invoices.columns.paidDate"),
				flex: 2,
				align: "center",
				render: (r) => (
					<Text className="text-xs font-poppins text-textSecondary">
						{formatDateLong(r.paid_at ?? r.created_at)}
					</Text>
				),
			},
			{
				key: "status",
				header: translate("storeManager.subscription.billing.invoices.columns.status"),
				flex: 1,
				align: "center",
				render: (r) => {
					const status = String(r.payment_status ?? "").toLowerCase();
				  
					const styles = {
					  paid: {
						container: "bg-green-100 dark:bg-green-900/25",
						text: "text-green-700 dark:text-green-300",
					  },
					  failed: {
						container: "bg-red-100 dark:bg-red-900/25",
						text: "text-red-700 dark:text-red-300",
					  },
					  pending: {
						container: "bg-yellow-100 dark:bg-yellow-900/25",
						text: "text-yellow-700 dark:text-yellow-300",
					  },
					  default: {
						container: "bg-gray-100 dark:bg-gray-800",
						text: "text-gray-700 dark:text-gray-300",
					  },
					};
				  
					const style = styles[status as keyof typeof styles] ?? styles.default;
				  
					return (
					  <View className={`px-2 py-0.5 rounded-full ${style.container}`}>
						<Text className={`text-xs font-poppins-bold uppercase ${style.text}`}>
						  {status || "—"}
						</Text>
					  </View>
					);
				  },
			},
			{
				key: "amount",
				header: translate("storeManager.subscription.billing.invoices.columns.amount"),
				flex: 1,
				align: "right",
				render: (r) => (
					<Text className="text-xs font-poppins text-textSecondary"> 
            PHP&nbsp;{Number(r.amount_paid ?? 0).toFixed(2)}
					</Text>
				),
			},
		];
	}, [translate]);

	const handleSubscribe = useCallback(async (amount: number, name: string) => {
		const s = useStoreManagerSubscriptionStore.getState();
		if (!s.ownerId) {
			s.showMessage(
				translate("label.somethingWentWrong"),
				translate("storeManager.subscription.billing.errors.mustBeSignedInToSubscribe"),
			);
			return;
		}

		const { proPlan } = pickBasicAndProPlans(s.plans);
		const selectedSlug = String(proPlan?.slug ?? "pro");

		try {
			s.setStartingCheckout(true);
			const checkoutUrl = await useSubscriptionCheckout(s.ownerId, selectedSlug, amount, name);
			if (checkoutUrl) {
				await Linking.openURL(checkoutUrl);
			} else {
				s.showMessage(
					translate("label.somethingWentWrong"),
					translate("storeManager.subscription.billing.errors.checkoutStartFailed"),
				);
			}
		} catch (e) {
			s.showMessage(
				translate("label.somethingWentWrong"),
				e instanceof Error ? e.message : translate("storeManager.subscription.billing.errors.pleaseTryAgain"),
			);
		} finally {
			s.setStartingCheckout(false);
		}
	}, [translate]);

	const performCancel = useCallback(async () => {
		const s = useStoreManagerSubscriptionStore.getState();
		s.setCancellingSubscription(true);
		try {
			const uid = s.ownerId;
			const result = await cancelManagerSubscription();
			if (result.ok === false) {
				s.showMessage(translate("storeManager.subscription.billing.cancel.failedTitle"), result.error);
				return;
			}

			let refreshedEnd = result.current_period_end ?? null;
			const refreshId = uid ?? (await getAuthenticatedUserId());
			const mgr = refreshId ? await getManagerSubscription(refreshId) : null;
			if (mgr) {
				useStoreManagerSubscriptionStore.setState({ managerRow: mgr });
			}
			refreshedEnd = refreshedEnd ?? mgr?.current_period_end ?? null;

			const endFormatted = formatDateLong(refreshedEnd);
			s.showMessage(
				translate("storeManager.subscription.billing.cancel.successTitle"),
				translate("storeManager.subscription.billing.messages.accessUntilNoBill", {
					date: endFormatted,
				}),
			);
		} catch (e) {
			s.showMessage(
				translate("label.somethingWentWrong"),
				e instanceof Error ? e.message : translate("storeManager.subscription.billing.errors.pleaseTryAgain"),
			);
		} finally {
			s.setCancellingSubscription(false);
		}
	}, [translate]);

	const openCancelConfirm = useCallback(() => {
		const s = useStoreManagerSubscriptionStore.getState();
		s.setModal({
			title: translate("storeManager.subscription.billing.cancel.confirmTitle"),
			message: translate("storeManager.subscription.billing.cancel.confirmMessage"),
			buttons: [
				{
					label: translate("storeManager.subscription.billing.cancel.goBack"),
					variant: "secondary",
					onPress: () => s.clearModal(),
				},
				{
					label: translate("storeManager.subscription.billing.cancel.confirmCta"),
					variant: "danger",
					onPress: () => {
						s.clearModal();
						void performCancel();
					},
				},
			],
		});
	}, [performCancel, translate]);

	const proAmount = toAmountNumber(proPlan?.amount);
	
	return (
		<SafeAreaView
			edges={["top", "left", "right"]}
			className="flex-1 bg-backgroundMuted dark:bg-neutral-900"
		>
			<Modal
				visible={!!modal}
				onClose={clearModal}
				title={modal?.title ?? ""}
				message={modal?.message}
				buttons={modal?.buttons}
			/>
			<View className="bg-white dark:bg-darkBackground border-b border-neutral-100 dark:border-darkBorder px-6 py-4">
				<Text className="text-xl font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
					{translate("storeManager.subscription.billing.title")}
				</Text>
			</View>
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
						style={{ maxWidth: isWeb ? 896 : undefined }}
						className="w-full gap-4"
					>
						<View className="relative w-full overflow-hidden rounded-xl bg-primary p-5 elevation-2">
							<View className="absolute inset-0 pointer-events-none">
								<View className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10" />
								<View className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/8" />
								<View className="absolute top-10 -right-24 h-10 w-80 rotate-12 rounded-full bg-white/10" />
								<View className="absolute bottom-10 -left-24 h-10 w-72 -rotate-12 rounded-full bg-white/8" />
							</View>
							{cancellingSubscription ? (
								<View className="absolute inset-0 z-10 rounded-xl bg-black/25 items-center justify-center">
									<ActivityIndicator size="large" color="#FF6600" />
								</View>
							) : null}
							<View className="w-full">
								<View className="flex-row items-center gap-2">
									{activePlanName && activePlanName !== "—" ? (
										<Text className="text-xs font-poppins-semibold bg-white/15 text-white px-2 py-0.5 rounded-full">
											{activePlanName}
										</Text>
									) : null}
								</View>

						<View className="flex-row items-end gap-1 mt-4">
								<Text className="text-4xl font-poppins-bold text-white">
									{isBasicFree || lastPaidAmount === 0 || lastPaidAmount === null
										? translate("storeManager.subscription.billing.free")
										: formatPhpAmount(lastPaidAmount)}
								</Text>
								{!isBasicFree && lastPaidAmount != null && lastPaidAmount !== 0 ? (
									<Text className="text-sm font-poppins-bold text-white/80 mb-1">
										{translate("storeManager.subscription.billing.perMonth")}
									</Text>
								) : null}
							</View>

							<View className="flex-row gap-6 mt-5">
								<View className="flex-1">
									<Text className="text-xs font-poppins-semibold text-white/80">
										{periodLabel}
									</Text>
									<Text className="mt-1 text-sm font-poppins-semibold text-white">
										{formatDateLong(nextPaymentDate)}
									</Text>
								</View>
								{shouldShowUpcomingBill ? (
									<View className="flex-1">
										<Text className="text-xs font-poppins-semibold text-white/80">
											{translate("storeManager.subscription.billing.upcomingAmount")}
										</Text>
										<Text className="mt-1 text-sm font-poppins-semibold text-white">
											{formatPhpAmount(upcomingBillingAmount)}
										</Text>
										<Text className="mt-1 text-[10px] font-poppins text-white/80 leading-4">
											{translate("storeManager.subscription.billing.upcomingPriceNote")}
										</Text>
									</View>
								) : null}
							</View>

								<View className="flex-row flex-wrap gap-3 mt-6 justify-start">
									{!isPaidPro && proPlan ? (
										<Button
											variant="accent"
											label={translate("storeManager.subscription.billing.upgradeToPro")}
											roundedFull
											icon="Sparkles"
											elevation={true}
											loading={startingCheckout}
											onPress={() => {
												const amount = proAmount ?? 0;
												const name = String(
													proPlan?.name ??
														translate("storeManager.subscription.billing.fallbackPlanName.pro"),
												);
												void handleSubscribe(amount, name);
											}}
											disabled={startingCheckout || proAmount == null}
										/>
									) : null}
									{isPaidPro && !cancelScheduled ? (
										<Button
											variant="secondary"
											fitContent={true}
											label={translate("storeManager.subscription.billing.cancelSubscription")}
											roundedFull
											onPress={openCancelConfirm}
											disabled={cancellingSubscription}
										/>
									) : null}
								</View>
							</View>
					</View>

					{accessEndMessage && cancelScheduled ? (
						<View className="rounded-xl bg-amber-50 dark:bg-amber-950 px-4 py-3">
							<Text className="text-xs font-poppins leading-5 text-amber-700 dark:text-amber-300">
								{accessEndMessage}
							</Text>
						</View>
					) : null}

					<View className="bg-white dark:bg-darkBackgroundCard rounded-xl border border-slate-100 dark:border-neutral-800 p-4">
							<View className="flex-row items-center gap-2 mb-2">
								<Text className="text-sm font-poppins-semibold text-slate-800 dark:text-slate-100">
									{translate("storeManager.subscription.billing.recentBilling.title")}
								</Text>
							</View>
							<Text className="text-xs font-poppins text-slate-500 dark:text-darkTextMuted leading-4 mb-4 px-0.5">
								{translate("storeManager.subscription.billing.recentBilling.subtitle")}
							</Text>

							{loadingInvoices ? (
								<View className="py-8 items-center justify-center">
									<ActivityIndicator size="small" color="#FF6600" />
								</View>
							) : (
								<>
									<Table
										variant="boxed"
										columns={invoiceColumns}
										rows={invoices}
										rowKey={(r, idx) => String(r.id ?? `${r.owner_id}-${idx}`)}
										emptyText={translate("storeManager.subscription.billing.invoices.empty")}
									/>
									<View className="mt-3 items-center">
										<Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
											{translate("storeManager.subscription.billing.invoices.end")}
										</Text>
									</View>
								</>
							)}
						</View>
					</View>
				</ScrollView>
		</SafeAreaView>
	);
}
