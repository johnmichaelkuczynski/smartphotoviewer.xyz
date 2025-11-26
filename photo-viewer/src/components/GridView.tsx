import { useEffect, useRef, useState, useCallback } from 'react';
import type { MediaFile } from '../types';

interface GridViewProps {
  files: MediaFile[];
  columns: number;
  onFileClick: (file: MediaFile, index: number) => void;
  onContextMenu: (file: MediaFile, index: number, event: React.MouseEvent) => void;
  onColumnsChange: (columns: number) => void;
}

export function GridView({ files, columns, onFileClick, onContextMenu, onColumnsChange }: GridViewProps) {
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  const gridRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      // Scroll down (backward) = more columns = smaller photos
      const newColumns = Math.min(columns + 1, 20);
      onColumnsChange(newColumns);
    } else if (e.deltaY < 0) {
      // Scroll up (forward) = fewer columns = bigger photos
      const newColumns = Math.max(columns - 1, 1);
      onColumnsChange(newColumns);
    }
  }, [columns, onColumnsChange]);

  useEffect(() => {
    const grid = gridRef.current;
    if (grid) {
      grid.addEventListener('wheel', handleWheel, { passive: false });
      return () => grid.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  useEffect(() => {
    const newThumbnails = new Map<string, string>();
    
    files.forEach((file) => {
      if (file.thumbnailUrl) {
        newThumbnails.set(file.path, file.thumbnailUrl);
      } else {
        const url = URL.createObjectURL(file.file);
        newThumbnails.set(file.path, url);
      }
    });
    
    setThumbnails(newThumbnails);
    
    return () => {
      newThumbnails.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [files]);

  return (
    <div
      ref={gridRef}
      className="grid gap-1 p-2 h-full overflow-auto bg-gray-900 content-start"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {files.map((file, index) => {
        const thumbnailUrl = thumbnails.get(file.path);
        
        return (
          <div
            key={file.path}
            className="relative bg-gray-800 rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all group flex items-center justify-center"
            onClick={() => onFileClick(file, index)}
            onContextMenu={(e) => {
              e.preventDefault();
              onContextMenu(file, index, e);
            }}
          >
            {thumbnailUrl && (
              <>
                {file.type === 'image' ? (
                  <img
                    src={thumbnailUrl}
                    alt={file.name}
                    className="max-w-full max-h-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <div className="relative">
                    <img
                      src={thumbnailUrl}
                      alt={file.name}
                      className="max-w-full max-h-full object-contain"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <svg className="w-12 h-12 text-white opacity-75" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-xs truncate">{file.name}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
