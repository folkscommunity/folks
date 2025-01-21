"use client";

/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
import { SVGProps, useEffect, useState } from "react";

export function StickersComing() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show) {
      setTimeout(() => {
        setShow(false);
      }, 2500);
    }
  }, [show]);

  useEffect(() => {
    window.addEventListener("stickers-coming", () => {
      setShow(true);
    });

    return () => {
      window.removeEventListener("stickers-coming", () => {
        setShow(false);
      });
    };
  }, []);

  return show ? (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-[99999] flex h-[100vh] w-full flex-col items-center justify-center">
      <div className="stickers-coming flex items-center justify-center">
        <img
          src="/images/stickers/hue-sticker-bg.png"
          className="animate-new-spin h-[50vh] w-[50vh]"
        />
      </div>
    </div>
  ) : null;
}
