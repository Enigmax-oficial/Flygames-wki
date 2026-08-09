import { WikiPage } from '../types/wiki';
import { 
  TemplateMob, 
  TemplateItem, 
  TemplateBlock, 
  TemplateBiome, 
  TemplateGuide 
} from '../lib/pageTemplates';

import berserkerRender from '../assets/images/crystalline_berserker_render_1786277904483.jpg';
import berserkerScreenshot from '../assets/images/crystalline_berserker_screenshot_1786277914316.jpg';
import boulderingRender from '../assets/images/bouldering_zombie_render_1786278571794.jpg';
import boulderingScreenshot from '../assets/images/bouldering_zombie_screenshot_1786278585904.jpg';

const boulderingZombie = new TemplateMob({
  id: 'bouldering-zombie',
  title: 'Bouldering Zombie',
  badge: 'MOB',
  badgeColor: 'emerald',
  namespace: 'aetheria:bouldering_zombie',
  description: 'A stone-skinned climbing zombie variant that scales cliffs, walls, and mountains to swarm players from high terrain.',
  addonVersion: 'v1.4.0',
  icon: '🧟',
  renderImageUrl: boulderingRender,
  bannerImageUrl: boulderingScreenshot,
  tags: ['mob', 'hostile', 'zombie', 'climbing', 'caves', 'mountain'],
  lastUpdated: '2026-08-09',
  author: 'Aetheria Team',
  behaviorBullets: [
    'Spawns in Mountain biomes, Extreme Hills, and Underground Caves',
    'Capable of climbing vertical walls, cliffs, and fences without ladders',
    'Melee attack (14 damage / 7 Hearts)',
    'Moves faster when climbing stone or granite surfaces',
    'Gains bonus knockback resistance when standing on stone blocks',
    'Burns in direct sunlight unless wearing a stone or iron helmet',
    'Spawns in groups of 1–3',
    'Drops Rotten Flesh, Cobblestone, and rare Granite Slag',
  ],
  behaviorMeta: {
    biomes: 'Mountains, Caves, Extreme Hills',
    groupSize: '1–3 (hostile)',
  },
  difficultyStats: [
    { difficulty: 'Easy', health: '20 HP', attack: '8 damage', icon: '🟩', color: 'emerald' },
    { difficulty: 'Normal', health: '30 HP', attack: '14 damage', icon: '🟧', color: 'amber' },
    { difficulty: 'Hard', health: '45 HP', attack: '22 damage', icon: '🟥', color: 'rose' },
    { difficulty: 'Brutal', health: '60 HP', attack: '32 damage', icon: '😈', color: 'purple' },
  ],
  movementSpeed: '0.28 (Climbing: 0.35)',
  dropsTable: [
    { item: 'Rotten Flesh', amount: '1–3', chance: '100%', icon: '🍖' },
    { item: 'Cobblestone', amount: '1–2', chance: '75%', icon: '🪨' },
    { item: 'Granite Slag', amount: '1', chance: '25%', icon: '🧱' },
    { item: 'Stone Shard', amount: '1–4', chance: '50%', icon: '💎' },
  ],
  mobStats: {
    health: 30,
    attackDamage: '14 (7 Hearts)',
    behavior: 'Hostile',
    spawnBiomes: ['minecraft:mountains', 'minecraft:dripstone_caves', 'aetheria:void_caves'],
    xpDrop: 12,
    drops: [
      { item: 'Rotten Flesh', itemId: 'minecraft:rotten_flesh', chance: '100%' },
      { item: 'Cobblestone', itemId: 'minecraft:cobblestone', chance: '75%' },
    ],
  },
  sections: [
    {
      title: 'Climbing Mechanics & Tactical Advice',
      content: 'The **Bouldering Zombie** is particularly dangerous in steep terrain or ravines.\n\n- **Wall Climbing:** Unlike standard mobs, building a 2-block high wall will not stop a Bouldering Zombie. It scales vertical walls easily.\n- **Overhang Defense:** To prevent them from scaling your base walls, build overhangs (lip of slabs or stairs) at the top of walls.\n- **Knockback Strategy:** Using bows or weapons with Knockback II can push them off high cliffs, dealing massive fall damage.',
    },
  ],
});

