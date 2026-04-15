import React from "react";
import {
	ScrollView,
	RefreshControl,
	Platform,
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

// ── Screen ──────────────────────────────────────────────────────────────────
const isWeb = Platform.OS === "web";

export default function SuperAdminStores() {
	const { t: translate } = useTranslation();
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
	} = useSuperAdminStores();

	const selectedOwnerActiveStoresCount = selectedStore
		? stores.filter(s => s.owner_id === selectedStore.owner_id && s.id !== selectedStore.id && (s.status === "active" || s.is_active)).length
		: 0;

	if (selectedStore) {
		const sub = subscriptions.find(s => s.store_id === selectedStore.id);
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
					title={errorModal?.title ?? (errorModal?.type === "success" ? "Success" : "Error")}
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
		<ScreenWrapper className="flex-1 bg-backgroundMuted dark:bg-darkBackground">

			{/* ── Header ── */}
			<View
				style={isWeb ? {
					backgroundColor: 'transparent',
					borderBottomWidth: 0,
					paddingTop: 24,
					paddingBottom: 16,
					width: '100%',
				} : {}}
				className="bg-white border-b border-slate-100 dark:bg-darkBackgroundMuted dark:border-darkBorder px-6 py-4 flex-row items-center justify-start"
			>
				<View
					style={isWeb ? {
						width: '100%',
						maxWidth: 1000,
						alignSelf: 'center',
						paddingHorizontal: 24,
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'flex-start'
					} : {
						flexDirection: 'row',
						alignItems: 'center',
						gap: 8,
						flex: 1
					}}
				>
					{!isWeb && (
						<MaterialIcons name="storefront" size={22} color="black" className="mt-1 dark:color-white" />
					)}
					<Text
						style={isWeb ? {
							fontSize: 22,
							fontFamily: 'Poppins-Bold',
							color: '#0f172a',
						} : {}}
						className="text-1xl font-poppins-bold text-slate-900 dark:text-darkTextPrimary flex-1"
					>
						{translate("superAdmin.stores.title", { defaultValue: "Store Approvals" })}
					</Text>
				</View>
			</View>

			{/* ── Filter tabs ── */}
			<View
				style={isWeb ? {
					alignItems: 'center',
					paddingVertical: 12,
					backgroundColor: 'transparent',
				} : {
					backgroundColor: 'white',
					borderBottomWidth: 1,
					borderBottomColor: '#f1f5f9'
				}}
				className="dark:bg-darkBackground"
			>
				{isWeb ? (
					<View className="bg-white dark:bg-darkBackgroundCard rounded-2xl p-1.5 flex-row gap-x-1 shadow-sm border border-slate-100 dark:border-darkBorder" style={{ width: '100%', maxWidth: 700 }}>
						{FILTERS.map((f) => {
							const active = activeFilter === f;
							const count = f === "All" ? stores.length : stores.filter((s) => getEffectiveStatus(s) === f).length;
							return (
								<TouchableOpacity
									key={f}
									onPress={() => setActiveFilter(f)}
									activeOpacity={0.8}
									style={{
										flex: 1,
										height: 44,
										alignItems: 'center',
										justifyContent: 'center',
										flexDirection: 'row',
										gap: 6,
										borderRadius: 12,
										backgroundColor: active ? '#FF6600' : 'transparent',
									}}
								>
									<Text className={`text-sm font-poppins-bold ${active ? 'text-white' : 'text-slate-500 dark:text-darkTextMuted'}`}>
										{FILTER_LABELS[f]}
									</Text>
									{count >= 0 && (
										<View className={`rounded-full px-2 py-0.5 items-center justify-center ${active ? 'bg-white/20' : 'bg-slate-100 dark:bg-neutral-800'}`}>
											<Text className={`text-[10px] font-poppins-bold ${active ? 'text-white' : 'text-slate-500 dark:text-darkTextMuted'}`}>
												{count}
											</Text>
										</View>
									)}
								</TouchableOpacity>
							);
						})}
					</View>
				) : (
					<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 28, flexDirection: "row" }}>
						{FILTERS.map((f) => {
							const active = activeFilter === f;
							const count = f === "All" ? stores.length : stores.filter((s) => getEffectiveStatus(s) === f).length;
							return (
								<TouchableOpacity
									key={f}
									className={`py-3 items-center flex-row justify-center gap-1.5 border-b-2 ${active ? 'border-primary' : 'border-transparent'}`}
									onPress={() => setActiveFilter(f)}
									activeOpacity={0.7}
								>
									<Text
										className={
											active
												? "text-sm font-poppins-bold text-primary"
												: "text-sm font-poppins-medium text-slate-400 dark:text-darkTextMuted"
										}
										numberOfLines={1}
									>
										{FILTER_LABELS[f]}
									</Text>
									{count > 0 && (
										<View
											className={`rounded-full px-1.5 min-w-[20px] items-center ${active
												? "bg-primary/10"
												: "bg-neutral-100 dark:bg-darkBackgroundCard"
												}`}
										>
											<Text
												className={`text-[10px] font-poppins-bold ${active
													? "text-primary"
													: "text-neutral-500 dark:text-darkTextMuted"
													}`}
											>
												{count}
											</Text>
										</View>
									)}
								</TouchableOpacity>
							);
						})}
					</ScrollView>
				)}
			</View>

			{/* ── Store list ── */}
			<View className="flex-1">
				<ScrollView
					className="flex-1"
					contentContainerStyle={[
						{ padding: 16, paddingBottom: filtered.length === 0 ? 16 : 40 },
						isWeb && {
							width: '100%',
							maxWidth: 1000,
							alignSelf: 'center'
						}
					]}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							tintColor="#FF6600"
							colors={["#FF6600"]}
						/>
					}
				>
					{error && !loading && (
						<View className="flex-row items-center gap-2 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl p-3 mb-4">
							<MaterialIcons name="error-outline" size={16} color="#DC2626" />
							<Text className="flex-1 text-sm font-poppins text-red-600 dark:text-red-400">{error}</Text>
						</View>
					)}

					{loading && (
						<>
							<AdminStoreSkeletonCard />
							<AdminStoreSkeletonCard />
							<AdminStoreSkeletonCard />
						</>
					)}

					{!loading && filtered.map((store) => {
						const activeStoresCount = stores.filter(
							s => s.owner_id === store.owner_id && s.id !== store.id && (s.status === "active" || s.is_active)
						).length;

						return (
							<AdminStoreCard
								key={store.id}
								store={store}
								ownerActiveStoresCount={activeStoresCount}
								onApprove={handleApprove}
								onReject={handleReject}
								onSelect={(s) => setPreviewStore(s)}
							/>
						);
					})}

					{!loading && filtered.length === 0 && !error && (
						<View className="items-center pt-16 gap-3">
							<MaterialIcons name="storefront" size={52} color="#CBD5E1" />
							<Text className="text-base font-poppins-bold text-slate-600 dark:text-darkTextSecondary">
								{activeFilter === "All"
									? translate("superAdmin.stores.noStores")
									: translate("superAdmin.stores.noFilteredStores", { status: FILTER_LABELS[activeFilter] })}
							</Text>
							<Text className="text-sm font-poppins text-slate-400 text-center px-8">
								{translate("superAdmin.stores.pullToRefresh")}
							</Text>
						</View>
					)}

					{!loading && hasMore && (
						<View className="mt-4 mb-8 items-center">
							<TouchableOpacity
								className="bg-white dark:bg-darkBackgroundCard border border-slate-200 dark:border-neutral-800 px-6 py-2.5 rounded-full flex-row items-center gap-2"
								onPress={loadMore}
								disabled={isFetching}
							>
								{isFetching ? (
									<View className="animate-spin">
										<MaterialIcons name="refresh" size={16} color="#64748B" />
									</View>
								) : (
									<MaterialIcons name="expand-more" size={18} color="#64748B" />
								)}
								<Text className="text-[13px] font-poppins-semibold text-slate-600 dark:text-darkTextSecondary">
									{isFetching ? "Loading..." : "Load More Stores"}
								</Text>
							</TouchableOpacity>
						</View>
					)}
				</ScrollView>
			</View>

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
				title={errorModal?.title ?? (errorModal?.type === "success" ? "Success" : "Error")}
				message={errorModal?.message ?? ""}
				buttons={[
					{
						label: translate("label.ok"),
						onPress: dismissErrorModal,
						variant: errorModal?.type === "success" ? "success" : "primary",
					},
				]}
				showCloseButton={false}
				dismissOnBackdrop
				zIndex={2000}
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
				zIndex={2000}
			/>
		</ScreenWrapper>
	);
}
