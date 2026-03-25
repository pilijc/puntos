import React, { useState, useCallback } from "react";
import {
	ScrollView,
	Alert,
	RefreshControl,
} from "react-native";
import { View, Text, TouchableOpacity, SafeAreaView } from "@/tw";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "expo-router";
import { Button } from "@/components/button";
import { Modal } from "@/components/modal";
import { getAllStores, updateStoreStatus, AdminStoreRow } from "@/services/store-service";

// ── Constants ───────────────────────────────────────────────────────────────
const FILTERS = ["All", "pending_review", "active", "inactive"] as const;
type Filter = typeof FILTERS[number];

const FILTER_LABELS: Record<Filter, string> = {
	All: "All",
	pending_review: "Pending",
	active: "Active",
	inactive: "Inactive",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string; text?: string }> = {
	active: { label: "Active", color: "#16A34A", bg: "bg-green-100", dot: "#22C55E", text: "text-green-700" },
	pending_review: { label: "Pending", color: "#D97706", bg: "bg-amber-100", dot: "#F59E0B", text: "text-amber-700" },
	inactive: { label: "Inactive", color: "#64748B", bg: "bg-slate-100", dot: "#94A3B8", text: "text-slate-500" },
};

// ── Store Card ──────────────────────────────────────────────────────────────
function StoreCard({
	store,
	onApprove,
	onReject,
}: {
	store: AdminStoreRow;
	onApprove: (store: AdminStoreRow) => void;
	onReject: (store: AdminStoreRow) => void;
}) {
	const status = store.status ?? "inactive";
	const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["inactive"];
	const isPending = status === "pending_review";
	const [modalVisible, setModalVisible] = useState(false);
	const [selectedImage, setSelectedImage] = useState<string | null>(null);

	return (
		<>
			<TouchableOpacity
				className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden mb-3"
				onPress={() => setModalVisible(true)}
				activeOpacity={0.95}
			>
				<View className="p-4 flex-row gap-3">
					<View className="w-[60px] h-[60px] rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center overflow-hidden">
						{store.logo ? (
							<Image
								source={{ uri: store.logo }}
								style={{ width: 60, height: 60 }}
								contentFit="cover"
							/>
						) : (
							<MaterialIcons name="storefront" size={26} color="#94A3B8" />
						)}
					</View>

					<View className="flex-1 justify-center gap-y-1">
						<View className="flex-row items-center justify-between">
							<Text className="font-poppins-bold text-[15px] text-slate-900 dark:text-slate-100 flex-1 mr-2" numberOfLines={1}>{store.name}</Text>
							<View className={`px-2 py-0.5 rounded-full ${cfg.bg}`}>
								<Text className={`text-[9px] font-poppins-bold uppercase tracking-wider ${cfg.text}`}>
									{cfg.label}
								</Text>
							</View>
						</View>
						<View className="flex-row items-center gap-1">
							<MaterialIcons name="location-on" size={12} color="#94A3B8" />
							<Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 flex-1" numberOfLines={1}>{store.address ?? "No address provided"}</Text>
						</View>
						{store.type ? (
							<View className="flex-row items-center gap-1">
								<MaterialIcons name="category" size={12} color="#94A3B8" />
								<Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 flex-1" numberOfLines={1}>{store.type}</Text>
							</View>
						) : null}
					</View>
				</View>

				{/* ── Visual Indicator for Tap ── */}
				<View className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex-row justify-between items-center">
					<Text className="text-xs font-poppins-medium text-slate-500 dark:text-slate-400">
						Tap to view details
					</Text>
					<MaterialIcons name="chevron-right" size={18} color="#94A3B8" />
				</View>

			{/* ── Details Modal ── */}
			<Modal
				visible={modalVisible}
				onClose={() => setModalVisible(false)}
				title="Store Details"
				buttons={isPending ? [
					{
						label: "Reject",
						variant: "danger",
						onPress: () => {
							setModalVisible(false);
							setTimeout(() => onReject(store), 300);
						}
					},
					{
						label: "Approve Store",
						variant: "success",
						onPress: () => {
							setModalVisible(false);
							setTimeout(() => onApprove(store), 300);
						}
					}
				] : []}
			>
				<ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
					{/* Top row again inside modal for context */}
					<View className="flex-row items-start mb-5 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
						<View className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center overflow-hidden">
							{store.logo ? (
								<Image source={{ uri: store.logo }} style={{ width: 56, height: 56 }} contentFit="cover" />
							) : (
								<MaterialIcons name="storefront" size={24} color="#94A3B8" />
							)}
						</View>
						<View className="flex-1 ml-3">
							<Text className="text-[15px] font-poppins-bold text-slate-900 dark:text-slate-100">{store.name}</Text>
							{store.type ? <Text className="text-[11px] font-poppins-medium text-primary mt-0.5">{store.type}</Text> : null}
							{store.address ? (
								<View className="flex-row items-center mt-1">
									<MaterialIcons name="location-on" size={12} color="#94A3B8" />
									<Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 ml-0.5">{store.address}</Text>
								</View>
							) : null}
						</View>
					</View>

					{/* Details section */}
					<View className="gap-y-3 mb-6">
						<Text className="text-sm font-poppins-bold text-slate-900 dark:text-slate-100 px-1">Information</Text>
						<View className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 gap-y-3">
							{store.owner_name ? (
								<View className="flex-row items-center gap-x-2.5">
									<MaterialIcons name="person" size={16} color="#94A3B8" />
									<Text className="text-sm font-poppins text-slate-600 dark:text-slate-400 flex-1">{store.owner_name}</Text>
								</View>
							) : null}
							{store.phone ? (
								<View className="flex-row items-center gap-x-2.5">
									<MaterialIcons name="phone" size={16} color="#94A3B8" />
									<Text className="text-sm font-poppins text-slate-600 dark:text-slate-400 flex-1">{store.phone}</Text>
								</View>
							) : null}
							{store.registration_number ? (
								<View className="flex-row items-center gap-x-2.5">
									<MaterialIcons name="business" size={16} color="#94A3B8" />
									<Text className="text-sm font-poppins text-slate-600 dark:text-slate-400 flex-1">{store.registration_number}</Text>
								</View>
							) : null}
							<View className="flex-row items-center gap-x-2.5">
								<MaterialIcons name="calendar-today" size={16} color="#94A3B8" />
								<Text className="text-sm font-poppins text-slate-600 dark:text-slate-400 flex-1">
									Registered on {new Date(store.created_at).toLocaleDateString("en-US", {
										month: "short", day: "numeric", year: "numeric",
									})}
								</Text>
							</View>
						</View>
					</View>

					{/* Documents preview */}
					{(!!store.business_document_image || ((store as any).store_pictures?.length ?? 0) > 0) && (
						<View className="gap-y-3">
							<Text className="text-sm font-poppins-bold text-slate-900 dark:text-slate-100 px-1">Submitted documents</Text>
							<View className="flex-row flex-wrap gap-2.5">
								{store.business_document_image && (
									<TouchableOpacity className="w-[100px] h-[100px] rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden" onPress={() => setSelectedImage(store.business_document_image!)}>
										<Image source={{ uri: store.business_document_image }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
									</TouchableOpacity>
								)}
								{(store as any).store_pictures?.map((uri: string, idx: number) => (
									<TouchableOpacity key={idx} className="w-[100px] h-[100px] rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden" onPress={() => setSelectedImage(uri)}>
										<Image source={{ uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
									</TouchableOpacity>
								))}
							</View>
						</View>
					)}
				</ScrollView>
			</Modal>
			</TouchableOpacity>

			{/* Full Screen Image Viewer Modal */}
			{!!selectedImage && (
				<Modal visible={true} onClose={() => setSelectedImage(null)} title="Document" dismissOnBackdrop={true}>
					<View className="items-center justify-center p-4">
						<Image source={{ uri: selectedImage }} style={{ width: "100%", height: 350 }} contentFit="contain" />
					</View>
				</Modal>
			)}
		</>
	);
}

// ── Skeleton card ───────────────────────────────────────────────────────────
function SkeletonCard() {
	return (
		<View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden mb-3">
			<View className="p-4 flex-row gap-3">
				<View className="w-[60px] h-[60px] rounded-xl bg-slate-100 dark:bg-slate-800" />
				<View className="flex-1 justify-center gap-y-2">
					<View className="h-4 rounded-lg bg-slate-100 dark:bg-slate-800" style={{ width: "55%" }} />
					<View className="h-3 rounded-lg bg-slate-100 dark:bg-slate-800" style={{ width: "75%" }} />
					<View className="h-3 rounded-lg bg-slate-100 dark:bg-slate-800" style={{ width: "40%" }} />
				</View>
			</View>
			<View className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex-row justify-between items-center">
				<View className="h-5 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
				<View className="h-7 w-20 rounded-lg bg-slate-100 dark:bg-slate-800" />
			</View>
		</View>
	);
}

// ── Screen ──────────────────────────────────────────────────────────────────
export default function SuperAdminStores() {
	const [stores, setStores] = useState<AdminStoreRow[]>([]);
	const [activeFilter, setActiveFilter] = useState<Filter>("pending_review");
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchStores = useCallback(async (silent = false) => {
		if (!silent) setLoading(true);
		setError(null);
		try {
			const data = await getAllStores();
			setStores(data);
		} catch (e: any) {
			setError(e?.message ?? "Failed to load stores");
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, []);

	useFocusEffect(useCallback(() => { fetchStores(); }, []));

	const onRefresh = () => { setRefreshing(true); fetchStores(true); };

	// ── Approve handler ────────────────────────────────────────────────────
	const handleApprove = (store: AdminStoreRow) => {
		Alert.alert(
			"Approve Store",
			`Approve "${store.name}"? It will go live immediately.`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Approve",
					onPress: async () => {
						try {
							await updateStoreStatus(store.id, "active", true);
							await fetchStores(true);
						} catch (e: any) {
							Alert.alert("Error", e?.message ?? "Failed to approve store");
						}
					},
				},
			],
		);
	};

	// ── Reject handler ─────────────────────────────────────────────────────
	const handleReject = (store: AdminStoreRow) => {
		Alert.alert(
			"Reject Store",
			`Reject "${store.name}"? The store-manager will need to resubmit.`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Reject",
					style: "destructive",
					onPress: async () => {
						try {
							await updateStoreStatus(store.id, "inactive", false);
							await fetchStores(true);
						} catch (e: any) {
							Alert.alert("Error", e?.message ?? "Failed to reject store");
						}
					},
				},
			],
		);
	};

	const filtered = (activeFilter === "All"
		? stores
		: stores.filter((s) => s.status === activeFilter))
		.slice()
		.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

	const pendingCount = stores.filter((s) => s.status === "pending_review").length;

	return (
		<SafeAreaView className="flex-1 bg-backgroundMuted dark:bg-slate-950">

			{/* ── Header ── */}
			<View className="bg-white border-b border-slate-100 dark:bg-slate-900 dark:border-slate-800 px-6 py-4 flex-row items-center justify-start">
				<View className="flex-row items-center gap-2 py-1">
					<MaterialIcons name="storefront" size={22} color="black" className="mt-1" />
					<Text className="text-2xl font-poppins-bold text-slate-900 dark:text-slate-100 flex-1">
						Store Approvals
					</Text>
				</View>
			</View>

			{/* ── Filter tabs ── */}
			<View className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
				<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 28, flexDirection: "row" }}>
					{FILTERS.map((f) => {
						const active = activeFilter === f;
						const count = f === "All" ? stores.length : stores.filter((s) => s.status === f).length;
						return (
							<TouchableOpacity
								key={f}
								className="py-3 items-center flex-row justify-center gap-1.5"
								style={{
									borderBottomWidth: 2,
									borderBottomColor: active ? "#FF6600" : "transparent",
								}}
								onPress={() => setActiveFilter(f)}
								activeOpacity={0.7}
							>
							<Text
								className={
									active
										? "text-sm font-poppins-bold text-primary"
										: "text-sm font-poppins-medium text-slate-400 dark:text-slate-500"
								}
								numberOfLines={1}
							>
								{FILTER_LABELS[f]}
							</Text>
							{count > 0 && (
								<View
									className={`rounded-full px-1.5 min-w-[20px] items-center ${active
										? "bg-primary/10"
										: "bg-neutral-100 dark:bg-neutral-700"
										}`}
								>
									<Text
										className={`text-[10px] font-poppins-bold ${active
											? "text-primary"
											: "text-neutral-500 dark:text-neutral-400"
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
			</View>

			{/* ── Store list ── */}
			<View className="flex-1">
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
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
						<SkeletonCard />
						<SkeletonCard />
						<SkeletonCard />
					</>
				)}

				{!loading && filtered.map((store) => (
					<StoreCard
						key={store.id}
						store={store}
						onApprove={handleApprove}
						onReject={handleReject}
					/>
				))}

					{!loading && filtered.length === 0 && !error && (
						<View className="items-center pt-16 gap-3">
							<MaterialIcons name="storefront" size={52} color="#CBD5E1" />
							<Text className="text-base font-poppins-bold text-slate-600 dark:text-slate-300">
								{activeFilter === "All" ? "No stores yet" : `No ${FILTER_LABELS[activeFilter]} stores`}
							</Text>
							<Text className="text-sm font-poppins text-slate-400 text-center px-8">
								Pull down to refresh or try another category.
							</Text>
						</View>
					)}
				</ScrollView>
			</View>
		</SafeAreaView>
	);
}
