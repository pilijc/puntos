import React, { useState, useCallback } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	ScrollView,
	StyleSheet,
	Alert,
	RefreshControl,
	ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "expo-router";
import { getAllStores, updateStoreStatus, AdminStoreRow } from "@/services/store-service";

// ── Constants ───────────────────────────────────────────────────────────────
const FILTERS = ["All", "pending_review", "active", "inactive"] as const;
type Filter = typeof FILTERS[number];

const FILTER_LABELS: Record<Filter, string> = {
	All: "All",
	pending_review: "Pending Review",
	active: "Active",
	inactive: "Inactive",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
	active: { label: "Active", color: "#16A34A", bg: "#F0FDF4", dot: "#22C55E" },
	pending_review: { label: "Pending Review", color: "#D97706", bg: "#FFFBEB", dot: "#F59E0B" },
	inactive: { label: "Inactive", color: "#64748B", bg: "#F1F5F9", dot: "#94A3B8" },
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

	return (
		<View style={styles.card}>
			{/* ── Top row: logo + info + status badge ── */}
			<View style={{ flexDirection: "row", alignItems: "flex-start" }}>
				<View style={styles.logoBox}>
					{store.logo ? (
						<Image
							source={{ uri: store.logo }}
							style={{ width: 56, height: 56, borderRadius: 14 }}
							contentFit="cover"
						/>
					) : (
						<MaterialIcons name="storefront" size={24} color="#CBD5E1" />
					)}
				</View>

				<View style={{ flex: 1, marginLeft: 12 }}>
					<Text style={styles.storeName} numberOfLines={1}>{store.name}</Text>
					{store.type ? <Text style={styles.storeType}>{store.type}</Text> : null}
					{store.address ? (
						<View style={{ flexDirection: "row", alignItems: "center", marginTop: 3 }}>
							<MaterialIcons name="location-on" size={12} color="#94A3B8" />
							<Text style={styles.storeAddress} numberOfLines={1}>{store.address}</Text>
						</View>
					) : null}
				</View>

				<View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
					<View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
					<Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
				</View>
			</View>

			{/* ── Details section ── */}
			<View style={styles.divider} />
			<View style={{ gap: 6 }}>
				{store.owner_name ? (
					<View style={styles.detailRow}>
						<MaterialIcons name="person" size={13} color="#94A3B8" />
						<Text style={styles.detailText}>{store.owner_name}</Text>
					</View>
				) : null}
				{store.phone ? (
					<View style={styles.detailRow}>
						<MaterialIcons name="phone" size={13} color="#94A3B8" />
						<Text style={styles.detailText}>{store.phone}</Text>
					</View>
				) : null}
				{store.registration_number ? (
					<View style={styles.detailRow}>
						<MaterialIcons name="business" size={13} color="#94A3B8" />
						<Text style={styles.detailText}>{store.registration_number}</Text>
					</View>
				) : null}
				<View style={styles.detailRow}>
					<MaterialIcons name="calendar-today" size={13} color="#94A3B8" />
					<Text style={styles.detailText}>
						{new Date(store.created_at).toLocaleDateString("en-US", {
							month: "short", day: "numeric", year: "numeric",
						})}
					</Text>
				</View>
			</View>

			{/* ── Documents + Action buttons (only for pending) ── */}
			{isPending && (
				<>
					{/* Documents preview */}
					{(store.business_document_image || (store as any).store_pictures?.length) && (
						<>
							<View style={styles.divider} />
							<View style={{ gap: 8 }}>
								<Text style={styles.docsTitle}>Submitted documents</Text>
								<View style={{ flexDirection: "row", gap: 10 }}>
									{store.business_document_image && (
										<View style={styles.docThumb}>
											<Image
												source={{ uri: store.business_document_image }}
												style={{ width: "100%", height: "100%", borderRadius: 12 }}
												contentFit="cover"
											/>
										</View>
									)}
									{(store as any).store_pictures?.slice(0, 3).map((uri: string, idx: number) => (
										<View key={idx} style={styles.docThumb}>
											<Image
												source={{ uri }}
												style={{ width: "100%", height: "100%", borderRadius: 12 }}
												contentFit="cover"
											/>
										</View>
									))}
								</View>
							</View>
						</>
					)}

					{/* Approve / Reject */}
					<View style={styles.divider} />
					<View style={{ flexDirection: "row", gap: 10 }}>
						<TouchableOpacity
							style={[styles.actionBtn, styles.approveBtn]}
							onPress={() => onApprove(store)}
						>
							<MaterialIcons name="check-circle" size={16} color="#16A34A" />
							<Text style={[styles.actionBtnText, { color: "#16A34A" }]}>Approve</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.actionBtn, styles.rejectBtn]}
							onPress={() => onReject(store)}
						>
							<MaterialIcons name="cancel" size={16} color="#DC2626" />
							<Text style={[styles.actionBtnText, { color: "#DC2626" }]}>Reject</Text>
						</TouchableOpacity>
					</View>
				</>
			)}
		</View>
	);
}

