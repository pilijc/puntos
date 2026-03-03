import React from "react";
import { SafeAreaView, Text, TouchableOpacity, View, Image } from "@/tw";
import { Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { StoreCardData } from "@/type/store";
import { useStoreStore_Superadmin } from "@/store/store-store";

const mockStores: StoreCardData[] = [
	{
		id: "s1",
		name: "The Coffee Foundry",
		address: "Brooklyn, NY",
		owner: "David Miller",
		staff_count: 4,
		is_active: true,
		logo: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300&auto=format&fit=crop&q=60",
		store_pictures: [
			"https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300&auto=format&fit=crop&q=60",
			"https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300&auto=format&fit=crop&q=60",
		],
	},
];

export default function SuperAdminStores() {
	const { stores } = useStoreStore_Superadmin();

	return (
		<SafeAreaView className="flex-1 bg-background px-2">
			<View className="w-full p-4 gap-y-4">
				<View className="flex-row items-center w-full">
					<TouchableOpacity onPress={() => router.back()} className="py-2 pr-2">
						<MaterialIcons name="chevron-left" size={22} color="#0f172a" />
					</TouchableOpacity>
					<View className="flex-1 items-center justify-center absolute left-0 right-0" pointerEvents="none">
						<Text className="text-xl font-poppins-bold text-neutral-900">
							Manage Stores
						</Text>
					</View>
					<View className="w-6" />
				</View>

				{mockStores.map((store, i) => (
					<View key={store.id ?? i} className="w-full rounded-xl bg-white border border-gray-100 p-4">
						<View className="flex-row items-start">
							<Image
								source={{ uri: store.logo }}
								className="w-20 h-20 rounded-xl bg-slate-100"
							/>
							<View className="flex-1 ml-3 justify-center min-w-0">
								<View className="flex-row items-center justify-between gap-2">
									<Text className="text-lg font-poppins-bold text-neutral-900 flex-1" numberOfLines={1}>
										{store.name}
									</Text>
									<View
										className={`px-2.5 py-1 rounded-full flex-shrink-0 ${store.is_active ? "bg-green-100" : "bg-amber-100"
											}`}
									>
										<Text
											className={`text-xs font-poppins-bold uppercase ${store.is_active ? "text-green-700" : "text-amber-700"
												}`}
										>
											{store.is_active ? "Active" : "Inactive"}
										</Text>
									</View>
									<TouchableOpacity
										onPress={() => {
											Alert.alert("Store options", undefined, [
												{ text: "Cancel", style: "cancel" },
												{
													text: "View Details",
													onPress: () => router.push(`/(super_admin)/stores/${store.id}`),
												},
												{
													text: "Deactivate",
													style: "destructive",
													onPress: () => {
														Alert.alert(
															"Deactivate Store",
															"Are you sure you want to deactivate this store?",
															[
																{ text: "Cancel", style: "cancel" },
																{
																	text: "Deactivate",
																	style: "destructive",
																	onPress: () => router.push(`/(super_admin)/stores/${store.id}`),
																},
															]
														);
													},
												},
											]);
										}}
										className="p-1 -m-1"
										hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
									>
										<MaterialIcons name="more-vert" size={20} color="#64748B" />
									</TouchableOpacity>
								</View>
								<View className="flex-row items-center mt-1">
									<Text className="text-xs font-poppins text-neutral-500 ml-1" numberOfLines={1}>
										{store.address}
									</Text>
								</View>
							</View>
						</View>

					</View>
				))}
			</View>
		</SafeAreaView>
	);
}
