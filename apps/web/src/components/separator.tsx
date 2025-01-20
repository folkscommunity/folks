"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export function Separator({ className }: { className?: string }) {
  const [width, setWidth] = useState(750);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWidth(containerRef.current?.clientWidth || 0);

    const handleResize = () => {
      setWidth(containerRef.current?.clientWidth || 0);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [containerRef]);

  return (
    <div
      className={cn(
        "text-black-400 flex h-[22px] w-full justify-between",
        className
      )}
      ref={containerRef}
    >
      {Array.from({ length: width / 20 }).map((_, i) => (
        <span key={i}>·</span>
      ))}
    </div>
  );
}
