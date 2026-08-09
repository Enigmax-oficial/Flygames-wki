import React, { useState } from 'react';
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
  Layers 
} from 'lucide-react';
import { WikiPage, CategoryType } from '../types/wiki';

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

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryType>('items');
  const [namespace, setNamespace] = useState('aetheria:custom_item');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [badgeColor, setBadgeColor] = useState<'purple' | 'emerald' | 'amber' | 'blue' | 'rose' | 'red' | 'cyan'>('emerald');
  const [icon, setIcon] = useState('⚔️');
  const [bullet1, setBullet1] = useState('');
  const [bullet2, setBullet2] = useState('');
  const [sectionTitle, setSectionTitle] = useState('Overview');
  const [sectionContent, setSectionContent] = useState('');
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdPageId, setCreatedPageId] = useState('');

  if (!isAuthorized) {
    return (
      <div className="max-w-3xl mx-auto p-8 bg-[#111827] border border-rose-500/20 rounded-2xl text-center space-y-4 shadow-xl my-10">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto animate-pulse" />
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          This administration panel and the option to create new pages is restricted exclusively to authorized administrator accounts (<code className="text-rose-400 font-mono">ruanpablolopesbritor@gmail.com</code>).
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const bullets = [bullet1, bullet2].filter(b => b.trim() !== '');

    const newPage: WikiPage = {
      id: slug,
      title,
      namespace: namespace || `aetheria:${slug}`,
      category,
      description,
      addonVersion: 'v1.4.0',
      icon: icon || '📄',
      tags: [category, 'Custom', 'Admin Created'],
      lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      badge: badge || category.toUpperCase(),
      badgeColor,
      behaviorBullets: bullets.length > 0 ? bullets : undefined,
      sections: [
        {
          title: sectionTitle || 'Description',
          content: sectionContent || description
        }
      ]
    };

    onPageCreated(newPage);
    setCreatedPageId(slug);
    setIsSuccess(true);
    
    // Reset form
    setTitle('');
    setDescription('');
    setNamespace('aetheria:custom_item');
    setBadge('');
    setBullet1('');
    setBullet2('');
    setSectionContent('');

    setTimeout(() => {
      setIsSuccess(false);
    }, 4000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-[#111827] to-[#0b0f19] border border-amber-500/20 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white">Admin Control Center</h1>
              <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded font-mono font-bold uppercase">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Authorized session: <code className="text-amber-300 font-mono">{userEmail}</code>
            </p>
          </div>
        </div>

        <button
          onClick={onClosePanel}
          className="px-4 py-2 bg-[#1e293b]/70 hover:bg-[#1e293b] text-slate-200 border border-[#334155] rounded-xl text-xs font-bold transition flex items-center gap-2 self-start sm:self-center cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Admin Panel</span>
        </button>
      </div>

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
              className="mt-2 text-xs text-sky-400 font-bold hover:underline flex items-center gap-1"
            >
              <span>Go to new page #{createdPageId}</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Form Left, Quick Info Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Create Page Form */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1e293b] rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="border-b border-[#1e293b] pb-3">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>Deploy New Wiki Page</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Fill the fields below to instantiate a new page using the core template engine.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Title & Slug preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Article Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ender Flame Claymore"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                  className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-emerald-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition"
                />
              </div>
            </div>

            {/* Category & Icon */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryType)}
                  className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-emerald-500/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none transition"
                >
                  <option value="items">Items & Weapons</option>
                  <option value="mobs">Mobs & Bosses</option>
                  <option value="blocks">Blocks & Ores</option>
                  <option value="recipes">Forge Recipes</option>
                  <option value="biomes">Biomes & Realms</option>
                  <option value="guides">Guides & Manuals</option>
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

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.01] active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Instantiate & Publish Article</span>
            </button>

          </form>
        </div>

        {/* Right 1 Column: Current Custom Articles Overview */}
        <div className="space-y-6">
          
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

          <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Recent Custom Publications</span>
            </h3>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {pages.filter(p => p.tags.includes('Custom')).length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No custom items created yet. Formulate one using the form on the left!
                </div>
              ) : (
                pages.filter(p => p.tags.includes('Custom')).map((cp) => (
                  <div
                    key={cp.id}
                    onClick={() => onSelectPage(cp.id)}
                    className="p-3 bg-[#0b0f19] hover:bg-[#1e293b] border border-[#1e293b] hover:border-sky-500/30 rounded-xl cursor-pointer transition flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
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
                    <span className="text-[10px] px-2 py-0.5 bg-sky-500/10 text-sky-400 rounded-full border border-sky-500/20 capitalize font-medium">
                      {cp.category}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
