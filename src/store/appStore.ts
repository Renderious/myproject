import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type View = 'forge' | 'lab' | 'barracks';

export interface Settings {
  ollamaUrl: string;
  sdUrl: string;
  model: string;
}

export interface CharacterCard {
  id: string;
  name: string;
  description: string;
  personality: string;
  scenario: string;
  first_mes: string;
  mes_example: string;
  creator_notes: string;
  system_prompt: string;
  post_history_instructions: string;
  alternate_greetings: string[];
  character_book?: unknown;
  avatarUrl?: string; // Stored as a blob URL or base64 for now
}

interface AppState {
  currentView: View;
  settings: Settings;
  characters: CharacterCard[];
  activeCharacterId: string | null;

  setCurrentView: (view: View) => void;
  updateSettings: (newSettings: Partial<Settings>) => void;
  addCharacter: (character: CharacterCard) => void;
  updateCharacterAvatar: (id: string, avatarUrl: string) => void;
  setActiveCharacter: (id: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentView: 'forge',
      settings: {
        ollamaUrl: 'http://localhost:11434',
        sdUrl: 'http://127.0.0.1:7860',
        model: '', // Will be populated from the API
      },
      characters: [],
      activeCharacterId: null,

      setCurrentView: (view) => set({ currentView: view }),
      updateSettings: (newSettings) =>
        set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      addCharacter: (character) =>
        set((state) => ({ characters: [...state.characters, character] })),
      updateCharacterAvatar: (id, avatarUrl) =>
        set((state) => ({
          characters: state.characters.map((char) =>
            char.id === id ? { ...char, avatarUrl } : char
          ),
        })),
      setActiveCharacter: (id) => set({ activeCharacterId: id }),
    }),
    {
      name: 'persona-forge-storage', // name of the item in the storage (must be unique)
      partialize: (state) => ({ characters: state.characters }), // only persist characters
    }
  )
);
