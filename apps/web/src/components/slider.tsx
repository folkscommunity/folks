"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-black/20 dark:bg-white/20">
      <SliderPrimitive.Range className="absolute h-full bg-black dark:bg-white" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="bg-black-200 border-black-300 block h-4 w-4 rounded-full border shadow transition-colors focus-visible:border-blue-500 focus-visible:bg-blue-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 dark:bg-white" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
