"use client";

import { useRef } from "react";

import { useState } from "react";
import { useAppStore } from "@/store/appStore";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { ForgeView } from "@/components/views/ForgeView";
import { LabView } from "@/components/views/LabView";
import { BarracksView } from "@/components/views/BarracksView";

export default function Home() {
  const { currentView, setCurrentView, characters } = useAppStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-zinc-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#121214] border-r border-zinc-800 flex-col hidden md:flex transition-all duration-300">
        <div className="p-4">
          <button
            onClick={() => setCurrentView('forge')}
            className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-3 rounded-xl transition-colors font-semibold shadow-[0_0_15px_rgba(234,88,12,0.3)] tracking-wide"
          >
            <i className="ph ph-plus-circle text-xl"></i>
            NEW PERSONA
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pt-2">
          <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-3">
            Headquarters
          </h3>
          <ul className="space-y-2 mb-8">
            <li
              onClick={() => setCurrentView('forge')}
              className={`p-3 rounded-lg cursor-pointer text-sm flex items-center gap-3 transition-colors ${currentView === 'forge' ? 'bg-zinc-800/80 border border-orange-500/30 text-orange-400 shadow-[0_0_10px_rgba(234,88,12,0.1)]' : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'}`}
            >
              <i className={`ph ph-fire text-xl ${currentView === 'forge' ? '' : 'group-hover:text-orange-400'}`}></i>
              <span className="font-medium">The Forge</span>
            </li>
            <li
              onClick={() => setCurrentView('lab')}
              className={`p-3 rounded-lg cursor-pointer text-sm flex items-center gap-3 transition-colors ${currentView === 'lab' ? 'bg-zinc-800/80 border border-amber-500/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]' : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 group'}`}
            >
              <i className={`ph ph-flask text-xl ${currentView === 'lab' ? '' : 'group-hover:text-amber-400 transition-colors'}`}></i>
              <span className="font-medium">The Lab</span>
            </li>
            <li
              onClick={() => setCurrentView('barracks')}
              className={`p-3 rounded-lg cursor-pointer text-sm flex items-center gap-3 transition-colors ${currentView === 'barracks' ? 'bg-zinc-800/80 border border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 group'}`}
            >
              <i className={`ph ph-tent text-xl ${currentView === 'barracks' ? '' : 'group-hover:text-red-400 transition-colors'}`}></i>
              <span className="font-medium">The Barracks</span>
            </li>
          </ul>

          {characters.length > 0 && (
            <>
              <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-3">
                Recent Personas
              </h3>
              <ul className="space-y-1">
                {characters.slice(-3).map((char) => (
                  <li key={char.id} className="p-2 hover:bg-zinc-800/50 rounded-lg cursor-pointer text-sm flex items-center gap-2 text-zinc-400 hover:text-zinc-300 transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> {char.name}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 p-2 hover:bg-zinc-800/50 rounded-lg transition-colors text-sm text-zinc-400 hover:text-zinc-200"
          >
            <i className="ph ph-gear-six text-lg"></i> System Config
          </button>
        </div>
      </aside>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/bgvid.mp4" type="video/mp4" />
        </video>

        {/* Gradient Overlay for bottom visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none z-0"></div>

        {/* Mobile Header */}
        <header className="absolute top-0 left-0 right-0 md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-[#09090b] z-50">
          <i className="ph ph-list text-2xl cursor-pointer text-zinc-400"></i>
          <span className="font-['Rajdhani'] text-xl font-bold bg-gradient-to-r from-orange-400 via-red-500 to-amber-400 bg-clip-text text-transparent">PersonaForge</span>
          <i className="ph ph-plus text-2xl cursor-pointer text-zinc-400" onClick={() => setCurrentView('forge')}></i>
        </header>

        <div className="relative z-10 flex-1 overflow-hidden flex flex-col items-center p-6 md:p-12 w-full">
          {currentView === 'forge' && <ForgeView />}
          {currentView === 'lab' && <LabView />}
          {currentView === 'barracks' && <BarracksView />}
        </div>
      </main>
    </div>
  );
}
