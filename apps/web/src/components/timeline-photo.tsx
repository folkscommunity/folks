"use client";

import { cn, optimizedImageUrl } from "@/lib/utils";

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

  const srcset = `${url_1x} 1x, ${url_2x} 2x`;

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
      </div>
    </div>
  );
}
