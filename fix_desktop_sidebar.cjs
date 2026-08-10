const fs = require('fs');

const replaceInFile = (file, replacer) => {
  let content = fs.readFileSync(file, 'utf8');
  content = replacer(content);
  fs.writeFileSync(file, content);
};

replaceInFile('src/components/DesktopSidebar.tsx', content => {
  if (!content.includes('Sign In / Register')) {
    content = content.replace(
      /<span>Portal Homepage<\/span>\n\s*<\/span>\n\s*<span className="text-\[10px\] uppercase font-mono text-sky-400 font-bold">Main<\/span>\n\s*<\/button>/,
      `<span>Portal Homepage</span>\n          </span>\n          <span className="text-[10px] uppercase font-mono text-sky-400 font-bold">Main</span>\n        </button>\n        {!userEmail && (\n          <a\n            href="#/login"\n            className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all mb-4 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400"\n          >\n            <span className="flex items-center gap-2">\n              <User className="w-4 h-4 text-indigo-400" />\n              <span>Sign In / Register</span>\n            </span>\n          </a>\n        )}`
    );
    if (!content.includes('User')) {
       content = content.replace(/Home,/, "Home, User,");
    }
  }
  return content;
});
