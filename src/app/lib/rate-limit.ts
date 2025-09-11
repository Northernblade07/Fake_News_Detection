// lib/rate-limit.ts
import type { Db } from "mongodb";
import { connectToDatabase } from "./db";
import mongoose from "mongoose";

const COLLECTION = "rate_events";

export type Rule = { windowMs: number; max: number };

async function ensureIndexes(db: Db) {
  const coll = db.collection(COLLECTION);
  await coll.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });
  await coll.createIndex({ key: 1, action: 1, createdAt: -1 });
}

export async function checkAndConsume(key: string, action: string, rules: Rule[]) {
  const conn = await connectToDatabase();
  const db = (conn.connection?.getClient?.() as any)?.db?.() ?? (mongoose.connection.db as Db);
  await ensureIndexes(db);
  const coll = db.collection(COLLECTION);
  const now = Date.now();
  for (const rule of rules) {
    const from = new Date(now - rule.windowMs);
    const count = await coll.countDocuments({ key, action, createdAt: { $gte: from } });
    if (count >= rule.max) {
      const oldest = await coll
        .find({ key, action, createdAt: { $gte: from } })
        .sort({ createdAt: 1 })
        .limit(1)
        .toArray();
      const retryMs = oldest.createdAt.getTime() + rule.windowMs - now;
      return { ok: false, retryAfter: Math.max(1, Math.ceil(retryMs / 1000)) };
    }
  }
  await coll.insertOne({ key, action, createdAt: new Date() });
  return { ok: true };
}

export const DETECT_RULES: Rule[] = [
  { windowMs: 60 * 1000, max: 3 }, // 3/min
  { windowMs: 10 * 60 * 1000, max: 15 }, // 15/10min
  { windowMs: 24 * 60 * 60 * 1000, max: 200 }, // 200/day
];
