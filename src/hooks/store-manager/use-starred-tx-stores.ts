import { useCallback, useEffect, useState } from "react";
import {
  loadStarredTransactionStoreIds,
  saveStarredTransactionStoreIds,
} from "@/lib/transactions-starred-stores";

const MAX_STARRED = 24;

export function useStarredTxStores() {
  const [starredIds, setStarredIds] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    void loadStarredTransactionStoreIds().then((ids) => {
      if (!cancelled) setStarredIds(ids);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleStar = useCallback((storeId: number) => {
    setStarredIds((prev) => {
      if (prev.includes(storeId)) {
        const next = prev.filter((id) => id !== storeId);
        void saveStarredTransactionStoreIds(next);
        return next;
      }
      if (prev.length >= MAX_STARRED) {
        return prev;
      }
      const next = [...prev, storeId];
      void saveStarredTransactionStoreIds(next);
      return next;
    });
  }, []);

  const isStarred = useCallback(
    (storeId: number) => starredIds.includes(storeId),
    [starredIds],
  );

  return { starredIds, toggleStar, isStarred };
}