const crystallineBerserker = new TemplateMob({
  id: 'crystalline-berserker',
  title: 'Crystalline Berserker',
  badge: 'BOSS',
  badgeColor: 'purple',
  namespace: 'aetheria:crystalline_berserker',
  description: 'Enormous crystal-clad titan found deep within subterranean mineshafts in Crystal Canyon. Immune to arrows and fire.',
  addonVersion: 'v1.4.0',
  icon: '💎',
  renderImageUrl: berserkerRender,
  bannerImageUrl: berserkerScreenshot,
  tags: ['mob', 'boss', 'hostile', 'crystalline', 'canyon', 'dungeon'],
  lastUpdated: '2026-08-09',
  author: 'Aetheria Team',
  behaviorBullets: [
    'Spawns in the boss room of Crystal Canyon Mineshafts (~85%+ chance per mineshaft)',
    'Buy Unknown Maps from Accessory Traders or Cartographers to find mineshafts quickly',
    'Melee attack (25 damage)',
    'Slam attack (27 damage)',
    'Crystal projectile (36 damage)',
    'Immune to projectiles',
    'Fire and lava immune',
    'Has 3 phases/states',
    'Boss bar visible up to 125 blocks',
    '10 second death animation',
    'Drops valuable crystalline loot',
  ],
  behaviorMeta: {
    biomes: 'Crystal Canyon Mineshaft (boss room)',
    groupSize: '1 (boss)',
  },
  difficultyStats: [
    { difficulty: 'Easy', health: '1200 HP', attack: '16 damage', icon: '🟩', color: 'emerald' },
    { difficulty: 'Normal', health: '2000 HP', attack: '25 damage', icon: '🟧', color: 'amber' },
    { difficulty: 'Hard', health: '3400 HP', attack: '46 damage', icon: '🟥', color: 'rose' },
    { difficulty: 'Brutal', health: '5000 HP', attack: '68 damage', icon: '😈', color: 'purple' },
  ],
  movementSpeed: '0.3',
  dropsTable: [
    { item: 'Crystalline Apple', amount: '1', chance: '100%', icon: '🍏' },
    { item: 'Crystalline Berserker Core', amount: '1', chance: '100%', icon: '🔮' },
    { item: 'Crystallized Slime Block', amount: '1–4', chance: '100%', icon: '🟩' },
    { item: 'Compact Crystalline Ingot', amount: '1–2', chance: '100%', icon: '💎' },
    { item: 'Raw Resonant Crystal Dust', amount: '32–128', chance: '100%', icon: '✨' },
    { item: 'Crystalline Bulb', amount: '1–8', chance: '100%', icon: '💡' },
  ],
  mobStats: {
    health: 2000,
    attackDamage: '25 (12.5 Hearts)',
    behavior: 'Boss',
    spawnBiomes: ['aetheria:crystal_canyon', 'aetheria:mineshaft_dungeon'],
    xpDrop: 2500,
    drops: [
      { item: 'Crystalline Berserker Core', itemId: 'aetheria:crystalline_core', chance: '100%' },
      { item: 'Compact Crystalline Ingot', itemId: 'aetheria:compact_ingot', chance: '100%' },
    ],
  },
  sections: [
    {
      title: 'Tactical Combat Guide',
      content: 'The **Crystalline Berserker** is one of the most punishing encounters in the Aetheria Addon.\n\n- **Phase 1 (100%–60% HP):** Standard melee and ground slams. Maintain distance or block slams with shields.\n- **Phase 2 (60%–20% HP):** Launches high velocity crystal shards. Since it is completely immune to arrows, close-quarters magic or melee is mandatory.\n- **Phase 3 (< 20% HP):** Enrages, gaining +30% attack speed and constant ground shockwaves.',
    },
  ],
});

