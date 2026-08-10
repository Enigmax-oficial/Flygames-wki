import React, { useState } from 'react';
import { AVAILABLE_TEMPLATES, createPageFromTemplate } from '../data/templateRegistry';
import { WikiPage } from '../types/wiki';
import { X, Sparkles, Eye, Save, FileText, Check, Code, Download, Upload } from 'lucide-react';
import { CraftingGrid } from './CraftingGrid';
import { Infobox } from './Infobox';
import { WikiPageBuilder } from '../lib/WikiPageBuilder';
import wikiPageTemplate from '../templates/wikiPageTemplate.json';

interface TemplateCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePage: (page: WikiPage) => void;
}

export const TemplateCreatorModal: React.FC<TemplateCreatorModalProps> = ({
  isOpen,
  onClose,
  onSavePage,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('item-template');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('items');
  const [activeTab, setActiveTab] = useState<'form' | 'preview' | 'json'>('form');
  const [jsonText, setJsonText] = useState<string>(() => JSON.stringify(wikiPageTemplate.sample, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const currentTemplate = AVAILABLE_TEMPLATES.find((t) => t.templateId === selectedTemplateId) || AVAILABLE_TEMPLATES[0];

  // Handle template switch
  const handleTemplateChange = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    const tmpl = AVAILABLE_TEMPLATES.find((t) => t.templateId === tmplId);
    if (tmpl && tmpl.defaultData) {
      setIcon(tmpl.defaultData.icon || '📦');
      if (!title) setTitle(tmpl.defaultData.title || '');
      if (!description) setDescription(tmpl.defaultData.description || '');
      
      const built = WikiPageBuilder.fromJSON(
        createPageFromTemplate(tmplId, {
          title: tmpl.defaultData.title || 'Sample Title',
          namespace: 'etherium:entry',
          description: tmpl.defaultData.description || 'Sample Description',
        })
      ).toJSON();
      setJsonText(built);
    }
  };

  // Build current live preview object
  const buildPageObject = (): WikiPage => {
    if (activeTab === 'json') {
      try {
        const parsed = JSON.parse(jsonText);
        return WikiPageBuilder.fromJSON(parsed).build();
      } catch (e) {
        // Fallback to standard builder
      }
    }

    const base = createPageFromTemplate(selectedTemplateId, {
      title: title || 'New Article Page',
      namespace: `addon:${title.toLowerCase().replace(/\s+/g, '_') || 'entry'}`,
      description: description || 'New custom entry for the wiki.',
    });

    base.icon = icon || '📦';
    return base;
  };

  const currentPreviewPage = buildPageObject();

  const handleLoadSampleJSON = () => {
    const sample = WikiPageBuilder.fromTemplate().toJSON();
    setJsonText(sample);
    setJsonError(null);
  };

  const handleApplyJSON = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const builder = WikiPageBuilder.fromJSON(parsed);
      const built = builder.build();
      setTitle(built.title || '');
      setDescription(built.description || '');
      setIcon(built.icon || '📦');
      setJsonError(null);
      setActiveTab('preview');
    } catch (e) {
      setJsonError('Invalid JSON format. Please check syntax.');
    }
  };

  const handleSave = () => {
    onSavePage(currentPreviewPage);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md font-sans">
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#e0e0e0]">
        {/* Header */}
        <div className="p-4 bg-[#0c0c0c] border-b border-[#2a2a2a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base sm:text-lg uppercase tracking-tight">
                Add New Wiki Page
              </h2>
              <p className="text-xs text-[#888]">
                Select a type template and fill in the details below
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] text-[#888] hover:text-white border border-[#333]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Selector Bar */}
        <div className="p-3 bg-[#141414] border-b border-[#2a2a2a] overflow-x-auto flex items-center gap-2">
          <span className="text-xs font-mono text-[#666] uppercase font-bold shrink-0">Type:</span>
          {AVAILABLE_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.templateId}
              onClick={() => handleTemplateChange(tmpl.templateId)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedTemplateId === tmpl.templateId
                  ? 'bg-emerald-500 text-black font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'bg-[#1a1a1a] text-[#aaa] hover:text-white border border-[#2a2a2a]'
              }`}
            >
              <span>{tmpl.defaultData.icon || '📄'}</span>
              <span>{tmpl.name}</span>
            </button>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#2a2a2a] bg-[#0c0c0c] text-xs font-mono">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-2.5 px-4 text-center border-b-2 flex items-center justify-center gap-1.5 font-bold transition-colors ${
              activeTab === 'form'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-[#888] hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Article Details</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-2.5 px-4 text-center border-b-2 flex items-center justify-center gap-1.5 font-bold transition-colors ${
              activeTab === 'preview'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-[#888] hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Live Preview</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`flex-1 py-2.5 px-4 text-center border-b-2 flex items-center justify-center gap-1.5 font-bold transition-colors ${
              activeTab === 'json'
                ? 'border-sky-500 text-sky-400 bg-sky-500/10'
                : 'border-transparent text-[#888] hover:text-white'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>JSON Template & Class</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {activeTab === 'form' && (
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[#888] font-bold uppercase text-[11px]">Page Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Celestial Sword, Void Dragon..."
                    className="w-full bg-[#0c0c0c] border border-[#333] rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#888] font-bold uppercase text-[11px]">Icon Emoji</label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="🗡️"
                    className="w-full bg-[#0c0c0c] border border-[#333] rounded-lg p-2.5 text-white text-center text-lg focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#888] font-bold uppercase text-[11px]">Short Overview / Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this item, mob, or block..."
                  className="w-full bg-[#0c0c0c] border border-[#333] rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div className="p-3.5 bg-[#0c0c0c] rounded-lg border border-[#2a2a2a] space-y-1">
                <h4 className="font-bold text-emerald-400 text-xs uppercase tracking-wider">
                  Structure Template
                </h4>
                <p className="text-xs text-[#888]">
                  Category <strong className="text-white">{currentTemplate.name}</strong> will pre-fill attribute infoboxes and recipe grids automatically.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between bg-[#0c0c0c] p-2.5 rounded-lg border border-[#2a2a2a]">
                <div className="flex items-center gap-2">
                  <span className="text-sky-400 font-bold">WikiPageBuilder JSON Schema</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-sky-500/20 text-sky-300 rounded">v1.4.0</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLoadSampleJSON}
                    className="px-2.5 py-1 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-sky-400 rounded border border-sky-500/30 flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Load Default JSON Template</span>
                  </button>
                  <button
                    onClick={handleApplyJSON}
                    className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded border border-emerald-500/40 flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Parse & Apply JSON</span>
                  </button>
                </div>
              </div>

              {jsonError && (
                <div className="p-2 bg-rose-500/20 border border-rose-500/40 rounded text-rose-300 text-xs font-sans">
                  {jsonError}
                </div>
              )}

              <textarea
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  setJsonError(null);
                }}
                rows={14}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl p-3 text-sky-300 focus:outline-none focus:border-sky-500 font-mono text-xs leading-relaxed resize-none shadow-inner"
                placeholder="Paste or modify WikiPage JSON template here..."
              />
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-4">
                <div className="bg-[#0c0c0c] p-4 rounded-xl border border-[#2a2a2a]">
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono rounded border border-emerald-500/20 capitalize">
                    {currentPreviewPage.category}
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1 uppercase tracking-tight">
                    {currentPreviewPage.title}
                  </h3>
                  <p className="text-xs text-[#aaa] mt-2">{currentPreviewPage.description}</p>
                </div>

                {currentPreviewPage.recipes && currentPreviewPage.recipes.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-emerald-400 uppercase mb-2">
                      Crafting Recipe
                    </h4>
                    <CraftingGrid recipe={currentPreviewPage.recipes[0]} />
                  </div>
                )}
              </div>

              <div>
                <Infobox page={currentPreviewPage} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0c0c0c] border-t border-[#2a2a2a] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] text-[#aaa] rounded-lg text-xs font-semibold border border-[#333]"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className={`px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              savedSuccess
                ? 'bg-emerald-600 text-black font-bold'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black font-bold'
            }`}
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Page Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Add to Wiki</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
