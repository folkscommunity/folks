import { useEffect, useState } from "react";
import Link from "next/link";

import { FolksAvatar } from "@/components/folks-avatar";

export function FollowingModal({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState([]);

  function fetchLikes() {
    fetch(`/api/follow/following`)
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setData(res.data.following);
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
          <div className="pt-1 font-bold">Following:</div>
          <button onClick={() => onClose()}>[x]</button>
        </div>
        <div className="flex flex-col gap-2 overflow-clip overflow-y-scroll">
          {data &&
            data.length > 0 &&
            data.map((f: any) => (
              <div key={f.id} className="flex flex-row items-center gap-2 pb-2">
                <div>
                  <Link href={`/${f.username}`} className="hover:no-underline">
                    <FolksAvatar
                      src={f.avatar_url}
                      name={f.username}
                      size={50}
                    />
                  </Link>
                </div>

                <div className="flex flex-col justify-center">
                  <Link className="font-bold" href={`/${f.username}`}>
                    {f.display_name}
                  </Link>{" "}
                  <Link className="opacity-50" href={`/${f.username}`}>
                    @{f.username}
                  </Link>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  ) : null;
}

export function FollowersModal({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState([]);

  function fetchLikes() {
    fetch(`/api/follow/followers`)
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setData(res.data.followers);
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
          <div className="pt-1 font-bold">Followers:</div>
          <button onClick={() => onClose()}>[x]</button>
        </div>
        <div className="flex flex-col gap-2 overflow-clip overflow-y-scroll">
          {data &&
            data.length > 0 &&
            data.map((f: any) => (
              <div key={f.id} className="flex flex-row items-center gap-2 pb-2">
                <div>
                  <Link href={`/${f.username}`} className="hover:no-underline">
                    <FolksAvatar
                      src={f.avatar_url}
                      name={f.username}
                      size={50}
                    />
                  </Link>
                </div>

                <div className="flex flex-col justify-center">
                  <Link className="font-bold" href={`/${f.username}`}>
                    {f.display_name}
                  </Link>{" "}
                  <Link className="opacity-50" href={`/${f.username}`}>
                    @{f.username}
                  </Link>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  ) : null;
}
