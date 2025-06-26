import React, { useState, useEffect } from "react"
import { Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate, useSearchParams } from "react-router-dom"
import LoadMoreButton from "@/components/ui/load-more-button"

interface VideoType {
  id: string
  title: string
  channelTitle: string
  thumbnail: string
  duration: string
  publishedAt: string
  keyword: string
}

interface VideoDetailProps {
  id: string
}

function VideoDetail({ id }: VideoDetailProps) {
  const [relatedVideos, setRelatedVideos] = useState<VideoType[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")
  const [currentCategory, setCurrentCategory] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(8)
  const [totalVideos, setTotalVideos] = useState(0)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    // Get category from URL params or try to determine from the video
    const categoryFromUrl = searchParams.get('category')
    if (categoryFromUrl) {
      setCurrentCategory(categoryFromUrl)
      loadRelatedVideosFromCategory(categoryFromUrl)
    } else {
      // If no category in URL, try to determine it from the video
      determineVideoCategory()
    }
  }, [id, searchParams])

  const determineVideoCategory = async () => {
    try {
      // Try to find which category this video belongs to by checking all categories
      const categoriesResponse = await fetch('/api/categories')
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        const categories = categoriesData.categories
        
        // For now, we'll use the first category as fallback
        // In a real implementation, you might want to analyze the video title/description
        // or store category information when videos are first loaded
        if (categories.length > 0) {
          const fallbackCategory = categories[0].id
          setCurrentCategory(fallbackCategory)
          loadRelatedVideosFromCategory(fallbackCategory)
        } else {
          setError('No categories available')
          setLoading(false)
        }
      }
    } catch (error) {
      setError('Failed to determine video category')
      setLoading(false)
    }
  }

  const loadRelatedVideosFromCategory = async (categoryId: string, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true)
    } else {
      setLoading(true)
      setVisibleCount(8) // Reset visible count when loading new category
    }
    
    try {
      const response = await fetch(`/api/search/category/${categoryId}?maxResults=50`)
      const data = await response.json()
      if (response.ok) {
        // Filter out the current video and get related videos from the same category
        const filteredVideos = data.videos.filter((video: VideoType) => video.id !== id)
        setTotalVideos(filteredVideos.length)
        
        if (isLoadMore) {
          // For load more, we don't need to change the existing videos
          // The visibleCount will control how many are shown
        } else {
          setRelatedVideos(filteredVideos)
        }
      } else {
        setError('Failed to load related videos')
      }
    } catch (error) {
      setError('Error loading related videos')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 8, totalVideos))
  }

  const formatDuration = (duration: string) => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 'Unknown'
    const hours = parseInt(match[1] || '0')
    const minutes = parseInt(match[2] || '0')
    const seconds = parseInt(match[3] || '0')
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays === 1) return "1 day ago"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  const handleRelatedVideoClick = (videoId: string) => {
    // Navigate to the video detail page with the same category
    if (currentCategory) {
      navigate(`/video/${videoId}?category=${currentCategory}`)
    } else {
      navigate(`/video/${videoId}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Search
            </Button>
            {currentCategory && (
              <span className="text-sm text-gray-500">
                Category: {currentCategory}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Main Video Section - 70% width */}
          <div className="w-[70%]">
            <div className="bg-black rounded-lg overflow-hidden">
              <iframe
                width="100%"
                height="500"
                src={`https://www.youtube.com/embed/${id}`}
                title="YouTube video player"
                frameBorder="0"
                allowFullScreen
                className="w-full"
              />
            </div>
            
            {/* Video Info */}
            <div className="mt-4 bg-white rounded-lg p-4">
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Sample Video Title
              </h1>
              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <span>Sample Channel</span>
                <span>1M views • 2 days ago</span>
              </div>
              <div className="border-t pt-4">
                <p className="text-gray-700">
                  This is a sample video description. In a real implementation, 
                  you would fetch the actual video details from the YouTube API.
                </p>
              </div>
            </div>
          </div>

          {/* Related Videos Section - 30% width */}
          <div className="w-[30%]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Related Videos {currentCategory && `(${currentCategory})`}
            </h3>
            
            {loading && (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 h-20 rounded-lg mb-2"></div>
                    <div className="bg-gray-200 h-4 rounded w-3/4 mb-1"></div>
                    <div className="bg-gray-200 h-3 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="text-red-600 text-sm">
                {error}
              </div>
            )}

            {!loading && relatedVideos.length > 0 && (
              <>
                <div className="space-y-3">
                  {relatedVideos.slice(0, visibleCount).map((video) => (
                    <div
                      key={video.id}
                      className="flex gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors"
                      onClick={() => handleRelatedVideoClick(video.id)}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={video.thumbnail || "/placeholder.svg"}
                          alt={video.title}
                          className="w-32 h-20 object-cover rounded-lg"
                        />
                        <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 py-0.5 rounded">
                          {formatDuration(video.duration)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2 text-gray-900 mb-1">
                          {video.title}
                        </h4>
                        <p className="text-gray-600 text-xs mb-1">{video.channelTitle}</p>
                        <p className="text-gray-500 text-xs">{formatDate(video.publishedAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <LoadMoreButton
                  onClick={handleLoadMore}
                  isLoading={loadingMore}
                  hasMore={visibleCount < totalVideos}
                  className="mt-4"
                  size="sm"
                />
              </>
            )}

            {!loading && relatedVideos.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Video className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No related videos found in this category</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoDetail; 