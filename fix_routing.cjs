const fs = require('fs');

const replaceInFile = (file, replacer) => {
  let content = fs.readFileSync(file, 'utf8');
  content = replacer(content);
  fs.writeFileSync(file, content);
};

replaceInFile('src/App.tsx', content => {
  // Update parseRoute
  content = content.replace(
    /const rawHash = window\.location\.hash\.replace\(\/\^#\\\/\?\/, ''\);/,
    "const rawHash = window.location.pathname.replace(/^\\//, '');"
  );
  
  // Replace handleHashChange to handlePopState
  content = content.replace(
    /const handleHashChange = \(\) => \{/g,
    "const handlePopState = () => {"
  );
  content = content.replace(
    /handleHashChange\(\);/g,
    "handlePopState();"
  );
  content = content.replace(
    /window\.addEventListener\('hashchange', handleHashChange\);/g,
    "window.addEventListener('popstate', handlePopState);"
  );
  content = content.replace(
    /window\.removeEventListener\('hashchange', handleHashChange\);/g,
    "window.removeEventListener('popstate', handlePopState);"
  );

  // Update navigateToPage
  content = content.replace(
    /window\.location\.hash = '#\/portal';/g,
    "window.history.pushState(null, '', '/portal'); window.dispatchEvent(new Event('popstate'));"
  );
  content = content.replace(
    /window\.location\.hash = '#\/login';/g,
    "window.history.pushState(null, '', '/login'); window.dispatchEvent(new Event('popstate'));"
  );
  content = content.replace(
    /window\.location\.hash = '#\/admin-panel';/g,
    "window.history.pushState(null, '', '/admin-panel'); window.dispatchEvent(new Event('popstate'));"
  );
  content = content.replace(
    /window\.location\.hash = `#\/\$\{page\.category\}\/\$\{page\.id\}`;/g,
    "window.history.pushState(null, '', `/${page.category}/${page.id}`); window.dispatchEvent(new Event('popstate'));"
  );
  content = content.replace(
    /window\.location\.hash = `#\/\$\{pageId\}`;/g,
    "window.history.pushState(null, '', `/${pageId}`); window.dispatchEvent(new Event('popstate'));"
  );
  content = content.replace(
    /window\.location\.hash = `#\/category\/\$\{category\}`;/g,
    "window.history.pushState(null, '', `/category/${category}`); window.dispatchEvent(new Event('popstate'));"
  );

  return content;
});

const fixLinks = (file) => {
  replaceInFile(file, content => {
    content = content.replace(/href="#\/login"/g, 'href="/login" onClick={(e) => { e.preventDefault(); window.history.pushState(null, "", "/login"); window.dispatchEvent(new Event("popstate")); }}');
    return content;
  });
};

fixLinks('src/components/Header.tsx');
fixLinks('src/components/MobileDrawer.tsx');
fixLinks('src/components/DesktopSidebar.tsx');

