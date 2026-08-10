import React from 'react';
import { 
  Skull, 
  Sword, 
  Box, 
  ScrollText, 
  Trees, 
  BookOpen, 
  Folder, 
  FileText, 
  Shield, 
  Sparkles, 
  Layers, 
  Gem, 
  Wand2, 
  Crosshair, 
  Compass, 
  Pickaxe, 
  Hammer, 
  Flame, 
  Zap,
  Tag
} from 'lucide-react';
import { getItemImage } from '../data/itemAssets';

const ICON_MAP: Record<string, React.ElementType> = {
  mobs: Skull,
  items: Sword,
  blocks: Box,
  recipes: ScrollText,
  biomes: Trees,
  guides: BookOpen,
  folder: Folder,
  file: FileText,
  shield: Shield,
  sparkles: Sparkles,
  layers: Layers,
  gem: Gem,
  wand: Wand2,
  crosshair: Crosshair,
  compass: Compass,
  pickaxe: Pickaxe,
  hammer: Hammer,
  flame: Flame,
  zap: Zap,
  tag: Tag,
  // Map legacy emojis to clean Lucide components
  '🧟': Skull,
  '🗡️': Sword,
  '🧱': Box,
  '📜': ScrollText,
  '🌲': Trees,
  '📖': BookOpen,
  '📁': Folder,
  '📄': FileText,
  '⭐': Sparkles,
  '💎': Gem,
  '⚔️': Sword,
  '🛡️': Shield,
  '🍖': Skull,
  '📝': FileText,
};

export interface WikiIconProps {
  icon: string | undefined;
  className?: string;
  customImages?: Record<string, string>;
}

export const WikiIcon = ({ icon, className = "w-4 h-4", customImages }: WikiIconProps) => {
  if (!icon) {
    const FallbackIcon = FileText;
    return <FallbackIcon className={className} />;
  }

  // Check if it's a direct image URL or Data URI
  if (icon.startsWith('http') || icon.startsWith('data:image') || icon.startsWith('/')) {
    return <img src={icon} alt="icon" className={`${className} object-contain`} />;
  }

  // Check if it resolves to an item image asset in itemAssets.ts or custom stored images
  const assetImage = getItemImage(icon, customImages);
  if (assetImage) {
    return <img src={assetImage} alt={icon} className={`${className} object-contain`} />;
  }

  // Check Lucide icon mapping
  const cleanKey = icon.toLowerCase().trim();
  const IconComponent = ICON_MAP[cleanKey] || ICON_MAP[icon];

  if (IconComponent) {
    return <IconComponent className={className} />;
  }

  // Fallback to FileText icon if icon is unknown string
  const DefaultIcon = FileText;
  return <DefaultIcon className={className} />;
};
