// app/api/push/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import PushSubscription from '@/app/model/PushSubscription';
import { auth } from '../../../../../auth';
import { webpush } from '@/app/lib/webpush';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  const { endpoint, keys, expirationTime, userAgent } = await req.json();
  const expiresAt = typeof expirationTime === 'number' ? new Date(expirationTime) : null;

  // Save subscription
  await PushSubscription.findOneAndUpdate(
    { endpoint },
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
  return NextResponse.json({ ok: true });
}
