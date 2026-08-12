import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WikiPage, CategoryType } from '../types/wiki';
import { getPageCoverImage } from '../lib/assetHelper';
import { WikiIcon } from './WikiIcon';
import { Search, X, CornerDownLeft, Mic, MicOff, Volume2, AlertCircle } from 'lucide-react';
import { useVoiceSearch } from '../hooks/useVoiceSearch';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: WikiPage[];
  onSelectPage: (pageId: string) => void;
  initialVoiceSearch?: boolean;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  pages,
  onSelectPage,
  initialVoiceSearch = false,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<CategoryType | 'all'>('all');
  const hasAutoStartedRef = useRef(false);

  const handleVoiceResult = useCallback((text: string) => {
    setQuery(text);
  }, []);

  const {
    isListening,
    transcript,
    speechError,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    setSpeechError,
  } = useVoiceSearch({
    onResult: handleVoiceResult,
  });

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
      }
      if (e.key === 'Escape' && isOpen) {
        stopListening();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, stopListening]);

  // Auto start voice search ONCE when modal opens with initialVoiceSearch
  useEffect(() => {
    if (isOpen && initialVoiceSearch && isSupported && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      startListening();
    }
    if (!isOpen) {
      hasAutoStartedRef.current = false;
    }
  }, [isOpen, initialVoiceSearch, isSupported, startListening]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      setQuery('');
      setSpeechError(null);
    }
  }, [isOpen, stopListening, setSpeechError]);

  if (!isOpen) return null;

  const filteredPages = pages.filter((page) => {
    const matchesCategory = selectedCategoryFilter === 'all' || page.category === selectedCategoryFilter;
    const q = query.toLowerCase().trim();
    if (!q) return matchesCategory;

    const matchesTitle = page.title.toLowerCase().includes(q);
    const matchesNamespace = page.namespace.toLowerCase().includes(q);
    const matchesDesc = page.description.toLowerCase().includes(q);
    const matchesTags = page.tags?.some((t) => t.toLowerCase().includes(q));

    return matchesCategory && (matchesTitle || matchesNamespace || matchesDesc || matchesTags);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-16 px-4 bg-slate-950/80 backdrop-blur-md font-sans">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl w-full max-w-2xl shadow-2xl shadow-slate-950/80 overflow-hidden flex flex-col max-h-[85vh] text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#1e293b] bg-[#0b0f19] flex items-center gap-3 relative">
          <Search className="w-5 h-5 text-sky-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isListening ? "Listening... Speak item, mob or block name..." : "Search item name, mob, block, recipe or ID..."}
            className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none font-medium"
            autoFocus
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-500 hover:text-slate-200 p-1.5 rounded-lg hover:bg-[#1e293b] transition-colors"
              title="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Voice Search Button */}
          <button
            onClick={toggleListening}
            className={`p-2 rounded-xl border transition-all flex items-center justify-center shrink-0 cursor-pointer ${
              isListening
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse'
                : isSupported
                ? 'bg-[#1e293b] hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-400 border-slate-700 hover:border-emerald-500/40'
                : 'bg-[#1e293b] text-slate-600 border-slate-800 cursor-not-allowed'
            }`}
            title={
              !isSupported
                ? 'Voice search not supported in this browser'
                : isListening
                ? 'Listening... Click to stop voice search'
                : 'Search with your voice'
            }
            disabled={!isSupported}
          >
            {isListening ? (
              <Mic className="w-4 h-4 text-rose-400 animate-bounce" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => {
              stopListening();
              onClose();
            }}
            className="p-1 px-2.5 rounded-lg bg-[#1e293b] text-slate-400 hover:text-white border border-slate-700/60 text-xs font-mono font-semibold transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Live Speech Recognition Banner / Visualizer */}
        {isListening && (
          <div className="px-4 py-3 bg-gradient-to-r from-rose-950/30 via-emerald-950/40 to-rose-950/30 border-b border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              {/* Waveform animation effect */}
              <div className="flex items-end gap-1 h-4">
                <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite_100ms] h-full" />
                <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite_300ms] h-3/4" />
                <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite_200ms] h-full" />
                <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite_400ms] h-2/3" />
              </div>
              <div>
                <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Listening for voice input...</span>
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {transcript ? `"${transcript}"` : 'Say an item name, mob, or category (e.g., "Sword", "Boss", "Ender")'}
                </p>
              </div>
            </div>
            <button
              onClick={stopListening}
              className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-colors shrink-0"
            >
              Stop Voice
            </button>
          </div>
        )}

        {/* Speech Error Banner */}
        {speechError && (
          <div className="px-4 py-2.5 bg-rose-950/50 border-b border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{speechError}</span>
            </div>
            <button
              onClick={() => setSpeechError(null)}
              className="text-rose-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Category Filters */}
        <div className="px-4 py-2.5 bg-[#0f172a] border-b border-[#1e293b] flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
          <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider shrink-0 font-mono">Filter:</span>
          {(['all', 'items', 'mobs', 'blocks', 'recipes', 'biomes', 'dimensions', 'guides'] as const).map((cat, idx) => (
            <button
              key={`${cat}-${idx}`}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl capitalize transition-all whitespace-nowrap text-xs font-semibold ${
                selectedCategoryFilter === cat
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold shadow-md shadow-sky-500/20 border border-sky-400/40'
                  : 'bg-[#1e293b]/80 text-slate-300 hover:text-white border border-slate-700/60 hover:border-slate-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {filteredPages.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-sm font-semibold text-slate-400">
                {query ? `No wiki articles found matching "${query}".` : 'Type or speak to search wiki articles.'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Try broader search terms or click the microphone button to search with your voice.</p>
            </div>
          ) : (
            filteredPages.map((page) => (
              <div
                key={page.id}
                onClick={() => {
                  stopListening();
                  onSelectPage(page.id);
                  onClose();
                }}
                className="p-3.5 bg-[#1e293b]/40 hover:bg-[#1e293b] border border-slate-800 hover:border-sky-500/50 rounded-xl cursor-pointer transition-all group flex items-center justify-between gap-3 hover:shadow-lg hover:shadow-sky-500/5"
              >
                <div className="flex items-start gap-3 truncate">
                  {(getPageCoverImage(page) || (page.category !== 'biomes' && page.category !== 'dimensions')) && (
                    <div className="w-11 h-11 bg-[#0b0f19] border border-slate-800 rounded-xl flex items-center justify-center text-xl shrink-0 overflow-hidden p-1.5 group-hover:border-sky-500/30 transition-colors">
                      {getPageCoverImage(page) ? (
                        <img src={getPageCoverImage(page)!} alt={page.title} className="w-full h-full object-contain" />
                      ) : (
                        <WikiIcon icon={page.icon} category={page.category} className="w-5 h-5" />
                      )}
                    </div>
                  )}
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-100 text-sm group-hover:text-sky-300 transition-colors">
                        {page.title}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-sky-500/10 text-sky-400 rounded-lg border border-sky-500/20 capitalize font-medium">
                        {page.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {page.description}
                    </p>
                    <p className="text-[10px] font-mono text-emerald-400/90 font-medium mt-1">
                      {page.namespace}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-slate-500 group-hover:text-sky-400 shrink-0 font-mono transition-colors">
                  <span>Open</span>
                  <CornerDownLeft className="w-3.5 h-3.5" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#0b0f19] border-t border-[#1e293b] text-xs text-slate-400 flex justify-between items-center font-mono rounded-b-2xl">
          <span>{filteredPages.length} {filteredPages.length === 1 ? 'article' : 'articles'} found</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Mic className="w-3.5 h-3.5" />
            <span>Voice Search Ready</span>
          </span>
        </div>
      </div>
    </div>
  );
};
