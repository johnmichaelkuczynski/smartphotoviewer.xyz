# Photo/Video Viewer with Local AI

A high-performance photo and video viewer with local AI-powered organization features. View, organize, and find similar images without sending any data to external servers.

## Features

### Core Viewing
- **Dynamic Grid View**: Customize grid layout with any column/row configuration (2x50, 10x10, 20x20, etc.)
- **Filmstrip View**: Horizontal thumbnail strip with large preview, adjustable thumbnail sizes (S/M/L)
- **Individual Viewer**: Full-screen viewing with mouse wheel zoom
- **Navigation**: Seamlessly navigate between photos and videos in a folder
- **Slideshow Mode**: Automatic slideshow with configurable interval and option to skip videos

### Local AI Features (100% Privacy-Safe)
- **Group by Theme**: Automatically cluster images by visual similarity using local CLIP embeddings
- **Find Similar**: Right-click any image to find visually similar items
- **Smart Caching**: Embeddings cached locally in IndexedDB for instant performance
- **Background Processing**: Non-blocking AI analysis that runs asynchronously

### Technical Highlights
- Completely local processing after first model download
- CLIP-based image embeddings via transformers.js
- Optimized for large folders with hundreds of files
- Works with NSFW content (all processing is private)
- Supports: JPG, PNG, GIF, WebP, BMP, SVG, HEIC, MP4, WebM, OGG, MOV, AVI, MKV, and more

## Getting Started

1. Click "Open Folder" to select a folder containing photos/videos
2. Browse using Grid or Filmstrip view
3. Enable AI features in Settings to unlock theme grouping and similarity search
4. Right-click any image to "Find Similar (AI)"
5. Click "Group by Theme (AI)" to auto-organize images

## First-Time Setup

**Important**: Internet connection required for first-time AI model download (~200MB). After the first download, the CLIP model is cached locally in your browser and works completely offline for privacy-safe operation.

## Keyboard Shortcuts

### Viewer Mode
- Arrow Left/Right: Navigate between files
- Escape: Exit viewer
- Mouse Wheel: Zoom in/out

### Slideshow Mode
- Space: Play/Pause
- Arrow Left/Right: Navigate
- Escape: Exit slideshow

## Technology Stack

- React 19.2 + TypeScript 5.9
- Vite 7.2 + Tailwind CSS 4.1
- transformers.js (Xenova/clip-vit-base-patch32)
- IndexedDB for caching
- ML K-means clustering

## Privacy

All AI processing happens locally in your browser after the initial model download. No images, embeddings, or metadata are ever sent to external servers. The CLIP model is cached in your browser's Cache API for offline use.
