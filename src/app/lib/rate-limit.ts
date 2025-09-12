// lib/rate-limit.ts
import type { Connection } from "mongoose";
import { connectToDatabase } from "./db";

const COLLECTION = "rate_events";

export type Rule = {
  windowMs: number; // duration in ms
  max: number;      // max allowed requests in window
};

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfter: number }; // seconds to wait

type MongooseDb = NonNullable<Connection["db"]>;

let indexesEnsured = false;

async function ensureIndexes(db: MongooseDb): Promise<void> {
  if (indexesEnsured) return; // avoid recreating
  const coll = db.collection(COLLECTION);

  // TTL index (expire docs after 1 day)
  await coll.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });

  // Compound index for faster queries
  await coll.createIndex({ key: 1, action: 1, createdAt: -1 });

  indexesEnsured = true;
}

export async function checkAndConsume(
  key: string,
  action: string,
  rules: Rule[]
): Promise<RateLimitResult> {
  const conn = await connectToDatabase();
  const db: MongooseDb = conn.db!;

  await ensureIndexes(db);
  const coll = db.collection(COLLECTION);
  const now = Date.now();

  for (const rule of rules) {
    const from = new Date(now - rule.windowMs);

    const count = await coll.countDocuments({
      key,
      action,
      createdAt: { $gte: from },
    });

    if (count >= rule.max) {
      const oldest = await coll
        .find({ key, action, createdAt: { $gte: from } })
        .sort({ createdAt: 1 })
        .limit(1)
        .toArray();

      if (oldest.length > 0 && oldest[0].createdAt instanceof Date) {
        const retryMs =
          oldest[0].createdAt.getTime() + rule.windowMs - now;
        return { ok: false, retryAfter: Math.max(1, Math.ceil(retryMs / 1000)) };
      }

      // fallback (should rarely happen)
      return { ok: false, retryAfter: Math.ceil(rule.windowMs / 1000) };
    }
  }

  // consume one token
  await coll.insertOne({ key, action, createdAt: new Date() });

  return { ok: true };
}

// Example rules for detection API
export const DETECT_RULES: Rule[] = [
  { windowMs: 60 * 1000, max: 3 },        // 3 per minute
  { windowMs: 10 * 60 * 1000, max: 15 },  // 15 per 10 minutes
  { windowMs: 24 * 60 * 60 * 1000, max: 200 }, // 200 per day
];
