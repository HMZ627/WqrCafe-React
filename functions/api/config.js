import { jsonResponse } from '../_utils/security.js';

export async function onRequestGet({ env }) {
  return jsonResponse({
    jazzcashNumber: env.JAZZCASH_NUMBER || '0300-0000000',
    jazzcashName: env.JAZZCASH_NAME || 'Waqar Foodies',
  });
}
