import { motion } from "framer-motion"
import { BackButton } from "./BackButton"

interface PageHeaderProps {
  title: string
  showBack?: boolean
  backTo?: string
  rightContent?: React.ReactNode
}

export function PageHeader({ title, showBack = true, backTo, rightContent }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 glass-strong p-4"
    >
      <div className="flex items-center gap-3">
        {showBack && <BackButton to={backTo} />}
        <h1 className="text-xl font-display font-bold gradient-text flex-1">{title}</h1>
        {rightContent}
      </div>
    </motion.div>
  )
}
