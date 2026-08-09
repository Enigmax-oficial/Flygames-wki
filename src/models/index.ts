import climberZombieModel from './climber_zombie.json';
import crystallineBerserkerModel from './crystalline_berserker.json';

export interface BedrockCube {
  origin: [number, number, number];
  size: [number, number, number];
  uv?: [number, number];
  inflate?: number;
  mirror?: boolean;
}

export interface BedrockBone {
  name: string;
  parent?: string;
  pivot?: [number, number, number];
  rotation?: [number, number, number];
  mirror?: boolean;
  cubes?: BedrockCube[];
}

export interface BedrockGeometry {
  description: {
    identifier: string;
    texture_width: number;
    texture_height: number;
    visible_bounds_width?: number;
    visible_bounds_height?: number;
    visible_bounds_offset?: [number, number, number];
  };
  bones: BedrockBone[];
}

export interface BedrockModelFile {
  format_version: string;
  'minecraft:geometry': BedrockGeometry[];
}

export const MINECRAFT_MODELS_REGISTRY: Record<string, BedrockModelFile> = {
  'bouldering_zombie': climberZombieModel as BedrockModelFile,
  'climber_zombie': climberZombieModel as BedrockModelFile,
  'crystalline_berserker': crystallineBerserkerModel as BedrockModelFile,
};

// Texture generator helper to create authentic Minecraft mob textures for models
export function createDefaultMinecraftTexture(identifier: string, width = 100, height = 32): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Base background
  ctx.fillStyle = identifier.includes('crystalline') ? '#1e1b4b' : '#3f6212';
  ctx.fillRect(0, 0, width, height);

  // Add Minecraft pixel noise pattern
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const isCrystal = identifier.includes('crystalline');

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 35;
    if (isCrystal) {
      data[i] = Math.max(0, Math.min(255, 56 + noise * 1.5));      // Red / Cyan accent
      data[i + 1] = Math.max(0, Math.min(255, 189 + noise));        // Green
      data[i + 2] = Math.max(0, Math.min(255, 248 + noise * 0.5));    // Blue
    } else {
      // Zombie / Climber Green & Dirt tones
      data[i] = Math.max(0, Math.min(255, 74 + noise));           // R
      data[i + 1] = Math.max(0, Math.min(255, 120 + noise * 1.2));   // G
      data[i + 2] = Math.max(0, Math.min(255, 45 + noise));          // B
    }
    data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  // Draw face features on UV region (0,0 to 32,16 for head)
  if (isCrystal) {
    ctx.fillStyle = '#60a5fa'; // Eyes
    ctx.fillRect(2, 4, 2, 2);
    ctx.fillRect(6, 4, 2, 2);
  } else {
    // Zombie dark eyes and mouth
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(2, 4, 2, 2);
    ctx.fillRect(6, 4, 2, 2);
    ctx.fillRect(3, 7, 4, 2);
  }

  return canvas.toDataURL();
}
