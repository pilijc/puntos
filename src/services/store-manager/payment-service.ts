import { supabase } from "@/supabase/supabase";
import { StorePayment } from "@/type/store-manager/payment";
import { ServiceResponse } from "@/type/service-response";

export async function hasPaidStoreFee(userId: string): Promise<ServiceResponse<boolean>> {
  try {
    const { data, error } = await supabase
      .from("store_payments")
      .select("status")
      .eq("user_id", userId)
      .eq("amount", 199)
      .maybeSingle();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data?.status == "paid", error: null };
  } catch (error: any) {
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

export async function getStoreByOwnerId(ownerId: string): Promise<ServiceResponse<any>> {
  try {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("owner_id", ownerId);
    if (error) return { data: null, error: new Error(error.message) };
    return { data: data?.[0] ?? null, error: null };
  } catch (error: any) {
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

export async function createPayMongoPayment({
  user_id,
  amount = 199,
  description = "Store Registration Fee",
}: StorePayment): Promise<ServiceResponse<string>> {
  try {
    // Supabase Edge Functions environment variable
    const PAYMONGO_KEY = process.env.PAYMONGO_KEY;
    if (!PAYMONGO_KEY) return { data: null, error: new Error("PayMongo key not set") };

    // Call PayMongo API
    const response = await fetch("https://api.paymongo.com/v1/links", {
      method: "POST",
      headers: {
        Authorization: `Basic ${PAYMONGO_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: amount * 100, // PayMongo expects centavos
            currency: "PHP",
            description: description,
            metadata: { user_id: user_id },
          },
        },
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
        return { data: null, error: new Error(data?.errors?.[0]?.detail || "Failed to create payment link") };
    }

    const checkoutUrl = data?.data?.attributes?.checkout_url;
    if (!checkoutUrl) return { data: null, error: new Error("Checkout URL missing in response") };

    // Return checkout URL
    return { data: checkoutUrl, error: null };
  } catch (err: any) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
