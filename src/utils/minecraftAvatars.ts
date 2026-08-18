// Authentic Minecraft pixel-art avatars and mobs for profile selection

const makeSvgDataUri = (svgContent: string): string => {
  const cleanSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">${svgContent}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`;
};

// 1. Steve (Classic Minecraft Protagonist)
const steveSvg = makeSvgDataUri(`
  <!-- Hair -->
  <rect x="0" y="0" width="16" height="5" fill="#4a2c11"/>
  <rect x="0" y="5" width="2" height="4" fill="#4a2c11"/>
  <rect x="14" y="5" width="2" height="4" fill="#4a2c11"/>
  <!-- Skin base -->
  <rect x="2" y="5" width="12" height="11" fill="#d8997a"/>
  <!-- Skin highlights & shadows -->
  <rect x="3" y="5" width="10" height="2" fill="#e5aa8c"/>
  <rect x="0" y="9" width="2" height="3" fill="#d8997a"/>
  <rect x="14" y="9" width="2" height="3" fill="#d8997a"/>
  <!-- Eyes -->
  <rect x="2" y="7" width="2" height="2" fill="#ffffff"/>
  <rect x="4" y="7" width="2" height="2" fill="#2b428c"/>
  <rect x="10" y="7" width="2" height="2" fill="#2b428c"/>
  <rect x="12" y="7" width="2" height="2" fill="#ffffff"/>
  <!-- Nose -->
  <rect x="6" y="9" width="4" height="2" fill="#965d40"/>
  <!-- Mouth / Beard -->
  <rect x="4" y="11" width="8" height="2" fill="#542d17"/>
  <rect x="6" y="12" width="4" height="1" fill="#753f20"/>
  <rect x="3" y="13" width="10" height="3" fill="#542d17"/>
`);

// 2. Alex (Iconic Adventure Skin)
const alexSvg = makeSvgDataUri(`
  <!-- Hair Orange -->
  <rect x="0" y="0" width="16" height="6" fill="#bf5a2b"/>
  <rect x="0" y="6" width="3" height="8" fill="#bf5a2b"/>
  <rect x="13" y="6" width="3" height="8" fill="#bf5a2b"/>
  <rect x="3" y="2" width="10" height="2" fill="#d46b38"/>
  <!-- Skin Base -->
  <rect x="3" y="6" width="10" height="10" fill="#e8b79b"/>
  <rect x="0" y="14" width="16" height="2" fill="#bf5a2b"/>
  <!-- Eyes -->
  <rect x="3" y="8" width="2" height="2" fill="#ffffff"/>
  <rect x="5" y="8" width="2" height="2" fill="#457d38"/>
  <rect x="9" y="8" width="2" height="2" fill="#457d38"/>
  <rect x="11" y="8" width="2" height="2" fill="#ffffff"/>
  <!-- Nose / Lips -->
  <rect x="7" y="10" width="2" height="1" fill="#c4876e"/>
  <rect x="6" y="12" width="4" height="1" fill="#b86858"/>
`);

// 3. Creeper (Iconic Explosive Mob)
const creeperSvg = makeSvgDataUri(`
  <!-- Green Base Texture -->
  <rect x="0" y="0" width="16" height="16" fill="#3cb338"/>
  <!-- Varied Green Patches -->
  <rect x="0" y="0" width="4" height="4" fill="#2a8e26"/>
  <rect x="8" y="0" width="4" height="4" fill="#4ed44a"/>
  <rect x="12" y="4" width="4" height="4" fill="#1d6d1a"/>
  <rect x="0" y="8" width="4" height="4" fill="#4ed44a"/>
  <rect x="12" y="12" width="4" height="4" fill="#2a8e26"/>
  <rect x="4" y="12" width="4" height="4" fill="#4ed44a"/>
  <!-- Creeper Face Features (Black/Dark Charcoal) -->
  <!-- Left Eye -->
  <rect x="2" y="4" width="4" height="4" fill="#111d11"/>
  <!-- Right Eye -->
  <rect x="10" y="4" width="4" height="4" fill="#111d11"/>
  <!-- Center Mouth Connection -->
  <rect x="6" y="7" width="4" height="5" fill="#111d11"/>
  <!-- Mouth Outer Columns -->
  <rect x="4" y="9" width="8" height="5" fill="#111d11"/>
  <rect x="4" y="12" width="2" height="4" fill="#111d11"/>
  <rect x="10" y="12" width="2" height="4" fill="#111d11"/>
  <rect x="6" y="12" width="4" height="4" fill="#3cb338"/>
`);

