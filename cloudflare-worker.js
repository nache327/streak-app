/**
 * Streak App — Daily Reminder Worker
 *
 * Deploys to Cloudflare Workers (free tier).
 * Cron trigger: "0 0 * * *" (runs midnight UTC every day)
 *
 * OneSignal sends each notification at the correct local time per user
 * using delayed_option: "timezone" + delivery_time_of_day.
 *
 * Environment variables to set in Cloudflare dashboard:
 *   ONESIGNAL_APP_ID      — your OneSignal App ID
 *   ONESIGNAL_REST_API_KEY — your OneSignal REST API Key (keep secret)
 */

export default {
  // HTTP handler — allows manual trigger for testing
  async fetch(request, env) {
    if (request.method === 'POST') {
      await sendDailyReminders(env);
      return new Response('Reminders sent', { status: 200 });
    }
    return new Response('Streak Reminder Worker is running.', { status: 200 });
  },

  // Cron handler — fires every day at midnight UTC
  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendDailyReminders(env));
  },
};

async function sendDailyReminders(env) {
  await Promise.all([
    sendNotification(env, {
      filters: [{ field: 'tag', key: 'morning_enabled', relation: '=', value: 'true' }],
      headings: { en: 'Good Morning! 🔥' },
      contents: { en: "Stay strong today — your streak is counting on you. Let's go!" },
      delivery_time_of_day: '8:00AM',
    }),
    sendNotification(env, {
      filters: [{ field: 'tag', key: 'evening_enabled', relation: '=', value: 'true' }],
      headings: { en: 'Streak Check-In ✅' },
      contents: { en: "Don't forget to log your day! Keep the streak alive." },
      delivery_time_of_day: '8:00PM',
    }),
  ]);
}

async function sendNotification(env, payload) {
  const res = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${env.ONESIGNAL_REST_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_id: env.ONESIGNAL_APP_ID,
      delayed_option: 'timezone',   // delivers at the right local time per user
      ...payload,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('OneSignal error:', res.status, text);
  }
}
