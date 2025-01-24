"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";

import {
  Notification,
  NotificationType
} from "@folks/utils/notification_types";

import { cn, dateRelativeTiny } from "@/lib/utils";

export function NotificationMessage({
  notification,
  user
}: {
  notification: any;
  user: any;
}) {
  if (notification.type === NotificationType.Mention) {
    return (
      <span className="text-foreground">
        <Link
          href={`/${notification.username}`}
          className="font-bold hover:underline"
        >
          {notification.display_name}
        </Link>{" "}
        mentioned you in a{" "}
        <Link
          href={`/${notification.username}/${notification.post_id}`}
          className="font-bold hover:underline"
        >
          post
        </Link>
        . [{dateRelativeTiny(new Date(notification.created_at), true)}]
      </span>
    );
  } else if (notification.type === NotificationType.Follow) {
    return (
      <span className="text-foreground">
        <Link
          href={`/${notification.username}`}
          className="font-bold hover:underline"
        >
          {notification.display_name}
        </Link>{" "}
        followed you. [
        {dateRelativeTiny(new Date(notification.created_at), true)}]
      </span>
    );
  } else if (notification.type === NotificationType.Like) {
    return (
      <span className="text-foreground">
        <Link
          href={`/${notification.username}`}
          className="font-bold hover:underline"
        >
          {notification.display_name}
        </Link>{" "}
        liked your{" "}
        <Link
          href={`/${user.username}/${notification.post_id}`}
          className="font-bold hover:underline"
        >
          post
        </Link>
        . [{dateRelativeTiny(new Date(notification.created_at), true)}]
      </span>
    );
  } else if (notification.type === NotificationType.Reply) {
    return (
      <span className="text-foreground inline">
        <Link
          href={`/${notification.username}/${notification.reply_id}`}
          className="font-bold hover:underline"
        >
          {notification.display_name}
        </Link>{" "}
        replied to your{" "}
        <Link
          href={`/${user.username}/${notification.post_id}`}
          className="font-bold hover:underline"
        >
          post
        </Link>
        . [{dateRelativeTiny(new Date(notification.created_at), true)}]
      </span>
    );
  } else {
    return null;
  }
}

export function Notifications({ user }: { user: any }) {
  const dropDownRef = useRef<any>(null);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (dropDownRef.current && !dropDownRef.current.contains(event.target)) {
        if (show) setShow(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropDownRef, show]);

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

  useEffect(() => {
    fetchNotifications();
  }, [show]);

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

  return (
    <div className="relative" ref={dropDownRef}>
      <div className="group cursor-pointer" onClick={() => setShow(!show)}>
        <span className={cn("group-hover:underline", show && "underline")}>
          Notifications [{!loading ? count || "0" : "·"}]
        </span>{" "}
        <span className="text-[10px]">▼</span>
      </div>

      <div
        className={cn(
          "absolute left-0 z-40 mt-1 origin-top-left text-sm max-sm:ml-[-60%]",
          !show && "hidden"
        )}
      >
        <div className="dark:bg-black-800 flex w-[400px] max-w-full flex-col justify-start space-y-0 border border-gray-100/0 bg-white p-2 px-4 shadow-md dark:border-slate-900">
          <div
            className="text-foreground cursor-pointer pb-1 pt-2 font-bold hover:underline"
            onClick={() => markAllAsRead()}
          >
            Mark all as read
          </div>
          <div className="flex w-full flex-row gap-3 pb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i}>·</span>
            ))}
          </div>
          <div className="text-foreground flex flex-col">
            {notifications && notifications.length > 0 ? (
              notifications
                .slice(0, 5)
                .map((notification: Notification, i: number) => (
                  <div
                    key={i}
                    className="my-0 flex w-full flex-row gap-[1ch] py-1"
                    style={{
                      opacity: notification.read ? 0.4 : 1
                    }}
                  >
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
          </div>

          <div className="flex w-full flex-row gap-3 py-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i}>·</span>
            ))}
          </div>

          <div className="pb-1">
            <Link href="/notifications" className="font-bold">
              View all notifications
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
