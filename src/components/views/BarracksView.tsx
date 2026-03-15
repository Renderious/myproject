import { useAppStore } from "@/store/appStore";

export function BarracksView() {
  const { characters, setActiveCharacter, setCurrentView, activeCharacterId } = useAppStore();

  const handleSelectCharacter = (id: string) => {
    setActiveCharacter(id);
    setCurrentView('lab');
  };

  if (characters.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 animate-fade-in-up">
        <div className="w-20 h-20 mx-auto mb-6 bg-zinc-800/80 rounded-2xl flex items-center justify-center border border-zinc-700/50">
          <i className="ph ph-tent text-4xl text-red-500/50"></i>
        </div>
        <h2 className="text-2xl font-bold text-zinc-300 mb-2">The Barracks are Empty</h2>
        <p className="text-zinc-500">Head to the Forge to create your first persona.</p>
        <button
           onClick={() => setCurrentView('forge')}
           className="mt-6 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(234,88,12,0.3)] flex items-center gap-2"
        >
            <i className="ph ph-fire text-xl"></i> Go to Forge
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col animate-fade-in-up">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-zinc-800 pb-6 mb-6 shrink-0">
        <div>
           <h1 className="font-[var(--font-rajdhani)] text-4xl font-bold text-zinc-100 flex items-center gap-3">
             <i className="ph ph-tent text-red-500"></i> The Barracks
           </h1>
           <p className="text-zinc-500 mt-2">Manage your generated personas.</p>
        </div>
        <div className="text-zinc-600 text-sm font-bold bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
           {characters.length} {characters.length === 1 ? 'Persona' : 'Personas'}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pb-12 pr-2 hide-scrollbar">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {characters.map((char) => (
            <div
              key={char.id}
              onClick={() => handleSelectCharacter(char.id)}
              className={`group cursor-pointer rounded-2xl border transition-all duration-300 relative overflow-hidden glass-panel flex flex-col h-64 ${
                 activeCharacterId === char.id
                 ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                 : 'border-zinc-800 hover:border-red-500/50 hover:shadow-lg'
              }`}
            >
              {/* Image Area */}
              <div className="w-full h-40 bg-zinc-900 shrink-0 relative overflow-hidden">
                {char.avatarUrl ? (
                  <img
                     src={char.avatarUrl}
                     alt={char.name}
                     className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                    <i className="ph ph-user text-5xl text-zinc-700 transition-transform duration-500 group-hover:scale-110 group-hover:text-red-500/50"></i>
                  </div>
                )}

                {/* Active Indicator */}
                {activeCharacterId === char.id && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,1)] border border-amber-200"></div>
                )}

                {/* Hover overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
              </div>

              {/* Info Area */}
              <div className="p-4 flex-1 flex flex-col justify-end relative z-10 bg-zinc-950/80 group-hover:bg-zinc-900/90 transition-colors">
                <h3 className="font-bold text-zinc-100 text-lg truncate group-hover:text-red-400 transition-colors">{char.name}</h3>
                <p className="text-xs text-zinc-500 line-clamp-2 mt-1 flex-1 leading-relaxed">
                  {char.description || char.personality || "No description available."}
                </p>

                {/* Action hint overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-red-600 text-white text-xs font-bold text-center py-1 translate-y-full group-hover:translate-y-0 transition-transform flex items-center justify-center gap-1">
                   <i className="ph ph-flask"></i> To Lab
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
