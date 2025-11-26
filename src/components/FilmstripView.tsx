import { useEffect, useState, useCallback, useRef } from 'react';
import type { MediaFile } from '../types';
import { extractVideoThumbnail } from '../services/fileSystemService';

interface FilmstripViewProps {
  files: MediaFile[];
  currentIndex: number;
  onFileClick: (file: MediaFile, index: number) => void;
  thumbnailSize: 'small' | 'medium' | 'large';
  onContextMenu: (file: MediaFile, index: number, event: React.MouseEvent) => void;
  onIndexChange: (index: number) => void;
}

const THUMBNAIL_SIZES = {
  small: 80,
  medium: 120,
  large: 160,
};

export function FilmstripView({ files, currentIndex, onFileClick, thumbnailSize, onContextMenu, onIndexChange }: FilmstripViewProps) {
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  const [videoUrls, setVideoUrls] = useState<Map<string, string>>(new Map());
  const [loadingVideos, setLoadingVideos] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const currentFile = files[currentIndex];
  const size = THUMBNAIL_SIZES[thumbnailSize];
  const urlsToRevokeRef = useRef<string[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const handlePreviewWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.1, Math.min(10, prev + delta)));
  }, []);

  const handleFilmstripWheel = useCallback((e: React.WheelEvent) => {
    if (e.deltaY > 0) {
      const nextIndex = Math.min(currentIndex + 1, files.length - 1);
      onIndexChange(nextIndex);
    } else if (e.deltaY < 0) {
      const prevIndex = Math.max(currentIndex - 1, 0);
      onIndexChange(prevIndex);
    }
  }, [currentIndex, files.length, onIndexChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (currentFile?.type === 'image') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  }, [currentFile?.type, panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    setPanOffset({ x: 0, y: 0 });
  }, [currentIndex]);

  useEffect(() => {
    const thumbnail = thumbnailRefs.current.get(currentIndex);
    if (thumbnail && filmstripRef.current) {
      thumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, files.length - 1);
        onIndexChange(nextIndex);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        onIndexChange(prevIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, files.length, onIndexChange]);

  useEffect(() => {
    const generateThumbnails = async () => {
      const newThumbnails = new Map<string, string>();
      const newVideoUrls = new Map<string, string>();
      const videoFiles: MediaFile[] = [];
      
      files.forEach((file) => {
        if (file.thumbnailUrl) {
          newThumbnails.set(file.path, file.thumbnailUrl);
        } else if (file.type === 'image') {
          const url = URL.createObjectURL(file.file);
          urlsToRevokeRef.current.push(url);
          newThumbnails.set(file.path, url);
        } else if (file.type === 'video') {
          const videoUrl = URL.createObjectURL(file.file);
          urlsToRevokeRef.current.push(videoUrl);
          newVideoUrls.set(file.path, videoUrl);
          videoFiles.push(file);
        }
      });
      
      setThumbnails(new Map(newThumbnails));
      setVideoUrls(new Map(newVideoUrls));
      setLoadingVideos(new Set(videoFiles.map(f => f.path)));
      
      for (const videoFile of videoFiles) {
        try {
          const thumbnailUrl = await extractVideoThumbnail(videoFile.file);
          urlsToRevokeRef.current.push(thumbnailUrl);
          newThumbnails.set(videoFile.path, thumbnailUrl);
          setThumbnails(new Map(newThumbnails));
          setLoadingVideos(prev => {
            const next = new Set(prev);
            next.delete(videoFile.path);
            return next;
          });
        } catch (err) {
          console.error('Failed to generate video thumbnail:', videoFile.name, err);
          setLoadingVideos(prev => {
            const next = new Set(prev);
            next.delete(videoFile.path);
            return next;
          });
        }
      }
    };
    
    generateThumbnails();
    
    return () => {
      urlsToRevokeRef.current.forEach(url => URL.revokeObjectURL(url));
      urlsToRevokeRef.current = [];
    };
  }, [files]);

  const currentUrl = currentFile?.type === 'video' 
    ? videoUrls.get(currentFile?.path || '') 
    : thumbnails.get(currentFile?.path || '');

  return (
    <div className="flex flex-col h-full bg-gray-900 relative">
      <div 
        ref={previewRef}
        className={`flex-1 flex items-center justify-center p-4 overflow-hidden select-none ${
          currentFile?.type === 'image' ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''
        }`}
        onWheel={handlePreviewWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {currentFile && currentUrl && (
          <div className="flex items-center justify-center">
            {currentFile.type === 'image' ? (
              <img
                src={currentUrl}
                alt={currentFile.name}
                className="max-w-none pointer-events-none"
                draggable={false}
                style={{ 
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}
              />
            ) : (
              <video
                src={currentUrl}
                controls
                className="max-w-full max-h-full"
              />
            )}
          </div>
        )}
      </div>
      
      <div className="absolute top-4 left-4 bg-gray-800/80 px-3 py-1 rounded text-white text-sm z-10">
        {currentIndex + 1} / {files.length}
      </div>
      
      {currentFile?.type === 'image' && (
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <div className="bg-gray-800/80 px-3 py-1 rounded text-white text-sm">
            Zoom: {Math.round(zoom * 100)}%
          </div>
          {zoom !== 1 && (
            <button
              onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }}
              className="bg-gray-800/80 hover:bg-gray-700 px-2 py-1 rounded text-white text-sm"
            >
              Reset
            </button>
          )}
        </div>
      )}

      <div className="p-4 border-t border-gray-700" onWheel={handleFilmstripWheel}>
        <div ref={filmstripRef} className="flex gap-2 overflow-x-auto pb-2">
          {files.map((file, index) => {
            const thumbnailUrl = thumbnails.get(file.path);
            const isActive = index === currentIndex;
            
            return (
              <div
                key={file.path}
                ref={(el) => {
                  if (el) thumbnailRefs.current.set(index, el);
                }}
                className={`flex-shrink-0 cursor-pointer rounded overflow-hidden transition-all ${
                  isActive ? 'ring-4 ring-yellow-400 scale-110 shadow-lg shadow-yellow-400/50' : 'hover:ring-2 hover:ring-gray-500'
                }`}
                style={{ width: size, height: size }}
                onClick={() => onFileClick(file, index)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onContextMenu(file, index, e);
                }}
              >
                {loadingVideos.has(file.path) ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-700">
                    <svg className="w-6 h-6 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : thumbnailUrl ? (
                  <div className="relative w-full h-full">
                    <img
                      src={thumbnailUrl}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    {file.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black bg-opacity-50 rounded-full p-1">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-700">
                    <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {currentFile && (
        <div className="p-2 bg-gray-800 text-white text-center">
          <p className="text-sm">
            {currentFile.name} ({currentIndex + 1} / {files.length})
          </p>
        </div>
      )}
    </div>
  );
}
