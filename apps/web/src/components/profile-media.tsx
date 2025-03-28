"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Masonry from "react-smart-masonry";

import { cn } from "@/lib/utils";

export function ProfileMedia({ profile, user }: { profile: any; user: any }) {
  const fetchUserMedia = async () => {
    const res = await fetch(`/api/feed/media/${profile.id}`);
    return res.json();
  };

  const { data, error, refetch, isFetching, status } = useQuery({
    queryKey: ["user_media_" + profile.id],
    queryFn: fetchUserMedia,
    refetchInterval: 1000 * 60,
    refetchIntervalInBackground: true,
    retryOnMount: true
  });

  return (
    <div
      style={{
        minHeight: isFetching ? "50dvh" : "auto"
      }}
    >
      {status === "pending" ? (
        <div></div>
      ) : status === "error" ? (
        <p className="p-4">Error: {error.message}</p>
      ) : (
        <div className={"fadein"}>
          {data?.posts ? (
            <Masonry
              breakpoints={{
                mobile: 400,
                desktop: 600
              }}
              columns={{
                mobile: 1,
                desktop: 3
              }}
              gap={10}
            >
              {data?.posts &&
                data.posts.map((item: any, itemIndex: number) => (
                  <Image
                    key={itemIndex}
                    src={item.url}
                    alt={item.post.body}
                    width={item.width}
                    height={item.height}
                    username={profile.username}
                    post_id={item.post.id}
                  />
                ))}
            </Masonry>
          ) : (
            <div className="pt-4 text-center">
              {profile.display_name} has not posted any images yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Image({
  src,
  alt,
  width,
  height,
  username,
  post_id
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  username: string;
  post_id: string;
}) {
  const [visible, setVisible] = useState(false);
  const [imageHeight, setImageHeight] = useState(0);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const containerWidth = ref.current.clientWidth;
      const aspectRatio = width / height;
      const calculatedHeight = containerWidth / aspectRatio;
      setImageHeight(calculatedHeight);
    }
  }, [ref]);

  return (
    <div
      ref={ref}
      className={cn(
        "h-auto w-full opacity-0 transition-opacity duration-500",
        visible && "opacity-100"
      )}
      style={{
        minHeight: imageHeight
      }}
    >
      <Link href={`/${username}/${post_id}`}>
        <img
          src={src}
          className="h-auto w-full"
          alt={alt}
          onLoad={() => {
            setTimeout(() => {
              setVisible(true);
            }, 100);
          }}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
        />
      </Link>
    </div>
  );
}
