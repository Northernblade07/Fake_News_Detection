import mongoose from "mongoose";
import { webpush } from "./webpush";
import PushSubscription from "@/app/model/PushSubscription";

export interface PushPayload<Data extends object = Record<string, unknown>> {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Data;
}

/**
 * Sends a web push notification to all subscriptions for a given user.
 *
 * @param userId - The MongoDB user ID or string identifier for the user
 * @param payload - The payload object (title, body, etc.)
 * @returns An array of results for each push attempt
 */
export async function sendPushNotification<Data extends object = Record<string, unknown>>(
  userId: mongoose.Types.ObjectId,
  payload: PushPayload<Data>
): Promise<{ ok: boolean; error?: string }[]> {
  if (!userId) {
    console.warn("sendPushNotification called with empty userId");
    return [{ ok: false, error: "Missing userId" }];
  }

  if (!payload?.title || !payload?.body) {
    console.warn("sendPushNotification called with invalid payload:", payload);
    return [{ ok: false, error: "Invalid payload" }];
  }

  try {
    const subs = await PushSubscription.find({ userId }).lean();

    if (!subs.length) {
      console.log(`No push subscriptions found for user ${userId}`);
      return [{ ok: false, error: "No subscriptions found" }];
    }

    const payloadString = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon ?? "/icons-192x192.png",
      badge: payload.badge ?? "/icons-192x192.png",
      data: payload.data ?? {},
    });

    const results = await Promise.allSettled(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: s.keys },
            payloadString
          );
          return { ok: true };
        } catch (err: unknown) {
          const e = err as { statusCode?: number; message?: string };
          if (e.statusCode === 404 || e.statusCode === 410) {
            await PushSubscription.deleteOne({ endpoint: s.endpoint });
          } else {
            console.error(`Push failed for ${s.endpoint}:`, e.message ?? err);
          }
          return { ok: false, error: e.message ?? "Push failed" };
        }
      })
    );

    return results.map((r) =>
      r.status === "fulfilled" ? r.value : { ok: false, error: "Rejected promise" }
    );
  } catch (err) {
    console.error("sendPushNotification failed:", err);
    return [{ ok: false, error: "Server error" }];
  }
}
