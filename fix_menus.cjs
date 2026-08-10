const fs = require('fs');

const replaceInFile = (file, replacer) => {
  let content = fs.readFileSync(file, 'utf8');
  content = replacer(content);
  fs.writeFileSync(file, content);
};

// Update MobileDrawer
replaceInFile('src/components/MobileDrawer.tsx', content => {
  if (!content.includes('Sign In / Register')) {
    content = content.replace(
      /<span>Portal Homepage<\/span>\n\s*<\/button>/,
      `<span>Portal Homepage</span>\n          </button>\n          {!userEmail && (\n            <button\n              onClick={() => {\n                onClose();\n                window.location.hash = '#/login';\n              }}\n              className="w-full py-2.5 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-bold rounded-xl text-xs flex items-center gap-2"\n            >\n              <User className="w-4 h-4 text-indigo-400" />\n              <span>Sign In / Register</span>\n            </button>\n          )}`
    );
    if (!content.includes('User')) {
       content = content.replace(/X,\s*Home,/, "X, Home, User,");
    }
  }
  return content;
});

// Update DesktopSidebar
replaceInFile('src/components/DesktopSidebar.tsx', content => {
  if (!content.includes('Sign In / Register')) {
    content = content.replace(
      /<span>Portal Home<\/span>\n\s*<\/button>/,
      `<span>Portal Home</span>\n          </button>\n          {!userEmail && (\n            <button\n              onClick={() => {\n                window.location.hash = '#/login';\n              }}\n              className="w-full p-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-bold rounded-xl text-xs flex items-center gap-2 transition"\n            >\n              <Home className="w-4 h-4 text-indigo-400" />\n              <span>Sign In / Register</span>\n            </button>\n          )}`
    );
  }
  return content;
});
