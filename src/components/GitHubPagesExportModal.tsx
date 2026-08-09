import React, { useState } from 'react';
import { WikiPage } from '../types/wiki';
import { X, Download, Check, Copy, Globe, FileCode } from 'lucide-react';

interface GitHubPagesExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: WikiPage[];
}

export const GitHubPagesExportModal: React.FC<GitHubPagesExportModalProps> = ({
  isOpen,
  onClose,
  pages,
}) => {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleExportAll = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(pages, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `wiki-pages-export-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const copyToClipboard = (text: string, stepIndex: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepIndex);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const gitCommands = `git init
git add .
git commit -m "Deploy Addon Wiki Knowledge Base to GitHub Pages"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main`;

  const actionWorkflow = `name: Deploy Wiki to GitHub Pages

on:
  push:
    branches: ["main"]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Environment
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm ci
      - name: Build static site
        run: npm run build
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md font-sans">
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#e0e0e0]">
        {/* Header */}
        <div className="p-4 bg-[#0c0c0c] border-b border-[#2a2a2a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 rounded border border-emerald-500/20 text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base sm:text-lg uppercase tracking-tight">
                Static Deployment to GitHub Pages
              </h2>
              <p className="text-xs text-[#888]">
                Host your Minecraft Addon Wiki free of charge
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

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Quick Download Bundle */}
          <div className="p-4 bg-[#0c0c0c] rounded border border-[#2a2a2a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-emerald-400 text-sm flex items-center gap-1.5 uppercase font-mono">
                <FileCode className="w-4 h-4 text-emerald-400" />
                Complete Data Bundle ({pages.length} Pages)
              </h3>
              <p className="text-[#888] text-xs mt-0.5">
                Download all articles, recipes, and infobox definitions as a static JSON file.
              </p>
            </div>
            <button
              onClick={handleExportAll}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded text-xs flex items-center justify-center gap-2 shrink-0 transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)]"
            >
              <Download className="w-4 h-4" />
              <span>Download wiki-pages.json</span>
            </button>
          </div>

          {/* Steps list */}
          <div className="space-y-4">
            <h3 className="font-bold text-white text-xs font-mono uppercase tracking-wider">
              Deployment Instructions:
            </h3>

            {/* Step 1 */}
            <div className="p-3 bg-[#0c0c0c] rounded border border-[#2a2a2a] space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-emerald-400 text-xs font-mono">
                  1. Git Commands to Push Repository
                </span>
                <button
                  onClick={() => copyToClipboard(gitCommands, 1)}
                  className="px-2 py-1 bg-[#1a1a1a] hover:bg-[#222] text-[#aaa] rounded text-xs flex items-center gap-1 border border-[#333]"
                >
                  {copiedStep === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedStep === 1 ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-2.5 bg-[#141414] rounded border border-[#222] font-mono text-xs text-[#ccc] overflow-x-auto">
                {gitCommands}
              </pre>
            </div>

            {/* Step 2 */}
            <div className="p-3 bg-[#0c0c0c] rounded border border-[#2a2a2a] space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-emerald-400 text-xs font-mono">
                  2. GitHub Actions Workflow File (.github/workflows/deploy.yml)
                </span>
                <button
                  onClick={() => copyToClipboard(actionWorkflow, 2)}
                  className="px-2 py-1 bg-[#1a1a1a] hover:bg-[#222] text-[#aaa] rounded text-xs flex items-center gap-1 border border-[#333]"
                >
                  {copiedStep === 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedStep === 2 ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-2.5 bg-[#141414] rounded border border-[#222] font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-40">
                {actionWorkflow}
              </pre>
            </div>

            {/* Step 3 */}
            <div className="p-3 bg-[#0c0c0c] rounded border border-[#2a2a2a] space-y-1">
              <h4 className="font-bold text-white text-xs font-mono">
                3. Enable GitHub Pages Source
              </h4>
              <p className="text-[#aaa] text-xs">
                In your repository settings, navigate to <strong>Settings &gt; Pages</strong> and set the Build and deployment Source to <strong>GitHub Actions</strong>. Your wiki will be published live at <code className="text-emerald-400">https://your-username.github.io/your-repo/</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0c0c0c] border-t border-[#2a2a2a] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#1a1a1a] hover:bg-[#252525] text-white border border-[#333] rounded text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
