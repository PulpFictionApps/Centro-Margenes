import webpush from "web-push";
import { SupabaseClient } from "@supabase/supabase-js";

// VAPID configuration — set these in your .env.local / Vercel env vars:
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY  — shared with the browser
//   VAPID_PRIVATE_KEY             — server only, never expose
//   VAPID_SUBJECT                 — mailto: or https: URI identifying the sender
let _initialized = false;

function ensureVapid() {
  if (_initialized) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) {
    throw new Error(
      "Push notifications: NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT must be set."
    );
  }
  webpush.setVapidDetails(subject, pub, priv);
  _initialized = true;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  /** Optional Google Calendar "add event" URL included as a notification action */
  gcalUrl?: string;
}

interface SubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushSendResult {
  subscriptions: number;
  sent: number;
  failed: number;
}

// ── Core send ──────────────────────────────────────────────────────────────

async function sendOne(sub: SubscriptionRow, payload: PushPayload): Promise<void> {
  ensureVapid();
  await webpush.sendNotification(
    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    JSON.stringify(payload)
  );
}

// ── Send to a specific auth user_id ───────────────────────────────────────

export async function sendPushToUser(
  // Accept a Supabase client with service-role access so it can bypass RLS
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: SupabaseClient<any>,
  userId: string,
  payload: PushPayload
): Promise<PushSendResult> {
  const { data: subs } = await supabaseAdmin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs?.length) {
    return { subscriptions: 0, sent: 0, failed: 0 };
  }

  const delivery = await Promise.all(
    subs.map(async (sub: SubscriptionRow) => {
      try {
        await sendOne(sub, payload);
        return true;
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        // 410 Gone or 404 = subscription expired/revoked -> clean it up
        if (statusCode === 410 || statusCode === 404) {
          await supabaseAdmin
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint);
        } else {
          console.error("[push] sendOne error:", err);
        }
        return false;
      }
    })
  );

  const sent = delivery.filter(Boolean).length;
  return {
    subscriptions: subs.length,
    sent,
    failed: subs.length - sent,
  };
}
