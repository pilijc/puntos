export const storeManagerKeys = {
  root: ["store-manager"] as const,

  authUserId: () => [...storeManagerKeys.root, "auth-user-id"] as const,

  managerStores: () => [...storeManagerKeys.root, "manager-stores"] as const,

  subscriptionPlans: () => [...storeManagerKeys.root, "subscription-plans"] as const,

  managerSubscription: (ownerId: string) =>
    [...storeManagerKeys.root, "manager-subscription", ownerId] as const,

  managerInvoices: (ownerId: string) =>
    [...storeManagerKeys.root, "manager-invoices", ownerId] as const,

  subscriptionPaymentStatus: (ownerId: string) =>
    [...storeManagerKeys.root, "subscription-payment-status", ownerId] as const,

  transactions: (storeId: number, filter: string) =>
    [...storeManagerKeys.root, "transactions", storeId, filter] as const,

  transactionsPreview: (storeId: number) =>
    [...storeManagerKeys.root, "transactions-preview", storeId] as const,

  storeDetail: (storeId: string) => [...storeManagerKeys.root, "store-detail", storeId] as const,

  dashboardBundle: (storeId: number) =>
    [...storeManagerKeys.root, "dashboard-bundle", storeId] as const,

  qrConfig: (storeId: string) => [...storeManagerKeys.root, "qr-config", storeId] as const,

  staff: (storeId: string) => [...storeManagerKeys.root, "staff", storeId] as const,

  staffMember: (staffId: string) =>
    [...storeManagerKeys.root, "staff-member", staffId] as const,

  stampProgram: (programId: string) =>
    [...storeManagerKeys.root, "stamp-program", programId] as const,

  stampCollectors: (programId: string) =>
    [...storeManagerKeys.root, "stamp-collectors", programId] as const,

  stampProgramStatus: (programId: string) =>
    [...storeManagerKeys.root, "stamp-program-status", programId] as const,

  streaksByStore: (storeId: number) =>
    [...storeManagerKeys.root, "streaks", storeId] as const,

  streakProgram: (programId: string) =>
    [...storeManagerKeys.root, "streak-program", programId] as const,

  streakParticipants: (programId: string) =>
    [...storeManagerKeys.root, "streak-participants", programId] as const,

  streakParticipantsCount: (programId: string) =>
    [...storeManagerKeys.root, "streak-participants-count", programId] as const,

  rewardsByStore: (storeId: number) =>
    [...storeManagerKeys.root, "rewards", storeId] as const,

  rewardsPage: (storeId: number, page: number) =>
    [...storeManagerKeys.root, "rewards-page", storeId, page] as const,

  reward: (rewardId: string) => [...storeManagerKeys.root, "reward", rewardId] as const,

  deviceSessionsActive: (userId: string) =>
    [...storeManagerKeys.root, "device-sessions-active", userId] as const,
};
