import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import { connectToDatabase } from '@/app/lib/db';
import PushSubscription from '@/app/model/PushSubscription';
import { webpush } from '@/app/lib/webpush';

interface PushRequestBody {
  userId?: string;
  title?: string;
  body?: string;
  url?: string;
  icon?: string;
  badge?: string;
}

// Type guard for PushError
function isPushError(err: unknown): err is { statusCode?: number; message?: string } {
  return typeof err === 'object' && err !== null && ('statusCode' in err || 'message' in err);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { userId, title, body, url, icon, badge } = (await req.json()) as PushRequestBody;

  if (!title && !body) {
    return NextResponse.json({ ok: false, error: 'Title or body required' }, { status: 400 });
  }

  const targetUserId = userId ?? session.user.id;

  try {
    await connectToDatabase();
    const subs = await PushSubscription.find({ userId: targetUserId }).lean();

    const payload = JSON.stringify({
      title: title || 'Notification',
      body: body || 'Hello!',
      icon: icon || '/icon-192x192.png',
      badge: badge || '/icon-192x192.png',
      data: { url: url || '/' },
    });

    const results = await Promise.allSettled(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload);
          return { ok: true };
        } catch (err: unknown) {
          if (isPushError(err)) {
            if (err.statusCode === 404 || err.statusCode === 410) {
              await PushSubscription.deleteOne({ endpoint: s.endpoint });
            } else {
              console.error(`Failed push for ${s.endpoint}:`, err.message ?? err);
            }
          } else {
            console.error(`Failed push for ${s.endpoint}:`, err);
          }
          return { ok: false, error: isPushError(err) ? err.message ?? 'send failed' : 'send failed' };
        }
      })
    );

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
