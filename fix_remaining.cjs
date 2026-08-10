const fs = require('fs');

const replaceInFile = (file, replacer) => {
  let content = fs.readFileSync(file, 'utf8');
  content = replacer(content);
  fs.writeFileSync(file, content);
};

// 1. MobileDrawer.tsx
replaceInFile('src/components/MobileDrawer.tsx', content => {
  content = content.replace(/const authorizedEmails = \[.*?\];\n\s*const isAdmin = userEmail && authorizedEmails\.includes\(userEmail\.toLowerCase\(\)\.trim\(\)\);/g, 'const isAdmin = true; // Authentication 2.0');
  return content;
});

// 2. DesktopSidebar.tsx
replaceInFile('src/components/DesktopSidebar.tsx', content => {
  content = content.replace(/const authorizedEmails = \[.*?\];\n\s*const isAdmin = userEmail && authorizedEmails\.includes\(userEmail\.toLowerCase\(\)\.trim\(\)\);/g, 'const isAdmin = true; // Authentication 2.0');
  return content;
});

// 3. AccountModal.tsx
replaceInFile('src/components/AccountModal.tsx', content => {
  content = content.replace(/userEmail = 'ruanpablolopesbritoruan@gmail.com',/g, 'userEmail = \'\',');
  content = content.replace(/useState\(userEmail \|\| 'ruanpablolopesbritoruan@gmail.com'\);/g, 'useState(userEmail || \'\');');
  content = content.replace(/const displayEmail = userEmail \|\| 'ruanpablolopesbritoruan@gmail.com';/g, 'const displayEmail = userEmail || \'\';');
  content = content.replace(/displayEmail\.toLowerCase\(\)\.includes\('ruanpablolopesbrito'\) \|\|/g, '');
  content = content.replace(/<code className="text-sky-300 font-mono">ruanpablolopesbritoruan@gmail\.com<\/code>/g, '<code className="text-sky-300 font-mono">None</code>');
  return content;
});

// 4. LoginModal.tsx
replaceInFile('src/components/LoginModal.tsx', content => {
  content = content.replace(/onLoginSuccess\('Ruan Pablo', 'ruanpablolopesbritoruan@gmail.com'\);/g, "onLoginSuccess('Guest', '');");
  return content;
});

