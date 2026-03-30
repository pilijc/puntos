import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Platform, Pressable, useColorScheme } from "react-native";
import { View, Text, TouchableOpacity } from "@/tw";
import { Image } from "expo-image";
import { Gift, X, Check } from "lucide-react-native";
import { useRouter } from "expo-router";
import { getRewardsByStoreIdPage } from "@/services/store-manager/reward-service";
import type { Reward } from "@/type/store-manager/reward";
import { RewardPickerModalProps } from "@/type/store-manager/stamp";

export function RewardPickerModal({
  visible,
  storeId,
  selectedRewardId,
  onClose,
  onSelect,
}: RewardPickerModalProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [items, setItems] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const nextPageRef = useRef(0);
  const PAGE_SIZE = 15;

  const mutedIconColor = isDark ? "#737373" : "#94A3B8"; 
  const emptyIconColor = isDark ? "#737373" : "#94A3B8"; 

  const loadInitial = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    nextPageRef.current = 0;
    try {
      const first = await getRewardsByStoreIdPage(storeId, 0, PAGE_SIZE);
      setItems(first);
      setHasMore(first.length === PAGE_SIZE);
      nextPageRef.current = 1;
    } catch {
      setItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (!visible || !storeId) return;
    setItems([]);
    setHasMore(true);
    void loadInitial();
  }, [visible, storeId, loadInitial]);

  const loadMore = useCallback(async () => {
    if (!storeId || loadingMore || !hasMore) return;
    const page = nextPageRef.current;
    setLoadingMore(true);
    try {
      const next = await getRewardsByStoreIdPage(storeId, page, PAGE_SIZE);
      setItems((prev) => [...prev, ...next]);
      setHasMore(next.length === PAGE_SIZE);
      nextPageRef.current = page + 1;
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [storeId, loadingMore, hasMore]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute top-0 left-0 right-0 bottom-0 bg-black/50" onPress={onClose} />

        <View
          style={{ maxHeight: "88%", paddingBottom: Platform.OS === "ios" ? 28 : 16 }}
          className={isDark ? "rounded-t-2xl bg-darkBackgroundCard" : "rounded-t-2xl bg-background"}
        >
          <View className="flex-row items-center justify-between px-4 py-2">
            <Text className="text-base font-poppins-bold text-textPrimary dark:text-darkTextPrimary">Choose a reward</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.8} className="p-2" hitSlop={8 as any}>
              <X size={22} color={mutedIconColor} />
            </TouchableOpacity>
          </View>

          <Text className="px-4 pb-2 text-xs font-poppins text-textMuted dark:text-darkTextMuted">
            Scroll to load more ({PAGE_SIZE} per page).
          </Text>

          {loading ? (
            <View className="h-[180px] items-center justify-center">
              <ActivityIndicator size="large" color="#FF6600" />
            </View>
          ) : items.length === 0 ? (
            <View className="px-6 py-10 items-center justify-center">
              <Gift size={40} color={emptyIconColor} />
              <Text className="text-base mt-3 font-poppins-semibold text-textSecondary dark:text-darkTextSecondary">
                No rewards yet
              </Text>
              <Text className="text-sm mt-2 text-center font-poppins text-textMuted dark:text-darkTextMuted">
                Create a reward first, then pick it here.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  onClose();
                  router.push({ pathname: "/(store_manager)/reward", params: { storeId } });
                }}
                className="mt-4 bg-primary rounded-xl px-6 py-3"
              >
                <Text className="text-white text-xs font-poppins-bold">Create a Reward</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(r) => String(r.id ?? `r-${r.title}`)}
              renderItem={({ item }) => {
                const id = item.id != null ? String(item.id) : "";
                const selected = id !== "" && String(selectedRewardId) === id;

                return (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className={`mb-2 flex-row items-center justify-between rounded-xl border px-3 py-3 ${
                      selected
                        ? "bg-primary/10 border-primary/20 dark:border-primary/30"
                        : "bg-background dark:bg-darkBackgroundCard border-gray-200 dark:border-darkBorder"
                    }`}
                  >
                    {item.image_url ? (
                      <Image
                        source={{ uri: item.image_url }}
                        style={{ width: 44, height: 44, borderRadius: 10 }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="w-11 h-11 rounded-xl items-center justify-center bg-backgroundMuted dark:bg-darkBackgroundMuted">
                        <Gift size={20} color="#FF6600" />
                      </View>
                    )}

                    <View className="flex-1 ml-3 mr-2">
                      <Text
                        className="text-sm font-poppins-semibold text-textPrimary dark:text-darkTextPrimary"
                        numberOfLines={2}
                      >
                        {item.title}
                      </Text>
                      <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">
                        {item.points_cost} pts
                      </Text>
                    </View>

                    {selected ? (
                      <View className="w-6 h-6 rounded-full items-center justify-center bg-primary border-2 border-primary">
                        <Check size={12} color="#FFFFFF" />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
              onEndReached={() => {
                if (!loading && hasMore && !loadingMore) void loadMore();
              }}
              onEndReachedThreshold={0.35}
              ListFooterComponent={
                loadingMore ? (
                  <View className="py-4 items-center">
                    <ActivityIndicator size="small" color="#FF6600" />
                  </View>
                ) : null
              }
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
