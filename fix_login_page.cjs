const fs = require('fs');

const replaceInFile = (file, replacer) => {
  let content = fs.readFileSync(file, 'utf8');
  content = replacer(content);
  fs.writeFileSync(file, content);
};

replaceInFile('src/components/LoginPage.tsx', content => {
  // Add a clear text redirect link at the bottom of LoginPage.
  if (!content.includes('Return to Home Portal')) {
    content = content.replace(
      /<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*\);\n\};\n/,
      `</div>\n        {/* Redirect Link Back */}\n        <div className="p-4 bg-[#0b0f19] border-t border-[#1e293b] text-center">\n          <button onClick={onBack} className="text-sky-400 hover:underline font-bold text-xs cursor-pointer">\n            ← Return to Home Portal\n          </button>\n        </div>\n      </div>\n    </div>\n  );\n};\n`
    );
  }
  return content;
});
