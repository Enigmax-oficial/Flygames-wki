const fs = require('fs');

const replaceInFile = (file, replacer) => {
  let content = fs.readFileSync(file, 'utf8');
  content = replacer(content);
  fs.writeFileSync(file, content);
};

// 1. Remove authorizedEmails from AdminPanel.tsx
replaceInFile('src/components/AdminPanel.tsx', content => {
  content = content.replace(/const authorizedEmails = \[.*?\];\n\s*const isAuthorized = userEmail && authorizedEmails.includes\(userEmail\.toLowerCase\(\)\.trim\(\)\);/g, '');
  content = content.replace(/if \(!isAuthorized\) \{[\s\S]*?\}\n\n\s*\/\/ Password prompt check for authorized admin\n\s*if \(isAuthorized && !isAdminAuthenticated\) \{/g, '// Password prompt check for authorized admin\n  if (!isAdminAuthenticated) {');
  content = content.replace(/Administrator Authentication Required/g, 'Authentication 2.0');
  content = content.replace(/Admin Password/g, 'Authentication 2.0 Password');
  content = content.replace(/Admin Control Panel/g, 'Authentication 2.0 Control Panel');
  return content;
});

// 2. Fix Header.tsx
replaceInFile('src/components/Header.tsx', content => {
  content = content.replace(/const authorizedEmails = \[.*?\];\n\s*const isAdmin = userEmail && authorizedEmails.includes\(userEmail\.toLowerCase\(\)\.trim\(\)\);/g, 'const isAdmin = true; // Authentication 2.0 open to challenge');
  return content;
});

// 3. Fix MobileDrawer.tsx
replaceInFile('src/components/MobileDrawer.tsx', content => {
  content = content.replace(/const authorizedEmails = \[.*?\];\n\s*const isAdmin = userEmail && authorizedEmails.includes\(userEmail\.toLowerCase\(\)\.trim\(\)\);/g, 'const isAdmin = true; // Authentication 2.0 open to challenge');
  return content;
});

// 4. Fix DesktopSidebar.tsx
replaceInFile('src/components/DesktopSidebar.tsx', content => {
  content = content.replace(/const authorizedEmails = \[.*?\];\n\s*const isAdmin = userEmail && authorizedEmails.includes\(userEmail\.toLowerCase\(\)\.trim\(\)\);/g, 'const isAdmin = true; // Authentication 2.0 open to challenge');
  return content;
});

// 5. Fix server.ts
replaceInFile('server.ts', content => {
  content = content.replace(/const authorizedEmails = \[.*?\];\n\s*if \(!email \|\| !authorizedEmails\.includes\(email\.toLowerCase\(\)\.trim\(\)\)\) \{[\s\S]*?\}/g, '');
  content = content.replace(/message: 'Admin authentication successful via encrypted SQL token.'/g, "message: 'Authentication 2.0 successful.'");
  return content;
});

