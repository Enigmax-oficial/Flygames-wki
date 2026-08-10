const fs = require('fs');

let file = fs.readFileSync('src/components/Infobox.tsx', 'utf8');
file = file.replace(/page\.tags\?\.map\(\(tag\) => \(/g, 'page.tags?.map((tag, idx) => (');
file = file.replace(/key=\{tag\}/g, 'key={`${tag}-${idx}`}');
file = file.replace(/Object\.entries\(page\.customProperties\)\.map\(\(\[key, val\]\) => \(/g, 'Object.entries(page.customProperties).map(([key, val], idx) => (');
file = file.replace(/key=\{key\}/g, 'key={`${key}-${idx}`}');
fs.writeFileSync('src/components/Infobox.tsx', file);

file = fs.readFileSync('src/components/CategoryOverviewPage.tsx', 'utf8');
file = file.replace(/allTags\.map\(\(tag\) => \(/g, 'allTags.map((tag, idx) => (');
// The second one was: key={tag}, we replaced it generally in the file? 
// No, let's be careful.
file = file.replace(/key=\{tag\}/g, 'key={`${tag}-${idx}`}');
// Also categories switcher
file = file.replace(/\(\['all', 'items', 'mobs', 'blocks', 'recipes', 'biomes', 'guides'\] as const\)\.map\(\(cat\) => \(/g, `(['all', 'items', 'mobs', 'blocks', 'recipes', 'biomes', 'guides'] as const).map((cat, idx) => (`);
file = file.replace(/key=\{cat\}/g, 'key={`${cat}-${idx}`}');
fs.writeFileSync('src/components/CategoryOverviewPage.tsx', file);

file = fs.readFileSync('src/components/SearchModal.tsx', 'utf8');
file = file.replace(/Array\.from\(new Set\(pages\.map\(p => p\.category\)\)\)\.map\(cat => \(/g, 'Array.from(new Set(pages.map(p => p.category))).map((cat, idx) => (');
file = file.replace(/key=\{cat\}/g, 'key={`${cat}-${idx}`}');
fs.writeFileSync('src/components/SearchModal.tsx', file);

console.log("Done");
