import { supabase } from "@/supabase/supabase";
import { getUserTransactionHistory } from "./qr-service";
import { getUserVoucherTransactionHistory } from "./voucher-service";
import { getRewardRedemptionHistory } from "./rewards-history-service";
import { logger } from "@/utils/logger";

export async function getCompleteUserHistory(
  userId: string, 
  limit: number = 10, 
  offset: number = 0
): Promise<{ transactions: any[], hasMore: boolean }> {
  try {
    const [qrHistory, voucherHistory, redemptionHistory] = await Promise.all([
      getUserTransactionHistory(userId),
      getUserVoucherTransactionHistory(userId),
      getRewardRedemptionHistory(userId)
    ]);

    // Combine all transactions
    const allTransactions = [
      ...qrHistory,
      ...voucherHistory,
      ...redemptionHistory
    ];

    // Sort by date (most recent first)
    const sortedTransactions = allTransactions.sort((a, b) => 
      new Date(b.time).getTime() - new Date(a.time).getTime()
    );

    // Apply pagination on the sorted results
    const paginatedTransactions = sortedTransactions.slice(offset, offset + limit);
    const hasMore = offset + limit < sortedTransactions.length;

    return {
      transactions: paginatedTransactions,
      hasMore
    };

  } catch (error) {
    logger.error("Error fetching complete user history:", error);
    return { transactions: [], hasMore: false };
  }
}
 