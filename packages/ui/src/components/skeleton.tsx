import { cn } from "./utils"

export interface SkeletonProps extends React.ComponentProps<"div"> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

// Text skeleton
function SkeletonText({ 
  className, 
  lines = 3,
  ...props 
}: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            "h-4", 
            i === lines - 1 && "w-3/4"
          )} 
        />
      ))}
    </div>
  )
}

// Card skeleton
function SkeletonCard({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("rounded-lg border p-4 space-y-3", className)} {...props}>
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  )
}

// Table skeleton
function SkeletonTable({ 
  className, 
  rows = 5,
  columns = 4,
  ...props 
}: SkeletonProps & { rows?: number; columns?: number }) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {/* Header */}
      <div className="flex gap-4 border-b pb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

// Avatar skeleton
function SkeletonAvatar({ className, size = "md", ...props }: SkeletonProps & { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  }
  
  return (
    <Skeleton 
      className={cn("rounded-full", sizeClasses[size], className)} 
      {...props} 
    />
  )
}

// Image skeleton
function SkeletonImage({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton 
      className={cn("aspect-video w-full rounded-lg", className)} 
      {...props} 
    />
  )
}

export { 
  Skeleton, 
  SkeletonText, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonAvatar, 
  SkeletonImage 
}
