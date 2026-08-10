const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

// Ensure output directories exist
const categories = ['tools', 'weapons', 'items', 'mobs', 'blocks', 'biomes', 'recipes', 'categories'];
categories.forEach(cat => {
  const dir = path.join(__dirname, 'public', 'images', cat);
  fs.mkdirSync(dir, { recursive: true });
});

// Color palettes
const PALETTES = {
  wooden: { main: [139, 90, 43, 255], highlight: [180, 120, 60, 255], dark: [80, 50, 20, 255] },
  stone: { main: [128, 128, 128, 255], highlight: [180, 180, 180, 255], dark: [70, 70, 70, 255] },
  iron: { main: [215, 215, 215, 255], highlight: [255, 255, 255, 255], dark: [150, 150, 150, 255] },
  golden: { main: [255, 215, 0, 255], highlight: [255, 240, 120, 255], dark: [197, 144, 0, 255] },
  diamond: { main: [47, 210, 224, 255], highlight: [165, 243, 252, 255], dark: [8, 145, 178, 255] },
  netherite: { main: [74, 59, 67, 255], highlight: [115, 98, 108, 255], dark: [42, 31, 37, 255] },
  copper: { main: [217, 119, 87, 255], highlight: [248, 162, 133, 255], dark: [160, 74, 47, 255] },
  stick: { main: [118, 83, 43, 255], dark: [78, 53, 23, 255] }
};

function createPNG16(pixelMap) {
  const png = new PNG({ width: 16, height: 16 });
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const idx = (16 * y + x) << 2;
      const color = pixelMap[y]?.[x] || [0, 0, 0, 0];
      png.data[idx] = color[0];
      png.data[idx + 1] = color[1];
      png.data[idx + 2] = color[2];
      png.data[idx + 3] = color[3];
    }
  }
  return PNG.sync.write(png);
}

// Pixel map generators (16x16)
function generateSword(matKey) {
  const p = PALETTES[matKey] || PALETTES.iron;
  const s = PALETTES.stick;
  const map = Array.from({ length: 16 }, () => Array(16).fill(null));

  // Blade (diagonal)
  for (let i = 0; i < 8; i++) {
    const x = 12 - i;
    const y = 3 + i;
    map[y][x] = p.main;
    if (x + 1 < 16) map[y][x + 1] = p.highlight;
    if (y - 1 >= 0) map[y - 1][x] = p.highlight;
  }
  // Tip
  map[2][13] = p.highlight;
  map[1][14] = p.highlight;

  // Guard
  map[11][3] = p.dark;
  map[11][4] = p.dark;
  map[11][5] = p.dark;
  map[10][5] = p.dark;
  map[12][3] = p.dark;

  // Handle
  map[12][2] = s.main;
  map[13][1] = s.dark;

  // Pommel
  map[14][0] = p.dark;

  return createPNG16(map);
}

function generatePickaxe(matKey) {
  const p = PALETTES[matKey] || PALETTES.iron;
  const s = PALETTES.stick;
  const map = Array.from({ length: 16 }, () => Array(16).fill(null));

  // Stick
  for (let i = 0; i < 11; i++) {
    const x = 3 + i;
    const y = 13 - i;
    map[y][x] = s.main;
  }

  // Head
  map[1][10] = p.highlight;
  map[1][11] = p.main;
  map[1][12] = p.main;
  map[1][13] = p.main;
  map[2][13] = p.dark;
  map[3][13] = p.dark;

  map[2][8] = p.main;
  map[3][7] = p.main;
  map[4][6] = p.main;
  map[5][5] = p.dark;

  map[2][10] = p.dark;
  map[2][11] = p.main;
  map[3][11] = p.dark;

  return createPNG16(map);
}

function generateAxe(matKey) {
  const p = PALETTES[matKey] || PALETTES.iron;
  const s = PALETTES.stick;
  const map = Array.from({ length: 16 }, () => Array(16).fill(null));

  // Stick
  for (let i = 0; i < 11; i++) {
    const x = 3 + i;
    const y = 13 - i;
    map[y][x] = s.main;
  }

  // Head
  map[1][10] = p.highlight;
  map[1][11] = p.highlight;
  map[1][12] = p.main;
  map[2][9] = p.main;
  map[2][10] = p.main;
  map[2][11] = p.main;
  map[2][12] = p.main;
  map[3][9] = p.main;
  map[3][10] = p.dark;
  map[3][11] = p.dark;
  map[4][8] = p.main;
  map[4][9] = p.dark;

  return createPNG16(map);
}

function generateShovel(matKey) {
  const p = PALETTES[matKey] || PALETTES.iron;
  const s = PALETTES.stick;
  const map = Array.from({ length: 16 }, () => Array(16).fill(null));

  // Stick
  for (let i = 0; i < 11; i++) {
    const x = 2 + i;
    const y = 14 - i;
    map[y][x] = s.main;
  }

  // Head
  map[1][12] = p.highlight;
  map[1][13] = p.highlight;
  map[2][11] = p.main;
  map[2][12] = p.main;
  map[2][13] = p.main;
  map[3][10] = p.dark;
  map[3][11] = p.main;
  map[3][12] = p.dark;
  map[4][10] = p.dark;

  return createPNG16(map);
}

