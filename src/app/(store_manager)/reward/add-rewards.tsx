import { Image } from "expo-image";
import { Button } from "@/components/button";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@/components/header";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import { TextField } from "@/components/text-field";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Modal, type ModalButton } from "@/components/modal";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useRewardStore } from "@/store/store-manager/reward-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Text, TouchableOpacity, TextInput, SafeAreaView } from "@/tw";
import { useStorePremiumCampaignEdit } from "@/hooks/store-manager/use-store-premium-campaign-edit";
import {
  getRewardById,
  upsertReward,
  uploadRewardImage,
} from "@/services/store-manager/reward-service";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";

const WEB_MAX_WIDTH = 896;

export default function Rewards() {
  const { t: translate } = useTranslation();
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
    titleError,
    setTitleError,
    imageError,
    setImageError,
    pointsCostError,
    setPointsCostError,
    stockError,
    setStockError,
    reset,
  } = useRewardStore();
	const [modal, setModal] = useState<{
		title: string;
		message: string;
		buttons: ModalButton[];
	} | null>(null);

  const { canEdit, loading: permLoading } = useStorePremiumCampaignEdit(storeId);

  useEffect(() => {
    if (!storeId || permLoading || canEdit) return;
    router.replace({ pathname: "/(store_manager)/reward", params: { storeId } });
  }, [storeId, permLoading, canEdit, router]);

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
            title: translate("storeManager.rewardForm.notFoundTitle"),
            message: translate("storeManager.rewardForm.notFoundMessage"),
            buttons: [{
              label: translate("label.ok"),
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
          title: translate("storeManager.rewardForm.loadErrorTitle"),
          message: translate("storeManager.rewardForm.loadErrorMessage"),
          buttons: [{
            label: translate("label.ok"),
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
  }, [storeId, rewardId, setTitle, setDescription, setPointsCost, setStock, setImageUrl, reset, router, translate]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      setModal({
        title: translate("storeManager.rewardForm.permissionTitle"),
        message: translate("storeManager.rewardForm.permissionMessage"),
        buttons: [{ label: translate("label.ok"), onPress: () => setModal(null), variant: "secondary" }],
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
        title: translate("label.oops"),
        message: translate("storeManager.rewardForm.readImageErrorMessage"),
        buttons: [{ label: translate("label.ok"), onPress: () => setModal(null), variant: "secondary" }],
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      const mimeType = asset.mimeType ?? "image/jpeg";
      const publicUrl = await uploadRewardImage(storeId, asset.base64, mimeType);
      setImageUrl(publicUrl);
      setImageError(false);
    } catch (err: any) {
      setModal({
        title: translate("label.oops"),
        message: err?.message ?? translate("storeManager.rewardForm.uploadImageError"),
        buttons: [{ label: translate("label.ok"), onPress: () => setModal(null), variant: "secondary" }],
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async () => {
    const hasTitleError = !title.trim();
    const hasImageError = !image_url;
    const hasPointsCostError = !points_cost || points_cost <= 0;
    const hasStockError = !stock || stock <= 0;
    setTitleError(hasTitleError);
    setImageError(hasImageError);
    setPointsCostError(hasPointsCostError);
    setStockError(hasStockError);
    if (hasTitleError || hasImageError || hasPointsCostError || hasStockError) return;
    setIsSubmitting(true);
    try {
      await upsertReward({
        ...(isEditMode && rewardId ? { id: rewardId } : {}),
        store_id: storeId,
        title: title.trim(),
        description: description.trim(),
        points_cost,
        stock,
        image_url,
        is_active: true,
      });
      setModal({
        title: translate("label.success"),
        message: isEditMode ? translate("storeManager.rewardForm.successUpdate") : translate("storeManager.rewardForm.successCreate"),
        buttons: [{ label: translate("label.ok"), onPress: () => setModal(null), variant: "primary" }],
      });
      reset();
      router.push({ pathname: "/(store_manager)/reward", params: { storeId } });
    } catch (error) {
      setModal({
        title: translate("label.error"),
        message: (error as Error).message ?? (isEditMode ? translate("storeManager.rewardForm.errorUpdate") : translate("storeManager.rewardForm.errorCreate")),
        buttons: [{ label: translate("label.ok"), onPress: () => setModal(null), variant: "secondary" }],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-backgroundMuted dark:bg-[#111921]">
			<Modal
				visible={!!modal}
				onClose={() => setModal(null)}
				title={modal?.title ?? ""}
				message={modal?.message}
				buttons={modal?.buttons}
			/>
      <AppHeader
        title={isEditMode ? translate("storeManager.rewardForm.editTitle") : translate("storeManager.rewardForm.createTitle")}
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
          className="bg-white dark:bg-darkBackgroundCard rounded-xl p-4 gap-y-4"
          style={Platform.OS === "web" ? { width: "100%", maxWidth: WEB_MAX_WIDTH } : undefined}
        >
          <View>
            <Text className="text-md font-poppins-semibold text-slate-900 dark:text-white">
              {translate("storeManager.rewardForm.rewardDetails")}
            </Text>
            <Text className="text-sm font-poppins text-slate-500 dark:text-darkTextMuted">
              {translate("storeManager.rewardForm.rewardDetailsBody")}
            </Text>
          </View>

          <TextField
            label={translate("storeManager.rewardForm.title")}
            placeholder={translate("storeManager.rewardForm.titlePlaceholder")}
            value={title}
            onChangeText={(v) => { setTitle(v); if (v.trim()) setTitleError(false); }}
            required
            error={titleError}
          />
          {titleError && (
            <Text className="text-xs font-poppins text-red-500 dark:text-red-400 -mt-3">
              {translate("storeManager.rewardForm.titleRequiredInline")}
            </Text>
          )}

          <View className="flex-row gap-x-3">
            <View className="flex-1">
              <TextField
                label={translate("storeManager.rewardForm.pointsCost")}
                placeholder="0"
                keyboardType="numeric"
                value={points_cost ? String(points_cost) : ""}
                onChangeText={(v) => { const n = parseInt(v, 10) || 0; setPointsCost(n); if (n > 0) setPointsCostError(false); }}
                required
                error={pointsCostError}
              />
              {pointsCostError && (
                <Text className="text-xs font-poppins text-red-500 dark:text-red-400 mt-1">
                  {translate("storeManager.rewardForm.pointsCostRequiredInline")}
                </Text>
              )}
            </View>
            <View className="flex-1">
              <TextField
                label={translate("storeManager.rewardForm.stocksAvailable")}
                placeholder="0"
                keyboardType="numeric"
                value={stock ? String(stock) : ""}
                onChangeText={(v) => { const n = parseInt(v, 10) || 0; setStock(n); if (n > 0) setStockError(false); }}
                required
                error={stockError}
              />
              {stockError && (
                <Text className="text-xs font-poppins text-red-500 dark:text-red-400 mt-1">
                  {translate("storeManager.rewardForm.stockRequiredInline")}
                </Text>
              )}
            </View>
          </View>

          <View className="gap-y-2">
            <View className="flex-row items-center gap-x-0.5">
              <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-darkTextSoft">
                {translate("storeManager.rewardForm.description")}
              </Text>
            </View>
            <TextInput
              className="w-full rounded-xl border border-slate-200 dark:border-darkBorder bg-white dark:bg-darkBackgroundMuted px-4 text-base font-poppins text-slate-900 dark:text-darkTextPrimary pr-12"
              placeholder={translate("storeManager.rewardForm.descriptionPlaceholder")}
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              style={{ textAlignVertical: "top", minHeight: 88, paddingLeft: 12, fontSize: 13, paddingTop: 12 }}
            />
          </View>

          <View className="gap-y-2">
            <View className="flex-row items-center gap-x-0.5">
              <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-darkTextSoft">
                {translate("storeManager.rewardForm.rewardImage")}
              </Text>
              <Text className="text-xs font-poppins-bold text-red-500">*</Text>
            </View>
            <TouchableOpacity
              onPress={pickImage}
              activeOpacity={0.7}
              disabled={isUploadingImage}
              className={`w-full h-55 rounded-xl border border-dashed bg-white dark:bg-darkBackgroundMuted items-center justify-center gap-y-1 ${imageError ? "border-red-500 dark:border-red-500" : "border-slate-300 dark:border-darkBorder"}`}
            >
              {isUploadingImage ? (
                <>
                  <ActivityIndicator size="large" color="#94A3B8" />
                  <Text className="text-xs font-poppins text-slate-400 dark:text-darkTextSecondary mt-2">
                    {translate("storeManager.rewardForm.uploadingImage")}
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
                  <Text className="text-xs font-poppins text-slate-400 dark:text-darkTextSecondary mt-1">
                    {translate("storeManager.rewardForm.uploadPhotoHint")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            {imageError && (
              <Text className="text-xs font-poppins text-red-500 dark:text-red-400">
                {translate("storeManager.rewardForm.imageRequiredInline")}
              </Text>
            )}
          </View>

          <View style={{ paddingBottom: insets.bottom }}>
            <Button
              label={isEditMode ? translate("storeManager.rewardForm.saveChanges") : translate("storeManager.rewardForm.saveReward")}
              onPress={handleSave}
              disabled={isSubmitting || isUploadingImage}
              loading={isSubmitting}
              fullWidth={true}
              variant="primary"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
