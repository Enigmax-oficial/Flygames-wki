import React, { useState } from 'react';
import { WikiPage } from '../types/wiki';
import { WikiIcon } from './WikiIcon';
import { Heart, Sparkles, ChevronDown, ChevronUp, Layers, Tag, User } from 'lucide-react';
import { getItemImage } from '../lib/assetHelper';

interface InfoboxProps {
  page: WikiPage;
}

export const Infobox: React.FC<InfoboxProps> = ({ page }) => {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const displayImage = getItemImage(page.id) || 
    (page.icon?.startsWith('data:') || page.icon?.startsWith('http') ? page.icon : null) || 
    page.imageUrl || 
    page.renderImageUrl;

  // Rarity color mappings
  const getRarityBadge = (rarity?: string) => {
    switch (rarity) {
      case 'Legendary':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      case 'Epic':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/50';
      case 'Rare':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'Uncommon':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
      default:
        return 'bg-[#222] text-[#ccc] border-[#333]';
    }
  };

  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg overflow-hidden shadow-xl w-full text-[#e0e0e0] font-sans">
      {/* Infobox Top Header Banner */}
      <div className="bg-emerald-600 p-3 text-center">
        <h3 className="font-bold text-sm tracking-widest uppercase text-black font-sans">
          {page.title}
        </h3>
      </div>

      {/* Main Image / Icon Stage */}
      <div className="p-4 bg-[#1a1a1a] flex flex-col items-center justify-center relative border-b border-[#2a2a2a]">
        <div className="w-36 h-36 sm:w-44 sm:h-44 bg-[#141414] border border-[#333] rounded flex items-center justify-center text-5xl sm:text-6xl shadow-[0_0_20px_rgba(16,185,129,0.15)] relative overflow-hidden p-3">
          {displayImage ? (
            <img
              src={displayImage}
              alt={page.title}
              className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
            />
          ) : (
            <WikiIcon icon={page.icon} category={page.category} className="w-12 h-12 text-3xl" />
          )}
        </div>
        <div className="absolute bottom-2 right-2 text-[10px] font-mono text-[#555]">
          ID: {page.id}
        </div>

        {page.itemStats?.rarity && (
          <span
            className={`mt-3 px-2.5 py-0.5 text-xs font-bold rounded border ${getRarityBadge(
              page.itemStats.rarity
            )}`}
          >
            {page.itemStats.rarity}
          </span>
        )}

        {/* Mobile Toggle Button */}
        <button
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          className="md:hidden mt-3 w-full py-1.5 px-3 bg-[#111] hover:bg-[#222] text-[#aaa] rounded text-xs font-medium flex items-center justify-center gap-1 border border-[#333]"
        >
          <span>{isMobileExpanded ? 'Hide Properties' : 'Show Full Attributes'}</span>
          {isMobileExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Infobox Body - Visible on PC always, toggleable on mobile */}
      <div className={`${isMobileExpanded ? 'block' : 'hidden md:block'} p-4 text-xs space-y-3`}>
        {/* Basic Metadata */}
        <div className="flex justify-between border-b border-[#2a2a2a] pb-1.5">
          <span className="text-[#666] flex items-center gap-1">
            <Layers className="w-3 h-3 text-emerald-500" />
            Category
          </span>
          <span className="text-white font-medium capitalize">{page.category}</span>
        </div>

        {['mobs', 'items', 'blocks', 'dimensions', 'recipes', 'biomes'].includes(page.category) && (
          <div className="flex justify-between border-b border-[#2a2a2a] pb-1.5">
            <span className="text-[#666] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              Addon Version
            </span>
            <span className="text-emerald-400 font-mono font-bold">{page.addonVersion}</span>
          </div>
        )}

        {page.author && (
          <div className="flex justify-between border-b border-[#2a2a2a] pb-1.5">
            <span className="text-[#666] flex items-center gap-1">
              <User className="w-3 h-3 text-cyan-400" />
              Author
            </span>
            <span className="text-white">{page.author}</span>
          </div>
        )}

        {/* Item Stats */}
        {page.itemStats && (
          <div className="pt-1 space-y-2">
            <h4 className="font-bold text-[10px] uppercase text-emerald-400 tracking-wider">
              Item Attributes
            </h4>

            {page.itemStats.attackDamage !== undefined && (
              <div className="flex justify-between border-b border-[#2a2a2a] pb-1">
                <span className="text-[#666]">Attack Damage</span>
                <span className="text-rose-400 font-bold">{page.itemStats.attackDamage} HP</span>
              </div>
            )}

            {page.itemStats.durability !== undefined && (
              <div className="flex justify-between border-b border-[#2a2a2a] pb-1">
                <span className="text-[#666]">Durability</span>
                <span className="text-white font-mono">{page.itemStats.durability} uses</span>
              </div>
            )}

            {page.itemStats.stackSize !== undefined && (
              <div className="flex justify-between border-b border-[#2a2a2a] pb-1">
                <span className="text-[#666]">Stackable</span>
                <span className="text-white font-mono">{page.itemStats.stackSize === 1 ? 'No (1)' : `Yes (${page.itemStats.stackSize})`}</span>
              </div>
            )}
          </div>
        )}

        {/* Mob Stats */}
        {page.mobStats && (
          <div className="pt-1 space-y-2">
            <h4 className="font-bold text-[10px] uppercase text-rose-400 tracking-wider flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
              Mob Statistics
            </h4>

            <div className="flex justify-between border-b border-[#2a2a2a] pb-1">
              <span className="text-[#666]">Health Points</span>
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <span>{page.mobStats.health} HP ({page.mobStats.health / 2}</span>
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
                <span>)</span>
              </span>
            </div>

            <div className="flex justify-between border-b border-[#2a2a2a] pb-1">
              <span className="text-[#666]">Behavior</span>
              <span className="text-red-400 font-medium">{page.mobStats.behavior}</span>
            </div>

            {page.mobStats.attackDamage && (
              <div className="flex justify-between border-b border-[#2a2a2a] pb-1">
                <span className="text-[#666]">Attack Power</span>
                <span className="text-amber-300 font-medium">{page.mobStats.attackDamage}</span>
              </div>
            )}

            {page.mobStats.xpDrop !== undefined && (
              <div className="flex justify-between border-b border-[#2a2a2a] pb-1">
                <span className="text-[#666]">XP Reward</span>
                <span className="text-emerald-400 font-mono">+{page.mobStats.xpDrop} XP</span>
              </div>
            )}
          </div>
        )}

        {/* Block Stats */}
        {page.blockStats && (
          <div className="pt-1 space-y-2">
            <h4 className="font-bold text-[10px] uppercase text-amber-400 tracking-wider">
              Block Properties
            </h4>

            <div className="flex justify-between border-b border-[#2a2a2a] pb-1">
              <span className="text-[#666]">Hardness</span>
              <span className="text-white font-mono">{page.blockStats.hardness}</span>
            </div>

            <div className="flex justify-between border-b border-[#2a2a2a] pb-1">
              <span className="text-[#666]">Blast Resistance</span>
              <span className="text-white font-mono">{page.blockStats.blastResistance}</span>
            </div>

            <div className="flex justify-between border-b border-[#2a2a2a] pb-1">
              <span className="text-[#666]">Tool Required</span>
              <span className="text-amber-300 font-medium">{page.blockStats.toolRequired}</span>
            </div>

            {page.blockStats.lightLevel !== undefined && (
              <div className="flex justify-between border-b border-[#2a2a2a] pb-1">
                <span className="text-[#666]">Light Emission</span>
                <span className="text-yellow-300 font-mono flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300 inline" />
                  <span>{page.blockStats.lightLevel}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Custom Properties */}
        {page.customProperties && Object.keys(page.customProperties).length > 0 && (
          <div className="pt-1 space-y-1.5">
            <h4 className="font-bold text-[10px] uppercase text-emerald-400 tracking-wider">
              Additional Info
            </h4>
            {Object.entries(page.customProperties).map(([key, val], idx) => (
              <div key={`${key}-${idx}`} className="flex justify-between border-b border-[#2a2a2a] pb-1">
                <span className="text-[#666]">{key}</span>
                <span className="text-white font-medium">{val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {page.tags && page.tags.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center gap-1 text-[#666] text-[10px] uppercase font-bold mb-1.5">
              <Tag className="w-3 h-3 text-emerald-500" />
              <span>Tags</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {page.tags.map((tag, idx) => (
                <span
                  key={`${tag}-${idx}`}
                  className="px-2 py-0.5 bg-[#1a1a1a] text-[#888] border border-[#2a2a2a] rounded text-[10px] font-mono"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Minecraft Addon Download Ad */}
      <div className="p-4 bg-gradient-to-br from-[#111827] to-[#070a12] border-t border-[#2a2a2a] space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-[9px] uppercase font-bold text-sky-400 tracking-widest font-mono">Download Free Addon</span>
        </div>
        <div className="space-y-1">
          <h4 className="font-extrabold text-xs text-white uppercase tracking-tight">Etherium v1.4.0 Addon</h4>
          <p className="text-[10px] text-[#94a3b8] leading-normal">
            Get the full custom .mcaddon bundle containing all mobs, dimensions, and blocks.
          </p>
        </div>
        <a 
          href="https://minecraft.net" 
          target="_blank" 
          referrerPolicy="no-referrer"
          className="w-full py-2 px-3 bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-black font-black uppercase text-center rounded text-xs transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
        >
          <span>📥 Download Addon (4.8MB)</span>
        </a>
        <div className="flex justify-between items-center text-[9px] text-[#475569] font-mono">
          <span>Format: .mcaddon</span>
          <span>Downloads: 45K+</span>
        </div>
      </div>
    </div>
  );
};
