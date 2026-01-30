/**
 * SQLite Database Setup
 * Using better-sqlite3 for synchronous, performant database operations
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Database file path - stored in project root
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'laaa.db');

// Create database connection (lazy initialization)
let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    // Ensure data directory exists
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema(db);
  }
  return db;
}

/**
 * Initialize database schema
 */
function initializeSchema(db: Database.Database) {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'team', 'client')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_login TEXT,
      is_active INTEGER NOT NULL DEFAULT 1
    );
  `);

  // Invite codes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS invite_codes (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'team', 'client')),
      created_by TEXT REFERENCES users(id),
      used_by TEXT REFERENCES users(id),
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      is_used INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Deals table
  db.exec(`
    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_id TEXT NOT NULL REFERENCES users(id),
      inputs TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      is_deleted INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Deal shares table (for client sharing)
  db.exec(`
    CREATE TABLE IF NOT EXISTS deal_shares (
      id TEXT PRIMARY KEY,
      deal_id TEXT NOT NULL REFERENCES deals(id),
      share_token TEXT UNIQUE NOT NULL,
      share_type TEXT NOT NULL CHECK (share_type IN ('summary', 'full')),
      created_by TEXT NOT NULL REFERENCES users(id),
      client_email TEXT,
      client_name TEXT,
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      view_count INTEGER NOT NULL DEFAULT 0,
      last_viewed TEXT,
      is_active INTEGER NOT NULL DEFAULT 1
    );
  `);

  // Uploaded documents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      deal_id TEXT NOT NULL REFERENCES deals(id),
      filename TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      parsed_data TEXT,
      uploaded_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Activity log table
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_deals_owner ON deals(owner_id);
    CREATE INDEX IF NOT EXISTS idx_deal_shares_token ON deal_shares(share_token);
    CREATE INDEX IF NOT EXISTS idx_deal_shares_deal ON deal_shares(deal_id);
    CREATE INDEX IF NOT EXISTS idx_documents_deal ON documents(deal_id);
    CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
    CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
  `);
}

// ============ User Operations ============

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'team' | 'client';
  created_at: string;
  updated_at: string;
  last_login: string | null;
  is_active: boolean;
}

export interface CreateUserInput {
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'team' | 'client';
}

export function createUser(input: CreateUserInput): User {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, input.email, input.password_hash, input.name, input.role, now, now);

  return getUserById(id)!;
}

export function getUserById(id: string): User | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT id, email, name, role, created_at, updated_at, last_login, is_active
    FROM users WHERE id = ?
  `).get(id) as { id: string; email: string; name: string; role: 'admin' | 'team' | 'client'; created_at: string; updated_at: string; last_login: string | null; is_active: number } | undefined;

  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_login: row.last_login,
    is_active: Boolean(row.is_active),
  };
}

export function getUserByEmail(email: string): (User & { password_hash: string }) | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT id, email, password_hash, name, role, created_at, updated_at, last_login, is_active
    FROM users WHERE email = ? AND is_active = 1
  `).get(email) as { id: string; email: string; password_hash: string; name: string; role: 'admin' | 'team' | 'client'; created_at: string; updated_at: string; last_login: string | null; is_active: number } | undefined;

  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    password_hash: row.password_hash,
    name: row.name,
    role: row.role,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_login: row.last_login,
    is_active: Boolean(row.is_active),
  };
}

export function updateUserLastLogin(userId: string): void {
  const db = getDb();
  db.prepare(`UPDATE users SET last_login = datetime('now') WHERE id = ?`).run(userId);
}

export function getAllUsers(): User[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, email, name, role, created_at, updated_at, last_login, is_active
    FROM users ORDER BY created_at DESC
  `).all() as { id: string; email: string; name: string; role: 'admin' | 'team' | 'client'; created_at: string; updated_at: string; last_login: string | null; is_active: number }[];

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_login: row.last_login,
    is_active: Boolean(row.is_active),
  }));
}

// ============ Invite Code Operations ============

export interface InviteCode {
  id: string;
  code: string;
  role: 'admin' | 'team' | 'client';
  created_by: string | null;
  used_by: string | null;
  expires_at: string;
  created_at: string;
  is_used: boolean;
}

export function createInviteCode(
  role: 'admin' | 'team' | 'client',
  createdBy: string | null,
  expiresInHours: number = 72
): InviteCode {
  const db = getDb();
  const id = uuidv4();
  const code = generateInviteCode();
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO invite_codes (id, code, role, created_by, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, code, role, createdBy, expiresAt);

  return getInviteCodeById(id)!;
}

export function getInviteCodeById(id: string): InviteCode | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM invite_codes WHERE id = ?`).get(id) as
    { id: string; code: string; role: 'admin' | 'team' | 'client'; created_by: string | null; used_by: string | null; expires_at: string; created_at: string; is_used: number } | undefined;

  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    role: row.role,
    created_by: row.created_by,
    used_by: row.used_by,
    expires_at: row.expires_at,
    created_at: row.created_at,
    is_used: Boolean(row.is_used),
  };
}

export function getInviteCodeByCode(code: string): InviteCode | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT * FROM invite_codes
    WHERE code = ? AND is_used = 0 AND expires_at > datetime('now')
  `).get(code) as { id: string; code: string; role: 'admin' | 'team' | 'client'; created_by: string | null; used_by: string | null; expires_at: string; created_at: string; is_used: number } | undefined;

  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    role: row.role,
    created_by: row.created_by,
    used_by: row.used_by,
    expires_at: row.expires_at,
    created_at: row.created_at,
    is_used: Boolean(row.is_used),
  };
}

