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

const WEB_MAX_WIDTH = 896;

export default function AddStaff() {
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
        title: "Error",
        message: "Failed to load staff details.",
        buttons: [{ label: "OK", onPress: () => setModal(null), variant: "secondary" }],
      });
    });

    return () => resetStaff();
  }, [isEditMode, staffId, setName, setEmail, setPassword, setModal, resetStaff]);

  const openConfirm = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      setModal({
        title: "Validation Error",
        message: "Please enter both name and email.",
        buttons: [{ label: "OK", onPress: () => setModal(null), variant: "secondary" }],
      });
      return;
    }

    const emailPattern = /\S+@\S+\.\S+/;
    if (!emailPattern.test(trimmedEmail)) {
      setModal({
        title: "Invalid Email",
        message: "Please enter a valid email address.",
        buttons: [{ label: "OK", onPress: () => setModal(null), variant: "secondary" }],
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
        title: isEditMode ? "Staff Updated" : "Staff Added",
        message: isEditMode
          ? "The staff member details were updated successfully."
          : "The staff member has been added successfully.",
        buttons: [
          {
            label: "OK",
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
        title: "Error",
        message: (error as Error).message ?? "Failed to save staff member.",
        buttons: [{ label: "OK", onPress: () => setModal(null), variant: "secondary" }],
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
        title={isEditMode ? "Edit staff" : "Add staff"}
        description={
          isEditMode
            ? "Update name or email for this front desk account"
            : "Create a front desk login for this store"
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
                    {isEditMode ? "Profile & login" : "Front desk access"}
                  </Text>
                  <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
                    {isEditMode
                      ? "Change this person's name or email for their store account."
                      : "They'll use this account at the front desk. You'll share a temporary password after you save."}
                  </Text>
                </View>

                {!isEditMode && (
                  <View className="rounded-xl bg-primary/5 p-4 dark:bg-primary-800">
                    <Text className="text-sm font-poppins-semibold text-primary">Staff Login Information</Text>
                    <View className="mt-1 gap-y-1">
                      <Text className="text-xs font-poppins text-primary">
                        • A temporary password will be created automatically.
                      </Text>
                      <Text className="text-xs font-poppins text-primary">
                        • Please share this password with the front desk staff.
                      </Text>
                      <Text className="text-xs font-poppins text-primary">
                        • They will use it to log in for the first time.
                      </Text>
                      <Text className="text-xs font-poppins text-primary">
                        • After logging in, they will be asked to set a new password.
                      </Text>
                    </View>
                  </View>
                )}

                <TextField
                  label="Full Name"
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Jane Doe"
                  required={true}
                />

                <TextField
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="e.g. jane@example.com"
                  required={true}
                />

                {!isEditMode && (
                  <View className="gap-y-2">
                    <View className="flex-row items-center justify-between gap-x-0.5">
                      <View className="flex-row items-center gap-x-0.5">
                        <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
                          Password
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
                      placeholder="Default password is autogenerated"
                      placeholderTextColor="#94A3B8"
                      value={password}
                    />
                  </View>
                )}

                <View className="gap-y-3" style={{ paddingBottom: insets.bottom }}>
                  <Button
                    label={isEditMode ? "Save Changes" : "Confirm"}
                    onPress={openConfirm}
                    disabled={isSubmitting}
                    loading={isSubmitting}
                    fullWidth={true}
                    variant="primary"
                    keyboardDismiss={true}
                  />
                  <Button
                    label="Cancel"
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
              {isEditMode ? "Confirm Changes" : "Confirm Staff Details"}
            </Text>

            <Text className="mb-4 text-sm font-poppins text-slate-500 dark:text-slate-400">
              {isEditMode
                ? "Please review the details below before saving."
                : "Please review the login details below. Take a screenshot and share them with your frontdesk staff."}
            </Text>

            <View className="mb-3 gap-y-1.5">
              <Text className="text-xs font-poppins text-slate-500 dark:text-slate-400">Email</Text>
              <View className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                <Text className="text-sm font-poppins-bold text-slate-900 dark:text-slate-100">{email}</Text>
              </View>
            </View>

            {!isEditMode && (
              <View className="mb-4 gap-y-1.5">
                <Text className="text-xs font-poppins text-slate-500 dark:text-slate-400">Temporary Password</Text>
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
                <Text className="text-xs font-poppins-semibold text-slate-600 dark:text-slate-200">Cancel</Text>
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
                  {isEditMode ? "Save Changes" : "Create Frontdesk Staff"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
