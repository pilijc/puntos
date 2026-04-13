import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { View, Text, TouchableOpacity, TextInput } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useRewardStore } from "@/store/store-manager/reward-store";
import { createReward, getRewardById, updateReward, uploadRewardImage } from "@/services/store-manager/reward-service";
import { Button } from "@/components/button";
import { Modal, type ModalButton } from "@/components/modal";
import { AppHeader } from "@/components/header";
import { TextField } from "@/components/text-field";

const WEB_MAX_WIDTH = 896;

export default function Rewards() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId, rewardId } = useLocalSearchParams<{ storeId: string; rewardId?: string }>();
  const isEditMode = !!rewardId;
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

  useEffect(() => {
    if (!storeId) return;
    if (!rewardId) {
      reset();
      return;
    }
    let cancelled = false;
    getRewardById(storeId, rewardId)
      .then((row) => {
        if (cancelled) return;
        if (!row) {
          setModal({
            title: "Error",
            message: "Reward not found.",
            buttons: [{
              label: "OK",
              onPress: () => {
                setModal(null);
                router.push({ pathname: "/(store_manager)/reward", params: { storeId } });
              },
              variant: "secondary",
            }],
          });
          return;
        }
        setTitle(row.title ?? "");
        setDescription(row.description ?? "");
        setPointsCost(row.points_cost ?? 0);
        setStock(row.stock ?? 0);
        setImageUrl(row.image_url ?? "");
      })
      .catch(() => {
        setModal({
          title: "Error",
          message: "Could not load this reward.",
          buttons: [{
            label: "OK",
            onPress: () => {
              setModal(null);
              router.push({ pathname: "/(store_manager)/reward", params: { storeId } });
            },
            variant: "secondary",
          }],
        });
      });
    return () => {
      cancelled = true;
    };
  }, [storeId, rewardId, setTitle, setDescription, setPointsCost, setStock, setImageUrl, reset, router]);

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

  const handleSave = async () => {
    if (!title.trim() || !description?.trim() || !image_url) {
      setModal({
        title: "Almost there!",
        message: "Please fill out all required fields and upload an image.",
        buttons: [{ label: "OK", onPress: () => setModal(null), variant: "secondary" }],
      });
      return;
    }
    setIsSubmitting(true);
    try {
      if (isEditMode && rewardId) {
        await updateReward(storeId, rewardId, {
          title: title.trim(),
          description: description.trim(),
          points_cost,
          stock,
          image_url,
        });
      } else {
        await createReward({
          store_id: storeId,
          title: title.trim(),
          description: description.trim(),
          points_cost,
          image_url,
          stock,
        });
      }
      setModal({
        title: "Success",
        message: isEditMode ? "Reward updated successfully" : "Reward created successfully",
        buttons: [{ label: "OK", onPress: () => setModal(null), variant: "secondary" }],
      });
      reset();
      router.push({ pathname: "/(store_manager)/reward", params: { storeId } });
    } catch (error) {
      setModal({
        title: "Error",
        message: (error as Error).message ?? (isEditMode ? "Failed to update reward" : "Failed to create reward"),
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
      <AppHeader
        title={isEditMode ? "Edit Reward" : "Create New Reward"}
        onBackPress={() => {
          router.push({ pathname: "/(store_manager)/reward", params: { storeId } });
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 120,
          ...(Platform.OS === "web" ? { width: "100%", alignItems: "center" } : null),
        }}
      >
        <View
          className="bg-white dark:bg-neutral-800 rounded-xl p-4 gap-y-4"
          style={Platform.OS === "web" ? { width: "100%", maxWidth: WEB_MAX_WIDTH } : undefined}
        >
          <View>
            <Text className="text-md font-poppins-semibold text-slate-900 dark:text-white">
              Reward Details
            </Text>
            <Text className="text-sm font-poppins text-slate-500 dark:text-slate-400">
              Provide an overview of your reward. Explain the benefits for customers and specify any important details or terms of use.
            </Text>
          </View>

          <TextField
            label="Title"
            placeholder="e.g. Free Signature Coffee"
            value={title}
            onChangeText={setTitle}
            required
          />

          <View className="flex-row gap-x-3">
            <View className="flex-1">
              <TextField
                label="Points Cost"
                placeholder="0"
                keyboardType="numeric"
                value={points_cost ? String(points_cost) : ""}
                onChangeText={(v) => setPointsCost(parseInt(v, 10) || 0)}
                required
              />
            </View>
            <View className="flex-1">
              <TextField
                label="Stocks Available"
                placeholder="0"
                keyboardType="numeric"
                value={stock ? String(stock) : ""}
                onChangeText={(v) => setStock(parseInt(v, 10) || 0)}
                required
              />
            </View>
          </View>

          <View className="gap-y-2">
            <View className="flex-row items-center gap-x-0.5">
              <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
                Description
              </Text>
            </View>
            <TextInput
							className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-base font-poppins text-slate-900 dark:text-slate-100 pr-12"
							placeholder="Describe the benefit to the user"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
							style={{ textAlignVertical: "top", minHeight: 88, paddingLeft: 12, fontSize: 13 }}
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

          <View style={{ paddingBottom: insets.bottom }}>
            <Button
              label={isEditMode ? "Save changes" : "Save Reward"}
              onPress={handleSave}
              disabled={isSubmitting || isUploadingImage}
              loading={isSubmitting}
              fullWidth={true}
              variant="primary"
            />
          </View>
        </View>
      </ScrollView>

    </KeyboardAvoidingView>
  );
}
