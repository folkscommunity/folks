import { Heart, MessageCircle } from "lucide-react";

import { cn } from "@/lib/utils";

function randomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function FeedSkeleton() {
  return (
    <div>
      {Array.from({ length: 8 }).map((_, i) => (
        <PostSkeleton key={i} height={100 * (i + 2)} />
      ))}
    </div>
  );
}

export function PostSkeleton({ height }: { height: number }) {
  return (
    <div className="mx-auto mb-4 flex max-w-3xl gap-4 pb-4 opacity-50">
      <div>
        <div className="size-[40px] rounded-full bg-neutral-200 dark:bg-slate-800"></div>
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-[2px]">
          <div>
            <div className="h-[21px] w-[120px] rounded-md bg-neutral-200 dark:bg-slate-800"></div>
          </div>
        </div>

        <div
          style={{
            height: height
          }}
          className="mt-2 max-h-[400px] w-[70%] rounded-md bg-neutral-200 max-md:w-full dark:bg-slate-800"
        />

        <div className="flex h-[24px] items-center justify-start gap-6 pt-2">
          <div className="flex items-center gap-2">
            <MessageCircle
              className="size-5 cursor-pointer fill-neutral-200 text-neutral-200 dark:fill-slate-800 dark:text-slate-800"
              strokeWidth={1.5}
            />
          </div>

          <div className="flex items-center gap-2">
            <Heart
              className="size-5 cursor-pointer fill-neutral-200 text-neutral-200 dark:fill-slate-800 dark:text-slate-800"
              strokeWidth={1.5}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
