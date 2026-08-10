const fs = require('fs');

const replaceInFile = (file, replacer) => {
  let content = fs.readFileSync(file, 'utf8');
  content = replacer(content);
  fs.writeFileSync(file, content);
};

// 1. Header.tsx
replaceInFile('src/components/Header.tsx', content => {
  content = content.replace(/const isAdmin = true; \/\/ Authentication 2.0 open to challenge/g, `const authorizedEmails = ['ruanpablolopesbritor@gmail.com', 'ruanpablolopesbritoruan@gmail.com'];\n  const isAdmin = userEmail && authorizedEmails.includes(userEmail.toLowerCase().trim());`);
  return content;
});

// 2. MobileDrawer.tsx
replaceInFile('src/components/MobileDrawer.tsx', content => {
  content = content.replace(/const isAdmin = true; \/\/ Authentication 2.0/g, `const authorizedEmails = ['ruanpablolopesbritor@gmail.com', 'ruanpablolopesbritoruan@gmail.com'];\n  const isAdmin = userEmail && authorizedEmails.includes(userEmail.toLowerCase().trim());`);
  // Handle open to challenge variant if it exists
  content = content.replace(/const isAdmin = true; \/\/ Authentication 2.0 open to challenge/g, `const authorizedEmails = ['ruanpablolopesbritor@gmail.com', 'ruanpablolopesbritoruan@gmail.com'];\n  const isAdmin = userEmail && authorizedEmails.includes(userEmail.toLowerCase().trim());`);
  return content;
});

// 3. DesktopSidebar.tsx
replaceInFile('src/components/DesktopSidebar.tsx', content => {
  content = content.replace(/const isAdmin = true; \/\/ Authentication 2.0/g, `const authorizedEmails = ['ruanpablolopesbritor@gmail.com', 'ruanpablolopesbritoruan@gmail.com'];\n  const isAdmin = userEmail && authorizedEmails.includes(userEmail.toLowerCase().trim());`);
  // Handle open to challenge variant if it exists
  content = content.replace(/const isAdmin = true; \/\/ Authentication 2.0 open to challenge/g, `const authorizedEmails = ['ruanpablolopesbritor@gmail.com', 'ruanpablolopesbritoruan@gmail.com'];\n  const isAdmin = userEmail && authorizedEmails.includes(userEmail.toLowerCase().trim());`);
  return content;
});

// 4. AdminPanel.tsx (if we need to restrict rendering it as well)
replaceInFile('src/components/AdminPanel.tsx', content => {
  if (!content.includes('authorizedEmails')) {
    content = content.replace(/const \[passwordInput, setPasswordInput\] = useState/g, `const authorizedEmails = ['ruanpablolopesbritor@gmail.com', 'ruanpablolopesbritoruan@gmail.com'];\n  const isAuthorized = userEmail && authorizedEmails.includes(userEmail.toLowerCase().trim());\n\n  const [passwordInput, setPasswordInput] = useState`);
    content = content.replace(/\/\/ Password prompt check for authorized admin\n  if \(!isAdminAuthenticated\) \{/g, `if (!isAuthorized) {\n    return (\n      <div className="max-w-3xl mx-auto p-8 bg-[#111827] border border-rose-500/20 rounded-2xl text-center space-y-4 shadow-xl my-10 font-sans">\n        <h2 className="text-xl font-bold text-white">Access Denied</h2>\n        <p className="text-sm text-slate-400 max-w-md mx-auto">\n          This administration panel is restricted exclusively to authorized administrator accounts.\n        </p>\n        <button \n          onClick={onClosePanel}\n          className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"\n        >\n          Return to Dashboard\n        </button>\n      </div>\n    );\n  }\n\n  // Password prompt check for authorized admin\n  if (isAuthorized && !isAdminAuthenticated) {`);
  }
  return content;
});

// 5. server.ts
replaceInFile('server.ts', content => {
  if (!content.includes('authorizedEmails')) {
    content = content.replace(/app\.post\('\/api\/admin\/verify', \(req, res\) => \{\n  const \{ email, password \} = req\.body;/g, `app.post('/api/admin/verify', (req, res) => {\n  const { email, password } = req.body;\n  const authorizedEmails = ['ruanpablolopesbritor@gmail.com', 'ruanpablolopesbritoruan@gmail.com'];\n  if (!email || !authorizedEmails.includes(email.toLowerCase().trim())) {\n    return res.status(403).json({ success: false, message: 'Unauthorized email account.' });\n  }`);
  }
  return content;
});
