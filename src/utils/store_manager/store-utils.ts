export function formatTime(time: string | null | undefined): string {
    if (!time) return "";
    const [hourStr, minuteStr = "00"] = time.split(":");
    const hour = parseInt(hourStr, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minuteStr} ${period}`;
  }