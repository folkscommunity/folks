"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function Photo() {
  const [showing, setShowing] = useState(false);

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      setShowing(false);
    }
  }

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      <Image
        src="/images/goodnews-stickers.png"
        alt="Stickers"
        width={30}
        height={25.52}
        className="inline rotate-[-10deg] cursor-pointer transition-transform hover:rotate-0"
        onClick={() => setShowing(!showing)}
      />

      <div
        className="pointer-events-none fixed left-0 top-0 z-[9999] flex h-screen w-screen flex-col items-center justify-center gap-2 bg-black/50 p-4 opacity-0 backdrop-blur-sm transition-opacity duration-300"
        style={{
          opacity: showing ? 1 : 0,
          pointerEvents: showing ? "auto" : "none"
        }}
        onClick={() => setShowing(false)}
      >
        <div className="max-h-[70dvh] max-w-[70dvw]">
          <Image
            src="/images/goodnews-stickers.png"
            alt="Stickers"
            width={1200}
            height={820}
          />
        </div>
      </div>
    </>
  );
}
