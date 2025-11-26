import { useEffect, useRef, useState } from 'react';
import type { MediaFile } from '../types';

interface GridViewProps {
  files: MediaFile[];
  columns: number;
  onFileClick: (file: MediaFile, index: number) => void;
  onContextMenu: (file: MediaFile, index: number, event: React.MouseEvent) => void;
}

export function GridView({ files, columns, onFileClick, onContextMenu }: GridViewProps) {
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  const gridRef = useRef<HTMLDivElement>(null);

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
      className="grid gap-2 p-4 h-full overflow-auto bg-gray-900"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {files.map((file, index) => {
        const thumbnailUrl = thumbnails.get(file.path);
        
        return (
          <div
            key={file.path}
            className="relative aspect-square bg-gray-800 rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all group"
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
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <img
                      src={thumbnailUrl}
                      alt={file.name}
                      className="w-full h-full object-cover"
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
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-xs truncate">{file.name}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
