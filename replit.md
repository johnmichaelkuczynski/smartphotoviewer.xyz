# Photo/Video Viewer with Local AI

## Project Overview

A high-performance photo and video viewer with completely local AI-powered organization. Built with React, TypeScript, and transformers.js for privacy-safe image analysis.

**Date**: November 26, 2025

## Recent Changes

### Initial Implementation (November 26, 2025)
- Created full-stack photo/video viewer application
- Implemented local CLIP-based AI features for theme grouping and similarity search
- Built dynamic grid view with customizable layouts
- Added filmstrip view and individual viewer with zoom
- Implemented slideshow mode with configurable options
- Set up IndexedDB caching for embeddings
- Configured Vite dev server on port 5000

## Project Architecture

### Frontend Structure
- **React + TypeScript + Vite**: Modern development stack
- **Tailwind CSS v4**: Styling with new Vite plugin approach
- **File System Access API**: Local file/folder selection without uploads

### Services Layer
1. **fileSystemService.ts**: Handles local file system access, media file loading, and video thumbnail generation
2. **indexedDBService.ts**: Manages persistent embedding cache in IndexedDB
3. **embeddingService.ts**: Local CLIP model (Xenova/clip-vit-base-patch32) for image embedding generation
4. **clusteringService.ts**: K-means clustering for theme grouping and similarity search

### Components
- **GridView**: Virtualized grid with customizable columns/rows
- **FilmstripView**: Horizontal thumbnail strip with large preview
- **Viewer**: Full-screen viewer with mouse wheel zoom
- **Slideshow**: Automatic slideshow with skip videos option
- **Settings**: Configuration panel for AI features and preferences
- **Toolbar**: Main navigation and controls
- **ContextMenu**: Right-click "Find Similar" functionality

### Key Features

**Core Viewing**
- Dynamic grid view (any column/row configuration)
- Filmstrip view with adjustable thumbnail sizes (S/M/L)
- Individual viewer with mouse wheel zoom
- Navigation between photos and videos
- Slideshow mode with configurable interval

**Local AI Features (100% Privacy-Safe)**
- Group by Theme: Auto-cluster images by visual similarity
- Find Similar: Right-click to find visually similar items
- Background indexing with progress indicator
- Persistent embedding cache in IndexedDB
- Works offline, no external API calls

**Performance Optimizations**
- Asynchronous embedding generation
- IndexedDB caching (keyed by filepath + timestamp)
- Lazy loading thumbnails
- Efficient grid rendering for large folders

## Technology Stack

- React 19.2.0
- TypeScript 5.9.3
- Vite 7.2.4
- Tailwind CSS 4.1.17
- @xenova/transformers 2.17.2 (CLIP model)
- idb 8.0.3 (IndexedDB wrapper)
- ml-kmeans 7.0.0 (clustering)

## Supported Media Formats

**Images**: JPG, JPEG, PNG, GIF, WebP, BMP, SVG, HEIC, HEIF  
**Videos**: MP4, WebM, OGG, MOV, AVI, MKV, M4V, FLV, WMV

## Privacy & Security

All AI processing happens locally in the browser using WebAssembly/WebGL acceleration. No images, embeddings, or metadata are ever sent to external servers. Safe for any content including NSFW material.

**Model Loading**: The CLIP model (~200MB) is downloaded from HuggingFace on first use and cached locally in the browser's Cache API via transformers.js. After the initial download, the model works completely offline. Internet connection is only required for the first-time model download.

## User Preferences

- Default AI features: Enabled
- Default slideshow interval: 3 seconds
- Default grid columns: 10
- Theme: Dark mode

## Development

**Workflow**: Photo Viewer Dev Server
- Command: `cd photo-viewer && npm run dev`
- Port: 5000
- Output: webview

**Key Files**
- Main app: `photo-viewer/src/App.tsx`
- Services: `photo-viewer/src/services/`
- Components: `photo-viewer/src/components/`
- Types: `photo-viewer/src/types.ts`