// 4. Enderman (Ender Void Mob with Purple Eyes)
const endermanSvg = makeSvgDataUri(`
  <!-- Obsidian Body -->
  <rect x="0" y="0" width="16" height="16" fill="#141416"/>
  <rect x="2" y="2" width="4" height="4" fill="#1e1e24"/>
  <rect x="10" y="10" width="4" height="4" fill="#0d0d0f"/>
  <rect x="8" y="1" width="3" height="3" fill="#1c1c20"/>
  <rect x="1" y="11" width="4" height="3" fill="#1c1c20"/>
  <!-- Glowing Magenta / Violet Eyes -->
  <rect x="1" y="7" width="5" height="2" fill="#cb35ee"/>
  <rect x="10" y="7" width="5" height="2" fill="#cb35ee"/>
  <!-- Inner Bright Pupil -->
  <rect x="3" y="7" width="2" height="2" fill="#f89aff"/>
  <rect x="11" y="7" width="2" height="2" fill="#f89aff"/>
`);

// 5. Diamond Helmet Knight (Ultimate Protection)
const diamondKnightSvg = makeSvgDataUri(`
  <!-- Diamond Helmet Top & Crest -->
  <rect x="0" y="0" width="16" height="7" fill="#2bcfba"/>
  <rect x="2" y="1" width="12" height="2" fill="#58f6e2"/>
  <rect x="0" y="0" width="16" height="1" fill="#199c8c"/>
  <!-- Helmet Sides & Cheek Guards -->
  <rect x="0" y="7" width="3" height="9" fill="#2bcfba"/>
  <rect x="13" y="7" width="3" height="9" fill="#2bcfba"/>
  <rect x="0" y="12" width="16" height="4" fill="#199c8c"/>
  <rect x="2" y="13" width="12" height="2" fill="#2bcfba"/>
  <!-- Visor Opening & Face -->
  <rect x="3" y="7" width="10" height="5" fill="#d8997a"/>
  <rect x="3" y="8" width="2" height="2" fill="#ffffff"/>
  <rect x="5" y="8" width="2" height="2" fill="#2b428c"/>
  <rect x="9" y="8" width="2" height="2" fill="#2b428c"/>
  <rect x="11" y="8" width="2" height="2" fill="#ffffff"/>
  <rect x="7" y="9" width="2" height="2" fill="#965d40"/>
  <rect x="3" y="6" width="10" height="1" fill="#106b5f"/>
`);

// 6. Netherite Helmet Warrior (Ancient Debris Alloy)
const netheriteKnightSvg = makeSvgDataUri(`
  <!-- Netherite Dark Plate -->
  <rect x="0" y="0" width="16" height="7" fill="#363239"/>
  <rect x="2" y="1" width="12" height="2" fill="#4d4750"/>
  <rect x="0" y="0" width="16" height="1" fill="#232025"/>
  <rect x="0" y="7" width="3" height="9" fill="#363239"/>
  <rect x="13" y="7" width="3" height="9" fill="#363239"/>
  <rect x="0" y="12" width="16" height="4" fill="#232025"/>
  <rect x="2" y="13" width="12" height="2" fill="#443e47"/>
  <!-- Visor Opening with Glowing Warrior Gaze -->
  <rect x="3" y="7" width="10" height="5" fill="#1b181e"/>
  <rect x="4" y="8" width="2" height="2" fill="#ff793f"/>
  <rect x="10" y="8" width="2" height="2" fill="#ff793f"/>
  <rect x="5" y="8" width="1" height="2" fill="#ffda79"/>
  <rect x="11" y="8" width="1" height="2" fill="#ffda79"/>
  <rect x="3" y="6" width="10" height="1" fill="#1a171d"/>
`);

