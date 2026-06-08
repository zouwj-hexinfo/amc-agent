import { authUsers, type AuthUserConfig } from './auth-config';

export const AUTH_COOKIE_NAME = 'amc_session';
export const AUTH_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export type AuthUser = {
  username: string;
  displayName: string;
  email: string;
  role: string;
  avatar: string;
};

type AuthSession = {
  id: string;
  username: string;
  expiresAt: number;
};

const sessions = new Map<string, AuthSession>();

function toAuthUser(user: AuthUserConfig): AuthUser {
  return {
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  };
}

function findUser(username: string) {
  return authUsers.find(user => user.username === username);
}

export function authenticateUser(username: string, password: string): AuthUser | null {
  const user = findUser(username.trim());
  if (!user || user.password !== password) return null;
  return toAuthUser(user);
}

export function createAuthSession(username: string, now = Date.now()) {
  const id = crypto.randomUUID();
  sessions.set(id, {
    id,
    username,
    expiresAt: now + AUTH_SESSION_TTL_MS,
  });
  return id;
}

export function getAuthUserBySession(sessionId: string | undefined, now = Date.now()): AuthUser | null {
  if (!sessionId) return null;
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (session.expiresAt <= now) {
    sessions.delete(sessionId);
    return null;
  }
  const user = findUser(session.username);
  return user ? toAuthUser(user) : null;
}

export function destroyAuthSession(sessionId: string | undefined) {
  if (!sessionId) return;
  sessions.delete(sessionId);
}

export function parseCookie(header: string | undefined, name: string) {
  if (!header) return undefined;
  const cookies = header.split(';').map(part => part.trim());
  for (const cookie of cookies) {
    const [cookieName, ...rawValue] = cookie.split('=');
    if (cookieName === name) return decodeURIComponent(rawValue.join('='));
  }
  return undefined;
}

export function buildSessionCookie(sessionId: string) {
  return `${AUTH_COOKIE_NAME}=${encodeURIComponent(sessionId)}; Max-Age=${AUTH_SESSION_TTL_MS / 1000}; Path=/; HttpOnly; SameSite=Lax`;
}

export function buildExpiredSessionCookie() {
  return `${AUTH_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`;
}

export function clearAuthSessionsForTests() {
  sessions.clear();
}
