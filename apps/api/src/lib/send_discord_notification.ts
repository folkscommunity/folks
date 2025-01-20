export async function sendDiscordNotification(message: string) {
  try {
    const discord_webhook_url = process.env.DISCORD_WEBHOOK_URL;

    if (!discord_webhook_url) {
      console.log("DISCORD_WEBHOOK_URL MISSING: " + message);
      return;
    }

    await fetch(discord_webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: message
      })
    });
  } catch (e) {}
}
