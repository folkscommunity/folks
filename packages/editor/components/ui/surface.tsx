import * as React from "react";
import { forwardRef, HTMLProps } from "react";

import { cn } from "../../lib";

export type SurfaceProps = HTMLProps<HTMLDivElement> & {
  withShadow?: boolean;
  withBorder?: boolean;
};

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
  (
    { children, className, withShadow = true, withBorder = true, ...props },
    ref
  ) => {
    const surfaceClass = cn(
      className,
      "bg-white rounded-lg dark:bg-black-800",
      withShadow ? "shadow-sm" : "",
      withBorder ? "border border-black-200 dark:border-slate-800" : ""
    );

    return (
      <div className={surfaceClass} {...props} ref={ref}>
        {children}
      </div>
    );
  }
);

Surface.displayName = "Surface";
