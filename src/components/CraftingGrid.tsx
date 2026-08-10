import React from 'react';
import { CraftingRecipe } from '../types/wiki';
import { WikiIcon } from './WikiIcon';
import { getItemImage } from '../data/itemAssets';
import { ArrowRight, Sparkles, Flame, Shield } from 'lucide-react';

interface CraftingGridProps {
  recipe: CraftingRecipe;
  onItemClick?: (itemId: string) => void;
}

export const CraftingGrid: React.FC<CraftingGridProps> = ({ recipe, onItemClick }) => {
  const craftingTableImg = getItemImage('minecraft:crafting_table');

  if (recipe.type === '3x3') {
    const grid = recipe.grid || [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ];

    const renderOutputIcon = () => {
      const img = getItemImage(recipe.output.id) || (recipe.output.icon?.startsWith('data:') || recipe.output.icon?.startsWith('http') ? recipe.output.icon : null);
      if (img) {
        return <img src={img} alt={recipe.output.name} className="w-11 h-11 sm:w-12 sm:h-12 object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.8)] group-hover:scale-110 transition-transform" />;
      }
      return (
        <WikiIcon icon={recipe.output.icon || 'items'} className="w-10 h-10 text-sky-400" />
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
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
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

        {/* Recipe Crafting Body */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          {/* 3x3 Grid */}
          <div className="grid grid-cols-3 gap-1.5 bg-[#120d09] p-2 rounded-lg border border-[#3e2713] shadow-inner">
            {grid.map((row, rIdx) =>
              row.map((cellItem, cIdx) => {
                const itemImg = cellItem ? getItemImage(cellItem.id) : null;
                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    className={`w-11 h-11 sm:w-12 sm:h-12 bg-[#2a1c12] border-2 border-[#5c3e26] rounded-md flex items-center justify-center relative group transition-all ${
                      cellItem ? 'hover:bg-[#3e2713] hover:border-[#8e5c38] cursor-pointer shadow-md' : 'opacity-80'
                    }`}
                    onClick={() => cellItem && onItemClick && onItemClick(cellItem.id)}
                  >
                    {cellItem ? (
                      itemImg ? (
                        <img
                          src={itemImg}
                          alt={cellItem.name}
                          className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow"
                        />
                      ) : (
                        <WikiIcon icon={cellItem.icon || getItemIcon(cellItem.id)} className="w-7 h-7 text-sky-300" />
                      )
                    ) : null}

                    {/* Tooltip on hover */}
                    {cellItem && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-[#0f172a] text-white text-[11px] font-mono px-2.5 py-1.5 rounded-md shadow-xl border border-sky-500/30 whitespace-nowrap z-30 pointer-events-none">
                        <p className="font-bold text-sky-300">{cellItem.name}</p>
                        <p className="text-[9px] text-[#64748b]">{cellItem.id}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center justify-center text-[#8e5c38]">
            <ArrowRight className="w-8 h-8 sm:w-10 sm:h-10 text-[#fde047] drop-shadow-[0_0_8px_rgba(253,224,71,0.5)]" />
          </div>

          {/* Result Output Slot */}
          <div className="flex flex-col items-center gap-1.5">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 bg-[#2a1c12] border-4 border-[#8e5c38] rounded-xl flex items-center justify-center relative group hover:bg-[#3e2713] hover:border-[#fde047] transition-all cursor-pointer shadow-[0_0_20px_rgba(142,92,56,0.5)]"
              onClick={() => onItemClick && onItemClick(recipe.output.id)}
            >
              {renderOutputIcon()}

              {/* Count badge */}
              {recipe.output.count && recipe.output.count > 1 && (
                <span className="absolute bottom-1 right-1.5 text-xs font-black font-mono text-[#fde047] bg-black/80 px-1 rounded border border-[#8e5c38]">
                  x{recipe.output.count}
                </span>
              )}

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-[#0f172a] text-white text-xs font-mono px-3 py-2 rounded-lg shadow-2xl border border-sky-500/40 whitespace-nowrap z-30 pointer-events-none">
                <p className="font-black text-amber-300 uppercase tracking-wider">{recipe.output.name}</p>
                <p className="text-[10px] text-[#94a3b8]">{recipe.output.id}</p>
                <p className="text-[10px] text-emerald-400 mt-1 font-bold">Output Yield: x{recipe.output.count || 1}</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#fde047] font-mono">
              {recipe.output.name}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Smithing / Altar / Furnace
  if (recipe.type === 'smithing' || recipe.type === 'altar') {
    return (
      <div className="bg-[#181124] border-2 border-purple-800/60 rounded-xl p-4 text-[#e0e0e0] inline-block font-sans shadow-2xl">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-purple-900/50 text-xs font-bold text-purple-300">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="uppercase tracking-wider">Aetherial Ritual Altar</span>
        </div>

        <div className="bg-[#111827] p-4 rounded-lg border-2 border-[#374151] flex items-center gap-4 sm:gap-6">
          <div className="flex flex-col gap-2">
            <div className="w-11 h-11 bg-[#1f2937] border-2 border-purple-500/40 rounded flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <div className="w-11 h-11 bg-[#1f2937] border-2 border-purple-500/40 rounded flex items-center justify-center">
              <WikiIcon icon="aetheria:celestial_crystal" className="w-6 h-6 text-purple-400" />
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
              <WikiIcon icon={recipe.output.icon || 'items'} className="w-9 h-9 text-purple-400" />
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
  if (itemId.includes('netherite')) return 'gem';
  if (itemId.includes('stick')) return 'sword';
  if (itemId.includes('cristal') || itemId.includes('crystal')) return 'aetheria:celestial_crystal';
  if (itemId.includes('obsidian')) return 'box';
  if (itemId.includes('crafting_table')) return 'blocks';
  if (itemId.includes('stone')) return 'blocks';
  if (itemId.includes('furnace')) return 'blocks';
  if (itemId.includes('blaze')) return 'flame';
  if (itemId.includes('fragmento') || itemId.includes('vazio') || itemId.includes('void')) return 'sparkles';
  if (itemId.includes('gold') || itemId.includes('ouro')) return 'gem';
  if (itemId.includes('diamond') || itemId.includes('diamante')) return 'gem';
  return 'items';
}
