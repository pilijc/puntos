export type TxType = "qr" | "stamp" | "streak";
export type TypeFilter = TxType | "all";

export interface TransactionItem {
  id: string;
  type: TxType;
  userId: string;
  userName: string;
  userAvatar: string | null;
  date: string | null;
  detail: string;
}

export interface PaginatedTransactionsResult {
  items: TransactionItem[];
  hasMore: boolean;
  nextPage: number;
}

export type ListItem =
  | { kind: "header"; key: string; label: string }
  | { kind: "tx"; key: string; tx: TransactionItem };

export const initialState = {
  selectedStoreId: null as number | null,
  typeFilter: "all" as TypeFilter,
  items: [] as TransactionItem[],
  page: 1,
  hasMore: false,
  loading: false,
  loadingMore: false,
  refreshing: false,
};

export const type_badge: Record<TxType, string> = { qr: "QR", stamp: "Stamp", streak: "Streak" };
