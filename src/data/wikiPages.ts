import { WikiPage } from '../types/wiki';

// Dynamically import all JSON files inside src/data/pages and its subdirectories using Vite's glob import
const jsonFiles = import.meta.glob('./pages/**/*.json', { eager: true });

export const INITIAL_WIKI_PAGES: WikiPage[] = Object.entries(jsonFiles).map(([filePath, module]: [string, any]) => {
  const content = module.default || module;
  
  // Extract file name (without .json extension) and folder name from path
  // Example path: "./pages/mobs/bouldering-zombie.json"
  const pathParts = filePath.split('/');
  const fileName = pathParts[pathParts.length - 1].replace('.json', '');
  const folderName = pathParts[pathParts.length - 2]; // e.g. "mobs", "items", "biomes"

  const derivedId = fileName;
  const derivedCategory = folderName;

  // Derive a clean, consistent namespace based on the folder/category name
  const singularType = 
    derivedCategory === 'mobs' ? 'mob' :
    derivedCategory === 'biomes' ? 'biome' :
    derivedCategory === 'items' ? 'item' :
    derivedCategory === 'blocks' ? 'block' :
    derivedCategory === 'recipes' ? 'recipe' : 'guide';

  const derivedNamespace = `aetheria:${singularType}/${derivedId.replace(/-/g, '_')}`;

  return {
    ...content,
    id: derivedId,
    category: derivedCategory,
    namespace: derivedNamespace
  } as WikiPage;
});

