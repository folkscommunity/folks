"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BellSimple, BellSimpleSlash, Image, X } from "@phosphor-icons/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import { FolksAvatar } from "@/components/folks-avatar";
import { useSocket } from "@/components/socket-provider";
import { parsePostBody } from "@/lib/post-utils";
import { dateRelativeTiny } from "@/lib/utils";

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
  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        {message.attachments.map((attachment: any) => (
          <div
            key={attachment.id}
            className="max-w-[300px] overflow-hidden rounded-md"
          >
            <img
              src={attachment.url}
              alt=""
              className="max-h-[300px] w-auto rounded-md object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    );
  };
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
          {renderAttachments()}
        </div>
      </div>
    </div>
  );
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  preview: string;
  error?: string;
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
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textBoxRef = useRef<HTMLTextAreaElement>(null);

  const MAX_FILES = 5;
  const MAX_FILE_SIZE_MB = 50;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const uploadFile = useCallback(
    async (
      file: File,
      onProgress: (progress: number) => void
    ): Promise<string> => {
      const formData = new FormData();
      formData.append("file", file);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        });

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.ok && response.data && response.data.id) {
                resolve(response.data.id);
              } else {
                reject(
                  new Error(response.message || "Invalid response format")
                );
              }
            } catch (e) {
              console.error("Error parsing response:", e);
              reject(new Error("Invalid response from server"));
            }
          } else {
            let errorMessage = "Upload failed";
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              errorMessage =
                errorResponse.message || errorResponse.error || errorMessage;
            } catch (e) {
              console.error("Error parsing error response:", e);
            }
            reject(new Error(errorMessage));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network error during upload"));
        };

        xhr.open("POST", "/api/messages/attachment", true);
        xhr.send(formData);
      });
    },
    []
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const oversizedFiles: string[] = [];

    // Check each file
    files.forEach((file) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        oversizedFiles.push(file.name);
      } else if (validFiles.length + uploadingFiles.length < MAX_FILES) {
        validFiles.push(file);
      }
    });

    // Show error for oversized files
    if (oversizedFiles.length > 0) {
      const fileList = oversizedFiles.join(", ");
      const message = `The following files exceed ${MAX_FILE_SIZE_MB}MB and were not added: ${fileList}`;
      toast.error(message);
    }

    // Check if we've reached max files
    const remainingSlots = MAX_FILES - uploadingFiles.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum of ${MAX_FILES} files allowed`);
      return;
    }

    // Add valid files to upload queue
    validFiles.slice(0, remainingSlots).forEach((file) => {
      const id = uuidv4();
      const preview = URL.createObjectURL(file);
      setUploadingFiles((prev) => [
        ...prev,
        { id, file, preview, progress: 0 }
      ]);
    });

    // Reset file input to allow selecting the same file again
    if (e.target) {
      e.target.value = "";
    }
  };

  const removeFile = (id: string) => {
    setUploadingFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const uploadFiles = useCallback(async (): Promise<string[]> => {
    const results: string[] = [];

    for (const file of uploadingFiles) {
      try {
        const attachmentId = await uploadFile(file.file, (progress) => {
          setUploadingFiles((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, progress } : f))
          );
        });

        results.push(attachmentId);

        // Update the file to show it's been uploaded successfully
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, progress: 100, error: undefined } : f
          )
        );
      } catch (error) {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  error:
                    error instanceof Error ? error.message : "Upload failed",
                  progress: 0
                }
              : f
          )
        );
        throw error;
      }
    }

    return results;
  }, [uploadingFiles, uploadFile]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (textBoxRef.current) {
        textBoxRef.current.focus();
        textBoxRef.current.style.height = "auto";
      }

      if (!message.trim() && uploadingFiles.length === 0) return;

      setSending(true);

      try {
        let attachmentIds: string[] = [];

        // Upload files if any
        if (uploadingFiles.length > 0) {
          try {
            attachmentIds = await uploadFiles();
          } catch (error) {
            // If any upload fails, don't send the message
            console.error("Error uploading files:", error);
            throw error;
          }
        }

        // Send message with text and attachments
        const response = await fetch("/api/messages/message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            channel_id: channel.id,
            message: message,
            attachment_ids: attachmentIds
          })
        });

        const data = await response.json();

        if (data.ok) {
          setText("");
          setUploadingFiles([]);
          onSend();
        } else {
          throw new Error(data.message || "Failed to send message");
        }
      } catch (error) {
        console.error("Error sending message:", error);
        toast.error(
          error instanceof Error ? error.message : "Something went wrong"
        );
      } finally {
        setSending(false);
      }
    },
    [channel.id, onSend, uploadFiles, uploadingFiles]
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);

    const target = e.target as HTMLFormElement;

    const body = target.body.value;

    sendMessage(body);
  }

  return (
    <div className="dark:border-black-700 border border-t-0">
      {uploadingFiles.length > 0 && (
        <div className="flex gap-2 overflow-x-auto bg-gray-50 px-2 pb-2 pt-3 dark:bg-gray-900">
          {uploadingFiles.map((file) => (
            <div key={file.id} className="relative mb-2">
              <div className="group relative h-16 w-16 overflow-visible">
                <div className="relative h-full w-full overflow-hidden rounded-md bg-gray-200 dark:bg-gray-700">
                  <img
                    src={file.preview}
                    alt="Preview"
                    className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
                  />
                  {file.error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-500/50 p-1 text-center text-xs text-white">
                      Error
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  className="absolute -right-1.5 -top-1.5 z-10 rounded-full bg-neutral-800 p-1 text-white opacity-0 shadow-md transition-all hover:bg-neutral-800 group-hover:opacity-100 dark:bg-neutral-200 dark:hover:bg-neutral-400"
                >
                  <X
                    size={12}
                    weight="bold"
                    className="dark:text-neutral-800"
                  />
                </button>
              </div>
              {file.progress > 0 && file.progress < 100 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex">
        <div className="flex items-center px-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            disabled={uploadingFiles.length >= MAX_FILES}
            title="Add image"
          >
            <Image size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploadingFiles.length >= MAX_FILES}
          />
        </div>

        <div className="flex flex-1 flex-col">
          <textarea
            className="text-md placeholder:text-black-500 max-h-[200px] min-h-[40px] w-full resize-none bg-transparent p-2 pl-1 focus:outline-none"
            rows={1}
            onKeyDownCapture={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.ctrlKey &&
                !e.metaKey
              ) {
                e.preventDefault();
                if (text.trim() || uploadingFiles.length > 0) {
                  sendMessage(text);
                }
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
        </div>

        <button
          className="dark:border-black-700 text-md disabled:text-black-500 min-h-full max-w-[80px] border-l px-3 py-1"
          type="submit"
          disabled={
            sending || (text.trim() === "" && uploadingFiles.length === 0)
          }
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
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
