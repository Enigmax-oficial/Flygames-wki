const fs = require('fs');

const replaceInFile = (file, replacer) => {
  let content = fs.readFileSync(file, 'utf8');
  content = replacer(content);
  fs.writeFileSync(file, content);
};

replaceInFile('src/App.tsx', content => {
  // Import LoginPage
  content = content.replace(
    /import \{ LoginModal \} from '\.\/components\/LoginModal';/,
    "import { LoginPage } from './components/LoginPage';"
  );
  
  // Remove isLoginOpen
  content = content.replace(/const \[isLoginOpen, setIsLoginOpen\] = useState\(false\);\n/, '');

  // Add login route in parseRoute
  content = content.replace(
    /if \(rawHash === 'admin-panel'\) \{/,
    "if (rawHash === 'login') {\n      return { pageId: 'login', category: 'all' as CategoryType | 'all' };\n    }\n    if (rawHash === 'admin-panel') {"
  );

  // Add login to navigateToPage
  content = content.replace(
    /if \(pageId === 'admin-panel'\) \{/,
    "if (pageId === 'login') {\n      window.location.hash = '#/login';\n      setSelectedPageId('login');\n      return;\n    }\n    if (pageId === 'admin-panel') {"
  );

  // Replace Header login
  content = content.replace(
    /onOpenLogin=\{.*?setIsLoginOpen\(true\).*?\}/,
    "onOpenLogin={() => navigateToPage('login')}"
  );

  // Add Login page in render (outside of main layout if we want, or inside. Let's put it at the root if selectedPageId === 'login' to be a full separate page)
  const mainLayoutStart = '{/* Main Container Layout */}';
  
  const modifiedRenderStart = `
      {selectedPageId === 'login' ? (
        <LoginPage 
          onBack={() => navigateToPage('home')}
          onLoginSuccess={(name, email) => {
            handleLoginSuccess(name, email);
            navigateToPage('home');
          }}
        />
      ) : (
        <>
          {/* Main Container Layout */}`;

  content = content.replace(mainLayoutStart, modifiedRenderStart);

  // we need to close the fragment after main layout and footer. 
  const searchModalLoc = '{/* Modals */}';
  content = content.replace(searchModalLoc, `
        </>
      )}
      {/* Modals */}
  `);

  // Remove LoginModal
  content = content.replace(/<LoginModal[\s\S]*?\/>\s*/, '');

  return content;
});
