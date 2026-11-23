import { onRequestGet as handleConfig } from './functions/api/config.js';
import { onRequestPost as handleOrder } from './functions/api/order.js';
import { onRequestPost as handleReview } from './functions/api/review.js';
import { onRequestPost as handleBug } from './functions/api/bug.js';

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

    return env.ASSETS.fetch(request);
  },
};
