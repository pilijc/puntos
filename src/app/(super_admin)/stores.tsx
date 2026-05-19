import React, { useCallback } from "react";
import {
	ScrollView,
	RefreshControl,
	Platform,
	FlatList,
	ActivityIndicator,
	NativeSyntheticEvent,
	NativeScrollEvent,
} from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import { useTranslation } from "react-i18next";
import { ScreenWrapper } from "@/components/ui/screen-wrapper";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { AdminStoreCard, AdminStoreSkeletonCard } from "@/components/users/stores/admin-store-card";
import { AdminStoreDetails } from "@/components/users/stores/admin-store-details";
import { AdminStorePreviewModal } from "@/components/users/stores/admin-store-preview-modal";
import { Modal } from "@/components/modal";
import {
	useSuperAdminStores,
	FILTERS,
} from "@/hooks/super-admin/use-super-admin-stores";
import { useIsDark } from "@/hooks/use-is-dark";

// ── Screen ──────────────────────────────────────────────────────────────────
const isWeb = Platform.OS === "web";
const WEB_TAB_PILL_STYLE = { flexGrow: 1, flexBasis: 120, minWidth: 0 };

export default function SuperAdminStores() {
	const { t: translate } = useTranslation();
	const isDark = useIsDark();
	const {
		stores,
		loading,
		error,
		errorModal,
		dismissErrorModal,
		activeFilter,
		setActiveFilter,
		refreshing,
		selectedStore,
		setSelectedStore,
		previewStore,
		setPreviewStore,
		confirmModal,
		setConfirmModal,
		onRefresh,
		loadMore,
		handleApprove,
		handleReject,
		getEffectiveStatus,
		filtered,
		pendingCount,
		FILTER_LABELS,
		subscriptions,
		hasMore,
		isFetching,
		ownerActiveStoreCounts,
		hasProSubscription,
	} = useSuperAdminStores();

	const [lastErrorModal, setLastErrorModal] = React.useState<typeof errorModal>(null);
	React.useEffect(() => {
		if (errorModal) setLastErrorModal(errorModal);
	}, [errorModal]);

	const [lastConfirmModal, setLastConfirmModal] = React.useState<typeof confirmModal>(null);
	React.useEffect(() => {
		if (confirmModal) setLastConfirmModal(confirmModal);
	}, [confirmModal]);

	const statusCounts = React.useMemo(() => {
		const counts: Record<string, number> = { All: stores.length };

		for (const store of stores) {
			const status = getEffectiveStatus(store);
			counts[status] = (counts[status] ?? 0) + 1;
		}

		return counts;
	}, [stores, getEffectiveStatus]);

	const selectedOwnerActiveStoresCount = selectedStore
		? Math.max(0, (ownerActiveStoreCounts[selectedStore.owner_id] ?? 0) - ((selectedStore.status === "active" || selectedStore.is_active) ? 1 : 0))
		: 0;

	const handleWebScroll = useCallback(
		(event: NativeSyntheticEvent<NativeScrollEvent>) => {
			const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
			if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 200 && hasMore && !isFetching) {
				loadMore();
			}
		},
		[hasMore, isFetching, loadMore]
	);

	const renderStoreItem = useCallback(
		({ item: store }: { item: typeof filtered[number] }) => {
			const activeStoresCount = Math.max(
				0,
				(ownerActiveStoreCounts[store.owner_id] ?? 0) - ((store.status === "active" || store.is_active) ? 1 : 0)
			);

			return (
				<AdminStoreCard
					store={store}
					ownerActiveStoresCount={activeStoresCount}
					onApprove={handleApprove}
					onReject={handleReject}
					onSelect={(s) => setPreviewStore(s)}
				/>
			);
		},
		[ownerActiveStoreCounts, handleApprove, handleReject, setPreviewStore]
	);

	if (selectedStore) {
		const sub = subscriptions.find((s) => s.owner_id === selectedStore.owner_id);
		return (
			<>
				<AdminStoreDetails
					store={selectedStore}
					subscription={sub}
					ownerActiveStoresCount={selectedOwnerActiveStoresCount}
					onBack={() => setSelectedStore(null)}
					onApprove={(store) => { handleApprove(store); }}
					onReject={(store) => { handleReject(store); setSelectedStore(null); }}
				/>
				<Modal
					visible={!!errorModal}
					onClose={dismissErrorModal}
					title={errorModal?.title ?? (errorModal?.type === "success" ? translate("label.success") : translate("label.error"))}
					message={errorModal?.message ?? ""}
					buttons={[{ label: translate("label.ok"), onPress: dismissErrorModal, variant: errorModal?.type === "success" ? "success" : "primary" }]}
					showCloseButton={false}
					dismissOnBackdrop
				/>
				<Modal
					visible={!!confirmModal}
					onClose={() => setConfirmModal(null)}
					title={confirmModal?.title ?? ""}
					message={confirmModal?.message ?? ""}
					buttons={[
						!confirmModal?.hideCancel && {
							label: translate("label.cancel"),
							onPress: () => setConfirmModal(null),
							variant: "secondary",
						},
						{
							label: confirmModal?.label ?? translate("label.confirm"),
							onPress: confirmModal?.onConfirm ?? (() => { }),
							variant: confirmModal?.variant ?? "primary",
						},
					].filter(Boolean) as any}
					showCloseButton={false}
					dismissOnBackdrop
				/>
			</>
		);
	}

	return (
		<ScreenWrapper
			className="flex-1"
			style={{ backgroundColor: isDark ? "#171717" : "#F3F4F6" }}
		>

			{/* ── Main Header (Uniform Style) ── */}
			<View
				className="border-b border-neutral-100 dark:border-darkBorder px-6 py-3"
				style={{ backgroundColor: isDark ? "#171717" : "#FFFFFF", borderBottomColor: isDark ? "#404040" : undefined }}
			>
				<Text
					className="text-xl font-poppins-bold py-1"
					style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
				>
					{translate("superAdmin.stores.title", { defaultValue: "Store Approvals" })}
				</Text>
			</View>

			{/* ── Content ── */}
			{isWeb ? (
				<ScrollView
					className="flex-1"
					contentContainerStyle={{
						paddingHorizontal: 16,
						paddingTop: 16,
						paddingBottom: 40,
						alignItems: "center" as const,
					}}
					showsVerticalScrollIndicator={false}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6600" colors={["#FF6600"]} />}
					onScroll={handleWebScroll}
					scrollEventThrottle={200}
				>
					<View style={{ maxWidth: 896 }} className="w-full">

						{/* ── Filter tabs ── */}
						<View className="bg-white dark:bg-darkBackgroundCard rounded-2xl flex-row flex-wrap shadow-sm border border-slate-100 dark:border-darkBorder mb-4" style={{ width: '100%', padding: 6, alignItems: 'center', gap: 6 }}>
							{FILTERS.map((f) => {
								const active = activeFilter === f;
								const count = statusCounts[f] ?? 0;
								return (
									<TouchableOpacity key={f} onPress={() => setActiveFilter(f)} activeOpacity={0.8} style={{ ...WEB_TAB_PILL_STYLE, height: 38, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, borderRadius: 12, backgroundColor: active ? '#FF6600' : 'transparent', paddingHorizontal: 8 }}>
										<Text className={`min-w-0 text-sm font-poppins-bold ${active ? 'text-white' : 'text-slate-500 dark:text-darkTextMuted'}`} numberOfLines={1}>{FILTER_LABELS[f]}</Text>
										{count >= 0 && (
											<View className={`rounded-full px-2 py-0.5 items-center justify-center ${active ? 'bg-white/20' : 'bg-slate-100 dark:bg-neutral-800'}`}>
												<Text className={`text-[10px] font-poppins-bold ${active ? 'text-white' : 'text-slate-500 dark:text-darkTextMuted'}`}>{count}</Text>
											</View>
										)}
									</TouchableOpacity>
								);
							})}
						</View>

						{/* ── Store list ── */}
						{loading && !refreshing && filtered.length === 0 ? (
							<View>
								<AdminStoreSkeletonCard />
								<AdminStoreSkeletonCard />
								<AdminStoreSkeletonCard />
							</View>
						) : (
							<FlatList
								data={filtered}
								renderItem={renderStoreItem}
								keyExtractor={(store) => String(store.id)}
								contentContainerStyle={{ paddingBottom: 16 }}
								scrollEnabled={false}
								showsVerticalScrollIndicator={false}
								removeClippedSubviews={false}
								initialNumToRender={10}
								ListHeaderComponent={
									error && !loading ? (
										<View className="flex-row items-center gap-2 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl p-3 mb-4">
											<MaterialIcons name="error-outline" size={16} color="#DC2626" />
											<Text className="flex-1 text-sm font-poppins text-red-600 dark:text-red-400">{error}</Text>
										</View>
									) : null
								}
								ListEmptyComponent={
									!error ? (
										<View className="items-center pt-16 gap-3">
											<MaterialIcons name="storefront" size={52} color="#CBD5E1" />
											<Text className="text-base font-poppins-bold text-slate-600 dark:text-darkTextSecondary">
												{activeFilter === "All" ? translate("superAdmin.stores.noStores") : translate("superAdmin.stores.noFilteredStores", { status: FILTER_LABELS[activeFilter] })}
											</Text>
											<Text className="text-sm font-poppins text-slate-400 text-center px-8">{translate("superAdmin.stores.pullToRefresh")}</Text>
										</View>
									) : null
								}
								ListFooterComponent={
									isFetching && hasMore ? (
										<View className="py-4 items-center">
											<ActivityIndicator size="small" color="#FF6600" />
										</View>
									) : null
								}
							/>
						)}
					</View>
				</ScrollView>
			) : (
				<>
					{/* ── Filter tabs (Sub-Header) ── */}
					<View style={{ backgroundColor: isDark ? '#171717' : '#f8fafc', borderBottomWidth: 1, borderBottomColor: isDark ? '#404040' : '#f1f5f9' }} className="mb-0">
						<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 28, flexDirection: "row" }}>
							{FILTERS.map((f) => {
								const active = activeFilter === f;
								const count = statusCounts[f] ?? 0;
								return (
									<TouchableOpacity key={f} className={`py-3 items-center flex-row justify-center gap-1.5 border-b-2 ${active ? 'border-primary' : 'border-transparent'}`} onPress={() => setActiveFilter(f)} activeOpacity={0.7}>
										<Text className={active ? "text-sm font-poppins-bold text-primary" : "text-sm font-poppins-medium text-slate-400 dark:text-darkTextMuted"} numberOfLines={1}>{FILTER_LABELS[f]}</Text>
										{count > 0 && (
											<View className={`rounded-full px-1.5 min-w-[20px] items-center ${active ? "bg-primary/10" : "bg-neutral-100 dark:bg-darkBackgroundCard"}`}>
												<Text className={`text-[10px] font-poppins-bold ${active ? "text-primary" : "text-neutral-500 dark:text-darkTextMuted"}`}>{count}</Text>
											</View>
										)}
									</TouchableOpacity>
								);
							})}
						</ScrollView>
					</View>

					{/* ── Store list ── */}
					<View className="flex-1">
						{loading && !refreshing && filtered.length === 0 ? (
							<View className="flex-1" style={{ padding: 16, paddingBottom: 40 }}>
								<AdminStoreSkeletonCard />
								<AdminStoreSkeletonCard />
								<AdminStoreSkeletonCard />
							</View>
						) : (
							<FlatList
								data={filtered}
								renderItem={renderStoreItem}
								keyExtractor={(store) => String(store.id)}
								contentContainerStyle={{ padding: 16, paddingBottom: filtered.length === 0 ? 16 : 40 }}
								showsVerticalScrollIndicator={false}
								refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6600" colors={["#FF6600"]} />}
								onEndReached={() => { if (hasMore && !isFetching) { loadMore(); } }}
								onEndReachedThreshold={0.5}
								removeClippedSubviews={true}
								initialNumToRender={10}
								maxToRenderPerBatch={10}
								windowSize={10}
								ListHeaderComponent={
									error && !loading ? (
										<View className="flex-row items-center gap-2 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl p-3 mb-4">
											<MaterialIcons name="error-outline" size={16} color="#DC2626" />
											<Text className="flex-1 text-sm font-poppins text-red-600 dark:text-red-400">{error}</Text>
										</View>
									) : null
								}
								ListEmptyComponent={
									!error ? (
										<View className="items-center pt-16 gap-3">
											<MaterialIcons name="storefront" size={52} color="#CBD5E1" />
											<Text className="text-base font-poppins-bold text-slate-600 dark:text-darkTextSecondary">
												{activeFilter === "All" ? translate("superAdmin.stores.noStores") : translate("superAdmin.stores.noFilteredStores", { status: FILTER_LABELS[activeFilter] })}
											</Text>
											<Text className="text-sm font-poppins text-slate-400 text-center px-8">{translate("superAdmin.stores.pullToRefresh")}</Text>
										</View>
									) : null
								}
								ListFooterComponent={
									isFetching && hasMore ? (
										<View className="py-4 items-center">
											<ActivityIndicator size="small" color="#FF6600" />
										</View>
									) : null
								}
							/>
						)}
					</View>
				</>
			)}

			<AdminStorePreviewModal
				visible={!!previewStore}
				store={previewStore}
				onClose={() => setPreviewStore(null)}
				onViewFullDetails={() => {
					setSelectedStore(previewStore);
					setPreviewStore(null);
				}}
				onApprove={() => {
					if (previewStore) {
						setPreviewStore(null);
						handleApprove(previewStore);
					}
				}}
				onReject={() => {
					if (previewStore) {
						setPreviewStore(null);
						handleReject(previewStore);
					}
				}}
			/>

			<Modal
				visible={!!errorModal}
				onClose={dismissErrorModal}
				title={lastErrorModal?.title ?? (lastErrorModal?.type === "success" ? translate("label.success") : translate("label.error"))}
				message={lastErrorModal?.message ?? ""}
				buttons={[
					{
						label: translate("label.ok"),
						onPress: dismissErrorModal,
						variant: lastErrorModal?.type === "success" ? "success" : "primary",
					},
				]}
				showCloseButton={false}
				dismissOnBackdrop
				zIndex={2000}
			/>

			<Modal
				visible={!!confirmModal}
				onClose={() => setConfirmModal(null)}
				title={lastConfirmModal?.title ?? ""}
				message={lastConfirmModal?.message ?? ""}
				buttons={[
					!lastConfirmModal?.hideCancel && {
						label: translate("label.cancel"),
						onPress: () => setConfirmModal(null),
						variant: "secondary",
					},
					{
						label: lastConfirmModal?.label ?? translate("label.confirm"),
						onPress: lastConfirmModal?.onConfirm ?? (() => { }),
						variant: lastConfirmModal?.variant ?? "primary",
					},
				].filter(Boolean) as any}
				showCloseButton={false}
				dismissOnBackdrop
				zIndex={2000}
			/>
		</ScreenWrapper>
	);
}
