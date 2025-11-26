import type { ViewMode } from '../types';

interface ToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenFolder: () => void;
  onGroupByTheme: () => void;
  onSlideshow: () => void;
  onSettings: () => void;
  onResetView: () => void;
  aiEnabled: boolean;
  hasFiles: boolean;
  isIndexing: boolean;
  indexingProgress: { processed: number; total: number };
  indexingError: string;
}

export function Toolbar({
  viewMode,
  onViewModeChange,
  onOpenFolder,
  onGroupByTheme,
  onSlideshow,
  onSettings,
  onResetView,
  aiEnabled,
  hasFiles,
  isIndexing,
  indexingProgress,
  indexingError,
}: ToolbarProps) {
  return (
    <div className="bg-gray-800 border-b border-gray-700 p-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenFolder}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition font-medium"
            title="Browse to a folder, then Ctrl+A to select all photos/videos"
          >
            Open Photos
          </button>
        </div>

        {hasFiles && (
          <>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onViewModeChange({ type: 'grid', gridColumns: 10 })}
                className={`px-4 py-2 rounded transition ${
                  viewMode.type === 'grid'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() =>
                  onViewModeChange({ type: 'filmstrip', filmstripSize: 'medium' })
                }
                className={`px-4 py-2 rounded transition ${
                  viewMode.type === 'filmstrip'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                Filmstrip
              </button>
            </div>

            {viewMode.type === 'grid' && (
              <div className="flex items-center gap-2">
                <label className="text-white text-sm">Columns:</label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={viewMode.gridColumns || 10}
                  onChange={(e) =>
                    onViewModeChange({
                      ...viewMode,
                      gridColumns: parseInt(e.target.value),
                    })
                  }
                  className="w-20 px-2 py-1 bg-gray-700 text-white rounded"
                />
              </div>
            )}

            {viewMode.type === 'filmstrip' && (
              <div className="flex items-center gap-2">
                <label className="text-white text-sm">Thumbnail:</label>
                <select
                  value={viewMode.filmstripSize || 'medium'}
                  onChange={(e) =>
                    onViewModeChange({
                      ...viewMode,
                      filmstripSize: e.target.value as 'small' | 'medium' | 'large',
                    })
                  }
                  className="px-3 py-1 bg-gray-700 text-white rounded"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={onSlideshow}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
              >
                Slideshow
              </button>
              
              <button
                onClick={onResetView}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
              >
                Reset View
              </button>
              
              {aiEnabled && (
                <button
                  onClick={onGroupByTheme}
                  disabled={isIndexing}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition"
                >
                  Group by Theme (AI)
                </button>
              )}
            </div>
          </>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {isIndexing && (
            <div className="text-white text-sm bg-gray-700 px-3 py-1 rounded">
              Analyzing: {indexingProgress.processed} / {indexingProgress.total}
            </div>
          )}
          {indexingError && (
            <div 
              className="text-yellow-200 text-xs bg-yellow-800 bg-opacity-50 px-2 py-1 rounded cursor-help" 
              title={indexingError}
            >
              AI offline
            </div>
          )}
          <button
            onClick={onSettings}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
          >
            Settings
          </button>
        </div>
      </div>
    </div>
  );
}