const aetherialSword = new TemplateItem({
  id: 'aetherial-sword',
  title: 'Aetherial Sword',
  namespace: 'aetheria:aetherial_sword',
  description: 'A legendary weapon forged with Celestial Crystals and Netherite Ingot. Grants temporary flight and levitation upon attacking.',
  addonVersion: 'v1.4.0',
  icon: '🗡️',
  tags: ['weapon', 'legendary', 'crafting', 'combat', 'aetheria'],
  lastUpdated: '2026-08-08',
  author: 'Aetheria Dev Team',
  itemStats: {
    rarity: 'Legendary',
    durability: 2048,
    attackDamage: 11,
    attackSpeed: 1.6,
    stackSize: 1,
    enchantable: true,
  },
  recipes: [
    {
      type: 'crafting_3x3',
      grid: [
        null, 'aetheria:celestial_crystal', null,
        null, 'aetheria:celestial_crystal', null,
        null, 'minecraft:netherite_ingot', null,
      ],
      output: {
        id: 'aetheria:aetherial_sword',
        name: 'Aetherial Sword',
        count: 1,
      },
    },
  ],
  sections: [
    {
      title: 'Overview & Attributes',
      content: 'The **Aetherial Sword** is one of the most formidable weapons in the Aetheria Addon. Beyond inflicting **11 Attack Damage (5.5 Hearts)**, it features a glowing radiant gem in its hilt that channels celestial energy.',
    },
    {
      title: 'Special Skill: Celestial Leap',
      content: '- **Right Click Use:** Launches the player 12 blocks into the air and grants *Slow Falling I* for 6 seconds.\n- **Cooldown:** 15 seconds.\n- **Critical Magic Strike:** Attacking enemies while falling inflicts +4 bonus Magic Light Damage.',
    },
    {
      title: 'How to Obtain',
      content: 'Crafted using 2x **Celestial Crystals** (dropped by defeating the *Celestial Guardian*) and 1x **Netherite Ingot** on a standard Crafting Table.',
    },
  ],
  customProperties: {
    'Repair Item': 'Celestial Crystal',
    'Native Effect': 'Night Vision I',
    'Min XP Level': 'Level 30',
  },
});

const addonInstallationGuide = new TemplateGuide({
  id: 'addon-installation-guide',
  title: 'Addon Installation & Recipe Guide',
  namespace: 'aetheria:installation_guide',
  description: 'Learn how to install the Aetheria Addon behavior and resource packs into Minecraft, enable experimental features, and craft custom recipes.',
  addonVersion: 'v1.4.0',
  icon: '📖',
  tags: ['guide', 'installation', 'crafting', 'bedrock', 'behavior-pack'],
  lastUpdated: '2026-08-08',
  author: 'Aetheria Team',
  sections: [
    {
      title: '1. Installing Behavior & Resource Packs',
      content: 'To use the Aetheria Addon in your Minecraft world:\n\n1. Download the `.mcaddon` or `.mcpack` files.\n2. Open the file to automatically import it into Minecraft.\n3. Navigate to **World Settings > Resource Packs** and activate **Aetheria Textures**.\n4. Navigate to **World Settings > Behavior Packs** and activate **Aetheria Behaviors**.',
    },
    {
      title: '2. Required Experimental Toggles',
      content: 'Ensure the following experimental settings are turned **ON** in your world settings before loading:\n\n- **Holiday Creator Features**\n- **Upcoming Creator Features**\n- **Custom Biomes**',
    },
    {
      title: '3. Unlocking Recipes in the Enchanted Forge',
      content: 'Custom weapons and blocks require the **Enchanted Forge** or standard 3x3 crafting tables. Inspect individual item pages in this wiki for detailed grid layouts and ingredient requirements.',
    },
  ],
});

