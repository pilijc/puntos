import React, { useEffect } from "react";
import { Modal } from "@/components/modal";
import { Button } from "@/components/button";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@/components/header";
import { RefreshCcw } from "lucide-react-native";
import { TextField } from "@/components/text-field";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useStaffStore } from "@/store/store-manager/staff-store";
import { useStoreStaffMemberQuery } from "@/hooks/store-manager/rq";
import { storeManagerKeys } from "@/hooks/store-manager/rq/query-keys";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { generateRandomPassword } from "@/utils/store_manager/staff-utils";
import { View, Text, TouchableOpacity, TextInput, SafeAreaView } from "@/tw";
import {
  createStoreStaff,
  updateStoreStaffMember,
} from "@/services/store-manager/staff-service";

const WEB_MAX_WIDTH = 896;

export default function AddStaff() {
  const { t: translate } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { storeId, staffId } = useLocalSearchParams<{
    storeId: string;
    staffId?: string;
  }>();
  const isEditMode = !!staffId;
  const isWeb = Platform.OS === "web";
  const memberQuery = useStoreStaffMemberQuery(
    isEditMode ? staffId : undefined,
  );
  const {
    name,
    email,
    password,
    isSubmitting,
    showConfirm,
    modal,
    nameError,
    emailError,
    setName,
    setEmail,
    setPassword,
    setIsSubmitting,
    setShowConfirm,
    setModal,
    setNameError,
    setEmailError,
    resetStaff,
  } = useStaffStore();

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const emailPattern = /\S+@\S+\.\S+/;

  useEffect(() => {
    return () => resetStaff();
  }, [resetStaff]);

  useEffect(() => {
    if (!isEditMode) {
      setPassword(generateRandomPassword(8));
    }
  }, [isEditMode, setPassword]);

  useEffect(() => {
    if (!isEditMode || !staffId) return;
    if (memberQuery.isError) {
      setModal({
        title: translate("storeManager.staffForm.loadErrorTitle"),
        message: translate("storeManager.staffForm.loadErrorMessage"),
        buttons: [
          {
            label: translate("label.ok"),
            onPress: () => setModal(null),
            variant: "secondary",
          },
        ],
      });
      return;
    }
    if (!memberQuery.data) return;
    const user = memberQuery.data.user as {
      name?: string | null;
      email?: string | null;
    } | null;
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setPassword("");
  }, [
    isEditMode,
    staffId,
    memberQuery.isError,
    memberQuery.data,
    setName,
    setEmail,
    setPassword,
    setModal,
    translate,
  ]);

  const openConfirm = () => {
    const hasNameError = !trimmedName;
    const hasEmailError = !trimmedEmail || !emailPattern.test(trimmedEmail);
    setNameError(hasNameError);
    setEmailError(hasEmailError);
    if (hasNameError || hasEmailError) return;

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
        title: isEditMode
          ? translate("storeManager.staffForm.updatedTitle")
          : translate("storeManager.staffForm.addedTitle"),
        message: isEditMode
          ? translate("storeManager.staffForm.updatedMessage")
          : translate("storeManager.staffForm.addedMessage"),
        buttons: [
          {
            label: translate("label.ok"),
            onPress: () => {
              setModal(null);
            },
            variant: "primary",
          },
        ],
      });
      resetStaff();
      await queryClient.invalidateQueries({
        queryKey: storeManagerKeys.staff(String(storeId)),
      });
      if (isEditMode && staffId) {
        await queryClient.invalidateQueries({
          queryKey: storeManagerKeys.staffMember(staffId),
        });
      }
      router.push({
        pathname: "/(store_manager)/staff",
        params: { storeId },
      });
    } catch (error) {
      setModal({
        title: translate("label.error"),
        message:
          (error as Error).message ??
          translate("storeManager.staffForm.saveError"),
        buttons: [
          {
            label: translate("label.ok"),
            onPress: () => setModal(null),
            variant: "secondary",
          },
        ],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-backgroundMuted dark:bg-darkBackgroundMuted"
    >
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
        timer={modal?.timer ? 3000 : undefined}
      />

      <AppHeader
        title={
          isEditMode
            ? translate("storeManager.staffForm.editTitle")
            : translate("storeManager.staffForm.addTitle")
        }
        description={
          isEditMode
            ? translate("storeManager.staffForm.editDescription")
            : translate("storeManager.staffForm.addDescription")
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
            <View
              style={
                Platform.OS === "web"
                  ? { width: "100%", maxWidth: WEB_MAX_WIDTH }
                  : undefined
              }
            >
              <View className="mx-4 mt-2 mb-4 gap-y-4 rounded-xl border border-slate-100 bg-white p-4 dark:border-darkBorder dark:bg-darkBackgroundCard">
                <View>
                  <Text className="text-sm font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                    {isEditMode
                      ? translate("storeManager.staffForm.profileSectionEdit")
                      : translate("storeManager.staffForm.profileSectionAdd")}
                  </Text>
                  <Text className="text-xs font-poppins text-textSecondary dark:text-darkTextSecondary">
                    {isEditMode
                      ? translate("storeManager.staffForm.profileHintEdit")
                      : translate("storeManager.staffForm.profileHintAdd")}
                  </Text>
                </View>

                {!isEditMode && (
                  <View className="rounded-xl bg-primary/5 p-4 dark:bg-primary-800">
                    <Text className="text-sm font-poppins-semibold text-primary">
                      {translate("storeManager.staffForm.loginInfoTitle")}
                    </Text>
                    <View className="mt-1 gap-y-1">
                      <Text className="text-xs font-poppins text-primary">
                        • {translate("storeManager.staffForm.loginBullet1")}
                      </Text>
                      <Text className="text-xs font-poppins text-primary">
                        • {translate("storeManager.staffForm.loginBullet2")}
                      </Text>
                      <Text className="text-xs font-poppins text-primary">
                        • {translate("storeManager.staffForm.loginBullet3")}
                      </Text>
                      <Text className="text-xs font-poppins text-primary">
                        • {translate("storeManager.staffForm.loginBullet4")}
                      </Text>
                    </View>
                  </View>
                )}

                <TextField
                  label={translate("storeManager.staffForm.fullName")}
                  value={name}
                  onChangeText={(v) => {
                    setName(v);
                    if (v.trim()) setNameError(false);
                  }}
                  placeholder={translate(
                    "storeManager.staffForm.fullNamePlaceholder",
                  )}
                  required={true}
                  error={nameError}
                />
                {nameError && (
                  <Text className="text-xs font-poppins text-red-500 dark:text-red-400 -mt-2">
                    {translate("storeManager.staffForm.fullNameRequiredInline")}
                  </Text>
                )}

                <TextField
                  label={translate("storeManager.staffForm.email")}
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (/\S+@\S+\.\S+/.test(v.trim())) setEmailError(false);
                  }}
                  placeholder={translate(
                    "storeManager.staffForm.emailPlaceholder",
                  )}
                  required={true}
                  error={emailError}
                />
                {emailError && (
                  <Text className="text-xs font-poppins text-red-500 dark:text-red-400 -mt-2">
                    {trimmedEmail
                      ? translate("storeManager.staffForm.invalidEmailMessage")
                      : translate("storeManager.staffForm.emailRequiredInline")}
                  </Text>
                )}

                {!isEditMode && (
                  <View className="gap-y-2">
                    <View className="flex-row items-center justify-between gap-x-0.5">
                      <View className="flex-row items-center gap-x-0.5">
                        <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-darkTextSoft">
                          {translate("storeManager.staffForm.password")}
                        </Text>
                        <Text className="text-xs font-poppins-bold text-red-500">
                          *
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setPassword(generateRandomPassword(8))}
                      >
                        <Text className="text-sm font-poppins text-primary">
                          <RefreshCcw size={14} color="#FF6600" />
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-base font-poppins text-slate-900 dark:border-darkBorder dark:bg-darkBackgroundMuted dark:text-darkTextPrimary"
                      style={{
                        height: 45,
                        lineHeight: 20,
                        paddingVertical: 0,
                        paddingHorizontal: 12,
                        textAlignVertical: "center",
                        includeFontPadding: false,
                        fontSize: 13,
                      }}
                      keyboardType="default"
                      placeholder={translate(
                        "storeManager.staffForm.passwordPlaceholder",
                      )}
                      placeholderTextColor="#94A3B8"
                      value={password}
                    />
                  </View>
                )}

                <View className="gap-y-3">
                  {isWeb ? (
                    <View className="flex-row gap-x-3 justify-center items-center">
                      <Button
                        label={translate("storeManager.staffForm.cancel")}
                        onPress={() => {
                          router.push({
                            pathname: "/(store_manager)/staff",
                            params: { storeId },
                          });
                        }}
                        disabled={isSubmitting}
                        fullWidth={false}
                        variant="secondary"
                      />
                      <Button
                        label={
                          isEditMode
                            ? translate("storeManager.staffForm.saveChanges")
                            : translate("storeManager.staffForm.confirm")
                        }
                        onPress={openConfirm}
                        disabled={isSubmitting}
                        loading={isSubmitting}
                        fullWidth={false}
                        variant="primary"
                      />
                    </View>
                  ) : (
                    <View className="gap-y-3">
                      <Button
                        label={
                          isEditMode
                            ? translate("storeManager.staffForm.saveChanges")
                            : translate("storeManager.staffForm.confirm")
                        }
                        onPress={openConfirm}
                        disabled={isSubmitting}
                        loading={isSubmitting}
                        fullWidth={true}
                        variant="primary"
                        keyboardDismiss={true}
                      />
                      <Button
                        label={translate("label.cancel")}
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
                  )}
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
          <View className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-darkBorder dark:bg-darkBackgroundMuted">
            <Text className="mb-2 text-base font-poppins-bold text-slate-900 dark:text-darkTextPrimary">
              {isEditMode
                ? translate("storeManager.staffForm.confirmEditTitle")
                : translate("storeManager.staffForm.confirmAddTitle")}
            </Text>

            <Text className="mb-4 text-sm font-poppins text-slate-500 dark:text-darkTextMuted">
              {isEditMode
                ? translate("storeManager.staffForm.confirmEditBody")
                : translate("storeManager.staffForm.confirmAddBody")}
            </Text>

            <View className="mb-3 gap-y-1.5">
              <Text className="text-xs font-poppins text-slate-500 dark:text-darkTextMuted">
                {translate("storeManager.staffForm.email")}
              </Text>
              <View className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-darkBorder dark:bg-darkBackgroundCard">
                <Text className="text-sm font-poppins-bold text-slate-900 dark:text-darkTextPrimary">
                  {email}
                </Text>
              </View>
            </View>

            {!isEditMode && (
              <View className="mb-4 gap-y-1.5">
                <Text className="text-xs font-poppins text-slate-500 dark:text-darkTextMuted">
                  {translate("storeManager.staffForm.tempPassword")}
                </Text>
                <View className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-darkBorder dark:bg-darkBackgroundCard">
                  <Text className="text-sm font-poppins-bold text-slate-900 dark:text-darkTextPrimary">
                    {password}
                  </Text>
                </View>
              </View>
            )}

            <View className="mt-2 flex-row gap-x-2">
              <TouchableOpacity
                className="h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 dark:border-darkBorder"
                activeOpacity={0.8}
                onPress={() => setShowConfirm(false)}
              >
                <Text className="text-xs font-poppins-semibold text-slate-600 dark:text-darkTextPrimary">
                  {translate("label.cancel")}
                </Text>
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
                  {isEditMode
                    ? translate("label.saveChanges")
                    : translate("storeManager.staffForm.createStaff")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
