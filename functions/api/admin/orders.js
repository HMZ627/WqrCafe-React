import { jsonResponse } from '../../_utils/security.js';
import { verifyAdminRequest } from '../../_utils/adminAuth.js';
import { listOrdersFromSheet } from '../../_utils/gsheet.js';

export async function onRequestGet({ request, env }) {
  const isAuthed = await verifyAdminRequest(request, env);
  if (!isAuthed) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  try {
    const result = await listOrdersFromSheet(env);
    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return jsonResponse({ error: 'Failed to load orders from Google Sheets.' }, 502);
  }
}
