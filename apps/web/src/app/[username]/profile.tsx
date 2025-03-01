"use client";

import { useState } from "react";
import { Gear } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";

import { FeedUser } from "@/components/feeds";
import { FolksAvatar } from "@/components/folks-avatar";
import { ProfileMedia } from "@/components/profile-media";
import { Separator } from "@/components/separator";
import { cn } from "@/lib/utils";

import { ChangeAvatar } from "../settings/change-avatar";
import { FollowButton } from "./follow-button";
import { FollowersModal, FollowingModal } from "./profile-modals";

export interface Profile {
  id: bigint;
  username: string;
  display_name: string;
  occupation?: string;
  location?: string;
  avatar_url?: string;
  pronouns?: string;
  website?: string;
  super_admin?: boolean;
  suspended?: boolean;
  created_at: Date;
  updated_at: Date;
  count: {
    following?: number;
    followers?: number;
    articles: number;
  };
}

enum Tabs {
  POSTS = "posts",
  REPLIES = "replies",
  MEDIA = "media",
  ARTICLES = "articles"
}

function Articles({ profile }: { profile: Profile }) {
  const { data, isLoading } = useQuery({
    queryKey: ["articles-profile-feed-" + profile.id],
    queryFn: async () => {
      const articles = await fetch(`/api/articles/user-feed/${profile.id}`, {
        method: "GET"
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.ok) {
            return res.articles;
          }
        })
        .catch((err) => {});

      return articles;
    }
  });

  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col gap-3 pt-2">
      {!isLoading &&
        data &&
        data.length > 0 &&
        data.map((article: any) => (
          <Link
            href={`/${profile.username}/${article.slug}`}
            className="group hover:no-underline"
            key={article.id}
          >
            <div className="flex justify-between gap-2">
              <div
                className="text-md text-serif break-words group-hover:underline"
                style={{
                  wordBreak: "break-word"
                }}
              >
                {article.title}
              </div>
              <div className="text-md flex flex-col items-end text-nowrap opacity-80">
                <span>{dayjs(article.published).format("MMM D, YYYY")}</span>
              </div>
            </div>
          </Link>
        ))}
    </div>
  );
}

