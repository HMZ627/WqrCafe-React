export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

export function generateOrderId() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  const num = 10000 + (arr[0] % 90000);
  return `WF${num}`;
}

export function sanitizeText(value, maxLen = 500) {
  if (!value || typeof value !== 'string') return '';
  return value
    .normalize('NFKC')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLen)
    .replace(/@/g, '@\u200b')
    .replace(/```/g, "'''");
}

export function validatePhone(phone) {
  const normalized = String(phone || '').replace(/[\s\-()]/g, '').trim();
  const valid =
    /^(\+92|0)?3\d{9}$/.test(normalized) || /^\+?\d{10,15}$/.test(normalized);
  return { valid, normalized };
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

  const isPng =
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47;
  const isJpg =
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;
  const isWebp =
    bytes.length >= 12 &&
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

  const ext = isPng ? 'png' : isWebp ? 'webp' : 'jpg';
  const mime = isPng ? 'image/png' : isWebp ? 'image/webp' : 'image/jpeg';
  return { valid: true, buffer, filename: `receipt.${ext}`, mime };
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
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
