# YouTube Video Search API Server

A modern YouTube video search application built with Node.js backend and React frontend. Features category management, caching, and a beautiful UI for searching YouTube videos by keywords.

## Features

- 🔍 Search YouTube videos by multiple keywords
- 📂 Category management system (create, edit, delete categories)
- ⚡ 10-minute caching for faster category searches
- 🎨 Modern React UI with Tailwind CSS
- 📱 Responsive design for all devices
- 🎥 Click to open videos on YouTube
- 🛡️ Filter out YouTube Shorts (only full videos)
- 🔄 Real-time category updates

## Prerequisites

- Node.js (v16 or higher)
- YouTube Data API v3 key

## Setup Instructions

### 1. Get a YouTube API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3:
   - Go to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click on it and press "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp env.example .env
   ```

2. Edit the `.env` file and add your YouTube API key:
   ```
   YOUTUBE_API_KEY=your_actual_api_key_here
   PORT=3000
   ```

### 4. Development Mode

#### Option A: Full Stack Development (Recommended)
```bash
# Terminal 1: Start the backend server
npm run dev

# Terminal 2: Start the React development server
npm run dev:frontend
```

The backend will run on `http://localhost:3000` and the frontend on `http://localhost:5173`

#### Option B: Production Build
```bash
# Build the React app
npm run build:frontend

# Start the production server
npm start
```

The full application will be available at `http://localhost:3000`

## Usage

### Search Videos
1. Enter keywords separated by commas in the search bar
2. Click the search button or press Enter
3. Browse through the results and click on any video to open it on YouTube

### Category Management
1. Click the menu button to open the sidebar
2. Use the "+" button to create new categories
3. Each category can have multiple keywords (one per line)
4. Click "Load Videos" on any category to see videos from those keywords
5. Edit or delete categories using the buttons on each category card

### Features
- **Caching**: Category searches are cached for 10 minutes to avoid repeated API calls
- **No Shorts**: Only full videos (60+ seconds) are displayed
- **Mixed Results**: Videos from multiple keywords are shuffled for variety
- **Responsive**: Works on desktop, tablet, and mobile devices

## API Endpoints

### GET `/api/search`
Search for YouTube videos by keyword.

**Query Parameters:**
- `q` (required): Search query/keyword
- `maxResults` (optional): Number of results (default: 10, max: 50)

### GET `/api/search/category/:id`
Search for videos using a specific category.

**Query Parameters:**
- `maxResults` (optional): Number of results (default: 15)

### GET `/api/categories`
Get all available categories.

### POST `/api/categories`
Create a new category.

**Body:**
```json
{
  "title": "Category Name",
  "keywords": ["keyword1", "keyword2"],
  "color": "#ff0000"
}
```

### PUT `/api/categories/:id`
Update an existing category.

### DELETE `/api/categories/:id`
Delete a category.

## Project Structure

```
youtube-api-server/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables
├── env.example           # Example environment file
├── README.md             # This file
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
├── index.html            # Main HTML file
└── src/
    ├── main.tsx          # React entry point
    ├── App.tsx           # Main React component
    ├── index.css         # Global styles
    ├── lib/
    │   └── utils.ts      # Utility functions
    └── components/
        └── ui/           # Reusable UI components
            ├── button.tsx
            ├── input.tsx
            ├── card.tsx
            ├── dialog.tsx
            ├── label.tsx
            └── textarea.tsx
```

## Technology Stack

### Backend
- **Node.js** with Express
- **YouTube Data API v3**
- **In-memory caching** (10 minutes)
- **CORS enabled**

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Radix UI** for accessible components

## Customization

### Changing Cache Duration
Modify the `CACHE_DURATION` constant in `server.js`:
```javascript
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
```

### Styling
The app uses Tailwind CSS. You can customize styles in:
- `src/index.css` for global styles
- Individual component files for component-specific styles
- `tailwind.config.js` for Tailwind configuration

### API Configuration
You can modify the YouTube API parameters in `server.js`:
```javascript
const response = await axios.get(`${YOUTUBE_API_BASE_URL}/search`, {
    params: {
        part: 'snippet',
        q: keyword,
        maxResults: maxResults,
        type: 'video',
        videoDuration: 'medium', // Can be: short, medium, long
        order: 'relevance', // Can be: date, rating, relevance, title, videoCount, viewCount
        key: YOUTUBE_API_KEY
    }
});
```

## Troubleshooting

### "YouTube API key is not configured" Error
- Make sure you have created a `.env` file with your API key
- Verify the API key is correct and has YouTube Data API v3 enabled

### "API key not valid" Error
- Check if your API key is correct
- Ensure the YouTube Data API v3 is enabled in your Google Cloud Console
- Check if you have billing enabled (required for API usage)

### React Development Issues
- Make sure all dependencies are installed: `npm install`
- Check that the backend server is running on port 3000
- The frontend development server should proxy API calls to the backend

### Build Issues
- Run `npm run build:frontend` to build the React app
- The built files will be in the `dist` directory
- Make sure the server is configured to serve from the `dist` directory

## License

MIT License - feel free to use this project for your own purposes!

## Contributing

Feel free to submit issues and enhancement requests! 