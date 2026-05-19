import { Modal } from "@/components/modal";
import { useTranslation } from "react-i18next";
import { AppHeader } from "@/components/header";
import { useQueryClient } from "@tanstack/react-query";
import { useStoreStaffQuery } from "@/hooks/store-manager/rq";
import React, { useCallback, useEffect, useState } from "react";
import { getInitials } from "@/utils/store_manager/staff-utils";
import { useStaffStore } from "@/store/store-manager/staff-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RefreshControl, useColorScheme, Platform } from "react-native";
import { storeManagerKeys } from "@/hooks/store-manager/rq/query-keys";
import { deleteStoreStaff } from "@/services/store-manager/staff-service";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from "@/tw";
import StaffSkeleton from "@/components/skeleton/store_manager/staff-skeleton";
import { UsersRound, Pencil, Trash, UserRoundX, Plus } from "lucide-react-native";

const WEB_MAX_WIDTH = 896;

export default function ViewStaff() {
  const { t: translate } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const isDark = useColorScheme() === "dark";
  const { modal, setModal } = useStaffStore();
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data, isPending, isRefetching, refetch } = useStoreStaffQuery(storeId);
  const staff = data ?? [];
  const loading = isPending;
  const refreshing = isRefetching && !isPending;

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const confirmDelete = (staffMemberId: string, name: string | null) => {
    const displayName = name ?? translate("store_manager.staff.removeFallbackName");
    setModal({
      title: translate("storeManager.staff.removeTitle"),
      message: translate("storeManager.staff.removeMessage", { name: displayName }),
      buttons: [
        {
          label: translate("label.cancel"),
          onPress: () => setModal(null),
          variant: "secondary",
          disabled: deleting === staffMemberId,
        },
        {
          label: translate("storeManager.staff.removeAction"),
          variant: "primary",
          onPress: async () => {
            setDeleting(staffMemberId);
            setModal({
              title: translate("storeManager.staff.removeTitle"),
              message: translate("storeManager.staff.removeMessage", { name: displayName }),
              buttons: [
                {
                  label: translate("label.cancel"),
                  onPress: () => setModal(null),
                  variant: "secondary",
                  disabled: true,
                },
                {
                  label: translate("storeManager.staff.removeAction"),
                  onPress: async () => {},
                  variant: "primary",
                  loading: true,
                  disabled: true,
                },
              ],
            });
            try {
              await deleteStoreStaff(staffMemberId);
              await queryClient.invalidateQueries({
                queryKey: storeManagerKeys.staff(String(storeId)),
              });
              setModal(null);
            } catch {
              setModal({
                title: translate("storeManager.staff.removeFailedTitle"),
                message: translate("storeManager.staff.removeFailedMessage"),
                buttons: [{ label: translate("label.ok"), onPress: () => setModal(null), variant: "secondary" }],
              });
            } finally {
              setDeleting(null);
            }
          },
        },
      ],
    });
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-backgroundMuted dark:bg-darkBackgroundMuted">
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
      />
      <AppHeader
        title={translate("storeManager.staff.title")}
        description={translate("storeManager.staff.description")}
        onBackPress={() => {
          router.push(`/(store_manager)/view-store/${storeId}`);
        }}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 32,
          paddingTop: 8,
          paddingHorizontal: Platform.OS === "web" ? 16 : 0,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#FF6600"]}
            tintColor="#FF6600"
          />
        }
      >
        <View className={Platform.OS === "web" ? "items-center" : ""} style={Platform.OS === "web" ? { width: "100%" } : undefined}>
          <View style={Platform.OS === "web" ? { width: "100%", maxWidth: WEB_MAX_WIDTH } : undefined}>
            <View className="mx-4 mt-2 mb-4 flex-row items-center bg-white dark:bg-darkBackgroundCard rounded-xl border border-slate-100 dark:border-darkBorder px-4 py-3 gap-x-3">
              <View className="w-10 h-10 items-center justify-center">
                <UsersRound size={20} color="#FF6600" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-poppins-bold text-slate-800 dark:text-darkTextPrimary">
                  {loading ? "—" : translate("storeManager.staff.memberCount", { count: staff.length })}
                </Text>
                <Text className="text-xs font-poppins text-slate-400 dark:text-darkTextSecondary">{translate("storeManager.staff.subtitle")}</Text>
              </View>
              {staff.length > 0 && (
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/(store_manager)/staff/add-staff",
                      params: { storeId },
                    })
                  }
                  className="flex-row items-center gap-x-1"
                  activeOpacity={0.7}
                >
                  <Text className="text-xs font-poppins-semibold text-primary">{translate("label.add")}</Text>
                  <Plus size={14} color="#FF6600" strokeWidth={3} style={{ marginTop: -1.5 }}/>
                </TouchableOpacity>
              )}
            </View>

            {loading ? (
              <StaffSkeleton />
            ) : staff.length === 0 ? (
              <View className="mx-4 bg-white dark:bg-darkBackgroundCard rounded-xl border border-slate-100 dark:border-darkBorder px-4 py-14 items-center gap-y-2">
                <UserRoundX size={36} color="#CBD5E1" />
                <Text className="text-sm font-poppins-semibold text-slate-400 dark:text-darkTextSecondary">{translate("storeManager.staff.emptyTitle")}</Text>
                <Text className="text-xs font-poppins text-slate-400 dark:text-darkTextSecondary text-center px-6">
                  {translate("storeManager.staff.emptyBody")}
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
                  <Text className="text-xs font-poppins-semibold text-white">{translate("storeManager.staff.addFirst")}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="mx-4 bg-white dark:bg-darkBackgroundCard rounded-xl border border-slate-100 dark:border-darkBorder overflow-hidden">
                {staff.map((member, index) => {
                  const user = member.user as unknown as { id: string; name: string | null; email: string } | null;
                  const isLast = index === staff.length - 1;
                  return (
                    <View key={member.id}>
                      <View className="flex-row items-center px-4 py-3.5 gap-x-3">
                        <View className="w-10 h-10 rounded-full items-center justify-center bg-primary/10">
                          <Text className="text-sm font-poppins-bold text-primary">{getInitials(user?.name)}</Text>
                        </View>

                        <View className="flex-1">
                          <Text className="text-sm font-poppins-semibold text-slate-800 dark:text-darkTextPrimary leading-5">
                            {user?.name ?? "—"}
                          </Text>
                          <Text className="text-xs font-poppins text-slate-400 dark:text-darkTextSecondary">{user?.email ?? "—"}</Text>
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
                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-darkBackgroundMuted items-center justify-center"
                          >
                            <Pencil size={12} color={isDark ? "#94A3B8" : "#64748B"} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            disabled={!!deleting}
                            onPress={() => confirmDelete(member.id, user?.name ?? null)}
                            className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950 items-center justify-center"
                          >
                            <Trash size={12} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {!isLast && <View className="mx-4 h-px bg-slate-100 dark:bg-darkBackgroundMuted" />}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
