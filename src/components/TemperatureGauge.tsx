export function TemperatureGauge({ progress }: { progress: number }) {
  // Ensure progress is between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const heightPercent = clampedProgress * 100;

  let colorClass = "from-zinc-500 to-zinc-400";
  if (clampedProgress > 0.2) colorClass = "from-amber-600 to-amber-500";
  if (clampedProgress > 0.5) colorClass = "from-orange-600 to-orange-500";
  if (clampedProgress > 0.8) colorClass = "from-red-600 to-red-500";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-4 h-32 bg-zinc-900 rounded-full border border-zinc-700 overflow-hidden shadow-inner">
        {/* Thermometer Tube */}
        <div
          className={`absolute bottom-0 w-full bg-gradient-to-t ${colorClass} transition-all duration-1000 ease-out`}
          style={{ height: `${heightPercent}%` }}
        />

        {/* Tick Marks */}
        <div className="absolute inset-y-0 right-0 w-1 flex flex-col justify-between py-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-1 h-px bg-zinc-600"></div>
          ))}
        </div>
      </div>

      {/* Bulb */}
      <div className={`w-8 h-8 -mt-4 rounded-full bg-gradient-to-br ${colorClass} border-2 border-zinc-700 shadow-[0_0_10px_rgba(234,88,12,0.3)] transition-colors duration-1000 z-10`} />

      <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider mt-1">Heat</span>
    </div>
  );
}
