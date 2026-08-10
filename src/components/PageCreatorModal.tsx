import React, { useState } from 'react';
import { WikiPage, CategoryType } from '../types/wiki';
import { PageCreator, downloadTemplateScript } from '../templates/PageCreator';
import { WikiApi } from '../lib/wikiApi';
import { WikiIcon } from './WikiIcon';
import { ITEM_IMAGES } from '../data/itemAssets';
import { 
  X, 
  FileText, 
  Image as ImageIcon, 
  Box, 
  Sparkles, 
  CheckCircle,
  Download,
  Code,
  Zap,
  Sword
} from 'lucide-react';

interface PageCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPageCreated: (newPage: WikiPage) => void;
}

export const PageCreatorModal: React.FC<PageCreatorModalProps> = ({
  isOpen,
  onClose,
  onPageCreated,
}) => {
  const categories = WikiApi.getCategories();
  const [inputMode, setInputMode] = useState<'form' | 'json'>('form');

  // Form state
  const [category, setCategory] = useState<CategoryType>('items');
  const [title, setTitle] = useState('');
  const [namespace, setNamespace] = useState('');
  const [badge, setBadge] = useState('WEAPON');
  const [badgeColor, setBadgeColor] = useState<'purple' | 'emerald' | 'amber' | 'blue' | 'rose'>('amber');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('Addon Creator');
  const [iconAsset, setIconAsset] = useState('aetheria:aetherial_sword');
  const [imageUrl, setImageUrl] = useState('');
  const [multiplePhotosStr, setMultiplePhotosStr] = useState('');
  
  // Item Stats
  const [rarity, setRarity] = useState('Legendary');
  const [attackDamage, setAttackDamage] = useState('11');
  const [durability, setDurability] = useState('2048');
  const [stackSize, setStackSize] = useState('1');

  // Bullets
  const [bulletsStr, setBulletsStr] = useState(
    'Inflicts high damage with 1.6 attack speed.\nRight-Click Ability: Celestial Leap.\nGrants Slow Falling effect.'
  );

  // Custom Section
  const [sectionTitle, setSectionTitle] = useState('Overview & Abilities');
  const [sectionContent, setSectionContent] = useState('Describe how this item, mob, or block functions inside Minecraft.');

  // JSON state
  const [jsonInput, setJsonInput] = useState<string>(
    JSON.stringify(
      {
        id: 'custom-json-item',
        title: 'Custom Elemental Blade',
        category: 'items',
        namespace: 'aetheria:custom_elemental_blade',
        badge: 'LEGENDARY WEAPON',
        badgeColor: 'amber',
        description: 'A custom blade crafted with Crystalline Ore and Void Dust.',
        addonVersion: 'v1.4.0',
        icon: 'aetheria:aetherial_sword',
        renderImageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1607988795691-3d0147b43231?auto=format&fit=crop&w=800&q=80'
        ],
        itemStats: {
          rarity: 'Legendary',
          durability: 2048,
          attackDamage: 12,
          stackSize: 1
        },
        behaviorBullets: [
          'Inflicts 12 Attack Damage with elemental burn effect',
          'Launches player forward on right-click use',
          'Critical strikes cause area-of-effect shockwaves'
        ],
        sections: [
          {
            title: 'Overview',
            content: 'This weapon was compiled and assembled directly from custom JSON data.'
          }
        ]
      },
      null,
      2
    )
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (inputMode === 'json') {
      try {
        setJsonError(null);
        const parsed = JSON.parse(jsonInput);
        if (!parsed.id || !parsed.title) {
          throw new Error("JSON must contain at least 'id' and 'title' properties.");
        }
        const newPage: WikiPage = {
          category: parsed.category || 'items',
          addonVersion: parsed.addonVersion || 'v1.4.0',
          tags: ['custom', 'json'],
          lastUpdated: new Date().toISOString().split('T')[0],
          author: parsed.author || 'JSON Contributor',
          ...parsed
        };
        onPageCreated(newPage);
        onClose();
      } catch (err: any) {
        setJsonError(err.message || 'Invalid JSON format');
      }
      return;
    }

    if (!title.trim()) return;

    let builder: PageCreator;
    switch (category) {
      case 'mobs':
        builder = PageCreator.createMob(title);
        break;
      case 'items':
        builder = PageCreator.createItem(title);
        break;
      case 'blocks':
        builder = PageCreator.createBlock(title);
        break;
      case 'biomes':
        builder = PageCreator.createBiome(title);
        break;
      case 'recipes':
        builder = PageCreator.createRecipe(title);
        break;
      case 'guides':
        builder = PageCreator.createGuide(title);
        break;
      default:
        builder = PageCreator.createItem(title);
    }

    builder
      .setDescription(description || `${title} entry in the Aetheria Addon.`)
      .setAuthor(author || 'Aetheria Creator')
      .setIcon(iconAsset || category)
      .setBadge(badge || category.toUpperCase(), badgeColor);

    if (namespace.trim()) {
      builder.setNamespace(namespace.trim());
    }

    if (imageUrl.trim()) {
      builder.attachImage(imageUrl.trim());
    }

    // Multiple photos
    const photos = multiplePhotosStr
      .split('\n')
      .flatMap(line => line.split(','))
      .map(s => s.trim())
      .filter(Boolean);

    if (sectionTitle.trim() && sectionContent.trim()) {
      builder.addSection(sectionTitle.trim(), sectionContent.trim());
    }

    // Mechanics bullets
    const bullets = bulletsStr.split('\n').map(s => s.trim()).filter(Boolean);
    bullets.forEach(b => builder.addBehaviorBullet(b));

    // Item Stats
    if (category === 'items' || rarity) {
      builder.setItemStats({
        rarity,
        attackDamage: parseInt(attackDamage) || 10,
        durability: parseInt(durability) || 1500,
        stackSize: parseInt(stackSize) || 1
      });
    }

    const createdPage = builder.build();
    if (photos.length > 0) {
      createdPage.images = photos;
    }

    onPageCreated(createdPage);
    onClose();

    // Reset Form
    setTitle('');
    setDescription('');
    setImageUrl('');
    setMultiplePhotosStr('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0d1322] border border-sky-500/40 rounded-2xl shadow-[0_0_50px_rgba(56,189,248,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#1e293b] bg-[#070a12] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-black text-white uppercase tracking-wide">
              Create / Import Wiki Page
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-[#111827] border border-[#1e293b] p-0.5 rounded-lg flex items-center text-xs">
              <button
                type="button"
                onClick={() => setInputMode('form')}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  inputMode === 'form' ? 'bg-sky-500 text-black shadow' : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                Template Builder
              </button>
              <button
                type="button"
                onClick={() => setInputMode('json')}
                className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  inputMode === 'json' ? 'bg-sky-500 text-black shadow' : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>JSON Editor</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 text-[#64748b] hover:text-white rounded-lg transition-colors cursor-pointer ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form / JSON Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {inputMode === 'json' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[#94a3b8]">
                  Edit or paste structured <code className="text-sky-400 font-mono">JSON</code> object to compile and publish a wiki page instantly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const obj = JSON.parse(jsonInput);
                      setJsonInput(JSON.stringify(obj, null, 2));
                      setJsonError(null);
                    } catch (err: any) {
                      setJsonError(err.message);
                    }
                  }}
                  className="px-2.5 py-1 bg-[#1e293b] hover:bg-[#334155] text-sky-300 rounded font-mono text-[11px]"
                >
                  Format JSON
                </button>
              </div>

              {jsonError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl font-mono text-[11px]">
                  ⚠️ JSON Parse Error: {jsonError}
                </div>
              )}

              <textarea
                rows={14}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full bg-[#070a12] border border-[#1e293b] focus:border-sky-400 font-mono text-emerald-300 rounded-xl p-4 text-xs leading-relaxed focus:outline-none shadow-inner"
                placeholder="Paste valid JSON schema here..."
              />
            </div>
          ) : (
            <>
              {/* Category Picker */}
              <div>
                <label className="block text-[#94a3b8] font-bold uppercase tracking-wider mb-2">
                  Category Type
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategory(cat.id as CategoryType)}
                      className={`py-2 px-1 rounded-xl font-bold uppercase transition-all border text-center cursor-pointer ${
                        category === cat.id
                          ? 'bg-sky-500 text-black border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                          : 'bg-[#111827] text-[#94a3b8] border-[#1e293b] hover:text-white'
                      }`}
                    >
                      <WikiIcon icon={cat.icon} className="w-4 h-4 mr-1 inline-block" />
                      <span>{cat.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[#94a3b8] font-bold uppercase mb-1">
                    Page Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      const slug = e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
                      if (slug) setNamespace(`aetheria:${slug}`);
                    }}
                    placeholder="e.g. Aetherial Claymore"
                    className="w-full bg-[#111827] border border-[#1e293b] focus:border-sky-400 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#94a3b8] font-bold uppercase mb-1">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="e.g. WEAPON"
                    className="w-full bg-[#111827] border border-[#1e293b] focus:border-sky-400 rounded-xl px-3 py-2 text-white focus:outline-none font-bold uppercase"
                  />
                </div>
              </div>

              {/* Icon Image Asset Selector */}
              <div className="space-y-2 p-3.5 bg-[#070a12]/80 border border-[#1e293b] rounded-xl">
                <label className="block text-sky-400 font-bold uppercase flex items-center gap-1.5">
                  <Sword className="w-4 h-4 text-sky-400" />
                  <span>Item Icon Asset</span>
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  {Object.keys(ITEM_IMAGES).slice(0, 8).map((assetKey) => (
                    <button
                      type="button"
                      key={assetKey}
                      onClick={() => setIconAsset(assetKey)}
                      className={`w-10 h-10 p-1 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                        iconAsset === assetKey ? 'bg-sky-500/20 border-sky-400 ring-2 ring-sky-400/30' : 'bg-[#111827] border-[#1e293b]'
                      }`}
                      title={assetKey}
                    >
                      <WikiIcon icon={assetKey} className="w-7 h-7" />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={iconAsset}
                  onChange={(e) => setIconAsset(e.target.value)}
                  placeholder="Asset ID or Lucide name (e.g. aetheria:aetherial_sword, items, shield)"
                  className="w-full bg-[#111827] border border-[#1e293b] focus:border-sky-400 rounded-xl px-3 py-1.5 text-white font-mono text-[11px] focus:outline-none"
                />
              </div>

              {/* Photos & Screenshots Gallery */}
              <div className="space-y-2 p-3.5 bg-[#070a12]/80 border border-[#1e293b] rounded-xl">
                <label className="block text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <span>Multiple Photos / Gallery Screenshots (URLs)</span>
                </label>
                <textarea
                  rows={2}
                  value={multiplePhotosStr}
                  onChange={(e) => setMultiplePhotosStr(e.target.value)}
                  placeholder="Paste photo URLs (one per line or comma-separated)&#10;https://images.unsplash.com/...&#10;https://images.unsplash.com/..."
                  className="w-full bg-[#111827] border border-[#1e293b] focus:border-emerald-400 rounded-xl p-2.5 text-white font-mono text-[11px] focus:outline-none"
                />
              </div>

              {/* Item Attributes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-[#070a12]/80 border border-[#1e293b] rounded-xl">
                <div>
                  <label className="block text-[#64748b] font-bold uppercase mb-1">Rarity</label>
                  <select
                    value={rarity}
                    onChange={(e) => setRarity(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1e293b] text-white rounded-lg px-2 py-1.5 focus:outline-none text-xs font-bold"
                  >
                    <option value="Legendary">Legendary</option>
                    <option value="Epic">Epic</option>
                    <option value="Rare">Rare</option>
                    <option value="Uncommon">Uncommon</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#64748b] font-bold uppercase mb-1">Attack Damage</label>
                  <input
                    type="number"
                    value={attackDamage}
                    onChange={(e) => setAttackDamage(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1e293b] text-rose-400 font-mono font-bold rounded-lg px-2 py-1.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#64748b] font-bold uppercase mb-1">Durability</label>
                  <input
                    type="number"
                    value={durability}
                    onChange={(e) => setDurability(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1e293b] text-sky-400 font-mono font-bold rounded-lg px-2 py-1.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#64748b] font-bold uppercase mb-1">Stack Size</label>
                  <input
                    type="number"
                    value={stackSize}
                    onChange={(e) => setStackSize(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1e293b] text-emerald-400 font-mono font-bold rounded-lg px-2 py-1.5 focus:outline-none"
                  />
                </div>
              </div>

              {/* Key Features & Mechanics Bullets */}
              <div className="space-y-1.5">
                <label className="block text-sky-400 font-bold uppercase flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-sky-400" />
                  <span>Key Mechanics & Abilities (Bullet Points)</span>
                </label>
                <textarea
                  rows={3}
                  value={bulletsStr}
                  onChange={(e) => setBulletsStr(e.target.value)}
                  placeholder="One mechanic per line..."
                  className="w-full bg-[#111827] border border-[#1e293b] focus:border-sky-400 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[#94a3b8] font-bold uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short overview of this wiki page entry..."
                  className="w-full bg-[#111827] border border-[#1e293b] focus:border-sky-400 rounded-xl p-3 text-white focus:outline-none"
                />
              </div>

              {/* Section details */}
              <div className="space-y-2 pt-2 border-t border-[#1e293b]">
                <label className="block text-sky-400 font-bold uppercase">
                  Add Text Section
                </label>
                <input
                  type="text"
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  placeholder="Section Title (e.g. Combat Abilities)"
                  className="w-full bg-[#111827] border border-[#1e293b] focus:border-sky-400 rounded-xl px-3 py-1.5 text-white focus:outline-none"
                />
                <textarea
                  rows={3}
                  value={sectionContent}
                  onChange={(e) => setSectionContent(e.target.value)}
                  placeholder="Section Content details..."
                  className="w-full bg-[#111827] border border-[#1e293b] focus:border-sky-400 rounded-xl p-3 text-white focus:outline-none"
                />
              </div>
            </>
          )}

          {/* Footer Submit */}
          <div className="pt-3 border-t border-[#1e293b] flex flex-wrap items-center justify-between gap-3">
            {inputMode === 'form' ? (
              <button
                type="button"
                onClick={() => downloadTemplateScript(title || 'New Item', category, namespace || 'aetheria:custom_item')}
                className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-all"
                title="Download executable JavaScript/TypeScript template script for source code implementation"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Download Template JS</span>
              </button>
            ) : (
              <div className="text-[11px] text-[#64748b]">
                💡 Tip: Ensure JSON schema matches standard `WikiPage` attributes.
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-white font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-sky-500 hover:bg-sky-400 text-black font-bold rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.4)] cursor-pointer active:scale-95 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{inputMode === 'json' ? 'Import & Publish JSON' : 'Instantiate & Publish Page'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
