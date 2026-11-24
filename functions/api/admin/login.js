import { jsonResponse } from '../../_utils/security.js';
import { constantTimeEqual, createSessionCookie } from '../../_utils/adminAuth.js';

export async function onRequestPost({ request, env }) {
  try {
    if (!env.ADMIN_NAME || !env.ADMIN_PASSWORD) {
      return jsonResponse({ error: 'Admin credentials are not configured on server.' }, 500);
    }

    const body = await request.json();
    const username = String(body.username || '').trim();
    const password = String(body.password || '');

    const okUser = constantTimeEqual(username, env.ADMIN_NAME);
    const okPass = constantTimeEqual(password, env.ADMIN_PASSWORD);

    if (!okUser || !okPass) {
      await new Promise((r) => setTimeout(r, 250));
      return jsonResponse({ error: 'Invalid admin username or password.' }, 401);
    }

    const isHttps = new URL(request.url).protocol === 'https:';
    const cookie = await createSessionCookie(env, isHttps);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return jsonResponse({ error: 'Invalid login request.' }, 400);
  }
}
