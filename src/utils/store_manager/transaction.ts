import { TransactionItem, ListItem } from "@/type/store-manager/transaction";

export function formatTxTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const TX_MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function formatTxDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const mon = TX_MONTH_LABELS[d.getMonth()];
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${mon} ${dd}, ${yyyy}, ${time}`;
}

export function getDateSection(dateStr: string | null): string {
  if (!dateStr) return "Earlier";

  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const txDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (txDate.getTime() === today.getTime()) return "Today";
  if (txDate.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function buildListData(items: TransactionItem[]): ListItem[] {
  const sorted = [...items].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const result: ListItem[] = [];
  let lastSection = "";

  for (const tx of sorted) {
    const section = getDateSection(tx.date);
    if (section !== lastSection) {
      result.push({ kind: "header", key: `h-${section}-${tx.id}`, label: section });
      lastSection = section;
    }
    result.push({ kind: "tx", key: tx.id, tx });
  }

  return result;
}
