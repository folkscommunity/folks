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
  onClick,
  firstImageHeight
}: {
  src: string;
  width: number;
  height: number;
  alt: string;
  onClick?: () => void;
  firstImageHeight?: number;
}) {
  const url_1x = optimizedImageUrl(src, 800);
  const url_2x = optimizedImageUrl(src, 1600);
  const [showAltDialog, setShowAltDialog] = useState(false);

  const srcset = `${url_1x} 1x, ${url_2x} 2x`;

  // Check if alt text exists and is not just a default username's photo text
  const hasCustomAltText = alt && !alt.endsWith("'s Photo");

  const minHeight =
    firstImageHeight && firstImageHeight >= 300 ? 300 : firstImageHeight;

  // Calculate height based on aspect ratio and 80vw max width
  const aspectRatio = width / height;

  return (
    <div className="group relative flex-none" onClick={onClick}>
      <div
        className={cn(
          "relative overflow-hidden rounded-lg",
          "max-h-[300px] sm:max-h-[500px]",
          "min-h-[100px] sm:min-h-[200px]"
        )}
        style={
          {
            width:
              "min(80vw, calc(var(--container-height) * " + aspectRatio + "))",
            height:
              "min(calc(80vw / " + aspectRatio + "), var(--container-height))",
            "--container-height":
              minHeight && minHeight < 300
                ? "300px"
                : minHeight
                  ? `${minHeight}px`
                  : "300px"
          } as any
        }
      >
        <img
          loading="lazy"
          decoding="async"
          alt={alt}
          src={url_1x}
          srcSet={srcset}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center"
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
                className="bg-black-900 dark:bg-black-800 text-black-100 absolute bottom-2 right-2 h-[32px] w-[32px] rounded-full border border-neutral-300/0 p-1 text-xs font-medium opacity-50 hover:opacity-100 dark:border-slate-800 dark:text-slate-300"
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
                <p className="text-sm text-slate-600 dark:text-slate-300">
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
