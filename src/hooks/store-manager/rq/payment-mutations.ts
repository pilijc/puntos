import { useMutation } from "@tanstack/react-query";
import { createPayMongoPayment } from "@/services/store-manager/payment-service";

export function useCreatePayMongoPaymentMutation() {
  return useMutation({
    mutationFn: createPayMongoPayment,
  });
}
