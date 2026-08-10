const fs = require('fs');

const replaceInFile = (file, replacer) => {
  let content = fs.readFileSync(file, 'utf8');
  content = replacer(content);
  fs.writeFileSync(file, content);
};

replaceInFile('src/components/MobileDrawer.tsx', content => {
  content = content.replace(
    /className="p-1\.5 rounded-lg bg-\[#1e293b\] text-\[#94a3b8\] hover:text-white border border-\[#334155\]"\n\s*>\n\s*<X className="w-5 h-5" \/>/,
    'onClick={onClose}\n            className="p-1.5 rounded-lg bg-[#1e293b] text-[#94a3b8] hover:text-white border border-[#334155]"\n          >\n            <X className="w-5 h-5" />'
  );
  return content;
});
