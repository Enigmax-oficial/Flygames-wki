import { WikiIcon } from './WikiIcon';
import React, { useState } from 'react';
import { X, FolderCode, Copy, Check, Download, FileJson } from 'lucide-react';
import itemTemplate from '../templates/item-template.json';
import mobTemplate from '../templates/mob-template.json';
import blockTemplate from '../templates/block-template.json';
import recipeTemplate from '../templates/recipe-template.json';
import biomeTemplate from '../templates/biome-template.json';
import guideTemplate from '../templates/guide-template.json';

interface TemplateViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_TEMPLATES_MAP: Record<string, { name: string; icon: string; file: any }> = {
  'item-template.json': { name: 'Item / Equipment', icon: 'items', file: itemTemplate },
  'mob-template.json': { name: 'Mob / Boss', icon: 'mobs', file: mobTemplate },
  'block-template.json': { name: 'Block / Ore', icon: 'blocks', file: blockTemplate },
  'recipe-template.json': { name: 'Crafting Recipe', icon: 'recipes', file: recipeTemplate },
  'biome-template.json': { name: 'Biome / Realm', icon: 'biomes', file: biomeTemplate },
  'guide-template.json': { name: 'Guide / Workflow', icon: 'guides', file: guideTemplate },
};

export const TemplateViewerModal: React.FC<TemplateViewerModalProps> = ({ isOpen, onClose }) => {
  const [selectedFileName, setSelectedFileName] = useState<string>('item-template.json');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentItem = ALL_TEMPLATES_MAP[selectedFileName] || ALL_TEMPLATES_MAP['item-template.json'];
  const jsonString = JSON.stringify(currentItem.file, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonString);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', selectedFileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md font-sans">
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#e0e0e0]">
        {/* Header */}
        <div className="p-4 bg-[#0c0c0c] border-b border-[#2a2a2a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 rounded border border-cyan-500/20 text-cyan-400">
              <FolderCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base sm:text-lg uppercase tracking-tight">
                Template File Explorer (/src/templates)
              </h2>
              <p className="text-xs text-[#888]">
                Static JSON schema templates used for wiki expansion
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded bg-[#1a1a1a] hover:bg-[#252525] text-[#888] hover:text-white border border-[#333]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-full md:w-64 bg-[#0c0c0c] border-b md:border-b-0 md:border-r border-[#2a2a2a] p-3 space-y-1 shrink-0 overflow-y-auto">
            <span className="text-[10px] font-mono text-[#666] uppercase tracking-wider font-bold block mb-2 px-2">
              Directory /src/templates/
            </span>
            {Object.entries(ALL_TEMPLATES_MAP).map(([fileName, data]) => {
              const isSelected = selectedFileName === fileName;
              return (
                <button
                  key={fileName}
                  onClick={() => setSelectedFileName(fileName)}
                  className={`w-full text-left p-2 rounded text-xs flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold'
                      : 'hover:bg-[#1a1a1a] text-[#888] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileJson className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-[#666]'}`} />
                    <span className="truncate">{fileName}</span>
                  </div>
                  <WikiIcon icon={data.icon} className="w-4 h-4 text-sm" />
                </button>
              );
            })}
          </div>

          {/* Editor / Code View */}
          <div className="flex-1 p-4 bg-[#141414] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#2a2a2a]">
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentItem.icon}</span>
                <div>
                  <h3 className="font-bold text-white text-sm">{currentItem.name}</h3>
                  <p className="text-[11px] font-mono text-[#666]">/src/templates/{selectedFileName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] text-[#ccc] rounded text-xs font-semibold flex items-center gap-1.5 border border-[#333]"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded text-xs flex items-center gap-1.5 shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded border border-[#2a2a2a] bg-[#0c0c0c] p-3">
              <pre className="font-mono text-xs text-emerald-400 leading-relaxed">
                {jsonString}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0c0c0c] border-t border-[#2a2a2a] flex justify-between items-center text-xs text-[#666] font-mono">
          <span>Static template files • Addon Schema Specification</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] text-white rounded text-xs font-bold border border-[#333]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
