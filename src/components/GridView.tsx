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
  const urlsRef = useRef<string[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<Set<string>>(new Set());

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      const newColumns = Math.min(columns + 1, 20);
      onColumnsChange(newColumns);
    } else if (e.deltaY < 0) {
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
    return () => {
      urlsRef.current.forEach(url => URL.revokeObjectURL(url));
      urlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    setThumbnails(new Map());
    loadingRef.current = new Set();
    urlsRef.current.forEach(url => URL.revokeObjectURL(url));
    urlsRef.current = [];
  }, [files]);

  const loadThumbnail = useCallback(async (file: MediaFile) => {
    if (thumbnails.has(file.path) || loadingRef.current.has(file.path)) {
      return;
    }
    
    loadingRef.current.add(file.path);

    try {
      if (file.type === 'image') {
        const url = URL.createObjectURL(file.file);
        urlsRef.current.push(url);
        setThumbnails(prev => new Map(prev).set(file.path, url));
      } else if (file.type === 'video') {
        setLoadingVideos(prev => new Set(prev).add(file.path));
        try {
          const url = await extractVideoThumbnail(file.file);
          urlsRef.current.push(url);
          setThumbnails(prev => new Map(prev).set(file.path, url));
        } catch (err) {
          console.error('Video thumbnail failed:', file.name);
        } finally {
          setLoadingVideos(prev => {
            const next = new Set(prev);
            next.delete(file.path);
            return next;
          });
        }
      }
    } catch (err) {
      console.error('Thumbnail load failed:', file.name);
    }
  }, [thumbnails]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
            const file = files[index];
            if (file) {
              loadThumbnail(file);
            }
          }
        });
      },
      { root: gridRef.current, rootMargin: '200px', threshold: 0 }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [files, loadThumbnail]);

  const observeElement = useCallback((el: HTMLDivElement | null, index: number) => {
    if (el && observerRef.current) {
      el.setAttribute('data-index', index.toString());
      observerRef.current.observe(el);
    }
  }, []);

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
            ref={(el) => observeElement(el, index)}
            className="relative bg-gray-800 rounded cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all group aspect-square"
            onClick={() => onFileClick(file, index)}
            onContextMenu={(e) => {
              e.preventDefault();
              onContextMenu(file, index, e);
            }}
          >
            {isLoadingVideo ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
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
                  loading="lazy"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain'
                  }}
                />
                {file.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black bg-opacity-50 rounded-full p-2">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
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
