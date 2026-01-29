import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createInviteCode, getInviteCodeByCode } from '@/lib/db';

// Create new invite code (admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin']);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { role, expiresInHours } = body;

    if (!role || !['admin', 'team', 'client'].includes(role)) {
      return NextResponse.json(
        { error: 'Valid role (admin, team, client) is required' },
        { status: 400 }
      );
    }

    const invite = createInviteCode(
      role,
      authResult.session.userId,
      expiresInHours || 72
    );

    return NextResponse.json({
      success: true,
      invite: {
        code: invite.code,
        role: invite.role,
        expires_at: invite.expires_at,
      },
    });
  } catch (error) {
    console.error('Create invite error:', error);
    return NextResponse.json(
      { error: 'An error occurred creating invite code' },
      { status: 500 }
    );
  }
}

// Validate invite code (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      );
    }

    const invite = getInviteCodeByCode(code);

    if (!invite) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired invite code' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      role: invite.role,
      expires_at: invite.expires_at,
    });
  } catch (error) {
    console.error('Validate invite error:', error);
    return NextResponse.json(
      { error: 'An error occurred validating invite code' },
      { status: 500 }
    );
  }
}
