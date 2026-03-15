export function AnimatedHammer() {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Anvil */}
        <div className="absolute bottom-2 text-zinc-600">
          <svg width="40" height="20" viewBox="0 0 40 20" fill="currentColor">
            <path d="M5 20h30l-5-10H10L5 20zM0 10h40V5H0v5zM5 0h30v5H5z" />
          </svg>
        </div>

        {/* Hammer */}
        <div className="absolute top-0 right-2 origin-bottom-right animate-[hammer_1s_ease-in-out_infinite] text-orange-500">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="rotate-[-45deg]">
            <path d="M3 21h18v2H3zm5-5H2v-4h6v4zm2-2h12v-2H10v2zm0-4h8V8h-8v2zm0-4h4V4h-4v2z" />
          </svg>
        </div>

        {/* Sparks */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-orange-400 rounded-full animate-[spark-1_1s_ease-out_infinite]"></div>
          <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-amber-400 rounded-full animate-[spark-2_1s_ease-out_infinite] delay-100"></div>
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-red-400 rounded-full animate-[spark-3_1s_ease-out_infinite] delay-200"></div>
        </div>
      </div>
      <span className="text-orange-400 text-sm font-medium mt-2 animate-pulse">Forging...</span>
    </div>
  );
}
