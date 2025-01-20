"use client";

import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocalStorage } from "@uidotdev/usehooks";
// import { useIsClient, useLocalStorage } from "@uidotdev/usehooks";
import dynamic from "next/dynamic";
import { useInView } from "react-intersection-observer";

import { cn } from "@/lib/utils";

import { Composer } from "./composer";
import { FeedSkeleton, PostSkeleton } from "./feed-skeleton";
import { Post } from "./post";

enum FeedType {
  HIGHLIGHTED = "HIGHLIGHTED",
  FOLLOWING = "FOLLOWING",
  EVERYTHING = "EVERYTHING"
}

export function Feeds({ is_authed }: { is_authed: boolean }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? (
    <FeedsClient is_authed={is_authed} />
  ) : (
    <>
      <div className="w-full max-w-3xl flex-1 justify-center">
        <div className="flex justify-center pb-12">
          <div className="text-black-400 flex flex-row space-x-2 text-sm font-bold">
            <span
              className={cn("hover:text-foreground cursor-pointer px-4 py-0.5")}
            >
              Highlights
            </span>
            <span
              className={cn("hover:text-foreground cursor-pointer px-4 py-0.5")}
            >
              Everything
            </span>
            {is_authed && (
              <span
                className={cn(
                  "hover:text-foreground cursor-pointer px-4 py-0.5"
                )}
              >
                Following
              </span>
            )}
          </div>
        </div>

        <FeedSkeleton />
      </div>
    </>
  );
}

function FeedsClient({ is_authed }: { is_authed: boolean }) {
  const [feed, setFeed] = useLocalStorage(
    "selected_feed",
    FeedType.HIGHLIGHTED
  );

  useEffect(() => {
    if (
      feed !== FeedType.HIGHLIGHTED &&
      feed !== FeedType.EVERYTHING &&
      feed !== FeedType.FOLLOWING
    ) {
      setFeed(FeedType.HIGHLIGHTED);
    }
  }, [feed, setFeed]);

  return (
    <div className="w-full max-w-3xl flex-1 justify-center">
      <div className="flex justify-center pb-4">
        <div className="text-black-400 flex flex-row space-x-2 text-sm font-bold">
          <span
            className={cn(
              "hover:text-foreground cursor-pointer px-4 py-0.5",
              feed === FeedType.HIGHLIGHTED &&
                "hover:bg-black-800 text-foreground hover:text-background rounded-3xl bg-black text-white dark:bg-white dark:text-black dark:hover:bg-slate-200"
            )}
            onClick={() => setFeed(FeedType.HIGHLIGHTED)}
          >
            Highlights
          </span>
          <span
            className={cn(
              "hover:text-foreground cursor-pointer px-4 py-0.5",
              feed === FeedType.EVERYTHING &&
                "hover:bg-black-800 text-foreground hover:text-background rounded-3xl bg-black text-white dark:bg-white dark:text-black dark:hover:bg-slate-200"
            )}
            onClick={() => setFeed(FeedType.EVERYTHING)}
          >
            Everything
          </span>
          {is_authed && (
            <span
              className={cn(
                "hover:text-foreground cursor-pointer px-4 py-0.5",
                feed === FeedType.FOLLOWING &&
                  "hover:bg-black-800 text-foreground hover:text-background rounded-3xl bg-black text-white dark:bg-white dark:text-black dark:hover:bg-slate-200"
              )}
              onClick={() => setFeed(FeedType.FOLLOWING)}
            >
              Following
            </span>
          )}
        </div>
      </div>

      {feed === FeedType.HIGHLIGHTED && (
        <FeedHighlighted is_authed={is_authed} />
      )}
      {feed === FeedType.EVERYTHING && <FeedEverything is_authed={is_authed} />}
      {feed === FeedType.FOLLOWING && <FeedFollowing is_authed={is_authed} />}
    </div>
  );
}

