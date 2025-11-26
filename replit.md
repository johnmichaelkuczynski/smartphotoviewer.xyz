# Photo/Video Viewer with Local AI

## Project Overview

A high-performance photo and video viewer with completely local AI-powered organization. Built with React, TypeScript, and transformers.js for privacy-safe image analysis.

**Date**: November 26, 2025

## Recent Changes

### Latest Fixes (November 26, 2025)
- **Fixed photo cropping** - Images now display COMPLETE with letterboxing, never cropped
- **Fixed file picker** - "Open Photos" button and "Select Photos/Videos" use reliable file picker (Ctrl+A to select all)
- **Improved slideshow** - Added Previous/Next/Pause buttons, smooth crossfade transitions, fixed flickering bug
- **Lazy loading thumbnails** - Only visible thumbnails load to prevent crashes with large folders
- **Tailwind CSS v3** - Switched from v4 (ESM issues) to v3 + PostCSS for reliable builds

### Initial Implementation (November 26, 2025)
- Created full-stack photo/video viewer application
- Implemented local CLIP-based AI features for theme grouping and similarity search
- Built dynamic grid view with customizable layouts
- Added filmstrip view and individual viewer with zoom
- Implemented slideshow mode with configurable options
- Set up IndexedDB caching for embeddings

## User Preferences

- **CRITICAL**: Photos must NEVER be cropped - always show complete images with letterboxing
- File picker method preferred over folder picker (more reliable)
- Dark mode theme
- Default slideshow interval: 3 seconds

## Project Architecture

### Frontend Structure
- **React + TypeScript + Vite**: Modern development stack
- **Tailwind CSS v3**: Traditional PostCSS setup for reliable builds
- **File picker**: Navigate to folder, Ctrl+A to select all files

### Key Files
- Main app: `src/App.tsx`
- Services: `src/services/`
- Components: `src/components/`
- Types: `src/types.ts`

### Components
- **GridView**: Grid with mouse wheel zoom (scroll = change columns), lazy loading, NO CROPPING
- **FilmstripView**: Horizontal thumbnail strip with large preview
- **Viewer**: Full-screen viewer with mouse wheel zoom
- **Slideshow**: Previous/Next/Pause buttons, smooth crossfade transitions
- **Settings**: Configuration panel for AI features and preferences
- **Toolbar**: Main navigation and controls
- **ContextMenu**: Right-click "Find Similar" functionality

### Key Features

**Core Viewing**
- Dynamic grid view - mouse wheel changes column count
- Complete images always shown (object-contain with letterboxing)
- Filmstrip view with adjustable thumbnail sizes (S/M/L)
- Individual viewer with mouse wheel zoom
- Slideshow with Previous/Next/Pause controls

**Local AI Features (100% Privacy-Safe)**
- Group by Theme: Auto-cluster images by visual similarity
- Find Similar: Right-click to find visually similar items
- Works offline after initial model download

## Deployment

**Target**: Render.com (external deployment)
- Build command: `npm run build`
- Start command: `npm run preview`
- Output directory: `dist/`

## Supported Media Formats

**Images**: JPG, JPEG, JFIF, PNG, GIF, WebP, BMP, SVG, HEIC, HEIF, AVIF, TIF, TIFF
**Videos**: MP4, WebM, OGG, MOV, AVI, MKV, M4V, FLV, WMV, 3GP, MPG, MPEG

## Privacy & Security

All AI processing happens locally in the browser. No images or data sent to external servers. Safe for any content.
