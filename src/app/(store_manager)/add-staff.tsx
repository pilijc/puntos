import React, { useState, useEffect } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, useColorScheme } from "react-native";
import { View, Text, TouchableOpacity, TextInput } from "@/tw";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/button";
import { Modal, type ModalButton } from "@/components/modal";
import { createStoreStaff } from "@/services/store-manager/staff-service";
import { useStaffStore } from "@/store/store-manager/staff-store";

function generateRandomPassword(length: number = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789";
  let pwd = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    pwd += chars[idx];
  }
  return pwd;
}

export default function AddStaff() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { name, email, password, setName, setEmail, setPassword, resetStaff } = useStaffStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

  const [modal, setModal] = useState<{
    title: string;
    message: string;
    buttons: ModalButton[];
    timer?: boolean;
  } | null>(null);

  useEffect(() => {
    setPassword(generateRandomPassword(8));
  }, []);

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
      await createStoreStaff(storeId, name, email, password);
      setModal({
        title: "Staff Added",
        message: "The staff member has been added successfully. ",
        buttons: [
          {
            label: "OK",
            onPress: () =>
              router.push({
                pathname: "/(store_manager)/view-store/[id]",
                params: { id: storeId },
              }),
            variant: "primary",
          },
        ],
        timer: true,
      });
      resetStaff();
    } catch (error) {
      setModal({
        title: "Error",
        message: (error as Error).message ?? "Failed to add staff member.",
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
        timer={modal?.timer ? 3000 : undefined}
      />

      <View
        className="bg-background dark:bg-[#111921] border-b border-slate-200 dark:border-slate-800 flex-row items-center px-2"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
      >
        <TouchableOpacity
          className="w-10 h-10 rounded-full items-center justify-center"
          activeOpacity={0.7}
          onPress={() =>
            router.push({
              pathname: "/(store_manager)/view-store/[id]",
              params: { id: storeId },
            })
          }
        >
          <MaterialIcons name="chevron-left" size={22} color={isDark ? "#F1F5F9" : "#0F172A"} />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-[17px] font-poppins-bold text-slate-900 dark:text-slate-100 pr-10">
          Create Frontdesk Staff
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 14 }}
      >
        <View>
          <Text className="text-xl font-poppins-bold text-slate-900 dark:text-slate-100">
            Frontdesk Staff
          </Text>
          <Text className="text-sm font-poppins text-slate-500 dark:text-slate-400 mt-1">
            Add a frontdesk staff member who can help your store, assist customers, and handle daily store tasks.
          </Text>
        </View>

				<View className="bg-primary/5 dark:bg-primary-800 rounded-xl px-2 py-3 gap-y-2">
					<Text className="text-sm font-poppins-semibold text-primary">
						Staff Login Information
					</Text>
					<View className="gap-y-1">
						<Text className="text-sm text-primary font-poppins">
							• A temporary password will be created automatically.
						</Text>
						<Text className="text-sm text-primary font-poppins">
							• Please share this password with the front desk staff.
						</Text>
						<Text className="text-sm text-primary font-poppins">
							• They will use it to log in for the first time.
						</Text>
						<Text className="text-sm text-primary font-poppins">
							• After logging in, they will be asked to set a new password.
						</Text>
					</View>
        </View>

        <View className="gap-y-2">
          <View className="flex-row items-center gap-x-0.5">
            <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
              Full Name
            </Text>
            <Text className="text-xs font-poppins-bold text-red-500">*</Text>
          </View>
          <TextInput
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 text-base font-poppins text-slate-900 dark:text-slate-100"
            placeholder="e.g. Jane Doe"
            placeholderTextColor="#94A3B8"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View className="gap-y-2">
          <View className="flex-row items-center gap-x-0.5">
            <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
              Email
            </Text>
            <Text className="text-xs font-poppins-bold text-red-500">*</Text>
          </View>
          <TextInput
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 text-base font-poppins text-slate-900 dark:text-slate-100"
            placeholder="e.g. jane@example.com"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View className="gap-y-2">
          <View className="flex-row items-center gap-x-0.5 justify-between">
            <View className="flex-row items-center gap-x-0.5">
              <Text className="text-sm font-poppins-semibold text-slate-700 dark:text-slate-300">
                Password
              </Text>
              <Text className="text-xs font-poppins-bold text-red-500">*</Text>
            </View>
            <TouchableOpacity
              onPress={() => setPassword(generateRandomPassword(8))}
            >
              <Text className="text-primary text-sm font-poppins">Generate Password</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 text-base font-poppins text-slate-900 dark:text-slate-100"
            placeholder="Default password is autogenerated"
            placeholderTextColor="#94A3B8"
            value={password}
          />
        </View>

        <View className="gap-y-3">
          <Button
            label="Confirm"
            onPress={openConfirm}
            disabled={isSubmitting}
            loading={isSubmitting}
            fullWidth={true}
            variant="primary"
						keyboardDismiss={true}
          />
          <Button
            label="Cancel"
            onPress={() =>
              router.push({
                pathname: "/(store_manager)/view-store/[id]",
                params: { id: storeId },
              })
            }
            disabled={isSubmitting}
            fullWidth={true}
            variant="secondary"
          />
        </View>
      </ScrollView>

			{showConfirm && (
				<View
					className="absolute inset-0 bg-black/40 items-center justify-center px-6"
					pointerEvents="box-none"
				>
					<View className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 shadow-2xl">
						<Text className="text-base font-poppins-bold text-slate-900 dark:text-slate-100 mb-2">
							Confirm Staff Details
						</Text>

						<Text className="text-sm font-poppins text-slate-500 dark:text-slate-400 mb-4">
							Please review the login details below. Take a screenshot and share them with your frontdesk staff.
						</Text>

						<View className="mb-3 gap-y-1.5">
							<Text className="text-xs font-poppins text-slate-500 dark:text-slate-400">
								Email
							</Text>
							<View className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2">
								<Text className="text-sm font-poppins-bold text-slate-900 dark:text-slate-100">
									{email}
								</Text>
							</View>
						</View>

						<View className="mb-4 gap-y-1.5">
							<Text className="text-xs font-poppins text-slate-500 dark:text-slate-400">
								Temporary Password
							</Text>
							<View className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2">
								<Text className="text-sm font-poppins-bold text-slate-900 dark:text-slate-100">
									{password}
								</Text>
							</View>
						</View>

						<View className="flex-row gap-x-2 mt-2">
							<TouchableOpacity
								className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-600 items-center justify-center"
								activeOpacity={0.8}
								onPress={() => setShowConfirm(false)}
							>
								<Text className="text-sm font-poppins-semibold text-slate-600 dark:text-slate-200">
									Cancel
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								className="flex-1 h-11 rounded-xl bg-primary items-center justify-center"
								activeOpacity={0.85}
								onPress={async () => {
									setShowConfirm(false);
									await handleCreateStaff();
								}}
							>
								<Text className="text-sm font-poppins-semibold text-white">
								 Create Frontdesk Staff
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			)}
    </KeyboardAvoidingView>
  );
}