// 7. Zombie (Overworld Monster)
const zombieSvg = makeSvgDataUri(`
  <!-- Dark Green Hair -->
  <rect x="0" y="0" width="16" height="5" fill="#294622"/>
  <rect x="0" y="5" width="2" height="4" fill="#294622"/>
  <rect x="14" y="5" width="2" height="4" fill="#294622"/>
  <!-- Rotting Green Skin -->
  <rect x="2" y="5" width="12" height="11" fill="#4d8e40"/>
  <rect x="0" y="9" width="2" height="7" fill="#3c7331"/>
  <rect x="14" y="9" width="2" height="7" fill="#3c7331"/>
  <!-- Dark Zombie Eyes -->
  <rect x="2" y="7" width="4" height="2" fill="#1c2b18"/>
  <rect x="10" y="7" width="4" height="2" fill="#1c2b18"/>
  <!-- Nose & Mouth -->
  <rect x="6" y="9" width="4" height="2" fill="#345e2c"/>
  <rect x="4" y="11" width="8" height="3" fill="#20381a"/>
`);

// 8. Skeleton (Undead Marksman)
const skeletonSvg = makeSvgDataUri(`
  <!-- Pale Bone Skull -->
  <rect x="0" y="0" width="16" height="16" fill="#c7c7c7"/>
  <rect x="2" y="1" width="12" height="3" fill="#dbdbdb"/>
  <rect x="0" y="0" width="16" height="1" fill="#b0b0b0"/>
  <!-- Deep Dark Eye Sockets -->
  <rect x="2" y="5" width="4" height="4" fill="#1c1c1c"/>
  <rect x="10" y="5" width="4" height="4" fill="#1c1c1c"/>
  <!-- Nose Cavity -->
  <rect x="7" y="8" width="2" height="2" fill="#1c1c1c"/>
  <!-- Teeth / Jaw Slits -->
  <rect x="2" y="12" width="12" height="1" fill="#1c1c1c"/>
  <rect x="4" y="11" width="1" height="3" fill="#1c1c1c"/>
  <rect x="7" y="11" width="1" height="3" fill="#1c1c1c"/>
  <rect x="9" y="11" width="1" height="3" fill="#1c1c1c"/>
  <rect x="11" y="11" width="1" height="3" fill="#1c1c1c"/>
`);

// 9. Warden (Deep Dark Sculk Titan)
const wardenSvg = makeSvgDataUri(`
  <!-- Deep Dark Sculk Base -->
  <rect x="0" y="0" width="16" height="16" fill="#082026"/>
  <!-- Acoustic Sensor Horns (Top Antlers) -->
  <rect x="1" y="0" width="3" height="3" fill="#1cf5ff"/>
  <rect x="12" y="0" width="3" height="3" fill="#1cf5ff"/>
  <rect x="2" y="3" width="2" height="3" fill="#0e6973"/>
  <rect x="12" y="3" width="2" height="3" fill="#0e6973"/>
  <!-- Sculk Texture Tendrils -->
  <rect x="4" y="2" width="8" height="4" fill="#0d353e"/>
  <rect x="0" y="6" width="16" height="10" fill="#082026"/>
  <!-- Resonating Glowing Chest Core / Face Markings -->
  <rect x="4" y="7" width="8" height="2" fill="#1cf5ff"/>
  <rect x="6" y="9" width="4" height="3" fill="#1cf5ff"/>
  <rect x="5" y="13" width="6" height="2" fill="#0e6973"/>
`);

// 10. Golden Apple (Glistening Enchantment)
const goldenAppleSvg = makeSvgDataUri(`
  <!-- Transparent Background / Dark Backdrop -->
  <rect x="0" y="0" width="16" height="16" fill="#1a1408"/>
  <!-- Apple Stem & Leaf -->
  <rect x="8" y="1" width="2" height="3" fill="#754817"/>
  <rect x="10" y="2" width="3" height="2" fill="#44b036"/>
  <!-- Golden Apple Silhouette -->
  <rect x="3" y="4" width="10" height="9" fill="#ffc814"/>
  <rect x="4" y="3" width="8" height="11" fill="#ffc814"/>
  <rect x="2" y="5" width="12" height="7" fill="#ffc814"/>
  <!-- Glistening Highlights -->
  <rect x="4" y="4" width="3" height="3" fill="#fff59e"/>
  <rect x="4" y="5" width="2" height="2" fill="#ffffff"/>
  <!-- Shadows -->
  <rect x="5" y="12" width="6" height="2" fill="#c48a00"/>
  <rect x="11" y="7" width="2" height="4" fill="#c48a00"/>
`);

