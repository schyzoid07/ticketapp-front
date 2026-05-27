import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://ticketapp-back.onrender.com';

  try {
    const res = await fetch(`${backendUrl}/`, {
      signal: AbortSignal.timeout(15000),
    });

    if (res.ok) {
      return NextResponse.json({ status: 'ok', backend: backendUrl });
    }

    return NextResponse.json({ status: 'error', message: 'Backend responded with non-ok status' }, { status: 502 });
  } catch (error) {
    console.error(`Keep-alive ping to ${backendUrl} failed:`, error);
    return NextResponse.json({ status: 'error', message: 'Backend unreachable' }, { status: 502 });
  }
}
