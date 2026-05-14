import { useQuery } from "@tanstack/react-query";
import {
  getAuthenticatedUserId,
  getManagerSubscription,
  getManagerSubscriptionPayments,
  getSubscriptionPaymentStatus,
  getSubscriptionPlans,
} from "@/services/store-manager/subscription-service";
import { storeManagerKeys } from "./query-keys";

export function useAuthenticatedUserIdQuery() {
  return useQuery({
    queryKey: storeManagerKeys.authUserId(),
    queryFn: getAuthenticatedUserId,
    staleTime: 60_000,
  });
}

export function useSubscriptionPlansQuery(enabled = true) {
  return useQuery({
    queryKey: storeManagerKeys.subscriptionPlans(),
    queryFn: getSubscriptionPlans,
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useManagerSubscriptionQuery(ownerId: string | null | undefined) {
  return useQuery({
    queryKey: storeManagerKeys.managerSubscription(ownerId ?? ""),
    queryFn: () => getManagerSubscription(ownerId!),
    enabled: Boolean(ownerId),
    staleTime: 30_000,
  });
}

export function useManagerInvoicesQuery(ownerId: string | null | undefined) {
  return useQuery({
    queryKey: storeManagerKeys.managerInvoices(ownerId ?? ""),
    queryFn: () => getManagerSubscriptionPayments(ownerId!),
    enabled: Boolean(ownerId),
    staleTime: 30_000,
  });
}

export function useSubscriptionPaymentStatusQuery(ownerId: string | null | undefined) {
  return useQuery({
    queryKey: storeManagerKeys.subscriptionPaymentStatus(ownerId ?? ""),
    queryFn: () => getSubscriptionPaymentStatus(ownerId!),
    enabled: Boolean(ownerId),
    staleTime: 15_000,
  });
}