export default function Profile({
  profile,
  user,
  isUser
}: {
  profile: Profile;
  user: any;
  isUser: boolean;
}) {
  const [followingModal, setFollowingModal] = useState(false);
  const [followersModal, setFollowersModal] = useState(false);
  const [tab, setTab] = useState<Tabs>(Tabs.POSTS);

  return (
    <>
      <div className="mx-auto w-full max-w-3xl flex-1">
        <div className="flex flex-col gap-2 py-2">
          <div className="flex flex-row justify-between">
            <div className="pb-2">
              {isUser ? (
                <ChangeAvatar user={user} />
              ) : (
                <FolksAvatar
                  src={profile.avatar_url || ""}
                  name={profile.username}
                  size={80}
                />
              )}
            </div>

            {!isUser && (
              <div className="flex flex-row items-end gap-2 pb-3">
                {!isUser && user && (
                  <Link
                    href={`/api/messages/channel/${profile.username}`}
                    prefetch={false}
                  >
                    <button className="h-[34px] w-[120px] border border-gray-400 px-3 py-1 hover:bg-gray-500/20">
                      Message
                    </button>
                  </Link>
                )}

                {!isUser && user && (
                  <FollowButton target_id={profile.id.toString()} />
                )}

                {!user && (
                  <Link href="/register">
                    <button className="h-[34px] w-[120px] border border-gray-400 px-3 py-1 hover:bg-gray-500/20">
                      Follow
                    </button>
                  </Link>
                )}
              </div>
            )}

            {isUser && (
              <Link
                href="/settings"
                className="group mt-3 h-fit w-fit"
                title="Edit Profile"
              >
                <Gear
                  size="28px"
                  weight="light"
                  className="opacity-50 transition-all group-hover:rotate-[24deg] group-hover:opacity-80"
                />
              </Link>
            )}
          </div>

          <div className="flex flex-row justify-between gap-4">
            <h1 className="font-black">{profile.display_name}</h1>
          </div>

          <p>
            @{profile.username} (#{profile.id})
          </p>

          <p className="mb-0">
            {profile.occupation && `${profile.occupation}`}
            {profile.location && `, ${profile.location}`}
            {profile.pronouns && `, ${profile.pronouns}`}
          </p>

          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              className="inline w-fit cursor-pointer text-sky-600 hover:underline"
            >
              <div className="inline">
                {profile.website.replace("https://", "")}{" "}
                <ExternalLinkIcon className="mt-[-2px] inline size-3" />
              </div>
            </a>
          )}

          {isUser && (
            <div className="flex gap-4 pt-2 text-sm">
              <button
                onClick={() => setFollowingModal(true)}
                className="dark:border-black-300 dark:text-black-300 border-black-700 text-black-700 rounded-2xl border px-5 py-1"
              >
                {profile.count.following} following
              </button>

              <button
                onClick={() => setFollowersModal(true)}
                className="dark:border-black-300 dark:text-black-300 border-black-700 text-black-700 rounded-2xl border px-5 py-1"
              >
                {profile.count.followers} followers
              </button>
            </div>
          )}
        </div>

        <div className="pb-2">
          <Separator />
        </div>

        <div className="flex w-full justify-center pb-4">
          <div className="text-black-400 flex flex-row space-x-2 text-sm font-bold">
            <span
              className={cn(
                "hover:text-foreground cursor-pointer px-4 py-0.5",
                tab === Tabs.POSTS &&
                  "hover:bg-black-800 text-foreground hover:text-background rounded-3xl bg-black text-white dark:bg-white dark:text-black dark:hover:bg-slate-200"
              )}
              onClick={() => setTab(Tabs.POSTS)}
            >
              Posts
            </span>

            {profile.count.articles > 0 && (
              <span
                className={cn(
                  "hover:text-foreground cursor-pointer px-4 py-0.5",
                  tab === Tabs.ARTICLES &&
                    "hover:bg-black-800 text-foreground hover:text-background rounded-3xl bg-black text-white dark:bg-white dark:text-black dark:hover:bg-slate-200"
                )}
                onClick={() => setTab(Tabs.ARTICLES)}
              >
                Articles
              </span>
            )}

            <span
              className={cn(
                "hover:text-foreground cursor-pointer px-4 py-0.5",
                tab === Tabs.REPLIES &&
                  "hover:bg-black-800 text-foreground hover:text-background rounded-3xl bg-black text-white dark:bg-white dark:text-black dark:hover:bg-slate-200"
              )}
              onClick={() => setTab(Tabs.REPLIES)}
            >
              Replies
            </span>

            <span
              className={cn(
                "hover:text-foreground cursor-pointer px-4 py-0.5",
                tab === Tabs.MEDIA &&
                  "hover:bg-black-800 text-foreground hover:text-background rounded-3xl bg-black text-white dark:bg-white dark:text-black dark:hover:bg-slate-200"
              )}
              onClick={() => setTab(Tabs.MEDIA)}
            >
              Media
            </span>
          </div>
        </div>
        {tab === Tabs.POSTS && (
          <FeedUser author_id={profile.id.toString()} user={user} />
        )}

        {tab === Tabs.REPLIES && (
          <FeedUser
            author_id={profile.id.toString()}
            user={user}
            replies={true}
          />
        )}

        {tab === Tabs.MEDIA && <ProfileMedia profile={profile} user={user} />}
        {tab === Tabs.ARTICLES && <Articles profile={profile} />}

        <FollowersModal
          open={followersModal}
          onClose={() => {
            setFollowersModal(false);
            setFollowingModal(false);
          }}
        />
        <FollowingModal
          open={followingModal}
          onClose={() => {
            setFollowersModal(false);
            setFollowingModal(false);
          }}
        />
      </div>
    </>
  );
}
