import { useEffect, useState } from "react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar";

export function LikesModal({
  post,
  open,
  onClose
}: {
  post: any;
  open: boolean;
  onClose: () => void;
}) {
  const [likes, setLikes] = useState(post.likes);

  function fetchLikes() {
    fetch(`/api/post/${post.id}/likes`)
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setLikes(res.likes);
        }
      })
      .catch((err) => {});
  }

  useEffect(() => {
    fetchLikes();
  }, [open]);

  return open ? (
    <div className="fixed left-0 top-0 z-[99992] flex h-screen w-screen flex-col items-center justify-center gap-2 p-4">
      <div
        className="fixed left-0 top-0 z-[99995] flex h-screen w-screen items-center justify-center bg-black/5 backdrop-blur-sm transition-opacity"
        onClick={() => onClose()}
      />
      <div className="bg-black-100 dark:bg-black-800 z-[99999] flex max-h-[600px] w-[400px] max-w-full flex-col gap-4 rounded-lg border border-neutral-300 px-6 py-4 dark:border-slate-900">
        <div className="flex justify-between gap-4">
          <div className="pt-1 font-bold">Liked By</div>
          <button onClick={() => onClose()}>[x]</button>
        </div>
        <div className="flex flex-col gap-2 overflow-clip overflow-y-scroll">
          {likes &&
            likes.length > 0 &&
            likes.map((like: any) => (
              <div
                key={like.id}
                className="flex flex-row items-center gap-2 pb-2"
              >
                <div>
                  <Link
                    href={`/${like.user.username}`}
                    className="hover:no-underline"
                  >
                    <Avatar className="size-[50px]">
                      <AvatarImage src={like.user.avatar_url} />
                      <AvatarFallback>
                        {like.user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </div>

                <div className="flex flex-col justify-center">
                  <Link className="font-bold" href={`/${like.user.username}`}>
                    {like.user.display_name}
                  </Link>{" "}
                  <Link className="opacity-50" href={`/${like.user.username}`}>
                    @{like.user.username}
                  </Link>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  ) : null;
}
