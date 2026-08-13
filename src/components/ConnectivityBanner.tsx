import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const ConnectivityBanner: React.FC = () => {
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleWarning = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setWarningMessage(detail?.message || "Can't reach the server — some features may be unavailable");
    };

    window.addEventListener('wiki_connectivity_warning', handleWarning);
    return () => window.removeEventListener('wiki_connectivity_warning', handleWarning);
  }, []);

  if (!warningMessage) return null;

  return (
    <aside
      id="connectivity-warning-banner"
      role="alert"
      className="bg-amber-950/90 border-b border-amber-500/40 px-4 py-2 text-amber-200 text-xs flex items-center justify-between shadow-md sticky top-0 z-50 backdrop-blur"
    >
      <div className="flex items-center gap-2 max-w-7xl mx-auto flex-1">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="font-medium">{warningMessage}</span>
      </div>
      <button
        id="dismiss-connectivity-banner-btn"
        onClick={() => setWarningMessage(null)}
        className="p-1 text-amber-400 hover:text-amber-100 hover:bg-amber-800/40 rounded transition cursor-pointer shrink-0 ml-2"
        aria-label="Dismiss warning"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </aside>
  );
};
