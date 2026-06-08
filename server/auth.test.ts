import { afterEach, describe, expect, test } from 'bun:test';
import { app } from './index';
import { AUTH_COOKIE_NAME, clearAuthSessionsForTests } from './auth';

afterEach(() => {
  clearAuthSessionsForTests();
});

function sessionCookie(response: Response) {
  const cookie = response.headers.get('set-cookie') || '';
  const match = cookie.match(new RegExp(`${AUTH_COOKIE_NAME}=([^;]+)`));
  return match ? `${AUTH_COOKIE_NAME}=${match[1]}` : '';
}

describe('auth API', () => {
  test('logs in with configured admin credentials and returns user profile', async () => {
    const response = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123456' }),
    });
    const data = await response.json() as {
      user?: { username: string; displayName: string; email: string; role: string; avatar: string };
    };

    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain(`${AUTH_COOKIE_NAME}=`);
    expect(data.user).toEqual({
      username: 'admin',
      displayName: 'Admin',
      email: 'admin@amc.local',
      role: '系统管理员',
      avatar: 'AD',
    });
  });

  test('rejects invalid credentials', async () => {
    const response = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrong' }),
    });

    expect(response.status).toBe(401);
  });

  test('protects project APIs until a session cookie is present', async () => {
    const response = await app.request('/api/projects');
    expect(response.status).toBe(401);
  });

  test('allows protected APIs with a valid session cookie', async () => {
    const login = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123456' }),
    });
    const cookie = sessionCookie(login);

    const response = await app.request('/api/projects', {
      headers: { Cookie: cookie },
    });

    expect(response.status).toBe(200);
  });

  test('invalidates the session after logout', async () => {
    const login = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123456' }),
    });
    const cookie = sessionCookie(login);

    const logout = await app.request('/api/auth/logout', {
      method: 'POST',
      headers: { Cookie: cookie },
    });
    const response = await app.request('/api/projects', {
      headers: { Cookie: cookie },
    });

    expect(logout.status).toBe(200);
    expect(response.status).toBe(401);
  });
});