function FeedEverything({ is_authed }: { is_authed: boolean }) {
  const { ref, inView } = useInView();
  const [timesAutoLoaded, setTimesAutoLoaded] = useState(0);

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
    retryOnMount: true,
    getNextPageParam: (lastPage: any, pages: any[]) => lastPage.nextCursor
  });

  useEffect(() => {
    if (
      inView &&
      !isFetching &&
      !isFetchingNextPage &&
      hasNextPage &&
      timesAutoLoaded <= 3
    ) {
      setTimesAutoLoaded(timesAutoLoaded + 1);
      fetchNextPage();
    }
  }, [
    isFetching,
    isFetchingNextPage,
    inView,
    fetchNextPage,
    hasNextPage,
    timesAutoLoaded
  ]);

  return (
    <div className="text-md mx-auto max-w-3xl">
      {is_authed && <Composer onPost={() => refetch()} />}

      {status === "pending" ? (
        <FeedSkeleton />
      ) : status === "error" ? (
        <p className="p-4">Error: {error.message}</p>
      ) : (
        <div>
          {data.pages.map(
            (page, i) =>
              page.feed &&
              page.feed.map((post: any, i: any) => {
                return <Post post={post} key={post.id} />;
              })
          )}

          {!(data.pages[0].feed && data.pages[0].feed.length === 0) && (
            <div className="py-4">
              <button
                ref={ref}
                onClick={() => {
                  if (!isFetchingNextPage) {
                    fetchNextPage();
                    setTimesAutoLoaded(0);
                  }
                }}
                className="w-full opacity-50"
                disabled={isFetching || isFetchingNextPage || !hasNextPage}
              >
                {hasNextPage
                  ? isFetching || isFetchingNextPage
                    ? "Loading..."
                    : "Load More"
                  : ""}
              </button>
            </div>
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

function FeedHighlighted({ is_authed }: { is_authed: boolean }) {
  const { ref, inView } = useInView();
  const [timesAutoLoaded, setTimesAutoLoaded] = useState(0);

  const fetchProjects = async ({
    pageParam
  }: {
    pageParam: number | undefined;
  }) => {
    if (pageParam === undefined) {
      const res = await fetch("/api/feed/highlighted");
      return res.json();
    } else {
      const res = await fetch("/api/feed/highlighted?cursor=" + pageParam);
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
    queryKey: ["feed_highlighted"],
    queryFn: fetchProjects,
    initialPageParam: undefined,
    retryOnMount: true,
    getNextPageParam: (lastPage: any, pages: any[]) => lastPage.nextCursor
  });

  useEffect(() => {
    if (
      inView &&
      !isFetching &&
      !isFetchingNextPage &&
      hasNextPage &&
      timesAutoLoaded <= 3
    ) {
      setTimesAutoLoaded(timesAutoLoaded + 1);
      fetchNextPage();
    }
  }, [
    isFetching,
    isFetchingNextPage,
    inView,
    fetchNextPage,
    hasNextPage,
    timesAutoLoaded
  ]);

  return (
    <div className="text-md mx-auto max-w-3xl">
      {is_authed && <Composer onPost={() => refetch()} />}

      {status === "pending" ? (
        <FeedSkeleton />
      ) : status === "error" ? (
        <p className="p-4">Error: {error.message}</p>
      ) : (
        <div>
          {data.pages.map(
            (page, i) =>
              page.feed &&
              page.feed.map((post: any, i: any) => {
                return <Post post={post} key={post.id} />;
              })
          )}

          {!(data.pages[0].feed && data.pages[0].feed.length === 0) && (
            <div className="py-4">
              <button
                ref={ref}
                onClick={() => {
                  if (!isFetchingNextPage) {
                    fetchNextPage();
                    setTimesAutoLoaded(0);
                  }
                }}
                className="w-full opacity-50"
                disabled={isFetching || isFetchingNextPage || !hasNextPage}
              >
                {hasNextPage
                  ? isFetching || isFetchingNextPage
                    ? "Loading..."
                    : "Load More"
                  : ""}
              </button>
            </div>
          )}

          {data.pages[0].feed && data.pages[0].feed.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 pt-4">
              <span className="text-neutral-700 dark:text-neutral-300">
                Nothing has been highlighted yet.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FeedFollowing({ is_authed }: { is_authed: boolean }) {
  const { ref, inView } = useInView();
  const [timesAutoLoaded, setTimesAutoLoaded] = useState(0);

  const fetchProjects = async ({
    pageParam
  }: {
    pageParam: number | undefined;
  }) => {
    if (pageParam === undefined) {
      const res = await fetch("/api/feed/following");
      return res.json();
    } else {
      const res = await fetch("/api/feed/following?cursor=" + pageParam);
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
    queryKey: ["feed_following"],
    queryFn: fetchProjects,
    initialPageParam: undefined,
    retryOnMount: true,
    getNextPageParam: (lastPage: any, pages: any[]) => lastPage.nextCursor
  });

  useEffect(() => {
    if (
      inView &&
      !isFetching &&
      !isFetchingNextPage &&
      hasNextPage &&
      timesAutoLoaded <= 3
    ) {
      setTimesAutoLoaded(timesAutoLoaded + 1);
      fetchNextPage();
    }
  }, [
    isFetching,
    isFetchingNextPage,
    inView,
    fetchNextPage,
    hasNextPage,
    timesAutoLoaded
  ]);

  return (
    <div className="text-md mx-auto max-w-3xl">
      {is_authed && <Composer onPost={() => refetch()} />}

      {status === "pending" ? (
        <FeedSkeleton />
      ) : status === "error" ? (
        <p className="p-4">Error: {error.message}</p>
      ) : (
        <div>
          {data.pages.map(
            (page, i) =>
              page.feed &&
              page.feed.map((post: any, i: any) => {
                return <Post post={post} key={post.id} />;
              })
          )}

          <div className="py-4">
            <button
              ref={ref}
              onClick={() => {
                if (!isFetchingNextPage) {
                  fetchNextPage();
                  setTimesAutoLoaded(0);
                }
              }}
              className="w-full opacity-50"
              disabled={isFetching || isFetchingNextPage || !hasNextPage}
            >
              {hasNextPage
                ? isFetching || isFetchingNextPage
                  ? "Loading..."
                  : "Load More"
                : ""}
            </button>
          </div>

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
  const { ref, inView } = useInView();

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
    queryKey: ["feed_user_" + author_id],
    queryFn: fetchProjects,
    initialPageParam: undefined,
    retryOnMount: true,
    getNextPageParam: (lastPage: any, pages: any[]) => lastPage.nextCursor
  });

  useEffect(() => {
    if (inView && !isFetching && !isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  }, [isFetching, isFetchingNextPage, inView, fetchNextPage, hasNextPage]);

  return (
    <div className="text-md mx-auto max-w-3xl">
      {status === "pending" ? (
        <p className="p-4">Loading...</p>
      ) : status === "error" ? (
        <p className="p-4">Error: {error.message}</p>
      ) : (
        <div>
          {data.pages.map((page, i) =>
            page.feed.map((post: any, i: any) => {
              return <Post post={post} key={post.id} />;
            })
          )}

          {!(data.pages[0].feed && data.pages[0].feed.length === 0) && (
            <div className="py-4">
              <button
                ref={ref}
                onClick={() => !isFetchingNextPage && fetchNextPage()}
                className="w-full opacity-50"
                disabled={isFetching || isFetchingNextPage || !hasNextPage}
              >
                {hasNextPage
                  ? isFetching || isFetchingNextPage
                    ? "Loading..."
                    : "Load More"
                  : ""}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
