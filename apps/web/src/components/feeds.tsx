"use client";

import { useEffect, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useInView } from "react-intersection-observer";

import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { InlineComposer } from "./composer";
import { FeedSkeleton } from "./feed-skeleton";
import { FolksAvatar } from "./folks-avatar";
import { PinnedPost } from "./pinned-post";
import { Post } from "./post";

enum FeedType {
  HIGHLIGHTED = "HIGHLIGHTED",
  FOLLOWING = "FOLLOWING",
  EVERYTHING = "EVERYTHING"
}

async function PreloadFeeds(queryClient: any, is_authed: boolean) {
  const fetchEverything = async ({
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

  const fetchHighlighted = async ({
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

  const fetchFollowing = async ({
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

  await queryClient.prefetchInfiniteQuery({
    queryKey: ["feed_everything"],
    queryFn: fetchEverything,
    initialPageParam: undefined
  });

  await queryClient.prefetchInfiniteQuery({
    queryKey: ["feed_highlighted"],
    queryFn: fetchHighlighted,
    initialPageParam: undefined
  });

  if (is_authed) {
    await queryClient.prefetchInfiniteQuery({
      queryKey: ["feed_following"],
      queryFn: fetchFollowing,
      initialPageParam: undefined
    });
  }
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
    <FeedsClient
      is_authed={is_authed}
      user={user}
      highlighted_pinned_post={highlighted_pinned_post}
    />
  ) : (
    <>
      <div className="w-full max-w-3xl flex-1 justify-center">
        <div className="flex justify-center pb-4">
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

        {is_authed && (
          <div className="mb-[38px] mt-2 w-full max-w-3xl flex-1 justify-center opacity-50">
            <div className="flex w-full gap-[16px] pt-2">
              <div className="size-10 animate-pulse rounded-full bg-neutral-200 dark:bg-slate-800" />

              <div className="mt-2 h-[21px] w-[50%] animate-pulse rounded-md bg-neutral-200 dark:bg-slate-800" />
            </div>
          </div>
        )}

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
  const queryClient = useQueryClient();

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

    PreloadFeeds(queryClient, is_authed).then(() => {
      return;
    });

    return () => {
      window.removeEventListener("go_to_everything", () =>
        setFeed(FeedType.EVERYTHING)
      );
    };
  }, []);

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
      {is_authed && (
        <div className="mb-4 w-full max-w-3xl flex-1 justify-center">
          <div className="flex w-full gap-2 pt-4">
            <FolksAvatar src={user.avatar_url} name={user.username} />
            <InlineComposer />
          </div>
        </div>
      )}
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

  const fetchEverything = async ({
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
    queryFn: fetchEverything,
    initialPageParam: undefined,
    refetchInterval: 1000 * 60,
    refetchIntervalInBackground: true,
    retryOnMount: true,
    getNextPageParam: (lastPage: any, pages: any[]) => lastPage.nextCursor
  });

  useEffect(() => {
    if (
      inView &&
      !isFetching &&
      !isFetchingNextPage &&
      hasNextPage &&
      timesAutoLoaded <= 10
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
        <div className={cn(data.pages?.length === 0 && "fadein")}>
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

  const fetchHighlighted = async ({
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
    queryFn: fetchHighlighted,
    initialPageParam: undefined,
    refetchInterval: 1000 * 60,
    refetchIntervalInBackground: true,
    retryOnMount: true,
    getNextPageParam: (lastPage: any, pages: any[]) => lastPage.nextCursor
  });

  useEffect(() => {
    if (
      inView &&
      !isFetching &&
      !isFetchingNextPage &&
      hasNextPage &&
      timesAutoLoaded <= 10
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
      {status === "pending" || !data?.pages ? (
        <FeedSkeleton />
      ) : status === "error" ? (
        <p className="p-4">Error: {error.message}</p>
      ) : (
        <div className="flex min-h-[100vh] flex-1 flex-col">
          <div
            className={cn(
              "flex flex-1 flex-col",
              data.pages?.length === 0 && "fadein"
            )}
          >
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
          </div>

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

  const fetchFollowing = async ({
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
    queryFn: fetchFollowing,
    initialPageParam: undefined,
    refetchInterval: 1000 * 60,
    refetchIntervalInBackground: true,
    retryOnMount: true,
    getNextPageParam: (lastPage: any, pages: any[]) => lastPage.nextCursor
  });

  useEffect(() => {
    if (
      inView &&
      !isFetching &&
      !isFetchingNextPage &&
      hasNextPage &&
      timesAutoLoaded <= 10
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
        <div className={cn(data.pages?.length === 0 && "fadein")}>
          {data.pages.length === 0 && <FeedSkeleton />}
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
  user,
  replies
}: {
  author_id: string;
  user: any;
  replies?: boolean;
}) {
  const { ref, inView } = useInView();

  const fetchUserFeed = async ({
    pageParam
  }: {
    pageParam: number | undefined;
  }) => {
    if (pageParam === undefined) {
      const res = await fetch(
        `/api/feed?type=user&user=${author_id}&replies=${replies || false}`
      );
      return res.json();
    } else {
      const res = await fetch(
        `/api/feed?type=user&user=${author_id}&replies=${replies || false}&cursor=` +
          pageParam
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
    queryKey: replies
      ? ["feed_user_replies_" + author_id]
      : ["feed_user_" + author_id],
    queryFn: fetchUserFeed,
    initialPageParam: undefined,
    refetchInterval: 1000 * 60,
    refetchIntervalInBackground: true,
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
        <FeedSkeleton />
      ) : status === "error" ? (
        <p className="p-4">Error: {error.message}</p>
      ) : (
        <div className={cn(data.pages?.length === 0 && "fadein")}>
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
