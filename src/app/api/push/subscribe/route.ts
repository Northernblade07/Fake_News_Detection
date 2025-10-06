// app/api/push/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import PushSubscription from '@/app/model/PushSubscription';
import { auth } from '../../../../../auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  console.log(session)
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  const { endpoint, keys, expirationTime, userAgent } = await req.json();
  // Convert numeric expirationTime (DOMHighResTimeStamp) to Date if present
  const expiresAt = typeof expirationTime === 'number' ? new Date(expirationTime) : null;

  await PushSubscription.findOneAndUpdate(
    { endpoint }, // endpoint uniquely identifies the subscription
    {
      userId: session.user.id,
      endpoint,
      keys,
      expirationTime: expiresAt,
      userAgent,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log("Received new subscription from user:", session.user.id);
console.log("Payload:", { endpoint, keys });

  return NextResponse.json({ ok: true });
}
