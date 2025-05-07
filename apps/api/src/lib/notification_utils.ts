import Queue from "bull";

export async function sendNotification({
  user_id,
  title,
  body,
  url
}: {
  user_id: bigint;
  title: string;
  body: string;
  url?: string;
}) {
  try {
    const queue_send_notification = new Queue(
      "queue_send_notification",
      process.env.REDIS_URL!
    );

    await queue_send_notification.add({
      user_id: user_id.toString(),
      title: title,
      body: body,
      url: url
    });
  } catch (e) {
    console.error(e);
  }
}

export async function sendMobileNotification({
  user_id,
  title,
  subtitle,
  body,
  url,
  thread_id
}: {
  user_id: bigint;
  title: string;
  subtitle?: string;
  body: string;
  url?: string;
  thread_id?: string;
}) {
  try {
    const queue_send_mobile_notification = new Queue(
      "queue_send_mobile_notification",
      process.env.REDIS_URL!
    );

    await queue_send_mobile_notification.add({
      user_id: user_id.toString(),
      title: title,
      subtitle: subtitle,
      body: body,
      url: url,
      thread_id: thread_id
    });
  } catch (e) {
    console.error(e);
  }
}
