/**
 * Authentication Utilities
 * JWT-based authentication with bcrypt password hashing
 */

import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';
import {
  getUserByEmail,
  createUser,
  updateUserLastLogin,
  getInviteCodeByCode,
  markInviteCodeUsed,
  logActivity,
  type User,
} from './db';

// JWT configuration
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'laaa-secure-secret-key-change-in-production'
);
const JWT_ISSUER = 'laaa-app';
const JWT_AUDIENCE = 'laaa-users';
const SESSION_DURATION = 24 * 60 * 60; // 24 hours in seconds

// Cookie configuration
const AUTH_COOKIE = 'laaa_session';

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: 'admin' | 'team' | 'client';
  exp: number;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a JWT session token
 */
export async function createSessionToken(user: User): Promise<string> {
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode a JWT session token
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as 'admin' | 'team' | 'client',
      exp: payload.exp as number,
    };
  } catch {
    return null;
  }
}

/**
 * Get current session from cookies (server-side)
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;

  if (!token) return null;

  return verifySessionToken(token);
}

/**
 * Set session cookie (server-side)
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  });
}

/**
 * Clear session cookie (server-side)
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
}

/**
 * Login with email and password
 */
export async function login(
  email: string,
  password: string,
  ipAddress?: string
): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
  const user = getUserByEmail(email);

  if (!user) {
    logActivity(null, 'login_failed', 'user', undefined, { email, reason: 'not_found' }, ipAddress);
    return { success: false, error: 'Invalid email or password' };
  }

  const isValid = await verifyPassword(password, user.password_hash);

  if (!isValid) {
    logActivity(user.id, 'login_failed', 'user', user.id, { reason: 'invalid_password' }, ipAddress);
    return { success: false, error: 'Invalid email or password' };
  }

  // Update last login
  updateUserLastLogin(user.id);

  // Create session token
  const token = await createSessionToken(user);

  logActivity(user.id, 'login_success', 'user', user.id, {}, ipAddress);

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: user.last_login,
      is_active: user.is_active,
    },
    token,
  };
}

/**
 * Register a new user with invite code
 */
export async function register(
  email: string,
  password: string,
  name: string,
  inviteCode: string,
  ipAddress?: string
): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
  // Validate invite code
  const invite = getInviteCodeByCode(inviteCode);

  if (!invite) {
    logActivity(null, 'register_failed', 'invite', undefined, { email, reason: 'invalid_code' }, ipAddress);
    return { success: false, error: 'Invalid or expired invite code' };
  }

  // Check if email already exists
  const existingUser = getUserByEmail(email);
  if (existingUser) {
    logActivity(null, 'register_failed', 'user', undefined, { email, reason: 'email_exists' }, ipAddress);
    return { success: false, error: 'Email already registered' };
  }

  // Validate password strength
  if (password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters' };
  }

  // Hash password and create user
  const passwordHash = await hashPassword(password);
  const user = createUser({
    email,
    password_hash: passwordHash,
    name,
    role: invite.role,
  });

  // Mark invite code as used
  markInviteCodeUsed(inviteCode, user.id);

  // Create session token
  const token = await createSessionToken(user);

  logActivity(user.id, 'register_success', 'user', user.id, { role: invite.role }, ipAddress);

  return { success: true, user, token };
}

/**
 * Logout
 */
export async function logout(userId?: string, ipAddress?: string): Promise<void> {
  if (userId) {
    logActivity(userId, 'logout', 'user', userId, {}, ipAddress);
  }
  await clearSessionCookie();
}

/**
 * Check if user has required role
 */
export function hasRole(
  session: SessionPayload | null,
  allowedRoles: ('admin' | 'team' | 'client')[]
): boolean {
  if (!session) return false;
  return allowedRoles.includes(session.role);
}

/**
 * Require authentication middleware helper
 */
export async function requireAuth(
  allowedRoles?: ('admin' | 'team' | 'client')[]
): Promise<{ session: SessionPayload } | { error: string; status: number }> {
  const session = await getSession();

  if (!session) {
    return { error: 'Unauthorized', status: 401 };
  }

  if (allowedRoles && !hasRole(session, allowedRoles)) {
    return { error: 'Forbidden', status: 403 };
  }

  return { session };
}
