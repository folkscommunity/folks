"use client";

import { RefObject, useEffect, useState } from "react";
import { toast } from "sonner";

import { Label } from "@/components/label";
import { Slider } from "@/components/slider";
import { cn, optimizedImageUrl } from "@/lib/utils";

import { OImage } from "../image";

enum StickerSide {
  Left = "left",
  Right = "right"
}

// Get current sticker size based on viewport
function getStickerSize() {
  if (typeof window === "undefined") return 100;

  const width = window.innerWidth;

  // Very small screens (< 480px): 50px
  if (width < 480) return 50;
  // Small screens (< 1024px): 70px
  if (width < 1024) return 70;
  // Desktop: 100px
  return 100;
}

export function StickerController({
  postContainerRef,
  post,
  replies,
  user
}: {
  postContainerRef: RefObject<HTMLDivElement | null>;
  post: any;
  replies: any[];
  user?: any;
}) {
  const [availableHeight, setAvailableHeight] = useState(0);
  const [postContainerLeftOffset, setPostContainerLeftOffset] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [stickers, setStickers] = useState<any[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);

  function fetchStickers() {
    fetch(`/api/stickers/${post.id}`, {
      method: "GET"
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setStickers(res.stickers);
        }
      })
      .catch((err) => {});
  }

  function calculateSideOffset(
    side: StickerSide,
    containerX: number,
    percentage: number
  ) {
    const availableWidth = containerX;
    const stickerSize = getStickerSize();
    const maxAllowedOverflow = 20; // Max overflow in any direction

    // Natural positioning
    const naturalOffset = (availableWidth - stickerSize) * (percentage / 100);

    // Clamp left edge to prevent too much left overflow
    let sideOffset = Math.max(-maxAllowedOverflow, naturalOffset);

    // Also clamp right edge to prevent too much right overflow
    const rightEdge = sideOffset + stickerSize;
    const maxRightEdge = availableWidth + maxAllowedOverflow;
    if (rightEdge > maxRightEdge) {
      sideOffset = maxRightEdge - stickerSize;
    }

    if (side === StickerSide.Left) {
      return sideOffset;
    } else {
      return sideOffset;
    }
  }

  function calculateTopOffset(containerY: number, offsetY: number) {
    const clampedOffsetY = Math.max(100, Math.min(containerY, offsetY));

    return clampedOffsetY;
  }

  function handleResize() {
    if (postContainerRef.current) {
      setPostContainerLeftOffset(
        postContainerRef.current.getBoundingClientRect().left
      );

      setContainerWidth(postContainerRef.current.getBoundingClientRect().width);
    }

    const body = document.body;
    const html = document.documentElement;

    const height = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight
    );

    setAvailableHeight(height - 400);
  }

  function handleEvent(e: any) {
    setEditorOpen(true);
  }

  useEffect(() => {
    handleResize();
    fetchStickers();

    const resizeHandler = () => handleResize();
    const eventHandler = (e: Event) => handleEvent(e);

    window.addEventListener("resize", resizeHandler);
    window.addEventListener("stickers.open_editor", eventHandler);

    return () => {
      window.removeEventListener("resize", resizeHandler);
      window.removeEventListener("stickers.open_editor", eventHandler);
    };
  }, []);

  useEffect(() => {
    handleResize();
  }, [post, replies]);

  return (
    <div
      className="fadein absolute left-0 top-0 z-[50] w-full select-none opacity-100 transition-opacity max-sm:opacity-100"
      style={{
        height: availableHeight + 400,
        pointerEvents: "none"
      }}
    >
      {user && editorOpen && (
        <StickerEditor
          availableHeight={availableHeight}
          postContainerRef={postContainerRef}
          onClose={() => {
            fetchStickers();
            setEditorOpen(false);
          }}
          stickers={stickers}
          post={post}
          replies={replies}
          containerWidth={containerWidth}
          postContainerLeftOffset={postContainerLeftOffset}
          user_stickers={
            stickers &&
            stickers.filter(
              (sticker: any) =>
                sticker.posted_by_id.toString() === user.id.toString()
            )
          }
        />
      )}

      {stickers &&
        stickers.map((sticker: any) => (
          <Sticker
            key={sticker.id}
            image={sticker.available_sticker.url}
            side={sticker.side}
            topOffset={calculateTopOffset(availableHeight, sticker.y)}
            sideOffset={calculateSideOffset(
              sticker.side,
              postContainerLeftOffset,
              sticker.x
            )}
            angle={sticker.angle}
            posted_by={sticker.posted_by}
          />
        ))}
    </div>
  );
}

