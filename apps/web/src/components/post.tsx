/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { ChatCircle, Heart } from "@phosphor-icons/react";
import {
  EllipsisVerticalIcon,
  MessageCircle,
  SmileIcon,
  SmilePlusIcon,
  StickerIcon
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFeatureFlagPayload } from "posthog-js/react";
import { toast } from "sonner";

import { parsePostBody } from "@/lib/post-utils";
import { cn, dateRelativeTiny } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "./dropdown-menu";
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

export function Post({ post, user }: { post: any; user: any }) {
  const [lPost, setLPost] = useState(post);
  const [isClient, setIsClient] = useState(false);
  const stickers_teaser_feature_flag = useFeatureFlagPayload("stickers_teaser");

  const router = useRouter();

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
      className="group mx-auto mb-4 flex w-full max-w-3xl gap-4 pb-4"
      id={`post-${lPost.id}`}
    >
      <div>
        <Link href={`/${lPost.author.username}`} className="hover:no-underline">
          <Avatar>
            <AvatarImage src={lPost.author.avatar_url} />
            <AvatarFallback>
              {lPost.author.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
      <div className="flex max-w-full flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-[2px]">
          <div>
            <Link className="font-bold" href={`/${lPost.author.username}`}>
              {lPost.author.display_name}
            </Link>{" "}
            <Link className="opacity-50" href={`/${lPost.author.username}`}>
              @{lPost.author.username}
            </Link>
            {lPost && lPost.created_at && isClient && (
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
            className="breaklinks max-h-[400px] max-w-full break-words"
            dangerouslySetInnerHTML={{
              __html: parsePostBody(lPost.body)
            }}
          />
        </a>

        {lPost.attachments && lPost.attachments.length > 0 && (
          <div className="pt-2">
            {lPost.attachments.map((attachment: any, i: number) => (
              <TimelinePhoto
                key={i}
                src={attachment.url}
                width={attachment.width}
                height={attachment.height}
                alt={`${lPost.author.username}'s Photo`} // TODO: Handle ALT text
              />
            ))}
          </div>
        )}

        {lPost.attachments.length === 0 &&
          lPost.urls &&
          lPost.urls.length > 0 &&
          !(
            lPost.flags &&
            lPost.flags.filter((d: any) => d.hide_embeds).length > 0
          ) && <UrlEmbed metadata={lPost.urls[0]} />}

        <div className="flex h-[24px] items-center justify-start gap-4 pt-2">
          <div className="flex min-w-12 items-center gap-2">
            <ChatCircle
              className="size-5 min-h-5 min-w-5 cursor-pointer text-slate-700 hover:fill-neutral-400 hover:text-neutral-400 dark:hover:fill-neutral-300 dark:hover:text-neutral-300"
              onClick={() =>
                router.push(`/${lPost.author.username}/${lPost.id}`)
              }
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

          {isClient &&
            stickers_teaser_feature_flag &&
            (stickers_teaser_feature_flag as string[]).includes(
              lPost.id.toString()
            ) && (
              <div className="flex min-w-12 items-center gap-2">
                <SmileIcon
                  className={cn(
                    "rotate size-5 rotate-0 cursor-pointer text-slate-700 transition-transform hover:rotate-[-30deg] hover:text-blue-500"
                  )}
                  strokeWidth={1.5}
                  onClick={stickers}
                />
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

function UrlEmbed({ metadata }: { metadata: URLMetadata }) {
  const horizontal =
    metadata.image &&
    metadata.image.width &&
    metadata.image.height &&
    metadata.image.width > metadata.image.height;

  return (
    <Link
      href={metadata.url}
      className="border-black-200 hover:bg-black-100/50 dark:border-black-700 dark:hover:bg-black-700/25 group/url mt-2 flex w-full max-w-md flex-col overflow-clip rounded-md border hover:no-underline"
      target="_blank"
    >
      {metadata.image && (horizontal || metadata.image?.image_square) && (
        <div className="border-black-200 dark:border-black-700 border-b">
          <img src={metadata.image.url} alt={metadata.title} width="100%" />
        </div>
      )}
      <div className="flex items-center gap-2 pr-3">
        {!(metadata.image && (horizontal || metadata.image?.image_square)) && (
          <div className="border-black-200 dark:border-black-700 flex aspect-square h-full min-h-[105px] min-w-[105px] flex-1 items-center justify-center border-r">
            <img
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
              metadata.description.length >= (metadata.fetching ? 70 : 89) &&
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