// 11. Axolotl (Lucy - Cute Pink Aquatic Companion)
const axolotlSvg = makeSvgDataUri(`
  <!-- Body Pink -->
  <rect x="0" y="0" width="16" height="16" fill="#fbb0cf"/>
  <!-- Gills (Dark Magenta) -->
  <rect x="0" y="2" width="3" height="4" fill="#de4e88"/>
  <rect x="13" y="2" width="3" height="4" fill="#de4e88"/>
  <rect x="1" y="0" width="2" height="2" fill="#de4e88"/>
  <rect x="13" y="0" width="2" height="2" fill="#de4e88"/>
  <!-- Eyes -->
  <rect x="3" y="6" width="2" height="3" fill="#111111"/>
  <rect x="11" y="6" width="2" height="3" fill="#111111"/>
  <!-- Cheeks / Smile -->
  <rect x="6" y="10" width="4" height="2" fill="#f484b3"/>
  <rect x="7" y="11" width="2" height="1" fill="#de4e88"/>
`);

// 12. Redstone Core / Mech
const redstoneCoreSvg = makeSvgDataUri(`
  <!-- Dark Core Housing -->
  <rect x="0" y="0" width="16" height="16" fill="#2d2224"/>
  <rect x="2" y="2" width="12" height="12" fill="#42292d"/>
  <!-- Glowing Redstone Dust Crystal -->
  <rect x="4" y="4" width="8" height="8" fill="#ff2d2d"/>
  <rect x="5" y="3" width="6" height="10" fill="#ff2d2d"/>
  <rect x="3" y="5" width="10" height="6" fill="#ff2d2d"/>
  <!-- Hot Glow Core -->
  <rect x="6" y="6" width="4" height="4" fill="#ffa1a1"/>
  <rect x="7" y="7" width="2" height="2" fill="#ffffff"/>
  <!-- Shadow border -->
  <rect x="4" y="11" width="8" height="2" fill="#aa0e0e"/>
`);

export interface MinecraftPresetAvatar {
  id: string;
  name: string;
  category: 'Players' | 'Mobs' | 'Legendary';
  url: string;
}

export const MINECRAFT_AVATARS: MinecraftPresetAvatar[] = [
  {
    id: 'steve',
    name: 'Steve',
    category: 'Players',
    url: steveSvg,
  },
  {
    id: 'alex',
    name: 'Alex',
    category: 'Players',
    url: alexSvg,
  },
  {
    id: 'diamond_knight',
    name: 'Diamond Knight',
    category: 'Players',
    url: diamondKnightSvg,
  },
  {
    id: 'netherite_warrior',
    name: 'Netherite Warrior',
    category: 'Players',
    url: netheriteKnightSvg,
  },
  {
    id: 'creeper',
    name: 'Creeper',
    category: 'Mobs',
    url: creeperSvg,
  },
  {
    id: 'enderman',
    name: 'Enderman',
    category: 'Mobs',
    url: endermanSvg,
  },
  {
    id: 'zombie',
    name: 'Zombie',
    category: 'Mobs',
    url: zombieSvg,
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    category: 'Mobs',
    url: skeletonSvg,
  },
  {
    id: 'warden',
    name: 'Warden',
    category: 'Mobs',
    url: wardenSvg,
  },
  {
    id: 'axolotl',
    name: 'Axolotl',
    category: 'Mobs',
    url: axolotlSvg,
  },
  {
    id: 'golden_apple',
    name: 'Golden Apple',
    category: 'Legendary',
    url: goldenAppleSvg,
  },
  {
    id: 'redstone_core',
    name: 'Redstone Core',
    category: 'Legendary',
    url: redstoneCoreSvg,
  },
];
