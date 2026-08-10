const fs = require('fs');
let code = fs.readFileSync('src/lib/wikiApi.ts', 'utf8');

code = code.replace(
  /return \[\.\.\.PRESET_CATEGORIES, \.\.\.parsed\.map\(c => \(\{ \.\.\.c, isCustom: true \}\)\)\];/,
  `const all = [...PRESET_CATEGORIES, ...parsed.map(c => ({ ...c, isCustom: true }))];
          const unique = new Map();
          for (const item of all) { if (!unique.has(item.id)) unique.set(item.id, item); }
          return Array.from(unique.values());`
);

code = code.replace(
  /return \[\.\.\.presets, \.\.\.parsed\];/,
  `const all = [...presets, ...parsed];
          const unique = new Map();
          for (const item of all) { if (!unique.has(item.templateId)) unique.set(item.templateId, item); }
          return Array.from(unique.values());`
);

code = code.replace(
  /return \[\.\.\.missing, \.\.\.cleaned\];/,
  `const all = [...missing, ...cleaned];
          const unique = new Map();
          for (const item of all) { if (!unique.has(item.id)) unique.set(item.id, item); }
          return Array.from(unique.values());`
);

fs.writeFileSync('src/lib/wikiApi.ts', code);
console.log("Done patching");
