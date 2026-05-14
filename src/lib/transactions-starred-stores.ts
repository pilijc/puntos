import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "transactions_starred_store_ids_v1";

export async function loadStarredTransactionStoreIds(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is number =>
        typeof x === "number" && Number.isFinite(x) && x > 0,
    );
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
