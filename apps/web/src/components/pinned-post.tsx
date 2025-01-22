"use client";

import { useState } from "react";
import { PushPin } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { Post } from "./post";

export function PinnedPost({ id, user }: { id: any; user: any }) {
  const [post, setPost] = useState<any>();

  fetch(`/api/post/${id}`, {
    method: "GET"
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.ok) {
        setPost(res.post);
      }
    })
    .catch((err) => {});

  return (
    <>
      {post && (
        <div>
          <Link
            href={`/${post.author.username}/${post.id}`}
            className="flex w-fit items-center gap-[1ch] pb-2 pl-[54px] text-sm hover:underline"
          >
            <PushPin /> Pinned Post
          </Link>

          <Post user={user} post={post} />
        </div>
      )}
    </>
  );
}
