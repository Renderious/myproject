import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { Modal } from '@/components/Modal';

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { settings, updateSettings } = useAppStore();
  const [models, setModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local state for inputs before applying
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
      fetchModels(settings.ollamaUrl);
    }
  }, [isOpen, settings]);

  const fetchModels = async (url: string) => {
    setIsLoadingModels(true);
    setError(null);
    try {
      // Clean URL, ensuring no trailing slash
      const baseUrl = url.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/api/tags`);

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.models && Array.isArray(data.models)) {
        const modelNames = data.models.map((m: { name: string }) => m.name);
        setModels(modelNames);

        // Auto-select first model if none is currently selected in local state
        if (!localSettings.model && modelNames.length > 0) {
          setLocalSettings(prev => ({ ...prev, model: modelNames[0] }));
        }
      }
    } catch (err: unknown) {
      console.error("Error fetching Ollama models:", err);
      setError("Could not connect to Ollama. Is it running?");
      setModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleSave = () => {
    updateSettings(localSettings);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="System Configuration">
      <div className="space-y-5">

        {/* Ollama URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <i className="ph ph-brain text-orange-500"></i> Local LLM Server (Ollama)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={localSettings.ollamaUrl}
              onChange={(e) => setLocalSettings({...localSettings, ollamaUrl: e.target.value})}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-orange-500 transition-colors text-sm"
              placeholder="http://localhost:11434"
            />
            <button
              onClick={() => fetchModels(localSettings.ollamaUrl)}
              disabled={isLoadingModels}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition-colors border border-zinc-700 disabled:opacity-50"
              title="Refresh Models"
            >
              <i className={`ph ph-arrows-clockwise ${isLoadingModels ? 'animate-spin' : ''}`}></i>
            </button>
          </div>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <i className="ph ph-cpu text-orange-500"></i> Active Model
          </label>
          {error ? (
            <div className="text-red-400 text-xs bg-red-950/30 p-2 rounded-lg border border-red-900/50">
              <i className="ph ph-warning-circle mr-1"></i> {error}
            </div>
          ) : (
            <select
              value={localSettings.model}
              onChange={(e) => setLocalSettings({...localSettings, model: e.target.value})}
              disabled={isLoadingModels || models.length === 0}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-orange-500 transition-colors text-sm disabled:opacity-50 appearance-none"
            >
              {models.length === 0 ? (
                <option value="">No models found...</option>
              ) : (
                models.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))
              )}
            </select>
          )}
          <p className="text-xs text-zinc-600">Context window limits depend on the selected model&apos;s architecture.</p>
        </div>

        <div className="border-t border-zinc-800 my-4"></div>

        {/* Automatic1111 URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <i className="ph ph-image text-red-500"></i> Image Generation (Automatic1111)
          </label>
          <input
            type="text"
            value={localSettings.sdUrl}
            onChange={(e) => setLocalSettings({...localSettings, sdUrl: e.target.value})}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-red-500 transition-colors text-sm"
            placeholder="http://127.0.0.1:7860"
          />
        </div>

      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors shadow-[0_0_15px_rgba(234,88,12,0.3)] font-medium text-sm"
        >
          Save Configuration
        </button>
      </div>
    </Modal>
  );
}
