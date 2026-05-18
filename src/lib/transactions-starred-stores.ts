import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "transactions_starred_store_ids_v1";

export const MAX_STARRED_TX_STORES = 10;

export function normalizeStarredStoreIds(values: unknown): number[] {
  if (!Array.isArray(values)) return [];
  const ids: number[] = [];
  for (const value of values) {
    const id =
      typeof value === "number"
        ? value
        : typeof value === "string"
          ? Number(value)
          : NaN;
    if (Number.isFinite(id) && id > 0 && !ids.includes(id)) {
      ids.push(id);
    }
  }
  return ids;
}

export async function loadStarredTransactionStoreIds(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return normalizeStarredStoreIds(JSON.parse(raw));
  } catch {
    return [];
  }
}

export async function saveStarredTransactionStoreIds(
  ids: number[],
): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore persistence errors
  }
}
