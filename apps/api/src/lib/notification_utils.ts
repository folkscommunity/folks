import webpush from "web-push";

import { NotificationEndpointType, prisma } from "@folks/db";

const vapid_public_key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const vapid_private_key = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
  "mailto:folks@folkscommunity.com",
  vapid_public_key,
  vapid_private_key
);

async function sendWebPushNotification(
  endpoint: any,
  title: string,
  body: string,
  url?: string
) {
  try {
    await webpush.sendNotification(
      {
        endpoint: endpoint.endpoint,
        keys: {
          auth: endpoint.keys.auth,
          p256dh: endpoint.keys.p256dh
        }
      },
      JSON.stringify({
        title: title,
        body: body,
        url: url || undefined
      })
    );
  } catch (e) {
    console.error(e);
  }
}

export async function sendNotification(
  user_id: bigint,
  title: string,
  body: string,
  url?: string
) {
  try {
    const endpoints = await prisma.notificationEndpoint.findMany({
      where: {
        user_id: user_id
      }
    });

    if (!endpoints) {
      return;
    }

    const web_push_endpoints = endpoints.filter(
      (endpoint) => endpoint.type === NotificationEndpointType.WEBPUSH
    );

    for await (const endpoint of web_push_endpoints) {
      await sendWebPushNotification(endpoint.endpoint, title, body, url);
    }

    return true;
  } catch (e) {
    console.error(e);
  }
}
