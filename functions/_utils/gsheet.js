const SHEET_HEADERS = [
  'Sr.',
  'Order No.',
  'Name',
  'Address',
  'Order',
  'Phone',
  'Status',
  'Payment Method',
];

function extractSpreadsheetId(link) {
  if (!link || typeof link !== 'string') return '';
  const match = link.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  // Allow raw ID as fallback
  if (/^[a-zA-Z0-9-_]{20,}$/.test(link.trim())) return link.trim();
  return '';
}

function safeCell(val) {
  const s = String(val ?? '');
  // Prevent formula execution in Google Sheets while preserving literal text (e.g. +92...)
  return /^[=+\-@]/.test(s) ? `'${s}` : s;
}

function toBase64UrlBytes(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToArrayBuffer(rawPem) {
  const normalized = String(rawPem || '').replace(/\\n/g, '\n');
  const b64 = normalized
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes.buffer;
}

async function getGoogleAccessToken(env) {
  const email = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = env.GOOGLE_PRIVATE_KEY;
  if (!email || !privateKey) {
    throw new Error('Google Service Account credentials not configured.');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const enc = new TextEncoder();
  const signingInput = `${toBase64UrlBytes(enc.encode(JSON.stringify(header)))}.${toBase64UrlBytes(
    enc.encode(JSON.stringify(claims))
  )}`;

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, enc.encode(signingInput))
  );

  const assertion = `${signingInput}.${toBase64UrlBytes(signature)}`;

  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!tokenResp.ok) {
    throw new Error('Failed to authenticate with Google Sheets.');
  }
  const tokenData = await tokenResp.json();
  return tokenData.access_token;
}

export function isGSheetConfigured(env) {
  const hasServiceAuth = Boolean(
    extractSpreadsheetId(env.GSHEET_LINK) &&
      env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      env.GOOGLE_PRIVATE_KEY
  );
  const hasScript = Boolean(env.GSHEET_SCRIPT_URL);
  return hasServiceAuth || hasScript;
}

async function fetchSheetValues(sheetId, accessToken) {
  const resp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:H`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!resp.ok) throw new Error('Unable to read Google Sheet.');
  const data = await resp.json();
  return data.values || [];
}

async function ensureHeaders(sheetId, accessToken, existingValues) {
  if (existingValues.length > 0) return existingValues.length;
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:H1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [SHEET_HEADERS] }),
    }
  );
  return 1; // Header is row 1, so next Sr. is 1
}

export async function appendOrderToSheet(env, order) {
  // Optional Apps Script fallback if user configured GSHEET_SCRIPT_URL instead
  if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GSHEET_SCRIPT_URL) {
    const resp = await fetch(env.GSHEET_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'append', order }),
    });
    return resp.ok;
  }

  const sheetId = extractSpreadsheetId(env.GSHEET_LINK);
  if (!sheetId || !env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_PRIVATE_KEY) {
    return false;
  }

  const token = await getGoogleAccessToken(env);
  const existing = await fetchSheetValues(sheetId, token);
  const rowCount = await ensureHeaders(sheetId, token, existing);
  const nextSr = rowCount; // Row 1 = headers -> first order Sr. = 1

  const row = [
    String(nextSr),
    safeCell(order.orderId),
    safeCell(order.name),
    safeCell(order.address),
    safeCell(order.orderSummary),
    safeCell(order.phone),
    'Pending',
    safeCell(order.paymentMethod),
  ];

  const resp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:H:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );
  return resp.ok;
}

export async function listOrdersFromSheet(env) {
  if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GSHEET_SCRIPT_URL) {
    const resp = await fetch(env.GSHEET_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list' }),
    });
    if (!resp.ok) throw new Error('Unable to fetch orders from sheet.');
    return resp.json();
  }

  const sheetId = extractSpreadsheetId(env.GSHEET_LINK);
  if (!sheetId || !env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_PRIVATE_KEY) {
    return { configured: false, pending: [], totalDispatched: 0 };
  }

  const token = await getGoogleAccessToken(env);
  const values = await fetchSheetValues(sheetId, token);

  const pending = [];
  let totalDispatched = 0;

  for (let i = 1; i < values.length; i++) {
    const r = values[i] || [];
    const status = (r[6] || 'Pending').trim();
    if (status.toLowerCase() === 'dispatched') {
      totalDispatched += 1;
      continue;
    }
    pending.push({
      sr: r[0] || String(i),
      orderNo: r[1] || '',
      name: r[2] || '',
      address: r[3] || '',
      order: r[4] || '',
      phone: r[5] || '',
      status: status || 'Pending',
      paymentMethod: r[7] || 'Cash on Delivery (COD)',
    });
  }

  return {
    configured: true,
    pending,
    totalDispatched,
    sheetLink: env.GSHEET_LINK || '',
  };
}

export async function dispatchOrderInSheet(env, orderNo) {
  if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GSHEET_SCRIPT_URL) {
    const resp = await fetch(env.GSHEET_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'dispatch', orderNo }),
    });
    return resp.ok;
  }

  const sheetId = extractSpreadsheetId(env.GSHEET_LINK);
  if (!sheetId || !env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_PRIVATE_KEY) {
    return false;
  }

  const token = await getGoogleAccessToken(env);
  const values = await fetchSheetValues(sheetId, token);

  for (let i = 1; i < values.length; i++) {
    if (String(values[i]?.[1] || '').trim() === String(orderNo).trim()) {
      const rowNumber = i + 1;
      const resp = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/G${rowNumber}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [['Dispatched']] }),
        }
      );
      return resp.ok;
    }
  }
  return false;
}
