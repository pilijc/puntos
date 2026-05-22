import { useMutation } from "@tanstack/react-query";
import { createPayMongoPayment } from "@/services/store-manager/payment-service";

export function useCreatePayMongoPaymentMutation() {
  return useMutation({
    mutationFn: async (params: Parameters<typeof createPayMongoPayment>[0]) => {
      const { data, error } = await createPayMongoPayment(params);
      if (error) throw error;
      return data;
    },
  });
}
