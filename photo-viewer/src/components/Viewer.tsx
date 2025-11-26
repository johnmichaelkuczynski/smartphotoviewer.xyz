import { useEffect, useRef, useState } from 'react';
import type { MediaFile } from '../types';

interface ViewerProps {
  file: MediaFile;
  currentIndex: number;
  totalFiles: number;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
}

export function Viewer({ file, currentIndex, totalFiles, onNext, onPrevious, onClose }: ViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [url, setUrl] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file.file);
    setUrl(objectUrl);
    setZoom(1);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.1, Math.min(5, prev + delta)));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
        onNext();
        break;
      case 'ArrowLeft':
        onPrevious();
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrevious, onClose]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 bg-gray-900">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
          >
            Close
          </button>
          <span className="text-white text-sm">
            {currentIndex + 1} / {totalFiles}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevious}
            disabled={currentIndex === 0}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition"
          >
            Previous
          </button>
          <button
            onClick={onNext}
            disabled={currentIndex === totalFiles - 1}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition"
          >
            Next
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-white text-sm">Zoom: {Math.round(zoom * 100)}%</span>
          <span className="text-gray-400 text-xs">(Mouse wheel to zoom)</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex items-center justify-center"
        onWheel={handleWheel}
      >
        {file.type === 'image' ? (
          <img
            src={url}
            alt={file.name}
            className="max-w-none transition-transform"
            style={{ transform: `scale(${zoom})` }}
          />
        ) : (
          <video
            ref={videoRef}
            src={url}
            controls
            className="max-w-full max-h-full"
            style={{ transform: `scale(${zoom})` }}
          />
        )}
      </div>

      <div className="p-4 bg-gray-900 text-white text-center">
        <p className="text-sm">{file.name}</p>
      </div>
    </div>
  );
}