function StickerEditor({
  availableHeight,
  containerWidth,
  postContainerLeftOffset,
  post,
  replies,
  postContainerRef,
  stickers,
  user_stickers,
  onClose
}: {
  availableHeight: number;
  containerWidth: number;
  postContainerLeftOffset: number;
  post: any;
  replies: any[];
  postContainerRef: RefObject<HTMLDivElement | null>;
  stickers: any[];
  user_stickers?: any[];
  onClose: any;
}) {
  const [topOffset, setTopOffset] = useState(0);
  const [sideOffset, setSideOffset] = useState(0);
  const [angle, setAngle] = useState(0);
  const [side, setSide] = useState<StickerSide | undefined>(undefined);
  const [selectedSticker, setSelectedSticker] = useState<any | undefined>(
    undefined
  );

  const [mouseY, setMouseY] = useState(0);
  const [mouseX, setMouseX] = useState(0);

  const [mouseSide, setMouseSide] = useState<StickerSide | false>(false);

  const [mousePercentX, setMousePercentX] = useState(0);

  const [currentScrollY, setCurrentScrollY] = useState(0);

  const [showBoundry, setShowBoundry] = useState(false);
  const [mouseHasMoved, setMouseHasMoved] = useState(false);

  const [availableStickers, setAvailableStickers] = useState<any[]>([]);

  const [stickerPlaced, setStickerPlaced] = useState(false);

  function handleMouseMove(e: any) {
    setMouseHasMoved(true);

    setMouseX(e.clientX);
    setMouseY(e.clientY - 50 + currentScrollY);

    const isLeft = e.clientX < postContainerLeftOffset;
    const isRight = e.clientX > postContainerLeftOffset + containerWidth;
    const mouseSide = isLeft
      ? StickerSide.Left
      : isRight
        ? StickerSide.Right
        : false;

    setMouseSide(mouseSide);

    if (
      !mouseSide ||
      e.clientY < 130 ||
      availableHeight < e.clientY - 70 + currentScrollY
    ) {
      setShowBoundry(true);
    } else {
      setShowBoundry(false);
    }

    if (mouseSide) {
      if (mouseSide === StickerSide.Left) {
        const percentage = e.clientX / postContainerLeftOffset;

        setMousePercentX(percentage * 100);
      } else if (mouseSide === StickerSide.Right) {
        const percentage =
          1 -
          (e.clientX - containerWidth - postContainerLeftOffset) /
            postContainerLeftOffset;

        setMousePercentX(percentage * 100);
      }
    }
  }

  function handleMouseDown(e: any) {
    if (mouseSide && !showBoundry && selectedSticker) {
      setTopOffset(mouseY);
      setSideOffset(mousePercentX);
      setSide(mouseSide);
      setStickerPlaced(true);
      placeSticker(mousePercentX, mouseY, angle, mouseSide, selectedSticker.id);
    }
  }

  useEffect(() => {
    const mouseDownHandler = (e: MouseEvent) => handleMouseDown(e);

    window.addEventListener("mousedown", mouseDownHandler);

    return () => {
      window.removeEventListener("mousedown", mouseDownHandler);
    };
  }, [
    mouseX,
    mouseY,
    mouseSide,
    mousePercentX,
    showBoundry,
    selectedSticker,
    angle
  ]);

  useEffect(() => {
    const mouseMoveHandler = (e: MouseEvent) => handleMouseMove(e);

    window.addEventListener("mousemove", mouseMoveHandler);

    return () => {
      window.removeEventListener("mousemove", mouseMoveHandler);
    };
  }, [
    postContainerLeftOffset,
    containerWidth,
    availableHeight,
    currentScrollY
  ]);

  function handleScroll() {
    setCurrentScrollY(window.scrollY);
  }

  function calculateSideOffset(
    side: StickerSide,
    containerX: number,
    percentage: number
  ) {
    const availableWidth = containerX;
    const stickerSize = getStickerSize();
    const padding = 10; // Account for the 5px padding on each side
    const allowedOverflow = 5; // Allow 5px overflow outside viewport
    const totalStickerWidth = stickerSize + padding - allowedOverflow;

    // Allow stickers to overflow slightly for better positioning
    const effectiveWidth = Math.max(
      totalStickerWidth,
      availableWidth + allowedOverflow
    );
    const maxOffset = effectiveWidth - totalStickerWidth;

    const sideOffset = Math.max(
      -allowedOverflow,
      Math.min(maxOffset, maxOffset * (percentage / 100))
    );

    if (side === StickerSide.Left) {
      return sideOffset;
    } else {
      return sideOffset;
    }
  }

  function calculateTopOffset(containerY: number, offsetY: number) {
    const clampedOffsetY = Math.max(100, Math.min(containerY, offsetY));

    return clampedOffsetY;
  }

  function placeSticker(
    x: number,
    y: number,
    angle: number,
    side: string,
    sticker_id: string
  ) {
    fetch(`/api/stickers`, {
      method: "POST",
      body: JSON.stringify({
        post_id: post.id,
        sticker_id: sticker_id,
        side: side,
        x: x,
        y: y,
        angle: angle
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          toast.success("Sticker placed! Reopen to place more.");
          onClose();
        } else if (res.error === "sticker_limit_reached") {
          toast.error(
            res.msg || "You can only place up to 10 stickers per post."
          );
        } else {
          toast.error("Failed to place sticker. Please try again.");
        }
      })
      .catch((err) => {
        toast.error("Failed to place sticker. Please try again.");
      });
  }

  function handleKeyDown(e: any) {
    if (e.key === "Escape") {
      onClose();
    }
  }

  useEffect(() => {
    handleScroll();
    fetchAvailableStickers();

    const scrollHandler = () => handleScroll();
    const keyDownHandler = (e: KeyboardEvent) => handleKeyDown(e);

    window.addEventListener("scroll", scrollHandler);
    window.addEventListener("keydown", keyDownHandler);

    return () => {
      window.removeEventListener("scroll", scrollHandler);
      window.removeEventListener("keydown", keyDownHandler);
    };
  }, [onClose]);

  function fetchAvailableStickers() {
    fetch(`/api/stickers/list`)
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setAvailableStickers(res.stickers);
        }
      })
      .catch((err) => {});
  }

  function deleteSticker(id: string) {
    fetch(`/api/stickers/${id}`, {
      method: "DELETE"
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          toast.success("Sticker has been deleted!");
          onClose();
        }
      })
      .catch((err) => {});
  }

  return (
    <div
      style={{
        height: availableHeight + 400,
        cursor: selectedSticker
          ? `url("${optimizedImageUrl(selectedSticker.url, 80, 80)}") 40 40,
    auto`
          : "auto"
      }}
      className="pointer-events-auto absolute z-[99999] w-full bg-black/50 transition-opacity"
    >
      <div
        className="absolute z-[99999] opacity-20 transition-opacity"
        style={{
          cursor: "default",
          top: "130px",
          left: postContainerLeftOffset - 10,
          width: containerWidth + 20,
          height: availableHeight - 40,
          opacity: 0.25,
          borderLeft: "1px solid red",
          borderRight: "1px solid red",
          background: `repeating-linear-gradient(45deg, rgba(255,0,0,0.2), rgba(255,0,0,0.2) 10px, red 10px, red 11px)`
        }}
      />

      <div
        className="absolute z-[99999] opacity-20 transition-opacity"
        style={{
          cursor: "default",
          top: 0,
          left: 0,
          width: "100%",
          height: "130px",
          opacity: 0.25,
          background: `repeating-linear-gradient(45deg, rgba(255,0,0,0.2), rgba(255,0,0,0.2) 10px, red 10px, red 11px)`,
          borderTop: "1px solid red",
          borderBottom: "1px solid red"
        }}
      />

      <div
        className="absolute z-[99999] opacity-20 transition-opacity"
        style={{
          cursor: "default",
          top: availableHeight + 90,
          left: 0,
          width: "100%",
          height: "310px",
          opacity: 0.25,
          background: `repeating-linear-gradient(45deg, rgba(255,0,0,0.2), rgba(255,0,0,0.2) 10px, red 10px, red 11px)`,
          borderTop: "1px solid red"
        }}
      />

      <div className="pointer-events-none absolute z-[99999] flex h-[100dvh] w-full flex-col items-center justify-center p-[70px]">
        <div
          className="dark:bg-black-800/90 fadein pointer-events-auto flex h-[600px] w-full max-w-3xl flex-col gap-2 rounded-md border border-neutral-300 border-white/20 bg-white px-4 pb-2 pt-5 backdrop-blur-md dark:border-slate-900/80"
          style={{
            cursor: "default"
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1" />
            <div className="flex min-w-fit flex-1 flex-col items-center justify-center">
              <h2>Place stickers!</h2>
              <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
                {user_stickers?.length || 0}/10 stickers placed
              </p>
            </div>
            <div className="flex flex-1 justify-end">
              <button onClick={() => onClose()}>[x]</button>
            </div>
          </div>

          <p className="m-0 pt-2">
            Select the angle and sticker first, then click anywhere on the page
            outside of the red box to place the sticker.
          </p>

          <div className="pb-2 font-bold">Available Stickers:</div>

          <div className="flex-1 overflow-y-scroll">
            <div className="grid grid-flow-dense auto-rows-min grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
              {availableStickers &&
                availableStickers.map((sticker: any, i: number) => (
                  <div
                    key={i}
                    className={cn(
                      "flex cursor-pointer flex-col items-center opacity-70 transition-all hover:scale-110 hover:opacity-100",
                      selectedSticker?.id === sticker.id && "opacity-100"
                    )}
                    onClick={() => {
                      setSelectedSticker(sticker);
                    }}
                  >
                    <OImage
                      src={sticker.url}
                      className="fadein size-[120px]"
                      height={120}
                      width={120}
                      style={{
                        transform: `rotate(${angle}deg)`
                      }}
                    />
                    <div className="text-center text-sm">{sticker.name}</div>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-4 pb-1">
              <div>
                <Label htmlFor="sticker-angle"> Angle</Label>
              </div>
              <Slider
                id="sticker-angle"
                className="max-w-[280px]"
                min={-20}
                max={20}
                step={1}
                value={[angle]}
                onValueChange={(value) => setAngle(value[0])}
              />
            </div>

            {user_stickers && user_stickers.length > 0 && (
              <div className="border-t border-neutral-300 pt-3 dark:border-slate-900/80">
                <div className="pb-2 font-bold">Your Stickers:</div>
                <div className="flex max-h-[120px] flex-wrap gap-2 overflow-y-auto">
                  {user_stickers.map((sticker: any) => (
                    <div
                      key={sticker.id}
                      className="group relative flex items-center gap-2 rounded border border-neutral-300 bg-neutral-100 px-3 py-2 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <OImage
                        src={sticker.available_sticker.url}
                        className="size-8"
                        height={32}
                        width={32}
                      />
                      <span className="text-sm">
                        {sticker.available_sticker.name}
                      </span>
                      <button
                        onClick={() => {
                          deleteSticker(sticker.id);
                        }}
                        className="ml-2 text-red-500 hover:underline"
                        title="Delete this sticker"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {stickerPlaced && selectedSticker && side && (
        <Sticker
          className="z-[999999]"
          image={selectedSticker.url}
          side={side}
          topOffset={calculateTopOffset(availableHeight, topOffset)}
          sideOffset={calculateSideOffset(
            side,
            postContainerLeftOffset,
            sideOffset
          )}
          angle={angle}
        />
      )}
    </div>
  );
}

function Sticker({
  image,
  side,
  className,
  topOffset,
  sideOffset,
  angle,
  posted_by
}: {
  image: string;
  side: StickerSide;
  topOffset: number;
  sideOffset: number;
  className?: string;
  angle: number;
  posted_by?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
}) {
  const clampedAngle = Math.max(-20, Math.min(20, angle));
  const [imageLoaded, setImageLoaded] = useState(false);
  const [stickerSize, setStickerSize] = useState(getStickerSize());

  useEffect(() => {
    const handleResize = () => {
      setStickerSize(getStickerSize());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={cn(
        "pointer-events-auto absolute select-none p-[5px]",
        className
      )}
      draggable={false}
      style={{
        top: topOffset,
        transform: `rotate(${clampedAngle}deg)`,
        ...(side === StickerSide.Left && {
          left: sideOffset
        }),
        ...(side === StickerSide.Right && {
          right: sideOffset
        })
      }}
      title={posted_by ? `@${posted_by.username}'s sticker` : undefined}
    >
      <OImage
        src={image}
        width={120}
        height={120}
        className="select-none transition-all duration-[50ms]"
        style={{
          opacity: imageLoaded ? 1 : 0,
          width: stickerSize,
          height: stickerSize
        }}
        draggable={false}
        onLoad={() => setImageLoaded(true)}
      />
    </div>
  );
}
