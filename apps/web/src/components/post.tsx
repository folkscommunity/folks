"use client";

import { useEffect, useState } from "react";
import { ChatCircle, Heart } from "@phosphor-icons/react";
import { EllipsisVerticalIcon, SmileIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFeatureFlagPayload } from "posthog-js/react";
import { toast } from "sonner";
import Lightbox from "yet-another-react-lightbox";

import { parsePostBody } from "@/lib/post-utils";
import { cn, dateRelativeTiny } from "@/lib/utils";

import { ReplyComposeFloating } from "./composer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "./dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "./dropdown-menu";
import { FolksAvatar } from "./folks-avatar";
import { TimelinePhoto } from "./timeline-photo";

interface URLMetadata {
  url: string;
  hostname: string;
  title: string;
  description?: string;
  image?: {
    url: string;
    width?: number;
    height?: number;
    image_square?: boolean;
  };
  favicon?: string;
  fetching?: boolean;
}

export function Post({
  post,
  user,
  hideTime
}: {
  post: any;
  user: any;
  hideTime?: boolean;
}) {
  const [lPost, setLPost] = useState(post);
  const [isClient, setIsClient] = useState(false);
  const stickers_teaser_feature_flag = useFeatureFlagPayload("stickers_teaser");

  const router = useRouter();
  const [replyComposerOpen, setReplyComposerOpen] = useState(false);

  const [index, setIndex] = useState(-1);

  function fetchPost() {
    fetch(`/api/post/${post.id}`, {
      method: "GET"
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setLPost(res.post);
        }
      })
      .catch((err) => {});
  }

  function likePost() {
    fetch(`/api/post/like`, {
      method: "POST",
      body: JSON.stringify({
        post_id: post.id
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          fetchPost();
        }
      })
      .catch((err) => {});
  }

  function unlikePost() {
    fetch(`/api/post/like`, {
      method: "DELETE",
      body: JSON.stringify({
        post_id: post.id
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          fetchPost();
        }
      })
      .catch((err) => {});
  }

  function highlightPost() {
    fetch(`/api/post/highlight/${post.id}`, {
      method: "POST"
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          fetchPost();
          toast.success("Post has been added to highlights.");
        }
      })
      .catch((err) => {});
  }

  function unhighlightPost() {
    fetch(`/api/post/highlight/${post.id}`, {
      method: "DELETE"
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          fetchPost();
          toast.success("Post has been removed from highlights.");
        }
      })
      .catch((err) => {});
  }

  function deletePost() {
    fetch(`/api/post/${post.id}`, {
      method: "DELETE"
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          toast.success("Post has been deleted.");
          window.location.reload();
        }
      })
      .catch((err) => {});
  }

  function stickers() {
    window.dispatchEvent(new Event("stickers-coming"));
  }

  async function setHideEmbeds(hide: boolean) {
    fetch(`/api/post/${post.id}/embeds`, {
      method: "POST",
      body: JSON.stringify({
        hide_embeds: hide
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          fetchPost();
        }
      });
  }

  function setPinnedPost(id: string | null) {
    fetch("/api/feed/pin-highlighted", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: id
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          window.dispatchEvent(new Event("refresh_feeds"));

          if (id) {
            toast.success("Post has been pinned.");
          } else {
            toast.success("Post has been unpinned.");
          }
        }
      })
      .catch((err) => {});
  }

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (lPost.urls && lPost.urls.length > 0) {
      if (lPost.urls[0].fetching) {
        setTimeout(() => {
          fetchPost();
        }, 3000);
      }
    }
  }, [lPost]);

  return (
    <div
      className="group mx-auto mb-4 flex w-full max-w-3xl gap-4 overflow-x-clip pb-4 max-sm:mx-[-16px] max-sm:w-[100dvw] max-sm:max-w-[100vw]"
      id={`post-${lPost.id}`}
    >
      <div className="max-sm:pl-4">
        <Link href={`/${lPost.author.username}`} className="hover:no-underline">
          <FolksAvatar
            src={lPost.author.avatar_url}
            name={lPost.author.username}
          />
        </Link>
      </div>
      <div className="flex max-w-full flex-1 flex-col gap-1 max-sm:pr-4">
        <div className="flex items-center justify-between gap-[2px]">
          <div>
            <Link className="font-bold" href={`/${lPost.author.username}`}>
              {lPost.author.display_name}
            </Link>{" "}
            <Link className="opacity-50" href={`/${lPost.author.username}`}>
              @{lPost.author.username}
            </Link>
            {lPost && lPost.created_at && isClient && !hideTime && (
              <>
                <span className="px-0.5 opacity-50">·</span>
                <span
                  className="text-md opacity-50"
                  title={new Date(lPost.created_at).toLocaleString()}
                >
                  {dateRelativeTiny(new Date(lPost.created_at))}
                </span>
              </>
            )}
            {lPost &&
              lPost.flags &&
              lPost.flags.filter((d: any) => d.imported).length > 0 && (
                <>
                  <span className="px-0.5 opacity-50">·</span>
                  <span
                    className="text-md opacity-50"
                    title={new Date(lPost.created_at).toLocaleString()}
                  >
                    Imported Post
                  </span>
                </>
              )}
          </div>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger className="h-[20px] outline-none">
                <EllipsisVerticalIcon className="size-5 opacity-10 hover:!opacity-100 focus:block group-hover:opacity-50" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="dark:bg-black-800 !z-[99999] bg-white dark:border-slate-900">
                <DropdownMenuItem
                  className="dark:hover:bg-black-600 cursor-pointer hover:bg-slate-100"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `https://folkscommunity.com/${lPost.author.username}/${lPost.id}`
                    )
                  }
                >
                  Copy Link
                </DropdownMenuItem>

                {user && user.super_admin && (
                  <DropdownMenuItem
                    className="dark:hover:bg-black-600 cursor-pointer hover:bg-slate-100"
                    onClick={() => {
                      if (lPost.highlighted) {
                        unhighlightPost();
                      } else {
                        highlightPost();
                      }
                    }}
                  >
                    {lPost.highlighted ? "Remove Highlight" : "Highlight"}
                  </DropdownMenuItem>
                )}

                {user && user.super_admin && (
                  <>
                    <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-900" />
                    <DropdownMenuItem
                      className="dark:hover:bg-black-600 cursor-pointer hover:bg-slate-100"
                      onClick={() => {
                        setPinnedPost(lPost.id.toString());
                        window.location.reload();
                      }}
                    >
                      Pin
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="dark:hover:bg-black-600 cursor-pointer hover:bg-slate-100"
                      onClick={() => {
                        setPinnedPost(null);
                        window.location.reload();
                      }}
                    >
                      Unpin
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-900" />
                  </>
                )}

                {user &&
                  (user.super_admin ||
                    lPost.author.id.toString() === user.id.toString()) && (
                    <>
                      {lPost.flags &&
                        lPost.flags.filter((d: any) => d.hide_embeds).length ===
                          0 && (
                          <DropdownMenuItem
                            className="dark:hover:bg-black-600 cursor-pointer hover:bg-slate-100"
                            onClick={() => setHideEmbeds(true)}
                          >
                            Hide Embeds
                          </DropdownMenuItem>
                        )}

                      {lPost.flags &&
                        lPost.flags.filter((d: any) => d.hide_embeds).length >
                          0 && (
                          <DropdownMenuItem
                            className="dark:hover:bg-black-600 cursor-pointer hover:bg-slate-100"
                            onClick={() => setHideEmbeds(false)}
                          >
                            Show Embeds
                          </DropdownMenuItem>
                        )}
                      <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-900" />

                      <DropdownMenuItem
                        className="dark:hover:bg-black-600 cursor-pointer text-red-500 hover:bg-slate-100"
                        onClick={() => deletePost()}
                      >
                        Delete Post
                      </DropdownMenuItem>
                    </>
                  )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {lPost.reply_to && lPost.reply_to.id && (
          <div className="pb-1 text-sm opacity-50">
            Replying to{" "}
            <Link
              href={`/${lPost.reply_to.author.username}/${lPost.reply_to.id}`}
              className="font-bold hover:underline"
            >
              @{lPost.reply_to.author.username}
            </Link>
          </div>
        )}

        <a
          href={`/${lPost.author.username}/${lPost.id}`}
          className="max-w-full hover:no-underline"
        >
          <div
            className="max-h-[400px] max-w-full overflow-clip break-words"
            dangerouslySetInnerHTML={{
              __html: parsePostBody(
                lPost.body,
                lPost.urls &&
                  lPost.urls.length > 0 &&
                  !(
                    lPost.flags &&
                    lPost.flags.filter((d: any) => d.hide_embeds).length > 0
                  )
              )
            }}
            style={{
              wordBreak: "break-word"
            }}
          />
        </a>

        {lPost.attachments && lPost.attachments.length > 0 && (
          <>
            <div className="w-[calc(100%+72px] relative -ml-[72px] mt-2 overflow-hidden max-sm:!w-[calc(100%+144px)] sm:ml-0 sm:w-full">
              <div className="hiddenscrollbar flex max-w-[100dvw] snap-x snap-mandatory gap-2 overflow-x-auto pr-16 max-sm:pl-[72px] max-sm:pr-8">
                {(() => {
                  // Calculate base height from first image
                  const firstImage = lPost.attachments[0];
                  const baseHeight = Math.min(
                    400,
                    (firstImage.height * 300) / firstImage.width
                  );

                  return lPost.attachments.map((attachment: any, i: number) => {
                    const aspectRatio = attachment.width / attachment.height;
                    const width = Math.min(
                      baseHeight * aspectRatio,
                      window.innerWidth * 0.85
                    );

                    return (
                      <div
                        key={i}
                        className="relative flex-none snap-center"
                        style={{
                          height: `${baseHeight}px`,
                          width: `${width}px`
                        }}
                      >
                        <div
                          className="absolute inset-0 cursor-pointer overflow-hidden rounded-lg border dark:border-slate-800"
                          onClick={() => setIndex(i)}
                        >
                          <img
                            src={attachment.url}
                            alt={
                              attachment.alt_text ||
                              `${lPost.author.username}'s Photo`
                            }
                            className="h-full w-full object-cover"
                          />

                          {attachment.alt_text &&
                            !attachment.alt_text.endsWith("'s Photo") && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <button
                                    className="bg-black-900 dark:bg-black-800 text-black-100 absolute bottom-2 right-2 h-[32px] w-[32px] rounded-full border border-neutral-300/0 p-1 text-xs font-medium opacity-50 hover:opacity-100 dark:border-slate-800 dark:text-slate-400"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                  >
                                    alt
                                  </button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Image Description</DialogTitle>
                                  </DialogHeader>
                                  <div className="py-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                      {attachment.alt_text}
                                    </p>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {index !== -1 && (
              <Lightbox
                open={index !== -1}
                close={() => setIndex(-1)}
                index={index}
                on={{
                  view: ({ index: currentIndex }: any) => setIndex(currentIndex)
                }}
                slides={lPost.attachments.map((item: any) => ({
                  alt: item.alt_text || `${lPost.author.username}'s Photo`,
                  src: item.url,
                  width: item.width,
                  height: item.height
                }))}
              />
            )}
          </>
        )}

        {lPost.attachments.length === 0 &&
          lPost.urls &&
          lPost.urls.length > 0 &&
          !(
            lPost.flags &&
            lPost.flags.filter((d: any) => d.hide_embeds).length > 0
          ) && <UrlEmbed metadata={lPost.urls[lPost.urls.length - 1]} />}

        <div className="flex h-[24px] items-center justify-start gap-4 pt-2">
          <div className="flex min-w-12 items-center gap-2">
            <ChatCircle
              className="size-5 min-h-5 min-w-5 cursor-pointer text-slate-700 hover:fill-neutral-400 hover:text-neutral-400 dark:hover:fill-neutral-300 dark:hover:text-neutral-300"
              onClick={() => {
                if (lPost.depth !== undefined && lPost.depth < 4 && user) {
                  setReplyComposerOpen(true);
                } else {
                  router.push(`/${lPost.author.username}/${lPost.id}`);
                }
              }}
            />
            <span>
              {isClient && lPost.count.replies && lPost.count.replies > 0
                ? lPost.count.replies
                : " "}
            </span>
          </div>

          <div className="flex min-w-12 items-center gap-2">
            <Heart
              className={cn(
                "size-5 cursor-pointer text-slate-700 hover:text-red-500",
                isClient &&
                  user &&
                  lPost.likes &&
                  lPost.likes.length > 0 &&
                  "fill-red-500 text-red-500"
              )}
              weight={
                isClient && user && lPost.likes && lPost.likes.length > 0
                  ? "fill"
                  : "regular"
              }
              onClick={() =>
                lPost.likes && lPost.likes.length > 0
                  ? unlikePost()
                  : likePost()
              }
            />
            <span>
              {isClient && lPost.count.likes && lPost.count.likes > 0
                ? lPost.count.likes
                : " "}
            </span>
          </div>
        </div>
      </div>

      {isClient && user && (
        <ReplyComposeFloating
          open={replyComposerOpen}
          setOpen={setReplyComposerOpen}
          post={lPost}
          user={user}
          onPost={() => {
            fetchPost();
          }}
        />
      )}
    </div>
  );
}

export function UrlEmbed({
  metadata,
  className
}: {
  metadata: URLMetadata;
  className?: string;
}) {
  const horizontal =
    metadata.image &&
    metadata.image.width &&
    metadata.image.height &&
    metadata.image.width > metadata.image.height;

  return (
    <Link
      href={metadata.url}
      className={cn(
        "border-black-200/50 hover:bg-black-100/50 dark:border-black-700 dark:hover:bg-black-700/25 group/url mt-2 flex w-full max-w-md flex-col overflow-clip rounded-md border hover:no-underline",
        className
      )}
      target="_blank"
    >
      {metadata.image && (horizontal || metadata.image?.image_square) && (
        <div className="border-black-200/50 dark:border-black-700 border-b">
          <img
            loading="lazy"
            decoding="async"
            src={metadata.image.url}
            alt={metadata.title}
            width="100%"
          />
        </div>
      )}
      <div className="flex items-center gap-2 pr-3">
        {!(metadata.image && (horizontal || metadata.image?.image_square)) && (
          <div className="border-black-200/50 dark:border-black-700 flex aspect-square h-full min-h-[105px] min-w-[105px] flex-1 items-center justify-center border-r">
            <img
              decoding="async"
              loading="lazy"
              width="24px"
              height="24px"
              className="aspect-square rounded-md"
              src={metadata.favicon}
              alt={metadata.title}
            />
          </div>
        )}
        <div
          className={cn(
            "flex w-full flex-col gap-0.5 px-1.5 py-3 text-sm",
            metadata.image &&
              (horizontal || metadata.image?.image_square) &&
              "px-4"
          )}
        >
          <div className="inline w-fit font-bold group-hover/url:underline">
            {metadata.title}
          </div>
          <p className="m-0 line-clamp-2 inline w-fit max-w-full pr-2 leading-[17px]">
            {metadata.description?.slice(0, metadata.fetching ? 70 : 89)}
            {metadata.description &&
              metadata.description.length >= (metadata.fetching ? 71 : 90) &&
              "..."}
            <br />
          </p>
          <div className="inline w-fit pt-1 leading-[17px] opacity-50">
            {metadata.hostname}
          </div>
        </div>
      </div>
    </Link>
  );
}
