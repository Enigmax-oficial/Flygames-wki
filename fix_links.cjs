const fs = require('fs');

const replaceInFile = (file, replacer) => {
  let content = fs.readFileSync(file, 'utf8');
  content = replacer(content);
  fs.writeFileSync(file, content);
};

replaceInFile('src/components/Header.tsx', content => {
  content = content.replace(
    /<button\n\s*onClick=\{onOpenLogin\}\n\s*className="flex items-center gap-2 px-4 py-1\.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs sm:text-sm transition-all shadow-\[0_0_15px_rgba\(56,189,248,0\.3\)\] active:scale-95 cursor-pointer"\n\s*>/,
    `<a\n              href="#/login"\n              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(56,189,248,0.3)] active:scale-95 cursor-pointer"\n            >`
  );
  content = content.replace(
    /<span>Login<\/span>\n\s*<\/button>/,
    `<span>Login</span>\n            </a>`
  );
  return content;
});

replaceInFile('src/components/MobileDrawer.tsx', content => {
  content = content.replace(
    /<button\n\s*onClick=\{onClose\}\n\s*className="p-1\.5 rounded-lg bg-\[#1e293b\] text-\[#94a3b8\] hover:text-white border border-\[#334155\]"\n\s*>\n\s*<X className="w-5 h-5" \/>\n\s*<\/button>/,
    `<button\n            onClick={onClose}\n            className="p-1.5 rounded-lg bg-[#1e293b] text-[#94a3b8] hover:text-white border border-[#334155]"\n          >\n            <X className="w-5 h-5" />\n          </button>`
  );
  content = content.replace(
    /<button\n\s*onClick=\{\(\) => \{\n\s*onClose\(\);\n\s*window\.location\.hash = '#\/login';\n\s*\}\}\n\s*className="w-full py-2\.5 px-3 bg-indigo-500\/10 hover:bg-indigo-500\/20 border border-indigo-500\/30 text-indigo-400 font-bold rounded-xl text-xs flex items-center gap-2"\n\s*>/,
    `<a\n              href="#/login"\n              onClick={onClose}\n              className="w-full py-2.5 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-bold rounded-xl text-xs flex items-center gap-2"\n            >`
  );
  content = content.replace(
    /<span>Sign In \/ Register<\/span>\n\s*<\/button>/,
    `<span>Sign In / Register</span>\n            </a>`
  );
  return content;
});

replaceInFile('src/components/DesktopSidebar.tsx', content => {
  content = content.replace(
    /<button\n\s*onClick=\{\(\) => \{\n\s*window\.location\.hash = '#\/login';\n\s*\}\}\n\s*className="w-full p-2\.5 bg-indigo-500\/10 hover:bg-indigo-500\/20 border border-indigo-500\/30 text-indigo-400 font-bold rounded-xl text-xs flex items-center gap-2 transition"\n\s*>/,
    `<a\n              href="#/login"\n              className="w-full p-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-bold rounded-xl text-xs flex items-center gap-2 transition"\n            >`
  );
  content = content.replace(
    /<span>Sign In \/ Register<\/span>\n\s*<\/button>/,
    `<span>Sign In / Register</span>\n            </a>`
  );
  return content;
});

