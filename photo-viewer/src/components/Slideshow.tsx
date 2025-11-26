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
  const [isPaused, setIsPaused] = useState(false);
  const [url, setUrl] = useState<string>('');
  const intervalRef = useRef<number | undefined>(undefined);

  const displayFiles = skipVideos ? files.filter(f => f.type === 'image') : files;
  const currentFile = displayFiles[currentIndex];

  useEffect(() => {
    if (currentFile) {
      const objectUrl = URL.createObjectURL(currentFile.file);
      setUrl(objectUrl);
      
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }
  }, [currentFile]);

  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = window.setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % displayFiles.length);
      }, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, interval, displayFiles.length]);

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
        setCurrentIndex((prev) => (prev + 1) % displayFiles.length);
        break;
      case 'ArrowLeft':
        setCurrentIndex((prev) => (prev - 1 + displayFiles.length) % displayFiles.length);
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayFiles.length, onClose]);

  if (!currentFile) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 bg-gray-900 bg-opacity-90">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
          >
            Exit Slideshow
          </button>
          <button
            onClick={() => setIsPaused(prev => !prev)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
        
        <span className="text-white text-sm">
          {currentIndex + 1} / {displayFiles.length}
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        {currentFile.type === 'image' ? (
          <img
            src={url}
            alt={currentFile.name}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            src={url}
            autoPlay
            className="max-w-full max-h-full"
          />
        )}
      </div>

      <div className="p-4 bg-gray-900 bg-opacity-90 text-white text-center">
        <p className="text-sm">{currentFile.name}</p>
        <p className="text-xs text-gray-400 mt-1">
          Press Space to {isPaused ? 'resume' : 'pause'} | Arrow keys to navigate | Esc to exit
        </p>
      </div>
    </div>
  );
}
