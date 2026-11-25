import {
  enforceRateLimit,
  generateOrderId,
  jsonResponse,
  parseSafeOrderForm,
  requireSameOrigin,
  sanitizeText,
  sendDiscordEmbed,
  validateImageFile,
  validatePhone,
} from '../_utils/security.js';
import { appendOrderToSheet } from '../_utils/gsheet.js';

const MENU_CATALOG = {
  tower_burger: { name: 'Tower Burger', price: 500 },
  paratha_roll: { name: 'Chicken Paratha Roll', price: 350 },
};

export async function onRequestPost({ request, env }) {
  if (!requireSameOrigin(request)) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  const rl = enforceRateLimit(request, 'order', 1, 15000);
  if (!rl.allowed) {
    return jsonResponse({ error: `Please wait ${rl.retryAfterSec}s before placing another order.` }, 429);
  }

  const parsed = await parseSafeOrderForm(request);
  if (!parsed.ok) {
    return jsonResponse({ error: parsed.error }, parsed.status);
  }

  try {
    const formData = parsed.formData;
    const name = sanitizeText(formData.get('name'), 80);
    const address = sanitizeText(formData.get('address'), 250);
    const { valid: validPhone, normalized: phone } = validatePhone(formData.get('phone'));
    const paymentMethod =
      formData.get('paymentMethod') === 'Online (JazzCash)'
        ? 'Online (JazzCash)'
        : 'Cash on Delivery (COD)';

    let rawItems = [];
    try {
      const rawJson = formData.get('items');
      if (typeof rawJson !== 'string' || rawJson.length > 2048) {
        return jsonResponse({ error: 'Invalid cart data.' }, 400);
      }
      rawItems = JSON.parse(rawJson);
      if (!Array.isArray(rawItems)) throw new Error('Not array');
    } catch {
      return jsonResponse({ error: 'Invalid cart data.' }, 400);
    }

    const verifiedItems = [];
    let grandTotal = 0;
    for (const entry of rawItems.slice(0, 20)) {
      const meta = MENU_CATALOG[entry?.id];
      const qty = Math.min(50, Math.max(0, parseInt(entry?.qty, 10) || 0));
      if (meta && qty > 0) {
        verifiedItems.push({ name: meta.name, price: meta.price, qty });
        grandTotal += meta.price * qty;
      }
    }

    const errors = [];
    if (verifiedItems.length === 0) errors.push('Your order bag is empty.');
    if (name.length < 2) errors.push('Full Name is required.');
    if (address.length < 8) errors.push('Complete Delivery Address is required.');
    if (!validPhone) errors.push('Valid Phone Number is required (e.g. 03001234567).');

    let fileInfo = null;
    if (paymentMethod === 'Online (JazzCash)') {
      const receipt = formData.get('receipt');
      const imgCheck = await validateImageFile(receipt);
      if (!imgCheck.valid) {
        errors.push(imgCheck.error);
      } else {
        fileInfo = imgCheck;
      }
    }

    if (errors.length > 0) {
      return jsonResponse({ error: errors.join(' ') }, 400);
    }

    const orderId = generateOrderId();
    const itemsSummary = verifiedItems
      .map((i) => `• **${i.name}** x ${i.qty} — \`PKR ${(i.price * i.qty).toLocaleString()}/-\``)
      .join('\n');

    const sheetOrderText =
      verifiedItems.map((i) => `${i.name} x ${i.qty}`).join(', ') +
      ` (PKR ${grandTotal.toLocaleString()}/-)`;

    const embed = {
      title: `New Order Received — ${orderId}`,
      color: 0xd4af37,
      fields: [
        { name: 'Order ID', value: `\`${orderId}\``, inline: true },
        { name: 'Payment Method', value: paymentMethod, inline: true },
        { name: 'Grand Total', value: `**PKR ${grandTotal.toLocaleString()}/-**`, inline: true },
        { name: 'Customer Name', value: name, inline: true },
        { name: 'Phone', value: phone, inline: true },
        { name: 'Delivery Address', value: address, inline: false },
        { name: 'Order Items', value: itemsSummary, inline: false },
      ],
      footer: { text: 'Waqar Foodies • Secure Order Pipeline' },
      timestamp: new Date().toISOString(),
    };

    if (fileInfo) {
      embed.image = { url: `attachment://${fileInfo.filename}` };
    }

    const [discordResult] = await Promise.allSettled([
      sendDiscordEmbed(
        env.DISCORD_ORDER_WEBHOOK,
        { username: 'Waqar Foodies Orders', embeds: [embed] },
        fileInfo
      ),
      appendOrderToSheet(env, {
        orderId,
        name,
        address,
        orderSummary: sheetOrderText,
        phone,
        paymentMethod,
      }).catch(() => false),
    ]);

    const discordSent = discordResult.status === 'fulfilled' && discordResult.value;
    if (!discordSent) {
      return jsonResponse({ error: 'Unable to submit order right now. Please try again shortly.' }, 502);
    }

    return jsonResponse({ ok: true, orderId });
  } catch {
    return jsonResponse({ error: 'Unable to process order.' }, 500);
  }
}
