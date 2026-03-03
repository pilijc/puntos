// @ts-nocheck
import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  try {
    const { store_id } = await req.json();

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401 });
    }

    const supabaseUrl = Deno.env.get("EXPO_PUBLIC_API_URL")!;
    const serviceRoleKey = Deno.env.get("EXPO_PUBLIC_API_ROLE")!;

    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: serviceRoleKey },
    });
    if (!userRes.ok) return new Response(JSON.stringify({ error: "Invalid auth" }), { status: 401 });
    const user = await userRes.json();
    const userId = user.id;

    const tokenRes = await fetch(
      `${supabaseUrl}/rest/v1/user_push_tokens?user_id=eq.${userId}&select=onesignal_subscription_id`,
      { headers: { Authorization: authHeader, apikey: serviceRoleKey } }
    );

    const tokenJson = await tokenRes.json();
    const subId = tokenJson?.[0]?.onesignal_subscription_id;

    if (!subId) {
      return new Response(JSON.stringify({ ok: false, reason: "No subscription id" }), { status: 200 });
    }

    const ONE_APP_ID = Deno.env.get("ONESIGNAL_APP_ID")!;
    const ONE_REST_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY")!;

    const pushRes = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${ONE_REST_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONE_APP_ID,
        include_subscription_ids: [subId],
        headings: { en: "You're nearby 👀" },
        contents: { en: "A store near you has an offer. Tap to view!" },
        data: { store_id },
      }),
    });

    const pushJson = await pushRes.json();

    return new Response(JSON.stringify({ ok: true, onesignal: pushJson }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});