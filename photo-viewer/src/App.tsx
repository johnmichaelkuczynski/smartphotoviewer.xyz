import { useState, useEffect } from 'react';
import type { MediaFile, ViewMode, AppSettings, IndexingProgress, Cluster } from './types';
import { 
  selectFolder, 
  loadMediaFilesFromDirectory, 
  selectFolderViaInput,
  processFilesToMediaFiles
} from './services/fileSystemService';
import { initializeModel, batchGenerateEmbeddings } from './services/embeddingService';
import { clusterByTheme, sortBySimilarity } from './services/clusteringService';
import { GridView } from './components/GridView';
import { Viewer } from './components/Viewer';
import { FilmstripView } from './components/FilmstripView';
import { Slideshow } from './components/Slideshow';
import { Settings } from './components/Settings';
import { Toolbar } from './components/Toolbar';
import { ContextMenu } from './components/ContextMenu';

function App() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [displayFiles, setDisplayFiles] = useState<MediaFile[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>({ type: 'grid', gridColumns: 10 });
  const [viewerFile, setViewerFile] = useState<MediaFile | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: MediaFile; index: number } | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [showClusters, setShowClusters] = useState(false);
  const [embeddings, setEmbeddings] = useState<Map<string, number[]>>(new Map());
  const [indexingProgress, setIndexingProgress] = useState<IndexingProgress>({
    total: 0,
    processed: 0,
    isIndexing: false,
  });
  const [indexingError, setIndexingError] = useState<string>('');
  const [originalFiles, setOriginalFiles] = useState<MediaFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>({
    aiEnabled: true,
    slideshowInterval: 3000,
    slideshowSkipVideos: false,
    theme: 'dark',
  });

  useEffect(() => {
    if (settings.aiEnabled && files.length > 0 && embeddings.size === 0) {
      startIndexing();
    }
  }, [files, settings.aiEnabled]);

  const startIndexing = async () => {
    try {
      setIndexingError('');
      await initializeModel();
      
      setIndexingProgress({
        total: files.length,
        processed: 0,
        isIndexing: true,
      });

      const newEmbeddings = await batchGenerateEmbeddings(
        files,
        (processed, total, _succeeded, _failed) => {
          setIndexingProgress({
            total,
            processed,
            isIndexing: processed < total,
          });
        },
        (error) => {
          setIndexingError(`AI indexing error: ${error.message}. Some features may be limited.`);
        }
      );

      setEmbeddings(newEmbeddings);
      
      if (newEmbeddings.size === 0) {
        setIndexingError('Failed to generate any embeddings. AI features will not be available.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setIndexingError(`Failed to initialize AI: ${message}. AI features disabled.`);
      console.error('Failed to index files:', error);
      setIndexingProgress({
        total: 0,
        processed: 0,
        isIndexing: false,
      });
    }
  };

  const calculateOptimalColumns = (count: number): number => {
    if (count <= 1) return 1;
    if (count <= 2) return 2;
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    if (count <= 9) return 3;
    if (count <= 12) return 4;
    if (count <= 16) return 4;
    if (count <= 20) return 5;
    if (count <= 30) return 6;
    if (count <= 42) return 7;
    if (count <= 56) return 8;
    if (count <= 72) return 9;
    return 10;
  };

  const loadMediaFiles = (mediaFiles: MediaFile[]) => {
    const optimalColumns = calculateOptimalColumns(mediaFiles.length);
    setFiles(mediaFiles);
    setDisplayFiles(mediaFiles);
    setOriginalFiles(mediaFiles);
    setShowClusters(false);
    setEmbeddings(new Map());
    setIndexingError('');
    setViewMode({ type: 'grid', gridColumns: optimalColumns });
  };

  const handleOpenFolder = async () => {
    let mediaFiles: MediaFile[] = [];
    
    try {
      const dirHandle = await selectFolder();
      if (dirHandle) {
        mediaFiles = await loadMediaFilesFromDirectory(dirHandle);
      }
    } catch (err) {
      console.log('File System Access API not available, using fallback');
    }
    
    if (mediaFiles.length === 0) {
      const rawFiles = await selectFolderViaInput();
      if (rawFiles.length === 0) return;
      mediaFiles = processFilesToMediaFiles(rawFiles);
    }
    
    if (mediaFiles.length === 0) {
      alert('No supported media files found in the selected folder.');
      return;
    }
    
    loadMediaFiles(mediaFiles);
  };


  const handleFileClick = (file: MediaFile, index: number) => {
    setViewerFile(file);
    setViewerIndex(index);
    setViewMode({ type: 'viewer' });
  };

  const handleViewerNext = () => {
    const nextIndex = (viewerIndex + 1) % displayFiles.length;
    setViewerIndex(nextIndex);
    setViewerFile(displayFiles[nextIndex]);
  };

  const handleViewerPrevious = () => {
    const prevIndex = (viewerIndex - 1 + displayFiles.length) % displayFiles.length;
    setViewerIndex(prevIndex);
    setViewerFile(displayFiles[prevIndex]);
  };

  const handleGroupByTheme = () => {
    if (embeddings.size === 0) {
      alert('AI indexing is not complete. Please wait or check for errors.');
      return;
    }

    try {
      const newClusters = clusterByTheme(files, embeddings);
      setClusters(newClusters);
      setShowClusters(true);
    } catch (error) {
      alert('Failed to group by theme. Please try again.');
      console.error('Clustering error:', error);
    }
  };

  const handleFindSimilar = (file: MediaFile) => {
    if (embeddings.size === 0) {
      alert('AI indexing is not complete. Please wait or check for errors.');
      return;
    }

    try {
      const sortedFiles = sortBySimilarity(file, files, embeddings);
      setDisplayFiles(sortedFiles);
      setShowClusters(false);
      setViewMode({ type: 'grid', gridColumns: 10 });
    } catch (error) {
      alert('Failed to find similar images. Please try again.');
      console.error('Similarity search error:', error);
    }
  };

  const handleResetView = () => {
    setDisplayFiles(originalFiles.length > 0 ? originalFiles : files);
    setShowClusters(false);
    setViewMode({ type: 'grid', gridColumns: 10 });
  };

  const handleContextMenu = (file: MediaFile, index: number, event: React.MouseEvent) => {
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      file,
      index,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    const droppedFiles: File[] = [];

    const processEntry = async (entry: FileSystemEntry): Promise<void> => {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        return new Promise((resolve) => {
          fileEntry.file((file) => {
            droppedFiles.push(file);
            resolve();
          });
        });
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        const reader = dirEntry.createReader();
        
        return new Promise((resolve) => {
          const readEntries = () => {
            reader.readEntries(async (entries) => {
              if (entries.length === 0) {
                resolve();
                return;
              }
              for (const ent of entries) {
                await processEntry(ent);
              }
              readEntries();
            });
          };
          readEntries();
        });
      }
    };

    const promises: Promise<void>[] = [];
    for (let i = 0; i < items.length; i++) {
      const entry = items[i].webkitGetAsEntry();
      if (entry) {
        promises.push(processEntry(entry));
      }
    }

    await Promise.all(promises);
    console.log(`Dropped ${droppedFiles.length} files`);

    if (droppedFiles.length > 0) {
      const mediaFiles = processFilesToMediaFiles(droppedFiles);
      
      if (mediaFiles.length === 0) {
        alert('No supported media files found in the dropped items.');
        return;
      }

      loadMediaFiles(mediaFiles);
    }
  };

  return (
    <div 
      className="h-screen flex flex-col bg-gray-900 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-blue-500 bg-opacity-30 border-4 border-dashed border-blue-400 flex items-center justify-center pointer-events-none">
          <div className="text-center text-white">
            <svg className="w-20 h-20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-2xl font-semibold">Drop folder or files here</p>
          </div>
        </div>
      )}
      <Toolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenFolder={handleOpenFolder}
        onGroupByTheme={handleGroupByTheme}
        onSlideshow={() => setShowSlideshow(true)}
        onSettings={() => setShowSettings(true)}
        onResetView={handleResetView}
        aiEnabled={settings.aiEnabled}
        hasFiles={files.length > 0}
        isIndexing={indexingProgress.isIndexing}
        indexingProgress={indexingProgress}
        indexingError={indexingError}
      />

      <div className="flex-1 overflow-hidden">
        {files.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <svg className="w-24 h-24 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h2 className="text-2xl font-semibold mb-2">No Files Loaded</h2>
              <p className="text-sm mb-4">Drag and drop a folder here</p>
              <button
                onClick={handleOpenFolder}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-lg"
              >
                Open Photos
              </button>
              <p className="text-xs text-gray-500 mt-3">Browse to folder, then Ctrl+A to select all</p>
            </div>
          </div>
        ) : (
          <>
            {viewMode.type === 'grid' && !showClusters && (
              <GridView
                files={displayFiles}
                columns={viewMode.gridColumns || 10}
                onFileClick={handleFileClick}
                onContextMenu={handleContextMenu}
                onColumnsChange={(cols) => setViewMode({ ...viewMode, gridColumns: cols })}
              />
            )}

            {viewMode.type === 'grid' && showClusters && (
              <div className="h-full overflow-auto bg-gray-900 p-4">
                {clusters.map((cluster) => (
                  <div key={cluster.id} className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="text-xl font-semibold text-white">{cluster.label}</h3>
                      <span className="text-gray-400 text-sm">({cluster.files.length} items)</span>
                    </div>
                    <div
                      className="grid gap-1"
                      style={{
                        gridTemplateColumns: `repeat(${viewMode.gridColumns || 10}, minmax(0, 1fr))`,
                      }}
                    >
                      {cluster.files.map((file) => {
                        const url = file.thumbnailUrl || URL.createObjectURL(file.file);
                        return (
                          <div
                            key={file.path}
                            className="relative bg-gray-800 rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all flex items-center justify-center"
                            onClick={() => handleFileClick(file, files.indexOf(file))}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              handleContextMenu(file, files.indexOf(file), e);
                            }}
                          >
                            <img
                              src={url}
                              alt={file.name}
                              className="max-w-full max-h-full object-contain"
                              loading="lazy"
                            />
                            {file.type === 'video' && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                <svg className="w-12 h-12 text-white opacity-75" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {viewMode.type === 'filmstrip' && (
              <FilmstripView
                files={displayFiles}
                currentIndex={viewerIndex}
                onFileClick={(_, index) => setViewerIndex(index)}
                thumbnailSize={viewMode.filmstripSize || 'medium'}
                onContextMenu={handleContextMenu}
                onIndexChange={setViewerIndex}
              />
            )}

            {viewMode.type === 'viewer' && viewerFile && (
              <Viewer
                file={viewerFile}
                currentIndex={viewerIndex}
                totalFiles={displayFiles.length}
                onNext={handleViewerNext}
                onPrevious={handleViewerPrevious}
                onClose={() => setViewMode({ type: 'grid', gridColumns: 10 })}
              />
            )}
          </>
        )}
      </div>

      {showSlideshow && files.length > 0 && (
        <Slideshow
          files={files}
          interval={settings.slideshowInterval}
          skipVideos={settings.slideshowSkipVideos}
          onClose={() => setShowSlideshow(false)}
        />
      )}

      {showSettings && (
        <Settings
          settings={settings}
          onSettingsChange={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onFindSimilar={() => handleFindSimilar(contextMenu.file)}
          onClose={() => setContextMenu(null)}
          aiEnabled={settings.aiEnabled}
        />
      )}
    </div>
  );
}

export default App;
