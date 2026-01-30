import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Server-side password verification - reads env var at runtime
const TEAM_PASSWORD = process.env.LAAA_PASSWORD || process.env.NEXT_PUBLIC_TEAM_PASSWORD || 'laaa2025';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ success: false, error: 'Password required' }, { status: 400 });
    }

    if (password === TEAM_PASSWORD) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Incorrect password' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
