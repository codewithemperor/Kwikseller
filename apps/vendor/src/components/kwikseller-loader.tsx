"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export function KwiksellerLoader({
  className,
  overlay = false,
}: {
  className?: string;
  overlay?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[45vh] items-center justify-center",
        overlay && "fixed inset-0 z-[120] min-h-screen bg-background/90 backdrop-blur-md",
        className,
      )}
      aria-label="Preparing content"
      role="status"
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl animate-pulse-glow" aria-hidden="true" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-background ring-1 ring-border">
            <Image src="/icon.png" alt="Kwikseller" width={52} height={52} className="h-[52px] w-[52px]" priority />
          </div>
        </div>
        <div className="flex h-4 items-center gap-2" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="h-2 w-2 rounded-full bg-accent vendor-loader-dot"
              style={{ animationDelay: `${index * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
