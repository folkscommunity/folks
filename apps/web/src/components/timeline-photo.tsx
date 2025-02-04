"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/* eslint-disable @next/next/no-img-element */

export function TimelinePhoto({
  src,
  width,
  height,
  alt
}: {
  src: string;
  width: number;
  height: number;
  alt: string;
}) {
  const [big, setBig] = useState(false);

  return (
    <div
      className="group relative flex flex-col items-start"
      onClick={() => {
        setBig(!big);
      }}
    >
      <div
        className={cn(
          "max-h-[500px] max-w-full overflow-hidden rounded-lg",
          big &&
            "fixed bottom-0 left-0 right-0 top-0 z-[999999] flex h-[100dvh] max-h-[100dvh] w-[100vw] max-w-[100vw] flex-col items-center justify-center gap-4 bg-black bg-opacity-75 p-5 backdrop-blur-sm"
        )}
      >
        <img
          loading="lazy"
          decoding="async"
          alt={alt}
          src={src}
          style={{
            maxHeight: big ? "90dvh" : "inherit",
            maxWidth: "100%",
            height: "auto",
            width: "auto"
          }}
          fetchPriority="low"
          className={cn(
            "cursor-pointer rounded-lg border border-slate-300/0 dark:border-slate-800",
            big && "rounded-none border-0"
          )}
        />
        {big && (
          <button
            className="bg-black-900 dark:bg-black-800 text-black-100 rounded-full border border-neutral-300/0 p-2 px-4 dark:border-slate-800 dark:text-slate-400"
            onClick={() => setBig(false)}
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
