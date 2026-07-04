import { Sparkles } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] w-full gap-6 animate-in fade-in duration-500">
      {/* Premium animated spinner container */}
      <div className="relative flex items-center justify-center w-32 h-32">
        {/* Outer glowing rings */}
        <div className="absolute inset-0 rounded-full blur-2xl bg-indigo-500/20 animate-pulse" />
        
        {/* Rotating orbits */}
        <div className="absolute w-24 h-24 rounded-full border-[3px] border-transparent border-t-indigo-500 border-r-indigo-500/50 animate-[spin_3s_cubic-bezier(0.4,0,0.2,1)_infinite]" />
        <div className="absolute w-16 h-16 rounded-full border-[3px] border-transparent border-b-purple-500 border-l-purple-500/50 animate-[spin_2s_cubic-bezier(0.4,0,0.2,1)_infinite_reverse]" />
        
        {/* Inner pulsing core */}
        <div className="absolute w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-sm animate-ping" />
        
        {/* Center Icon */}
        <div className="w-12 h-12 rounded-full bg-background border border-border/50 flex items-center justify-center shadow-xl relative z-10 ring-4 ring-background">
          <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
        </div>
      </div>
      
      {/* Loading Text */}
      <div className="flex flex-col items-center gap-1.5 mt-2">
        <h3 className="text-lg font-heading font-semibold tracking-wide text-foreground bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 animate-pulse">
          Loading Workspace
        </h3>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-[bounce_1s_infinite_0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-[bounce_1s_infinite_150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-[bounce_1s_infinite_300ms]" />
        </div>
      </div>
    </div>
  );
}
