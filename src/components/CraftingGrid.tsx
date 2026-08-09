import React from 'react';
import { CraftingRecipe } from '../types/wiki';
import { ArrowRight, Flame, Sparkles } from 'lucide-react';
import { getItemImage } from '../data/itemAssets';

interface CraftingGridProps {
  recipe: CraftingRecipe;
  onItemClick?: (itemId: string) => void;
}

export const CraftingGrid: React.FC<CraftingGridProps> = ({ recipe, onItemClick }) => {
  if (recipe.type === 'crafting_3x3') {
    const grid = recipe.grid || Array(9).fill(null);
    const craftingTableImg = getItemImage('minecraft:crafting_table');

    const renderSlotItem = (cell: string) => {
      const img = getItemImage(cell);
      if (img) {
        return <img src={img} alt={cell} className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] group-hover:scale-110 transition-transform" />;
      }
      return (
        <span className="text-lg select-none drop-shadow">
          {getItemIcon(cell)}
        </span>
      );
    };

    const renderOutputItem = () => {
      const img = getItemImage(recipe.output.id) || (recipe.output.icon?.startsWith('data:') || recipe.output.icon?.startsWith('http') ? recipe.output.icon : null);
      if (img) {
        return <img src={img} alt={recipe.output.name} className="w-11 h-11 sm:w-12 sm:h-12 object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.8)] group-hover:scale-110 transition-transform" />;
      }
      return (
        <span className="text-3xl select-none drop-shadow">
          {recipe.output.icon || '🗡️'}
        </span>
      );
    };

    return (
      <div className="bg-[#1f1712] border-2 border-[#5c3e26] rounded-xl p-4 sm:p-5 text-[#e0e0e0] inline-block max-w-full font-sans shadow-2xl relative overflow-hidden">
        {/* Crafting Table Title Header */}
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#3e2713] text-xs font-bold">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#2a1c12] border border-[#784f2b] rounded flex items-center justify-center p-0.5 shadow shrink-0">
              {craftingTableImg ? (
                <img src={craftingTableImg} alt="Crafting Table" className="w-full h-full object-contain" />
              ) : (
                <span className="text-xs">🟫</span>
              )}
            </div>
            <span className="text-[#fef08a] font-black uppercase tracking-wider text-xs sm:text-sm">
              Crafting Table
            </span>
          </div>
          <span className="px-2 py-0.5 bg-[#3e2713] text-[#fde047] border border-[#784f2b] rounded text-[10px] font-mono font-bold uppercase tracking-wider">
            3x3 Recipe
          </span>
        </div>

        {/* Authentic Minecraft GUI Panel */}
        <div className="bg-[#c6c6c6] text-[#373737] p-4 rounded-lg border-2 border-t-[#ffffff] border-l-[#ffffff] border-b-[#555555] border-r-[#555555] shadow-inner">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            
            {/* 3x3 Grid Matrix */}
            <div className="grid grid-cols-3 gap-1 bg-[#8b8b8b] p-1.5 border-2 border-t-[#373737] border-l-[#373737] border-b-[#ffffff] border-r-[#ffffff] rounded shadow-inner">
              {grid.map((cell, idx) => (
                <div
                  key={idx}
                  className={`w-11 h-11 sm:w-12 sm:h-12 bg-[#8b8b8b] border-2 border-t-[#373737] border-l-[#373737] border-b-[#ffffff] border-r-[#ffffff] rounded-sm flex items-center justify-center relative group transition-all ${
                    cell ? 'hover:bg-[#a0a0a0] cursor-pointer active:scale-95' : ''
                  }`}
                  onClick={() => cell && onItemClick && onItemClick(cell)}
                  title={cell ? formatItemName(cell) : 'Empty Slot'}
                >
                  {cell ? renderSlotItem(cell) : null}

                  {/* Tooltip */}
                  {cell && (
                    <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-[#100010]/95 border-2 border-[#2b015c] text-[#e0e0e0] text-xs px-2.5 py-1 rounded shadow-2xl whitespace-nowrap pointer-events-none font-mono">
                      <span className="text-white font-bold">{formatItemName(cell)}</span>
                      <span className="block text-[10px] text-[#a0a0a0] font-normal">{cell}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Minecraft Crafting Arrow */}
            <div className="flex flex-col items-center justify-center my-1 sm:my-0">
              <svg width="32" height="24" viewBox="0 0 32 24" fill="none" className="rotate-90 sm:rotate-0 drop-shadow">
                <path d="M 0 8 H 18 V 2 H 32 L 18 22 V 16 H 0 Z" fill="#8b8b8b" stroke="#373737" strokeWidth="2" />
                <path d="M 2 10 H 16 V 4 L 28 12 L 16 20 V 14 H 2 Z" fill="#3f3f3f" />
              </svg>
            </div>

            {/* Result Slot */}
            <div className="flex flex-col items-center justify-center">
              <div
                className="w-16 h-16 sm:w-18 sm:h-18 bg-[#8b8b8b] border-3 border-t-[#373737] border-l-[#373737] border-b-[#ffffff] border-r-[#ffffff] rounded-md flex items-center justify-center relative cursor-pointer hover:bg-[#a0a0a0] transition-all shadow-xl group"
                onClick={() => onItemClick && onItemClick(recipe.output.id)}
              >
                {renderOutputItem()}
                {recipe.output.count > 1 && (
                  <span className="absolute bottom-0.5 right-1.5 font-black text-white text-sm sm:text-base drop-shadow-[0_2px_2px_rgba(0,0,0,1)] font-mono">
                    {recipe.output.count}
                  </span>
                )}

                {/* Tooltip */}
                <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-[#100010]/95 border-2 border-[#5c015b] text-purple-200 text-xs px-2.5 py-1 rounded shadow-2xl whitespace-nowrap pointer-events-none font-mono">
                  <span className="text-amber-300 font-bold block">{recipe.output.name}</span>
                  <span className="text-[10px] text-emerald-400">Click to view article</span>
                </div>
              </div>
              <span className="text-xs font-bold text-[#1a1a1a] mt-2 text-center max-w-[110px] truncate font-mono">
                {recipe.output.name}
              </span>
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (recipe.type === 'forge') {
    const forgeImg = getItemImage('aetheria:enchanted_forge') || getItemImage('minecraft:blast_furnace');
    return (
      <div className="bg-[#1e1a24] border-2 border-[#581c87] rounded-xl p-4 sm:p-5 text-[#e0e0e0] inline-block max-w-full font-sans shadow-2xl">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#3b0764] text-xs font-bold">
          <div className="flex items-center gap-2 text-purple-300">
            <div className="w-6 h-6 bg-[#2e1065] border border-[#a855f7] rounded flex items-center justify-center p-0.5 shrink-0">
              {forgeImg ? (
                <img src={forgeImg} alt="Enchanted Forge" className="w-full h-full object-contain" />
              ) : (
                <Flame className="w-4 h-4 text-orange-400" />
              )}
            </div>
            <span className="text-purple-300 font-black uppercase text-xs sm:text-sm">Enchanted Forge Altar</span>
          </div>
          <span className="px-2 py-0.5 bg-[#3b0764] text-purple-300 border border-[#a855f7]/40 rounded text-[10px] font-mono font-bold uppercase">
            Forge Fusion
          </span>
        </div>

        <div className="bg-[#111827] p-4 rounded-lg border-2 border-[#374151] flex items-center gap-4 sm:gap-6">
          <div className="flex flex-col gap-2">
            <div className="w-11 h-11 bg-[#1f2937] border-2 border-purple-500/40 rounded flex items-center justify-center">
              <span className="text-xl">🔥</span>
            </div>
            <div className="w-11 h-11 bg-[#1f2937] border-2 border-purple-500/40 rounded flex items-center justify-center">
              <span className="text-xl">💎</span>
            </div>
          </div>
          <ArrowRight className="w-6 h-6 text-purple-400" />
          <div 
            className="w-16 h-16 bg-[#1f2937] border-2 border-purple-500 rounded-lg flex items-center justify-center cursor-pointer hover:bg-purple-950/40 transition-colors"
            onClick={() => onItemClick && onItemClick(recipe.output.id)}
          >
            {getItemImage(recipe.output.id) ? (
              <img src={getItemImage(recipe.output.id)!} alt={recipe.output.name} className="w-11 h-11 object-contain drop-shadow" />
            ) : (
              <span className="text-2xl">{recipe.output.icon || '⚔️'}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded p-3 text-[#ccc] text-sm">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <span className="font-semibold">{recipe.output.name}</span>
      </div>
      <p className="text-xs text-[#777]">Custom Addon recipe.</p>
    </div>
  );
};

function getItemIcon(itemId: string): string {
  if (itemId.includes('netherite')) return '🖤';
  if (itemId.includes('stick')) return '🥢';
  if (itemId.includes('cristal') || itemId.includes('crystal')) return '🔮';
  if (itemId.includes('obsidian')) return '⬛';
  if (itemId.includes('crafting_table')) return '🟫';
  if (itemId.includes('stone')) return '🪨';
  if (itemId.includes('furnace')) return '🧱';
  if (itemId.includes('blaze')) return '🔥';
  if (itemId.includes('fragmento') || itemId.includes('vazio') || itemId.includes('void')) return '🌌';
  if (itemId.includes('gold') || itemId.includes('ouro')) return '🪙';
  if (itemId.includes('diamond') || itemId.includes('diamante')) return '💎';
  return '✨';
}

function formatItemName(itemId: string): string {
  const parts = itemId.split(':');
  const name = parts[1] || parts[0];
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
