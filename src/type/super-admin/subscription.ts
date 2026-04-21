export type SubscriptionPlanSlug = "basic" | "pro" | (string & {});

export type SubscriptionPlanKey = "basic" | "pro";

export type SubscriptionPlan = {
  id: number;
  slug: SubscriptionPlanSlug | null;
  name?: string | null;
  amount?: number | null;
};

export type SubscriptionPlanUpdate = {
  amount: number;
};

export type ManagerSubscriptionRow = {
  id?: number;
  owner_id: string;
  subscription_id: number | null;
  is_enforced?: boolean | null;
  payment_status: string | null;
  owner_name?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean | null;
  paymongo_subscription_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type SubscriptionDashboardTrend = "up" | "down" | "flat";

export type SubscriptionDashboardCompare = {
  trend: SubscriptionDashboardTrend;
  subtitle: string;
};

export type SubscriptionDashboardStats = {
  totalAmountCollected: number;
  totalAmountCollectedCompare: SubscriptionDashboardCompare | null;

  activeSubscribers: number;
  activeSubscribersCompare: SubscriptionDashboardCompare | null;

  newSubscribersThisMonth: number;
  newSubscribersThisMonthCompare: SubscriptionDashboardCompare | null;

  scheduledCancellations: number;
  scheduledCancellationsCompare: SubscriptionDashboardCompare | null;
};

export type PublicUserRow = {
  id: string;
  email?: string | null;
  name?: string | null;
};

export type ManagerSubscriptionPaymentRow = {
  id?: number;
  owner_id: string;
  subscription_id: number | null;
  checkout_session_id?: string | null;
  payment_reference?: string | null;
  amount_paid: string | number | null;
  amount_due?: string | number | null;
  currency: string | null;
  payment_status: string;
  paid_at?: string | null;
  created_at?: string | null;
  billing_period_start?: string | null;
  billing_period_end?: string | null;
};

export type TableColumn<Row> = {
  key: string;
  header: string;
  width?: number;
  flex?: number;
  align?: "left" | "center" | "right";
  render: (row: Row) => React.ReactNode;
};