import { useEffect, useState, useRef, useCallback } from 'react';
import type { MediaFile } from '../types';

interface SlideshowProps {
  files: MediaFile[];
  interval: number;
  skipVideos: boolean;
  onClose: () => void;
  onOpenFiles: () => void;
}

export function Slideshow({ files, interval, skipVideos, onClose, onOpenFiles }: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [nextUrl, setNextUrl] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const urlsToCleanup = useRef<string[]>([]);

  const displayFiles = skipVideos ? files.filter(f => f.type === 'image') : files;

  const createUrl = useCallback((file: MediaFile): string => {
    const url = URL.createObjectURL(file.file);
    urlsToCleanup.current.push(url);
    return url;
  }, []);

  useEffect(() => {
    if (displayFiles[currentIndex]) {
      setCurrentUrl(createUrl(displayFiles[currentIndex]));
    }
    return () => {
      urlsToCleanup.current.forEach(url => URL.revokeObjectURL(url));
      urlsToCleanup.current = [];
    };
  }, []);

  const goToNext = useCallback(() => {
    if (displayFiles.length <= 1) return;
    
    const nextIdx = (currentIndex + 1) % displayFiles.length;
    const newUrl = createUrl(displayFiles[nextIdx]);
    
    setNextUrl(newUrl);
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentIndex(nextIdx);
      setCurrentUrl(newUrl);
      setNextUrl('');
      setIsTransitioning(false);
    }, 500);
  }, [currentIndex, displayFiles, createUrl]);

  const goToPrevious = useCallback(() => {
    if (displayFiles.length <= 1) return;
    
    const prevIdx = (currentIndex - 1 + displayFiles.length) % displayFiles.length;
    const newUrl = createUrl(displayFiles[prevIdx]);
    
    setCurrentIndex(prevIdx);
    setCurrentUrl(newUrl);
  }, [currentIndex, displayFiles, createUrl]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isPaused && !isTransitioning && displayFiles.length > 1) {
      intervalRef.current = window.setInterval(() => {
        goToNext();
      }, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, interval, isTransitioning, goToNext, displayFiles.length]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (!isPaused) {
        setShowControls(false);
      }
    }, 3000);
  };

  useEffect(() => {
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (!isPaused) {
        setShowControls(false);
      }
    }, 3000);
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPaused]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case ' ':
          e.preventDefault();
          setIsPaused(prev => !prev);
          break;
        case 'ArrowRight':
          if (!isTransitioning) goToNext();
          break;
        case 'ArrowLeft':
          if (!isTransitioning) goToPrevious();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isTransitioning, goToNext, goToPrevious]);

  const currentFile = displayFiles[currentIndex];

  if (!currentFile || !currentUrl) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black z-50"
      onMouseMove={handleMouseMove}
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      {currentFile.type === 'image' ? (
        <>
          <img
            src={currentUrl}
            alt={currentFile.name}
            className="absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ease-in-out"
            style={{ opacity: isTransitioning ? 0 : 1 }}
          />
          {isTransitioning && nextUrl && (
            <img
              src={nextUrl}
              alt="Next"
              className="absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ease-in-out"
              style={{ opacity: 1 }}
            />
          )}
        </>
      ) : (
        <video
          key={currentUrl}
          src={currentUrl}
          autoPlay
          muted
          loop
          className="absolute inset-0 w-full h-full object-contain"
        />
      )}

      <div 
        className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
            >
              Exit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onOpenFiles(); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
            >
              Open Photos
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); if (!isTransitioning) goToPrevious(); }}
              disabled={isTransitioning}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition font-medium"
            >
              Previous
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setIsPaused(prev => !prev); }}
              className={`px-6 py-2 ${isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white rounded-lg transition font-medium min-w-[100px]`}
            >
              {isPaused ? 'Play' : 'Pause'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); if (!isTransitioning) goToNext(); }}
              disabled={isTransitioning}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition font-medium"
            >
              Next
            </button>
          </div>
          
          <span className="text-white text-sm bg-gray-800/80 px-4 py-2 rounded-lg">
            {currentIndex + 1} / {displayFiles.length}
          </span>
        </div>
      </div>

      <div 
        className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <p className="text-white text-center text-lg font-medium">{currentFile.name}</p>
        <p className="text-gray-300 text-center text-sm mt-2">
          Space: {isPaused ? 'play' : 'pause'} | Arrow keys: navigate | Esc: exit
        </p>
        {isPaused && (
          <p className="text-yellow-400 text-center text-sm mt-1 font-medium">PAUSED</p>
        )}
      </div>
    </div>
  );
}
