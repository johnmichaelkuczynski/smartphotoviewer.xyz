import { useState, useEffect } from 'react';
import type { MediaFile, ViewMode, AppSettings, IndexingProgress, Cluster } from './types';
import { selectFolder, selectFile, loadMediaFilesFromDirectory, loadMediaFileFromHandle } from './services/fileSystemService';
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

  const handleOpenFolder = async () => {
    const dirHandle = await selectFolder();
    if (!dirHandle) return;

    const mediaFiles = await loadMediaFilesFromDirectory(dirHandle);
    setFiles(mediaFiles);
    setDisplayFiles(mediaFiles);
    setOriginalFiles(mediaFiles);
    setShowClusters(false);
    setEmbeddings(new Map());
    setIndexingError('');
    setViewMode({ type: 'grid', gridColumns: 10 });
  };

  const handleOpenFile = async () => {
    const fileHandle = await selectFile();
    if (!fileHandle) return;

    const mediaFile = await loadMediaFileFromHandle(fileHandle);
    if (!mediaFile) return;

    setFiles([mediaFile]);
    setDisplayFiles([mediaFile]);
    setViewerFile(mediaFile);
    setViewerIndex(0);
    setViewMode({ type: 'viewer' });
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

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <Toolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenFolder={handleOpenFolder}
        onOpenFile={handleOpenFile}
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
              <p className="text-sm">Open a folder or file to get started</p>
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
                      className="grid gap-2"
                      style={{
                        gridTemplateColumns: `repeat(${viewMode.gridColumns || 10}, minmax(0, 1fr))`,
                      }}
                    >
                      {cluster.files.map((file) => {
                        const url = file.thumbnailUrl || URL.createObjectURL(file.file);
                        return (
                          <div
                            key={file.path}
                            className="relative aspect-square bg-gray-800 rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                            onClick={() => handleFileClick(file, files.indexOf(file))}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              handleContextMenu(file, files.indexOf(file), e);
                            }}
                          >
                            <img
                              src={url}
                              alt={file.name}
                              className="w-full h-full object-cover"
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
