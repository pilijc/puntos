import React from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "@/tw";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function SuperAdminUsers() {
	return (
		<SafeAreaView className="flex-1 bg-background px-2">
			<View className="w-full p-4 gap-y-4">
				<View className="flex-row items-center w-full">
					<TouchableOpacity onPress={() => router.back()} className="py-2 pr-2">
						<MaterialIcons name="chevron-left" size={22} color="#0f172a" />
					</TouchableOpacity>
					<View className="flex-1 items-center justify-center absolute left-0 right-0" pointerEvents="none">
						<Text className="text-xl font-poppins-bold text-neutral-900">
							Manage Users
						</Text>
					</View>
					<View className="w-6" />
				</View>
			</View>
		</SafeAreaView>
	);
}
