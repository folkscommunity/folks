"use client";

import { useContext, useEffect, useRef, useState } from "react";
import sanitizeHtml from "sanitize-html";

import { cn } from "@/lib/utils";

import { WindowContext } from "./window-context";

function Marquee(props: {
  className?: string;
  content: string;
  direction?: "normal" | "reverse";
}) {
  const { windowIsActive } = useContext(WindowContext);
  const marqueeRef = useRef<HTMLDivElement>(null);

  const duration = props.content.length * 0.1;

  return (
    <div
      className={cn("marquee-container", props.className)}
      ref={marqueeRef}
      style={
        {
          "--pause-on-hover": "paused",
          "--pause-on-click": "running",
          height: "40px"
        } as any
      }
    >
      <div
        className="marquee"
        style={
          {
            "--play": !windowIsActive ? "paused" : "playing",
            "--direction": props.direction || "normal",
            "--duration": `${duration}s`,
            "--delay": "0s",
            "--iteration-count": "infinite"
          } as any
        }
      >
        {props.content + " " + " "}
      </div>
      <div
        className="marquee"
        style={
          {
            "--play": !windowIsActive ? "paused" : "playing",
            "--direction": props.direction || "normal",
            "--duration": `${duration}s`,
            "--delay": "0s",
            "--iteration-count": "infinite"
          } as any
        }
      >
        {props.content + " " + " "}
      </div>
    </div>
  );
}

export function HorizonalRibbon({
  fixed,
  top
}: {
  fixed?: boolean;
  top?: boolean;
}) {
  const [ribbonString, setRibbonString] = useState("");

  function updateRibbon() {
    fetch("/api/ribbon")
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setRibbonString(res.ribbon);
        }
      })
      .catch((err) => {});
  }

  useEffect(() => {
    updateRibbon();

    window.addEventListener("ribbon_update", updateRibbon);
    return () => {
      window.removeEventListener("ribbon_update", updateRibbon);
    };
  }, []);

  return (
    <div
      className={cn(
        "dark:border-black-700 left-0 top-0 z-[99] flex h-10 w-full cursor-default items-center justify-center border-white bg-black text-[14px] font-medium text-slate-300",
        fixed && "fixed",
        top ? "border-b" : "border-t"
      )}
    >
      <Marquee content={sanitizeHtml(ribbonString)} />
    </div>
  );
}
