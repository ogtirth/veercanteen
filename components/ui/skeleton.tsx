import React from "react";

export function Skeleton({ className = "", style = {}, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={
        "animate-pulse rounded-md bg-muted/40 dark:bg-muted/20 " + className
      }
      style={{ minHeight: 16, ...style }}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className = "", ...props }: { lines?: number } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 w-full mb-2 last:mb-0 rounded bg-muted/40 dark:bg-muted/20 animate-pulse"
          style={{ width: `${80 - i * 10}%` }}
        />
      ))}
    </div>
  );
}