const stellarStaff = new TemplateItem({
  id: 'stellar-staff',
  title: 'Stellar Void Staff',
  namespace: 'aetheria:stellar_staff',
  description: 'Ranged magic artifact that launches gravitational spheres capable of pulling and slowing target entities.',
  addonVersion: 'v1.4.0',
  icon: '🪄',
  tags: ['magic', 'ranged', 'epic', 'void'],
  lastUpdated: '2026-08-07',
  author: 'Aetheria Dev Team',
  itemStats: {
    rarity: 'Epic',
    durability: 850,
    attackDamage: 7,
    attackSpeed: 1.0,
    stackSize: 1,
    enchantable: true,
  },
  recipes: [
    {
      type: 'crafting_3x3',
      grid: [
        'aetheria:void_fragment', 'aetheria:celestial_heart', 'aetheria:void_fragment',
        null, 'minecraft:blaze_rod', null,
        null, 'minecraft:blaze_rod', null,
      ],
      output: {
        id: 'aetheria:stellar_staff',
        name: 'Stellar Void Staff',
        count: 1,
      },
    },
  ],
  sections: [
    {
      title: 'Firing Mechanism',
      content: 'Holding right-click charges a **Gravitational Orb**. When released, the orb detonates upon impact, inflicting **Slowness III** and pulling nearby hostile mobs toward the epicenter.',
    },
    {
      title: 'Durability & Recharge',
      content: 'Each cast consumes 2 durability points. Can be recharged at the *Rune Altar* using *Stardust*.',
    },
  ],
});

const celestialGuardian = new TemplateMob({
  id: 'celestial-guardian',
  title: 'Celestial Guardian',
  namespace: 'aetheria:celestial_guardian',
  description: 'Supreme boss protector of the Floating Sky Islands. Can only be summoned during a full moon at the Celestial Altar.',
  addonVersion: 'v1.4.0',
  icon: '👑',
  tags: ['mob', 'boss', 'hostile', 'flying', 'challenge'],
  lastUpdated: '2026-08-08',
  author: 'Aetheria Dev Team',
  mobStats: {
    health: 450,
    attackDamage: '16 (8 Hearts)',
    behavior: 'Boss',
    spawnBiomes: ['aetheria:celestial_forest', 'aetheria:floating_islands'],
    xpDrop: 1200,
    drops: [
      {
        item: 'Celestial Heart',
        itemId: 'aetheria:celestial_heart',
        chance: '100% (Guaranteed 1)',
        lootingBonus: '+1 with Looting III',
      },
      {
        item: 'Void Fragment',
        itemId: 'aetheria:void_fragment',
        chance: '3-8 (100%)',
      },
      {
        item: 'Skyward Trophy',
        itemId: 'aetheria:guardian_trophy',
        chance: '15%',
      },
    ],
  },
  sections: [
    {
      title: 'Boss Phases',
      content: 'The Celestial Guardian is a multi-stage boss fight:\n\n1. **Phase 1 - Sky Barrage (100% - 65% HP):** Flies in spirals while launching radiant meteor projectiles.\n2. **Phase 2 - Void Shield (65% - 25% HP):** Becomes immune to arrows and summons 4 *Mist Specters*.\n3. **Phase 3 - Supernova (< 25% HP):** Lands on ground, releasing shockwaves that destroy nearby weak blocks.',
    },
    {
      title: 'Recommended Equipment',
      content: '- **Armor:** Diamond or Netherite Armor with Protection IV.\n- **Potions:** Potion of Flight, Regeneration II, and Fire Resistance.\n- **Weapons:** Bow with Flame/Power V or the Stellar Void Staff.',
    },
  ],
});

const voidStalker = new TemplateMob({
  id: 'void-stalker',
  title: 'Void Stalker',
  namespace: 'aetheria:void_stalker',
  description: 'Agile underground hostile entity that cloaks in shadows and teleports when targeted by projectile arrows.',
  addonVersion: 'v1.4.0',
  icon: '👁️',
  tags: ['mob', 'hostile', 'underground', 'agile'],
  lastUpdated: '2026-08-05',
  author: 'Aetheria Dev Team',
  mobStats: {
    health: 50,
    attackDamage: '8 (4 Hearts)',
    behavior: 'Hostile',
    spawnBiomes: ['aetheria:void_caves', 'minecraft:deep_dark'],
    xpDrop: 45,
    drops: [
      {
        item: 'Void Fragment',
        itemId: 'aetheria:void_fragment',
        chance: '1-2 (75%)',
      },
    ],
  },
  sections: [
    {
      title: 'Combat Strategy',
      content: 'Avoid using arrows against the Void Stalker as it teleports directly behind you. Use swords with **Bane of Arthropods** or **Sharpness V** to execute fast melee damage.',
    },
  ],
});

