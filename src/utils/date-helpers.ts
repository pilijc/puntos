import i18n from "i18next";

export function get14DayDateRange(): string {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 13);

    const locale = i18n.language === "ja" ? "ja-JP" : "en-US";
    const fmt = (d: Date) => 
        d.toLocaleDateString(locale, { month: "short", day: "numeric" });
        
    return `${fmt(start)} — ${fmt(end)}`;
}

export function getWeekDateRange(): string {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);

    const locale = i18n.language === "ja" ? "ja-JP" : "en-US";
    const fmt = (d: Date) => 
        d.toLocaleDateString(locale, { month: "short", day: "numeric" });
        
    return `${fmt(start)} — ${fmt(end)}`;
}

export function getLast14Labels(): string[] {
    const labels = [];
    const locale = i18n.language === "ja" ? "ja-JP" : "en-US";
    
    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(
            d.toLocaleDateString(locale, { month: "short", day: "numeric" }),
        );
    }
    return labels;
}

export function getLast7Labels(): string[] {
    const labels = [];
    const locale = i18n.language === "ja" ? "ja-JP" : "en-US";
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(
            d.toLocaleDateString(locale, { month: "short", day: "numeric" }),
        );
    }
    return labels;
}

export function getTodayIndex(days = 7): number {
    return days - 1;
}

export function timeStringToDate(s: string, fallbackHour = 9, fallbackMin = 0): Date {
    const match = s.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return new Date(2000, 0, 1, fallbackHour, fallbackMin);
    const h = Math.min(23, Math.max(0, parseInt(match[1], 10)));
    const m = Math.min(59, Math.max(0, parseInt(match[2], 10)));
    return new Date(2000, 0, 1, h, m);
}
  
export function dateToTimeString(d: Date): string {
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}