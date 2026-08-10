const fs = require('fs');

const replaceInFile = (file, replacer) => {
  let content = fs.readFileSync(file, 'utf8');
  content = replacer(content);
  fs.writeFileSync(file, content);
};

replaceInFile('src/App.tsx', content => {
  // Move Header inside the false branch of the ternary
  
  content = content.replace(
    /\{\/\* Top Header \*\/\}[\s\S]*?<Header[\s\S]*?\/>/,
    ""
  );

  content = content.replace(
    /<>\n\s*\{\/\* Main Container Layout \*\/\}/,
    `<>
      {/* Top Header */}
      <Header
        addonVersion="v1.4.0"
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAdminPanel={() => navigateToPage('admin-panel')}
        onToggleMobileDrawer={() => setIsMobileDrawerOpen(true)}
        onToggleDesktopSidebar={toggleDesktopSidebar}
        isDesktopSidebarOpen={isDesktopSidebarOpen}
        onGoHome={() => navigateToPage('home')}
        onOpenLogin={() => navigateToPage('login')}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        user={user}
        userEmail={userEmail}
        onLogout={handleLogout}
      />
      {/* Main Container Layout */}`
  );

  return content;
});
