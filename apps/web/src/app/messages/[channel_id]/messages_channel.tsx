"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  BellSimple,
  BellSimpleSlash,
  DotsThree
} from "@phosphor-icons/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";

import { FolksAvatar } from "@/components/folks-avatar";
import { Separator } from "@/components/separator";
import { useSocket } from "@/components/socket-provider";
import { parsePostBody } from "@/lib/post-utils";
import { cn, dateRelativeTiny } from "@/lib/utils";

export function MessagesChannel({
  channel,
  user,
  member
}: {
  channel: any;
  user: any;
  member: any;
}) {
  const messageContainerRef = useRef<HTMLDivElement>(null);

  const [loaded, setLoaded] = useState(false);
  const { ref, inView } = useInView();
  const { socket } = useSocket();
  const [mutedState, setMutedState] = useState<boolean>();
  const [isClient, setIsClient] = useState(false);
  const [windowIsActive, setWindowIsActive] = useState(true);

  const fetchMessages = async ({
    pageParam
  }: {
    pageParam: number | undefined;
  }) => {
    if (pageParam === undefined) {
      const res = await fetch("/api/messages/messages/" + channel.id);
      return res.json();
    } else {
      const res = await fetch(
        "/api/messages/messages/" + channel.id + "?cursor=" + pageParam
      );
      return res.json();
    }
  };

  const {
    data,
    error,
    fetchNextPage,
    refetch,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status
  } = useInfiniteQuery({
    queryKey: ["messages_" + channel.id],
    queryFn: fetchMessages,
    initialPageParam: undefined,
    retryOnMount: true,
    getNextPageParam: (lastPage: any, pages: any[]) =>
      lastPage.nextCursor ?? undefined
  });

  useEffect(() => {
    setTimeout(() => {
      setLoaded(true);
    }, 50);
  }, [data]);

  useEffect(() => {
    if (inView && data && data.pages && loaded && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, data, loaded, hasNextPage]);

  const reverseScroll = (e: any) => {
    e.preventDefault();
    e.currentTarget.scrollTop -= e.deltaY;
  };

  useEffect(() => {
    const current = messageContainerRef.current;
    current?.addEventListener("wheel", reverseScroll, { passive: false });
    return () => void current?.removeEventListener("wheel", reverseScroll);
  }, []);

  function getMuted() {
    fetch(`/api/messages/muted/${channel.id}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setMutedState(res.data.muted);
        }
      })
      .catch((err) => {});
  }

  function setMuted(muted: boolean) {
    fetch(`/api/messages/muted`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        channel_id: channel.id,
        muted: muted
      })
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setMutedState(muted);
        }
      })
      .catch((err) => {});
  }

  function markRead() {
    fetch(`/api/messages/read`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        channel_id: channel.id
      })
    }).catch((err) => {});
  }

  function handleSocket(data: any) {
    refetch();
    try {
      const parsed_data = JSON.parse(data);

      if (parsed_data.from !== user.id.toString() && !mutedState) {
        window.dispatchEvent(new Event("play_message_sound"));
      }
    } catch (e) {}
  }

  useEffect(() => {
    getMuted();
    markRead();
    setIsClient(true);

    window.addEventListener("focus", () => {
      setWindowIsActive(true);
    });

    window.addEventListener("blur", () => {
      setWindowIsActive(false);
    });

    return () => {
      window.removeEventListener("focus", () => {
        setWindowIsActive(true);
      });
      window.removeEventListener("blur", () => {
        setWindowIsActive(false);
      });
    };
  }, []);

  useEffect(() => {
    let interval: any;

    if (windowIsActive) {
      markRead();

      interval = setInterval(() => {
        markRead();
      }, 1000 * 5);
    }

    return () => {
      clearInterval(interval);
    };
  }, [windowIsActive]);

  useEffect(() => {
    socket.on("messages:" + channel.id, handleSocket);

    return () => {
      socket.off("messages:" + channel.id, handleSocket);
    };
  }, [mutedState]);

  return (
    <div className="text-md flex w-full max-w-3xl flex-1 flex-col pb-4 pt-3 max-sm:pb-6">
      <div className="dark:border-black-700 max-w-3xl:boder-r-0 max-w-3xl:boder-l-0 flex items-center justify-between border-l border-r border-t px-3 py-2">
        <div className="flex items-center gap-3">
          <FolksAvatar
            src={channel.members[0].user.avatar_url}
            name={channel.members[0].user.display_name}
          />
          <div>
            <h3>{channel.name || channel.members[0].user.display_name}</h3>
            <span className="text-sm opacity-50">
              @{channel.members[0].user.username}
            </span>
          </div>
        </div>
        <div className="flex items-center">
          <button
            className="hover:bg-black-200/25 dark:hover:bg-black-700/25 flex size-[32px] items-center justify-center rounded-md"
            onClick={() => setMuted(!mutedState)}
            title={mutedState ? "Unmute" : "Mute"}
          >
            {!mutedState ? (
              <BellSimple size={24} />
            ) : (
              <BellSimpleSlash size={24} />
            )}
          </button>
        </div>
      </div>

      <div
        className="dark:border-black-700 overflow-y-scroll border"
        style={{
          flex: "1 1 0",
          overflowAnchor: "auto",
          transform: "scaleY(-1)"
        }}
        ref={messageContainerRef}
        onKeyDownCapture={(e) => {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            // scroll down smoothly
            e.currentTarget.scrollTo({
              top: e.currentTarget.scrollTop + e.currentTarget.clientHeight / 5,
              behavior: "smooth"
            });
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            // scroll up smoothly
            e.currentTarget.scrollTo({
              top: e.currentTarget.scrollTop - e.currentTarget.clientHeight / 5,
              behavior: "smooth"
            });
          }
        }}
      >
        <div
          className="pt-2 transition-opacity"
          style={{
            opacity: loaded ? 1 : 0,
            display: "flex",
            flexDirection: "column"
          }}
        >
          {data?.pages.map((page) => {
            return page.data.map((message: any, i: number) => {
              return (
                <Message
                  small={
                    i !== page.data.length - 1 &&
                    message.user.id === page.data[i + 1].user.id &&
                    new Date(message.created_at).getTime() -
                      new Date(page.data[i + 1].created_at).getTime() <
                      120000
                  }
                  key={message.id}
                  message={message}
                  user={user}
                />
              );
            });
          })}

          <div
            className="py-1"
            style={{
              transform: "scaleY(-1)"
            }}
          >
            <button
              onClick={() => {
                if (!isFetchingNextPage) {
                  fetchNextPage();
                }
              }}
              tabIndex={-1}
              ref={ref}
              className="w-full py-4 opacity-50"
              disabled={isFetching || isFetchingNextPage || !hasNextPage}
            >
              {hasNextPage
                ? isFetching || isFetchingNextPage
                  ? "Loading..."
                  : "Load More"
                : "This is the beginning of the chat."}
            </button>
          </div>
        </div>
      </div>
      <MessageComposer
        channel={channel}
        onSend={() => {
          refetch();
          if (messageContainerRef.current) {
            messageContainerRef.current.scrollTo({
              top: 0,
              behavior: "smooth"
            });
          }
        }}
      />
      {isClient && <AudioPlayer />}
    </div>
  );
}

function Message({
  message,
  user,
  small
}: {
  message: any;
  user: any;
  small: boolean;
}) {
  const isUser = user.username === message.user.username;

  return (
    <div
      className="w-3xl group flex gap-2 px-2 py-1 hover:bg-[#F4F5F6] dark:hover:bg-[#0A1018]"
      style={{
        transform: "scaleY(-1)"
      }}
    >
      <div className="min-w-[30px] pt-1">
        {!small && (
          <FolksAvatar
            src={message.user.avatar_url}
            name={message.user.username}
            size={30}
            className="!text-sm"
          />
        )}
      </div>
      <div className="flex w-full flex-col gap-0.5">
        {!small && (
          <div className="gap-25 flex max-w-full justify-between">
            <div className="font-bold">{message.user.display_name}</div>
            <div className="opacity-50">
              {dateRelativeTiny(new Date(message.created_at))}
            </div>
          </div>
        )}

        <div>
          <div
            dangerouslySetInnerHTML={{
              __html: parsePostBody(message.content)
            }}
            className="break-words pr-1"
            style={{
              wordBreak: "break-word"
            }}
          />
        </div>

        {small && (
          <div className="dategradientbg pointer-events-none absolute right-0 top-0 hidden pb-1 pl-3 pr-[12px] text-black/50 group-hover:block dark:text-white/50">
            {dateRelativeTiny(new Date(message.created_at))}
          </div>
        )}
      </div>
    </div>
  );
}

function MessageComposer({
  channel,
  onSend
}: {
  channel: any;
  onSend: () => void;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const textBoxRef = useRef<HTMLTextAreaElement>(null);

  function sendMessage(message: string) {
    if (textBoxRef.current) {
      textBoxRef.current.focus();
      textBoxRef.current.style.height = "auto";
    }

    setSending(true);

    fetch("/api/messages/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        channel_id: channel.id,
        message: message
      })
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setText("");
          onSend();
        } else {
          toast.error(res.message || "Something went wrong.");
        }
      })
      .catch((err) => {
        toast.error("Something went wrong.");
      })
      .finally(() => {
        setSending(false);
      });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);

    const target = e.target as HTMLFormElement;

    const body = target.body.value;

    sendMessage(body);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="dark:border-black-700 flex border border-t-0"
    >
      <textarea
        className="text-md placeholder:text-black-500 max-h-[200px] min-h-[40px] w-full flex-1 resize-none bg-transparent p-2 pl-3 focus:outline-none"
        rows={1}
        onKeyDownCapture={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(text);
          }
        }}
        onChange={(e) => {
          setText(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height =
            e.target.scrollHeight < 200
              ? `${e.target.scrollHeight}px`
              : "200px";
        }}
        ref={textBoxRef}
        maxLength={2000}
        value={text}
        placeholder="Send a message..."
        name="body"
      />

      <button
        className="dark:border-black-700 text-md disabled:text-black-500 min-h-full max-w-[80px] border-l px-3 py-1"
        type="submit"
        disabled={!text || sending}
      >
        Send
      </button>
    </form>
  );
}

function AudioPlayer() {
  const audio = useRef(new Audio("/sounds/message.wav"));

  function handleEvent() {
    audio.current.volume = 0.2;
    audio.current.play();
  }

  useEffect(() => {
    window.addEventListener("play_message_sound", handleEvent);

    return () => {
      window.removeEventListener("play_message_sound", handleEvent);
    };
  }, []);

  return <></>;
}
