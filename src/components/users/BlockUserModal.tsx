import React, { useState, useEffect, useMemo, useRef } from "react";
import { Image, LayoutAnimation, Platform, UIManager, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { View, Text } from "@/tw";
import { MaterialIcons } from "@expo/vector-icons";
import { Modal } from "@/components/modal";
import { TYPO, COLORS, getBadge } from "./constants";
import { UserRecord } from "@/store/super-admin/user-store";
import { useSuperAdminStoresStore } from "@/store/super-admin/super-admin-stores-store";
// ScrollView from RNGH — works now that modal.tsx puts GestureHandlerRootView at the top
import { ScrollView } from "react-native-gesture-handler";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  const scrollRef = useRef<ScrollView>(null);

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

    const fromAdmin = allAdminStores.filter(s => s.owner_id === selectedUser.id);
    const fromUserStore = Array.isArray(selectedUser.storeInfo) ? selectedUser.storeInfo : [];

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
    const page = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
    setActiveIndex(page);
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={willBlock ? "Block User" : "Unblock User"}
      message={`Are you sure you want to ${willBlock ? "restrict" : "restore"} access for this user?`}
      buttons={[
        { label: "Cancel", onPress: onClose, variant: "secondary" },
        {
          label: willBlock ? "Block User" : "Unblock",
          onPress: onConfirm,
          variant: willBlock ? "danger" : "success",
          loading: updatingUserId === selectedUser?.id,
          disabled: updatingUserId === selectedUser?.id,
        },
      ]}
      dismissOnBackdrop
      showCloseButton
    >
      {selectedUser && (
        <View className="bg-backgroundMuted rounded-2xl p-4 border border-slate-100">
          {/* ── User Info Row ── */}
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-12 rounded-xl overflow-hidden border border-slate-200 mr-3">
              <Image
                source={{ uri: selectedUser.imageUri || selectedUser.avatar }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-poppins-bold text-textPrimary">
                {selectedUser.name}
              </Text>
              <Text className={TYPO.subtitle}>
                {selectedUser.email || selectedUser.displayEmail}
              </Text>
            </View>
            <View className={`px-2.5 py-1 rounded-lg ${getBadge(selectedUser).bg}`}>
              <Text className={`text-[9px] font-poppins-bold uppercase ${getBadge(selectedUser).text}`}>
                {selectedUser.status === "Blocked" ? "Blocked" : roleLabel || "User"}
              </Text>
            </View>
          </View>

          {/* ── Manager: Stores they manage ── */}
          {isManager && stores.length > 0 && (
            <View>
              <View className="flex-row items-center mb-2">
                <MaterialIcons name="business" size={11} color={COLORS.primary} />
                <Text className="text-[10px] font-poppins-bold text-textMuted uppercase tracking-wider ml-1">
                  Managed Stores
                </Text>
                <View className="ml-2 bg-primary/10 px-1.5 py-0.5 rounded-full">
                  <Text className="text-[9px] font-poppins-bold text-primary">
                    {stores.length}
                  </Text>
                </View>
              </View>

              <View
                style={{ width: "100%" }}
                onLayout={(e) => {
                  const w = e.nativeEvent.layout.width;
                  if (w > 0) setCardWidth(w);
                }}
              >
                <ScrollView
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
                      className="bg-white border border-slate-100 rounded-2xl p-3"
                    >
                      <View className="flex-row items-center">
                        <View className="bg-primary/10 p-2 rounded-lg">
                          <MaterialIcons name="storefront" size={16} color={COLORS.primary} />
                        </View>
                        <View className="ml-3 flex-1">
                          <Text className="text-[13px] font-poppins-bold text-textPrimary">
                            {store.name ?? store.store_name ?? "Unnamed Store"}
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
                </ScrollView>

                {/* Dot indicators */}
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
            </View>
          )}

          {/* ── Manager with no stores assigned yet ── */}
          {isManager && stores.length === 0 && (
            <View className="flex-row items-center bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
              <MaterialIcons name="info-outline" size={14} color="#D97706" />
              <Text className="text-[11px] font-poppins-medium text-amber-700 ml-2">
                No stores assigned to this manager yet.
              </Text>
            </View>
          )}

          {/* ── Staff: Branch assignment ── */}
          {isStaff && stores.length > 0 && (
            <View>
              <View className="flex-row items-center mb-2">
                <MaterialIcons name="storefront" size={11} color={COLORS.primary} />
                <Text className="text-[10px] font-poppins-bold text-textMuted uppercase tracking-wider ml-1">
                  Branch Assignment
                </Text>
              </View>
              {stores.map((store: any, i: number) => (
                <View key={store.id ?? store.store_id ?? i} className="bg-white border border-slate-100 rounded-2xl p-3 mb-2">
                  <View className="flex-row items-center mb-1">
                    <View className="bg-primary/10 p-2 rounded-lg">
                      <MaterialIcons name="storefront" size={16} color={COLORS.primary} />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-[13px] font-poppins-bold text-textPrimary">
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
                    <View className="flex-row items-center bg-slate-50 rounded-lg px-2.5 py-1.5 mt-1 border border-slate-100/50">
                      <MaterialIcons name="person" size={12} color={COLORS.primary} />
                      <Text className="text-[10px] font-poppins-bold text-textSecondary ml-1.5 flex-1">
                        {store.ownerName || store.managerName}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </Modal>
  );
}