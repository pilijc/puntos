import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, useColorScheme, ActivityIndicator } from "react-native";
import { View, Text, TouchableOpacity, ScrollView } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getStoreStaff, deleteStoreStaff } from "@/services/store-manager/staff-service";
import { Modal, type ModalButton } from "@/components/modal";

type StaffMember = Awaited<ReturnType<typeof getStoreStaff>>[number];

export default function ViewStaff() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [modal, setModal] = useState<{
    title: string;
    message: string;
    buttons: ModalButton[];
  } | null>(null);

  const fetchStaff = useCallback(async () => {
    try {
      const data = await getStoreStaff(storeId);
      setStaff(data ?? []);
    } catch {
      setStaff([]);
    }
  }, [storeId]);

  useEffect(() => {
    setLoading(true);
    fetchStaff().finally(() => setLoading(false));
  }, [fetchStaff]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStaff();
    setRefreshing(false);
  }, [fetchStaff]);

  const confirmDelete = (staffId: string, name: string | null) => {
    setModal({
      title: "Remove Staff",
      message: `Are you sure you want to remove ${name ?? "this staff member"}? This action cannot be undone.`,
      buttons: [
        {
          label: "Cancel",
          onPress: () => setModal(null),
          variant: "secondary",
        },
        {
          label: "Remove",
          onPress: async () => {
            setModal(null);
            setDeleting(staffId);
            try {
              await deleteStoreStaff(staffId);
              setStaff((prev) => prev.filter((m) => m.id !== staffId));
            } catch {
              setModal({
                title: "Error",
                message: "Failed to remove staff member. Please try again.",
                buttons: [{ label: "OK", onPress: () => setModal(null), variant: "secondary" }],
              });
            } finally {
              setDeleting(null);
            }
          },
          variant: "primary",
        },
      ],
    });
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const avatarColors = [
    "#FF6600", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444",
  ];
  const getAvatarColor = (index: number) => avatarColors[index % avatarColors.length];

  return (
    <View className="flex-1 bg-backgroundMuted dark:bg-neutral-900">
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
      />
      <View
        className="bg-background dark:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-700"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
      >
        <View className="flex-row items-center px-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center"
            activeOpacity={0.7}
          >
            <MaterialIcons name="chevron-left" size={22} color={isDark ? "#F1F5F9" : "#0F172A"} />
          </TouchableOpacity>

          <View className="flex-1 items-center justify-center -ml-10">
            <Text className="text-md font-poppins-bold text-textPrimary dark:text-textPrimary">
              Staff
            </Text>
            <Text className="text-xs font-poppins text-textMuted dark:text-textMuted -mt-1">
              Frontdesk team members
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#FF6600"]}
            tintColor="#FF6600"
          />
        }
      >
        <View className="mx-4 mt-2 mb-4 flex-row items-center bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 px-4 py-3 gap-x-3">
          <View className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950 items-center justify-center">
            <MaterialCommunityIcons name="account-group" size={20} color="#FF6600" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-poppins-bold text-slate-800 dark:text-slate-100">
              {loading ? "—" : `${staff.length} member${staff.length !== 1 ? "s" : ""}`}
            </Text>
            <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
              Frontdesk staff assigned to this store
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(store_manager)/staff/add-staff",
                params: { storeId },
              })
            }
            className="flex-row items-center gap-x-0.5"
            activeOpacity={0.7}
          >
            <Text className="text-xs font-poppins-semibold text-primary">Add</Text>
            <MaterialIcons name="chevron-right" size={14} color="#FF6600" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center py-16">
            <ActivityIndicator size="large" color="#FF6600" />
            <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 mt-3">
              Loading staff...
            </Text>
          </View>
        ) : staff.length === 0 ? (
          <View className="mx-4 bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 px-4 py-14 items-center gap-y-2">
            <MaterialCommunityIcons name="account-off-outline" size={36} color="#CBD5E1" />
            <Text className="text-sm font-poppins-semibold text-slate-400 dark:text-slate-500">
              No staff yet
            </Text>
            <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 text-center px-6">
              Add frontdesk staff who can assist customers and handle daily store tasks.
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(store_manager)/staff/add-staff",
                  params: { storeId },
                })
              }
              className="mt-2 bg-primary px-5 py-2.5 rounded-xl"
              activeOpacity={0.85}
            >
              <Text className="text-xs font-poppins-semibold text-white">Add First Staff</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="mx-4 bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 overflow-hidden">
            {staff.map((member, index) => {
              const user = member.user as unknown as { id: string; name: string | null; email: string } | null;
              const isLast = index === staff.length - 1;
              return (
                <View key={member.id}>
                  <View className="flex-row items-center px-4 py-3.5 gap-x-3">
                    <View
                      style={{ backgroundColor: getAvatarColor(index) }}
                      className="w-10 h-10 rounded-full items-center justify-center"
                    >
                      <Text style={{ color: "#fff", fontSize: 13, fontFamily: "Poppins-SemiBold" }}>
                        {getInitials(user?.name)}
                      </Text>
                    </View>

                    <View className="flex-1">
                      <Text className="text-sm font-poppins-semibold text-slate-800 dark:text-slate-100 leading-5">
                        {user?.name ?? "—"}
                      </Text>
                      <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">
                        {user?.email ?? "—"}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-x-1">
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() =>
                          router.push({
                            pathname: "/(store_manager)/staff/add-staff",
                            params: { storeId, staffId: member.id },
                          })
                        }
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-neutral-700 items-center justify-center"
                      >
                        <MaterialIcons name="edit" size={15} color={isDark ? "#94A3B8" : "#64748B"} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        disabled={deleting === member.id}
                        onPress={() => confirmDelete(member.id, user?.name ?? null)}
                        className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950 items-center justify-center"
                      >
                        {deleting === member.id ? (
                          <ActivityIndicator size={13} color="#EF4444" />
                        ) : (
                          <MaterialIcons name="delete-outline" size={15} color="#EF4444" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {!isLast && (
                    <View className="mx-4 h-px bg-slate-100 dark:bg-neutral-700" />
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
