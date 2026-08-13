import { WikiIcon } from './WikiIcon';
import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Plus, 
  FileText, 
  ArrowLeft, 
  AlertTriangle, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  BookOpen, 
  Globe, 
  Settings, 
  Database, 
  Layers,
  Image as ImageIcon,
  FolderPlus,
  Terminal,
  Trash2,
  Sliders,
  HelpCircle,
  Download,
  FileJson,
  BarChart3,
  Eye,
  Heart,
  TrendingUp,
  RefreshCw,
  Search,
  Flame,
  ShieldCheck,
  UserPlus,
  Key,
  Lock,
  Mail,
  User,
  Shield
} from 'lucide-react';
import { WikiPage, CategoryType, PageTemplate } from '../types/wiki';
import { WikiApi, DynamicCategory, PRESET_IMAGES } from '../lib/wikiApi';
import { isAuthorizedAdminEmail } from '../lib/adminAuth';

interface AdminPanelProps {
  pages: WikiPage[];
  userEmail: string | null;
  onPageCreated: (newPage: WikiPage) => void;
  onClosePanel: () => void;
  onSelectPage: (pageId: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  pages,
  userEmail,
  onPageCreated,
  onClosePanel,
  onSelectPage
}) => {
  
  // Encrypted Credentials & Auth State
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_auth_verified') === 'true';
  });
  const [authError, setAuthError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsVerifying(true);

    const trimmedUser = (usernameInput || 'adm').trim();
    const trimmedPass = (passwordInput || 'admin').trim();

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUser, password: trimmedPass, email: userEmail })
      });
      const data = await res.json() as any;

      if (data.success) {
        setIsAdminAuthenticated(true);
        sessionStorage.setItem('admin_auth_verified', 'true');
        if (data.token) {
          try {
            localStorage.setItem('etherium_admin_token', data.token);
          } catch {}
        }
        setActiveTab('admin-users');
      } else {
        setAuthError(data.message || 'Incorrect administrator username or password.');
      }
    } catch {
      setAuthError('Failed to verify administrator credentials. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Quick fill default adm credentials
  const fillDefaultCredentials = () => {
    setUsernameInput('adm');
    setPasswordInput('admin');
    setAuthError('');
  };

  // Navigation Tab State (defaults to admin account creation and management)
  const [activeTab, setActiveTab] = useState<'create-page' | 'categories' | 'analytics' | 'api-playground' | 'assets' | 'database' | 'admin-users'>('admin-users');
  const [pageSortBy, setPageSortBy] = useState<'default' | 'views'>('default');

  // Admin Accounts Management State
  const [adminAccounts, setAdminAccounts] = useState<any[]>([]);
  const [isAdminAccountsLoading, setIsAdminAccountsLoading] = useState(false);
  const [adminAccountsError, setAdminAccountsError] = useState('');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminConfirmPassword, setNewAdminConfirmPassword] = useState('');
  const [createAdminSuccess, setCreateAdminSuccess] = useState('');
  const [createAdminError, setCreateAdminError] = useState('');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  const fetchAdminAccounts = () => {
    setIsAdminAccountsLoading(true);
    setAdminAccountsError('');
    fetch('/api/admin/admins')
      .then((res) => res.json())
      .then((data: any) => {
        if (data.success && Array.isArray(data.admins)) {
          setAdminAccounts(data.admins);
        } else {
          setAdminAccountsError(data.error || 'Failed to load administrator accounts.');
        }
      })
      .catch((err) => {
        console.error('Failed to fetch admin accounts:', err);
        setAdminAccountsError('Could not connect to the administration API.');
      })
      .finally(() => {
        setIsAdminAccountsLoading(false);
      });
  };

  useEffect(() => {
    if (activeTab === 'admin-users') {
      fetchAdminAccounts();
    }
  }, [activeTab]);

  const handleCreateAdminAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateAdminError('');
    setCreateAdminSuccess('');

    const u = newAdminUsername.trim();
    const em = newAdminEmail.trim().toLowerCase();
    const pw = newAdminPassword.trim();

    if (!u || !em || !pw) {
      setCreateAdminError('Please fill out all administrator registration fields.');
      return;
    }

    if (!em.includes('@')) {
      setCreateAdminError('Please enter a valid email address.');
      return;
    }

    if (pw.length < 6) {
      setCreateAdminError('Password must be at least 6 characters long.');
      return;
    }

    if (newAdminConfirmPassword && pw !== newAdminConfirmPassword.trim()) {
      setCreateAdminError('Passwords do not match.');
      return;
    }

    setIsCreatingAdmin(true);
    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, email: em, password: pw })
      });
      const data = await res.json() as any;

      if (data.success) {
        setCreateAdminSuccess(`Administrator account "${u}" (${em}) created successfully! You can now log into the admin panel with these credentials.`);
        setNewAdminUsername('');
        setNewAdminEmail('');
        setNewAdminPassword('');
        setNewAdminConfirmPassword('');
        fetchAdminAccounts();
      } else {
        setCreateAdminError(data.error || data.message || 'Failed to create administrator account.');
      }
    } catch (err: any) {
      setCreateAdminError(err.message || 'Network error while creating administrator account.');
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  // Data Analytics State
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');
  const [analyticsFilter, setAnalyticsFilter] = useState('');

  const fetchAnalyticsData = () => {
    setIsAnalyticsLoading(true);
    setAnalyticsError('');
    fetch('/api/admin/analytics')
      .then((res) => {
        if (!res.ok) throw new Error('Analytics API error');
        return res.json() as any;
      })
      .then((data) => {
        if (data.success) {
          setAnalyticsData(data);
        } else {
          setAnalyticsError(data.error || 'Failed to fetch analytics.');
        }
      })
      .catch((err) => {
        console.error('Analytics fetch error:', err);
        setAnalyticsError('Could not connect to the analytics system.');
      })
      .finally(() => {
        setIsAnalyticsLoading(false);
      });
  };

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalyticsData();
    }
  }, [activeTab]);

  // Cloudflare D1 Database Access States
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [dbPages, setDbPages] = useState<any[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(false);
  const [dbError, setDbError] = useState('');

  // Fetch Cloudflare D1 administrative stats
  useEffect(() => {
    if (activeTab === 'database') {
      setIsDbLoading(true);
      setDbError('');
      fetch('/api/admin/database-stats')
        .then((res) => {
          if (!res.ok) throw new Error('Database stats endpoint response failure.');
          return res.json() as any;
        })
        .then((data) => {
          if (data.success) {
            setDbUsers(data.users || []);
            setDbPages(data.pages || []);
          } else {
            setDbError(data.error || 'Failed to fetch database tables.');
          }
        })
        .catch((err) => {
          console.error(err);
          setDbError('Could not reach the administrative database API.');
        })
        .finally(() => {
          setIsDbLoading(false);
        });
    }
  }, [activeTab]);

  // Asset Gallery States
  const [imageList, setImageList] = useState<string[]>([
    '/images/weapons/sword.png',
    '/images/weapons/wood_sword.png',
    '/images/weapons/stone_sword.png',
    '/images/weapons/iron_sword.png',
    '/images/weapons/gold_sword.png',
    '/images/weapons/diamond_sword.png',
    '/images/weapons/netherite_sword.png',
    '/images/tools/wood_axe.png',
    '/images/tools/wood_pickaxe.png',
    '/images/tools/wood_hoe.png',
    '/images/tools/stone_axe.png',
    '/images/tools/stone_pickaxe.png',
    '/images/tools/stone_hoe.png',
    '/images/tools/iron_axe.png',
    '/images/tools/iron_pickaxe.png',
    '/images/tools/iron_hoe.png',
    '/images/tools/copper_axe.png',
    '/images/tools/copper_pickaxe.png',
    '/images/tools/copper_hoe.png',
    '/images/tools/gold_axe.png',
    '/images/tools/gold_pickaxe.png',
    '/images/tools/gold_hoe.png',
    '/images/tools/diamond_axe.png',
    '/images/tools/diamond_pickaxe.png',
    '/images/tools/diamond_hoe.png',
    '/images/tools/netherite_axe.png',
    '/images/tools/netherite_pickaxe.png',
    '/images/tools/netherite_hoe.png',
    '/images/items/apple.png',
    '/images/items/apple_golden.png',
    '/images/categories/mobs.png',
    '/images/categories/items.png',
    '/images/categories/blocks.png',
    '/images/categories/recipes.png',
    '/images/categories/biomes.png',
    '/images/categories/guides.png',
    '/images/heart.png'
  ]);
  const [isImagesLoading, setIsImagesLoading] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [assetSearch, setAssetSearch] = useState('');
  const [selectedAssetCat, setSelectedAssetCat] = useState<string>('All');

  const getCategoryFromPath = (path: string): string => {
    if (path.includes('/weapons/')) return 'Weapons';
    if (path.includes('/tools/')) return 'Tools';
    if (path.includes('/items/')) return 'Items';
    if (path.includes('/categories/')) return 'Categories';
    return 'UI / Other';
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  };

  // Fetch dynamic real image assets when Asset Library is active
  useEffect(() => {
    if (activeTab === 'assets') {
      setIsImagesLoading(true);
      fetch('/api/images/list')
        .then((res) => res.json() as any)
        .then((data) => {
          if (data.success && data.images && data.images.length > 0) {
            setImageList(data.images);
          }
        })
        .catch((err) => console.error('Error fetching images:', err))
        .finally(() => setIsImagesLoading(false));
    }
  }, [activeTab]);

  // Dynamic Categories and Templates lists from API
  const [categories, setCategories] = useState<DynamicCategory[]>(() => WikiApi.getCategories());
  const [templates, setTemplates] = useState<PageTemplate[]>(() => WikiApi.getTemplates());

  // Listen to update events
  useEffect(() => {
    const handleUpdate = () => {
      setCategories(WikiApi.getCategories());
      setTemplates(WikiApi.getTemplates());
    };
    window.addEventListener('wiki_data_updated', handleUpdate);
    return () => window.removeEventListener('wiki_data_updated', handleUpdate);
  }, []);

  // --- TAB 1: CREATE PAGE FORM STATE ---
  const [title, setTitle] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('items');
  const [namespace, setNamespace] = useState('aetheria:custom_item');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [badgeColor, setBadgeColor] = useState<'purple' | 'emerald' | 'amber' | 'blue' | 'rose' | 'red' | 'cyan'>('emerald');
  const [icon, setIcon] = useState('aetheria:aetherial_sword');
  const [bullet1, setBullet1] = useState('');
  const [bullet2, setBullet2] = useState('');
  const [sectionTitle, setSectionTitle] = useState('Overview');
  const [sectionContent, setSectionContent] = useState('');
  
  // Image Selector State
  const [imageSource, setImageSource] = useState<'preset' | 'custom' | 'upload'>('preset');
  const [selectedPresetImage, setSelectedPresetImage] = useState(PRESET_IMAGES[0].url);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Extended page features
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [texturesStr, setTexturesStr] = useState('');
  const [customPropsList, setCustomPropsList] = useState<{key: string, value: string}[]>([]);

  
  const [model3DKey, setModel3DKey] = useState('');
  const [model3DTexture, setModel3DTexture] = useState('');
  const [difficultyStats, setDifficultyStats] = useState<{difficulty: string, health: string, attack: string, icon: string}[]>([]);
  const [movementSpeed, setMovementSpeed] = useState('');
  const [dropsTable, setDropsTable] = useState<{item: string, amount: string, chance: string, icon: string}[]>([]);

  const addDifficultyStat = () => setDifficultyStats([...difficultyStats, { difficulty: 'Normal', health: '20', attack: '3', icon: '🛡️' }]);
  const updateDifficultyStat = (index: number, field: string, val: string) => {
    const list = [...difficultyStats];
    (list[index] as Record<string, string>)[field] = val;
    setDifficultyStats(list);
  };
  const removeDifficultyStat = (index: number) => {
    setDifficultyStats(difficultyStats.filter((_, i) => i !== index));
  };

  const addDrop = () => setDropsTable([...dropsTable, { item: 'Rotten Flesh', amount: '1-2', chance: '100%', icon: '🍖' }]);
  const updateDrop = (index: number, field: string, val: string) => {
    const list = [...dropsTable];
    (list[index] as Record<string, string>)[field] = val;
    setDropsTable(list);
  };
  const removeDrop = (index: number) => {
    setDropsTable(dropsTable.filter((_, i) => i !== index));
  };

  const addCustomProp = () => setCustomPropsList([...customPropsList, { key: '', value: '' }]);
  const updateCustomProp = (index: number, field: 'key'|'value', val: string) => {
    const list = [...customPropsList];
    list[index][field] = val;
    setCustomPropsList(list);
  };
  const removeCustomProp = (index: number) => {
    setCustomPropsList(customPropsList.filter((_, i) => i !== index));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setCustomImageUrl(uploadEvent.target.result as string);
          setImageSource('custom');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const formatCategoryName = (catId: string) => {
    const found = categories.find(c => c.id === catId);
    if (found) return found.label;
    if (catId === 'mobs') return 'Mobs & Bosses';
    if (catId === 'items') return 'Items & Weapons';
    if (catId === 'blocks') return 'Blocks & Ores';
    if (catId === 'biomes') return 'Biomes & Realms';
    if (catId === 'recipes') return 'Forge Recipes';
    if (catId === 'guides') return 'Guides & Manuals';
    return catId.charAt(0).toUpperCase() + catId.slice(1);
  };
  
  // Template Auto-populate selection
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const [isSuccess, setIsSuccess] = useState(false);
  const [isSavingPage, setIsSavingPage] = useState(false);
  const [createdPageId, setCreatedPageId] = useState('');
  const [editorMode, setEditorMode] = useState<'form' | 'text'>('form');
  const [rawJsonCode, setRawJsonCode] = useState('');

  const switchToTextEditor = () => {
    const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'new-wiki-page';
    const bullets = [bullet1, bullet2].filter(b => b.trim() !== '');
    const activeImage = imageSource === 'preset' ? selectedPresetImage : customImageUrl;

    const pageObj: WikiPage = {
      id: slug,
      title: title || 'Untitled Page',
      namespace: namespace || `aetheria:${slug}`,
      category: selectedCatId,
      description: description || 'Addon wiki entry.',
      addonVersion: 'v1.4.0',
      icon: icon || '📄',
      renderImageUrl: activeImage || undefined,
      tags: [selectedCatId, 'Custom', 'Admin Created'],
      lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      badge: badge || selectedCatId.toUpperCase(),
      badgeColor,
      behaviorBullets: bullets.length > 0 ? bullets : undefined,
      difficultyStats: difficultyStats.length > 0 ? difficultyStats : undefined,
      movementSpeed: movementSpeed || undefined,
      dropsTable: dropsTable.length > 0 ? dropsTable : undefined,
      sections: [
        {
          title: sectionTitle || 'Description',
          content: sectionContent || description || 'No content provided.'
        }
      ]
    };
    setRawJsonCode(JSON.stringify(pageObj, null, 2));
    setEditorMode('text');
  };

  const publishFromTextEditor = async () => {
    try {
      const parsed = JSON.parse(rawJsonCode);
      if (!parsed.id || !parsed.title) {
        alert('Invalid JSON: must contain at least id and title.');
        return;
      }
      setIsSavingPage(true);
      try {
        const savedPage = await WikiApi.createPage(parsed, userEmail || undefined);
        setCreatedPageId(savedPage.id);
        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (onPageCreated) {
          onPageCreated(savedPage);
        }
      } catch (err: any) {
        alert('Failed to save page through server pipeline: ' + err.message);
      } finally {
        setIsSavingPage(false);
      }
    } catch (err: any) {
      alert('JSON Parse Error: ' + err.message);
    }
  };

  // Handle template selection auto-population
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const matched = templates.find(t => t.templateId === templateId);
    if (matched) {
      setSelectedCatId(matched.category || 'items');
      setNamespace(matched.defaultData?.namespace || `aetheria:${title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')}`);
      setDescription(matched.defaultData?.description || `Custom wiki entry for Aetheria.`);
      setBadge(matched.defaultData?.badge || matched.name.toUpperCase());
      setBadgeColor(matched.defaultData?.badgeColor || 'emerald');
      setIcon(matched.defaultData?.icon || '📝');
      setSectionTitle(matched.defaultData?.sections?.[0]?.title || 'Overview');
      setSectionContent(matched.defaultData?.sections?.[0]?.content || 'Details about this item...');
      if (matched.defaultData?.behaviorBullets?.[0]) setBullet1(matched.defaultData.behaviorBullets[0]);
      if (matched.defaultData?.behaviorBullets?.[1]) setBullet2(matched.defaultData.behaviorBullets[1]);
    }
  };

  // --- TAB 2: CATEGORY MANAGER STATE ---
  const [newCatId, setNewCatId] = useState('');
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📁');
  const [newCatBorder, setNewCatBorder] = useState('border-emerald-500/30');
  const [newCatBg, setNewCatBg] = useState('from-emerald-950/30 to-[#111827]');
  const [catError, setCatError] = useState('');
  const [catSuccess, setCatSuccess] = useState('');

  // Authentication check for admin panel
  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto p-6 sm:p-8 bg-[#111827] border border-amber-500/30 rounded-2xl text-center space-y-6 shadow-2xl my-10 font-sans text-slate-200">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400 shadow-inner">
          <Crown className="w-8 h-8" />
        </div>
        
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-white tracking-tight">Painel de Acesso do Administrador</h2>
          <p className="text-xs text-slate-400">
            Acesso restrito ao painel de controle do Etherium Wiki.
          </p>
        </div>

        {/* Initial Credentials Callout */}
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-left space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
            <Key className="w-4 h-4 shrink-0" />
            <span>Credenciais Iniciais do Sistema:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-[#0b0f19] px-2.5 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[10px] block font-sans">Usuário Inicial:</span>
              <strong className="text-amber-300 font-bold">adm</strong>
            </div>
            <div className="bg-[#0b0f19] px-2.5 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[10px] block font-sans">Senha Inicial:</span>
              <strong className="text-amber-300 font-bold">admin</strong>
            </div>
          </div>
          <button
            type="button"
            onClick={fillDefaultCredentials}
            className="w-full mt-1 py-1.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Preencher Automaticamente (adm / admin)</span>
          </button>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-3 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Usuário ou E-mail</span>
              </label>
              <input
                type="text"
                placeholder="Ex: adm ou seu_email@dominio.com"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0b0f19] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition font-mono placeholder:text-slate-600"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Senha de Acesso</span>
              </label>
              <input
                type="password"
                placeholder="Ex: admin"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0b0f19] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition font-mono tracking-widest placeholder:text-slate-600 placeholder:tracking-normal"
              />
            </div>
          </div>

          {authError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2 text-left">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClosePanel}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Voltar ao Portal
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs transition cursor-pointer disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Acessar Painel</span>
                </>
              )}
            </button>
          </div>
        </form>
        
        <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 space-y-1">
          <p>Após o login inicial, você poderá registrar seu próprio usuário e senha personalizados na aba de Administradores.</p>
        </div>
      </div>
    );
  }

  // Handle Page submission
  const handleSubmitPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const bullets = [bullet1, bullet2].filter(b => b.trim() !== '');
    const activeImage = imageSource === 'preset' ? selectedPresetImage : customImageUrl;
    const customPropsRecord: Record<string, string> = {};
    customPropsList.forEach(p => {
      if (p.key.trim() && p.value.trim()) {
        customPropsRecord[p.key.trim()] = p.value.trim();
      }
    });

    const newPage: WikiPage = {
      id: slug,
      title,
      namespace: namespace || `aetheria:${slug}`,
      category: selectedCatId,
      description,
      addonVersion: 'v1.4.0',
      icon: icon || '📄',
      renderImageUrl: activeImage || undefined,
      bannerImageUrl: bannerImageUrl || undefined,
      images: texturesStr ? texturesStr.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      customProperties: Object.keys(customPropsRecord).length > 0 ? customPropsRecord : undefined,
      tags: [selectedCatId, 'Custom', 'Admin Created'],
      lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      badge: badge || selectedCatId.toUpperCase(),
      badgeColor,
      behaviorBullets: bullets.length > 0 ? bullets : undefined,
      difficultyStats: difficultyStats.length > 0 ? difficultyStats : undefined,
      movementSpeed: movementSpeed || undefined,
      dropsTable: dropsTable.length > 0 ? dropsTable : undefined,
      sections: [
        {
          title: sectionTitle || 'Description',
          content: sectionContent || description
        }
      ]
    };

    setIsSavingPage(true);
    try {
      const savedPage = await WikiApi.createPage(newPage, userEmail || undefined);
      onPageCreated(savedPage);
      setCreatedPageId(slug);
      setIsSuccess(true);
      
      // Reset page creation inputs
      setTitle('');
      setDescription('');
      setNamespace('aetheria:custom_item');
      setBadge('');
      setBullet1('');
      setBullet2('');
      setSectionContent('');
      setSelectedTemplateId('');
      setBannerImageUrl('');
      setTexturesStr('');
      setCustomPropsList([]);

      setTimeout(() => {
        setIsSuccess(false);
      }, 6000);
    } catch (err: any) {
      alert("Failed to save page through server pipeline: " + err.message);
    } finally {
      setIsSavingPage(false);
    }
  };

  // Handle Category Creation
  const handleCreateCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCatError('');
    setCatSuccess('');

    if (!newCatId || !newCatLabel || !newCatDesc) {
      setCatError('Please fill out all category details.');
      return;
    }

    try {
      WikiApi.createCategory({
        id: newCatId,
        label: newCatLabel,
        desc: newCatDesc,
        icon: newCatIcon,
        color: newCatBorder,
        bg: newCatBg
      });

      setCatSuccess(`Category '${newCatLabel}' deployed successfully!`);
      setNewCatId('');
      setNewCatLabel('');
      setNewCatDesc('');
      setNewCatIcon('📁');
    } catch (err: any) {
      setCatError(err.message || 'Failed to deploy category.');
    }
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm(`Are you sure you want to delete the custom category '${id}'? This will not delete pages belonging to this category.`)) {
      WikiApi.deleteCategory(id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300 font-sans text-slate-200">
      
      {/* 1. Header Control Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/15 via-[#111827] to-[#0b0f19] border border-amber-500/20 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">Admin Portal Center</h1>
              <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-mono font-bold uppercase tracking-wide">
                API Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Authorized Administrator: <code className="text-amber-300 font-mono">{userEmail}</code>
            </p>
          </div>
        </div>

        <button
          onClick={onClosePanel}
          className="px-4 py-2 bg-[#1e293b]/70 hover:bg-[#1e293b] text-slate-200 border border-[#334155] rounded-xl text-xs font-bold transition flex items-center gap-2 self-start sm:self-center cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-sky-400" />
          <span>Exit Admin Panel</span>
        </button>
      </div>

      {/* 2. Sub Navigation Dashboard Tabs */}
      <div className="flex border-b border-[#1e293b] overflow-x-auto pb-px gap-2">
        <button
          onClick={() => setActiveTab('create-page')}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'create-page'
              ? 'border-sky-400 text-sky-400 bg-sky-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Deploy Wiki Page</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'categories'
              ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <FolderPlus className="w-4 h-4" />
          <span>Category Creator</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'analytics'
              ? 'border-sky-400 text-sky-400 bg-sky-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-sky-400" />
          <span>Data Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('api-playground')}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'api-playground'
              ? 'border-purple-400 text-purple-400 bg-purple-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Developer API Console</span>
        </button>

        <button
          onClick={() => setActiveTab('assets')}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'assets'
              ? 'border-amber-400 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Asset Library</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'database'
              ? 'border-sky-400 text-sky-400 bg-sky-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database Access</span>
        </button>

        <button
          onClick={() => setActiveTab('admin-users')}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'admin-users'
              ? 'border-amber-400 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Gestão de Administradores</span>
        </button>
      </div>

      {/* 3. Page Deployed Success Notification */}
      {isSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-3.5 animate-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-white">Dynamic Wiki Page Deployed Successfully!</h4>
            <p className="text-xs text-slate-400 mt-1">
              Your new article has been generated and appended to the local storage registry.
            </p>
            <button
              onClick={() => onSelectPage(createdPageId)}
              className="mt-2 text-xs text-sky-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Go to new page #{createdPageId}</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Tab Contents rendering */}
      {activeTab === 'create-page' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Columns: Create Page Form */}
          <div className="lg:col-span-2 bg-[#111827] border border-[#1e293b] rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1e293b] pb-3 gap-3">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-sky-400" />
                  <span>Instantiate Page or Text Editor</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Deploy addon articles using visual form blueprints or switch to the raw text/JSON editor mode.
                </p>
              </div>

              <div className="flex items-center bg-[#0b0f19] border border-[#1e293b] rounded-xl p-1 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setEditorMode('form')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    editorMode === 'form' ? 'bg-sky-500 text-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Form Builder
                </button>
                <button
                  type="button"
                  onClick={switchToTextEditor}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    editorMode === 'text' ? 'bg-sky-500 text-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileJson className="w-3.5 h-3.5" />
                  <span>Text / JSON Editor</span>
                </button>
              </div>
            </div>

            {editorMode === 'text' ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-sky-950/20 border border-sky-500/20 rounded-xl text-xs text-slate-300 space-y-1">
                  <p className="font-bold text-sky-400">Raw JSON & Text Editor Mode</p>
                  <p className="text-slate-400 text-[11px]">
                    You are editing the complete wiki article JSON payload. Make changes to metadata, sections, or attributes directly, then click publish.
                  </p>
                </div>
                <textarea
                  rows={20}
                  value={rawJsonCode}
                  onChange={(e) => setRawJsonCode(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-sky-500 rounded-xl p-4 font-mono text-xs text-emerald-300 focus:outline-none leading-relaxed shadow-inner"
                />
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditorMode('form')}
                    className="px-4 py-2.5 bg-[#1e293b] hover:bg-[#334155] text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Back to Form Builder
                  </button>
                  <button
                    type="button"
                    disabled={isSavingPage}
                    onClick={publishFromTextEditor}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl transition shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingPage ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Publish from Text Editor</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitPage} className="space-y-5">
              
              {/* Preset / Template Selector */}
              <div className="space-y-1.5 p-3.5 bg-sky-950/20 border border-sky-500/20 rounded-xl">
                <label className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Choose Template Layout Blueprint</span>
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-sky-500/30 focus:border-sky-400 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition mt-1"
                >
                  <option value="">-- No Template (Empty Layout) --</option>
                  {templates.map(t => (
                    <option key={t.templateId} value={t.templateId}>
                      {t.name} (Blueprint layout for {formatCategoryName(t.category)})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Selecting a blueprint will pre-populate the fields below automatically, ensuring layout harmony!
                </p>
              </div>

              {/* Title & Slug preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Article Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ender Flame Claymore"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (!selectedTemplateId) {
                        const slugified = e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
                        setNamespace(`aetheria:${slugified}`);
                      }
                    }}
                    className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-emerald-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Identifier Namespace</label>
                  <input
                    type="text"
                    placeholder="e.g. aetheria:ender_flame_claymore"
                    value={namespace}
                    onChange={(e) => setNamespace(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-emerald-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition font-mono"
                  />
                </div>
              </div>

              {/* Category & Icon */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Select Category *</label>
                  <select
                    value={selectedCatId}
                    onChange={(e) => setSelectedCatId(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-emerald-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label} {cat.isCustom ? '(Custom)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Page Icon (Assigned Image or Asset) *</span>
                    <span className="text-[10px] text-sky-400 font-mono">Assign image to page icon</span>
                  </label>
                  
                  <div className="p-3 bg-[#0b0f19] border border-[#1e293b] rounded-xl space-y-3">
                    {/* Live Icon Preview & Input */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#111827] border border-sky-500/40 flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
                        <WikiIcon icon={icon} className="w-7 h-7 object-contain" />
                      </div>

                      <input
                        type="text"
                        placeholder="Image URL (e.g. /images/weapons/diamond_sword.png or https://...)"
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        className="w-full bg-[#111827] border border-[#1e293b] focus:border-sky-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>

                    {/* Quick Preset Icon Image Buttons */}
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                        Select Icon Image Preset:
                      </p>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-[#070a12] rounded-lg border border-[#1e293b]">
                        {[
                          '/images/weapons/diamond_sword.png',
                          '/images/weapons/netherite_sword.png',
                          '/images/weapons/gold_sword.png',
                          '/images/weapons/iron_sword.png',
                          '/images/weapons/stone_sword.png',
                          '/images/weapons/wood_sword.png',
                          '/images/tools/diamond_pickaxe.png',
                          '/images/tools/diamond_axe.png',
                          '/images/tools/netherite_axe.png',
                          '/images/tools/netherite_pickaxe.png',
                          '/images/items/apple_golden.png',
                          '/images/items/apple.png',
                          '/images/categories/mobs.png',
                          '/images/categories/items.png',
                          '/images/categories/blocks.png',
                          '/images/categories/recipes.png',
                          '/images/categories/biomes.png',
                          '/images/heart.png',
                          'sword',
                          'shield',
                          'sparkles',
                          'pickaxe',
                          'gem',
                          'flame'
                        ].map((imgPath) => (
                          <button
                            type="button"
                            key={imgPath}
                            onClick={() => setIcon(imgPath)}
                            className={`p-1.5 rounded-lg border flex items-center justify-center transition cursor-pointer ${
                              icon === imgPath
                                ? 'bg-sky-500/20 border-sky-400 ring-2 ring-sky-400/40'
                                : 'bg-[#111827] border-[#1e293b] hover:border-slate-600'
                            }`}
                            title={imgPath}
                          >
                            <WikiIcon icon={imgPath} className="w-5 h-5 object-contain" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Upload Image File for Icon */}
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#1e293b]/60">
                      <span className="text-slate-400">Or upload image file for icon:</span>
                      <label className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg font-bold cursor-pointer transition">
                        <span>Upload Icon File</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                if (ev.target?.result) {
                                  setIcon(ev.target.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Badge Text</label>
                  <input
                    type="text"
                    placeholder="e.g. LEGENDARY"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-emerald-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Dynamic Image Selector / Visual Chooser */}
              <div className="space-y-3 p-4 bg-[#0b0f19] border border-[#1e293b] rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    <span>Select Art Asset / Illustration Cover</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setImageSource('preset')}
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition cursor-pointer ${
                        imageSource === 'preset' ? 'bg-sky-500 text-black' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Presets
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageSource('custom')}
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition cursor-pointer ${
                        imageSource === 'custom' ? 'bg-sky-500 text-black' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageSource('upload')}
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition cursor-pointer ${
                        imageSource === 'upload' ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Upload File
                    </button>
                  </div>
                </div>

                {imageSource === 'preset' ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PRESET_IMAGES.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedPresetImage(img.url)}
                          className={`relative aspect-video rounded-lg border-2 overflow-hidden cursor-pointer transition-all hover:scale-102 ${
                            selectedPresetImage === img.url
                              ? 'border-sky-400 ring-2 ring-sky-400/35'
                              : 'border-[#1e293b] opacity-65 hover:opacity-100'
                          }`}
                        >
                          <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/70 p-1 text-[8px] text-slate-300 truncate text-center">
                            {img.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : imageSource === 'upload' ? (
                  <div className="space-y-2 p-4 bg-[#0b0f19] border border-dashed border-emerald-500/40 rounded-xl text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="page-image-upload-input"
                    />
                    <label
                      htmlFor="page-image-upload-input"
                      className="cursor-pointer flex flex-col items-center justify-center gap-2 py-2"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                        📁
                      </div>
                      <span className="text-xs font-bold text-white">
                        {uploadedFileName ? `Selected: ${uploadedFileName}` : 'Click to Upload Image from Device'}
                      </span>
                      <span className="text-[10px] text-slate-400">Supports PNG, JPG, WebP, SVG</span>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... or hosted image path"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      className="w-full bg-[#111827] border border-[#1e293b] focus:border-emerald-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition"
                    />
                  </div>
                )}
              </div>

              {/* Additional Visuals & Properties */}
              <div className="space-y-4 p-4 bg-[#0b0f19] border border-[#1e293b] rounded-2xl">
                <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2">
                  Extended Page Metadata
                </h3>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Banner Image URL</label>
                  <input
                    type="url"
                    placeholder="https://... for page background banner"
                    value={bannerImageUrl}
                    onChange={(e) => setBannerImageUrl(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1e293b] focus:border-sky-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Item/Texture Images (Comma separated URLs)</label>
                  <input
                    type="text"
                    placeholder="https://img1.png, https://img2.png"
                    value={texturesStr}
                    onChange={(e) => setTexturesStr(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1e293b] focus:border-sky-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-[#1e293b]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">Custom Property Table (Stats)</label>
                    <button
                      type="button"
                      onClick={addCustomProp}
                      className="px-2 py-1 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-[10px] font-bold rounded transition cursor-pointer"
                    >
                      + Add Row
                    </button>
                  </div>
                  {customPropsList.length > 0 ? (
                    <div className="space-y-2">
                      {customPropsList.map((prop, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Key (e.g. Damage)"
                            value={prop.key}
                            onChange={(e) => updateCustomProp(idx, 'key', e.target.value)}
                            className="w-1/3 bg-[#111827] border border-[#1e293b] rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Value (e.g. 15)"
                            value={prop.value}
                            onChange={(e) => updateCustomProp(idx, 'value', e.target.value)}
                            className="w-2/3 bg-[#111827] border border-[#1e293b] rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => removeCustomProp(idx)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500">No custom properties added.</p>
                  )}
                </div>
              </div>

              
              {/* 3D Model Configuration */}
              <div className="space-y-4 p-4 bg-[#0b0f19] border border-[#1e293b] rounded-2xl mt-4">
                <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2">
                  3D Model & Textures
                </h3>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">3D Model Key / URL</label>
                  <input
                    type="text"
                    placeholder="e.g. climber_zombie or https://...model.glb"
                    value={model3DKey}
                    onChange={(e) => setModel3DKey(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1e293b] focus:border-sky-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">3D Texture URL</label>
                  <input
                    type="text"
                    placeholder="e.g. https://...texture.png"
                    value={model3DTexture}
                    onChange={(e) => setModel3DTexture(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1e293b] focus:border-sky-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Advanced Data Tables */}
              <div className="space-y-4 p-4 bg-[#0b0f19] border border-[#1e293b] rounded-2xl mt-4">
                <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2">
                  Advanced Data Tables
                </h3>
                
                {/* Movement Speed */}
                <div className="space-y-1.5 mb-4">
                  <label className="text-xs font-bold text-slate-300 block">Movement Speed</label>
                  <input
                    type="text"
                    placeholder="e.g. 0.28x"
                    value={movementSpeed}
                    onChange={(e) => setMovementSpeed(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1e293b] focus:border-sky-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition"
                  />
                </div>

                {/* Difficulty Stats */}
                <div className="space-y-2 pt-2 border-t border-[#1e293b]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">Difficulty Stats (Health/Attack)</label>
                    <button type="button" onClick={addDifficultyStat} className="px-2 py-1 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-[10px] font-bold rounded">
                      + Add Stat
                    </button>
                  </div>
                  {difficultyStats.length > 0 && (
                    <div className="space-y-2">
                      {difficultyStats.map((stat, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input type="text" placeholder="Diff" value={stat.difficulty} onChange={(e) => updateDifficultyStat(idx, 'difficulty', e.target.value)} className="w-1/4 bg-[#111827] border border-[#1e293b] rounded-lg px-2 text-[11px] text-white" />
                          <input type="text" placeholder="Health" value={stat.health} onChange={(e) => updateDifficultyStat(idx, 'health', e.target.value)} className="w-1/4 bg-[#111827] border border-[#1e293b] rounded-lg px-2 text-[11px] text-white" />
                          <input type="text" placeholder="Atk" value={stat.attack} onChange={(e) => updateDifficultyStat(idx, 'attack', e.target.value)} className="w-1/4 bg-[#111827] border border-[#1e293b] rounded-lg px-2 text-[11px] text-white" />
                          <input type="text" placeholder="Icon" value={stat.icon} onChange={(e) => updateDifficultyStat(idx, 'icon', e.target.value)} className="w-1/4 bg-[#111827] border border-[#1e293b] rounded-lg px-2 text-[11px] text-white" />
                          <button type="button" onClick={() => removeDifficultyStat(idx)} className="text-rose-400">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Drops Table */}
                <div className="space-y-2 pt-2 border-t border-[#1e293b]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">Loot / Drops Table</label>
                    <button type="button" onClick={addDrop} className="px-2 py-1 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-[10px] font-bold rounded">
                      + Add Drop
                    </button>
                  </div>
                  {dropsTable.length > 0 && (
                    <div className="space-y-2">
                      {dropsTable.map((drop, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input type="text" placeholder="Item" value={drop.item} onChange={(e) => updateDrop(idx, 'item', e.target.value)} className="w-1/3 bg-[#111827] border border-[#1e293b] rounded-lg px-2 text-[11px] text-white" />
                          <input type="text" placeholder="Amount" value={drop.amount} onChange={(e) => updateDrop(idx, 'amount', e.target.value)} className="w-1/4 bg-[#111827] border border-[#1e293b] rounded-lg px-2 text-[11px] text-white" />
                          <input type="text" placeholder="Chance" value={drop.chance} onChange={(e) => updateDrop(idx, 'chance', e.target.value)} className="w-1/4 bg-[#111827] border border-[#1e293b] rounded-lg px-2 text-[11px] text-white" />
                          <button type="button" onClick={() => removeDrop(idx)} className="text-rose-400">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Badge Color Choice */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">Badge Color Accent</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(['emerald', 'purple', 'amber', 'blue', 'rose', 'red', 'cyan'] as const).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setBadgeColor(color)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold capitalize border transition cursor-pointer ${
                        badgeColor === color
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-md'
                          : 'bg-[#0b0f19] text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Short Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Abstract Summary / Short Description *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="A precise summary describing the custom addition to the Etherium Addon expansion."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-emerald-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition resize-none"
                />
              </div>

              {/* Quick Bullets / Behavior */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Quick Bullet #1 (Behavior / Feature)</label>
                  <input
                    type="text"
                    placeholder="e.g. Grants Speed II when held in main hand"
                    value={bullet1}
                    onChange={(e) => setBullet1(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-emerald-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Quick Bullet #2 (Behavior / Feature)</label>
                  <input
                    type="text"
                    placeholder="e.g. Crafted using crystal forge table"
                    value={bullet2}
                    onChange={(e) => setBullet2(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-emerald-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Article Content Section */}
              <div className="space-y-3.5 border-t border-[#1e293b] pt-4">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Custom Detailed Section
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Section Header</label>
                    <input
                      type="text"
                      value={sectionTitle}
                      onChange={(e) => setSectionTitle(e.target.value)}
                      className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-emerald-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Section Content (HTML & Markdown safe)</label>
                    <textarea
                      rows={3}
                      placeholder="Provide in-depth lore, stats, spawn behaviors, or specialized drop guides for this entry."
                      value={sectionContent}
                      onChange={(e) => setSectionContent(e.target.value)}
                      className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-emerald-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition resize-y"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={isSavingPage}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.01] active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingPage ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Compiling & Rebuilding Database...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Create Page in SQL Database</span>
                    </>
                  )}
                </button>
              </div>

            </form>
            )}
          </div>

          {/* Right Column: Registry Statistics & Quick Deletion */}
          <div className="space-y-6">
            
            {/* Stats */}
            <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                <span>Registry Stats</span>
              </h3>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-[#0b0f19] border border-[#1e293b] p-3 rounded-xl">
                  <span className="block text-xl font-black text-amber-400">{pages.length}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5 block">Total Pages</span>
                </div>
                <div className="bg-[#0b0f19] border border-[#1e293b] p-3 rounded-xl">
                  <span className="block text-xl font-black text-emerald-400">
                    {pages.filter(p => p.tags.includes('Custom')).length}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5 block">Custom Pages</span>
                </div>
                <div className="bg-[#0b0f19] border border-[#1e293b] p-3 rounded-xl">
                  <span className="block text-xl font-black text-sky-400">
                    {pages.reduce((acc, p) => acc + (p.views ?? p.view_count ?? 0), 0)}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5 block">Total Views</span>
                </div>
              </div>
            </div>

            {/* All Wiki Pages & Add-ons List with Delete Capability */}
            <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span>All Wiki Pages & Add-ons</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPageSortBy(pageSortBy === 'default' ? 'views' : 'default')}
                    className={`text-[10px] px-2 py-0.5 rounded border font-mono transition cursor-pointer flex items-center gap-1 ${
                      pageSortBy === 'views'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        : 'bg-[#0b0f19] text-slate-400 border-[#1e293b] hover:text-white'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>{pageSortBy === 'views' ? 'Most Viewed' : 'Sort: Default'}</span>
                  </button>
                  <span className="text-[10px] font-mono text-slate-400 bg-[#0b0f19] px-2 py-0.5 rounded border border-[#1e293b]">
                    {pages.length} Active
                  </span>
                </div>
              </h3>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {pages.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No active wiki pages found.
                  </div>
                ) : (
                  [...pages]
                    .sort((a, b) => {
                      if (pageSortBy === 'views') {
                        return (b.views ?? b.view_count ?? 0) - (a.views ?? a.view_count ?? 0);
                      }
                      return 0;
                    })
                    .map((cp) => (
                    <div
                      key={cp.id}
                      className="p-3 bg-[#0b0f19] border border-[#1e293b] rounded-xl flex items-center justify-between gap-3 group relative hover:border-slate-700 transition-colors"
                    >
                      <div 
                        onClick={() => onSelectPage(cp.id)}
                        className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                      >
                        <WikiIcon icon={cp.icon} category={cp.category} className="w-5 h-5 text-lg shrink-0" />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-200 group-hover:text-sky-300 transition-colors truncate">
                            {cp.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-[#64748b] font-mono truncate">
                              {cp.namespace || `aetheria:${cp.category}/${cp.id}`}
                            </span>
                            <span className="text-[9px] text-sky-400 font-mono flex items-center gap-0.5 shrink-0" title="Page view count">
                              <Eye className="w-2.5 h-2.5" />
                              {cp.views ?? cp.view_count ?? 0} views
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] px-2 py-0.5 bg-sky-500/10 text-sky-400 rounded border border-sky-500/20 font-medium max-w-[110px] truncate" title={formatCategoryName(cp.category)}>
                          {formatCategoryName(cp.category)}
                        </span>

                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete the wiki page '${cp.title}'? This will remove it from the wiki and homepage.`)) {
                              WikiApi.deletePage(cp.id);
                            }
                          }}
                          className="p-1.5 bg-[#1a1a2e] hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/30 text-[#64748b] hover:text-rose-400 rounded transition cursor-pointer"
                          title="Delete page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Create Category Form */}
          <div className="lg:col-span-2 bg-[#111827] border border-[#1e293b] rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="border-b border-[#1e293b] pb-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-emerald-400" />
                <span>Deploy New Addon Category</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Register a custom category slug. This will instantly become available as a selection across the entire Wiki, sidebar, drawer, and homepage.
              </p>
            </div>

            {catError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-medium">
                {catError}
              </div>
            )}

            {catSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-bold">
                {catSuccess}
              </div>
            )}

            <form onSubmit={handleCreateCategorySubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Category Display Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vehicles"
                    value={newCatLabel}
                    onChange={(e) => {
                      setNewCatLabel(e.target.value);
                      setNewCatId(e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'));
                    }}
                    className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-emerald-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Slug Identifier / ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. vehicles"
                    value={newCatId}
                    onChange={(e) => setNewCatId(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-emerald-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Category Icon (Emoji) *</label>
                  <input
                    type="text"
                    required
                    placeholder="🚁, 🚗, 🧪"
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-emerald-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition text-center font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Border Highlight Color</label>
                  <select
                    value={newCatBorder}
                    onChange={(e) => setNewCatBorder(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-emerald-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition font-mono"
                  >
                    <option value="border-emerald-500/30">Green (emerald)</option>
                    <option value="border-rose-500/30">Red (rose)</option>
                    <option value="border-amber-500/30">Orange (amber)</option>
                    <option value="border-sky-500/30">Blue (sky)</option>
                    <option value="border-purple-500/30">Purple (purple)</option>
                    <option value="border-cyan-500/30">Cyan (cyan)</option>
                    <option value="border-indigo-500/30">Indigo (indigo)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Background Gradient</label>
                  <select
                    value={newCatBg}
                    onChange={(e) => setNewCatBg(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-emerald-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition font-mono"
                  >
                    <option value="from-emerald-950/30 to-[#111827]">Emerald Cavern</option>
                    <option value="from-rose-950/30 to-[#111827]">Rose Nether</option>
                    <option value="from-amber-950/30 to-[#111827]">Amber Forge</option>
                    <option value="from-sky-950/30 to-[#111827]">Sky Ocean</option>
                    <option value="from-purple-950/30 to-[#111827]">Purple Realms</option>
                    <option value="from-cyan-950/30 to-[#111827]">Cyan Ice</option>
                    <option value="from-indigo-950/30 to-[#111827]">Indigo Space</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Category Brief Description *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Modern combat vehicles, engines, and automated defense structures."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-emerald-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Deploy Dynamic Category</span>
              </button>

            </form>
          </div>

          {/* Current Categories List */}
          <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Current Categories</span>
            </h3>

            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`p-3 bg-gradient-to-r ${cat.bg} border ${cat.color} rounded-xl flex items-center justify-between gap-3`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <WikiIcon icon={cat.icon} className="w-6 h-6 text-xl" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">
                        {cat.label}
                      </h4>
                      <p className="text-[9px] text-slate-400 truncate mt-0.5 max-w-[160px]">
                        {cat.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[9px] px-1.5 py-0.5 bg-slate-900 text-slate-400 rounded-full font-mono uppercase">
                      {cat.isCustom ? 'Custom' : 'System'}
                    </span>
                    
                    {cat.isCustom && (
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1.5 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 rounded transition cursor-pointer"
                        title="Delete custom category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {activeTab === 'api-playground' && (
        <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6 space-y-6 shadow-xl max-w-4xl mx-auto">
          <div className="border-b border-[#1e293b] pb-3">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-purple-400" />
              <span>Programmatic Console API Playground</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              The entire knowledge base is powered by a standard developer-accessible browser API. Press <kbd className="px-1.5 py-0.5 bg-[#0b0f19] border border-slate-700 rounded text-[10px] font-mono">F12</kbd> or right-click &rarr; Inspect to open your console and invoke commands directly!
            </p>
          </div>

          <div className="space-y-4">
            
            {/* Example 1: Create Category */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-purple-400 uppercase tracking-wide">
                  1. Programmatic Category Registration
                </h4>
                <span className="text-[9px] font-mono text-slate-500">window.wikiApi.createCategory(...)</span>
              </div>
              <div className="p-3.5 bg-[#0b0f19] border border-[#1e293b] rounded-xl font-mono text-xs text-sky-300 overflow-x-auto">
                <pre>{`// Paste in console to deploy custom categorizations
wikiApi.createCategory({
  id: "magic-spells",
  label: "Magic & Spells",
  desc: "Dynamic elemental scrolls, runes and celestial spellbooks.",
  icon: "🔮",
  color: "border-purple-500/30",
  bg: "from-purple-950/30 to-[#111827]"
});`}</pre>
              </div>
            </div>

            {/* Example 2: Batch Create Pages */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-purple-400 uppercase tracking-wide">
                  2. Programmatic Page Seeding / Batch Generation
                </h4>
                <span className="text-[9px] font-mono text-slate-500">window.wikiApi.createPage(...)</span>
              </div>
              <div className="p-3.5 bg-[#0b0f19] border border-[#1e293b] rounded-xl font-mono text-xs text-emerald-300 overflow-x-auto">
                <pre>{`// Run in developer console to instantly deploy rich wiki layouts
wikiApi.createPage({
  id: "crystal-staff",
  title: "Crystalline Magic Staff",
  namespace: "aetheria:crystalline_staff",
  category: "items",
  description: "A resonant magic staff crafted from concentrated canyon crystals.",
  addonVersion: "v1.4.0",
  icon: "🔮",
  tags: ["items", "weapons", "magic"],
  lastUpdated: new Date().toLocaleDateString(),
  badge: "MYSTIC",
  badgeColor: "purple",
  sections: [
    {
      title: "Casting Mechanics",
      content: "Holding the staff grants a passive mana boost. Right click shoots crystal shards!"
    }
  ]
});`}</pre>
              </div>
            </div>

            {/* Help Info Box */}
            <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl flex gap-3">
              <HelpCircle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-400 space-y-1.5">
                <h5 className="font-bold text-white">Why use the Programmatic API?</h5>
                <p>
                  Instead of clicking or manually copying fields over and over, you can write short Javascript loops in your developer console to batch import datasets, sync with JSON databases, or instantly build complete custom schemas!
                </p>
                <p className="text-[10px] text-purple-300 font-bold">
                  Try typing "wikiApi" in your console to list all available methods!
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6 space-y-8 shadow-xl animate-in fade-in duration-300 font-sans">
          
          {/* Header Banner */}
          <div className="border-b border-[#1e293b] pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-sky-400" />
                  <span>Wiki Analytics & Traffic Console</span>
                </h2>
                <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Live Tracking</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Real-time tracking system showing the most favorited articles, most visited pages, and global reader engagement statistics.
              </p>
            </div>

            <button
              onClick={fetchAnalyticsData}
              disabled={isAnalyticsLoading}
              className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-slate-200 border border-[#334155] rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isAnalyticsLoading ? 'animate-spin' : ''}`} />
              <span>{isAnalyticsLoading ? 'Refreshing Stats...' : 'Refresh Analytics'}</span>
            </button>
          </div>

          {analyticsError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{analyticsError}</span>
            </div>
          )}

          {isAnalyticsLoading && !analyticsData ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-bold text-slate-400">Loading wiki analytics data...</span>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="p-4 bg-[#0b0f19] border border-[#1e293b] hover:border-sky-500/30 rounded-2xl space-y-2 transition shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">Total Page Views</span>
                    <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {analyticsData?.summary?.totalViews?.toLocaleString() || 0}
                  </div>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span>Calculated across all articles</span>
                  </p>
                </div>

                <div className="p-4 bg-[#0b0f19] border border-[#1e293b] hover:border-rose-500/30 rounded-2xl space-y-2 transition shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">Total Saved Favorites</span>
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                      <Heart className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {analyticsData?.summary?.totalFavorites?.toLocaleString() || 0}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Logged-in user bookmarks
                  </p>
                </div>

                <div className="p-4 bg-[#0b0f19] border border-[#1e293b] hover:border-emerald-500/30 rounded-2xl space-y-2 transition shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">Active Articles</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <BookOpen className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {analyticsData?.summary?.totalPages || pages.length}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Wiki knowledge base entries
                  </p>
                </div>

                <div className="p-4 bg-[#0b0f19] border border-[#1e293b] hover:border-purple-500/30 rounded-2xl space-y-2 transition shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">Registered Users</span>
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                      <Globe className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {analyticsData?.summary?.totalUsers || 1}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Registered accounts
                  </p>
                </div>

              </div>

              {/* Search filter for analytics */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Filter analytics by page title, category, or slug..."
                  value={analyticsFilter}
                  onChange={(e) => setAnalyticsFilter(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-sky-500 focus:outline-none rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 transition"
                />
              </div>

              {/* Leaderboards Grid: Most Visited & Most Favorited */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 1. Most Visited Pages Table */}
                <div className="space-y-3 bg-[#0b0f19]/80 border border-[#1e293b] rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <span>Most Visited Wiki Pages</span>
                    </h3>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-bold">
                      Ranked by Total Views
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#1e293b] text-slate-400 font-bold text-[11px]">
                          <th className="py-2.5 px-2">Rank</th>
                          <th className="py-2.5 px-2">Article</th>
                          <th className="py-2.5 px-2 text-center">Category</th>
                          <th className="py-2.5 px-2 text-right">Views</th>
                          <th className="py-2.5 px-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e293b]/60 text-slate-300">
                        {(() => {
                          const list = (analyticsData?.mostVisited || pages.map(p => ({
                            id: p.id,
                            title: p.title,
                            category: p.category,
                            views: p.views || 0
                          }))).filter((item: any) => {
                            if (!analyticsFilter) return true;
                            const query = analyticsFilter.toLowerCase();
                            return (item.title || '').toLowerCase().includes(query) ||
                                   (item.category || '').toLowerCase().includes(query) ||
                                   (item.id || item.slug || '').toLowerCase().includes(query);
                          });

                          if (list.length === 0) {
                            return (
                              <tr>
                                <td colSpan={5} className="py-6 text-center text-slate-500 italic">
                                  No article analytics records found.
                                </td>
                              </tr>
                            );
                          }

                          const maxViews = Math.max(...list.map((i: any) => i.views || 0), 1);

                          return list.map((item: any, idx: number) => {
                            const views = item.views || 0;
                            const percentage = Math.min(Math.round((views / maxViews) * 100), 100);

                            return (
                              <tr key={item.id || idx} className="hover:bg-[#111827] transition-colors">
                                <td className="py-3 px-2 font-mono font-bold">
                                  {idx === 0 ? (
                                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">#1 🥇</span>
                                  ) : idx === 1 ? (
                                    <span className="px-2 py-0.5 rounded bg-slate-400/20 text-slate-200 border border-slate-400/30 text-[10px]">#2 🥈</span>
                                  ) : idx === 2 ? (
                                    <span className="px-2 py-0.5 rounded bg-amber-700/20 text-amber-500 border border-amber-700/30 text-[10px]">#3 🥉</span>
                                  ) : (
                                    <span className="text-slate-500 pl-1">#{idx + 1}</span>
                                  )}
                                </td>
                                <td className="py-3 px-2">
                                  <div className="font-bold text-white truncate max-w-[150px] sm:max-w-[180px]" title={item.title}>
                                    {item.title}
                                  </div>
                                  <div className="w-24 bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
                                    <div
                                      className="bg-sky-400 h-full rounded-full transition-all duration-500"
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-medium capitalize">
                                    {item.category || 'general'}
                                  </span>
                                </td>
                                <td className="py-3 px-2 text-right font-mono font-bold text-sky-400">
                                  {views.toLocaleString()}
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <button
                                    onClick={() => onSelectPage(item.id || item.slug)}
                                    className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px] font-bold transition cursor-pointer"
                                  >
                                    View Page
                                  </button>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Most Favorited Pages Table */}
                <div className="space-y-3 bg-[#0b0f19]/80 border border-[#1e293b] rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-400 fill-rose-500/30" />
                      <span>Most Favorited Wiki Articles</span>
                    </h3>
                    <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded font-bold">
                      Ranked by Favorites Count
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#1e293b] text-slate-400 font-bold text-[11px]">
                          <th className="py-2.5 px-2">Rank</th>
                          <th className="py-2.5 px-2">Article</th>
                          <th className="py-2.5 px-2 text-center">Category</th>
                          <th className="py-2.5 px-2 text-right">Favorites</th>
                          <th className="py-2.5 px-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e293b]/60 text-slate-300">
                        {(() => {
                          const list = (analyticsData?.mostFavorited || pages.map(p => ({
                            id: p.id,
                            title: p.title,
                            category: p.category,
                            favorites_count: 0
                          }))).filter((item: any) => {
                            if (!analyticsFilter) return true;
                            const query = analyticsFilter.toLowerCase();
                            return (item.title || '').toLowerCase().includes(query) ||
                                   (item.category || '').toLowerCase().includes(query) ||
                                   (item.id || item.slug || '').toLowerCase().includes(query);
                          });

                          if (list.length === 0) {
                            return (
                              <tr>
                                <td colSpan={5} className="py-6 text-center text-slate-500 italic">
                                  No favorites analytics records found.
                                </td>
                              </tr>
                            );
                          }

                          return list.map((item: any, idx: number) => {
                            const favCount = item.favorites_count || 0;

                            return (
                              <tr key={item.id || idx} className="hover:bg-[#111827] transition-colors">
                                <td className="py-3 px-2 font-mono font-bold">
                                  {idx === 0 ? (
                                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px]">#1 ❤️</span>
                                  ) : idx === 1 ? (
                                    <span className="px-2 py-0.5 rounded bg-slate-400/20 text-slate-200 border border-slate-400/30 text-[10px]">#2</span>
                                  ) : idx === 2 ? (
                                    <span className="px-2 py-0.5 rounded bg-amber-700/20 text-amber-500 border border-amber-700/30 text-[10px]">#3</span>
                                  ) : (
                                    <span className="text-slate-500 pl-1">#{idx + 1}</span>
                                  )}
                                </td>
                                <td className="py-3 px-2">
                                  <div className="font-bold text-white truncate max-w-[150px] sm:max-w-[180px]" title={item.title}>
                                    {item.title}
                                  </div>
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-medium capitalize">
                                    {item.category || 'general'}
                                  </span>
                                </td>
                                <td className="py-3 px-2 text-right">
                                  <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono font-bold text-[11px] inline-flex items-center gap-1">
                                    <Heart className="w-3 h-3 fill-rose-500" />
                                    <span>{favCount}</span>
                                  </span>
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <button
                                    onClick={() => onSelectPage(item.id || item.slug)}
                                    className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px] font-bold transition cursor-pointer"
                                  >
                                    View Page
                                  </button>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {activeTab === 'assets' && (
        <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6 space-y-6 shadow-xl animate-in fade-in duration-300">
          <div className="border-b border-[#1e293b] pb-4">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-amber-400" />
              <span>Functional Wiki Asset Library</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Live scan of all real image assets in the wiki database files. Click the copy icon to get relative paths to insert into your guides and page templates.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search images by name or path..."
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-amber-400 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['All', 'Weapons', 'Tools', 'Items', 'Categories', 'UI / Other'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedAssetCat(cat)}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    selectedAssetCat === cat
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'bg-[#1e293b]/50 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {isImagesLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-bold text-slate-400">Loading live asset tree...</span>
            </div>
          ) : (
            (() => {
              // Categorize and filter files
              const filtered = imageList.filter(img => {
                const name = img.split('/').pop() || '';
                const matchesSearch = name.toLowerCase().includes(assetSearch.toLowerCase()) || img.toLowerCase().includes(assetSearch.toLowerCase());
                if (!matchesSearch) return false;

                if (selectedAssetCat === 'All') return true;
                const pathCat = getCategoryFromPath(img);
                return pathCat === selectedAssetCat;
              });

              if (filtered.length === 0) {
                return (
                  <div className="text-center py-16 border border-dashed border-[#1e293b] rounded-2xl">
                    <p className="text-sm font-bold text-slate-400">No functional images match your filters.</p>
                    <p className="text-xs text-slate-600 mt-1">Make sure the images are in public/images/ and are larger than 0 bytes.</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filtered.map((img) => {
                    const filename = img.split('/').pop() || '';
                    const isCopied = copiedPath === img;
                    const pathCat = getCategoryFromPath(img);

                    return (
                      <div
                        key={img}
                        className="bg-[#0b0f19] border border-[#1e293b] hover:border-amber-500/40 rounded-xl p-3 flex flex-col justify-between transition group shadow-md"
                      >
                        <div>
                          {/* Image Preview Box with checkerboard */}
                          <div className="relative aspect-square w-full rounded-lg mb-2 overflow-hidden bg-[#070b13] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] flex items-center justify-center p-3 border border-slate-900">
                            <img
                              src={img}
                              alt={filename}
                              className="max-w-full max-h-full h-12 w-12 object-contain group-hover:scale-110 transition duration-300"
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute top-1.5 left-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-950/80 text-slate-400 uppercase tracking-wide border border-slate-800">
                              {pathCat}
                            </span>
                          </div>

                          <div className="px-0.5">
                            <h4 className="text-xs font-bold text-white truncate" title={filename}>
                              {filename.replace('.png', '')}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-mono truncate select-all mt-0.5" title={img}>
                              {img}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between gap-1">
                          <button
                            onClick={() => {
                              copyToClipboard(img);
                              setCopiedPath(img);
                              setTimeout(() => setCopiedPath(null), 2000);
                            }}
                            className={`w-full py-1.5 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              isCopied
                                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/10'
                                : 'bg-[#1e293b]/70 hover:bg-[#1e293b] text-slate-300 hover:text-white border border-[#334155]'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>Copy Path</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
        </div>
      )}

      {activeTab === 'database' && (
        <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6 space-y-8 shadow-xl animate-in fade-in duration-300">
          <div className="border-b border-[#1e293b] pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-sky-400" />
                <span>Cloudflare D1 Database Console</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Real-time query of tables in Cloudflare D1 database. Secure credentials filtering is active.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Cloudflare D1 Read / Write OK</span>
              </span>
            </div>
          </div>

          {dbError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-bold">
              {dbError}
            </div>
          )}

          {isDbLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-bold text-slate-400">Loading database tables...</span>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Users Section (Usernames Only, Explicitly No Emails or Password Hashes) */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-sky-400 uppercase tracking-widest flex items-center gap-2">
                  <span>1. Registered Usernames Table</span>
                  <span className="text-[10px] font-mono text-slate-500 lowercase normal-case bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {dbUsers.length} total records
                  </span>
                </h3>
                <div className="overflow-x-auto border border-[#1e293b] rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#0b0f19] border-b border-[#1e293b] text-slate-400 font-bold">
                        <th className="p-3">Username</th>
                        <th className="p-3 text-rose-400">Email Address (Hidden)</th>
                        <th className="p-3 text-rose-400">Password Hash (Hidden)</th>
                        <th className="p-3">Status / Password Representation</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Registered At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b] text-slate-300">
                      {dbUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-500 italic">
                            No users found in database.
                          </td>
                        </tr>
                      ) : (
                        dbUsers.map((user, idx) => (
                          <tr key={idx} className="hover:bg-[#111827]">
                            <td className="p-3 font-bold text-white">{user.username}</td>
                            <td className="p-3 font-mono text-rose-400/80 bg-rose-500/5 select-none">[SECURE REDACTED]</td>
                            <td className="p-3 font-mono text-rose-400/80 bg-rose-500/5 select-none">[SECURE REDACTED]</td>
                            <td className="p-3 font-mono text-slate-500">•••••••• (Masked Securely)</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                user.role === 'admin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="p-3 text-slate-400 font-mono text-[10px]">
                              {user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-slate-500">
                  ⚠️ <strong>Security Audit Notice:</strong> Email addresses and password cryptographic hashes are filtered server-side to comply with privacy compliance guidelines. Only public usernames and metadata are readable.
                </p>
              </div>

              {/* Cloudflare D1 Wiki Pages Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-sky-400 uppercase tracking-widest flex items-center gap-2">
                  <span>2. Cloudflare D1 Pages Database Table</span>
                  <span className="text-[10px] font-mono text-slate-500 normal-case bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {dbPages.length} active records
                  </span>
                </h3>
                <div className="overflow-x-auto border border-[#1e293b] rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#0b0f19] border-b border-[#1e293b] text-slate-400 font-bold">
                        <th className="p-3">Page ID / Namespace</th>
                        <th className="p-3">Title</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Author Email</th>
                        <th className="p-3">Last Modified</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b] text-slate-300">
                      {dbPages.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-500 italic">
                            No custom pages currently active in Cloudflare D1 database.
                          </td>
                        </tr>
                      ) : (
                        dbPages.map((page, idx) => (
                          <tr key={idx} className="hover:bg-[#111827]">
                            <td className="p-3 font-mono text-sky-300">{page.id}</td>
                            <td className="p-3 font-bold text-white">{page.title}</td>
                            <td className="p-3">
                              <span className="px-1.5 py-0.5 bg-sky-500/10 text-sky-400 rounded border border-sky-500/20 text-[10px]">
                                {page.category}
                              </span>
                            </td>
                            <td className="p-3 text-slate-400">{page.creator_email || 'System'}</td>
                            <td className="p-3 font-mono text-slate-400 text-[10px]">
                              {page.updated_at ? new Date(page.updated_at).toLocaleString() : 'N/A'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Tab 7: Admin Accounts Management */}
      {activeTab === 'admin-users' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Top Info Banner */}
          <div className="bg-[#111827] border border-amber-500/20 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <span>Gestão de Administradores & Novas Credenciais</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Cadastre contas de administrador permanentes com nome de usuário, e-mail e senha de sua escolha.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchAdminAccounts}
                disabled={isAdminAccountsLoading}
                className="px-3.5 py-1.5 bg-[#1e293b] hover:bg-[#283548] text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-700 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAdminAccountsLoading ? 'animate-spin text-amber-400' : ''}`} />
                <span>Atualizar Lista</span>
              </button>
            </div>

            {/* Workflow Guide Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-400 text-[11px] uppercase">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">1</span>
                  <span>Acesso Inicial</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Utilize o usuário <strong className="text-amber-300 font-mono">adm</strong> e senha <strong className="text-amber-300 font-mono">admin</strong> no primeiro acesso ao painel.
                </p>
              </div>

              <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 font-bold text-sky-400 text-[11px] uppercase">
                  <span className="w-4 h-4 rounded-full bg-sky-500/20 flex items-center justify-center text-[10px]">2</span>
                  <span>Criar Sua Conta</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Preencha o formulário abaixo com seu nome de usuário, e-mail e senha definitiva de administrador.
                </p>
              </div>

              <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 font-bold text-emerald-400 text-[11px] uppercase">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">3</span>
                  <span>Login Definitivo</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Depois de criar, você poderá desbloquear o painel usando seu novo usuário ou e-mail com sua nova senha.
                </p>
              </div>
            </div>
          </div>

          {/* Registration Form Card */}
          <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="border-b border-[#1e293b] pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>Registrar Novo Administrador</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                O novo administrador terá permissões totais para gerenciar páginas, categorias e configurações.
              </p>
            </div>

            {createAdminSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-start gap-3 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Conta Criada com Sucesso!</p>
                  <p className="text-emerald-400/90 mt-0.5">{createAdminSuccess}</p>
                </div>
              </div>
            )}

            {createAdminError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-3 animate-in fade-in">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Erro ao Criar Conta</p>
                  <p className="text-rose-400/90 mt-0.5">{createAdminError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateAdminAccount} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Nome de Usuário (Username) <span className="text-rose-400">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: ruan_admin ou ruan"
                    value={newAdminUsername}
                    onChange={(e) => setNewAdminUsername(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0b0f19] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition font-mono placeholder:text-slate-600"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Identificador único de login.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>Endereço de E-mail <span className="text-rose-400">*</span></span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Ex: ruan@dominio.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0b0f19] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition font-mono placeholder:text-slate-600"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Usado para identificação e login alternativo.</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Senha de Administrador <span className="text-rose-400">*</span></span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0b0f19] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition font-mono placeholder:text-slate-600 tracking-widest placeholder:tracking-normal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Confirmar Senha <span className="text-rose-400">*</span></span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Repita a senha"
                    value={newAdminConfirmPassword}
                    onChange={(e) => setNewAdminConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0b0f19] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition font-mono placeholder:text-slate-600 tracking-widest placeholder:tracking-normal"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isCreatingAdmin}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold rounded-xl text-xs transition cursor-pointer disabled:opacity-50 shadow-lg flex items-center gap-2"
                >
                  {isCreatingAdmin ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Registrando Administrador...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Criar Conta de Administrador</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Existing Admins Table Card */}
          <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Administradores Cadastrados no Sistema</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                {adminAccounts.length} contas ativas
              </span>
            </div>

            {adminAccountsError && (
              <p className="text-xs text-rose-400">{adminAccountsError}</p>
            )}

            {isAdminAccountsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-slate-400">Carregando lista de administradores...</span>
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#1e293b] rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0b0f19] border-b border-[#1e293b] text-slate-400 font-bold">
                      <th className="p-3">Nome de Usuário</th>
                      <th className="p-3">E-mail Cadastrado</th>
                      <th className="p-3">Cargo / Função</th>
                      <th className="p-3">Status de Acesso</th>
                      <th className="p-3">Data de Registro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b] text-slate-300">
                    {adminAccounts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-500 italic">
                          Nenhum administrador adicional cadastrado. O acesso padrão "adm" está ativo.
                        </td>
                      </tr>
                    ) : (
                      adminAccounts.map((admin, idx) => (
                        <tr key={idx} className="hover:bg-[#151e2e] transition-colors">
                          <td className="p-3 font-bold text-white flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-[10px]">
                              👑
                            </div>
                            <span className="font-mono">{admin.username || 'adm'}</span>
                          </td>
                          <td className="p-3 font-mono text-slate-300">
                            {admin.email}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold uppercase tracking-wider">
                              {admin.role || 'Administrator'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              <span>Ativo & Autorizado</span>
                            </span>
                          </td>
                          <td className="p-3 text-slate-400 font-mono text-[10px]">
                            {admin.created_at ? new Date(admin.created_at).toLocaleString() : 'Padrão do Sistema'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
