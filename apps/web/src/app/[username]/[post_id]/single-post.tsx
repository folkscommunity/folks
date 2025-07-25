"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { ArrowDown, Heart, SmileySticker } from "@phosphor-icons/react";
import dayjs from "dayjs";
import { EllipsisIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Lightbox from "yet-another-react-lightbox";

import { ReplyCompose } from "@/components/composer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/dropdown-menu";
import { FeedUser } from "@/components/feeds";
import { FolksAvatar } from "@/components/folks-avatar";
import { Post, UrlEmbed } from "@/components/post";
import { Separator } from "@/components/separator";
import { StickerController } from "@/components/stickers/sticker";
import { TimelinePhoto } from "@/components/timeline-photo";
import { parsePostBody } from "@/lib/post-utils";
import { cn, dateRelativeTiny } from "@/lib/utils";

import { LikesModal } from "./likes-modal";

export function SinglePost({
  user,
  post,
  blocked_users
}: {
  user: any;
  post: any;
  blocked_users: bigint[];
}) {
  const [lPost, setLPost] = useState(post);
  const [likesModalOpen, setLikesModalOpen] = useState(false);
  const [replies, setReplies] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const postContainerRef = useRef<HTMLDivElement>(null);
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

  function fetchReplies() {
    fetch(`/api/post/${post.id}/thread`, {
      method: "GET"
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setReplies(res.replies);
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

  useEffect(() => {
    fetchReplies();
    setIsClient(true);

    window.addEventListener("refresh_replies", () => fetchReplies());

    return () => {
      window.removeEventListener("refresh_replies", () => fetchReplies());
    };
  }, []);

  return (
    <div className="text-md mx-auto w-full max-w-3xl" ref={postContainerRef}>
      <div className="w-full pb-2">
        <div className="flex flex-row gap-4 pb-4">
          <div>
            <Link
              href={`/${lPost.author.username}`}
              className="hover:no-underline"
            >
              <FolksAvatar
                src={lPost.author.avatar_url}
                name={lPost.author.username}
                size={50}
              />
            </Link>
          </div>
          <div className="flex flex-col justify-center">
            <Link className="font-bold" href={`/${lPost.author.username}`}>
              {lPost.author.display_name}
            </Link>{" "}
            <Link className="opacity-50" href={`/${lPost.author.username}`}>
              @{lPost.author.username}
            </Link>
          </div>
        </div>

        {lPost.reply_to && lPost.reply_to.id && (
          <div className="pb-4 text-sm opacity-50">
            Replying to{" "}
            <Link
              href={`/${lPost.reply_to.author.username}/${lPost.reply_to.id}`}
              className="font-bold hover:underline"
            >
              @{lPost.reply_to.author.username}
            </Link>
          </div>
        )}

        <div
          className="max-h-[400px]"
          dangerouslySetInnerHTML={{
            __html: parsePostBody(lPost.body)
          }}
        />

        {lPost.attachments && lPost.attachments.length > 0 && (
          <>
            <div className="flex w-full flex-wrap gap-4 pt-4">
              {lPost.attachments.map((attachment: any, i: number) => (
                <TimelinePhoto
                  key={attachment.id}
                  src={attachment.url}
                  width={attachment.width}
                  height={attachment.height}
                  alt={
                    attachment.alt_text || `${lPost.author.username}'s Photo`
                  }
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>

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
          </>
        )}

        {lPost.attachments.length === 0 &&
          lPost.urls &&
          lPost.urls.length > 0 &&
          !(
            lPost.flags &&
            lPost.flags.filter((d: any) => d.hide_embeds).length > 0
          ) && (
            <UrlEmbed
              metadata={lPost.urls[lPost.urls.length - 1]}
              className="mt-4"
            />
          )}

        <div className="min-h-[38px] pt-4">
          {isClient && (
            <div className="text-black-500 text-sm">
              {dayjs(lPost.created_at).format("MMM D, h:mm A")}
            </div>
          )}
        </div>

        <div className="text-black-500 pb-2 pt-4 text-sm">
          {lPost.count.likes > 0 ||
          lPost.count.replies > 0 ||
          lPost.count.stickers > 0
            ? [
                lPost.count.likes > 0 && (
                  <span
                    className="cursor-pointer hover:underline"
                    onClick={() => setLikesModalOpen(true)}
                  >
                    {lPost.count.likes}
                    {lPost.count.likes > 1 ? " Likes" : " Like"}
                  </span>
                ),
                lPost.count.replies > 0 && (
                  <span>
                    {lPost.count.replies}
                    {lPost.count.replies > 1 ? " Replies" : " Reply"}
                  </span>
                ),
                lPost.count.stickers > 0 && (
                  <span>
                    {lPost.count.stickers}
                    {lPost.count.stickers > 1 ? " Stickers" : " Sticker"}
                  </span>
                )
              ]
                .filter(Boolean)
                .map((item, i) => (
                  <div key={i} className="inline">
                    {item}
                  </div>
                ))
                .reduce((prev, curr, i) => {
                  if (i === 0) return prev;
                  return [prev, ", ", curr] as any as React.ReactElement;
                })
            : ""}
        </div>

        {user && <Separator className="h-[12px]" />}
        {user && (
          <div className="flex w-full flex-row justify-evenly gap-8 px-6 pt-4">
            <Heart
              className={cn(
                "size-6 cursor-pointer text-slate-700 hover:text-red-500",
                user &&
                  lPost.likes &&
                  lPost.likes.length > 0 &&
                  "fill-red-500 text-red-500"
              )}
              weight={
                user && lPost.likes && lPost.likes.length > 0
                  ? "fill"
                  : "regular"
              }
              onClick={() =>
                lPost.likes && lPost.likes.length > 0
                  ? unlikePost()
                  : likePost()
              }
            />

            <SmileySticker
              className={cn(
                "size-6 cursor-pointer text-slate-700 hover:text-blue-500 max-sm:hidden"
              )}
              strokeWidth={1.5}
              onClick={() => {
                window.dispatchEvent(new Event("stickers.open_editor"));
              }}
            />

            <div>
              <DropdownMenu>
                <DropdownMenuTrigger className="h-[20px] outline-none">
                  <EllipsisIcon className="size-5 opacity-75 hover:!opacity-100 focus:block" />
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
                        if (post.highlighted) {
                          unhighlightPost();
                        } else {
                          highlightPost();
                        }
                      }}
                    >
                      {lPost.highlighted ? "Remove Highlight" : "Highlight"}
                    </DropdownMenuItem>
                  )}

                  {user &&
                    (user.super_admin ||
                      post.author.id.toString() === user.id.toString()) && (
                      <>
                        <DropdownMenuSeparator />
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
        )}

        <Separator className="h-[12px]" />
      </div>

      {user && (
        <div className="flex w-full gap-2 pt-4">
          <FolksAvatar src={user.avatar_url} name={user.username} size={40} />

          <ReplyCompose
            post={lPost}
            user={user}
            onPost={() => {
              fetchPost();
              fetchReplies();
              window.scrollTo(0, document.body.scrollHeight);
            }}
          />
        </div>
      )}

      <div className="pt-4">
        {replies && replies.length > 0 ? (
          <Replies replies={replies} user={user} />
        ) : (
          <div className="pt-4 text-center">No replies yet.</div>
        )}
      </div>

      <LikesModal
        post={lPost}
        open={likesModalOpen}
        onClose={() => setLikesModalOpen(false)}
      />

      {isClient && (
        <StickerController
          user={user}
          postContainerRef={postContainerRef}
          post={lPost}
          replies={replies}
        />
      )}
    </div>
  );
}

function Replies({ replies, user }: { replies: any[]; user: any }) {
  return (
    <div className="flex flex-col gap-0">
      {replies.map((reply) => (
        <Reply reply={reply} user={user} key={reply.id} />
      ))}
    </div>
  );
}

function Reply({ reply, user }: { reply: any; user: any }) {
  const [showReplies, setShowReplies] = useState(true);

  return (
    <div key={reply.id} className="flex flex-col gap-2">
      <div
        className={"relative flex flex-row gap-2"}
        style={{
          paddingLeft: reply.depth > 0 ? `30px` : `0px`
        }}
      >
        {reply.replies && reply.replies.length > 0 && (
          <div
            className="group absolute flex min-h-full flex-1 items-stretch justify-center pt-[4px]"
            style={{
              width: "20px",
              marginLeft: "10px",
              zIndex: 40
            }}
          >
            <div
              className="pointer-events-auto mb-[45px] mt-[45px] flex min-h-full w-[8px] flex-1 cursor-pointer flex-col items-center justify-stretch text-center"
              onClick={() => setShowReplies(!showReplies)}
            >
              <div className="flex items-center justify-center pb-2">
                <ArrowDown
                  weight="bold"
                  className={cn(
                    "rotate-0 text-slate-300 transition-all dark:text-slate-700",
                    !showReplies && "rotate-[-180deg]"
                  )}
                />
              </div>

              <div
                className={
                  "min-h-full w-[2px] flex-1 bg-slate-300 opacity-0 transition-opacity delay-0 duration-100 group-hover:opacity-50 dark:bg-slate-700"
                }
              ></div>
            </div>
          </div>
        )}

        <div className="flex min-w-full flex-col">
          <Post post={reply} user={user} />

          <div
            className={cn(
              !showReplies &&
                reply.replies &&
                reply.replies.length > 0 &&
                "hidden"
            )}
          >
            {reply.replies && reply.replies.length > 0 && (
              <Replies replies={reply.replies} user={user} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
