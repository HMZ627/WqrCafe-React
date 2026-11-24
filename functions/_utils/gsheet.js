function safeCell(val) {
  const s = String(val ?? '');
  return /^[=+\-@]/.test(s) ? `'${s}` : s;
}

export async function appendOrderToSheet(env, order) {
  if (!env.GSHEET_SCRIPT_URL || !env.GSHEET_SCRIPT_SECRET) {
    return false;
  }

  const resp = await fetch(env.GSHEET_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: env.GSHEET_SCRIPT_SECRET,
      action: 'append',
      order: {
        orderId: safeCell(order.orderId),
        name: safeCell(order.name),
        address: safeCell(order.address),
        orderSummary: safeCell(order.orderSummary),
        phone: safeCell(order.phone),
        paymentMethod: safeCell(order.paymentMethod),
      },
    }),
  });

  if (!resp.ok) return false;
  const data = await resp.json().catch(() => ({}));
  return Boolean(data.ok);
}

export async function listOrdersFromSheet(env) {
  if (!env.GSHEET_SCRIPT_URL || !env.GSHEET_SCRIPT_SECRET) {
    return { configured: false, pending: [], totalDispatched: 0, sheetLink: env.GSHEET_LINK || '' };
  }

  const resp = await fetch(env.GSHEET_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: env.GSHEET_SCRIPT_SECRET,
      action: 'list',
    }),
  });

  if (!resp.ok) throw new Error('Unable to reach Google Apps Script.');
  const data = await resp.json();
  if (!data.ok) throw new Error(data.error || 'Unauthorized script response.');

  return {
    configured: true,
    pending: data.pending || [],
    totalDispatched: data.totalDispatched || 0,
    sheetLink: env.GSHEET_LINK || '',
  };
}

export async function dispatchOrderInSheet(env, orderNo) {
  if (!env.GSHEET_SCRIPT_URL || !env.GSHEET_SCRIPT_SECRET) {
    return false;
  }

  const resp = await fetch(env.GSHEET_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: env.GSHEET_SCRIPT_SECRET,
      action: 'dispatch',
      orderNo: String(orderNo || '').trim(),
    }),
  });

  if (!resp.ok) return false;
  const data = await resp.json().catch(() => ({}));
  return Boolean(data.ok);
}
