import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface BackButtonProps {
  to?: string
  className?: string
}

export function BackButton({ to, className = "" }: BackButtonProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (to) {
      navigate(to)
    } else {
      navigate(-1)
    }
  }

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      className={`p-2 glass rounded-full hover:bg-primary/20 transition-colors ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft className="w-5 h-5" />
    </motion.button>
  )
}
