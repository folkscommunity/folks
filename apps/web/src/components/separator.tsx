"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export function Separator({ className }: { className?: string }) {
  const [width, setWidth] = useState(768);
  const [mobileWidth, setMobileWidth] = useState(398);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWidth(containerRef.current?.clientWidth || 0);
    setMobileWidth(containerRef.current?.clientWidth || 0);

    const handleResize = () => {
      setWidth(containerRef.current?.clientWidth || 0);
      setMobileWidth(containerRef.current?.clientWidth || 0);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [containerRef]);

  return (
    <>
      <div
        className={cn(
          "text-black-400 flex h-[22px] w-full justify-between",
          className
        )}
        ref={containerRef}
      >
        {Array.from({ length: width / 20 }).map((_, i) => (
          <span key={i} className="inline max-sm:hidden">
            ·
          </span>
        ))}

        {Array.from({ length: mobileWidth / 20 }).map((_, i) => (
          <span key={i} className="hidden max-sm:inline">
            ·
          </span>
        ))}
      </div>
    </>
  );
}
