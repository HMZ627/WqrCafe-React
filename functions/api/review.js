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

  const rl = enforceRateLimit(request, 'review', 1, 12000);
  if (!rl.allowed) {
    return jsonResponse({ error: `Please wait ${rl.retryAfterSec}s before submitting another review.` }, 429);
  }

  const parsed = await parseSafeJson(request);
  if (!parsed.ok) {
    return jsonResponse({ error: parsed.error }, parsed.status);
  }

  const body = parsed.data;
  const name = sanitizeText(body.name, 60) || 'Guest';
  const text = sanitizeText(body.text, 800);
  const stars = Math.min(5, Math.max(1, parseInt(body.stars, 10) || 0));

  if (!body.stars || stars < 1 || stars > 5) {
    return jsonResponse({ error: 'Please select a star rating (1 to 5 stars).' }, 400);
  }
  if (text.length < 5) {
    return jsonResponse({ error: 'Please write at least a few words in your review.' }, 400);
  }

  const embed = {
    title: 'New Customer Review',
    color: 0xe5b84b,
    fields: [
      { name: 'Reviewer', value: name, inline: true },
      { name: 'Rating', value: `${stars} / 5 Stars`, inline: true },
      { name: 'Review', value: text, inline: false },
    ],
    footer: { text: 'Waqar Foodies • Reviews' },
    timestamp: new Date().toISOString(),
  };

  const sent = await sendDiscordEmbed(env.DISCORD_REVIEW_WEBHOOK, {
    username: 'Waqar Foodies Reviews',
    embeds: [embed],
  });

  if (!sent) {
    return jsonResponse({ error: 'Could not send review right now.' }, 502);
  }

  return jsonResponse({ ok: true, review: { name, stars, text } });
}
