"use client";

import { useState } from "react";
import { Heart, MessageCircle, XIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { parsePostBody } from "@/lib/post-utils";
import { cn, dateRelativeTiny } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { TimelinePhoto } from "./timeline-photo";

export function Post({ post }: { post: any }) {
  const [lPost, setLPost] = useState(post);

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

  return (
    <div className="mx-auto mb-4 flex max-w-3xl gap-4 pb-4">
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
        </div>

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
          <div className="flex items-center gap-2">
            <MessageCircle
              className="size-5 cursor-pointer text-slate-700 hover:fill-neutral-400 hover:text-neutral-400 dark:hover:fill-neutral-300 dark:hover:text-neutral-300"
              strokeWidth={1.5}
            />
            {/* <span>0</span> */}
          </div>

          <div className="flex items-center gap-2">
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
