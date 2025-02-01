"use client";

import { useEffect, useState } from "react";
import { PushPin } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { Post } from "./post";

export function PinnedPost({
  id,
  user,
  onLoaded
}: {
  id: any;
  user: any;
  onLoaded: () => void;
}) {
  const [post, setPost] = useState<any>();

  function fetchPost() {
    fetch(`/api/post/${id}`, {
      method: "GET"
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setPost(res.post);
          onLoaded();
        }
      })
      .catch((err) => {});
  }

  useEffect(() => {
    if (!post) {
      fetchPost();
    }
  }, [post]);

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
