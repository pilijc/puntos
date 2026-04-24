export type Timeframe = "today" | "7d" | "1m";

export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

export function getItemDate(item: any, dateKeys: string[]): Date | null {
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

export function buildTimeframeSeries(items: any[], dateKeys: string[], timeframe: Timeframe) {
  const now = new Date();
  const today = startOfDay(now);

  const series = Array.from({ length: 7 }, () => 0);
  
  const windowDays = timeframe === "today" ? 1 : timeframe === "7d" ? 7 : 30;
  const bucketSize = timeframe === "1m" ? Math.ceil(windowDays / 7) : 1;

  items.forEach((item) => {
    const found = getItemDate(item, dateKeys);
    if (!found) return;
    const diffDays = Math.floor((today.getTime() - startOfDay(found).getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0 || diffDays >= windowDays) return;

    if (timeframe === "today") {
      series[6] += 1;
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
    const day = `${MONTH_NAMES[now.getMonth()]} ${now.getDate()}`;
    return {
      series,
      labels: ["", "", "", "", "", "", day],
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

export function getActiveUsersCount(users: any[]) {
  return users.filter((u) => !(u?.status === "Blocked" || u?.blocked === true || u?.role === 0)).length;
}

export function getDetailItems(items: any[], dateKeys: string[], prefix: string, timeframe: Timeframe, limit: number = 5) {
  const nowDay = startOfDay(new Date()).getTime();
  const maxDiff = timeframe === "today" ? 0 : timeframe === "7d" ? 6 : 29;

  const uniqueItems = Array.from(new Map(items.map(item => [item.id, item])).values());
  const allFiltered = uniqueItems
    .map((item) => ({
      item,
      date: getItemDate(item, dateKeys),
    }))
    .filter(({ date }) => {
      if (!date) return false;
      const diffDays = Math.floor((nowDay - startOfDay(date).getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= maxDiff;
    })
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));

  const list = allFiltered.slice(0, limit).map(({ item, date }, idx) => {
    const status =
      item?.blocked === true ||
        item?.role === 0 ||
        String(item?.status ?? "").toLowerCase() === "inactive"
        ? "Inactive"
        : "Active";
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
      title: name,
      subtitle: `${dateLabel} • ${status}`,
    };
  });

  return { list, hasMore: allFiltered.length > limit };
}
