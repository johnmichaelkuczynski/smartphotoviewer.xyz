import type { AppSettings } from '../types';

interface SettingsProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  onClose: () => void;
}

export function Settings({ settings, onSettingsChange, onClose }: SettingsProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">AI Features</label>
              <p className="text-gray-400 text-sm">Enable local AI-powered grouping and similarity search</p>
            </div>
            <button
              onClick={() => onSettingsChange({ ...settings, aiEnabled: !settings.aiEnabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                settings.aiEnabled ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  settings.aiEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="text-white font-medium block mb-2">
              Slideshow Interval (seconds)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={settings.slideshowInterval / 1000}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  slideshowInterval: parseInt(e.target.value) * 1000,
                })
              }
              className="w-full bg-gray-700 text-white rounded px-3 py-2"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Skip Videos in Slideshow</label>
              <p className="text-gray-400 text-sm">Only show images during slideshow</p>
            </div>
            <button
              onClick={() =>
                onSettingsChange({ ...settings, slideshowSkipVideos: !settings.slideshowSkipVideos })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                settings.slideshowSkipVideos ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  settings.slideshowSkipVideos ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
