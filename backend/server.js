const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// YouTube API configuration
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// In-memory storage for categories and cache
let categories = [
    {
        id: 'sports',
        title: 'Sports',
        keywords: ['baseball', 'golf', 'formula 1', 'tennis'],
        color: '#ff6b6b'
    },
    {
        id: 'music',
        title: 'Music',
        keywords: ['rock', 'jazz', 'classical', 'pop'],
        color: '#4ecdc4'
    },
    {
        id: 'tech',
        title: 'Technology',
        keywords: ['programming', 'ai', 'gadgets', 'software'],
        color: '#45b7d1'
    }
];

// Cache for video results (10 minutes)
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

// API Endpoints only (no static HTML serving)

// Get all categories
app.get('/api/categories', (req, res) => {
    res.json({ categories });
});

// Add new category
app.post('/api/categories', (req, res) => {
    console.log('Received body:', req.body);
    try {
        const { title, keywords, color } = req.body;
        if (!title || !keywords || !Array.isArray(keywords) || keywords.length === 0) {
            return res.status(400).json({ error: 'Title and keywords array are required', received: req.body });
        }
        const id = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        if (categories.find(cat => cat.id === id)) {
            return res.status(400).json({ error: 'Category with this title already exists' });
        }
        const newCategory = {
            id,
            title,
            keywords,
            color: color || '#667eea'
        };
        categories.push(newCategory);
        cache.clear();
        return res.json({ category: newCategory, message: 'Category created successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to create category', details: error.message });
    }
});

// Delete category
app.delete('/api/categories/:id', (req, res) => {
    try {
        const { id } = req.params;
        const categoryIndex = categories.findIndex(cat => cat.id === id);
        if (categoryIndex === -1) {
            return res.status(404).json({ error: 'Category not found' });
        }
        categories.splice(categoryIndex, 1);
        cache.clear();
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

// Update category
app.put('/api/categories/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { title, keywords, color } = req.body;
        const categoryIndex = categories.findIndex(cat => cat.id === id);
        if (categoryIndex === -1) {
            return res.status(404).json({ error: 'Category not found' });
        }
        if (title) categories[categoryIndex].title = title;
        if (keywords && Array.isArray(keywords)) categories[categoryIndex].keywords = keywords;
        if (color) categories[categoryIndex].color = color;
        cache.clear();
        return res.json({ category: categories[categoryIndex], message: 'Category updated successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to update category', details: error.message });
    }
});

// Search videos by category
app.get('/api/search/category/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { maxResults = 50 } = req.query;
        const category = categories.find(cat => cat.id === id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        // Check cache first
        const cacheKey = `category_${id}_${maxResults}`;
        const cachedResult = cache.get(cacheKey);
        if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_DURATION) {
            return res.json({
                ...cachedResult.data,
                cached: true,
                cacheExpires: new Date(cachedResult.timestamp + CACHE_DURATION)
            });
        }
        if (!YOUTUBE_API_KEY) {
            return res.status(500).json({ 
                error: 'YouTube API key is not configured. Please set YOUTUBE_API_KEY in your .env file.' 
            });
        }
        let allVideos = [];
        for (const keyword of category.keywords) {
            try {
                const response = await axios.get(`${YOUTUBE_API_BASE_URL}/search`, {
                    params: {
                        part: 'snippet',
                        q: keyword,
                        maxResults: Math.ceil(maxResults / category.keywords.length),
                        type: 'video',
                        videoDuration: 'medium',
                        order: 'relevance',
                        key: YOUTUBE_API_KEY
                    }
                });
                if (response.data.items && response.data.items.length > 0) {
                    const videoIds = response.data.items.map(item => item.id.videoId).join(',');
                    const videoDetailsResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
                        params: {
                            part: 'contentDetails,snippet',
                            id: videoIds,
                            key: YOUTUBE_API_KEY
                        }
                    });
                    const filteredVideos = videoDetailsResponse.data.items
                        .filter(video => {
                            const duration = video.contentDetails.duration;
                            const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                            if (!match) return true;
                            const hours = parseInt(match[1] || 0);
                            const minutes = parseInt(match[2] || 0);
                            const seconds = parseInt(match[3] || 0);
                            const totalSeconds = hours * 3600 + minutes * 60 + seconds;
                            return totalSeconds >= 60;
                        })
                        .map(video => ({
                            id: video.id,
                            title: video.snippet.title,
                            description: video.snippet.description,
                            thumbnail: video.snippet.thumbnails.medium.url,
                            channelTitle: video.snippet.channelTitle,
                            publishedAt: video.snippet.publishedAt,
                            duration: video.contentDetails.duration,
                            keyword: keyword
                        }));
                    allVideos.push(...filteredVideos);
                }
            } catch (keywordError) {
                console.error(`Error searching for keyword "${keyword}":`, keywordError.response?.data || keywordError.message);
            }
        }
        const uniqueVideos = allVideos.filter((video, index, self) => 
            index === self.findIndex(v => v.id === video.id)
        );
        const shuffledVideos = uniqueVideos.sort(() => Math.random() - 0.5);
        const finalVideos = shuffledVideos.slice(0, maxResults);
        const result = {
            videos: finalVideos,
            totalFound: uniqueVideos.length,
            keywords: category.keywords,
            category: category
        };
        cache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });
        res.json(result);
    } catch (error) {
        console.error('YouTube API Error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to fetch videos from YouTube API',
            details: error.response?.data || error.message
        });
    }
});

