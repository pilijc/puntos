import React, { useEffect } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { View, Text, TouchableOpacity, TextInput, SafeAreaView } from "@/tw";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/button";
import { Modal } from "@/components/modal";
import { createStoreStaff, getStoreStaffMember, updateStoreStaffMember } from "@/services/store-manager/staff-service";
import { useStaffStore } from "@/store/store-manager/staff-store";
import { generateRandomPassword } from "@/utils/store_manager/staff-utils";
import { TextField } from "@/components/text-field";
import { RefreshCcw } from "lucide-react-native";
import { AppHeader } from "@/components/header";
import { useTranslation } from "react-i18next";

const WEB_MAX_WIDTH = 896;

export default function AddStaff() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId, staffId } = useLocalSearchParams<{ storeId: string; staffId?: string }>();
  const isEditMode = !!staffId;
  const {
    name,
    email,
    password,
    isSubmitting,
    showConfirm,
    modal,
    setName,
    setEmail,
    setPassword,
    setIsSubmitting,
    setShowConfirm,
    setModal,
    resetStaff,
  } = useStaffStore();

  useEffect(() => {
    const init = async () => {
      if (isEditMode && staffId) {
        const member = await getStoreStaffMember(staffId);
        const user = member?.user as { name?: string | null; email?: string | null } | null;
        setName(user?.name ?? "");
        setEmail(user?.email ?? "");
        setPassword("");
      } else {
        setPassword(generateRandomPassword(8));
      }
    };

    init().catch(() => {
      setModal({
        title: t("store_manager.staffForm.loadErrorTitle"),
        message: t("store_manager.staffForm.loadErrorMessage"),
        buttons: [{ label: t("label.ok"), onPress: () => setModal(null), variant: "secondary" }],
      });
    });

    return () => resetStaff();
  }, [isEditMode, staffId, setName, setEmail, setPassword, setModal, resetStaff, t]);

  const openConfirm = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      setModal({
        title: t("store_manager.staffForm.validationTitle"),
        message: t("store_manager.staffForm.nameEmailRequired"),
        buttons: [{ label: t("label.ok"), onPress: () => setModal(null), variant: "secondary" }],
      });
      return;
    }

    const emailPattern = /\S+@\S+\.\S+/;
    if (!emailPattern.test(trimmedEmail)) {
      setModal({
        title: t("store_manager.staffForm.invalidEmailTitle"),
        message: t("store_manager.staffForm.invalidEmailMessage"),
        buttons: [{ label: t("label.ok"), onPress: () => setModal(null), variant: "secondary" }],
      });
      return;
    }

    setShowConfirm(true);
  };

  const handleCreateStaff = async () => {
    setIsSubmitting(true);
    try {
      if (isEditMode && staffId) {
        await updateStoreStaffMember(staffId, name, email);
      } else {
        await createStoreStaff(storeId, name, email, password);
      }

      setModal({
        title: isEditMode ? t("store_manager.staffForm.updatedTitle") : t("store_manager.staffForm.addedTitle"),
        message: isEditMode
          ? t("store_manager.staffForm.updatedMessage")
          : t("store_manager.staffForm.addedMessage"),
        buttons: [
          {
            label: t("label.ok"),
            onPress: () => {
              setModal(null);
            },
            variant: "primary",
          },
        ],
      });
      resetStaff();
      router.push({
        pathname: "/(store_manager)/staff",
        params: { storeId },
      });
    } catch (error) {
      setModal({
        title: t("label.error"),
        message: (error as Error).message ?? t("store_manager.staffForm.saveError"),
        buttons: [{ label: t("label.ok"), onPress: () => setModal(null), variant: "secondary" }],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-backgroundMuted dark:bg-neutral-900">
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
        timer={modal?.timer ? 3000 : undefined}
      />

      <AppHeader
        title={isEditMode ? t("store_manager.staffForm.editTitle") : t("store_manager.staffForm.addTitle")}
        description={
          isEditMode
            ? t("store_manager.staffForm.editDescription")
            : t("store_manager.staffForm.addDescription")
        }
        onBackPress={() => {
          router.push({
            pathname: "/(store_manager)/staff",
            params: { storeId },
          });
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "android" ? "height" : "padding"}
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: 32,
            paddingTop: 8,
            paddingHorizontal: Platform.OS === "web" ? 16 : 0,
          }}
        >
          <View
            className={Platform.OS === "web" ? "items-center" : ""}
            style={Platform.OS === "web" ? { width: "100%" } : undefined}
          >
            <View style={Platform.OS === "web" ? { width: "100%", maxWidth: WEB_MAX_WIDTH } : undefined}>
              <View className="mx-4 mt-2 mb-4 gap-y-4 rounded-xl border border-slate-100 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
                <View>
                  <Text className="text-sm font-poppins-bold text-slate-800 dark:text-slate-100">
                    {isEditMode ? t("store_manager.staffForm.profileSectionEdit") : t("store_manager.staffForm.profileSectionAdd")}
                  </Text>
                  <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
                    {isEditMode
                      ? t("store_manager.staffForm.profileHintEdit")
                      : t("store_manager.staffForm.profileHintAdd")}
                  </Text>
                </View>

                {!isEditMode && (
                  <View className="rounded-xl bg-primary/5 p-4 dark:bg-primary-800">
                    <Text className="text-sm font-poppins-semibold text-primary">{t("store_manager.staffForm.loginInfoTitle")}</Text>
                    <View className="mt-1 gap-y-1">
                      <Text className="text-xs font-poppins text-primary">
                        • {t("store_manager.staffForm.loginBullet1")}
                      </Text>
                      <Text className="text-xs font-poppins text-primary">
                        • {t("store_manager.staffForm.loginBullet2")}
                      </Text>
                      <Text className="text-xs font-poppins text-primary">
                        • {t("store_manager.staffForm.loginBullet3")}
                      </Text>
                      <Text className="text-xs font-poppins text-primary">
                        • {t("store_manager.staffForm.loginBullet4")}
                      </Text>
                    </View>
                  </View>
                )}

                <TextField
                  label={t("store_manager.staffForm.fullName")}
                  value={name}
                  onChangeText={setName}
                  placeholder={t("store_manager.staffForm.fullNamePlaceholder")}
                  required={true}
                />

                <TextField
                  label={t("label.email")}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t("label.emailPlaceholder")}
                  required={true}
                />

                {!isEditMode && (
                  <View className="gap-y-2">
                    <View className="flex-row items-center justify-between gap-x-0.5">
                      <View className="flex-row items-center gap-x-0.5">
                        <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
                          {t("label.password")}
                        </Text>
                        <Text className="text-xs font-poppins-bold text-red-500">*</Text>
                      </View>
                      <TouchableOpacity onPress={() => setPassword(generateRandomPassword(8))}>
                        <Text className="text-sm font-poppins text-primary">
                          <RefreshCcw size={14} color="#FF6600" />
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-base font-poppins text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      style={{
                        height: 45,
                        lineHeight: 20,
                        paddingVertical: 0,
                        paddingHorizontal: 12,
                        textAlignVertical: "center",
                        includeFontPadding: false,
                      }}
                      keyboardType="default"
                      placeholder={t("label.passwordPlaceholder")}
                      placeholderTextColor="#94A3B8"
                      value={password}
                    />
                  </View>
                )}

                <View className="gap-y-3" style={{ paddingBottom: insets.bottom }}>
                  <Button
                    label={isEditMode ? t("label.saveChanges") : t("store_manager.staffForm.confirm")}
                    onPress={openConfirm}
                    disabled={isSubmitting}
                    loading={isSubmitting}
                    fullWidth={true}
                    variant="primary"
                    keyboardDismiss={true}
                  />
                  <Button
                    label={t("label.cancel")}
                    onPress={() => {
                      router.push({
                        pathname: "/(store_manager)/staff",
                        params: { storeId },
                      });
                    }}
                    disabled={isSubmitting}
                    fullWidth={true}
                    variant="secondary"
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showConfirm && (
        <View
          className="absolute inset-0 items-center justify-center bg-black/40 px-6"
          pointerEvents="box-none"
        >
          <View className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <Text className="mb-2 text-base font-poppins-bold text-slate-900 dark:text-slate-100">
              {isEditMode ? t("store_manager.staffForm.confirmEditTitle") : t("store_manager.staffForm.confirmAddTitle")}
            </Text>

            <Text className="mb-4 text-sm font-poppins text-slate-500 dark:text-slate-400">
              {isEditMode
                ? t("store_manager.staffForm.confirmEditBody")
                : t("store_manager.staffForm.confirmAddBody")}
            </Text>

            <View className="mb-3 gap-y-1.5">
              <Text className="text-xs font-poppins text-slate-500 dark:text-slate-400">{t("label.emailLabel")}</Text>
              <View className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                <Text className="text-sm font-poppins-bold text-slate-900 dark:text-slate-100">{email}</Text>
              </View>
            </View>

            {!isEditMode && (
              <View className="mb-4 gap-y-1.5">
                <Text className="text-xs font-poppins text-slate-500 dark:text-slate-400">{t("store_manager.staffForm.tempPassword")}</Text>
                <View className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                  <Text className="text-sm font-poppins-bold text-slate-900 dark:text-slate-100">{password}</Text>
                </View>
              </View>
            )}

            <View className="mt-2 flex-row gap-x-2">
              <TouchableOpacity
                className="h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600"
                activeOpacity={0.8}
                onPress={() => setShowConfirm(false)}
              >
                <Text className="text-xs font-poppins-semibold text-slate-600 dark:text-slate-200">{t("label.cancel")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="h-11 flex-1 items-center justify-center rounded-xl bg-primary px-2"
                activeOpacity={0.85}
                onPress={async () => {
                  setShowConfirm(false);
                  await handleCreateStaff();
                }}
              >
                <Text className="text-xs font-poppins-semibold text-white">
                  {isEditMode ? t("label.saveChanges") : t("store_manager.staffForm.createStaff")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
