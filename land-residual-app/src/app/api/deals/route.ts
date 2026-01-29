import { NextRequest, NextResponse } from 'next/server';
import {
  getDealById,
  getDealsByOwner,
  updateDeal,
  deleteDeal,
  getDb,
} from '@/lib/db';

// System user ID for password-based auth (no individual user accounts)
const SYSTEM_USER_ID = 'system-user-laaa';

// Ensure system user exists
function ensureSystemUser() {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(SYSTEM_USER_ID);
  if (!existing) {
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(SYSTEM_USER_ID, 'system@laaa.local', 'not-used', 'LAAA Team', 'admin');
  }
}

// Get all deals
export async function GET() {
  try {
    ensureSystemUser();
    const deals = getDealsByOwner(SYSTEM_USER_ID);

    return NextResponse.json({
      success: true,
      deals: deals.map((d) => ({
        id: d.id,
        name: d.name,
        inputs: JSON.parse(d.inputs),
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      })),
    });
  } catch (error) {
    console.error('Get deals error:', error);
    return NextResponse.json(
      { error: 'Failed to get deals' },
      { status: 500 }
    );
  }
}

// Create or update a deal
export async function POST(request: NextRequest) {
  try {
    ensureSystemUser();

    const body = await request.json();
    const { id, name, inputs } = body;

    if (!id || !name || !inputs) {
      return NextResponse.json(
        { error: 'id, name, and inputs are required' },
        { status: 400 }
      );
    }

    // Check if deal exists
    const existing = getDealById(id);

    if (existing) {
      // Update existing deal
      const updated = updateDeal(id, name, inputs);
      return NextResponse.json({
        success: true,
        deal: {
          id: updated?.id,
          name: updated?.name,
          updatedAt: updated?.updated_at,
        },
      });
    } else {
      // Create new deal with specific ID
      const db = getDb();
      const now = new Date().toISOString();
      const inputsJson = JSON.stringify(inputs);

      db.prepare(`
        INSERT INTO deals (id, name, owner_id, inputs, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, name, SYSTEM_USER_ID, inputsJson, now, now);

      return NextResponse.json({
        success: true,
        deal: {
          id,
          name,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
  } catch (error) {
    console.error('Save deal error:', error);
    return NextResponse.json(
      { error: 'Failed to save deal' },
      { status: 500 }
    );
  }
}

// Delete a deal
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Deal ID is required' },
        { status: 400 }
      );
    }

    deleteDeal(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete deal error:', error);
    return NextResponse.json(
      { error: 'Failed to delete deal' },
      { status: 500 }
    );
  }
}
