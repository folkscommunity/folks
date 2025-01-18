"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Ellipsis, Heart, MessageCircle, Repeat } from "lucide-react";
import Link from "next/link";

import { parsePostBody } from "@/lib/post-utils";
import { dateRelativeTiny } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Composer } from "./composer";

export function Feeds({ is_authed }: { is_authed: boolean }) {
  return (
    <div>
      {/* TODO: Add other feeds, such as following, and highlighted. */}
      <FeedEverything is_authed={is_authed} />
    </div>
  );
}

// TODO: Automatic infinite loading of posts on scroll.

function FeedEverything({ is_authed }: { is_authed: boolean }) {
  const fetchProjects = async ({
    pageParam
  }: {
    pageParam: number | undefined;
  }) => {
    if (pageParam === undefined) {
      const res = await fetch("/api/feed/everything");
      return res.json();
    } else {
      const res = await fetch("/api/feed/everything?cursor=" + pageParam);
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
    queryKey: ["feed_everything"],
    queryFn: fetchProjects,
    initialPageParam: undefined,
    getNextPageParam: (lastPage: any, pages: any[]) => lastPage.nextCursor
  });

  return (
    <div>
      {is_authed && <Composer onPost={() => refetch()} />}

      {status === "pending" ? (
        <p className="p-4"></p>
      ) : status === "error" ? (
        <p className="p-4">Error: {error.message}</p>
      ) : (
        <div>
          {data.pages.map((page, i) =>
            page.feed.map((post: any, i: any) => {
              return (
                <div
                  key={post.id}
                  className="flex gap-4 border-b border-neutral-200 px-4 py-4 dark:border-neutral-800"
                >
                  <div>
                    <Link
                      href={`/${post.author.username}`}
                      className="hover:no-underline"
                    >
                      <Avatar>
                        <AvatarImage src={post.author.avatar_url} />
                        <AvatarFallback>
                          {post.author.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center justify-between gap-[2px]">
                      <div>
                        <Link
                          className="font-bold"
                          href={`/${post.author.username}`}
                        >
                          {post.author.display_name}
                        </Link>{" "}
                        <Link
                          className="opacity-50"
                          href={`/${post.author.username}`}
                        >
                          @{post.author.username}
                        </Link>
                        <span className="px-0.5 opacity-50">·</span>
                        <span
                          className="text-md opacity-50"
                          title={new Date(post.created_at).toLocaleString()}
                        >
                          {dateRelativeTiny(new Date(post.created_at))}
                        </span>
                      </div>
                    </div>

                    <div
                      className="max-h-[400px] font-sans"
                      dangerouslySetInnerHTML={{
                        __html: parsePostBody(post.body)
                      }}
                    />

                    <div className="flex items-center justify-between gap-4 pt-4">
                      <div className="flex items-center gap-2">
                        <MessageCircle
                          className="size-5 cursor-pointer text-neutral-700 hover:fill-neutral-400 hover:text-neutral-400 dark:hover:fill-neutral-300 dark:hover:text-neutral-300"
                          strokeWidth={1.5}
                        />
                        {/* <span>0</span> */}
                      </div>
                      <div className="flex items-center gap-2">
                        <Repeat
                          className="size-5 cursor-pointer text-neutral-700 hover:text-green-500"
                          strokeWidth={1.5}
                        />
                        {/* <span>0</span> */}
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart
                          className="size-5 cursor-pointer text-neutral-700 hover:fill-red-500 hover:text-red-500"
                          strokeWidth={1.5}
                        />
                        {/* <span>0</span> */}
                      </div>
                      <div className="flex items-center gap-2">
                        <Ellipsis
                          className="size-5 cursor-pointer text-neutral-700 hover:fill-neutral-400 hover:text-neutral-400 dark:hover:fill-neutral-300 dark:hover:text-neutral-300"
                          strokeWidth={1.5}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {data.pages[0].feed && data.pages[0].feed.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 pt-4">
              <span className="text-neutral-700 dark:text-neutral-300">
                Nothing has been posted yet.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function FeedUser({ author_id }: { author_id: string }) {
  const fetchProjects = async ({
    pageParam
  }: {
    pageParam: number | undefined;
  }) => {
    if (pageParam === undefined) {
      const res = await fetch(`/api/feed/user/${author_id}`);
      return res.json();
    } else {
      const res = await fetch(
        `/api/feed/user/${author_id}?cursor=` + pageParam
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
    queryKey: ["feed_everything"],
    queryFn: fetchProjects,
    initialPageParam: undefined,
    getNextPageParam: (lastPage: any, pages: any[]) => lastPage.nextCursor
  });

  return (
    <div>
      {status === "pending" ? (
        <p className="p-4">Loading...</p>
      ) : status === "error" ? (
        <p className="p-4">Error: {error.message}</p>
      ) : (
        <div>
          {data.pages.map((page, i) =>
            page.feed.map((post: any, i: any) => {
              return (
                <div
                  key={post.id}
                  className="flex gap-4 border-b border-neutral-200 px-4 py-4 dark:border-neutral-800"
                >
                  <div>
                    <Link
                      href={`/${post.author.username}`}
                      className="hover:no-underline"
                    >
                      <Avatar>
                        <AvatarImage src={post.author.avatar_url} />
                        <AvatarFallback>
                          {post.author.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center justify-between gap-[2px]">
                      <div>
                        <Link
                          className="font-bold"
                          href={`/${post.author.username}`}
                        >
                          {post.author.display_name}
                        </Link>{" "}
                        <Link
                          className="opacity-50"
                          href={`/${post.author.username}`}
                        >
                          @{post.author.username}
                        </Link>
                        <span className="px-0.5 opacity-50">·</span>
                        <span
                          className="text-md opacity-50"
                          title={new Date(post.created_at).toLocaleString()}
                        >
                          {dateRelativeTiny(new Date(post.created_at))}
                        </span>
                      </div>
                    </div>

                    <div
                      className="max-h-[400px] font-sans"
                      dangerouslySetInnerHTML={{
                        __html: parsePostBody(post.body)
                      }}
                    />

                    <div className="flex items-center justify-between gap-4 pt-4">
                      <div className="flex items-center gap-2">
                        <MessageCircle
                          className="size-5 cursor-pointer text-neutral-700 hover:fill-neutral-400 hover:text-neutral-400 dark:hover:fill-neutral-300 dark:hover:text-neutral-300"
                          strokeWidth={1.5}
                        />
                        {/* <span>0</span> */}
                      </div>
                      <div className="flex items-center gap-2">
                        <Repeat
                          className="size-5 cursor-pointer text-neutral-700 hover:text-green-500"
                          strokeWidth={1.5}
                        />
                        {/* <span>0</span> */}
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart
                          className="size-5 cursor-pointer text-neutral-700 hover:fill-red-500 hover:text-red-500"
                          strokeWidth={1.5}
                        />
                        {/* <span>0</span> */}
                      </div>
                      <div className="flex items-center gap-2">
                        <Ellipsis
                          className="size-5 cursor-pointer text-neutral-700 hover:fill-neutral-400 hover:text-neutral-400 dark:hover:fill-neutral-300 dark:hover:text-neutral-300"
                          strokeWidth={1.5}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
