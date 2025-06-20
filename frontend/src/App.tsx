"use client"

import React, { useState, useEffect } from "react"
import { Search, Menu, Video, Plus, Edit, Trash2, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom"
import { useParams } from "react-router-dom"

interface VideoType {
  id: string
  title: string
  channelTitle: string
  thumbnail: string
  duration: string
  publishedAt: string
  keyword: string
}

interface Category {
  id: string
  title: string
  keywords: string[]
  color: string
}

const PAGE_SIZE = 16
const API_MAX = 50

function VideoDetail({ id }: { id: string }) {
  return (
    <div className="flex justify-center items-center h-screen bg-black">
      <iframe
        width="800"
        height="450"
        src={`https://www.youtube.com/embed/${id}`}
        title="YouTube video player"
        frameBorder="0"
        allowFullScreen
      ></iframe>
    </div>
  )
}

function YouTubeClone() {
  const [searchQuery, setSearchQuery] = useState("")
  const [videos, setVideos] = useState<VideoType[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategory, setNewCategory] = useState({
    title: "",
    keywords: "",
    color: "#ff0000",
  })
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [lastQuery, setLastQuery] = useState<{ type: "search" | "category"; value: string }>({ type: "search", value: "" })
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
      } else {
        console.error('Failed to load categories')
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setLoading(true)
    setError("")
    setActiveCategory(null)
    setVisibleCount(PAGE_SIZE)
    setLastQuery({ type: "search", value: searchQuery })
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&maxResults=${API_MAX}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to search videos')
      }
      setVideos(data.videos)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const loadCategoryVideos = async (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId)
    if (!category) return
    setActiveCategory(categoryId)
    setLoading(true)
    setError("")
    setVisibleCount(PAGE_SIZE)
    setLastQuery({ type: "category", value: categoryId })
    try {
      const response = await fetch(`/api/search/category/${categoryId}?maxResults=${API_MAX}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load category videos')
      }
      setVideos(data.videos)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const keywords = newCategory.keywords
      .split("\n")
      .map((k) => k.trim())
      .filter((k) => k.length > 0)
    if (keywords.length === 0) {
      alert('Please enter at least one keyword')
      return
    }
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories'
      const method = editingCategory ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newCategory.title, keywords, color: newCategory.color })
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save category')
      }
      await loadCategories()
      setCategoryModalOpen(false)
      setEditingCategory(null)
      setNewCategory({ title: "", keywords: "", color: "#ff0000" })
      alert(editingCategory ? 'Category updated successfully!' : 'Category created successfully!')
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'An error occurred'}`)
    }
  }

  const deleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return
    try {
      const response = await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete category')
      }
      await loadCategories()
      if (activeCategory === categoryId) {
        setActiveCategory(null)
        setVideos([])
      }
      alert('Category deleted successfully!')
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'An error occurred'}`)
    }
  }

  const editCategory = (category: Category) => {
    setEditingCategory(category)
    setNewCategory({
      title: category.title,
      keywords: category.keywords.join("\n"),
      color: category.color,
    })
    setCategoryModalOpen(true)
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

  // Load more handler
  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, videos.length))
  }

  // If a new search/category is performed, reset visibleCount
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [videos])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                <Play className="h-5 w-5 text-white fill-white" />
              </div>
              <span className="text-xl font-semibold">YouTube</span>
            </div>
          </div>
          <div className="flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="flex">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Search videos by keywords (comma separated)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-l-full rounded-r-none border-r-0 pl-4 h-10 focus-visible:ring-0 focus-visible:ring-offset-0 border-gray-300"
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                className="rounded-r-full rounded-l-none px-6 h-10 border-gray-300 bg-gray-50 hover:bg-gray-100"
                disabled={loading}
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>
          <div className="w-20"></div>
        </div>
      </header>
      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-16 h-full bg-white border-r border-gray-200 transition-transform duration-300 z-40 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} w-64`}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Categories</h2>
              <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white">
                  <DialogHeader>
                    <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCategorySubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Category Title</Label>
                      <Input
                        id="title"
                        value={newCategory.title}
                        onChange={(e) => setNewCategory((prev) => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="keywords">Keywords (one per line)</Label>
                      <Textarea
                        id="keywords"
                        value={newCategory.keywords}
                        onChange={(e) => setNewCategory((prev) => ({ ...prev, keywords: e.target.value }))}
                        placeholder="soccer\nbasketball\ntennis"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="color">Color</Label>
                      <Input
                        id="color"
                        type="color"
                        value={newCategory.color}
                        onChange={(e) => setNewCategory((prev) => ({ ...prev, color: e.target.value }))}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setCategoryModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">{editingCategory ? "Update" : "Create"}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    activeCategory === category.id ? "bg-red-50 border-red-200" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3
                      className="font-medium text-sm"
                      style={{ color: category.color }}
                      onClick={() => loadCategoryVideos(category.id)}
                    >
                      {category.title}
                    </h3>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => editCategory(category)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        onClick={() => deleteCategory(category.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{category.keywords.join(", ")}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2 h-7 text-xs"
                    onClick={() => loadCategoryVideos(category.id)}
                  >
                    Load Videos
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </aside>
        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"}`}>
          <div className="p-6">
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <p className="mt-2 text-gray-600">Loading videos...</p>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}
            {!loading && videos.length === 0 && (
              <div className="text-center py-12">
                <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No videos found. Try searching or select a category.</p>
              </div>
            )}
            {!loading && videos.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {videos.slice(0, visibleCount).map((video) => (
                    <Card
                      key={video.id}
                      className="border-0 shadow-none hover:shadow-lg transition-shadow cursor-pointer"
                    >
                      <CardContent className="p-0">
                        <div className="relative">
                          <img
                            src={video.thumbnail || "/placeholder.svg"}
                            alt={video.title}
                            className="w-full h-48 object-cover rounded-lg"
                            onClick={() => navigate(`/video/${video.id}`)}
                          />
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                            {formatDuration(video.duration)}
                          </div>
                        </div>
                        <div className="p-3">
                          <h3
                            className="font-medium text-sm line-clamp-2 mb-2 hover:text-blue-600 cursor-pointer"
                            onClick={() => navigate(`/video/${video.id}`)}
                          >
                            {video.title}
                          </h3>
                          <p className="text-gray-600 text-xs mb-1">{video.channelTitle}</p>
                          <p className="text-gray-500 text-xs">{formatDate(video.publishedAt)}</p>
                          <div className="mt-2">
                            <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                              {video.keyword}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {visibleCount < videos.length && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={handleLoadMore}
                      variant="outline"
                      className="flex items-center justify-center border-2 border-gray-400 rounded-full px-6 py-2 text-base font-semibold hover:border-blue-500 hover:text-blue-600 transition-all shadow-md"
                      style={{ outline: 'none' }}
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}

function VideoDetailWrapper() {
  const { id } = useParams<{ id: string }>()
  if (!id) return <div>Video not found</div>
  return <VideoDetail id={id} />
}

function AppWithRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<YouTubeClone />} />
        <Route path="/video/:id" element={<VideoDetailWrapper />} />
      </Routes>
    </Router>
  )
}

export default AppWithRouter; 