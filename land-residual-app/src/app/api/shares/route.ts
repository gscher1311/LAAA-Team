import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  createDealShare,
  getSharesByDeal,
  getDealById,
  deactivateShare,
} from '@/lib/db';

// System user ID for password-based auth mode
const SYSTEM_USER_ID = 'system-user-laaa';

// Create a new share link
export async function POST(request: NextRequest) {
  try {
    // Try to get session, but allow access in password-based auth mode
    const session = await getSession();
    const userId = session?.userId || SYSTEM_USER_ID;

    const body = await request.json();
    const { dealId, shareType, clientEmail, clientName, expiresInDays } = body;

    if (!dealId) {
      return NextResponse.json(
        { error: 'Deal ID is required' },
        { status: 400 }
      );
    }

    // Verify deal exists
    const deal = getDealById(dealId);
    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    const share = createDealShare({
      deal_id: dealId,
      share_type: shareType || 'summary',
      created_by: userId,
      client_email: clientEmail,
      client_name: clientName,
      expires_in_days: expiresInDays,
    });

    // Generate full share URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/share/${share.share_token}`;

    return NextResponse.json({
      success: true,
      share: {
        id: share.id,
        token: share.share_token,
        url: shareUrl,
        type: share.share_type,
        expires_at: share.expires_at,
      },
    });
  } catch (error) {
    console.error('Create share error:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}

// Get shares for a deal
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('dealId');

    if (!dealId) {
      return NextResponse.json(
        { error: 'Deal ID is required' },
        { status: 400 }
      );
    }

    const shares = getSharesByDeal(dealId);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    return NextResponse.json({
      shares: shares.map((s) => ({
        id: s.id,
        token: s.share_token,
        url: `${baseUrl}/share/${s.share_token}`,
        type: s.share_type,
        client_email: s.client_email,
        client_name: s.client_name,
        expires_at: s.expires_at,
        created_at: s.created_at,
        view_count: s.view_count,
        last_viewed: s.last_viewed,
        is_active: s.is_active,
      })),
    });
  } catch (error) {
    console.error('Get shares error:', error);
    return NextResponse.json(
      { error: 'Failed to get shares' },
      { status: 500 }
    );
  }
}

// Deactivate a share
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('id');

    if (!shareId) {
      return NextResponse.json(
        { error: 'Share ID is required' },
        { status: 400 }
      );
    }

    deactivateShare(shareId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Deactivate share error:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate share' },
      { status: 500 }
    );
  }
}
