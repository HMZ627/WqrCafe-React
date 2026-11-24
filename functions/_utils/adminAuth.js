const COOKIE_NAME = 'wf_admin_session';
const SESSION_TTL_SEC = 60 * 60 * 8; // 8 hours

export function constantTimeEqual(a, b) {
  const sa = String(a || '');
  const sb = String(b || '');
  const len = Math.max(sa.length, sb.length);
  let diff = sa.length ^ sb.length;
  for (let i = 0; i < len; i++) {
    diff |= (sa.charCodeAt(i) || 0) ^ (sb.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function toBase64Url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(env) {
  const secretSource =
    env.ADMIN_SESSION_SECRET ||
    `${env.ADMIN_NAME || ''}:${env.ADMIN_PASSWORD || ''}:wf-admin-v1`;
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(secretSource)
  );
  return crypto.subtle.importKey(
    'raw',
    digest,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createSessionCookie(env, isHttps) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC;
  const payloadObj = { sub: env.ADMIN_NAME || 'admin', exp };
  const payloadB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(payloadObj)));
  const key = await getHmacKey(env);
  const sig = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64))
  );
  const token = `${payloadB64}.${toBase64Url(sig)}`;
  const secureFlag = isHttps ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_SEC}${secureFlag}`;
}

export function clearSessionCookie(isHttps) {
  const secureFlag = isHttps ? '; Secure' : '';
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secureFlag}`;
}

function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
    }
  }
  return out;
}

export async function verifyAdminRequest(request, env) {
  if (!env.ADMIN_NAME || !env.ADMIN_PASSWORD) {
    return false;
  }
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  const token = cookies[COOKIE_NAME];
  if (!token || !token.includes('.')) return false;

  const [payloadB64, sigB64] = token.split('.');
  if (!payloadB64 || !sigB64) return false;

  try {
    const key = await getHmacKey(env);
    const sigBytes = fromBase64Url(sigB64);
    const validSig = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      new TextEncoder().encode(payloadB64)
    );
    if (!validSig) return false;

    const payloadJson = new TextDecoder().decode(fromBase64Url(payloadB64));
    const payload = JSON.parse(payloadJson);
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
    return constantTimeEqual(payload.sub, env.ADMIN_NAME);
  } catch {
    return false;
  }
}