function generateHoe(matKey) {
  const p = PALETTES[matKey] || PALETTES.iron;
  const s = PALETTES.stick;
  const map = Array.from({ length: 16 }, () => Array(16).fill(null));

  // Stick
  for (let i = 0; i < 11; i++) {
    const x = 3 + i;
    const y = 13 - i;
    map[y][x] = s.main;
  }

  // Blade
  map[1][10] = p.highlight;
  map[1][11] = p.highlight;
  map[1][12] = p.main;
  map[2][9] = p.main;
  map[2][10] = p.dark;

  return createPNG16(map);
}

// Icon generators
function generateHeart() {
  const red = [239, 68, 68, 255];
  const darkRed = [185, 28, 28, 255];
  const map = Array.from({ length: 16 }, () => Array(16).fill(null));

  const coords = [
    [3,2],[4,2],[5,2],[10,2],[11,2],[12,2],
    [2,3],[3,3],[4,3],[5,3],[6,3],[9,3],[10,3],[11,3],[12,3],[13,3],
    [2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],[12,4],[13,4],
    [2,5],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],[12,5],[13,5],
    [3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6],[10,6],[11,6],[12,6],
    [4,7],[5,7],[6,7],[7,7],[8,7],[9,7],[10,7],[11,7],
    [5,8],[6,8],[7,8],[8,8],[9,8],[10,8],
    [6,9],[7,9],[8,9],[9,9],
    [7,10],[8,10]
  ];

  coords.forEach(([x, y]) => {
    map[y][x] = (y > 7 || x === 2 || x === 13) ? darkRed : red;
  });

  return createPNG16(map);
}

function generateShield() {
  const blue = [56, 189, 248, 255];
  const darkBlue = [3, 105, 161, 255];
  const map = Array.from({ length: 16 }, () => Array(16).fill(null));

  for (let y = 2; y <= 12; y++) {
    const width = y <= 7 ? 5 : (12 - y);
    for (let x = 8 - width; x <= 8 + width; x++) {
      map[y][x] = (x === 8 - width || x === 8 + width || y === 12) ? darkBlue : blue;
    }
  }

  return createPNG16(map);
}

function generateCategoryIcon(color, border) {
  const map = Array.from({ length: 16 }, () => Array(16).fill(null));
  for (let y = 2; y <= 13; y++) {
    for (let x = 2; x <= 13; x++) {
      if (x === 2 || x === 13 || y === 2 || y === 13) {
        map[y][x] = border;
      } else {
        map[y][x] = color;
      }
    }
  }
  return createPNG16(map);
}

// Generate files
const materials = ['wooden', 'stone', 'iron', 'golden', 'diamond', 'netherite', 'copper'];
const tools = [
  { name: 'sword', gen: generateSword, cat: 'weapons' },
  { name: 'axe', gen: generateAxe, cat: 'tools' },
  { name: 'pickaxe', gen: generatePickaxe, cat: 'tools' },
  { name: 'shovel', gen: generateShovel, cat: 'tools' },
  { name: 'hoe', gen: generateHoe, cat: 'tools' }
];

materials.forEach(mat => {
  tools.forEach(t => {
    const filename = `${mat}_${t.name}.png`;
    const buffer = t.gen(mat);
    fs.writeFileSync(path.join(__dirname, 'public', 'images', t.cat, filename), buffer);
    
    // Also save a fallback generic copy if needed
    if (mat === 'diamond') {
      fs.writeFileSync(path.join(__dirname, 'public', 'images', t.cat, `${t.name}.png`), buffer);
    }
  });
});

// Items / Stats icons
fs.writeFileSync(path.join(__dirname, 'public', 'images', 'items', 'heart.png'), generateHeart());
fs.writeFileSync(path.join(__dirname, 'public', 'images', 'items', 'shield.png'), generateShield());

// Categories
fs.writeFileSync(path.join(__dirname, 'public', 'images', 'categories', 'mobs.png'), generateCategoryIcon([244, 63, 94, 255], [159, 18, 57, 255]));
fs.writeFileSync(path.join(__dirname, 'public', 'images', 'categories', 'items.png'), generateCategoryIcon([245, 158, 11, 255], [180, 83, 9, 255]));
fs.writeFileSync(path.join(__dirname, 'public', 'images', 'categories', 'blocks.png'), generateCategoryIcon([56, 189, 248, 255], [3, 105, 161, 255]));
fs.writeFileSync(path.join(__dirname, 'public', 'images', 'categories', 'recipes.png'), generateCategoryIcon([6, 182, 212, 255], [14, 116, 144, 255]));
fs.writeFileSync(path.join(__dirname, 'public', 'images', 'categories', 'biomes.png'), generateCategoryIcon([168, 85, 247, 255], [126, 34, 206, 255]));
fs.writeFileSync(path.join(__dirname, 'public', 'images', 'categories', 'guides.png'), generateCategoryIcon([34, 197, 94, 255], [21, 128, 61, 255]));

console.log('PNG assets generated successfully in category subfolders under /public/images/');
