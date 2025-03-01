"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  ChatCircle,
  House,
  List,
  UserCircle,
  X
} from "@phosphor-icons/react";
import { useLockBodyScroll } from "@uidotdev/usehooks";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";

import { useSocket } from "./socket-provider";

export function MobileNavigation({ user }: { user: any }) {
  const router = useRouter();
  const path = usePathname();

  const [showMobileMore, setShowMobileMore] = useState(false);

  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const { socket } = useSocket();

  function fetchUnread() {
    fetch("/api/messages/unread-count")
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setUnreadMessages(res.data.unread_channels);
        }
      })
      .catch((e) => {});
  }

  function handleSocket(data: any) {
    fetchUnread();
  }

  function fetchNotifications() {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setUnreadNotifications(res.data.unread_count);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }

  useEffect(() => {
    fetchUnread();
    fetchNotifications();

    socket.on("messages", handleSocket);

    return () => {
      socket.off("messages", handleSocket);
    };
  }, []);

  useEffect(() => {
    if (showMobileMore) {
      document.body.style.overflowY = "hidden";
    } else {
      document.body.style.overflowY = "auto";
    }
  }, [showMobileMore]);

  return (
    <>
      <div className="bg-background bottom-mobile-nav fixed bottom-0 left-0 z-[10] hidden w-full items-center justify-evenly gap-4 border-t-[0.5px] px-2 text-black max-sm:flex dark:border-slate-900 dark:text-white">
        <div
          className="flex h-[40px] flex-1 items-center justify-center"
          onClick={() => {
            router.push("/");
          }}
          onDoubleClick={() => {
            window.location.reload();
          }}
        >
          <House size={28} weight={path === "/" ? "fill" : "regular"} />
        </div>

        <div
          className="flex h-[40px] flex-1 items-center justify-center"
          onClick={() => {
            router.push("/messages");
          }}
        >
          <ChatCircle
            size={28}
            weight={path.startsWith("/messages") ? "fill" : "regular"}
          />
          {unreadMessages > 0 && (
            <div className="fadein border-background absolute ml-[4.5%] mt-[-17px] size-[12px] rounded-full border-[3px] bg-blue-500" />
          )}
        </div>

        <div
          className="flex h-[40px] flex-1 items-center justify-center"
          onClick={() => {
            router.push("/notifications");
          }}
        >
          <Bell
            size={28}
            weight={path.startsWith("/notifications") ? "fill" : "regular"}
          />
          {unreadNotifications > 0 && (
            <div className="fadein border-background absolute ml-[3.5%] mt-[-17px] size-[12px] rounded-full border-[3px] bg-blue-500" />
          )}
        </div>

        <div
          className="flex h-[44px] flex-1 items-center justify-center"
          onClick={() => {
            router.push(`/${user.username}`);
          }}
        >
          <UserCircle
            size={28}
            weight={path === `/${user.username}` ? "fill" : "regular"}
          />
        </div>

        <div
          className="flex h-[44px] flex-1 items-center justify-center"
          onClick={() => setShowMobileMore(!showMobileMore)}
        >
          <List size={28} />
        </div>
      </div>

      {showMobileMore && <Overlay onClose={() => setShowMobileMore(false)} />}
    </>
  );
}

function Overlay({ onClose }: { onClose: () => void }) {
  const posthog = usePostHog();

  function logout() {
    posthog.reset();
    posthog.capture("logout");
    window.location.href = "/api/auth/logout";
  }

  useLockBodyScroll();

  return (
    <div className="bg-background mobile-nav-menu fixed left-0 z-[11] hidden w-[100dvw] flex-col px-4 pt-[32px] max-sm:flex">
      <div className="mt-4 flex w-full justify-end">
        <div
          className="flex size-[50px] cursor-pointer items-center justify-center"
          onClick={() => onClose()}
        >
          <X size={32} weight="bold" />
        </div>
      </div>

      <div className="mt-[10px] flex w-full justify-center">
        <Link
          href="/"
          onClick={() => {
            onClose();
          }}
        >
          <Image
            src="/images/logo.svg"
            alt="Folks Logo"
            width={120}
            height={120 * 0.3221}
            className="dark:invert"
          />
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 pt-4 text-[24px] font-bold">
        <Link
          href="/articles"
          onClick={() => {
            onClose();
          }}
          className="!no-underline"
        >
          Articles
        </Link>

        <div
          className="cursor-pointer !no-underline"
          onClick={() => {
            onClose();
            window.dispatchEvent(new Event("ribbon_create_open"));
          }}
        >
          Ribbon Message
        </div>

        <div className="flex flex-row gap-4 px-4 text-sm">
          <span>·</span>
          <span>·</span>
          <span>·</span>
        </div>

        <Link
          href="/support"
          className="!no-underline"
          onClick={() => {
            onClose();
          }}
        >
          Support
        </Link>
        <Link
          href="/manifesto"
          className="!no-underline"
          onClick={() => {
            onClose();
          }}
        >
          Manifesto
        </Link>

        <div className="flex flex-row gap-4 px-4 text-sm">
          <span>·</span>
          <span>·</span>
          <span>·</span>
        </div>
        <Link
          href="/manifesto"
          className="!no-underline"
          onClick={() => {
            onClose();
          }}
        >
          Settings
        </Link>

        <div
          className="cursor-pointer !no-underline"
          onClick={() => {
            onClose();
            logout();
          }}
        >
          Sign Out
        </div>
      </div>
    </div>
  );
}
