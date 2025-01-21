export enum NotificationType {
  Mention = "mention",
  Follow = "follow",
  Like = "like",
  Reply = "reply",
  Sticker = "sticker"
}

export interface Notification {
  type: NotificationType;
  user_id: string;
  username: string;
  display_name: string;
  read: boolean;
  post_id?: string;
  reply_id?: string;
  message: string;
  created_at: Date;
}
