export const userKeys = {
  root: ["user"] as const,
  profile: () => [...userKeys.root, "profile"] as const,
  notificationPermission: () => [...userKeys.root, "notification-permission"] as const,
  mutedStores: (userId: string | undefined) =>
    [...userKeys.root, "muted-stores", userId ?? "anonymous"] as const,
  streaks: () => [...userKeys.root, "streaks"] as const,
  streakByStore: (storeId: number | undefined) =>
    [...userKeys.root, "streaks", "store", storeId] as const,
};

export const stampKeys = {
  root: ["stamps"] as const,
  userStamps: (userId: string) => [...stampKeys.root, "progress", userId] as const,
  events: (userId: string, storeId?: number) =>
    [...stampKeys.root, "events", userId, storeId ?? "all"] as const,
  redemptions: (userId: string, storeId?: number) =>
    [...stampKeys.root, "redemptions", userId, storeId ?? "all"] as const,
  activePrograms: (storeIds: number[]) =>
    [...stampKeys.root, "active-programs", ...storeIds.sort()] as const,
};

export const storeKeys = {
  root: ["stores"] as const,
  features: (storeIds: number[]) => [...storeKeys.root, "features", ...storeIds.sort()] as const,
  activeStreakPrograms: (storeIds: number[]) => [...storeKeys.root, "active-streak-programs", ...storeIds.sort()] as const,
  enabledStreaks: (storeIds: number[]) => [...storeKeys.root, "enabled-streaks", ...storeIds.sort()] as const,
};

export const activityKeys = {
  root: ["activity"] as const,
  points: (userId: string, storeId: string) => [...activityKeys.root, "points", userId, storeId] as const,
  transactions: (userId: string, storeId: string) => [...activityKeys.root, "transactions", userId, storeId] as const,
  storeRewards: (storeId: string, sortBy: string, pointsOrder: string) => [...activityKeys.root, "store-rewards", storeId, sortBy, pointsOrder] as const,
};
