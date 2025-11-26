import { useEffect, useRef, useState, useCallback } from 'react';
import type { MediaFile } from '../types';
import { extractVideoThumbnail } from '../services/fileSystemService';

interface GridViewProps {
  files: MediaFile[];
  columns: number;
  onFileClick: (file: MediaFile, index: number) => void;
  onContextMenu: (file: MediaFile, index: number, event: React.MouseEvent) => void;
  onColumnsChange: (columns: number) => void;
}

export function GridView({ files, columns, onFileClick, onContextMenu, onColumnsChange }: GridViewProps) {
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  const [loadingVideos, setLoadingVideos] = useState<Set<string>>(new Set());
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
    const urlsToRevoke: string[] = [];
    
    const generateThumbnails = async () => {
      const newThumbnails = new Map<string, string>();
      const videoFiles: MediaFile[] = [];
      
      files.forEach((file) => {
        if (file.thumbnailUrl) {
          newThumbnails.set(file.path, file.thumbnailUrl);
        } else if (file.type === 'image') {
          const url = URL.createObjectURL(file.file);
          urlsToRevoke.push(url);
          newThumbnails.set(file.path, url);
        } else if (file.type === 'video') {
          videoFiles.push(file);
        }
      });
      
      setThumbnails(new Map(newThumbnails));
      setLoadingVideos(new Set(videoFiles.map(f => f.path)));
      
      for (const videoFile of videoFiles) {
        try {
          const thumbnailUrl = await extractVideoThumbnail(videoFile.file);
          urlsToRevoke.push(thumbnailUrl);
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
      urlsToRevoke.forEach(url => URL.revokeObjectURL(url));
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
        const isLoadingVideo = loadingVideos.has(file.path);
        
        return (
          <div
            key={file.path}
            className="relative bg-gray-800 rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all group flex items-center justify-center aspect-square"
            onClick={() => onFileClick(file, index)}
            onContextMenu={(e) => {
              e.preventDefault();
              onContextMenu(file, index, e);
            }}
          >
            {isLoadingVideo ? (
              <div className="flex flex-col items-center justify-center text-gray-400">
                <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : thumbnailUrl ? (
              <>
                <img
                  src={thumbnailUrl}
                  alt={file.name}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
                {file.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black bg-opacity-50 rounded-full p-2">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center text-gray-500">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
              </div>
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
