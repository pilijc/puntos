import "@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
const ONESIGNAL_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");

serve(async (req) => {
  try {
    const { subscriptionId, title, body } = await req.json();

    const res = await fetch("https://api.onesignal.com/notifications?c=push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        name: "puntos",
        target_channel: "push",
        include_subscription_ids: [subscriptionId],
        included_segments: ["All"],
        title: { en: title ?? "Sample" },
        contents: { en: body ?? "Hello" },
      }),
    });

    const onesignalBody = await res.json().catch(() => null);

    return json(
      {
        ok: res.ok,
        onesignalStatus: res.status,
        onesignalBody,
      },
      200
    );
  } catch (e) {
    return json({ ok: false, error: String(e) }, 200);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}