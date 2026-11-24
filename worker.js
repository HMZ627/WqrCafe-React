import { onRequestGet as handleConfig } from './functions/api/config.js';
import { onRequestPost as handleOrder } from './functions/api/order.js';
import { onRequestPost as handleReview } from './functions/api/review.js';
import { onRequestPost as handleBug } from './functions/api/bug.js';
import { onRequestPost as handleAdminLogin } from './functions/api/admin/login.js';
import { onRequestPost as handleAdminLogout } from './functions/api/admin/logout.js';
import { onRequestGet as handleAdminOrders } from './functions/api/admin/orders.js';
import { onRequestPost as handleAdminDispatch } from './functions/api/admin/dispatch.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/config' && request.method === 'GET') {
      return handleConfig({ request, env, ctx });
    }
    if (url.pathname === '/api/order' && request.method === 'POST') {
      return handleOrder({ request, env, ctx });
    }
    if (url.pathname === '/api/review' && request.method === 'POST') {
      return handleReview({ request, env, ctx });
    }
    if (url.pathname === '/api/bug' && request.method === 'POST') {
      return handleBug({ request, env, ctx });
    }
    if (url.pathname === '/api/admin/login' && request.method === 'POST') {
      return handleAdminLogin({ request, env, ctx });
    }
    if (url.pathname === '/api/admin/logout' && request.method === 'POST') {
      return handleAdminLogout({ request, env, ctx });
    }
    if (url.pathname === '/api/admin/orders' && request.method === 'GET') {
      return handleAdminOrders({ request, env, ctx });
    }
    if (url.pathname === '/api/admin/dispatch' && request.method === 'POST') {
      return handleAdminDispatch({ request, env, ctx });
    }

    return env.ASSETS.fetch(request);
  },
};
