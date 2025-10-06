import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import PushSubscription from '@/app/model/PushSubscription';
import { connectToDatabase } from '@/app/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  const { endpoint } = await req.json();
  if (!endpoint) return NextResponse.json({ ok: false, error: 'Missing endpoint' }, { status: 400 });

  try {
    await connectToDatabase();
    await PushSubscription.deleteOne({ endpoint, userId: session.user.id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: 'Database error' }, { status: 500 });
  }
}
