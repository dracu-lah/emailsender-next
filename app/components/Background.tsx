import { cn } from "@/lib/utils";
import React, { PropsWithChildren } from "react";

export function Background({ children }: PropsWithChildren) {
  return (
    <div className="relative  min-h-screen  w-full  bg-background">
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:20px_20px]",
          "[background-image:radial-gradient(#d4d4d4_1px,transparent_1px)]",
          "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]",
        )}
      />
      {/* Radial gradient for the container to give a faded look */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] "></div>
      <main className="relative">{children}</main>
    </div>
  );
}
