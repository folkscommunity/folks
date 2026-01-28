/* eslint-disable prefer-const */
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import apn from "@parse/node-apn";
import Queue from "bull";
import webpush from "web-push";

import { NotificationEndpointType, prisma } from "@folks/db";

import { Sentry } from "./instrument";
import { s3 } from "./lib/aws";
import { getURLMetadata } from "./lib/url_metadata";

const vapid_public_key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const vapid_private_key = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
  "mailto:folks@folkscommunity.com",
  vapid_public_key,
  vapid_private_key
);

function fixAPNSp8Key(key: string) {
  let key_replaced = key.replace(/ /g, "");
  let token = key_replaced.split("-----")[2];
  if (token.length > 150)
    return `-----BEGIN PRIVATE KEY-----\n${token}\n-----END PRIVATE KEY-----`;
  else return key;
}

const apnProvider = new apn.Provider({
  token: {
    key: fixAPNSp8Key(process.env.APN_AUTH_KEY!),
    keyId: process.env.APN_KEY_ID!,
    teamId: process.env.APN_TEAM_ID!
  },
  production: process.env.NODE_ENV !== "development"
});

export async function sendWebPushNotification(
  id: any,
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
    try {
      if (e.body.includes("unsubscribed")) {
        await prisma.notificationEndpoint.delete({
          where: {
            id: id
          }
        });
      }

      const parsed = JSON.parse(e.body);
      if (parsed.reason === "Unregistered") {
        await prisma.notificationEndpoint.delete({
          where: {
            id: id
          }
        });
      }
    } catch (e) {}
    console.error(e);
  }
}

export function optimizeImageForNotification(url: string) {
  const url_as_base64 = Buffer.from(url).toString("base64");

  return `https://imgproxy.folkscommunity.com/plain/${url_as_base64}.jpg`;
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
          id: BigInt(user_id),
          deleted_at: null
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
        await sendWebPushNotification(
          endpoint.id,
          endpoint.endpoint,
          title,
          body,
          "https://folkscommunity.com" + url
        );
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

  const queue_send_mobile_notification = new Queue(
    "queue_send_mobile_notification",
    process.env.REDIS_URL!
  );

  queue_send_mobile_notification.process(1, async (job, done) => {
    try {
      const user_id = job.data.user_id;
      const title = job.data.title;
      const subtitle = job.data.subtitle;
      const body = job.data.body;
      const url = job.data.url;
      const sender_id = job.data.sender_id;
      const sender_name = job.data.sender_name;
      const sender_avatar_url = job.data.sender_avatar_url
        ? optimizeImageForNotification(job.data.sender_avatar_url)
        : undefined;
      const channel_id = job.data.channel_id;
      const image_url = job.data.image_url
        ? optimizeImageForNotification(job.data.image_url)
        : undefined;
      const thread_id = job.data.thread_id;

      if (!user_id || !body) {
        return done();
      }

      const user = await prisma.user.findUnique({
        where: {
          id: BigInt(user_id),
          deleted_at: null
        },
        include: {
          notification_endpoints: true
        }
      });

      if (!user || !user.notification_endpoints) {
        return done();
      }

      const ios_device_tokens = user.notification_endpoints.filter(
        (endpoint) => endpoint.type === NotificationEndpointType.IOS
      );

      for await (const endpoint of ios_device_tokens) {
        const device_token = (endpoint.endpoint as { token: string })?.token;

        const note = new apn.Notification();

        note.alert = {
          title: title,
          subtitle: subtitle || undefined,
          body: body
        };

        note.pushType = "alert";

        note.mutableContent = true;

        note.payload = {
          url: url || undefined,
          "sender-id": sender_id || undefined,
          "sender-name": sender_name || undefined,
          "avatar-url": sender_avatar_url || undefined,
          "channel-id": channel_id || sender_id || undefined,
          "image-url": image_url || undefined
        };

        console.log(note.payload);

        if (thread_id) {
          note.threadId = thread_id;
        }

        note.topic = process.env.APN_TOPIC!;

        try {
          const result = await apnProvider.send(note, device_token);

          console.log(
            "Notification sent to",
            device_token,
            user.username,
            user.id
          );

          console.log(result);

          if (result.failed && result.failed.length > 0) {
            console.log(
              "Notification endpoint failed, deleting endpoint.",
              result
            );

            await prisma.notificationEndpoint.delete({
              where: {
                id: endpoint.id
              }
            });
          }

          return done();
        } catch (error) {
          console.error(error);

          return done();
        }
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

  const purge_deleted_posts = new Queue(
    "queue_purge_deleted_posts",
    process.env.REDIS_URL!
  );

  purge_deleted_posts.process(1, async (job, done) => {
    const instant = job.data.instant;

    try {
      const deleted_posts = await prisma.post.findMany({
        where:
          instant === true
            ? {
                deleted_at: {
                  not: null
                }
              }
            : {
                AND: [
                  {
                    deleted_at: {
                      not: null
                    }
                  },
                  {
                    deleted_at: {
                      lt: new Date(
                        new Date().getTime() - 7 * 24 * 60 * 60 * 1000
                      )
                    }
                  }
                ]
              },
        select: {
          id: true,
          attachments: {
            select: {
              id: true,
              url: true
            }
          }
        }
      });

      for await (const post of deleted_posts) {
        if (post.attachments) {
          for await (const attachment of post.attachments) {
            await delete_s3_object.add(
              {
                key: attachment.url
              },
              {
                removeOnComplete: true,
                removeOnFail: true
              }
            );

            await prisma.attachment.delete({
              where: {
                id: attachment.id
              }
            });
          }
        }

        await prisma.post.delete({
          where: {
            id: post.id
          }
        });
      }

      Sentry.captureMessage(
        `Purged ${deleted_posts.length} deleted posts.`,
        "info"
      );

      done();
    } catch (e) {
      Sentry.captureException(e, {
        tags: {
          job: "purge_deleted_posts",
          job_id: job.id
        }
      });
      console.error(e);
      done(e);
    }
  });

  const delete_s3_object = new Queue(
    "queue_delete_s3_object",
    process.env.REDIS_URL!
  );

  delete_s3_object.process(1, async (job, done) => {
    try {
      let key = job.data.key;

      if (!key) {
        return done();
      }

      const CDN = `${process.env.CDN_URL}/`;

      key = key.replace(CDN, "");

      const command = new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: key
      });

      await s3.send(command);

      return done();
    } catch (e) {
      Sentry.captureException(e, {
        tags: {
          job: "delete_s3_object",
          job_id: job.id,
          data: job.data
        }
      });

      console.error(e);

      done(e);
    }

    done();
  });
}
