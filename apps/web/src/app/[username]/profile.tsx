"use client";

import { useEffect } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar";
import { FeedUser } from "@/components/feeds";

import { FollowButton } from "./follow-button";

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
}

export default function Profile({
  profile,
  isUser
}: {
  profile: Profile;
  isUser: boolean;
}) {
  useEffect(() => {
    document.title = `${profile.display_name} @ Folks`;
  }, [profile]);

  return (
    <div>
      <div className="border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
        <div className="pb-4">
          <Avatar className="size-[80px]">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="text-3xl">
              {profile.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex flex-row justify-between gap-4">
          <h1 className="font-black">{profile.display_name}</h1>

          {!isUser && <FollowButton target_id={profile.id.toString()} />}
        </div>
        <p>
          @{profile.username} (#{profile.id})
        </p>
        <p>
          {profile.occupation && `${profile.occupation}`}
          {profile.location && `, ${profile.location}`}
          {profile.pronouns && `, ${profile.pronouns}`}
        </p>
      </div>

      <FeedUser author_id={profile.id.toString()} />
    </div>
  );
}
