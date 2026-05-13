
export function resolveStreakErrorI18nKey(err: unknown): string | null {
  const code =
    typeof err === "object" && err != null && "code" in err
      ? String((err as { code?: string }).code ?? "")
      : "";
  const msg = err instanceof Error ? err.message : String(err);
  const m = msg.toLowerCase();

  if (msg.includes("Only draft programs can be published")) {
    return "storeManager.streak.errors.onlyDraftPublish";
  }
  if (msg.includes("Only upcoming programs can be activated manually")) {
    return "storeManager.streak.errors.onlyUpcomingActivate";
  }
  if (msg.includes("Upcoming streak requires start_at")) {
    return "storeManager.streak.errors.upcomingNeedsStart";
  }
  if (msg.includes("start_at must be now or in the future")) {
    return "storeManager.streak.errors.startInPast";
  }
  if (
    code === "23505" ||
    m.includes("store_streaks_one_upcoming") ||
    (m.includes("duplicate key") && m.includes("upcoming"))
  ) {
    return "storeManager.streak.errors.duplicateUpcoming";
  }
  if (m.includes("already an active streak") || m.includes("store_streaks_one_active")) {
    return "storeManager.streak.errors.duplicateActive";
  }
  if (m.includes("streak program not found")) {
    return "storeManager.streak.errors.notFound";
  }
  if (
    m.includes("create or edit stamp, streak, and reward") ||
    m.includes("premium campaign") ||
    m.includes("subscription") ||
    m.includes("upgrade your plan")
  ) {
    return "storeManager.streak.errors.premiumRequired";
  }

  return null;
}
