import React, { useState, useEffect } from "react";
import { Text, View, SafeAreaView } from "@/tw";
import { RefreshControl, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { getCompleteUserHistory } from "@/services/user/history-service";
import { supabase } from "@/supabase/supabase";
import { useTranslation } from "react-i18next";

// Import separated components
import HistoryHeader from "@/components/users/history/HistoryHeader";
import HistoryRow from "@/components/users/history/HistoryRow";
import HistorySkeleton, { HistoryEmptyState } from "@/components/users/history/HistorySkeleton";
import SectionLabel from "@/components/users/history/SectionLabel";

export default function History() {
  const [activeTab, setActiveTab] = useState(0);
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const { t: translate, i18n } = useTranslation();
  const router = useRouter();

  const fetchTransactionHistory = async (isRefresh: boolean = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      
      const currentOffset = isRefresh ? 0 : offset;
      const result = await getCompleteUserHistory(user.id, 10, currentOffset);
      
      if (isRefresh) {
        setTransactionHistory(result.transactions);
        setOffset(10);
      } else {
        setTransactionHistory(prev => [...prev, ...result.transactions]);
        setOffset(prev => prev + result.transactions.length);
      }
      
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("Error fetching transaction history:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { fetchTransactionHistory(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactionHistory(true);
    setRefreshing(false);
  };
  
  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    await fetchTransactionHistory(false);
  };

  const parsePoints = (value: string) => Number(value.replace(/[+\-]/g, ""));

  const filteredData = transactionHistory.filter((item) => {
    const matchesTab =
      activeTab === 0 ? true
        : activeTab === 1 ? item.type === "earned"
          : item.type === "claimed";
    return matchesTab;
  });

  const totalEarned = transactionHistory
    .filter((i) => i.type === "earned")
    .reduce((sum, i) => sum + parsePoints(i.points), 0);

  const totalSpent = transactionHistory
    .filter((i) => i.type === "claimed")
    .reduce((sum, i) => sum + parsePoints(i.points), 0);

  const sections = [...new Set(filteredData.map((item) => item.section))] as string[];

  const renderFooter = () => {
    return (
      <View>
        {loadingMore && (
          <View className="py-4 items-center">
            <Text className="text-sm font-poppins text-neutral-400 dark:text-darkTextSecondary">
              Loading more...
            </Text>
          </View>
        )}
        {/* Footer */}
        <View className="items-center pt-2 pb-4">
          <Text className="text-[10px] tracking-[2px] text-neutral-300 font-poppins-medium">
            {translate("label.poweredBy")}
          </Text>
        </View>
      </View>
    );
  };

  const handleNavigateToStore = (storeId: string, transactionType: string) => {
    if (transactionType === 'claimed') {
      router.push('store/redemption-code');
    } else {
      router.push(`store/${storeId}`);
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const currentItem = filteredData[index];
    const previousItem = filteredData[index - 1];
    const showSectionLabel = !previousItem || previousItem.section !== currentItem.section;
    
    return (
      <View>
        {showSectionLabel && <SectionLabel label={currentItem.section} />}
        <HistoryRow 
          {...item} 
          storeId={item.storeId}
          transactionType={item.transactionType}
          onPress={() => handleNavigateToStore(item.storeId, item.transactionType)}
        />
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-backgroundMuted dark:bg-darkBackground" edges={["top", "left", "right"]}>
      <View className="flex-1 px-4">
        <FlatList
          data={filteredData}
          keyExtractor={(item, index) => `${item.transactionType}-${item.id}-${index}`}
          ListHeaderComponent={
            <HistoryHeader
              totalEarned={totalEarned}
              totalSpent={totalSpent}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          }
          ListFooterComponent={renderFooter}
          ListEmptyComponent={loading ? HistorySkeleton : HistoryEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF6600"
              colors={["#FF6600"]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={renderItem}
        />
      </View>
    </SafeAreaView>
  );
}
