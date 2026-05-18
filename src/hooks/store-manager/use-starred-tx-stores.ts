import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  loadStarredTransactionStoreIds,
  MAX_STARRED_TX_STORES,
  normalizeStarredStoreIds,
  saveStarredTransactionStoreIds,
} from "@/lib/transactions-starred-stores";

function capStarredIds(ids: number[]): number[] {
  return normalizeStarredStoreIds(ids).slice(0, MAX_STARRED_TX_STORES);
}

function mergeStarredIds(persisted: number[], inMemory: number[]): number[] {
  const a = capStarredIds(persisted);
  const b = capStarredIds(inMemory);
  if (b.length === 0) return a;
  if (a.length === 0) return b;
  return capStarredIds([...new Set([...a, ...b])]);
}

function sameStarredIdList(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

export type ToggleStarResult = "added" | "removed" | "limit_reached" | "unchanged";

export function useStarredTxStores(availableStoreIds?: number[]) {
  const [starredIds, setStarredIds] = useState<number[]>([]);
  const hydratedRef = useRef(false);
  const lastPrunedStoreIdsKeyRef = useRef<string | null>(null);

  const storeIdsKey = useMemo(() => {
    if (!availableStoreIds?.length) return "";
    return [...availableStoreIds].sort((a, b) => a - b).join(",");
  }, [availableStoreIds]);

  const isAtStarLimit = starredIds.length >= MAX_STARRED_TX_STORES;

  useEffect(() => {
    let cancelled = false;
    void loadStarredTransactionStoreIds().then((ids) => {
      if (cancelled || hydratedRef.current) return;
      hydratedRef.current = true;
      setStarredIds((prev) => mergeStarredIds(ids, prev));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!storeIdsKey) return;
    if (lastPrunedStoreIdsKeyRef.current === storeIdsKey) return;
    lastPrunedStoreIdsKeyRef.current = storeIdsKey;

    const allowed = new Set(
      storeIdsKey.split(",").map((part) => Number(part)).filter((id) => Number.isFinite(id)),
    );

    setStarredIds((prev) => {
      const normalized = capStarredIds(prev);
      const next = normalized.filter((id) => allowed.has(id));
      if (sameStarredIdList(next, normalized)) {
        return sameStarredIdList(normalized, normalizeStarredStoreIds(prev)) ? prev : normalized;
      }
      void saveStarredTransactionStoreIds(next);
      return next;
    });
  }, [storeIdsKey]);

  const toggleStar = useCallback((storeId: number): ToggleStarResult => {
    const id = Number(storeId);
    if (!Number.isFinite(id) || id <= 0) return "unchanged";

    let result: ToggleStarResult = "unchanged";

    setStarredIds((prev) => {
      const normalized = capStarredIds(prev);
      const isStarred = normalized.some((starredId) => starredId === id);

      if (isStarred) {
        const next = normalized.filter((starredId) => Number(starredId) !== id);
        if (next.length === normalized.length) {
          result = "unchanged";
          return normalized;
        }
        void saveStarredTransactionStoreIds(next);
        result = "removed";
        return next;
      }

      if (normalized.length >= MAX_STARRED_TX_STORES) {
        result = "limit_reached";
        return prev;
      }

      const next = capStarredIds([...normalized, id]);
      void saveStarredTransactionStoreIds(next);
      result = "added";
      return next;
    });

    return result;
  }, []);

  const isStarred = useCallback(
    (storeId: number) => {
      const id = Number(storeId);
      return starredIds.some((starredId) => starredId === id);
    },
    [starredIds],
  );

  const canStarStore = useCallback(
    (storeId: number) => {
      const id = Number(storeId);
      if (isStarred(id)) return true;
      return starredIds.length < MAX_STARRED_TX_STORES;
    },
    [isStarred, starredIds.length],
  );

  return {
    starredIds,
    toggleStar,
    isStarred,
    canStarStore,
    isAtStarLimit,
    maxStarred: MAX_STARRED_TX_STORES,
  };
}
