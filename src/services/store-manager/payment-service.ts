import { supabase } from "@/supabase/supabase";
import { StorePayment } from "@/type/store-manager/payment";

export async function hasPaidStoreFee(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("store_payments")
      .select("status")
      .eq("user_id", userId)
      .eq("amount", 199)
      .single();

    if (error) {
      console.error("Error checking store fee payment:", error);
      return false;
    }

    return data?.status == "paid";
  } catch (error) {
    console.error("Error checking store fee payment:", error);
    return false;
  }
}

export async function getStoreByOwnerId(ownerId: string) {
  try {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("owner_id", ownerId);
    if (error) throw new Error(error.message);
    return data?.[0] ?? null;
  } catch (error) {
    throw error;
  }
}

export async function createPayMongoPayment({
  user_id,
  amount = 199,
  description = "Store Registration Fee",
}: StorePayment): Promise<string | null> {
  try {
    // Supabase Edge Functions environment variable
    const PAYMONGO_KEY = process.env.PAYMONGO_KEY;
    if (!PAYMONGO_KEY) throw new Error("PayMongo key not set");

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

    // Return checkout URL
    return data?.data?.attributes?.checkout_url || null;
  } catch (err) {
    console.error("Error creating PayMongo payment:", err);
    return null;
  }
}
