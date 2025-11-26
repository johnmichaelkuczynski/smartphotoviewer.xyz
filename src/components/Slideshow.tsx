import { useEffect, useState, useRef } from 'react';
import type { MediaFile } from '../types';

interface SlideshowProps {
  files: MediaFile[];
  interval: number;
  skipVideos: boolean;
  onClose: () => void;
}

export function Slideshow({ files, interval, skipVideos, onClose }: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [urls, setUrls] = useState<Map<number, string>>(new Map());
  const intervalRef = useRef<number | undefined>(undefined);
  const controlsTimeoutRef = useRef<number | undefined>(undefined);

  const displayFiles = skipVideos ? files.filter(f => f.type === 'image') : files;
  const currentFile = displayFiles[currentIndex];
  const nextFile = displayFiles[nextIndex];

  useEffect(() => {
    const newUrls = new Map<number, string>();
    [currentIndex, nextIndex].forEach(idx => {
      if (displayFiles[idx]) {
        newUrls.set(idx, URL.createObjectURL(displayFiles[idx].file));
      }
    });
    setUrls(newUrls);

    return () => {
      newUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [currentIndex, nextIndex, displayFiles]);

  const goToNext = () => {
    setIsTransitioning(true);
    const next = (currentIndex + 1) % displayFiles.length;
    setNextIndex(next);
    
    setTimeout(() => {
      setCurrentIndex(next);
      setNextIndex((next + 1) % displayFiles.length);
      setIsTransitioning(false);
    }, 1000);
  };

  const goToPrevious = () => {
    const prev = (currentIndex - 1 + displayFiles.length) % displayFiles.length;
    setCurrentIndex(prev);
    setNextIndex(currentIndex);
  };

  useEffect(() => {
    if (!isPaused && !isTransitioning) {
      intervalRef.current = window.setInterval(() => {
        goToNext();
      }, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, interval, displayFiles.length, isTransitioning, currentIndex]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 3000);
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

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

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayFiles.length, onClose, isTransitioning, currentIndex]);

  if (!currentFile) {
    return null;
  }

  const currentUrl = urls.get(currentIndex) || '';
  const nextUrl = urls.get(nextIndex) || '';

  return (
    <div 
      className="fixed inset-0 bg-black z-50 cursor-none"
      onMouseMove={handleMouseMove}
      onClick={() => setShowControls(prev => !prev)}
    >
      {currentFile.type === 'image' ? (
        <img
          src={currentUrl}
          alt={currentFile.name}
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        />
      ) : (
        <video
          src={currentUrl}
          autoPlay
          muted
          className="absolute inset-0 w-full h-full object-contain"
        />
      )}

      {isTransitioning && nextFile && nextFile.type === 'image' && (
        <img
          src={nextUrl}
          alt={nextFile.name}
          className="absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 opacity-100"
        />
      )}

      <div 
        className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="px-4 py-2 bg-gray-800 bg-opacity-80 hover:bg-opacity-100 text-white rounded transition"
            >
              Exit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setIsPaused(prev => !prev); }}
              className="px-4 py-2 bg-gray-800 bg-opacity-80 hover:bg-opacity-100 text-white rounded transition"
            >
              {isPaused ? 'Play' : 'Pause'}
            </button>
          </div>
          
          <span className="text-white text-sm bg-gray-800 bg-opacity-80 px-3 py-1 rounded">
            {currentIndex + 1} / {displayFiles.length}
          </span>
        </div>
      </div>

      <div 
        className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <p className="text-white text-center text-sm">{currentFile.name}</p>
        <p className="text-gray-400 text-center text-xs mt-1">
          Space: {isPaused ? 'play' : 'pause'} | Arrows: navigate | Esc: exit
        </p>
      </div>
    </div>
  );
}
