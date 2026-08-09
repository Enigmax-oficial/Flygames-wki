import { WikiPage } from '../types/wiki';
import boulderingZombieJson from './pages/bouldering-zombie.json';
import crystallineBerserkerJson from './pages/crystalline-berserker.json';
import aetherialSwordJson from './pages/aetherial-sword.json';
import addonInstallationGuideJson from './pages/addon-installation-guide.json';
import categoryMobsJson from './pages/category-mobs.json';
import categoryItemsJson from './pages/category-items.json';
import crystalCanyonBiomeJson from './pages/crystal-canyon-biome.json';

// Each wiki page, category, and biome is stored in its own separate JSON file for modularity and easy expansion
export const INITIAL_WIKI_PAGES: WikiPage[] = [
  categoryMobsJson as WikiPage,
  categoryItemsJson as WikiPage,
  boulderingZombieJson as WikiPage,
  crystallineBerserkerJson as WikiPage,
  aetherialSwordJson as WikiPage,
  crystalCanyonBiomeJson as WikiPage,
  addonInstallationGuideJson as WikiPage,
];
