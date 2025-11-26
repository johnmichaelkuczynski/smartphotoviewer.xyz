import { useEffect, useState, useCallback } from 'react';
import type { MediaFile } from '../types';

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
  const currentFile = files[currentIndex];
  const size = THUMBNAIL_SIZES[thumbnailSize];

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      const nextIndex = Math.min(currentIndex + 1, files.length - 1);
      onIndexChange(nextIndex);
    } else if (e.deltaY < 0) {
      const prevIndex = Math.max(currentIndex - 1, 0);
      onIndexChange(prevIndex);
    }
  }, [currentIndex, files.length, onIndexChange]);

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
    const newThumbnails = new Map<string, string>();
    
    files.forEach((file) => {
      const url = file.thumbnailUrl || URL.createObjectURL(file.file);
      newThumbnails.set(file.path, url);
    });
    
    setThumbnails(newThumbnails);
    
    return () => {
      newThumbnails.forEach(url => {
        if (url.startsWith('blob:') && !files.some(f => f.thumbnailUrl === url)) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [files]);

  const currentUrl = thumbnails.get(currentFile?.path || '');

  return (
    <div className="flex flex-col h-full bg-gray-900" onWheel={handleWheel}>
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {currentFile && currentUrl && (
          <div className="max-w-full max-h-full flex items-center justify-center">
            {currentFile.type === 'image' ? (
              <img
                src={currentUrl}
                alt={currentFile.name}
                className="max-w-full max-h-full object-contain"
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

      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {files.map((file, index) => {
            const thumbnailUrl = thumbnails.get(file.path);
            const isActive = index === currentIndex;
            
            return (
              <div
                key={file.path}
                className={`flex-shrink-0 cursor-pointer rounded overflow-hidden transition-all ${
                  isActive ? 'ring-2 ring-blue-500 scale-105' : 'hover:ring-2 hover:ring-gray-500'
                }`}
                style={{ width: size, height: size }}
                onClick={() => onFileClick(file, index)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onContextMenu(file, index, e);
                }}
              >
                {thumbnailUrl && (
                  <div className="relative w-full h-full">
                    <img
                      src={thumbnailUrl}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    {file.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <svg className="w-6 h-6 text-white opacity-75" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
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
