"use client";

import { useEffect, useState } from "react";

import { Notification } from "@folks/utils/notification_types";

import { NotificationMessage } from "@/components/notifications";
import { dateRelativeTiny } from "@/lib/utils";

export function Notifications({ user }: { user: any }) {
  const [notifications, setNotifications] = useState<any>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  function fetchNotifications() {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setNotifications(res.data.notifications);
          setCount(res.data.unread_count);
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }

  function markAllAsRead() {
    fetch("/api/notifications/read", {
      method: "POST"
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          fetchNotifications();
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col gap-2 max-sm:px-2">
      <div className="max-w-[83ch]">
        <div className="flex items-center gap-4 pb-1 max-sm:flex-col max-sm:items-start">
          <h2>Notifications</h2>
          <div>({count} unread)</div>
        </div>

        <div className="pb-1">
          <div
            className="text-foreground cursor-pointer pb-1 pt-2 font-bold hover:underline"
            onClick={() => markAllAsRead()}
          >
            Mark all as read.
          </div>
        </div>

        <div className="flex w-full flex-row gap-3 pb-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i}>·</span>
          ))}
        </div>

        <div className="text-foreground flex flex-col gap-1">
          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              {notifications && notifications.length > 0 ? (
                notifications.map((notification: Notification, i: number) => (
                  <div
                    key={i}
                    className="flex w-full flex-row gap-[1ch] py-1"
                    style={{
                      opacity: notification.read ? 0.6 : 1
                    }}
                  >
                    {!notification.read && (
                      <span className="absolute ml-[-16px] text-lg font-bold text-green-500">
                        +
                      </span>
                    )}
                    <NotificationMessage
                      user={user}
                      notification={notification}
                    />
                  </div>
                ))
              ) : (
                <div className="text-foreground flex flex-col gap-1">
                  <div className="text-foreground">
                    You have no notifications.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
