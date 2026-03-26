export type TxType = "qr" | "stamp" | "streak";

export interface TransactionItem {
  id: string;
  type: TxType;
  userId: string;
  userName: string;
  userAvatar: string | null;
  date: string | null;
  detail: string;
}

export type ListItem =
  | { kind: "header"; key: string; label: string }
  | { kind: "tx"; key: string; tx: TransactionItem };

