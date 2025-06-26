"use client"

import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { useParams } from "react-router-dom"
import YouTubeClone from "./components/YouTubeClone"
import VideoDetail from "./components/VideoDetail"

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