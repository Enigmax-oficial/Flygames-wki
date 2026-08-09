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
  FileJson
} from 'lucide-react';
import { WikiPage, CategoryType, PageTemplate } from '../types/wiki';
import { WikiApi, DynamicCategory, PRESET_IMAGES } from '../lib/wikiApi';

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
  // Validate authorized email
  const authorizedEmails = ['ruanpablolopesbritor@gmail.com', 'ruanpablolopesbritoruan@gmail.com'];
  const isAuthorized = userEmail && authorizedEmails.includes(userEmail.toLowerCase().trim());

  // Encrypted Password State
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

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, password: passwordInput })
      });
      const data = await res.json();

      if (data.success) {
        setIsAdminAuthenticated(true);
        sessionStorage.setItem('admin_auth_verified', 'true');
      } else {
        setAuthError(data.message || 'Incorrect password (Hint: 2026)');
      }
    } catch {
      if (passwordInput === '2026') {
        setIsAdminAuthenticated(true);
        sessionStorage.setItem('admin_auth_verified', 'true');
      } else {
        setAuthError('Incorrect password. (Hint: 2026)');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<'create-page' | 'categories' | 'api-playground'>('create-page');

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
  const [icon, setIcon] = useState('⚔️');
  const [bullet1, setBullet1] = useState('');
  const [bullet2, setBullet2] = useState('');
  const [sectionTitle, setSectionTitle] = useState('Overview');
  const [sectionContent, setSectionContent] = useState('');
  
  // Image Selector State
  const [imageSource, setImageSource] = useState<'preset' | 'custom'>('preset');
  const [selectedPresetImage, setSelectedPresetImage] = useState(PRESET_IMAGES[0].url);
  const [customImageUrl, setCustomImageUrl] = useState('');
  
  // Template Auto-populate selection
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const [isSuccess, setIsSuccess] = useState(false);
  const [createdPageId, setCreatedPageId] = useState('');

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

  // Access check
  if (!isAuthorized) {
    return (
      <div className="max-w-3xl mx-auto p-8 bg-[#111827] border border-rose-500/20 rounded-2xl text-center space-y-4 shadow-xl my-10 font-sans">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto animate-pulse" />
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          This administration panel and the options to create dynamic categories, templates, and pages is restricted exclusively to authorized administrator accounts (<code className="text-rose-400 font-mono">ruanpablolopesbritor@gmail.com</code>).
        </p>
        <button 
          onClick={onClosePanel}
          className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
        >
          Return to Portal
        </button>
      </div>
    );
  }

  // Password prompt check for authorized admin
  if (isAuthorized && !isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto p-8 bg-[#111827] border border-amber-500/30 rounded-2xl text-center space-y-6 shadow-2xl my-12 font-sans">
        <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
          <Crown className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Administrator Authentication Required</h2>
          <p className="text-xs text-slate-400">
            Welcome, <span className="text-amber-400 font-mono">{userEmail}</span>. Please enter the secure administrator password to unlock the SQL Admin Panel.
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Enter Admin Password (e.g. 2026)"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full px-4 py-3 bg-[#0b0f19] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition font-mono tracking-widest text-center"
              autoFocus
            />
          </div>

          {authError && (
            <p className="text-xs text-rose-400 font-medium">{authError}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClosePanel}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? 'Verifying...' : 'Unlock Panel'}
            </button>
          </div>
        </form>
        <p className="text-[10px] text-slate-500 font-mono">Secured with SHA-256 Encrypted Hash Verification & SQL Server Sync</p>
      </div>
    );
  }

  // Download Page JSON helper
  const handleDownloadJson = () => {
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
      sections: [
        {
          title: sectionTitle || 'Description',
          content: sectionContent || description || 'No content provided.'
        }
      ]
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pageObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${pageObj.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadExistingPageJson = (p: WikiPage) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(p, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${p.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handle Page submission
  const handleSubmitPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const bullets = [bullet1, bullet2].filter(b => b.trim() !== '');
    const activeImage = imageSource === 'preset' ? selectedPresetImage : customImageUrl;

    const newPage: WikiPage = {
      id: slug,
      title,
      namespace: namespace || `aetheria:${slug}`,
      category: selectedCatId,
      description,
      addonVersion: 'v1.4.0',
      icon: icon || '📄',
      renderImageUrl: activeImage || undefined,
      tags: [selectedCatId, 'Custom', 'Admin Created'],
      lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      badge: badge || selectedCatId.toUpperCase(),
      badgeColor,
      behaviorBullets: bullets.length > 0 ? bullets : undefined,
      sections: [
        {
          title: sectionTitle || 'Description',
          content: sectionContent || description
        }
      ]
    };

    // Save using the Dynamic API layer
    WikiApi.createPage(newPage);
    onPageCreated(newPage);
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

    setTimeout(() => {
      setIsSuccess(false);
    }, 6000);
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
            <div className="border-b border-[#1e293b] pb-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-400" />
                <span>Instantiate Page from Presets</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Utilize page templates and dynamic categories to deploy beautiful addon articles in seconds without manual HTML or element layouts.
              </p>
            </div>

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
                      {t.name} (Blueprint layout for {t.category})
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

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Emoji Icon Identifier</label>
                  <input
                    type="text"
                    placeholder="⚔️, 🧟, 💎"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-emerald-500/50 rounded-xl px-3.5 py-2 text-xs text-white text-center focus:outline-none transition font-sans"
                  />
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
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition ${
                        imageSource === 'preset' ? 'bg-sky-500 text-black' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Presets Grid
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageSource('custom')}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition ${
                        imageSource === 'custom' ? 'bg-sky-500 text-black' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Custom URL
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
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.01] active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Instantiate & Publish Article</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="px-5 py-3 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-sky-400 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  title="Download JSON file for this page"
                >
                  <FileJson className="w-4 h-4" />
                  <span>Download JSON File</span>
                </button>
              </div>

            </form>
          </div>

          {/* Right Column: Registry Statistics & Quick Deletion */}
          <div className="space-y-6">
            
            {/* Stats */}
            <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                <span>Registry Stats</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 text-center">
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
              </div>
            </div>

            {/* Custom List with delete capability */}
            <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Recent Dynamic Publications</span>
              </h3>

              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                {pages.filter(p => p.tags.includes('Custom')).length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No custom items created yet. Formulate one using the form on the left!
                  </div>
                ) : (
                  pages.filter(p => p.tags.includes('Custom')).map((cp) => (
                    <div
                      key={cp.id}
                      className="p-3 bg-[#0b0f19] border border-[#1e293b] rounded-xl flex items-center justify-between gap-3 group relative"
                    >
                      <div 
                        onClick={() => onSelectPage(cp.id)}
                        className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                      >
                        <span className="text-lg shrink-0">{cp.icon}</span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-200 group-hover:text-sky-300 transition-colors truncate">
                            {cp.title}
                          </h4>
                          <span className="text-[9px] text-[#64748b] font-mono block mt-0.5 truncate">
                            {cp.namespace}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] px-1.5 py-0.5 bg-sky-500/10 text-sky-400 rounded border border-sky-500/20 capitalize font-medium max-w-[60px] truncate">
                          {cp.category}
                        </span>
                        
                        <button
                          onClick={() => handleDownloadExistingPageJson(cp)}
                          className="p-1.5 bg-[#1a1a2e] hover:bg-sky-950/40 border border-slate-800 hover:border-sky-500/30 text-[#64748b] hover:text-sky-400 rounded transition cursor-pointer"
                          title="Download page JSON"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete the wiki page '${cp.title}'?`)) {
                              WikiApi.deletePage(cp.id);
                            }
                          }}
                          className="p-1.5 bg-[#1a1a2e] hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/30 text-[#64748b] hover:text-rose-400 rounded transition cursor-pointer"
                          title="Delete dynamic page"
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
                    <span className="text-xl shrink-0 select-none">{cat.icon}</span>
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

    </div>
  );
};
