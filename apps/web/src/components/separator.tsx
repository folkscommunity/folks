"use client";

import { useEffect, useRef, useState } from "react";

export function Separator() {
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
      className="text-black-400 flex h-[22px] w-full justify-between"
      ref={containerRef}
    >
      {Array.from({ length: width / 30 }).map((_, i) => (
        <span key={i}>·</span>
      ))}
    </div>
  );
}
