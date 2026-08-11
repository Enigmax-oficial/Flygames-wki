import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Rotate3d, 
  Maximize2, 
  X, 
  Sparkles,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Grid
} from 'lucide-react';
import { MinecraftModel3D } from './MinecraftModel3D';

export interface GalleryItem {
  url: string;
  title?: string;
  caption?: string;
  is3D?: boolean;
  modelKey?: string;
}

interface WikiImageGalleryProps {
  items: GalleryItem[];
  pageTitle: string;
}

const ZOOM_STEPS = [1, 1.5, 2, 3, 4, 6, 8];

export const WikiImageGallery: React.FC<WikiImageGalleryProps> = ({ items, pageTitle }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0); // 0 = 100% (1x)
  const [isPixelated, setIsPixelated] = useState(true); // Crisp pixel art rendering for Minecraft textures

  if (!items || items.length === 0) return null;

  const currentItem = items[currentIndex] || items[0];
  const is3DModelActive = currentIndex === 1 || currentItem.is3D;
  const currentZoom = ZOOM_STEPS[zoomIndex] || 1;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
    setZoomIndex(0);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
    setZoomIndex(0);
  };

  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomIndex((prev) => Math.min(prev + 1, ZOOM_STEPS.length - 1));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleResetZoom = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomIndex(0);
  };

  const handleTogglePixelated = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsPixelated((prev) => !prev);
  };

  const handleCycleZoom = () => {
    // Cycle through 100% -> 200% -> 400% -> 100%
    if (zoomIndex === 0) setZoomIndex(2); // 2x (200%)
    else if (zoomIndex === 2) setZoomIndex(4); // 4x (400%)
    else setZoomIndex(0); // 1x (100%)
  };

  return (
    <div className="bg-[#0f172a]/95 border border-sky-500/20 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md relative font-sans my-4">
      {/* Gallery Header Bar */}
      <div className="bg-[#0b0f19] px-4 py-3 border-b border-[#1e293b] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
          <span className="text-white font-bold tracking-wide uppercase">
            {is3DModelActive ? '3D Bedrock Minecraft Model' : 'Image Gallery'}
          </span>
          {items.length > 1 && (
            <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded font-mono font-bold text-[10px]">
              {currentIndex + 1} / {items.length}
            </span>
          )}
        </div>

        {/* Header Right Action Bar: Zoom Controls & Fullscreen */}
        <div className="flex items-center gap-1.5 bg-[#111827] border border-[#1e293b] px-2 py-1 rounded-xl">
          {!is3DModelActive && (
            <>
              {/* Zoom Out */}
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomIndex === 0}
                className="p-1 text-[#94a3b8] hover:text-white disabled:opacity-30 disabled:hover:text-[#94a3b8] hover:bg-[#1e293b] rounded transition-colors cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              {/* Zoom Percentage Indicator */}
              <button
                type="button"
                onClick={handleCycleZoom}
                className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 rounded transition-colors cursor-pointer"
                title="Click to toggle Zoom (100% / 200% / 400%)"
              >
                {Math.round(currentZoom * 100)}%
              </button>

              {/* Zoom In */}
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomIndex === ZOOM_STEPS.length - 1}
                className="p-1 text-[#94a3b8] hover:text-white disabled:opacity-30 disabled:hover:text-[#94a3b8] hover:bg-[#1e293b] rounded transition-colors cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              {/* Reset Zoom */}
              {zoomIndex > 0 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1 text-[#94a3b8] hover:text-sky-400 hover:bg-[#1e293b] rounded transition-colors cursor-pointer"
                  title="Reset Zoom (100%)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Pixel Crisp Rendering Toggle */}
              <button
                type="button"
                onClick={handleTogglePixelated}
                className={`p-1 rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-mono ${
                  isPixelated
                    ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
                    : 'text-[#64748b] hover:text-[#94a3b8]'
                }`}
                title={isPixelated ? 'Pixel Crisp Mode Enabled (Sharp 16x16 / 32x32 textures)' : 'Smooth Blur Rendering'}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>

              <div className="w-[1px] h-3 bg-[#1e293b] mx-0.5" />
            </>
          )}

          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="p-1 text-[#94a3b8] hover:text-white hover:bg-[#1e293b] rounded transition-colors cursor-pointer"
            title="Expand Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="relative min-h-[300px] sm:min-h-[380px] bg-[#070a12] flex items-center justify-center p-4 overflow-auto select-none">
        {/* Previous / Next Navigation Arrows (Wikipedia-style) */}
        {items.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#0b0f19]/80 hover:bg-sky-500/20 text-white border border-[#334155] hover:border-sky-400 flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer"
              title="Previous Image"
            >
              <ChevronLeft className="w-6 h-6 text-sky-400" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#0b0f19]/80 hover:bg-sky-500/20 text-white border border-[#334155] hover:border-sky-400 flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer"
              title="Next Image"
            >
              <ChevronRight className="w-6 h-6 text-sky-400" />
            </button>
          </>
        )}

        {/* Standard 2D Image View with Zoom & Crisp Texture Rendering */}
        {!is3DModelActive && (
          <div 
            onClick={handleCycleZoom}
            className="relative z-10 flex flex-col items-center justify-center max-w-full p-4 cursor-zoom-in transition-all duration-200"
            title="Click to Zoom (100% -> 200% -> 400%)"
          >
            <img
              src={currentItem.url}
              alt={currentItem.caption || pageTitle}
              style={{
                transform: `scale(${currentZoom})`,
                imageRendering: isPixelated ? 'pixelated' : 'auto',
              }}
              className="max-h-[280px] sm:max-h-[340px] w-auto object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] transition-transform duration-200 ease-out origin-center"
            />

            {/* Quick Zoom Indicator Badge */}
            {zoomIndex > 0 && (
              <div className="absolute top-2 right-2 bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2 py-1 rounded-lg text-[10px] font-mono font-bold shadow-lg backdrop-blur-md flex items-center gap-1">
                <ZoomIn className="w-3 h-3 text-sky-400" />
                <span>{Math.round(currentZoom * 100)}%</span>
              </div>
            )}
          </div>
        )}

        {/* 3D Minecraft Bedrock Model View */}
        {is3DModelActive && (
          <div className="w-full relative z-10">
            <MinecraftModel3D
              modelKey={currentItem.modelKey}
              textureUrl={currentItem.url}
              pageTitle={pageTitle}
            />
          </div>
        )}
      </div>

      {/* Caption & Thumbnail Selection Bar (Wikipedia Style) */}
      <div className="bg-[#0b0f19] p-4 border-t border-[#1e293b] flex flex-col items-center justify-center gap-4 text-xs">
        
        {/* Thumbnail Selector Strip - Centered perfectly on desktop & mobile */}
        {items.length > 1 && (
          <div className="flex items-center justify-center gap-2 overflow-x-auto max-w-full pb-1">
            {items.map((item, idx) => {
              const isItem3D = idx === 1 || item.is3D;
              const isActive = idx === currentIndex;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setZoomIndex(0);
                  }}
                  className={`relative w-11 h-11 rounded-lg border-2 overflow-hidden transition-all shrink-0 bg-[#070a12] flex items-center justify-center cursor-pointer ${
                    isActive
                      ? 'border-sky-400 ring-2 ring-sky-400/30 scale-105 shadow-md'
                      : 'border-[#1e293b] opacity-60 hover:opacity-100 hover:border-sky-500/50'
                  }`}
                  title={item.title || (isItem3D ? '3D Model View' : `Image ${idx + 1}`)}
                >
                  <img
                    src={item.url}
                    alt={`Thumbnail ${idx + 1}`}
                    style={{ imageRendering: isPixelated ? 'pixelated' : 'auto' }}
                    className="w-full h-full object-cover"
                  />
                  {isItem3D && (
                    <div className="absolute inset-0 bg-purple-900/60 flex items-center justify-center text-purple-200">
                      <Rotate3d className="w-4 h-4 text-purple-300" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Caption Info Label */}
        <div className="text-[#cbd5e1] font-medium text-center flex flex-col sm:flex-row items-center justify-center gap-2">
          <div className="flex items-center gap-1.5 justify-center">
            {is3DModelActive ? (
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                <Rotate3d className="w-3 h-3" />
                3D Model
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/40 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                <Eye className="w-3 h-3" />
                Image {currentZoom > 1 ? `(${Math.round(currentZoom * 100)}% Zoom)` : ''}
              </span>
            )}
          </div>
          <span className="truncate max-w-xs sm:max-w-md">
            {currentItem.title || currentItem.caption || (is3DModelActive ? '3D Render View' : pageTitle)}
          </span>
        </div>

      </div>

      {/* Fullscreen Interactive Zoom Overlay Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-8"
          onClick={() => setIsFullscreen(false)}
        >
          <div 
            className="w-full max-w-5xl flex items-center justify-between text-white border-b border-[#334155] pb-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg text-sky-400 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-400" />
              <span>{pageTitle} - High Resolution Zoom Viewer</span>
            </h3>

            {/* Modal Zoom Controls */}
            <div className="flex items-center gap-2 bg-[#111827] border border-[#334155] px-3 py-1.5 rounded-2xl">
              {!is3DModelActive && (
                <>
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoomIndex === 0}
                    className="p-1.5 text-[#94a3b8] hover:text-white disabled:opacity-30 rounded hover:bg-[#1e293b] cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono font-bold text-sky-400 min-w-[45px] text-center">
                    {Math.round(currentZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoomIndex === ZOOM_STEPS.length - 1}
                    className="p-1.5 text-[#94a3b8] hover:text-white disabled:opacity-30 rounded hover:bg-[#1e293b] cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  {zoomIndex > 0 && (
                    <button
                      type="button"
                      onClick={handleResetZoom}
                      className="p-1.5 text-[#94a3b8] hover:text-sky-400 rounded hover:bg-[#1e293b] cursor-pointer"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleTogglePixelated}
                    className={`px-2 py-1 rounded text-xs font-mono cursor-pointer ${
                      isPixelated ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-[#64748b]'
                    }`}
                    title="Toggle Crisp Pixel Art Mode"
                  >
                    Pixel Crisp
                  </button>
                  <div className="w-[1px] h-4 bg-[#334155]" />
                </>
              )}

              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="p-1.5 bg-[#1e293b] hover:bg-[#334155] rounded-full text-white transition-colors cursor-pointer"
                title="Close Viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div 
            className="flex-1 w-full max-w-5xl flex items-center justify-center p-4 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {is3DModelActive ? (
              <div className="w-full h-[550px]">
                <MinecraftModel3D
                  modelKey={currentItem.modelKey}
                  textureUrl={currentItem.url}
                  pageTitle={pageTitle}
                />
              </div>
            ) : (
              <div 
                onClick={handleCycleZoom}
                className="cursor-zoom-in max-w-full max-h-full flex items-center justify-center p-4"
              >
                <img
                  src={currentItem.url}
                  alt={pageTitle}
                  style={{
                    transform: `scale(${currentZoom})`,
                    imageRendering: isPixelated ? 'pixelated' : 'auto',
                  }}
                  className="max-h-[70vh] w-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)] transition-transform duration-200 origin-center"
                />
              </div>
            )}
          </div>

          <div className="text-center text-sm text-[#94a3b8] font-mono flex items-center gap-2">
            <span>{currentItem.caption || pageTitle}</span>
            {!is3DModelActive && (
              <span className="text-sky-400 text-xs">
                (Click image or use controls to Zoom up to 800%)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
