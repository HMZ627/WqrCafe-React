import {
  enforceRateLimit,
  jsonResponse,
  parseSafeJson,
  requireSameOrigin,
  sanitizeText,
  sendDiscordEmbed,
} from '../_utils/security.js';

export async function onRequestPost({ request, env }) {
  if (!requireSameOrigin(request)) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  const rl = enforceRateLimit(request, 'bug', 1, 12000);
  if (!rl.allowed) {
    return jsonResponse({ error: `Please wait ${rl.retryAfterSec}s before submitting another report.` }, 429);
  }

  const parsed = await parseSafeJson(request);
  if (!parsed.ok) {
    return jsonResponse({ error: parsed.error }, parsed.status);
  }

  const body = parsed.data;
  const name = sanitizeText(body.name, 60) || 'Anonymous';
  const text = sanitizeText(body.text, 1000);

  if (text.length < 8) {
    return jsonResponse({ error: 'Please provide a clear description of the bug.' }, 400);
  }

  const embed = {
    title: 'New Bug Report',
    color: 0xc94a4a,
    fields: [
      { name: 'Reporter', value: name, inline: true },
      { name: 'Bug Description', value: text, inline: false },
    ],
    footer: { text: 'Waqar Foodies • Bug Tracker' },
    timestamp: new Date().toISOString(),
  };

  const sent = await sendDiscordEmbed(env.DISCORD_BUG_WEBHOOK, {
    username: 'Waqar Foodies Bugs',
    embeds: [embed],
  });

  if (!sent) {
    return jsonResponse({ error: 'Could not send bug report right now.' }, 502);
  }

  return jsonResponse({ ok: true });
}
