import Queue from "bull";
import webpush from "web-push";

import { NotificationEndpointType, prisma } from "@folks/db";

import { getURLMetadata } from "./lib/url_metadata";

const vapid_public_key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const vapid_private_key = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
  "mailto:folks@folkscommunity.com",
  vapid_public_key,
  vapid_private_key
);

export async function sendWebPushNotification(
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

export function workerThread(id: number) {
  console.log(`Worker thread #${id} started.`);

  const queue_send_notification = new Queue(
    "queue_send_notification",
    process.env.REDIS_URL!
  );

  queue_send_notification.process(1, async (job, done) => {
    try {
      const user_id = job.data.user_id;
      const title = job.data.title || "Folks";
      const body = job.data.body;
      const url = job.data.url;

      if (!user_id || !body) {
        return done();
      }

      const user = await prisma.user.findUnique({
        where: {
          id: BigInt(user_id)
        },
        include: {
          notification_endpoints: true
        }
      });

      if (!user || !user.notification_endpoints) {
        return done();
      }

      const web_push_endpoints = user.notification_endpoints.filter(
        (endpoint) => endpoint.type === NotificationEndpointType.WEBPUSH
      );

      for await (const endpoint of web_push_endpoints) {
        await sendWebPushNotification(endpoint.endpoint, title, body, url);
      }

      return done();
    } catch (e) {
      console.error(e);
    }

    done();
  });

  const queue_fetch_url_metadata = new Queue(
    "queue_fetch_url_metadata",
    process.env.REDIS_URL!
  );

  queue_fetch_url_metadata.process(1, async (job, done) => {
    try {
      const url = job.data.url;

      if (!url) {
        return done();
      }

      const metadata = await getURLMetadata(url);

      return done();
    } catch (e) {
      console.error(e);
    }

    done();
  });
}
