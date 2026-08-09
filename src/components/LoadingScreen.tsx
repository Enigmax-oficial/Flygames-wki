import React, { useEffect, useState } from 'react';
import { Sparkles, Library, Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing Aetheria...');
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        // Increment by a random natural step
        const step = Math.floor(Math.random() * 15) + 10;
        const next = prev + step;
        return next > 100 ? 100 : next;
      });
    }, 120);

    return () => clearInterval(progressInterval);
  }, []);

  useEffect(() => {
    if (progress < 25) {
      setLoadingText('Connecting to Firebase Database...');
    } else if (progress < 50) {
      setLoadingText('Loading Bedrock Models & Textures...');
    } else if (progress < 75) {
      setLoadingText('Caching 3D Entity Configurations...');
    } else if (progress < 95) {
      setLoadingText('Synchronizing community discussions...');
    } else {
      setLoadingText('Starting Aetheria Wiki...');
    }

    if (progress >= 100) {
      const fadeTimeout = setTimeout(() => {
        setFadeOut(true);
        const completeTimeout = setTimeout(() => {
          onComplete();
        }, 300); // fade out transition duration
        return () => clearTimeout(completeTimeout);
      }, 200); // small delay after 100% to let user see "Ready!"
      return () => clearTimeout(fadeTimeout);
    }
  }, [progress, onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-50 bg-[#070a13] flex flex-col items-center justify-center transition-opacity duration-300 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background radial highlight */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.04)_0%,transparent_65%)] pointer-events-none" />

      <div className="relative w-full max-w-sm px-6 flex flex-col items-center text-center space-y-8">
        
        {/* Animated Icon Container */}
        <div className="relative">
          {/* Pulsating outer glowing aura */}
          <div className="absolute -inset-1 rounded-2xl bg-sky-500/10 blur-xl animate-pulse" />
          
          <div className="relative w-16 h-16 rounded-2xl bg-[#0d1527] border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-2xl">
            <Library className="w-8 h-8 animate-pulse text-sky-400" />
            
            {/* Corner visual accents */}
            <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-sky-400/40" />
            <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-sky-400/40" />
            <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-sky-400/40" />
            <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-sky-400/40" />
          </div>
        </div>

        {/* Brand & Subtitle */}
        <div className="space-y-1.5">
          <h1 className="text-xl font-black tracking-widest text-white uppercase font-sans flex items-center justify-center gap-2">
            <span>Aetheria Wiki</span>
            <Sparkles className="w-4 h-4 text-amber-400 animate-bounce" />
          </h1>
          <p className="text-[10px] text-[#475569] font-mono uppercase tracking-wider">
            Minecraft Bedrock Engine v1.4.0
          </p>
        </div>

        {/* Progress & Bar */}
        <div className="w-full space-y-3">
          {/* Progress bar container */}
          <div className="h-1.5 w-full bg-[#0d1527] border border-[#1e293b] rounded-full overflow-hidden p-[1px]">
            <div 
              className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-150 ease-out shadow-[0_0_8px_rgba(56,189,248,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Loader labels */}
          <div className="flex items-center justify-between text-[11px] font-mono text-[#64748b] px-1">
            <span className="flex items-center gap-1.5 truncate max-w-[220px]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400 shrink-0" />
              <span className="truncate">{loadingText}</span>
            </span>
            <span className="font-bold text-sky-400">{progress}%</span>
          </div>
        </div>

        {/* Tip overlay */}
        <div className="pt-4 border-t border-[#1e293b]/40 w-full">
          <p className="text-[10px] text-[#475569] italic leading-normal max-w-xs mx-auto">
            Tip: You can use the search bar to filter by categories, blocks, crafting items, or custom interactive models.
          </p>
        </div>

      </div>
    </div>
  );
};
