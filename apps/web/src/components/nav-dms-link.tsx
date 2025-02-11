"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useSocket } from "./socket-provider";

export function NavDMsLink() {
  const [unread, setUnread] = useState(0);
  const { socket } = useSocket();

  function fetchUnread() {
    fetch("/api/messages/unread-count")
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setUnread(res.data.unread_channels);
        }
      })
      .catch((e) => {});
  }

  function handleSocket(data: any) {
    fetchUnread();
  }

  useEffect(() => {
    fetchUnread();

    socket.on("messages", handleSocket);

    return () => {
      socket.off("messages", handleSocket);
    };
  }, []);

  return (
    <Link
      href="/messages"
      title={
        unread > 0
          ? `You have ${unread} unread ${unread === 1 ? "chat" : "chats"}.`
          : "DMs"
      }
    >
      <span>DMs</span>
      {unread > 0 && (
        <div className="fadein absolute ml-[27px] mt-[-20px] size-[5px] rounded-full bg-blue-500" />
      )}
    </Link>
  );
}
