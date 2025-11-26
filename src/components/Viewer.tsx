import { useEffect, useRef, useState } from 'react';
import type { MediaFile } from '../types';
import { extractVideoThumbnail } from '../services/fileSystemService';

interface ViewerProps {
  file: MediaFile;
  files: MediaFile[];
  currentIndex: number;
  totalFiles: number;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  onOpenFiles: () => void;
}

interface VideoSlot {
  file: MediaFile;
  url: string;
  speed: number;
}

const SPEED_PRESETS = [0.2, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 5];

export function Viewer({ file, files, currentIndex, totalFiles, onNext, onPrevious, onClose, onOpenFiles }: ViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [url, setUrl] = useState<string>('');
  const [speed, setSpeed] = useState(1);
  const [multiVideoMode, setMultiVideoMode] = useState(false);
  const [videoSlots, setVideoSlots] = useState<(VideoSlot | null)[]>([null, null, null, null]);
  const [videoThumbnails, setVideoThumbnails] = useState<Map<string, string>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const multiVideoRefs = useRef<(HTMLVideoElement | null)[]>([null, null, null, null]);
  const thumbnailUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file.file);
    setUrl(objectUrl);
    setZoom(1);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed, url]);

  const handleWheel = (e: React.WheelEvent) => {
    if (file.type === 'image') {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.max(0.1, Math.min(5, prev + delta)));
    }
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

  const addVideoToSlot = (slotIndex: number, mediaFile: MediaFile) => {
    const newSlots = [...videoSlots];
    if (newSlots[slotIndex]?.url) {
      URL.revokeObjectURL(newSlots[slotIndex]!.url);
    }
    newSlots[slotIndex] = {
      file: mediaFile,
      url: URL.createObjectURL(mediaFile.file),
      speed: 1
    };
    setVideoSlots(newSlots);
  };

  const removeVideoFromSlot = (slotIndex: number) => {
    const newSlots = [...videoSlots];
    if (newSlots[slotIndex]?.url) {
      URL.revokeObjectURL(newSlots[slotIndex]!.url);
    }
    newSlots[slotIndex] = null;
    setVideoSlots(newSlots);
  };

  const updateSlotSpeed = (slotIndex: number, newSpeed: number) => {
    const newSlots = [...videoSlots];
    if (newSlots[slotIndex]) {
      newSlots[slotIndex] = { ...newSlots[slotIndex]!, speed: newSpeed };
      setVideoSlots(newSlots);
      if (multiVideoRefs.current[slotIndex]) {
        multiVideoRefs.current[slotIndex]!.playbackRate = newSpeed;
      }
    }
  };

  const videoFiles = files.filter(f => f.type === 'video');
  const activeSlotCount = videoSlots.filter(s => s !== null).length;

  useEffect(() => {
    if (multiVideoMode && videoFiles.length > 0) {
      const generateThumbnails = async () => {
        const newThumbnails = new Map<string, string>();
        
        for (const vf of videoFiles) {
          if (!videoThumbnails.has(vf.path)) {
            try {
              const thumbUrl = await extractVideoThumbnail(vf.file);
              thumbnailUrlsRef.current.push(thumbUrl);
              newThumbnails.set(vf.path, thumbUrl);
              setVideoThumbnails(prev => new Map([...prev, [vf.path, thumbUrl]]));
            } catch (err) {
              console.error('Failed to generate thumbnail:', vf.name);
            }
          }
        }
      };
      
      generateThumbnails();
    }
  }, [multiVideoMode, videoFiles.length]);

  useEffect(() => {
    return () => {
      videoSlots.forEach(slot => {
        if (slot?.url) URL.revokeObjectURL(slot.url);
      });
      thumbnailUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const usedVideoPaths = new Set(videoSlots.filter(s => s !== null).map(s => s!.file.path));
  const availableVideos = videoFiles.filter(vf => !usedVideoPaths.has(vf.path));

  if (multiVideoMode) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex items-center justify-between p-3 bg-gray-900 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
            >
              Close
            </button>
            <button
              onClick={() => setMultiVideoMode(false)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition"
            >
              Single View
            </button>
          </div>
          <span className="text-white font-medium">Multi-Video Mode ({activeSlotCount}/4 videos)</span>
        </div>

        <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-1 p-1 bg-gray-800">
          {videoSlots.map((slot, index) => (
            <div key={index} className="relative bg-gray-900 rounded overflow-hidden flex flex-col">
              {slot ? (
                <>
                  <video
                    ref={el => { multiVideoRefs.current[index] = el; }}
                    src={slot.url}
                    controls
                    className="flex-1 w-full object-contain"
                    onLoadedMetadata={(e) => {
                      (e.target as HTMLVideoElement).playbackRate = slot.speed;
                    }}
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => removeVideoFromSlot(index)}
                      className="p-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-2 bg-gray-800 flex items-center gap-2">
                    <span className="text-white text-xs truncate flex-1">{slot.file.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400 text-xs">{slot.speed}x</span>
                      <input
                        type="range"
                        min="0.2"
                        max="5"
                        step="0.05"
                        value={slot.speed}
                        onChange={(e) => updateSlotSpeed(index, parseFloat(e.target.value))}
                        className="w-20 h-1 accent-blue-500"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col bg-gray-800 min-h-0">
                  <div className="p-2 text-center text-gray-400 text-sm border-b border-gray-700 flex-shrink-0">
                    Slot {index + 1} - Click a video to add
                  </div>
                  <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 min-h-0">
                    {availableVideos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 pb-2">
                        {availableVideos.map(vf => {
                          const thumbUrl = videoThumbnails.get(vf.path);
                          return (
                            <div
                              key={vf.path}
                              onClick={() => addVideoToSlot(index, vf)}
                              className="relative bg-gray-700 rounded cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all group"
                              style={{ paddingBottom: '56.25%' }}
                            >
                              <div className="absolute inset-0">
                                {thumbUrl ? (
                                  <img
                                    src={thumbUrl}
                                    alt={vf.name}
                                    className="w-full h-full object-contain bg-black rounded"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <svg className="w-6 h-6 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  </div>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="bg-black bg-opacity-50 rounded-full p-1">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  </div>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-1">
                                  <p className="text-white text-xs truncate">{vf.name}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        <p>No more videos available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 bg-gray-900 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
          >
            Close
          </button>
          <button
            onClick={onOpenFiles}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
          >
            Open Photos
          </button>
          <span className="text-white text-sm">
            {currentIndex + 1} / {totalFiles}
          </span>
          {file.type === 'video' && videoFiles.length > 1 && (
            <button
              onClick={() => {
                setMultiVideoMode(true);
                addVideoToSlot(0, file);
              }}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded transition text-sm"
            >
              Multi-Video (4)
            </button>
          )}
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

        {file.type === 'video' ? (
          <div className="flex items-center gap-3">
            <span className="text-white text-sm">Speed:</span>
            <div className="flex gap-1">
              {SPEED_PRESETS.map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-1 text-xs rounded transition ${
                    speed === s 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
            <input
              type="range"
              min="0.2"
              max="5"
              step="0.05"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-24 h-2 accent-blue-500"
            />
            <span className="text-blue-400 text-sm font-mono w-12">{speed.toFixed(2)}x</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-white text-sm">Zoom: {Math.round(zoom * 100)}%</span>
            <span className="text-gray-400 text-xs">(Mouse wheel)</span>
          </div>
        )}
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
            onLoadedMetadata={() => {
              if (videoRef.current) videoRef.current.playbackRate = speed;
            }}
          />
        )}
      </div>

      <div className="p-3 bg-gray-900 text-white text-center">
        <p className="text-sm">{file.name}</p>
      </div>
    </div>
  );
}
