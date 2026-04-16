import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Modal as RNModal,
  Pressable,
  useColorScheme,
  View as RNView,
  StyleSheet,
} from "react-native";
import { ScrollView as GestureScrollView } from "react-native-gesture-handler";
import { ScrollView } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import { MaterialIcons } from "@expo/vector-icons";
import { UsersModal as Modal } from "@/components/users/UsersModal";
import { Button } from "@/components/button";
import { TYPO, COLORS, getBadge } from "@/type/super-admin/user";
import { UserRecord } from "@/store/super-admin/user-store";
import { useSuperAdminStoresStore } from "@/store/super-admin/super-admin-stores-store";
import { useTranslation } from "react-i18next";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const isWeb = Platform.OS === "web";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MODAL_WIDTH = Math.min(SCREEN_WIDTH - 32, 420);
const CONTENT_WIDTH = MODAL_WIDTH - 40;

interface BlockUserModalProps {
  visible: boolean;
  selectedUser: UserRecord | null;
  willBlock: boolean;
  updatingUserId: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

// ── Shared store card, used in both web and mobile ──
function StoreCard({ store, translate }: { store: any; translate: any }) {
  return (
    <View className="bg-white dark:bg-darkBackgroundMuted border border-slate-100 dark:border-darkBorder rounded-2xl p-3 mb-3">
      <View className="flex-row items-center">
        <View className="bg-primary/10 p-2 rounded-lg">
          <MaterialIcons name="storefront" size={16} color={COLORS.primary} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-[13px] font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
            {store.name ?? store.store_name ?? translate("superAdmin.users.unnamedStore")}
          </Text>
          {(store.phone ?? store.contact_number ?? store.phoneNumber) ? (
            <View className="flex-row items-center mt-1">
              <MaterialIcons name="phone" size={10} color={COLORS.primary} />
              <Text className="text-[10px] font-poppins text-textMuted ml-1">
                {store.phone ?? store.contact_number ?? store.phoneNumber}
              </Text>
            </View>
          ) : null}
          {(store.address ?? store.location) ? (
            <View className="flex-row items-center mt-0.5">
              <MaterialIcons name="location-on" size={10} color={COLORS.primary} />
              <Text
                className="text-[10px] font-poppins text-textMuted ml-1 flex-1"
                numberOfLines={1}
              >
                {store.address ?? store.location}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

// ── The inner content (user card + stores) shared between web drawer and mobile modal ──
function UserContent({
  selectedUser,
  isManager,
  isStaff,
  stores,
  activeIndex,
  cardWidth,
  setCardWidth,
  hasMore,
  scrollRef,
  handleScroll,
  translate,
}: any) {
  return (
    <View className="bg-backgroundMuted dark:bg-darkBackground rounded-2xl p-4 border border-slate-100 dark:border-darkBorder">
      {/* ── User Info Row ── */}
      <View className="flex-row items-center mb-3">
        <View className="w-10 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-darkBorder mr-3">
          <Image
            source={(selectedUser.imageUri || selectedUser.avatar) ? { uri: selectedUser.imageUri || selectedUser.avatar } : require("@/assets/images/role-user.png")}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </View>
        <View className="flex-1">
          <Text className="text-[14px] font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
            {selectedUser.name}
          </Text>
          <Text className={`${TYPO.subtitle} dark:text-darkTextSecondary`}>
            {selectedUser.email || selectedUser.displayEmail}
          </Text>
        </View>
        <View className={`px-2.5 py-1 rounded-lg ${getBadge(selectedUser).bg}`}>
          <Text className={`text-[9px] font-poppins-bold uppercase ${getBadge(selectedUser).text}`}>
            {selectedUser.status === "Blocked"
              ? translate("superAdmin.users.status.blocked", { defaultValue: "Blocked" })
              : selectedUser.roleLabel
              ? translate(`superAdmin.users.roles.${selectedUser.roleLabel.toLowerCase().replace(/[\s-]/g, "")}`, { defaultValue: selectedUser.roleLabel })
              : translate("superAdmin.users.roles.user", { defaultValue: "User" })}
          </Text>
        </View>
      </View>

      {/* ── Manager: Stores ── */}
      {isManager && stores.length > 0 && (
        <View>
          <View className="flex-row items-center mb-2">
            <MaterialIcons name="business" size={11} color={COLORS.primary} />
            <Text className="text-[10px] font-poppins-bold text-textMuted uppercase tracking-wider ml-1">
              {translate("superAdmin.users.managedStores")}
            </Text>
            <View className="ml-2 bg-primary/10 px-1.5 py-0.5 rounded-full">
              <Text className="text-[9px] font-poppins-bold text-primary">
                {stores.length}
              </Text>
            </View>
          </View>

          {isWeb ? (
            // Web: vertical stacked list — no swipe
            <View>
              {stores.map((store: any, i: number) => (
                <StoreCard key={store.id ?? store.store_id ?? i} store={store} translate={translate} />
              ))}
            </View>
          ) : (
            // Mobile: original horizontal paging carousel
            <View
              style={{ width: "100%" }}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w > 0) setCardWidth(w);
              }}
            >
              <GestureScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={handleScroll}
                bounces={false}
              >
                {stores.map((store: any, i: number) => (
                  <View
                    key={store.id ?? store.store_id ?? i}
                    style={{ width: cardWidth > 0 ? cardWidth : CONTENT_WIDTH }}
                    className="bg-white dark:bg-darkBackgroundMuted border border-slate-100 dark:border-darkBorder rounded-2xl p-3"
                  >
                    <View className="flex-row items-center">
                      <View className="bg-primary/10 p-2 rounded-lg">
                        <MaterialIcons name="storefront" size={16} color={COLORS.primary} />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-[13px] font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                          {store.name ?? store.store_name ?? translate("superAdmin.users.unnamedStore")}
                        </Text>
                        {(store.phone ?? store.contact_number ?? store.phoneNumber) ? (
                          <View className="flex-row items-center mt-1">
                            <MaterialIcons name="phone" size={10} color={COLORS.primary} />
                            <Text className="text-[10px] font-poppins text-textMuted ml-1">
                              {store.phone ?? store.contact_number ?? store.phoneNumber}
                            </Text>
                          </View>
                        ) : null}
                        {(store.address ?? store.location) ? (
                          <View className="flex-row items-center mt-0.5">
                            <MaterialIcons name="location-on" size={10} color={COLORS.primary} />
                            <Text
                              className="text-[10px] font-poppins text-textMuted ml-1 flex-1"
                              numberOfLines={1}
                            >
                              {store.address ?? store.location}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>
                ))}
              </GestureScrollView>
              {/* Dot indicators — mobile only */}
              {hasMore && (
                <View className="flex-row items-center justify-center pt-2">
                  {stores.map((_: any, i: number) => (
                    <View
                      key={i}
                      style={{
                        width: 6, height: 6, borderRadius: 3,
                        marginHorizontal: 2,
                        backgroundColor: i === activeIndex ? COLORS.primary : `${COLORS.primary}33`,
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* ── Manager with no stores ── */}
      {isManager && stores.length === 0 && (
        <View className="flex-row items-center bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl px-3 py-2.5">
          <MaterialIcons name="info-outline" size={14} color="#D97706" />
          <Text className="text-[11px] font-poppins-medium text-amber-700 dark:text-amber-500 ml-2">
            {translate("superAdmin.users.noStoresAssigned")}
          </Text>
        </View>
      )}

      {/* ── Staff: Branch assignment ── */}
      {isStaff && stores.length > 0 && (
        <View>
          <View className="flex-row items-center mb-2">
            <MaterialIcons name="storefront" size={11} color={COLORS.primary} />
            <Text className="text-[10px] font-poppins-bold text-textMuted uppercase tracking-wider ml-1">
              {translate("superAdmin.users.branchAssignment")}
            </Text>
          </View>
          {stores.map((store: any, i: number) => (
            <View key={store.id ?? store.store_id ?? i} className="bg-white dark:bg-darkBackgroundMuted border border-slate-100 dark:border-darkBorder rounded-2xl p-3 mb-2">
              <View className="flex-row items-center mb-1">
                <View className="bg-primary/10 p-2 rounded-lg">
                  <MaterialIcons name="storefront" size={16} color={COLORS.primary} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-[13px] font-poppins-bold text-textPrimary dark:text-darkTextPrimary">
                    {store.name ?? store.store_name ?? "Unnamed Store"}
                  </Text>
                  {(store.phone ?? store.contact_number) ? (
                    <View className="flex-row items-center mt-0.5">
                      <MaterialIcons name="phone" size={10} color={COLORS.primary} />
                      <Text className="text-[10px] font-poppins text-textMuted ml-1">
                        {store.phone ?? store.contact_number}
                      </Text>
                    </View>
                  ) : null}
                  {(store.address ?? store.location) ? (
                    <View className="flex-row items-center mt-0.5">
                      <MaterialIcons name="location-on" size={10} color={COLORS.primary} />
                      <Text className="text-[10px] font-poppins text-textMuted ml-1 flex-1" numberOfLines={1}>
                        {store.address ?? store.location}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
              {(store.ownerName || store.managerName) && (
                <View className="flex-row items-center bg-slate-50 dark:bg-darkBackground rounded-lg px-2.5 py-1.5 mt-1 border border-slate-100/50 dark:border-darkBorder">
                  <MaterialIcons name="person" size={12} color={COLORS.primary} />
                  <Text className="text-[10px] font-poppins-bold text-textSecondary dark:text-darkTextSecondary ml-1.5 flex-1">
                    {store.ownerName || store.managerName}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function BlockUserModal({
  visible,
  selectedUser,
  willBlock,
  updatingUserId,
  onClose,
  onConfirm,
}: BlockUserModalProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const scrollRef = useRef<GestureScrollView>(null);
  const { t: translate } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const allAdminStores = useSuperAdminStoresStore(s => s.stores);
  const fetchAdminStores = useSuperAdminStoresStore(s => s.fetchStores);

  const roleLabel = (selectedUser?.roleLabel ?? "").trim();
  const roleLower = roleLabel.toLowerCase();
  const isManager = roleLower.includes("manager");
  const isStaff = roleLower.includes("staff");

  useEffect(() => {
    if (visible && isManager) {
      fetchAdminStores();
      setActiveIndex(0);
      scrollRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [visible, isManager, selectedUser?.id]);

  const stores = useMemo(() => {
    if (!selectedUser) return [];

    const fromAdmin = allAdminStores.filter(s => s.owner_id === selectedUser.id && s.status !== "inactive");
    const fromUserStore = Array.isArray(selectedUser.storeInfo)
      ? selectedUser.storeInfo.filter((s: any) => s.status && s.status !== "inactive")
      : [];

    const merged = [...fromAdmin];
    fromUserStore.forEach(us => {
      const exists = merged.some(m => m.name === us.name || (m.address && m.address === us.address));
      if (!exists) merged.push(us);
    });

    return merged as any[];
  }, [selectedUser, allAdminStores]);

  const hasMore = stores.length > 1;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (cardWidth <= 0) return;
    setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / cardWidth));
  };

  const sharedContentProps = {
    selectedUser,
    isManager,
    isStaff,
    stores,
    activeIndex,
    cardWidth,
    setCardWidth,
    hasMore,
    scrollRef,
    handleScroll,
    translate,
  };

  // ── Web: right-side drawer that slides in, fully scrollable ──
  if (isWeb) {
    if (!visible || !selectedUser) return null;

    const actionLabel = willBlock
      ? translate("superAdmin.users.blockModal.blockAction")
      : translate("superAdmin.users.blockModal.unblockAction");

    return (
      <RNView style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        {/* Backdrop */}
        <Pressable
          style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.3)" }]}
          onPress={onClose}
        />

        {/* Drawer panel — fixed right side, full height */}
        <RNView
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: 420,
            backgroundColor: isDark ? "#1a1a1a" : "#f8fafc",
            borderLeftWidth: 1,
            borderLeftColor: isDark ? "#333" : "#e2e8f0",
            shadowColor: "#000",
            shadowOffset: { width: -4, height: 0 },
            shadowOpacity: 0.12,
            shadowRadius: 20,
          }}
        >
          {/* Drawer header — fixed */}
          <RNView
            style={{
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: isDark ? "#333" : "#e2e8f0",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
            }}
          >
            <Text
              style={{
                fontSize: 17,
                fontFamily: "Poppins-Bold",
                color: isDark ? "#f8fafc" : "#0f172a",
              }}
            >
              {willBlock
                ? translate("superAdmin.users.blockModal.blockTitle")
                : translate("superAdmin.users.blockModal.unblockTitle")}
            </Text>
            <Pressable
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isDark ? "#2a2a2a" : "#f1f5f9",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcons name="close" size={18} color={isDark ? "#94a3b8" : "#64748b"} />
            </Pressable>
          </RNView>

          {/* Drawer body — scrollable */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
            showsVerticalScrollIndicator={true}
          >
            {/* Confirmation message */}
            <Text
              style={{
                fontSize: 13,
                fontFamily: "Poppins-Regular",
                color: "#64748b",
                marginBottom: 16,
                lineHeight: 20,
              }}
            >
              {willBlock
                ? translate("superAdmin.users.blockModal.blockMessage")
                : translate("superAdmin.users.blockModal.unblockMessage")}
            </Text>

            {/* User info + stores */}
            <UserContent {...sharedContentProps} />
          </ScrollView>

          {/* Drawer footer — fixed at bottom */}
          <RNView
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: 20,
              backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
              borderTopWidth: 1,
              borderTopColor: isDark ? "#333" : "#e2e8f0",
              flexDirection: "row",
              gap: 12,
            }}
          >
            <RNView style={{ flex: 1 }}>
              <Button
                label={translate("label.cancel")}
                onPress={onClose}
                variant="secondary"
                fullWidth
              />
            </RNView>
            <RNView style={{ flex: 1 }}>
              <Button
                label={actionLabel}
                onPress={onConfirm}
                variant={willBlock ? "danger" : "success"}
                loading={updatingUserId === selectedUser?.id}
                disabled={updatingUserId === selectedUser?.id}
                fullWidth
              />
            </RNView>
          </RNView>
        </RNView>
      </RNView>
    );
  }

  // ── Mobile: original centered modal (unchanged) ──
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={willBlock
        ? translate("superAdmin.users.blockModal.blockTitle")
        : translate("superAdmin.users.blockModal.unblockTitle")}
      message={willBlock
        ? translate("superAdmin.users.blockModal.blockMessage")
        : translate("superAdmin.users.blockModal.unblockMessage")}
      buttons={[
        { label: translate("label.cancel"), onPress: onClose, variant: "secondary" },
        {
          label: willBlock
            ? translate("superAdmin.users.blockModal.blockAction")
            : translate("superAdmin.users.blockModal.unblockAction"),
          onPress: onConfirm,
          variant: willBlock ? "danger" : "success",
          loading: updatingUserId === selectedUser?.id,
          disabled: updatingUserId === selectedUser?.id,
        },
      ]}
      dismissOnBackdrop
      showCloseButton
    >
      {selectedUser && <UserContent {...sharedContentProps} />}
    </Modal>
  );
}