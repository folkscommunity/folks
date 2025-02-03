/* eslint-disable prefer-const */
import { DetectModerationLabelsCommand } from "@aws-sdk/client-rekognition";
import Queue from "bull";
import sharp from "sharp";
import webpush from "web-push";

import { NotificationEndpointType, prisma } from "@folks/db";

import { Sentry } from "./instrument";
import { rekognition } from "./lib/aws";
import { posthog } from "./lib/posthog";
import { sendDiscordNotification } from "./lib/send_discord_notification";
import { getURLMetadata } from "./lib/url_metadata";

const vapid_public_key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const vapid_private_key = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
  "mailto:folks@folkscommunity.com",
  vapid_public_key,
  vapid_private_key
);

const forbidden_labels = ["Explicit Nudity", "Visually Disturbing"];

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
      Sentry.captureException(e, {
        tags: {
          job: "send_notification",
          job_id: job.id,
          data: job.data
        }
      });

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
      Sentry.captureException(e, {
        tags: {
          job: "fetch_url_metadata",
          job_id: job.id,
          data: job.data
        }
      });

      console.error(e);
    }

    done();
  });

  const queue_scan_images = new Queue(
    "queue_scan_images",
    process.env.REDIS_URL!
  );

  queue_scan_images.process(1, async (job, done) => {
    try {
      const attachment_id = job.data.attachment_id;
      const data = job.data.data;

      if (!attachment_id || !data) {
        return done();
      }

      if (
        !process.env.AWS_ACCESS_KEY_ID ||
        !process.env.AWS_SECRET_ACCESS_KEY
      ) {
        return done();
      }

      const attachment = await prisma.attachment.findUnique({
        where: {
          id: attachment_id
        },
        include: {
          post: {
            select: {
              id: true,
              author: true
            }
          }
        }
      });

      const image = await sharp(Buffer.from(data), {
        animated: false
      })
        .resize({
          withoutEnlargement: true,
          width: 1000
        })
        .jpeg()
        .toBuffer();

      const command = new DetectModerationLabelsCommand({
        Image: { Bytes: image }
      });

      const response = await rekognition.send(command);

      const moderation_labels = response.ModerationLabels || [];

      let rejected = false;
      let rejected_reasons = [];

      for await (const label of moderation_labels) {
        if (forbidden_labels.includes(label.Name!)) {
          rejected = true;
          rejected_reasons.push(label.Name);
        }
      }

      if (!rejected) {
        return done();
      }

      await sendDiscordNotification(
        `Image (${attachment_id}) posted (${attachment.post.id}) by @${attachment.post.author.username} was rejected because it contains ${rejected_reasons.join(", ").toLowerCase()}.\n\n\n${attachment.url}`
      );

      await posthog.capture({
        event: "image_rejected",
        distinctId: attachment.post.author.id.toString(),
        properties: {
          attachment_id: attachment.id.toString(),
          post_id: attachment.post.id.toString(),
          rejected_reasons: rejected_reasons.join(", ").toLowerCase(),
          url: attachment.url,
          moderation_labels: moderation_labels
        }
      });

      await prisma.attachment.update({
        where: {
          id: attachment.id
        },
        data: {
          scan_status: JSON.stringify(moderation_labels)
        }
      });

      await prisma.post.update({
        where: {
          id: attachment.post_id
        },
        data: {
          deleted_at: new Date(),
          scan_status: JSON.stringify(moderation_labels)
        }
      });

      return done();
    } catch (e) {
      Sentry.captureException(e, {
        tags: {
          job: "scan_images",
          job_id: job.id
        }
      });
      console.error(e);
    }

    done();
  });
}
