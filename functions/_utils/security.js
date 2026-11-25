export async function sendDiscordEmbed(webhookUrl, payload, fileInfo = null) {
  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    return false;
  }

  const safePayload = {
    ...payload,
    allowed_mentions: { parse: [] },
  };

  try {
    if (fileInfo) {
      const form = new FormData();
      form.append('payload_json', JSON.stringify(safePayload));
      form.append(
        'files[0]',
        new Blob([fileInfo.buffer], { type: fileInfo.mime }),
        fileInfo.filename
      );
      const resp = await fetch(webhookUrl, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(9000),
      });
      return resp.ok;
    }

    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(safePayload),
      signal: AbortSignal.timeout(9000),
    });
    return resp.ok;
  } catch {
    return false;
  }
}
