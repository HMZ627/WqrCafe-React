export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_IMAGE_DIMENSION = 8192; // Blocks pixel-flood / decompression bombs
const MAX_JSON_BYTES = 16 * 1024; // 16 KB
const MAX_MULTIPART_BYTES = 2.5 * 1024 * 1024; // 2.5 MB

// Lightweight per-isolate rate limiter (resets cleanly if map grows)
const rateBucket = new Map();

export function getClientIp(request) {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export function enforceRateLimit(request, action, maxHits, windowMs) {
  const now = Date.now();
  if (rateBucket.size > 500) {
    for (const [k, v] of rateBucket.entries()) {
      if (v.resetAt <= now) rateBucket.delete(k);
    }
    if (rateBucket.size > 500) rateBucket.clear();
  }

  const key = `${action}:${getClientIp(request)}`;
  const entry = rateBucket.get(key);
  if (!entry || entry.resetAt <= now) {
    rateBucket.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (entry.count >= maxHits) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

export function requireSameOrigin(request) {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');
  const referer = request.headers.get('Referer');

  if (origin) {
    try {
      return new URL(origin).host === url.host;
    } catch {
      return false;
    }
  }
  if (referer) {
    try {
      return new URL(referer).host === url.host;
    } catch {
      return false;
    }
  }
  return false;
}

export async function parseSafeJson(request) {
  const ct = (request.headers.get('Content-Type') || '').toLowerCase();
  if (!ct.includes('application/json')) {
    return { ok: false, status: 415, error: 'Unsupported content type.' };
  }

  const cl = parseInt(request.headers.get('Content-Length') || '0', 10);
  if (cl > MAX_JSON_BYTES) {
    return { ok: false, status: 413, error: 'Payload too large.' };
  }

  const rawText = await request.text();
  if (rawText.length > MAX_JSON_BYTES) {
    return { ok: false, status: 413, error: 'Payload too large.' };
  }

  try {
    const data = JSON.parse(rawText);
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { ok: false, status: 400, error: 'Invalid JSON payload.' };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, status: 400, error: 'Malformed JSON.' };
  }
}

export async function parseSafeOrderForm(request) {
  const ct = (request.headers.get('Content-Type') || '').toLowerCase();
  if (!ct.includes('multipart/form-data')) {
    return { ok: false, status: 415, error: 'Unsupported content type.' };
  }
  const cl = parseInt(request.headers.get('Content-Length') || '0', 10);
  if (cl > MAX_MULTIPART_BYTES) {
    return { ok: false, status: 413, error: 'Order payload exceeds maximum size.' };
  }
  try {
    const formData = await request.formData();
    return { ok: true, formData };
  } catch {
    return { ok: false, status: 400, error: 'Invalid form submission.' };
  }
}

export function generateOrderId() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  const num = 10000 + (arr[0] % 90000);
  return `WF${num}`;
}

export function sanitizeText(value, maxLen = 500) {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFKC')
    // Strip control chars + Bidi/zero-width spoofing overrides
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, '')
    .trim()
    .slice(0, maxLen)
    // Neutralize Discord @mentions & code-block escapes
    .replace(/@/g, '@\u200b')
    .replace(/```/g, "'''");
}

export function validatePhone(phone) {
  if (typeof phone !== 'string') return { valid: false, normalized: '' };
  const normalized = phone.replace(/[\s\-()]/g, '').trim();
  const valid =
    /^(\+92|0)?3\d{9}$/.test(normalized) || /^\+?\d{10,15}$/.test(normalized);
  return { valid, normalized };
}

function getPngDimensions(bytes) {
  if (bytes.length < 24) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16, false), height: view.getUint32(20, false) };
}

function getJpegDimensions(bytes) {
  let pos = 2;
  let steps = 0;
  while (pos + 9 < bytes.length && steps++ < 256) {
    if (bytes[pos] !== 0xff) break;
    const marker = bytes[pos + 1];
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      return {
        height: view.getUint16(pos + 5, false),
        width: view.getUint16(pos + 7, false),
      };
    }
    if (pos + 4 >= bytes.length) break;
    const segLen = (bytes[pos + 2] << 8) | bytes[pos + 3];
    if (segLen < 2) break;
    pos += 2 + segLen;
  }
  return null;
}

function getWebpDimensions(bytes) {
  if (bytes.length < 30) return null;
  const tag = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
  if (tag === 'VP8 ') {
    return {
      width: (bytes[26] | (bytes[27] << 8)) & 0x3fff,
      height: (bytes[28] | (bytes[29] << 8)) & 0x3fff,
    };
  }
  if (tag === 'VP8L') {
    const b0 = bytes[21], b1 = bytes[22], b2 = bytes[23], b3 = bytes[24];
    const bits = b0 | (b1 << 8) | (b2 << 16) | (b3 << 24);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (tag === 'VP8X') {
    const width = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16));
    const height = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16));
    return { width, height };
  }
  return null;
}

export async function validateImageFile(file) {
  if (!file || typeof file.arrayBuffer !== 'function') {
    return { valid: false, error: 'Please upload your JazzCash payment screenshot.' };
  }
  if (file.size === 0) {
    return { valid: false, error: 'Uploaded screenshot is empty.' };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { valid: false, error: 'Screenshot exceeds the 2 MB maximum size limit.' };
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Explicit check against XML / SVG / HTML polyglot payloads
  const headText = new TextDecoder().decode(bytes.slice(0, 64)).trimStart().toLowerCase();
  if (headText.startsWith('<') || headText.includes('<?xml') || headText.includes('<svg')) {
    return { valid: false, error: 'Invalid file format.' };
  }

  const isPng =
    bytes.length >= 24 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47;
  const isJpg =
    bytes.length >= 4 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;
  const isWebp =
    bytes.length >= 30 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;

  if (!isPng && !isJpg && !isWebp) {
    return { valid: false, error: 'Only valid PNG, JPG, JPEG, or WEBP images are allowed.' };
  }

  const dims = isPng
    ? getPngDimensions(bytes)
    : isJpg
    ? getJpegDimensions(bytes)
    : getWebpDimensions(bytes);

  if (
    !dims ||
    dims.width <= 0 ||
    dims.height <= 0 ||
    dims.width > MAX_IMAGE_DIMENSION ||
    dims.height > MAX_IMAGE_DIMENSION
  ) {
    return { valid: false, error: 'Image dimensions are invalid or too large.' };
  }

  const ext = isPng ? 'png' : isWebp ? 'webp' : 'jpg';
  const mime = isPng ? 'image/png' : isWebp ? 'image/webp' : 'image/jpeg';
  return { valid: true, buffer, filename: `receipt.${ext}`, mime };
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function sendDiscordEmbed(webhookUrl, payload, fileInfo = null) {
  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    return false;
  }

  const safePayload = {
    ...payload,
    allowed_mentions: { parse: [] },
  };

  if (fileInfo) {
    const form = new FormData();
    form.append('payload_json', JSON.stringify(safePayload));
    form.append(
      'files[0]',
      new Blob([fileInfo.buffer], { type: fileInfo.mime }),
      fileInfo.filename
    );
    const resp = await fetch(webhookUrl, { method: 'POST', body: form });
    return resp.ok;
  }

  const resp = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(safePayload),
  });
  return resp.ok;
}
