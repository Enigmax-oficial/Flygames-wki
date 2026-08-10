import React, { useState, useEffect, useCallback } from 'react';
import { INITIAL_WIKI_PAGES } from './data/wikiPages';
import { WikiPage, CategoryType } from './types/wiki';
import { Header } from './components/Header';
import { DesktopSidebar } from './components/DesktopSidebar';
import { MobileDrawer } from './components/MobileDrawer';
import { WikiArticle } from './components/WikiArticle';
import { PortalHomePage } from './components/PortalHomePage';
import { CategoryOverviewPage } from './components/CategoryOverviewPage';
import { SearchModal } from './components/SearchModal';
import { LoginPage } from './components/LoginPage';
import { PageCreatorModal } from './components/PageCreatorModal';
import { AccountModal } from './components/AccountModal';
import { AdminPanel } from './components/AdminPanel';
import { LoadingScreen } from './components/LoadingScreen';
import { WikiApi } from './lib/wikiApi';

export default function App() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [categories, setCategories] = useState(() => WikiApi.getCategories());
  const [pages, setPages] = useState<WikiPage[]>(() => {
    return WikiApi.getPages();
  });

  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [selectedPageId, setSelectedPageId] = useState<string>('home');

  // User state
  const [user, setUser] = useState<string | null>(() => {
    try {
      return localStorage.getItem('etherium_user');
    } catch {
      return null;
    }
  });

  const [userEmail, setUserEmail] = useState<string | null>(() => {
    try {
      return localStorage.getItem('etherium_user_email');
    } catch {
      return null;
    }
  });

  // Modals & Navigation state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCreatePageOpen, setIsCreatePageOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const handlePageCreated = (newPage: WikiPage) => {
    setPages((prev) => [newPage, ...prev]);
    navigateToPage(newPage.id);
  };
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('etherium_desktop_sidebar_open');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleDesktopSidebar = () => {
    setIsDesktopSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('etherium_desktop_sidebar_open', JSON.stringify(next));
      } catch (e) {
        console.warn('Storage error', e);
      }
      return next;
    });
  };

  // Parse URL hash for page routing
  const parseRoute = useCallback(() => {
    const rawHash = window.location.hash.replace(/^#\/?/, '');
    if (!rawHash || rawHash === 'portal' || rawHash === 'home') {
      return { pageId: 'home', category: 'all' as CategoryType | 'all' };
    }

    if (rawHash === 'login') {
      return { pageId: 'login', category: 'all' as CategoryType | 'all' };
    }
    if (rawHash === 'admin-panel') {
      return { pageId: 'admin-panel', category: 'all' as CategoryType | 'all' };
    }

    const parts = rawHash.split('/').filter(Boolean);

    // e.g. #/category/mobs
    if (parts[0] === 'category' && parts[1]) {
      return { pageId: 'home', category: parts[1] as CategoryType };
    }

    // e.g. #/mobs/bouldering-zombie
    if (parts.length >= 2) {
      const cat = parts[0];
      const id = parts[1];
      const match = pages.find((p) => p.id === id || (p.category === cat && p.id === id));
      if (match) {
        return { pageId: match.id, category: match.category };
      }
    }

    // e.g. #/bouldering-zombie
    if (parts.length === 1) {
      const match = pages.find((p) => p.id === parts[0]);
      if (match) {
        return { pageId: match.id, category: match.category };
      }
    }

    return { pageId: 'home', category: 'all' as CategoryType | 'all' };
  }, [pages]);

  // Handle URL Hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const route = parseRoute();
      setSelectedPageId(route.pageId);
      setSelectedCategory(route.category);
    };

    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [parseRoute]);

  // Navigate function that updates location hash (giving each page a unique URL link)
  const navigateToPage = (pageId: string) => {
    if (pageId === 'home') {
      window.location.hash = '#/portal';
      setSelectedPageId('home');
      return;
    }
    if (pageId === 'login') {
      window.location.hash = '#/login';
      setSelectedPageId('login');
      return;
    }
    if (pageId === 'admin-panel') {
      window.location.hash = '#/admin-panel';
      setSelectedPageId('admin-panel');
      return;
    }

    const page = pages.find((p) => p.id === pageId);
    if (page) {
      window.location.hash = `#/${page.category}/${page.id}`;
      setSelectedPageId(page.id);
      setSelectedCategory(page.category);
    } else {
      window.location.hash = `#/${pageId}`;
      setSelectedPageId(pageId);
    }
  };

  const navigateToCategory = (category: CategoryType | 'all') => {
    setSelectedCategory(category);
    if (category === 'all') {
      window.location.hash = '#/portal';
    } else {
      window.location.hash = `#/category/${category}`;
    }
  };

  // Save to localStorage when pages change
  useEffect(() => {
    try {
      localStorage.setItem('aetheria_wiki_pages', JSON.stringify(pages));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [pages]);

  const handleLoginSuccess = (userName: string, email: string) => {
    const finalEmail = email;
    setUser(userName);
    setUserEmail(finalEmail);
    try {
      localStorage.setItem('etherium_user', userName);
      localStorage.setItem('etherium_user_email', finalEmail);
    } catch (e) {
      console.warn('LocalStorage save user failed:', e);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUserEmail(null);
    try {
      localStorage.removeItem('etherium_user');
      localStorage.removeItem('etherium_user_email');
    } catch (e) {
      console.warn('LocalStorage remove user failed:', e);
    }
  };

  useEffect(() => {
    const handleUpdate = () => {
      setCategories(WikiApi.getCategories());
      setPages(WikiApi.getPages());
    };
    window.addEventListener('wiki_data_updated', handleUpdate);
    return () => window.removeEventListener('wiki_data_updated', handleUpdate);
  }, []);

  const activePage = pages.find((p) => p.id === selectedPageId);

  if (isInitialLoading) {
    return <LoadingScreen onComplete={() => setIsInitialLoading(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#e2e8f0] font-sans selection:bg-sky-500 selection:text-black flex flex-col">
      

      
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
      {/* Main Container Layout */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* PC / Desktop Sidebar */}
        <DesktopSidebar
          isOpen={isDesktopSidebarOpen}
          onToggleSidebar={toggleDesktopSidebar}
          pages={pages}
          selectedCategory={selectedCategory}
          selectedPageId={selectedPageId}
          onSelectCategory={(cat) => navigateToCategory(cat)}
          onSelectPage={(id) => navigateToPage(id)}
          onGoHome={() => navigateToPage('home')}
          userEmail={userEmail}
        />

        {/* Mobile Navigation Drawer Overlay */}
        <MobileDrawer
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
          pages={pages}
          selectedCategory={selectedCategory}
          selectedPageId={selectedPageId}
          onSelectCategory={(cat) => navigateToCategory(cat)}
          onSelectPage={(id) => navigateToPage(id)}
          onGoHome={() => navigateToPage('home')}
          onOpenSearch={() => setIsSearchOpen(true)}
          userEmail={userEmail}
        />

        {/* Main Content View */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 min-w-0 overflow-x-hidden">
          {selectedPageId === 'admin-panel' ? (
            <AdminPanel
              pages={pages}
              userEmail={userEmail}
              onPageCreated={handlePageCreated}
              onClosePanel={() => navigateToPage('home')}
              onSelectPage={(id) => navigateToPage(id)}
            />
          ) : selectedPageId === 'home' || !activePage ? (
            selectedCategory !== 'all' ? (
              <CategoryOverviewPage
                category={selectedCategory}
                pages={pages}
                onSelectPage={(id) => navigateToPage(id)}
                onSelectCategory={(cat) => navigateToCategory(cat)}
              />
            ) : (
              <PortalHomePage
                pages={pages}
                onSelectPage={(id) => navigateToPage(id)}
                onSelectCategory={(cat) => navigateToCategory(cat)}
                onOpenSearch={() => setIsSearchOpen(true)}
              />
            )
          ) : (
            <WikiArticle
              page={activePage}
              onSelectCategory={(cat) => navigateToCategory(cat)}
              onGoHome={() => navigateToPage('home')}
              currentUser={user}
              currentUserEmail={userEmail}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="py-4 bg-[#070a12] border-t border-[#1e293b] px-6 text-[12px] text-[#64748b] font-sans mt-auto">
        <div className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="flex items-center gap-1.5">
            <span>Etherium Knowledge Base</span>
            <span>•</span>
            <span className="text-sky-400 font-bold">Etherium Team</span>
            <span>© 2026</span>
          </p>

          <div className="flex items-center gap-4">
            <p className="text-[#475569] hidden sm:block">
              Minecraft Bedrock Addon Wiki Engine
            </p>
          </div>
        </div>
      </footer>

      
        </>
      )}
      {/* Modals */}
  
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        pages={pages}
        onSelectPage={(id) => navigateToPage(id)}
      />

      <PageCreatorModal
        isOpen={isCreatePageOpen}
        onClose={() => setIsCreatePageOpen(false)}
        onPageCreated={handlePageCreated}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        user={user}
        userEmail={userEmail}
        onLogout={handleLogout}
        onUpdateUserName={(newName) => {
          setUser(newName);
          try {
            localStorage.setItem('etherium_user', newName);
          } catch (e) {
            console.warn('LocalStorage save user failed:', e);
          }
        }}
        onOpenAdminPanel={() => navigateToPage('admin-panel')}
      />
    </div>
  );
}