export function markInviteCodeUsed(code: string, userId: string): void {
  const db = getDb();
  db.prepare(`
    UPDATE invite_codes SET is_used = 1, used_by = ? WHERE code = ?
  `).run(userId, code);
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ============ Deal Operations ============

export interface Deal {
  id: string;
  name: string;
  owner_id: string;
  inputs: string; // JSON string
  created_at: string;
  updated_at: string;
}

export interface CreateDealInput {
  name: string;
  owner_id: string;
  inputs: Record<string, unknown>;
}

export function createDeal(input: CreateDealInput): Deal {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();
  const inputsJson = JSON.stringify(input.inputs);

  db.prepare(`
    INSERT INTO deals (id, name, owner_id, inputs, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, input.name, input.owner_id, inputsJson, now, now);

  return getDealById(id)!;
}

export function getDealById(id: string): Deal | null {
  const db = getDb();
  return db.prepare(`
    SELECT id, name, owner_id, inputs, created_at, updated_at
    FROM deals WHERE id = ? AND is_deleted = 0
  `).get(id) as Deal | undefined || null;
}

export function getDealsByOwner(ownerId: string): Deal[] {
  const db = getDb();
  return db.prepare(`
    SELECT id, name, owner_id, inputs, created_at, updated_at
    FROM deals WHERE owner_id = ? AND is_deleted = 0
    ORDER BY updated_at DESC
  `).all(ownerId) as Deal[];
}

export function updateDeal(id: string, name: string, inputs: Record<string, unknown>): Deal | null {
  const db = getDb();
  const inputsJson = JSON.stringify(inputs);
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE deals SET name = ?, inputs = ?, updated_at = ?
    WHERE id = ? AND is_deleted = 0
  `).run(name, inputsJson, now, id);

  return getDealById(id);
}

export function deleteDeal(id: string): void {
  const db = getDb();
  db.prepare(`UPDATE deals SET is_deleted = 1 WHERE id = ?`).run(id);
}

// ============ Deal Share Operations ============

export interface DealShare {
  id: string;
  deal_id: string;
  share_token: string;
  share_type: 'summary' | 'full';
  created_by: string;
  client_email: string | null;
  client_name: string | null;
  expires_at: string | null;
  created_at: string;
  view_count: number;
  last_viewed: string | null;
  is_active: boolean;
}

export interface CreateShareInput {
  deal_id: string;
  share_type: 'summary' | 'full';
  created_by: string;
  client_email?: string;
  client_name?: string;
  expires_in_days?: number;
}

export function createDealShare(input: CreateShareInput): DealShare {
  const db = getDb();
  const id = uuidv4();
  const shareToken = generateShareToken();
  const expiresAt = input.expires_in_days
    ? new Date(Date.now() + input.expires_in_days * 24 * 60 * 60 * 1000).toISOString()
    : null;

  db.prepare(`
    INSERT INTO deal_shares (id, deal_id, share_token, share_type, created_by, client_email, client_name, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.deal_id,
    shareToken,
    input.share_type,
    input.created_by,
    input.client_email || null,
    input.client_name || null,
    expiresAt
  );

  return getShareById(id)!;
}

type DealShareRow = {
  id: string;
  deal_id: string;
  share_token: string;
  share_type: 'summary' | 'full';
  created_by: string;
  client_email: string | null;
  client_name: string | null;
  expires_at: string | null;
  created_at: string;
  view_count: number;
  last_viewed: string | null;
  is_active: number;
};

function rowToDealShare(row: DealShareRow): DealShare {
  return {
    id: row.id,
    deal_id: row.deal_id,
    share_token: row.share_token,
    share_type: row.share_type,
    created_by: row.created_by,
    client_email: row.client_email,
    client_name: row.client_name,
    expires_at: row.expires_at,
    created_at: row.created_at,
    view_count: row.view_count,
    last_viewed: row.last_viewed,
    is_active: Boolean(row.is_active),
  };
}

export function getShareById(id: string): DealShare | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM deal_shares WHERE id = ?`).get(id) as DealShareRow | undefined;

  if (!row) return null;
  return rowToDealShare(row);
}

export function getShareByToken(token: string): DealShare | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT * FROM deal_shares
    WHERE share_token = ?
    AND is_active = 1
    AND (expires_at IS NULL OR expires_at > datetime('now'))
  `).get(token) as DealShareRow | undefined;

  if (!row) return null;
  return rowToDealShare(row);
}

export function getSharesByDeal(dealId: string): DealShare[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM deal_shares WHERE deal_id = ? ORDER BY created_at DESC
  `).all(dealId) as DealShareRow[];

  return rows.map(rowToDealShare);
}

export function incrementShareViewCount(token: string): void {
  const db = getDb();
  db.prepare(`
    UPDATE deal_shares
    SET view_count = view_count + 1, last_viewed = datetime('now')
    WHERE share_token = ?
  `).run(token);
}

export function deactivateShare(id: string): void {
  const db = getDb();
  db.prepare(`UPDATE deal_shares SET is_active = 0 WHERE id = ?`).run(id);
}

function generateShareToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

// ============ Activity Log Operations ============

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

export function logActivity(
  userId: string | null,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, unknown>,
  ipAddress?: string
): void {
  const db = getDb();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId,
    action,
    entityType || null,
    entityId || null,
    details ? JSON.stringify(details) : null,
    ipAddress || null
  );
}

export function getActivityLogs(limit: number = 100): ActivityLog[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?
  `).all(limit) as ActivityLog[];
}

// ============ Initialize Admin User ============

export function ensureAdminExists(): void {
  const db = getDb();
  const adminExists = db.prepare(`
    SELECT COUNT(*) as count FROM users WHERE role = 'admin'
  `).get() as { count: number };

  if (adminExists.count === 0) {
    // Create default admin invite code
    createInviteCode('admin', null, 24 * 365); // 1 year expiry
    console.log('No admin exists. Create one using the invite system.');
  }
}
