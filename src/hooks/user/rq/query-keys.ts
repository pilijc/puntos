export const userKeys = {
  root: ["user"] as const,
  profile: () => [...userKeys.root, "profile"] as const,
  notificationPermission: () => [...userKeys.root, "notification-permission"] as const,
  mutedStores: (userId: string | undefined) =>
    [...userKeys.root, "muted-stores", userId ?? "anonymous"] as const,
};
