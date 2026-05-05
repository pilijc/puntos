import type { Streak } from "@/type/store-manager/streak";

export function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  
export function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function computeEndDateFromStartIso(startIso: string, maxDaysCap: number | null): string | null {
  if (!maxDaysCap || maxDaysCap < 1) return null;
  const d = new Date(startIso);
  d.setDate(d.getDate() + maxDaysCap);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function computeMinStartAtFromActiveProgram(active: Streak | undefined): Date {
  const now = new Date();
  if (!active) return now;

  if (active.end_date) {
    const endOfDay = new Date(`${active.end_date}T23:59:59.999Z`);
    return endOfDay > now ? endOfDay : now;
  }

  if (active.start_at && active.streak_length && active.streak_length > 0) {
    const derivedEnd = new Date(active.start_at);
    derivedEnd.setDate(derivedEnd.getDate() + active.streak_length);
    return derivedEnd > now ? derivedEnd : now;
  }

  return now;
}
  