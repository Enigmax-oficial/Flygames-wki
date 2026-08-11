// SVG Image Data URIs for items, blocks, and materials to be used in crafting grids, icons, and galleries

export const ITEM_IMAGES: Record<string, string> = {
  // Categorized PNG Asset Archives
  'sword': '/images/weapons/sword.png',
  'swords': '/images/weapons/sword.png',
  'axe': '/images/tools/iron_axe.png',
  'pickaxe': '/images/tools/iron_pickaxe.png',
  'hoe': '/images/tools/iron_hoe.png',

  // Copper Tier
  'copper_sword': '/images/weapons/copper_sword-1.png',
  'copper_axe': '/images/tools/copper_axe.png',
  'copper_pickaxe': '/images/tools/copper_pickaxe.png',
  'copper_hoe': '/images/tools/copper_hoe.png',

  // Diamond Tier
  'diamond_sword': '/images/weapons/diamond_sword.png',
  'diamond_axe': '/images/tools/diamond_axe.png',
  'diamond_pickaxe': '/images/tools/diamond_pickaxe.png',
  'diamond_hoe': '/images/tools/diamond_hoe.png',

  // Golden Tier
  'gold_sword': '/images/weapons/gold_sword.png',
  'golden_sword': '/images/weapons/gold_sword.png',
  'gold_axe': '/images/tools/gold_axe.png',
  'golden_axe': '/images/tools/gold_axe.png',
  'gold_pickaxe': '/images/tools/gold_pickaxe.png',
  'golden_pickaxe': '/images/tools/gold_pickaxe.png',
  'gold_hoe': '/images/tools/gold_hoe.png',
  'golden_hoe': '/images/tools/gold_hoe.png',

  // Iron Tier
  'iron_sword': '/images/weapons/iron_sword.png',
  'iron_axe': '/images/tools/iron_axe.png',
  'iron_pickaxe': '/images/tools/iron_pickaxe.png',
  'iron_hoe': '/images/tools/iron_hoe.png',

  // Netherite Tier
  'netherite_sword': '/images/weapons/netherite_sword.png',
  'netherite_axe': '/images/tools/netherite_axe.png',
  'netherite_pickaxe': '/images/tools/netherite_pickaxe.png',
  'netherite_hoe': '/images/tools/netherite_hoe.png',

  // Wooden Tier
  'wood_sword': '/images/weapons/wood_sword.png',
  'wooden_sword': '/images/weapons/wood_sword.png',
  'wood_axe': '/images/tools/wood_axe.png',
  'wooden_axe': '/images/tools/wood_axe.png',
  'wood_pickaxe': '/images/tools/wood_pickaxe.png',
  'wooden_pickaxe': '/images/tools/wood_pickaxe.png',
  'wood_hoe': '/images/tools/wood_hoe.png',
  'wooden_hoe': '/images/tools/wood_hoe.png',

  // Stone Tier
  'stone_sword': '/images/weapons/stone_sword.png',
  'stone_axe': '/images/tools/stone_axe.png',
  'stone_pickaxe': '/images/tools/stone_pickaxe.png',
  'stone_hoe': '/images/tools/stone_hoe.png',

  // Stats / Items
  'apple': '/images/items/apple.png',
  'apple_golden': '/images/items/apple_golden.png',
  'golden_apple': '/images/items/apple_golden.png',
  'heart': '/images/ui/heart.png',
  '❤️': '/images/ui/heart.png',
  '❤': '/images/ui/heart.png',

  // Categories
  'mobs_cat': '/images/categories/mobs.png',
  'items_cat': '/images/categories/items.png',
  'blocks_cat': '/images/categories/blocks.png',
  'recipes_cat': '/images/categories/recipes.png',
  'biomes_cat': '/images/categories/biomes.png',
  'guides_cat': '/images/categories/guides.png',
  '⚔️': '/images/weapons/sword.png',
  '🗡️': '/images/weapons/sword.png',

  // Minecraft Diamond Sword
  'minecraft:diamond_sword': '/images/weapons/diamond_sword.png',

  // Minecraft Golden Sword
  'minecraft:golden_sword': '/images/weapons/gold_sword.png',

  // Minecraft Iron Sword
  'minecraft:iron_sword': '/images/weapons/iron_sword.png',

  // Minecraft Netherite Sword
  'minecraft:netherite_sword': '/images/weapons/netherite_sword.png',

  // Minecraft Stone Sword
  'minecraft:stone_sword': '/images/weapons/stone_sword.png',

  // Minecraft Wooden Sword
  'minecraft:wooden_sword': '/images/weapons/wood_sword.png',

  // Aetherial Sword
  'aetheria:aetherial_sword': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <defs>
        <linearGradient id="blade" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="50%" stop-color="#818cf8"/>
          <stop offset="100%" stop-color="#c084fc"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <!-- Blade -->
      <path d="M 46 8 L 56 18 L 28 46 L 22 46 L 18 40 L 46 8 Z" fill="url(#blade)" filter="url(#glow)"/>
      <path d="M 48 10 L 54 16 L 30 40 L 28 38 Z" fill="#ffffff" opacity="0.8"/>
      <!-- Crossguard -->
      <path d="M 22 36 L 30 44 L 24 50 L 16 42 Z" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
      <circle cx="23" cy="43" r="3" fill="#38bdf8"/>
      <!-- Handle -->
      <path d="M 17 43 L 11 49 L 15 53 L 21 47 Z" fill="#334155"/>
      <!-- Pommel -->
      <circle cx="10" cy="54" r="3" fill="#a855f7"/>
    </svg>
  `)}`,

  // Celestial Crystal
  'aetheria:celestial_crystal': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <polygon points="32,6 48,22 42,56 22,56 16,22" fill="#38bdf8" stroke="#0284c7" stroke-width="2"/>
      <polygon points="32,6 48,22 32,36 16,22" fill="#7dd3fc" opacity="0.9"/>
      <polygon points="32,36 42,56 32,48 22,56" fill="#0284c7"/>
      <polygon points="32,6 32,36 16,22" fill="#e0f2fe" opacity="0.6"/>
    </svg>
  `)}`,

  // Netherite Ingot
  'minecraft:netherite_ingot': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <polygon points="12,24 28,14 52,24 36,34" fill="#332a2e" stroke="#52434a" stroke-width="2"/>
      <polygon points="12,24 36,34 36,48 12,38" fill="#1e181c"/>
      <polygon points="36,34 52,24 52,38 36,48" fill="#292025"/>
      <line x1="28" y1="14" x2="28" y2="28" stroke="#63525b" stroke-width="1.5"/>
    </svg>
  `)}`,

  // Stellar Staff
  'aetheria:stellar_staff': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <line x1="12" y1="52" x2="44" y2="20" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
      <circle cx="48" cy="16" r="10" fill="#a855f7" stroke="#e0e7ff" stroke-width="2"/>
      <polygon points="48,4 52,12 60,16 52,20 48,28 44,20 36,16 44,12" fill="#fbbf24"/>
    </svg>
  `)}`,

  // Void Fragment
  'aetheria:void_fragment': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <polygon points="32,10 50,26 44,52 20,54 12,30" fill="#1e1b4b" stroke="#818cf8" stroke-width="2"/>
      <polygon points="32,10 40,28 20,30" fill="#4338ca"/>
      <polygon points="40,28 44,52 30,40" fill="#312e81"/>
    </svg>
  `)}`,

  // Blaze Rod
  'minecraft:blaze_rod': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect x="28" y="10" width="8" height="44" rx="2" fill="#f59e0b" stroke="#b45309" stroke-width="2"/>
      <rect x="24" y="16" width="16" height="6" rx="1" fill="#fef08a"/>
      <rect x="24" y="32" width="16" height="6" rx="1" fill="#fef08a"/>
      <rect x="24" y="44" width="16" height="4" rx="1" fill="#fef08a"/>
    </svg>
  `)}`,

  // Enchanted Forge
  'aetheria:enchanted_forge': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect x="10" y="18" width="44" height="38" rx="4" fill="#1e293b" stroke="#334155" stroke-width="3"/>
      <rect x="16" y="26" width="32" height="22" rx="2" fill="#0f172a"/>
      <path d="M 22 42 Q 32 26 42 42 Z" fill="#f97316"/>
      <path d="M 26 42 Q 32 32 38 42 Z" fill="#facc15"/>
      <circle cx="32" cy="12" r="4" fill="#a855f7"/>
    </svg>
  `)}`,

  // Obsidian
  'minecraft:obsidian': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect x="8" y="8" width="48" height="48" rx="3" fill="#111827" stroke="#374151" stroke-width="2"/>
      <rect x="14" y="14" width="12" height="12" fill="#312e81" opacity="0.6"/>
      <rect x="34" y="28" width="14" height="14" fill="#4c1d95" opacity="0.6"/>
    </svg>
  `)}`,

  // Crafting Table
  'minecraft:crafting_table': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect x="8" y="8" width="48" height="48" rx="3" fill="#78350f" stroke="#451a03" stroke-width="2"/>
      <rect x="12" y="12" width="40" height="40" fill="#b45309"/>
      <grid x="12" y="12" width="40" height="40"/>
      <line x1="32" y1="12" x2="32" y2="52" stroke="#78350f" stroke-width="2"/>
      <line x1="12" y1="32" x2="52" y2="32" stroke="#78350f" stroke-width="2"/>
    </svg>
  `)}`,

  // Blast Furnace
  'minecraft:blast_furnace': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect x="8" y="8" width="48" height="48" rx="3" fill="#475569" stroke="#1e293b" stroke-width="2"/>
      <rect x="16" y="28" width="32" height="20" rx="2" fill="#0f172a"/>
      <path d="M 24 44 Q 32 30 40 44 Z" fill="#ef4444"/>
    </svg>
  `)}`,

  // Smooth Stone
  'minecraft:smooth_stone': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect x="8" y="8" width="48" height="48" rx="3" fill="#94a3b8" stroke="#64748b" stroke-width="2"/>
      <rect x="12" y="12" width="40" height="4" fill="#cbd5e1"/>
    </svg>
  `)}`,

  // Aetherial Ore
  'aetheria:aether_ore': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect x="8" y="8" width="48" height="48" rx="3" fill="#475569" stroke="#334155" stroke-width="2"/>
      <polygon points="18,18 26,14 30,22 22,26" fill="#38bdf8"/>
      <polygon points="38,32 48,28 50,38 40,42" fill="#38bdf8"/>
      <polygon points="20,38 28,34 32,44 22,46" fill="#818cf8"/>
    </svg>
  `)}`,

  // Rotten Flesh
  'minecraft:rotten_flesh': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <path d="M 16 20 C 24 12, 40 16, 48 24 C 54 32, 46 48, 36 50 C 24 52, 12 40, 16 20 Z" fill="#65a30d" stroke="#3f6212" stroke-width="2"/>
      <path d="M 22 26 C 28 20, 36 22, 42 28" fill="none" stroke="#84cc16" stroke-width="2"/>
    </svg>
  `)}`,

  // Cobblestone
  'minecraft:cobblestone': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect x="8" y="8" width="48" height="48" rx="2" fill="#64748b" stroke="#334155" stroke-width="2"/>
      <rect x="12" y="12" width="18" height="14" fill="#475569"/>
      <rect x="32" y="12" width="20" height="18" fill="#334155"/>
      <rect x="14" y="30" width="20" height="20" fill="#334155"/>
      <rect x="36" y="32" width="16" height="18" fill="#475569"/>
    </svg>
  `)}`,

  // Celestial Heart
  'aetheria:celestial_heart': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <path d="M 32 54 C 32 54, 8 36, 8 20 C 8 10, 18 6, 26 12 C 30 16, 32 18, 32 18 C 32 18, 34 16, 38 12 C 46 6, 56 10, 56 20 C 56 36, 32 54, 32 54 Z" fill="#ec4899" stroke="#be185d" stroke-width="2"/>
      <circle cx="22" cy="18" r="3" fill="#fbcfe8"/>
    </svg>
  `)}`,

  // Minecraft Stick
  'minecraft:stick': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect x="28" y="10" width="8" height="44" rx="2" transform="rotate(25 32 32)" fill="#854d0e" stroke="#451a03" stroke-width="2"/>
    </svg>
  `)}`,

  // Minecraft Diamond
  'minecraft:diamond': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <polygon points="32,8 52,24 32,56 12,24" fill="#38bdf8" stroke="#0284c7" stroke-width="2"/>
      <polygon points="32,8 52,24 32,28 12,24" fill="#e0f2fe" opacity="0.8"/>
      <polygon points="32,28 52,24 32,56" fill="#0284c7"/>
    </svg>
  `)}`,

  // Minecraft Iron Ingot
  'minecraft:iron_ingot': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <polygon points="12,24 28,14 52,24 36,34" fill="#cbd5e1" stroke="#64748b" stroke-width="2"/>
      <polygon points="12,24 36,34 36,48 12,38" fill="#94a3b8"/>
      <polygon points="36,34 52,24 52,38 36,48" fill="#64748b"/>
    </svg>
  `)}`,

  // Minecraft Gold Ingot
  'minecraft:gold_ingot': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <polygon points="12,24 28,14 52,24 36,34" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
      <polygon points="12,24 36,34 36,48 12,38" fill="#eab308"/>
      <polygon points="36,34 52,24 52,38 36,48" fill="#ca8a04"/>
    </svg>
  `)}`,

  // Minecraft Emerald
  'minecraft:emerald': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <polygon points="32,8 48,20 48,44 32,56 16,44 16,20" fill="#10b981" stroke="#047857" stroke-width="2"/>
      <polygon points="32,8 48,20 32,32 16,20" fill="#a7f3d0" opacity="0.8"/>
    </svg>
  `)}`,

  // Minecraft Apple
  'minecraft:apple': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="64" height="64" shape-rendering="crispEdges">
      <!-- Stem -->
      <rect x="8" y="1" width="1" height="3" fill="#5c3818"/>
      <rect x="9" y="2" width="1" height="1" fill="#3a220c"/>
      <rect x="10" y="1" width="1" height="1" fill="#387018"/>
      <!-- Outline -->
      <rect x="5" y="4" width="6" height="1" fill="#3b0000"/>
      <rect x="4" y="5" width="8" height="1" fill="#3b0000"/>
      <rect x="3" y="6" width="10" height="7" fill="#3b0000"/>
      <rect x="4" y="13" width="8" height="1" fill="#3b0000"/>
      <rect x="5" y="14" width="6" height="1" fill="#3b0000"/>
      <!-- Body -->
      <rect x="5" y="5" width="6" height="8" fill="#e21a1a"/>
      <rect x="4" y="6" width="8" height="6" fill="#f02424"/>
      <rect x="5" y="13" width="6" height="1" fill="#aa0c0c"/>
      <!-- Highlights -->
      <rect x="5" y="6" width="2" height="2" fill="#ff8a8a"/>
      <rect x="6" y="6" width="1" height="1" fill="#ffffff"/>
      <rect x="5" y="8" width="1" height="1" fill="#ff6666"/>
      <!-- Shading -->
      <rect x="9" y="8" width="2" height="4" fill="#a80808"/>
      <rect x="8" y="11" width="3" height="2" fill="#800202"/>
      <rect x="6" y="13" width="4" height="1" fill="#600000"/>
    </svg>
  `)}`,
  'Minecraft:apple': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="64" height="64" shape-rendering="crispEdges">
      <!-- Stem -->
      <rect x="8" y="1" width="1" height="3" fill="#5c3818"/>
      <rect x="9" y="2" width="1" height="1" fill="#3a220c"/>
      <rect x="10" y="1" width="1" height="1" fill="#387018"/>
      <!-- Outline -->
      <rect x="5" y="4" width="6" height="1" fill="#3b0000"/>
      <rect x="4" y="5" width="8" height="1" fill="#3b0000"/>
      <rect x="3" y="6" width="10" height="7" fill="#3b0000"/>
      <rect x="4" y="13" width="8" height="1" fill="#3b0000"/>
      <rect x="5" y="14" width="6" height="1" fill="#3b0000"/>
      <!-- Body -->
      <rect x="5" y="5" width="6" height="8" fill="#e21a1a"/>
      <rect x="4" y="6" width="8" height="6" fill="#f02424"/>
      <rect x="5" y="13" width="6" height="1" fill="#aa0c0c"/>
      <!-- Highlights -->
      <rect x="5" y="6" width="2" height="2" fill="#ff8a8a"/>
      <rect x="6" y="6" width="1" height="1" fill="#ffffff"/>
      <rect x="5" y="8" width="1" height="1" fill="#ff6666"/>
      <!-- Shading -->
      <rect x="9" y="8" width="2" height="4" fill="#a80808"/>
      <rect x="8" y="11" width="3" height="2" fill="#800202"/>
      <rect x="6" y="13" width="4" height="1" fill="#600000"/>
    </svg>
  `)}`,

  // Crystalline Apple
  'aetheria:crystalline_apple': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <path d="M 32 16 C 20 16, 12 26, 12 40 C 12 54, 24 60, 32 60 C 40 60, 52 54, 52 40 C 52 26, 44 16, 32 16 Z" fill="#10b981" stroke="#047857" stroke-width="2"/>
      <polygon points="32,16 44,28 32,40 20,28" fill="#6ee7b7" opacity="0.8"/>
      <path d="M 32 8 C 34 12, 38 14, 42 12" fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round"/>
      <circle cx="26" cy="30" r="2" fill="#ffffff"/>
    </svg>
  `)}`,

  // Addon Installation Guide Book Cover
  'addon-installation-guide': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect x="10" y="8" width="44" height="48" rx="4" fill="#0369a1" stroke="#0284c7" stroke-width="2"/>
      <rect x="10" y="8" width="8" height="48" rx="2" fill="#075985"/>
      <polygon points="32,20 36,28 44,28 38,34 40,42 32,37 24,42 26,34 20,28 28,28" fill="#fbbf24"/>
    </svg>
  `)}`,

  // Celestial Guardian Cover
  'celestial-guardian': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <circle cx="32" cy="32" r="24" fill="#1e1b4b" stroke="#818cf8" stroke-width="3"/>
      <polygon points="32,10 40,24 54,24 42,34 46,48 32,38 18,48 22,34 10,24 24,24" fill="#c084fc"/>
      <circle cx="32" cy="32" r="8" fill="#38bdf8"/>
    </svg>
  `)}`,

  // Void Stalker Cover
  'void-stalker': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect x="8" y="8" width="48" height="48" rx="12" fill="#0f172a" stroke="#6366f1" stroke-width="2"/>
      <ellipse cx="32" cy="32" rx="16" ry="10" fill="#312e81"/>
      <circle cx="32" cy="32" r="6" fill="#a855f7"/>
      <circle cx="34" cy="30" r="2" fill="#ffffff"/>
    </svg>
  `)}`,

  // Celestial Forest Biome Cover
  'celestial-forest-biome': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <rect x="6" y="6" width="52" height="52" rx="8" fill="#2e1065" stroke="#a855f7" stroke-width="2"/>
      <polygon points="32,12 48,32 38,32 46,48 18,48 26,32 16,32" fill="#c084fc"/>
      <rect x="29" y="48" width="6" height="8" fill="#581c87"/>
    </svg>
  `)}`,

  // Crystal Drake Cover
  'crystal-drake': `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <path d="M 12 48 C 20 20, 44 20, 52 48 L 40 40 L 32 52 L 24 40 Z" fill="#0284c7" stroke="#38bdf8" stroke-width="2"/>
      <polygon points="32,10 40,24 24,24" fill="#7dd3fc"/>
      <circle cx="28" cy="22" r="2" fill="#ffffff"/>
      <circle cx="36" cy="22" r="2" fill="#ffffff"/>
    </svg>
  `)}`,
};

// Custom runtime stored image overrides registry
const CUSTOM_STORED_IMAGES: Record<string, string> = {};

/**
 * Register or associate a custom image for a specific value or key
 * e.g., registerCustomImage('Minecraft:apple', 'data:image/...');
 */
export function registerCustomImage(key: string, imageUrl: string): void {
  if (!key || !imageUrl) return;
  CUSTOM_STORED_IMAGES[key] = imageUrl;
  const lower = key.toLowerCase();
  CUSTOM_STORED_IMAGES[lower] = imageUrl;
  CUSTOM_STORED_IMAGES[lower.replace(/[- ]/g, '_')] = imageUrl;
  CUSTOM_STORED_IMAGES[lower.replace(/[_ ]/g, '-')] = imageUrl;
}

/**
 * Get all dynamically registered custom images
 */
export function getCustomStoredImages(): Record<string, string> {
  return { ...CUSTOM_STORED_IMAGES };
}

export function getItemImage(idOrName: string, customImages?: Record<string, string>): string | null {
  if (!idOrName) return null;

  // Combine custom parameter map, runtime registered custom map, and standard ITEM_IMAGES
  const combinedMap = {
    ...ITEM_IMAGES,
    ...CUSTOM_STORED_IMAGES,
    ...(customImages || {}),
  };

  // Direct match
  if (combinedMap[idOrName]) {
    return combinedMap[idOrName];
  }

  // Exact case-insensitive match
  const lower = idOrName.toLowerCase();
  if (combinedMap[lower]) {
    return combinedMap[lower];
  }

  const underscore = lower.replace(/[- ]/g, '_');
  const dashed = lower.replace(/[_ ]/g, '-');

  const key = Object.keys(combinedMap).find((k) => {
    const kLower = k.toLowerCase();
    return (
      kLower === lower ||
      kLower === underscore ||
      kLower === dashed ||
      kLower.endsWith(':' + underscore) ||
      kLower.endsWith(':' + dashed) ||
      kLower.endsWith(':' + lower) ||
      kLower.includes(underscore) ||
      kLower.includes(dashed) ||
      kLower.includes(lower)
    );
  });

  if (key) {
    return combinedMap[key];
  }
  return null;
}

export function getPageCoverImage(
  page: {
    id?: string;
    title?: string;
    namespace?: string;
    imageUrl?: string;
    renderImageUrl?: string;
    bannerImageUrl?: string;
    coverImage?: string;
    icon?: string;
  },
  customImages?: Record<string, string>
): string | null {
  if (!page) return null;
  if (page.coverImage) return page.coverImage;
  if (page.imageUrl) return page.imageUrl;
  if (page.renderImageUrl) return page.renderImageUrl;
  if (page.bannerImageUrl) return page.bannerImageUrl;
  if (page.id) {
    const itemImg = getItemImage(page.id, customImages);
    if (itemImg) return itemImg;
  }
  if (page.title) {
    const titleImg = getItemImage(page.title, customImages);
    if (titleImg) return titleImg;
  }
  if (page.namespace) {
    const nsImg = getItemImage(page.namespace, customImages);
    if (nsImg) return nsImg;
  }
  if (page.icon && (page.icon.startsWith('data:') || page.icon.startsWith('http'))) {
    return page.icon;
  }
  return null;
}
