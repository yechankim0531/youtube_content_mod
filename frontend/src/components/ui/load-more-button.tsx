import React from "react"
import { Button } from "@/components/ui/button"

interface LoadMoreButtonProps {
  onClick: () => void
  isLoading?: boolean
  hasMore: boolean
  className?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  children?: React.ReactNode
}

function LoadMoreButton({
  onClick,
  isLoading = false,
  hasMore,
  className = "",
  variant = "outline",
  size = "default",
  children = "Load More"
}: LoadMoreButtonProps) {
  if (!hasMore) return null

  return (
    <div className="flex justify-center mt-4">
      <Button
        onClick={onClick}
        variant={variant}
        size={size}
        disabled={isLoading}
        className={`flex items-center justify-center border-2 border-gray-400 rounded-full px-6 py-2 text-base font-semibold hover:border-blue-500 hover:text-blue-600 transition-all shadow-md ${className}`}
        style={{ outline: 'none' }}
      >
        {isLoading ? (
          <>
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
            Loading...
          </>
        ) : (
          children
        )}
      </Button>
    </div>
  )
}

export default LoadMoreButton 