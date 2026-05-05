import { getEffectiveStatus, STORE_STATUS_CONFIG } from "@/type/super-admin/user";

export type Timeframe = "today" | "7d" | "1m";

export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const USER_DATE_KEYS = [
  "last_sign_in_at", "last_login_at", "updated_at", "created_at", "createdAt", "inserted_at",
];

export const STORE_DATE_KEYS = ["updated_at", "created_at", "createdAt", "inserted_at"];

export interface DashboardRecord {
  id?: string | number;
  status?: string;
  blocked?: boolean;
  role?: number;
  is_active?: boolean;
  name?: string;
  username?: string;
  display_name?: string;
  store_name?: string;
  title?: string;
  [key: string]: unknown;
}

export interface DetailItem {
  key: string;
  title: string;
  subtitle: string;
  dateLabel: string;
  status: string;
}

export interface DetailList {
  list: DetailItem[];
  hasMore: boolean;
}

export function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function parsePossibleDate(value: unknown): Date | null {
  if (!value || typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getItemDate(item: DashboardRecord, dateKeys: string[]): Date | null {
  if (!item) return null;
  const itemKeys = Object.keys(item);
  for (const key of dateKeys) {
    const matchingKey = itemKeys.find(k => k.toLowerCase() === key.toLowerCase());
    if (matchingKey) {
      const d = parsePossibleDate(item[matchingKey]);
      if (d) return d;
    }
  }
  return null;
}

export function buildTimeframeSeries(items: DashboardRecord[], dateKeys: string[], timeframe: Timeframe) {
  const now = new Date();
  const today = startOfDay(now);

  const seriesLen = timeframe === "today" ? 6 : 7;
  const series = Array.from({ length: seriesLen }, () => 0);

  const windowDays = timeframe === "today" ? 1 : timeframe === "7d" ? 7 : 30;
  const bucketSize = timeframe === "1m" ? Math.ceil(windowDays / 7) : 1;

  items.forEach((item) => {
    const found = getItemDate(item, dateKeys);
    if (!found) return;
    const diffDays = Math.round((today.getTime() - startOfDay(found).getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0 || diffDays >= windowDays) return;

    if (timeframe === "today") {
      const hour = found.getHours();
      const idx = Math.floor(hour / 4);
      series[idx] += 1;
      return;
    }

    if (timeframe === "7d") {
      const idx = 6 - diffDays;
      series[idx] += 1;
      return;
    }

    const rawBucket = Math.floor(diffDays / bucketSize);
    const idx = Math.min(6, Math.max(0, 6 - rawBucket));
    series[idx] += 1;
  });

  if (timeframe === "today") {
    return {
      series,
      labels: ["12 AM", "4 AM", "8 AM", "12 PM", "4 PM", "8 PM"],
      rangeLabel: "Today",
    };
  }

  if (timeframe === "7d") {
    const dynamicLabels = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - idx));
      return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
    });
    const start = new Date();
    start.setDate(start.getDate() - 6);
    const rangeLabel = `${MONTH_NAMES[start.getMonth()]} ${start.getDate()} — ${MONTH_NAMES[now.getMonth()]} ${now.getDate()}`;
    return { series, labels: dynamicLabels, rangeLabel };
  }

  const monthLabels = Array.from({ length: 7 }, (_, idx) => `Week ${idx + 1}`);
  const start = new Date();
  start.setDate(start.getDate() - 29);
  const rangeLabel = `${MONTH_NAMES[start.getMonth()]} ${start.getDate()} — ${MONTH_NAMES[now.getMonth()]} ${now.getDate()}`;
  return { series, labels: monthLabels, rangeLabel };
}

export function getRelativeTime(date: Date | null, prefixText: string = "Active"): string {
  if (!date) return prefixText;
  const now = new Date().getTime();
  const diffInMs = Math.max(0, now - date.getTime());
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  
  if (diffInMins < 1) return `${prefixText} now`;
  if (diffInMins < 60) return `${prefixText} ${diffInMins} min${diffInMins === 1 ? '' : 's'} ago`;
  
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${prefixText} ${diffInHours} hr${diffInHours === 1 ? '' : 's'} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${prefixText} ${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${prefixText} ${diffInMonths} mo${diffInMonths === 1 ? '' : 's'} ago`;
}

export function getActiveUsersCount(users: DashboardRecord[]) {
  return users.filter((u) => !(u?.status === "Blocked" || u?.blocked === true || u?.role === 0)).length;
}

export function getDetailItems(items: DashboardRecord[], dateKeys: string[], prefix: string, timeframe: Timeframe, limit: number = 5): DetailList {
  const nowDay = startOfDay(new Date()).getTime();
  const maxDiff = timeframe === "today" ? 0 : timeframe === "7d" ? 6 : 29;

  const seen = new Set<unknown>();
  const uniqueItems = items.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  const allFiltered = uniqueItems
    .map((item) => ({
      item,
      date: getItemDate(item, dateKeys),
    }))
    .filter(({ date }) => {
      if (!date) return false;
      const diffDays = Math.round((nowDay - startOfDay(date).getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= maxDiff;
    })
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));

  const list = allFiltered.slice(0, limit).map(({ item, date }, idx) => {
    // Extract real-time activity for the status label
    const activeDateStr = item?.last_sign_in_at || item?.last_login_at || item?.updated_at || item?.created_at;
    const activeDate = parsePossibleDate(activeDateStr);

    const status =
      prefix === "Store"
        ? STORE_STATUS_CONFIG[getEffectiveStatus(item as any)].label
        : item?.blocked === true ||
          item?.role === 0 ||
          ["inactive", "blocked"].includes(String(item?.status ?? "").toLowerCase())
        ? "Inactive"
        : getRelativeTime(activeDate, "Active");
    const dateLabel = date
      ? `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`
      : "N/A";
    const name =
      item?.name ||
      item?.username ||
      item?.display_name ||
      item?.store_name ||
      item?.title ||
      (prefix === "User" ? "Unknown User" : `${prefix} ${idx + 1}`);
    return {
      key: `${prefix}-${idx}-${item?.id ?? idx}`,
      title: String(name),
      subtitle: `${dateLabel} • ${status}`,
      dateLabel,
      status,
    };
  });

  return { list, hasMore: allFiltered.length > limit };
}
