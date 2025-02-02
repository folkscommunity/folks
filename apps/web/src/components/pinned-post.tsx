"use client";

import { useEffect, useState } from "react";
import { PushPin } from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
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
  const { isPending, error, data, refetch } = useQuery({
    queryKey: ["post_" + id],
    queryFn: () => fetch(`/api/post/${id}`).then((res) => res.json())
  });

  useEffect(() => {
    if (data) {
      onLoaded();
    }
  }, [data]);

  return (
    <>
      {!isPending && data && (
        <div>
          <Link
            href={`/${data.post.author.username}/${data.post.id}`}
            className="flex w-fit items-center gap-[1ch] pb-2 pl-[54px] text-sm hover:underline"
          >
            <PushPin /> Pinned Post
          </Link>

          <Post user={user} post={data.post} />
        </div>
      )}
    </>
  );
}
