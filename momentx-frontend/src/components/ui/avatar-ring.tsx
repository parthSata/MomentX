import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface AvatarRingProps {
  src: string
  alt?: string
  size?: "sm" | "md" | "lg" | "xl"
  hasStory?: boolean
  isViewed?: boolean
  isOnline?: boolean
  className?: string
  onClick?: () => void
}

const sizeClasses = {
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-20 h-20",
  xl: "w-32 h-32",
}

const ringSizeClasses = {
  sm: "p-0.5",
  md: "p-0.5",
  lg: "p-1",
  xl: "p-1",
}

const onlineSizeClasses = {
  sm: "w-2.5 h-2.5 border",
  md: "w-3 h-3 border-2",
  lg: "w-4 h-4 border-2",
  xl: "w-5 h-5 border-2",
}

export function AvatarRing({
  src,
  alt = "Avatar",
  size = "md",
  hasStory = false,
  isViewed = false,
  isOnline = false, 
  className,
  onClick,
}: AvatarRingProps) {
  // Use user-provided image or default image
  const avatarSrc = src && src !== "/default-avatar.png" ? src : "/image.png"
  const Wrapper = onClick ? motion.button : motion.div

  return (
    <Wrapper
      className={cn(
        "relative shrink-0",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.05 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
    >
      <div
        className={cn(
          "rounded-full",
          ringSizeClasses[size],
          hasStory && !isViewed && "bg-gradient-primary animate-gradient",
          hasStory && isViewed && "bg-muted",
          !hasStory && "bg-transparent"
        )}
      >
        <div className={cn("rounded-full bg-background", ringSizeClasses[size])}>
          <img
            src={avatarSrc}
            alt={alt}
            className={cn(
              "rounded-full object-cover",
              sizeClasses[size]
            )}
          />
        </div>
      </div>

      {isOnline && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full bg-green-500 border-background",
            onlineSizeClasses[size]
          )}
        />
      )}
    </Wrapper>
  )
}
