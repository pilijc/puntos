import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
} from "react-native";
import { View, Text, TouchableOpacity, TextInput } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useRewardStore } from "@/store/store-manager/reward-store";
import { createReward, uploadRewardImage } from "@/services/store-manager/reward-service";
import { Button } from "@/components/button";
import { Modal, type ModalButton } from "@/components/modal";

export default function Rewards() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    title,
    setTitle,
    description,
    setDescription,
    points_cost,
    setPointsCost,
    stock,
    setStock,
    image_url,
    setImageUrl,
    reset,
  } = useRewardStore();
	const [modal, setModal] = useState<{
		title: string;
		message: string;
		buttons: ModalButton[];
	} | null>(null);


  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      setModal({
        title: "Permission Required",
        message: "We need access to your photos to upload images.",
        buttons: [{ label: "OK", onPress: () => setModal(null), variant: "secondary" }],
      });
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      base64: true,
    });

    if (pickerResult.canceled || !pickerResult.assets?.[0]) return;

    const asset = pickerResult.assets[0];
    if (!asset.base64) {
      setModal({
        title: "Oops!",
        message: "Could not read image data. Please try again.",
        buttons: [{ label: "OK", onPress: () => setModal(null), variant: "secondary" }],
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      const mimeType = asset.mimeType ?? "image/jpeg";
      const publicUrl = await uploadRewardImage(storeId, asset.base64, mimeType);
      setImageUrl(publicUrl);
    } catch (err: any) {
      setModal({
        title: "Oops!",
        message: err?.message ?? "Could not upload image.",
        buttons: [{ label: "OK", onPress: () => setModal(null), variant: "secondary" }],
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !description || !image_url) {
      setModal({
        title: "Almost there!",
        message: "Please fill out all required fields and upload an image.",
        buttons: [{ label: "OK", onPress: () => setModal(null), variant: "secondary" }],
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await createReward({
        store_id: storeId,
        title,
        description,
        points_cost,
        image_url,
        stock,
<<<<<<< HEAD:src/app/(store_manager)/rewards.tsx
      });
      reset();
      setModal({
        title: "Success",
        message: "Reward created successfully",
        buttons: [{ label: "OK", onPress: () => setModal(null), variant: "secondary" }],
      });
      router.push({ pathname: "/(store_manager)/view-store/[id]", params: { id: storeId } });
=======
      });
	  setModal({
        title: "Success",
        message: "Reward created successfully",
        buttons: [{ label: "OK", onPress: () => setModal(null), variant: "secondary" }],
      });
      reset();
      router.push({ pathname: "/(store_manager)/reward", params: { storeId } });
>>>>>>> origin/develop:src/app/(store_manager)/reward/add-rewards.tsx
    } catch (error) {
      setModal({
        title: "Error",
        message: (error as Error).message ?? "Failed to create reward",
        buttons: [{ label: "OK", onPress: () => setModal(null), variant: "secondary" }],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      className="bg-background dark:bg-[#111921]"
      behavior={Platform.OS === "android" ? "height" : "padding"}
    >
			<Modal
				visible={!!modal}
				onClose={() => setModal(null)}
				title={modal?.title ?? ""}
				message={modal?.message}
				buttons={modal?.buttons}
			/>
      <View
        className="bg-background dark:bg-[#111921] border-b border-slate-200 dark:border-slate-800 flex-row items-center px-2"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
      >
        <TouchableOpacity
          className="w-10 h-10 rounded-full items-center justify-center"
          activeOpacity={0.7}
          onPress={() => router.push({ pathname: "/(store_manager)/view-store/[id]", params: { id: storeId } })}
        >
          <MaterialIcons name="chevron-left" size={22} color={isDark ? "#F1F5F9" : "#0F172A"} />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-[17px] font-poppins-bold text-slate-900 dark:text-slate-100 pr-10">
          Create New Reward
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 120 }}
      >

       <View className="">
					<View className="p-4">
						<Text className="text-xl font-poppins-bold text-slate-900 dark:text-white">
								Reward Details
						</Text>
						<Text className="text-sm font-poppins text-slate-500 dark:text-slate-400 mt-1">
								Provide an overview of your reward. Explain the benefits for customers and specify any important details or terms of use.
						</Text>
					</View>

					<View className="px-4 gap-y-4">
						<View className="flex-row gap-x-3">
							<View className="flex-1 gap-y-2">
								<View className="flex-row items-center gap-x-0.5">
									<Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
										Title
									</Text>
									<Text className="text-xs font-poppins-bold text-red-500">*</Text>
								</View>
							<TextInput
								className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 text-base font-poppins text-slate-900 dark:text-slate-100"
								placeholder="e.g. Free Signature Coffee"
								placeholderTextColor="#94A3B8"
								value={title}
								onChangeText={setTitle}
							/>
							</View>
						</View>

						<View className="flex-row gap-x-3">
							<View className="flex-1 gap-y-2">
								<View className="flex-row items-center gap-x-0.5">
									<Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
										Points Cost
									</Text>
									<Text className="text-xs font-poppins-bold text-red-500">*</Text>
								</View>
								<TextInput
									className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 text-base font-poppins text-slate-900 dark:text-slate-100"
									placeholder="0"
									placeholderTextColor="#94A3B8"
									keyboardType="numeric"
									value={points_cost ? String(points_cost) : ""}
									onChangeText={(v) => setPointsCost(parseInt(v) || 0)}
								/>
							</View>
							<View className="flex-1 gap-y-2">
								<View className="flex-row items-center gap-x-0.5">
									<Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
										Stocks Available
									</Text>
									<Text className="text-xs font-poppins-bold text-red-500">*</Text>
								</View>
								<TextInput
									className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 text-base font-poppins text-slate-900 dark:text-slate-100"
									placeholder="0"
									placeholderTextColor="#94A3B8"
									keyboardType="numeric"
									value={stock ? String(stock) : ""}
									onChangeText={(v) => setStock(parseInt(v) || 0)}
								/>
							</View>
						</View>

						<View className="gap-y-2">
							<View className="flex-row items-center gap-x-0.5">
								<Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
									Description
								</Text>
								<Text className="text-xs font-poppins-bold text-red-500">*</Text>
							</View>
							<TextInput
								className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 text-base font-poppins text-slate-900 dark:text-slate-100"
								placeholder="Describe the benefit to the user..."
								placeholderTextColor="#94A3B8"
								multiline
								numberOfLines={4}
								value={description}
								onChangeText={setDescription}
								style={{ textAlignVertical: "top", minHeight: 112 }}
							/>
						</View>

						<View className="gap-y-2">
							<View className="flex-row items-center gap-x-0.5">
								<Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
									Reward Image
								</Text>
								<Text className="text-xs font-poppins-bold text-red-500">*</Text>
							</View>
							<TouchableOpacity
								onPress={pickImage}
								activeOpacity={0.7}
								disabled={isUploadingImage}
								className="w-full h-55 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 items-center justify-center gap-y-1"
								>
								{isUploadingImage ? (
										<>
										<ActivityIndicator size="large" color="#94A3B8" />
										<Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 mt-2">
												Uploading image...
										</Text>
										</>
								) : image_url ? (
										<Image
										source={{ uri: image_url }}
										style={{ width: "100%", height: "100%", borderRadius: 12 }}
										contentFit="cover"
										/>
								) : (
										<>
										<MaterialIcons name="image" size={32} color="#94A3B8" />
										<Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 mt-1">
												Upload or tap to choose a photo
										</Text>
										</>
								)}
							</TouchableOpacity>
						</View>

						<View
							className="bg-backgroundMuted dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700"
							style={{ paddingBottom: insets.bottom + 12 }}
						>
							<Button
								label="Create Reward"
								onPress={handleCreate}
								disabled={isSubmitting || isUploadingImage}
								loading={isSubmitting}
								fullWidth={true}
								variant="primary"
								icon="add"
							/>
							{/* <TouchableOpacity
								className="w-full bg-primary rounded-xl py-4 items-center"
								activeOpacity={0.85}
								onPress={handleCreate}
								disabled={isSubmitting || isUploadingImage}
							>
								{isSubmitting ? (
									<ActivityIndicator size="small" color="white" />
								) : (
									<Text className="text-white font-poppins-bold text-[15px]">
										Create Reward
									</Text>
								)}
							</TouchableOpacity> */}
						</View>
					</View>
       	</View>
      </ScrollView>

    </KeyboardAvoidingView>
  );
}
