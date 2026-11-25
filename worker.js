import { onRequestGet as handleConfig } from './functions/api/config.js';
import { onRequestPost as handleOrder } from './functions/api/order.js';
import { onRequestPost as handleReview } from './functions/api/review.js';
import { onRequestPost as handleBug } from './functions/api/bug.js';
import { onRequestPost as handleAdminLogin } from './functions/api/admin/login.js';
import { onRequestPost as handleAdminLogout } from './functions/api/admin/logout.js';
import { onRequestGet as handleAdminOrders } from './functions/api/admin/orders.js';
import { onRequestPost as handleAdminDispatch } from './functions/api/admin/dispatch.js';

const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "media-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

function withSecurityHeaders(response, pathname, isHttps) {
  const headers = new Headers(response.headers);
  headers.set('Content-Security-Policy', CSP_HEADER);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (isHttps) {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/')) {
    headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const isHttps = url.protocol === 'https:';

    // Block XML / XXE request content types outright
    const reqCt = (request.headers.get('Content-Type') || '').toLowerCase();
    if (reqCt.includes('xml')) {
      return withSecurityHeaders(
        new Response(JSON.stringify({ error: 'Unsupported media type.' }), {
          status: 415,
          headers: { 'Content-Type': 'application/json' },
        }),
        url.pathname,
        isHttps
      );
    }

    let response;
    if (url.pathname === '/api/config' && request.method === 'GET') {
      response = await handleConfig({ request, env, ctx });
    } else if (url.pathname === '/api/order' && request.method === 'POST') {
      response = await handleOrder({ request, env, ctx });
    } else if (url.pathname === '/api/review' && request.method === 'POST') {
      response = await handleReview({ request, env, ctx });
    } else if (url.pathname === '/api/bug' && request.method === 'POST') {
      response = await handleBug({ request, env, ctx });
    } else if (url.pathname === '/api/admin/login' && request.method === 'POST') {
      response = await handleAdminLogin({ request, env, ctx });
    } else if (url.pathname === '/api/admin/logout' && request.method === 'POST') {
      response = await handleAdminLogout({ request, env, ctx });
    } else if (url.pathname === '/api/admin/orders' && request.method === 'GET') {
      response = await handleAdminOrders({ request, env, ctx });
    } else if (url.pathname === '/api/admin/dispatch' && request.method === 'POST') {
      response = await handleAdminDispatch({ request, env, ctx });
    } else {
      response = await env.ASSETS.fetch(request);
    }

    return withSecurityHeaders(response, url.pathname, isHttps);
  },
};
