"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { useLocalStorage } from "@uidotdev/usehooks";

import { cn } from "@/lib/utils";

import { WindowContext } from "./window-context";

function Marquee(props: {
  className?: string;
  content: string;
  direction?: "normal" | "reverse";
  user?: any;
}) {
  const { windowIsActive } = useContext(WindowContext);
  const marqueeRef = useRef<HTMLDivElement>(null);

  const [stopScrolling, setStopScrolling] = useLocalStorage(
    "ribbon_stop_scroll",
    false
  );

  const [ribbonSpeed, setRibbonSpeed] = useLocalStorage("ribbon_speed", 5);

  return (
    <div
      className={cn("marquee-container fadein", props.className)}
      ref={marqueeRef}
      onClick={() => {
        if (props.user) {
          window.dispatchEvent(new Event("ribbon_create_open"));
        }
      }}
      style={
        {
          "--pause-on-hover": "paused",
          "--pause-on-click": "running",
          height: "40px",
          paddingLeft: stopScrolling ? "1.5ch" : "0px",
          cursor: props.user ? "pointer" : "default"
        } as any
      }
    >
      <div
        className="marquee select-none pr-[1ch]"
        style={
          {
            "--play": stopScrolling || !windowIsActive ? "paused" : "playing",
            "--direction": props.direction || "normal",
            "--duration": `${props.content.length / ribbonSpeed}s`,
            "--delay": "0s",
            "--iteration-count": "infinite"
          } as any
        }
      >
        {props.content}
      </div>
      <div
        className="marquee select-none pr-[1ch]"
        style={
          {
            "--play": stopScrolling || !windowIsActive ? "paused" : "playing",
            "--direction": props.direction || "normal",
            "--duration": `${props.content.length / ribbonSpeed}s`,
            "--delay": "0s",
            "--iteration-count": "infinite"
          } as any
        }
      >
        {props.content}
      </div>
    </div>
  );
}

export function HorizonalRibbon({
  fixed,
  top,
  ribbonString,
  user
}: {
  fixed?: boolean;
  top?: boolean;
  ribbonString?: string;
  user?: any;
}) {
  const [clientRibbonString, setClientRibbonString] = useState(ribbonString);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  function updateRibbon() {
    fetch("/api/ribbon")
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setClientRibbonString(res.ribbon);
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
        "dark:border-black-700 left-0 top-0 z-[99] flex h-8 w-full cursor-default items-center justify-center border-[#00050C] bg-black text-[14px] font-medium text-slate-300",
        fixed && "fixed",
        top ? "border-b" : "border-t",
        !top && "max-sm:hidden"
      )}
    >
      {isClient && (clientRibbonString || ribbonString) && (
        <Marquee
          content={clientRibbonString || ribbonString || ""}
          user={user}
        />
      )}
    </div>
  );
}
