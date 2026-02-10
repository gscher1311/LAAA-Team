import { NextRequest, NextResponse } from 'next/server';
import { getSession, logout } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'unknown';

    await logout(session?.userId, ipAddress);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}
