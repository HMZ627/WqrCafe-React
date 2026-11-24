import { clearSessionCookie } from '../../_utils/adminAuth.js';

export async function onRequestPost({ request }) {
  const isHttps = new URL(request.url).protocol === 'https:';
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearSessionCookie(isHttps),
      'Cache-Control': 'no-store',
    },
  });
}
