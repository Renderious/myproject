import { create } from 'zustand';

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
  setActiveCharacter: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
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
  setActiveCharacter: (id) => set({ activeCharacterId: id }),
}));
