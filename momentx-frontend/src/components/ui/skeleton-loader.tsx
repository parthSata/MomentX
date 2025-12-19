import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("skeleton-shimmer rounded-lg bg-muted", className)} />
  )
}

export function PostSkeleton() {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="p-4 flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="w-full aspect-square" />
      <div className="p-4 space-y-3">
        <div className="flex gap-4">
          <Skeleton className="w-6 h-6" />
          <Skeleton className="w-6 h-6" />
          <Skeleton className="w-6 h-6" />
        </div>
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}

export function StorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Skeleton className="w-16 h-16 rounded-full" />
      <Skeleton className="w-14 h-3" />
    </div>
  )
}

export function ChatSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4">
      <Skeleton className="w-14 h-14 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="w-8 h-3" />
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6 p-6">
        <Skeleton className="w-24 h-24 rounded-full" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="flex gap-6">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {[...Array(9)].map((_, i) => (
          <Skeleton key={i} className="aspect-square" />
        ))}
      </div>
    </div>
  )
}