const aetherialOre = new TemplateBlock({
  id: 'aetherial-ore',
  title: 'Aetherial Ore',
  namespace: 'aetheria:aether_ore',
  description: 'Precious ore block found in deep floating islands and subterranean celestial caverns.',
  addonVersion: 'v1.4.0',
  icon: '💎',
  tags: ['block', 'ore', 'resource', 'rare'],
  lastUpdated: '2026-08-08',
  blockStats: {
    hardness: 4.5,
    blastResistance: 9.0,
    toolRequired: 'Pickaxe',
    lightLevel: 8,
    transparent: false,
    flammable: false,
    dropItem: 'aetheria:raw_crystal',
  },
  sections: [
    {
      title: 'Mining Requisites',
      content: 'Requires at least an **Iron Pickaxe** or higher to mine. Mining with Fortune III can drop up to 4x Raw Crystals per block.',
    },
    {
      title: 'Smelting & Refining',
      content: 'Smelt Raw Crystal in a Furnace or Blast Furnace to obtain **Refined Celestial Crystal**.',
    },
  ],
});

const enchantedForge = new TemplateBlock({
  id: 'enchanted-forge',
  title: 'Enchanted Forge',
  namespace: 'aetheria:enchanted_forge',
  description: 'Advanced crafting workstation required to fuse magical ores and forge legendary gear.',
  addonVersion: 'v1.4.0',
  icon: '🔥',
  tags: ['block', 'workstation', 'utility', 'crafting'],
  lastUpdated: '2026-08-08',
  blockStats: {
    hardness: 5.0,
    blastResistance: 12.0,
    toolRequired: 'Pickaxe',
    lightLevel: 13,
  },
  recipes: [
    {
      type: 'crafting_3x3',
      grid: [
        'minecraft:obsidian', 'aetheria:celestial_crystal', 'minecraft:obsidian',
        'minecraft:obsidian', 'minecraft:crafting_table', 'minecraft:obsidian',
        'minecraft:smooth_stone', 'minecraft:blast_furnace', 'minecraft:smooth_stone',
      ],
      output: {
        id: 'aetheria:enchanted_forge',
        name: 'Enchanted Forge',
        count: 1,
      },
    },
  ],
  sections: [
    {
      title: 'Interface & Functionality',
      content: 'The Enchanted Forge opens a custom 5-ingredient grid + 1 starfire fuel slot. Allows high-temperature item fusion without durability decay.',
    },
  ],
});

const celestialForestBiome = new TemplateBiome({
  id: 'celestial-forest-biome',
  title: 'Biome: Celestial Forest',
  namespace: 'aetheria:celestial_forest',
  description: 'A mystical sky realm covered in glowing violet grass, luminescent canopy trees, and skyward altars.',
  addonVersion: 'v1.4.0',
  icon: '🌸',
  tags: ['biome', 'dimension', 'sky', 'magic'],
  lastUpdated: '2026-08-04',
  biomeStats: {
    climate: 'Celestial',
    grassColor: '#9370DB',
    structures: ['Guardian Altar', 'Aether Temple Ruins', 'Observation Tower'],
    mobsSpawning: ['Celestial Guardian', 'Sky Whisperer (Pet)', 'Starlight Firefly'],
  },
  sections: [
    {
      title: 'Exclusive Resources',
      content: '- **Celestial Willow Wood:** Used to construct purple timber blocks with 2x blast resistance.\n- **Light Lotus:** Rare flower used in levitation brewing recipes.',
    },
  ],
});

export const INITIAL_WIKI_PAGES: WikiPage[] = [
  boulderingZombie.build(),
  crystallineBerserker.build(),
  aetherialSword.build(),
  addonInstallationGuide.build(),
  stellarStaff.build(),
  celestialGuardian.build(),
  voidStalker.build(),
  aetherialOre.build(),
  enchantedForge.build(),
  celestialForestBiome.build(),
];
