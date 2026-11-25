import { jsonResponse, parseSafeJson, requireSameOrigin } from '../../_utils/security.js';
import { verifyAdminRequest } from '../../_utils/adminAuth.js';
import { dispatchOrderInSheet } from '../../_utils/gsheet.js';

export async function onRequestPost({ request, env }) {
  if (!requireSameOrigin(request)) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  const isAuthed = await verifyAdminRequest(request, env);
  if (!isAuthed) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const parsed = await parseSafeJson(request);
  if (!parsed.ok) {
    return jsonResponse({ error: parsed.error }, parsed.status);
  }

  const orderNo = typeof parsed.data.orderNo === 'string' ? parsed.data.orderNo.trim() : '';
  if (!/^WF\d{5}$/.test(orderNo)) {
    return jsonResponse({ error: 'Invalid order number.' }, 400);
  }

  try {
    const updated = await dispatchOrderInSheet(env, orderNo);
    if (!updated) {
      return jsonResponse({ error: 'Order not found or database unavailable.' }, 404);
    }
    return jsonResponse({ ok: true, orderNo });
  } catch {
    return jsonResponse({ error: 'Unable to dispatch order.' }, 500);
  }
}
