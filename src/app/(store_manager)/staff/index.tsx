import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, useColorScheme, Platform } from "react-native";
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { getStoreStaff, deleteStoreStaff } from "@/services/store-manager/staff-service";
import { Modal } from "@/components/modal";
import { useStaffStore, useStaffViewStore } from "@/store/store-manager/staff-store";
import { ChevronRight, UsersRound, Pencil, Trash, UserRoundX } from "lucide-react-native";
import StaffSkeleton from "@/components/skeleton/store_manager/staff-skeleton";
import { getInitials } from "@/utils/store_manager/staff-utils";
import { AppHeader } from "@/components/header";
import { useTranslation } from "react-i18next";

const WEB_MAX_WIDTH = 896;

export default function ViewStaff() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const isDark = useColorScheme() === "dark";
  const { modal, setModal } = useStaffStore();
  const {
    staff,
    loading,
    refreshing,
    deleting,
    setStaff,
    setLoading,
    setRefreshing,
    setDeleting,
    removeStaff,
    reset,
  } = useStaffViewStore();

  const fetchStaff = useCallback(async () => {
    try {
      const data = await getStoreStaff(storeId);
      setStaff(data ?? []);
    } catch {
      setStaff([]);
    }
  }, [storeId, setStaff]);

  useEffect(() => {
    return () => reset();
  }, [reset]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchStaff().finally(() => setLoading(false));
    }, [fetchStaff, setLoading])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStaff();
    setRefreshing(false);
  }, [fetchStaff, setRefreshing]);

  const confirmDelete = (staffId: string, name: string | null) => {
    const displayName = name ?? t("store_manager.staff.removeFallbackName");
    setModal({
      title: t("store_manager.staff.removeTitle"),
      message: t("store_manager.staff.removeMessage", { name: displayName }),
      buttons: [
        {
          label: t("label.cancel"),
          onPress: () => setModal(null),
          variant: "secondary",
          disabled: deleting === staffId,
        },
        {
          label: t("store_manager.staff.removeAction"),
          variant: "primary",
          onPress: async () => {
            setDeleting(staffId);
            setModal({
              title: t("store_manager.staff.removeTitle"),
              message: t("store_manager.staff.removeMessage", { name: displayName }),
              buttons: [
                {
                  label: t("label.cancel"),
                  onPress: () => setModal(null),
                  variant: "secondary",
                  disabled: true,
                },
                {
                  label: t("store_manager.staff.removeAction"),
                  onPress: async () => {},
                  variant: "primary",
                  loading: true,
                  disabled: true,
                },
              ],
            });
            try {
              await deleteStoreStaff(staffId);
              removeStaff(staffId);
              setModal(null);
            } catch {
              setModal({
                title: t("store_manager.staff.removeFailedTitle"),
                message: t("store_manager.staff.removeFailedMessage"),
                buttons: [{ label: t("label.ok"), onPress: () => setModal(null), variant: "secondary" }],
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
    <SafeAreaView edges={["top"]} className="flex-1 bg-backgroundMuted dark:bg-neutral-900">
      <Modal
        visible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title ?? ""}
        message={modal?.message}
        buttons={modal?.buttons}
      />
      <AppHeader
        title={t("store_manager.staff.title")}
        description={t("store_manager.staff.description")}
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
            <View className="mx-4 mt-2 mb-4 flex-row items-center bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 px-4 py-3 gap-x-3">
              <View className="w-10 h-10 items-center justify-center">
                <UsersRound size={20} color="#FF6600" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-poppins-bold text-slate-800 dark:text-slate-100">
                  {loading ? "—" : t("store_manager.staff.memberCount", { count: staff.length })}
                </Text>
                <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">{t("store_manager.staff.subtitle")}</Text>
              </View>
              {staff.length > 0 && (
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
                  <Text className="text-xs font-poppins-semibold text-primary">{t("label.add")}</Text>
                  <ChevronRight size={14} color="#FF6600" />
                </TouchableOpacity>
              )}
            </View>

            {loading ? (
              <StaffSkeleton />
            ) : staff.length === 0 ? (
              <View className="mx-4 bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700 px-4 py-14 items-center gap-y-2">
                <UserRoundX size={36} color="#CBD5E1" />
                <Text className="text-sm font-poppins-semibold text-slate-400 dark:text-slate-500">{t("store_manager.staff.emptyTitle")}</Text>
                <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500 text-center px-6">
                  {t("store_manager.staff.emptyBody")}
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
                  <Text className="text-xs font-poppins-semibold text-white">{t("store_manager.staff.addFirst")}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="mx-4 bg-white dark:bg-neutral-800 rounded-xl overflow-hidden">
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
                          <Text className="text-sm font-poppins-semibold text-slate-800 dark:text-slate-100 leading-5">
                            {user?.name ?? "—"}
                          </Text>
                          <Text className="text-xs font-poppins text-slate-400 dark:text-slate-500">{user?.email ?? "—"}</Text>
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

                      {!isLast && <View className="mx-4 h-px bg-slate-100 dark:bg-neutral-700" />}
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
