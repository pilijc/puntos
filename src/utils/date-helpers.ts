export function getWeekDateRange(): string {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);

    const fmt = (d: Date) => 
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        
    return `${fmt(start)} — ${fmt(end)}`;
}

export function getLast7Labels(): string[] {
    const labels = [];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
    }
    return labels;
}

export function getTodayIndex(): number {
    return 6;
}
