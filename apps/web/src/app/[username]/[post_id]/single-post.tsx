"use client";

import { useState } from "react";
import { Heart } from "@phosphor-icons/react";
import dayjs from "dayjs";
import { EllipsisIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar";
import { ReplyCompose } from "@/components/composer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/dropdown-menu";
import { FeedUser } from "@/components/feeds";
import { Post } from "@/components/post";
import { Separator } from "@/components/separator";
import { TimelinePhoto } from "@/components/timeline-photo";
import { parsePostBody } from "@/lib/post-utils";
import { cn, dateRelativeTiny } from "@/lib/utils";

import { LikesModal } from "./likes-modal";

export function SinglePost({ user, post }: { user: any; post: any }) {
  const [lPost, setLPost] = useState(post);
  const [likesModalOpen, setLikesModalOpen] = useState(false);

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
    <div className="text-md mx-auto w-full max-w-3xl">
      <div className="w-full pb-2">
        <div className="flex flex-row gap-4 pb-4">
          <div>
            <Link
              href={`/${lPost.author.username}`}
              className="hover:no-underline"
            >
              <Avatar className="size-[60px]">
                <AvatarImage src={lPost.author.avatar_url} />
                <AvatarFallback>
                  {lPost.author.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
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
          <div className="pt-4">
            {lPost.attachments.map((attachment: any, i: number) => (
              <TimelinePhoto
                key={attachment.id}
                src={attachment.url}
                width={attachment.width}
                height={attachment.height}
                alt={`${lPost.author.username}'s Photo`} // TODO: Handle ALT text
              />
            ))}
          </div>
        )}

        <div className="text-black-500 pt-4 text-sm">
          {dayjs(lPost.created_at).format("MMM D, h:mm A")}
        </div>

        <div className="text-black-500 pt-4 text-sm">
          <span
            className="cursor-pointer hover:underline"
            onClick={() => setLikesModalOpen(true)}
          >
            {lPost.count.likes > 0 &&
              `${lPost.count.likes} ${lPost.count.likes > 1 ? "Likes" : "Like"}`}
          </span>
          {lPost.count.replies &&
          lPost.count.replies > 0 &&
          lPost.count.likes &&
          lPost.count.likes > 0
            ? ", "
            : ""}
          {lPost.count.replies > 0 &&
            `${lPost.count.replies} ${lPost.count.replies > 1 ? "Replies" : "Reply"}`}
        </div>

        <Separator className="h-[12px]" />

        <div className="flex w-full flex-row justify-evenly gap-8 px-6 pt-4">
          <Heart
            className={cn(
              "size-6 cursor-pointer text-slate-700 hover:text-red-500",
              lPost.likes &&
                lPost.likes.length > 0 &&
                "fill-red-500 text-red-500"
            )}
            onClick={() =>
              lPost.likes && lPost.likes.length > 0 ? unlikePost() : likePost()
            }
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

        <Separator className="h-[12px]" />
      </div>

      {user && (
        <div className="flex w-full gap-2 pt-4">
          <Avatar className="size-[40px]">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>

          <ReplyCompose
            post={lPost}
            user={user}
            onPost={() => {
              fetchPost();
            }}
          />
        </div>
      )}

      <div className="pt-4">
        {lPost.replies && lPost.replies.length > 0 ? (
          lPost.replies
            .sort(
              (a: any, b: any) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )
            .map((reply: any, i: number) => (
              <Post post={reply} user={user} key={i} />
            ))
        ) : (
          <div>No replies yet.</div>
        )}
      </div>

      <LikesModal
        post={lPost}
        open={likesModalOpen}
        onClose={() => setLikesModalOpen(false)}
      />
    </div>
  );
}
