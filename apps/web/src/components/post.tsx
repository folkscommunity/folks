"use client";

import { useState } from "react";
import { EllipsisVerticalIcon, Heart, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export function Post({ post, user }: { post: any; user: any }) {
  const [lPost, setLPost] = useState(post);
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

  return (
    <div className="group mx-auto mb-4 flex w-full max-w-3xl gap-4 pb-4">
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
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-[2px]">
          <div>
            <Link className="font-bold" href={`/${lPost.author.username}`}>
              {lPost.author.display_name}
            </Link>{" "}
            <Link className="opacity-50" href={`/${lPost.author.username}`}>
              @{lPost.author.username}
            </Link>
            <span className="px-0.5 opacity-50">·</span>
            <span
              className="text-md opacity-50"
              title={new Date(lPost.created_at).toLocaleString()}
            >
              {dateRelativeTiny(new Date(lPost.created_at))}
            </span>
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
                    navigator.clipboard.writeText(post.id.toString())
                  }
                >
                  Copy Post ID
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

        <div
          className="max-h-[400px]"
          dangerouslySetInnerHTML={{
            __html: parsePostBody(lPost.body)
          }}
        />

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

        <div className="flex h-[24px] items-center justify-start gap-6 pt-2">
          <div className="flex w-10 items-center gap-2">
            <MessageCircle
              className="size-5 cursor-pointer text-slate-700 hover:fill-neutral-400 hover:text-neutral-400 dark:hover:fill-neutral-300 dark:hover:text-neutral-300"
              strokeWidth={1.5}
              onClick={() =>
                router.push(`/${lPost.author.username}/${lPost.id}`)
              }
            />
            <span>{lPost.count.replies || " "}</span>
          </div>

          <div className="flex w-10 items-center gap-2">
            <Heart
              className={cn(
                "size-5 cursor-pointer text-slate-700 hover:text-red-500",
                lPost.likes &&
                  lPost.likes.length > 0 &&
                  "fill-red-500 text-red-500"
              )}
              strokeWidth={1.5}
              onClick={() =>
                lPost.likes && lPost.likes.length > 0
                  ? unlikePost()
                  : likePost()
              }
            />
            <span>
              {lPost.count.likes > 0 ? lPost.count.likes : <span> </span>}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
