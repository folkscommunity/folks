"use client";

import { cn } from "@/lib/utils";

export function FolksAvatar({
  src,
  name,
  size = 40,
  className
}: {
  src: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const firstLetter = name[0].toUpperCase();

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-clip rounded-full bg-gray-500/20 text-center font-sans text-lg font-bold text-black/50 dark:text-white/50",
        className
      )}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        maxWidth: size,
        maxHeight: size
      }}
    >
      {src ? (
        <img
          src={src}
          alt={firstLetter}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          className="rounded-full"
          style={{
            width: size,
            height: size
          }}
        />
      ) : (
        <span className="font-bold">{firstLetter}</span>
      )}
    </div>
  );
}
