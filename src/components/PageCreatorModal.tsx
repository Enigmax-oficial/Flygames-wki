import React, { useState } from 'react';
import { WikiPage, CategoryType } from '../types/wiki';
import { PageCreator, downloadTemplateScript } from '../templates/PageCreator';
import { 
  X, 
  Plus, 
  FileText, 
  Image as ImageIcon, 
  Box, 
  Layers, 
  Sparkles, 
  CheckCircle,
  HelpCircle,
  Download,
  Crown
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
  const [category, setCategory] = useState<CategoryType>('mobs');
  const [title, setTitle] = useState('');
  const [namespace, setNamespace] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('Addon Creator');
  const [imageUrl, setImageUrl] = useState('');
  const [modelKey, setModelKey] = useState<string>('climber_zombie');
  const [defaultAnim, setDefaultAnim] = useState<'idle' | 'attack' | 'swimming' | 'baby_attack'>('idle');
  
  // Custom Section
  const [sectionTitle, setSectionTitle] = useState('Tactics & Behavior');
  const [sectionContent, setSectionContent] = useState('Describe how this entity behaves or how to craft/use it.');

  // Stats
  const [health, setHealth] = useState<string>('50');
  const [attack, setAttack] = useState<string>('12 (6 Hearts)');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Use PageCreator class from /src/templates/PageCreator
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
      .setDescription(description || `${title} page in the Aetheria Addon.`)
      .setAuthor(author || 'Aetheria Creator');

    if (namespace.trim()) {
      builder.setNamespace(namespace.trim());
    }

    if (imageUrl.trim()) {
      builder.attachImage(imageUrl.trim());
    }

    if (modelKey) {
      builder.attach3DModel(modelKey, defaultAnim);
    }

    if (sectionTitle.trim() && sectionContent.trim()) {
      builder.addSection(sectionTitle.trim(), sectionContent.trim());
    }

    if (category === 'mobs' && health) {
      builder.setMobStats({
        health: parseInt(health) || 40,
        attackDamage: attack || '10',
        behavior: 'Hostile',
        spawnBiomes: ['aetheria:custom_biome'],
        drops: [],
        xpDrop: 20
      });
    }

    const createdPage = builder.build();
    onPageCreated(createdPage);
    onClose();

    // Reset Form
    setTitle('');
    setDescription('');
    setImageUrl('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0d1322] border border-sky-500/40 rounded-2xl shadow-[0_0_50px_rgba(56,189,248,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#1e293b] bg-[#070a12] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-black text-white uppercase tracking-wide">
              Create Page from Template
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#64748b] hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          <p className="text-[#94a3b8] leading-relaxed">
            Instantiate a new wiki page using the <code className="text-sky-400 font-mono">PageCreator</code> class template. Styled automatically without writing custom CSS.
          </p>

          {/* Category Picker */}
          <div>
            <label className="block text-[#94a3b8] font-bold uppercase tracking-wider mb-2">
              Category Template
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {(['mobs', 'items', 'blocks', 'recipes', 'biomes', 'guides'] as const).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-1 rounded-xl font-bold uppercase transition-all border text-center cursor-pointer ${
                    category === cat
                      ? 'bg-sky-500 text-black border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                      : 'bg-[#111827] text-[#94a3b8] border-[#1e293b] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Title & Namespace */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#94a3b8] font-bold uppercase mb-1">
                Page Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Netherite Zombie"
                className="w-full bg-[#111827] border border-[#1e293b] focus:border-sky-400 rounded-xl px-3 py-2 text-white placeholder-[#475569] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[#94a3b8] font-bold uppercase mb-1">
                Identifier Namespace
              </label>
              <input
                type="text"
                value={namespace}
                onChange={(e) => setNamespace(e.target.value)}
                placeholder="aetheria:netherite_zombie"
                className="w-full bg-[#111827] border border-[#1e293b] focus:border-sky-400 rounded-xl px-3 py-2 font-mono text-white placeholder-[#475569] focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[#94a3b8] font-bold uppercase mb-1">
              Description / Summary
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of this entity, weapon, or block..."
              className="w-full bg-[#111827] border border-[#1e293b] focus:border-sky-400 rounded-xl p-3 text-white placeholder-[#475569] focus:outline-none"
            />
          </div>

          {/* Image & 3D Model Attachments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-[#070a12] border border-[#1e293b] rounded-xl">
            <div>
              <label className="block text-sky-400 font-bold uppercase mb-1 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" /> Attach Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... image render URL"
                className="w-full bg-[#111827] border border-[#1e293b] focus:border-sky-400 rounded-xl px-3 py-1.5 text-white placeholder-[#475569] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-purple-400 font-bold uppercase mb-1 flex items-center gap-1">
                <Box className="w-3.5 h-3.5" /> Attach Bedrock 3D Model
              </label>
              <select
                value={modelKey}
                onChange={(e) => setModelKey(e.target.value)}
                className="w-full bg-[#111827] border border-[#1e293b] focus:border-sky-400 rounded-xl px-3 py-1.5 text-white focus:outline-none font-mono"
              >
                <option value="climber_zombie">Climber Zombie (bouldering_zombie.json)</option>
                <option value="crystalline_berserker">Crystalline Berserker Titan</option>
              </select>
            </div>
          </div>

          {/* Animation Selector */}
          <div>
            <label className="block text-[#94a3b8] font-bold uppercase mb-1">
              Bedrock Molang Animation
            </label>
            <div className="flex gap-2">
              {(['idle', 'attack', 'swimming', 'baby_attack'] as const).map((anim) => (
                <button
                  type="button"
                  key={anim}
                  onClick={() => setDefaultAnim(anim)}
                  className={`px-3 py-1.5 rounded-lg font-mono capitalize transition-all border cursor-pointer ${
                    defaultAnim === anim
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 font-bold'
                      : 'bg-[#111827] text-[#94a3b8] border-[#1e293b]'
                  }`}
                >
                  {anim.replace('_', ' ')}
                </button>
              ))}
            </div>
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
              placeholder="Section Title (e.g. Combat Tactics)"
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

          {/* Footer Submit */}
          <div className="pt-3 border-t border-[#1e293b] flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => downloadTemplateScript(title || 'New Item', category, namespace || 'aetheria:custom_item')}
              className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-all"
              title="Download executable JavaScript/TypeScript template script for source code implementation"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Download Template JS</span>
            </button>

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
                <span>Instantiate & Publish Page</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
