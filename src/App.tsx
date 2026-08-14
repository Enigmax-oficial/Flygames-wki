import React, { useState, useEffect, useCallback } from 'react';
import { WikiPage, CategoryType } from './types/wiki';
import { Header } from './components/Header';
import { DesktopSidebar } from './components/DesktopSidebar';
import { MobileDrawer } from './components/MobileDrawer';
import { WikiArticle } from './components/WikiArticle';
import { PortalHomePage } from './components/PortalHomePage';
import { CategoryOverviewPage } from './components/CategoryOverviewPage';
import { SearchModal } from './components/SearchModal';
import { LoginPage } from './components/LoginPage';
import { AdminSetupPage } from './components/AdminSetupPage';
import { PageCreatorModal } from './components/PageCreatorModal';
import { AccountModal } from './components/AccountModal';
import { AdminPanel } from './components/AdminPanel';
import { FavoritesPage } from './components/FavoritesPage';
import { LoadingScreen } from './components/LoadingScreen';
import { ConnectivityBanner } from './components/ConnectivityBanner';
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

  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem('etherium_user_is_admin') === 'true';
    } catch {
      return false;
    }
  });

  // Modals & Navigation state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVoiceSearchActive, setIsVoiceSearchActive] = useState(false);

  const handleOpenSearch = useCallback((isVoice: boolean = false) => {
    setIsVoiceSearchActive(isVoice);
    setIsSearchOpen(true);
  }, []);

  // Global shortcut Ctrl+K to open search modal
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleOpenSearch(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleOpenSearch]);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCreatePageOpen, setIsCreatePageOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const handlePageCreated = (newPage: WikiPage) => {
    const pageId = newPage.id || newPage.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
    const pageWithId = { ...newPage, id: pageId };

    // Immediately update local state and navigate/redirect
    setPages((prev) => {
      const updated = [pageWithId, ...prev.filter(p => p.id !== pageId)];
      navigateToPage(pageId, updated);
      return updated;
    });

    // Save to database in the background asynchronously
    WikiApi.createPage(newPage, userEmail || undefined).then((savedPage) => {
      if (savedPage && savedPage.id && savedPage.id !== pageId) {
        setPages((prev) => {
          const updated = [savedPage, ...prev.filter(p => p.id !== savedPage.id && p.id !== pageId)];
          return updated;
        });
      }
    }).catch((err) => {
      console.warn("Background D1 page creation sync failed:", err);
    });
  };
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('etherium_desktop_sidebar_open');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [hasAdmin, setHasAdmin] = useState<boolean>(true);
  const [isSqlConnected, setIsSqlConnected] = useState<boolean>(false);

  useEffect(() => {
    const checkStatus = () => {
      fetch('/api/health')
        .then(res => res.json())
        .then((data: any) => {
          const connected = data?.sqlServer === 'connected';
          setIsSqlConnected(connected);
        })
        .catch(() => {
          setIsSqlConnected(false);
        });

      fetch('/api/admin/status')
        .then(res => res.json())
        .then((data: any) => {
          if (data.success) {
            setHasAdmin(Boolean(data.hasAdmin));
          }
        })
        .catch(() => {});
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleDesktopSidebar = () => {
    setIsDesktopSidebarOpen((prev: boolean) => {
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
    const rawHash = window.location.pathname.replace(/^\//, '');
    if (!rawHash || rawHash === 'portal' || rawHash === 'home') {
      return { pageId: 'home', category: 'all' as CategoryType | 'all' };
    }

    if (rawHash === 'login') {
      return { pageId: 'login', category: 'all' as CategoryType | 'all' };
    }
    if (rawHash === 'admin-setup') {
      return { pageId: 'admin-setup', category: 'all' as CategoryType | 'all' };
    }
    if (rawHash === 'admin-panel') {
      return { pageId: 'admin-panel', category: 'all' as CategoryType | 'all' };
    }
    if (rawHash === 'favorites' || rawHash === 'my-favorites') {
      return { pageId: 'favorites', category: 'favorites' as CategoryType | 'all' };
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
    const handlePopState = () => {
      const route = parseRoute();
      setSelectedPageId(route.pageId);
      setSelectedCategory(route.category);
    };

    handlePopState();

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [parseRoute]);

  // Navigate function that updates location hash (giving each page a unique URL link)
  const navigateToPage = (pageId: string, customPagesList?: WikiPage[]) => {
    if (pageId === 'home') {
      window.history.pushState(null, '', '/portal'); window.dispatchEvent(new Event('popstate'));
      setSelectedPageId('home');
      return;
    }
    if (pageId === 'login') {
      window.history.pushState(null, '', '/login'); window.dispatchEvent(new Event('popstate'));
      setSelectedPageId('login');
      return;
    }
    if (pageId === 'admin-setup') {
      window.history.pushState(null, '', '/admin-setup'); window.dispatchEvent(new Event('popstate'));
      setSelectedPageId('admin-setup');
      return;
    }
    if (pageId === 'admin-panel') {
      window.history.pushState(null, '', '/admin-panel'); window.dispatchEvent(new Event('popstate'));
      setSelectedPageId('admin-panel');
      return;
    }
    if (pageId === 'favorites' || pageId === 'my-favorites') {
      window.history.pushState(null, '', '/favorites'); window.dispatchEvent(new Event('popstate'));
      setSelectedPageId('favorites');
      setSelectedCategory('favorites');
      return;
    }

    const pagesToSearch = customPagesList || pages;
    const page = pagesToSearch.find((p) => p.id === pageId);
    if (page) {
      window.history.pushState(null, '', `/${page.category}/${page.id}`); window.dispatchEvent(new Event('popstate'));
      setSelectedPageId(page.id);
      setSelectedCategory(page.category);
    } else {
      window.history.pushState(null, '', `/${pageId}`); window.dispatchEvent(new Event('popstate'));
      setSelectedPageId(pageId);
    }
  };

  const navigateToCategory = (category: CategoryType | 'all') => {
    setSelectedCategory(category);
    if (category === 'all') {
      window.history.pushState(null, '', '/portal'); window.dispatchEvent(new Event('popstate'));
    } else {
      window.history.pushState(null, '', `/category/${category}`); window.dispatchEvent(new Event('popstate'));
    }
  };

  // (Redundant localStorage sync removed to avoid poisoning state)

  const handleLoginSuccess = (userName: string, email: string, isAdmin: boolean = false, redirectTarget?: string) => {
    const finalEmail = email;
    setUser(userName);
    setUserEmail(finalEmail);
    setIsCurrentUserAdmin(isAdmin);
    try {
      localStorage.setItem('etherium_user', userName);
      localStorage.setItem('etherium_user_email', finalEmail);
      localStorage.setItem('etherium_user_is_admin', String(isAdmin));
    } catch (e) {
      console.warn('LocalStorage save user failed:', e);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUserEmail(null);
    setIsCurrentUserAdmin(false);
    try {
      localStorage.removeItem('etherium_user');
      localStorage.removeItem('etherium_user_email');
      localStorage.removeItem('etherium_user_is_admin');
      localStorage.removeItem('etherium_admin_token');
      localStorage.removeItem('etherium_auth_token');
      sessionStorage.removeItem('admin_auth_verified');
      sessionStorage.removeItem('admin_initial_setup');
    } catch (e) {
      console.warn('LocalStorage remove user failed:', e);
    }
    if (selectedPageId === 'admin-panel') {
      navigateToPage('home');
    }
  };

  useEffect(() => {
    const handleUpdate = () => {
      setCategories(WikiApi.getCategories());
      setPages(WikiApi.getPages());
    };
    window.addEventListener('wiki_data_updated', handleUpdate);

    // Synchronize states with Cloudflare D1 server DB on application mount
    WikiApi.fetchPagesFromSql().then((fetched) => {
      setPages(fetched);
    }).catch(err => {
      console.log("Cloudflare D1 sync status on mount:", err?.message || err);
    });

    return () => window.removeEventListener('wiki_data_updated', handleUpdate);
  }, []);

  const activePage = pages.find((p) => p.id === selectedPageId);

  if (isInitialLoading) {
    return <LoadingScreen onComplete={() => setIsInitialLoading(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#e2e8f0] font-sans selection:bg-sky-500 selection:text-black flex flex-col">
      <ConnectivityBanner />

      {selectedPageId === 'admin-setup' ? (
        hasAdmin ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0b0f19] text-center text-slate-300">
            <div className="max-w-md p-8 bg-[#111827] border border-slate-800 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold text-white">Setup Unavailable</h3>
              <p className="text-xs text-slate-400">
                The administrator account has already been initialized. This one-time setup page has been disabled and can no longer be accessed.
              </p>
              <button
                onClick={() => navigateToPage('home')}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Back to Portal
              </button>
            </div>
          </div>
        ) : (
          <AdminSetupPage
            onSetupComplete={(email) => {
              setHasAdmin(true);
              handleLoginSuccess('Administrator', email, true, 'home');
              navigateToPage('home');
            }}
            onBackToLogin={() => navigateToPage('login')}
          />
        )
      ) : selectedPageId === 'login' ? (
        <LoginPage 
          onBack={() => navigateToPage('home')}
          onLoginSuccess={(name, email, isAdmin, target) => {
            handleLoginSuccess(name, email, isAdmin, target);
            if (target === 'admin-panel' || isAdmin) {
              navigateToPage('admin-panel');
            } else {
              navigateToPage('home');
            }
          }}
        />
      ) : (
        <>
      {/* Top Header */}
      <Header
        addonVersion="v1.4.0"
        onOpenSearch={handleOpenSearch}
        onOpenAdminPanel={() => navigateToPage('admin-panel')}
        onOpenFavorites={() => navigateToPage('favorites')}
        onToggleMobileDrawer={() => setIsMobileDrawerOpen(true)}
        onToggleDesktopSidebar={toggleDesktopSidebar}
        isDesktopSidebarOpen={isDesktopSidebarOpen}
        onGoHome={() => navigateToPage('home')}
        onOpenLogin={() => navigateToPage('login')}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        user={user}
        userEmail={userEmail}
        isCurrentUserAdmin={isCurrentUserAdmin}
        isSqlConnected={isSqlConnected}
        onLogout={handleLogout}
        hasAdmin={hasAdmin}
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
          isCurrentUserAdmin={isCurrentUserAdmin}
          hasAdmin={hasAdmin}
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
          onOpenSearch={handleOpenSearch}
          userEmail={userEmail}
          isCurrentUserAdmin={isCurrentUserAdmin}
          isSqlConnected={isSqlConnected}
          hasAdmin={hasAdmin}
        />

        {/* Main Content View */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 min-w-0 overflow-x-hidden">
          {selectedPageId === 'admin-panel' ? (
            !user ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0b0f19] text-center text-slate-300 min-h-[400px]">
                <div className="max-w-md p-8 bg-[#111827] border border-slate-800 rounded-2xl space-y-4 shadow-xl">
                  <h3 className="text-lg font-bold text-white">Login Required</h3>
                  <p className="text-xs text-slate-400">
                    You must be signed in with an administrator account to view the Admin Control Panel.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => navigateToPage('login')}
                      className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              </div>
            ) : !isSqlConnected ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0b0f19] text-center text-slate-300 min-h-[400px]">
                <div className="max-w-md p-8 bg-[#111827] border border-amber-500/30 rounded-2xl space-y-4 shadow-xl">
                  <h3 className="text-lg font-bold text-white">Database Offline</h3>
                  <p className="text-xs text-slate-400">
                    The Admin Control Panel is unavailable because there is currently no active connection to the SQL server.
                  </p>
                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      onClick={() => navigateToPage('home')}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Return to Portal
                    </button>
                  </div>
                </div>
              </div>
            ) : !isCurrentUserAdmin ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0b0f19] text-center text-slate-300 min-h-[400px]">
                <div className="max-w-md p-8 bg-[#111827] border border-rose-500/30 rounded-2xl space-y-4 shadow-xl">
                  <h3 className="text-lg font-bold text-white">Access Denied</h3>
                  <p className="text-xs text-slate-400">
                    Your account does not have administrator privileges.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => navigateToPage('home')}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Return to Portal
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <AdminPanel
                pages={pages}
                userEmail={userEmail}
                onPageCreated={handlePageCreated}
                onClosePanel={() => navigateToPage('home')}
                onSelectPage={(id) => navigateToPage(id)}
              />
            )
          ) : selectedPageId === 'favorites' || selectedCategory === 'favorites' ? (
            <FavoritesPage
              pages={pages}
              onSelectPage={(id) => navigateToPage(id)}
              onGoHome={() => navigateToPage('home')}
              onOpenLogin={() => navigateToPage('login')}
              userEmail={userEmail}
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
                onOpenSearch={handleOpenSearch}
              />
            )
          ) : (
            <WikiArticle
              page={activePage}
              pages={pages}
              onSelectPage={(id) => navigateToPage(id)}
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
            <span>Addon Knowledge Base</span>
            <span>•</span>
            <span className="text-sky-400 font-bold">Minecraft Addon Wiki</span>
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
        onClose={() => {
          setIsSearchOpen(false);
          setIsVoiceSearchActive(false);
        }}
        pages={pages}
        onSelectPage={(id) => navigateToPage(id)}
        initialVoiceSearch={isVoiceSearchActive}
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
        isCurrentUserAdmin={isCurrentUserAdmin}
        isSqlConnected={isSqlConnected}
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
        hasAdmin={hasAdmin}
      />
    </div>
  );
}
