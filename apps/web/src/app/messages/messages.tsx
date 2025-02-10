"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar";
import { dateRelativeTiny } from "@/lib/utils";

export function Messages({ user }: { user: any }) {
  const [newChatModal, setNewChatModal] = useState(false);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setNewChatModal(false);

    fetch("/api/messages/channels")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          const channels = data.data.map((channel: any) => {
            return {
              id: channel.id,
              name:
                channel.name ??
                channel.members.filter(
                  (m: any) => m.user.id !== user.id.toString()
                )[0].user.display_name,
              avatar_url:
                channel.members.filter(
                  (m: any) => m.user.id !== user.id.toString()
                )[0].user.avatar_url || "",
              last_message_at:
                channel.messages &&
                channel.messages.length > 0 &&
                dateRelativeTiny(new Date(channel.messages[0].created_at)),
              last_message_at_date:
                channel.messages &&
                channel.messages.length > 0 &&
                new Date(channel.messages[0].created_at),
              last_read_at: channel.members.filter(
                (m: any) => m.user.id === user.id.toString()
              )[0].last_read_at,
              last_message_body:
                channel.messages && channel.messages[0]?.content
            };
          });

          setChannels(channels);
        }
      })
      .catch((e) => {
        console.error(e);
        toast.error("Something went wrong.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex min-h-[50dvh] w-full max-w-3xl flex-1 flex-col gap-2">
      <div className="flex items-center justify-between">
        <h1 className="pb-4">Messages</h1>
        <button className="group py-2" onClick={() => setNewChatModal(true)}>
          + <span className="group-hover:underline">New Chat</span> +
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1">
        {channels && channels.length > 0
          ? channels.map((channel, i) => (
              <Channel
                key={i}
                channel={{
                  id: channel.id,
                  name: channel.name,
                  avatar_url: channel.avatar_url,
                  last_read_at: channel.last_read_at,
                  last_message_at_date: channel.last_message_at_date,
                  last_message_at: channel.last_message_at,
                  last_message_body: channel.last_message_body
                }}
              />
            ))
          : !loading && (
              <div className="fadein flex flex-1 flex-col items-center justify-center">
                <div className="text-center">
                  Click the{" "}
                  <span
                    className="cursor-pointer font-bold hover:underline"
                    onClick={() => setNewChatModal(true)}
                  >
                    + New Chat +
                  </span>{" "}
                  button to start chatting with someone.
                </div>
              </div>
            )}
      </div>

      <NewChatModal open={newChatModal} setOpen={setNewChatModal} />
    </div>
  );
}

function Channel({
  channel
}: {
  channel: {
    id: string;
    name: string;
    avatar_url: string;
    last_message_at: string;
    last_message_at_date: any;
    last_read_at: string;
    last_message_body: string;
  };
}) {
  const read =
    channel.last_read_at &&
    new Date(channel.last_read_at).getTime() >
      new Date(channel.last_message_at_date).getTime();

  return (
    <Link
      href={"/messages/" + channel.id}
      className="hover:bg-black-100/50 dark:hover:bg-black-700/25 fadein flex flex-row items-center gap-3 rounded-md p-2 hover:no-underline"
    >
      <Avatar>
        <AvatarImage src={channel.avatar_url} />
        <AvatarFallback>{channel.name[0].toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="w-full">
        <div className="flex justify-between gap-2">
          <div className="font-bold">
            {channel.name}
            {!read && channel.last_message_body ? " (Unread)" : ""}
          </div>
          <div className="opacity-50">{channel.last_message_at}</div>
        </div>
        <div
          className="h-[22px] opacity-50"
          style={{
            fontWeight: !read && channel.last_message_body ? "bold" : "normal"
          }}
        >
          {channel.last_message_body || ""}
        </div>
      </div>
    </Link>
  );
}

function NewChatModal({
  open,
  setOpen
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [users, setUsers] = useState<any[]>([]);
  const [text, setText] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (text.length > 1) {
      fetch(`/api/user/search?q=${text}`, {})
        .then((res) => res.json())
        .then((res) => {
          if (res.ok) {
            setUsers(res.data);
          }
        })
        .catch((err) => {});
    } else {
      setUsers([]);
    }
  }, [text]);

  function chatChannel(user_id: string) {
    fetch(`/api/messages/channel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        target_id: user_id
      })
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setOpen(false);
          router.push(`/messages/${res.data.channel_id}`);
        }
      })
      .catch((err) => {});
  }

  return (
    <>
      {open && (
        <div className="fixed left-0 top-0 z-[99992] flex h-screen w-screen flex-col items-center justify-center gap-2 p-4">
          <div
            className="fixed left-0 top-0 z-[99995] flex h-screen w-screen items-center justify-center bg-black/5 backdrop-blur-sm transition-opacity"
            onClick={() => setOpen(false)}
          />
          <div className="bg-black-100 dark:bg-black-800 z-[99999] flex flex-col gap-4 rounded-lg border border-neutral-300 px-6 py-4 dark:border-slate-900">
            <div className="flex justify-between gap-4">
              <div className="pt-1 font-bold">+ New Chat +</div>
              <button onClick={() => setOpen(false)}>[x]</button>
            </div>
            <div className="min-h-[360px] w-[400px]">
              <div>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                  }}
                  onBlur={(e) => {
                    e.target.focus();
                  }}
                  placeholder="Search User"
                  autoFocus
                  className="dark:border-black-700 border-black-300 w-full rounded-none border-b bg-transparent px-2 py-1.5 placeholder:text-neutral-400 focus:outline-none dark:placeholder:text-neutral-600"
                  maxLength={20}
                />
              </div>
              <div className="flex flex-col gap-1 pt-2">
                {users && users.length > 0 ? (
                  users.map((user: any, i: number) => {
                    return (
                      <div
                        key={i}
                        className="hover:bg-black-300/50 dark:hover:bg-black-700/25 flex cursor-pointer gap-2 rounded-md p-2"
                        onClick={() => chatChannel(user.id)}
                      >
                        <div>
                          <Avatar className="size-[40px]">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>
                              {user.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div>
                          <div className="font-bold">{user.display_name}</div>
                          <div>@{user.username}</div>
                        </div>
                      </div>
                    );
                  })
                ) : text ? (
                  <div className="py-2 text-center">No results found.</div>
                ) : (
                  ""
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
