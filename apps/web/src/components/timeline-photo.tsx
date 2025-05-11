"use client";

import { useState } from "react";

import { cn, optimizedImageUrl } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "./dialog";

export function TimelinePhoto({
  src,
  width,
  height,
  alt,
  onClick
}: {
  src: string;
  width: number;
  height: number;
  alt: string;
  onClick?: () => void;
}) {
  const url_1x = optimizedImageUrl(src, 800);
  const url_2x = optimizedImageUrl(src, 1600);
  const [showAltDialog, setShowAltDialog] = useState(false);

  const srcset = `${url_1x} 1x, ${url_2x} 2x`;

  // Check if alt text exists and is not just a default username's photo text
  const hasCustomAltText = alt && !alt.endsWith("'s Photo");

  return (
    <div className="group relative flex flex-col items-start" onClick={onClick}>
      <div
        className={cn("max-h-[500px] max-w-full overflow-hidden rounded-lg")}
      >
        <img
          loading="lazy"
          decoding="async"
          alt={alt}
          src={url_1x}
          srcSet={srcset}
          style={{
            maxHeight: "inherit",
            maxWidth: "100%",
            height: "auto",
            width: "auto"
          }}
          fetchPriority="low"
          className={cn(
            "border-black-200/50 cursor-pointer rounded-lg border dark:border-slate-800"
          )}
        />

        {hasCustomAltText && (
          <Dialog>
            <DialogTrigger asChild>
              <button
                className="bg-black-900 dark:bg-black-800 text-black-100 absolute bottom-2 right-2 h-[32px] w-[32px] rounded-full border border-neutral-300/0 p-1 text-xs font-medium opacity-50 hover:opacity-100 dark:border-slate-800 dark:text-slate-400"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAltDialog(true);
                }}
              >
                alt
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Image Description</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {alt}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
