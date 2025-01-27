import Queue from "bull";

export async function sendNotification(
  user_id: bigint,
  title: string,
  body: string,
  url?: string
) {
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
