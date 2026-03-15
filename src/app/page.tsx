"use client";

import { useEffect, useRef } from "react";

export default function Home() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  };

  return (
    <>
      <aside className="w-64 bg-[#121214] border-r border-zinc-800 flex flex-col hidden md:flex transition-all duration-300">
        <div className="p-4">
          <button className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-3 rounded-xl transition-colors font-semibold shadow-[0_0_15px_rgba(234,88,12,0.3)] tracking-wide">
            <i className="ph ph-plus-circle text-xl"></i>
            NEW PERSONA
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pt-2">
          <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-3">
            Headquarters
          </h3>
          <ul className="space-y-2 mb-8">
            <li className="p-3 bg-zinc-800/80 border border-orange-500/30 rounded-lg cursor-pointer text-sm flex items-center gap-3 text-orange-400 transition-colors shadow-[0_0_10px_rgba(234,88,12,0.1)]">
              <i className="ph ph-fire text-xl"></i>
              <span className="font-medium">The Forge</span>
            </li>
            <li className="p-3 hover:bg-zinc-800/50 rounded-lg cursor-pointer text-sm flex items-center gap-3 text-zinc-400 hover:text-zinc-200 transition-colors group">
              <i className="ph ph-flask text-xl group-hover:text-amber-400 transition-colors"></i>
              <span className="font-medium">The Lab</span>
            </li>
            <li className="p-3 hover:bg-zinc-800/50 rounded-lg cursor-pointer text-sm flex items-center gap-3 text-zinc-400 hover:text-zinc-200 transition-colors group">
              <i className="ph ph-tent text-xl group-hover:text-red-400 transition-colors"></i>
              <span className="font-medium">The Barracks</span>
            </li>
          </ul>

          <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-3">
            Recent Activity
          </h3>
          <ul className="space-y-1">
            <li className="p-2 hover:bg-zinc-800/50 rounded-lg cursor-pointer text-sm flex items-center gap-2 text-zinc-400 hover:text-zinc-300 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Cyberpunk Bartender
            </li>
            <li className="p-2 hover:bg-zinc-800/50 rounded-lg cursor-pointer text-sm flex items-center gap-2 text-zinc-400 hover:text-zinc-300 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> 1920s Detective (Embedded)
            </li>
            <li className="p-2 hover:bg-zinc-800/50 rounded-lg cursor-pointer text-sm flex items-center gap-2 text-zinc-400 hover:text-zinc-300 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Fantasy Merchant
            </li>
          </ul>
        </div>

        <div className="p-4 border-t border-zinc-800">
          <button className="w-full flex items-center gap-3 p-2 hover:bg-zinc-800/50 rounded-lg transition-colors text-sm text-zinc-400 hover:text-zinc-200">
            <i className="ph ph-gear-six text-lg"></i> System Config
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-y-auto bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyNzI3MmEiIGZpbGwtb3BhY2l0eT0iMC4xNSI+PHBhdGggZD0iTTAgMGg0MHY0MEgwVjB6bTIwIDIwaDIwdjIwSDIWMjB6TTAgMjBoMjB2MjBIMFYyMHoyMCAwaDIwdjIwSDIwVjB6Ii8+PC9nPjwvZz48L3N2Zz4=')]">

        <header className="absolute top-0 left-0 right-0 md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-[#09090b]">
          <i className="ph ph-list text-2xl cursor-pointer text-zinc-400"></i>
          <span className="font-['Rajdhani'] text-xl font-bold bg-gradient-to-r from-orange-400 via-red-500 to-amber-400 bg-clip-text text-transparent">PersonaForge</span>
          <i className="ph ph-plus text-2xl cursor-pointer text-zinc-400"></i>
        </header>

        <div className="w-full max-w-4xl flex flex-col items-center animate-fade-in-up pt-12 md:pt-0">

          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(234,88,12,0.3)] transform rotate-3 border border-orange-400/20">
              <i className="ph ph-fire text-4xl text-white"></i>
            </div>
            <h1 className="font-[var(--font-rajdhani)] text-5xl md:text-6xl font-bold mb-3 tracking-tight">
              Welcome to <span className="bg-gradient-to-r from-orange-400 via-red-500 to-amber-400 bg-clip-text text-transparent">PersonaForge</span>
            </h1>
            <p className="text-xl md:text-2xl text-zinc-400 font-light mt-4">Who do you want to make today?</p>
          </div>

          <div className="w-full mb-8 relative">
            <div className="glass-panel rounded-2xl p-2.5 flex items-end gap-2.5 border border-zinc-800 transition-all forge-input-focus focus-within:ring-2 focus-within:ring-orange-500/50 focus-within:border-orange-500/50">

              <button className="p-3.5 text-zinc-400 hover:text-orange-400 hover:bg-zinc-800 rounded-xl transition-colors tooltip relative group" title="Upload base photo">
                <i className="ph ph-image text-2xl"></i>
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Describe the persona, or upload an image to embed them into..."
                className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 resize-none outline-none py-3 px-2 max-h-60 overflow-y-auto focus:ring-0 leading-relaxed text-lg"
                onInput={handleTextareaInput}
              ></textarea>

              <button className="p-3.5 text-zinc-400 hover:text-orange-400 hover:bg-zinc-800 rounded-xl transition-colors" title="Tweak persona parameters">
                <i className="ph ph-sliders-horizontal text-2xl"></i>
              </button>

              <button className="p-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition-colors shadow-[0_0_15px_rgba(234,88,12,0.3)] mb-0.5 group">
                <i className="ph ph-paper-plane-right text-2xl font-bold group-hover:translate-x-0.5 transition-transform"></i>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full text-left">
            <button className="glass-panel p-5 rounded-xl hover:bg-zinc-800/60 transition-all group flex flex-col gap-2.5 border border-zinc-800 hover:border-orange-500/50 shadow-lg hover:shadow-orange-500/10">
              <div className="flex items-center gap-3 text-orange-400 font-semibold text-lg">
                <i className="ph ph-hammer text-2xl group-hover:rotate-12 transition-transform"></i>
                Forge a Concept
              </div>
              <span className="text-base text-zinc-400 font-light leading-relaxed">Describe a character's role, setting, and personality. The Forge will hammer out a complete, detailed AI persona profile.</span>
            </button>

            <button className="glass-panel p-5 rounded-xl hover:bg-zinc-800/60 transition-all group flex flex-col gap-2.5 border border-zinc-800 hover:border-red-500/50 shadow-lg hover:shadow-red-500/10">
              <div className="flex items-center gap-3 text-red-400 font-semibold text-lg">
                <i className="ph ph-image-square text-2xl group-hover:scale-110 transition-transform"></i>
                Embed into Photo
              </div>
              <span className="text-base text-zinc-400 font-light leading-relaxed">Provide a generated persona and a base photograph. The Lab will seamlessly integrate the character into the scene.</span>
            </button>
          </div>

          <div className="text-center mt-16 max-w-xl pb-10">
            <p className="text-xs text-zinc-600 leading-relaxed">PersonaForge utilizes advanced neural architecture. It may generate unexpected character traits or alignment artifacts in complex images. Always verify critical output parameters.</p>
          </div>

        </div>
      </main>
    </>
  );
}