// ── Skeleton card ───────────────────────────────────────────────────────────
function SkeletonCard() {
	return (
		<View style={[styles.card, { gap: 12 }]}>
			<View style={{ flexDirection: "row", gap: 12 }}>
				<View style={[styles.logoBox, { backgroundColor: "#F1F5F9" }]} />
				<View style={{ flex: 1, gap: 8 }}>
					<View style={{ height: 14, borderRadius: 7, backgroundColor: "#F1F5F9", width: "60%" }} />
					<View style={{ height: 11, borderRadius: 6, backgroundColor: "#F8FAFC", width: "80%" }} />
				</View>
			</View>
			<View style={{ height: 1, backgroundColor: "#F1F5F9" }} />
			<View style={{ height: 11, borderRadius: 6, backgroundColor: "#F8FAFC", width: "40%" }} />
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

	const filtered = activeFilter === "All"
		? stores
		: stores.filter((s) => s.status === activeFilter);

	const pendingCount = stores.filter((s) => s.status === "pending_review").length;

	return (
		<View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>

			{/* ── Header ── */}
			<View style={styles.header}>
				<View>
					<Text style={styles.headerTitle}>Store Approvals</Text>
					<Text style={styles.headerSub}>
						{loading ? "Loading..." : `${stores.length} total · ${pendingCount} pending`}
					</Text>
				</View>
				{pendingCount > 0 && (
					<View style={styles.pendingBadge}>
						<Text style={styles.pendingBadgeText}>{pendingCount}</Text>
					</View>
				)}
			</View>

			{/* ── Filter tabs ── */}
			<View style={styles.filterBar}>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.filterContent}
				>
					{FILTERS.map((f) => {
						const active = activeFilter === f;
						const count = f === "All" ? stores.length : stores.filter((s) => s.status === f).length;
						return (
							<TouchableOpacity
								key={f}
								onPress={() => setActiveFilter(f)}
								style={[styles.filterPill, active && styles.filterPillActive]}
							>
								<Text style={[styles.filterText, active && styles.filterTextActive]}>
									{FILTER_LABELS[f]}{count > 0 ? ` (${count})` : ""}
								</Text>
							</TouchableOpacity>
						);
					})}
				</ScrollView>
			</View>

			{/* ── Store list ── */}
			<ScrollView
				style={{ flex: 1, backgroundColor: "#F3F4F6" }}
				contentContainerStyle={styles.listContent}
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
					<View style={styles.errorBanner}>
						<MaterialIcons name="error-outline" size={16} color="#DC2626" />
						<Text style={styles.errorText}>{error}</Text>
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
					<View style={styles.emptyState}>
						<MaterialIcons name="storefront" size={48} color="#CBD5E1" />
						<Text style={styles.emptyTitle}>
							{activeFilter === "All" ? "No stores yet" : `No ${FILTER_LABELS[activeFilter]} stores`}
						</Text>
						<Text style={styles.emptySub}>Pull down to refresh.</Text>
					</View>
				)}
			</ScrollView>
		</View>
	);
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 24,
		paddingTop: 70,
		paddingBottom: 16,
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#F1F5F9",
	},
	headerTitle: { fontSize: 20, fontFamily: "Poppins-Bold", color: "#0F172A" },
	headerSub: { fontSize: 12, fontFamily: "Poppins-Regular", color: "#94A3B8", marginTop: 2 },
	pendingBadge: {
		backgroundColor: "#FF6600",
		borderRadius: 12,
		minWidth: 28,
		height: 28,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 8,
	},
	pendingBadgeText: { fontSize: 13, fontFamily: "Poppins-Bold", color: "#FFFFFF" },
	filterBar: { flex: 0, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F1F5F9", height: 56 },
	filterContent: { paddingHorizontal: 20, alignItems: "center", flexDirection: "row", height: 56 },
	filterPill: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 14,
		paddingVertical: 7,
		borderRadius: 9999,
		backgroundColor: "#F3F4F6",
		borderWidth: 1,
		borderColor: "#E2E8F0",
		marginRight: 8,
	},
	filterPillActive: { backgroundColor: "#FF6600", borderColor: "#FF6600" },
	filterText: { fontSize: 12, fontFamily: "Poppins-Medium", color: "#64748B" },
	filterTextActive: { color: "#FFFFFF" },
	filterCount: {
		backgroundColor: "#E2E8F0",
		borderRadius: 9999,
		minWidth: 18,
		height: 18,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 4,
	},
	filterCountActive: { backgroundColor: "#FFFFFF" },
	filterCountText: { fontSize: 10, fontFamily: "Poppins-Bold", color: "#64748B" },
	listContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, flexGrow: 1 },
	card: {
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		padding: 16,
		marginBottom: 14,
		elevation: 0,
		shadowOpacity: 0,
	},
	logoBox: {
		width: 56,
		height: 56,
		borderRadius: 14,
		backgroundColor: "#F1F5F9",
		alignItems: "center",
		justifyContent: "center",
	},
	storeName: { fontSize: 15, fontFamily: "Poppins-Bold", color: "#0F172A" },
	storeType: { fontSize: 11, fontFamily: "Poppins-Medium", color: "#FF6600", marginTop: 2 },
	storeAddress: {
		fontSize: 12, fontFamily: "Poppins-Regular", color: "#94A3B8",
		marginLeft: 2, flex: 1,
	},
	statusBadge: {
		flexDirection: "row", alignItems: "center",
		borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, gap: 4,
	},
	statusDot: { width: 6, height: 6, borderRadius: 3 },
	statusText: { fontSize: 11, fontFamily: "Poppins-Bold" },
	divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 },
	detailRow: { flexDirection: "row", alignItems: "center", gap: 6 },
	detailText: { fontSize: 12, fontFamily: "Poppins-Regular", color: "#475569", flex: 1 },
	actionBtn: {
		flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
		gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5,
	},
	approveBtn: { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
	rejectBtn: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
	actionBtnText: { fontSize: 13, fontFamily: "Poppins-Bold" },
	docsTitle: {
		fontSize: 12,
		fontFamily: "Poppins-Medium",
		color: "#64748B",
	},
	docThumb: {
		width: 72,
		height: 72,
		borderRadius: 12,
		backgroundColor: "#F1F5F9",
		overflow: "hidden",
	},
	errorBanner: {
		flexDirection: "row", alignItems: "center", gap: 8,
		backgroundColor: "#FEF2F2", borderRadius: 12, padding: 12,
		borderLeftWidth: 3, borderLeftColor: "#DC2626",
	},
	errorText: { flex: 1, fontSize: 13, fontFamily: "Poppins-Regular", color: "#DC2626" },
	emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingBottom: 60 },
	emptyTitle: { fontSize: 16, fontFamily: "Poppins-Bold", color: "#0F172A" },
	emptySub: { fontSize: 13, fontFamily: "Poppins-Regular", color: "#94A3B8" },
});
