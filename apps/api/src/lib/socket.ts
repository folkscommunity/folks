import { redis_pub } from "./redis";

export async function sendToChannel(channel: string, event: string, data: any) {
  await redis_pub.publish(
    "socket",
    JSON.stringify({ channel, event, data: JSON.stringify(data) })
  );
}

export async function sendToUser(user_id: string, event: string, data: any) {
  await redis_pub.publish(
    "socket",
    JSON.stringify({
      channel: `user:${user_id}`,
      event,
      data: JSON.stringify(data)
    })
  );
}
