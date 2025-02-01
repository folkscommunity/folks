"use client";

import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocalStorage } from "@uidotdev/usehooks";
// import { useIsClient, useLocalStorage } from "@uidotdev/usehooks";
import dynamic from "next/dynamic";
import { useFeatureFlagPayload } from "posthog-js/react";
import { useInView } from "react-intersection-observer";

import { cn } from "@/lib/utils";

import { Composer } from "./composer";
import { FeedSkeleton, PostSkeleton } from "./feed-skeleton";
import { PinnedPost } from "./pinned-post";
import { Post } from "./post";

enum FeedType {
  HIGHLIGHTED = "HIGHLIGHTED",
  FOLLOWING = "FOLLOWING",
  EVERYTHING = "EVERYTHING"
}

export function Feeds({
  is_authed,
  user,
  highlighted_pinned_post
}: {
  is_authed: boolean;
  user: any;
  highlighted_pinned_post: string | null;
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? (
    <>
      {is_authed && <Composer />}
      <FeedsClient
        is_authed={is_authed}
        user={user}
        highlighted_pinned_post={highlighted_pinned_post}
      />
    </>
  ) : (
    <>
      <div className="w-full max-w-3xl flex-1 justify-center">
        <div className="flex justify-center pb-6">
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

function FeedsClient({
  is_authed,
  user,
  highlighted_pinned_post
}: {
  is_authed: boolean;
  user: any;
  highlighted_pinned_post: string | null;
}) {
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

  useEffect(() => {
    window.addEventListener("go_to_everything", () =>
      setFeed(FeedType.EVERYTHING)
    );

    return () => {
      window.removeEventListener("go_to_everything", () =>
        setFeed(FeedType.EVERYTHING)
      );
    };
  }, []);

  return (
    <div className="w-full max-w-3xl flex-1 justify-center">
      <div className="flex justify-center pb-6">
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
        <FeedHighlighted
          is_authed={is_authed}
          user={user}
          highlighted_pinned_post={highlighted_pinned_post}
        />
      )}
      {feed === FeedType.EVERYTHING && (
        <FeedEverything is_authed={is_authed} user={user} />
      )}
      {feed === FeedType.FOLLOWING && (
        <FeedFollowing is_authed={is_authed} user={user} />
      )}
    </div>
  );
}

function FeedEverything({
  is_authed,
  user
}: {
  is_authed: boolean;
  user: any;
}) {
  const { ref, inView } = useInView();
  const [timesAutoLoaded, setTimesAutoLoaded] = useState(0);

  const fetchProjects = async ({
    pageParam
  }: {
    pageParam: number | undefined;
  }) => {
    if (pageParam === undefined) {
      const res = await fetch("/api/feed?type=everything");
      return res.json();
    } else {
      const res = await fetch("/api/feed?type=everything&cursor=" + pageParam);
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

  useEffect(() => {
    window.addEventListener("refresh_feeds", () => refetch());

    return () => {
      window.removeEventListener("refresh_feeds", () => refetch());
    };
  }, [refetch]);

  return (
    <div className="text-md mx-auto max-w-3xl">
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
                return <Post user={user} post={post} key={post.id} />;
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
                  : "You've reached the end of the feed."}
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

function FeedHighlighted({
  is_authed,
  user,
  highlighted_pinned_post
}: {
  is_authed: boolean;
  user: any;
  highlighted_pinned_post: string | null;
}) {
  const { ref, inView } = useInView();
  const [timesAutoLoaded, setTimesAutoLoaded] = useState(0);
  const [loadedPinnedPost, setLoadedPinnedPost] = useState(false);

  const fetchProjects = async ({
    pageParam
  }: {
    pageParam: number | undefined;
  }) => {
    if (pageParam === undefined) {
      const res = await fetch("/api/feed?type=highlighted");
      return res.json();
    } else {
      const res = await fetch("/api/feed?type=highlighted&cursor=" + pageParam);
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

  useEffect(() => {
    window.addEventListener("refresh_feeds", () => refetch());

    return () => {
      window.removeEventListener("refresh_feeds", () => refetch());
    };
  }, [refetch]);

  return (
    <div className="text-md mx-auto max-w-3xl">
      {status === "pending" ? (
        <FeedSkeleton />
      ) : status === "error" ? (
        <p className="p-4">Error: {error.message}</p>
      ) : (
        <div>
          {highlighted_pinned_post && (
            <PinnedPost
              id={highlighted_pinned_post.toString()}
              user={user}
              onLoaded={() => setLoadedPinnedPost(true)}
            />
          )}

          {(highlighted_pinned_post ? loadedPinnedPost : true) &&
            data.pages.map(
              (page, i) =>
                page.feed &&
                page.feed
                  .filter((post: any) => {
                    if (highlighted_pinned_post) {
                      return (
                        post.id.toString() !==
                        highlighted_pinned_post.toString()
                      );
                    } else {
                      return true;
                    }
                  })
                  .map((post: any, i: any) => {
                    return <Post user={user} post={post} key={post.id} />;
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
                  : "You've reached the end of the feed."}
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

function FeedFollowing({ is_authed, user }: { is_authed: boolean; user: any }) {
  const { ref, inView } = useInView();
  const [timesAutoLoaded, setTimesAutoLoaded] = useState(0);

  const fetchProjects = async ({
    pageParam
  }: {
    pageParam: number | undefined;
  }) => {
    if (pageParam === undefined) {
      const res = await fetch("/api/feed?type=following");
      return res.json();
    } else {
      const res = await fetch("/api/feed?type=following&cursor=" + pageParam);
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

  useEffect(() => {
    window.addEventListener("refresh_feeds", () => refetch());

    return () => {
      window.removeEventListener("refresh_feeds", () => refetch());
    };
  }, [refetch]);

  return (
    <div className="text-md mx-auto max-w-3xl">
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
                return <Post user={user} post={post} key={post.id} />;
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

export function FeedUser({
  author_id,
  user
}: {
  author_id: string;
  user: any;
}) {
  const { ref, inView } = useInView();

  const fetchProjects = async ({
    pageParam
  }: {
    pageParam: number | undefined;
  }) => {
    if (pageParam === undefined) {
      const res = await fetch(`/api/feed?type=user&user=${author_id}`);
      return res.json();
    } else {
      const res = await fetch(
        `/api/feed?type=user&user=${author_id}&cursor=` + pageParam
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

  useEffect(() => {
    window.addEventListener("refresh_feeds", () => refetch());

    return () => {
      window.removeEventListener("refresh_feeds", () => refetch());
    };
  }, [refetch]);

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
              return <Post user={user} post={post} key={post.id} />;
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