// API endpoint to search YouTube videos (original endpoint)
app.get('/api/search', async (req, res) => {
    try {
        const { q, maxResults = 50 } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        if (!YOUTUBE_API_KEY) {
            return res.status(500).json({ 
                error: 'YouTube API key is not configured. Please set YOUTUBE_API_KEY in your .env file.' 
            });
        }
        const keywords = q.split(',').map(k => k.trim()).filter(k => k.length > 0);
        let allVideos = [];
        for (const keyword of keywords) {
            try {
                const response = await axios.get(`${YOUTUBE_API_BASE_URL}/search`, {
                    params: {
                        part: 'snippet',
                        q: keyword,
                        maxResults: Math.ceil(maxResults / keywords.length),
                        type: 'video',
                        videoDuration: 'medium',
                        order: 'relevance',
                        key: YOUTUBE_API_KEY
                    }
                });
                if (response.data.items && response.data.items.length > 0) {
                    const videoIds = response.data.items.map(item => item.id.videoId).join(',');
                    const videoDetailsResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
                        params: {
                            part: 'contentDetails,snippet',
                            id: videoIds,
                            key: YOUTUBE_API_KEY
                        }
                    });
                    const filteredVideos = videoDetailsResponse.data.items
                        .filter(video => {
                            const duration = video.contentDetails.duration;
                            const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                            if (!match) return true;
                            const hours = parseInt(match[1] || 0);
                            const minutes = parseInt(match[2] || 0);
                            const seconds = parseInt(match[3] || 0);
                            const totalSeconds = hours * 3600 + minutes * 60 + seconds;
                            return totalSeconds >= 60;
                        })
                        .map(video => ({
                            id: video.id,
                            title: video.snippet.title,
                            description: video.snippet.description,
                            thumbnail: video.snippet.thumbnails.medium.url,
                            channelTitle: video.snippet.channelTitle,
                            publishedAt: video.snippet.publishedAt,
                            duration: video.contentDetails.duration,
                            keyword: keyword
                        }));
                    allVideos.push(...filteredVideos);
                }
            } catch (keywordError) {
                console.error(`Error searching for keyword "${keyword}":`, keywordError.response?.data || keywordError.message);
            }
        }
        const uniqueVideos = allVideos.filter((video, index, self) => 
            index === self.findIndex(v => v.id === video.id)
        );
        const shuffledVideos = uniqueVideos.sort(() => Math.random() - 0.5);
        const finalVideos = shuffledVideos.slice(0, maxResults);
        res.json({ 
            videos: finalVideos,
            totalFound: uniqueVideos.length,
            keywords: keywords
        });
    } catch (error) {
        console.error('YouTube API Error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to fetch videos from YouTube API',
            details: error.response?.data || error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'YouTube API Server is running' });
});

app.listen(PORT, () => {
    console.log(`API server is running on http://localhost:${PORT}`);
    console.log(`YouTube API Key configured: ${YOUTUBE_API_KEY ? 'Yes' : 'No'}`);
}); 