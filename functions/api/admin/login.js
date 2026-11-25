import {
  enforceRateLimit,
  jsonResponse,
  parseSafeJson,
  requireSameOrigin,
} from '../../_utils/security.js';
import { constantTimeEqual, createSessionCookie } from '../../_utils/adminAuth.js';

export async function onRequestPost({ request, env }) {
  if (!requireSameOrigin(request)) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  const rl = enforceRateLimit(request, 'admin_login', 6, 10 * 60 * 1000);
  if (!rl.allowed) {
    return jsonResponse({ error: 'Too many login attempts. Please try again later.' }, 429);
  }

  if (!env.ADMIN_NAME || !env.ADMIN_PASSWORD) {
    return jsonResponse({ error: 'Admin credentials are not configured on server.' }, 500);
  }

  const parsed = await parseSafeJson(request);
  if (!parsed.ok) {
    return jsonResponse({ error: parsed.error }, parsed.status);
  }

  const username = typeof parsed.data.username === 'string' ? parsed.data.username.trim() : '';
  const password = typeof parsed.data.password === 'string' ? parsed.data.password : '';

  const okUser = constantTimeEqual(username, env.ADMIN_NAME);
  const okPass = constantTimeEqual(password, env.ADMIN_PASSWORD);

  if (!okUser || !okPass) {
    await new Promise((r) => setTimeout(r, 350));
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
}
