import React, { useEffect, useState } from 'react';
import { ExternalLink, Gamepad2, Users, Info, ShieldAlert } from 'lucide-react';

interface AdBannerProps {
  type?: 'inline' | 'sidebar' | 'footer';
  slotId?: string;
  className?: string;
}

interface AdItem {
  id: string;
  isGoogle: boolean;
  title: string;
  description: string;
  tag: string;
  ctaText: string;
  url: string;
  icon?: React.ReactNode;
  bgGradient: string;
  borderColor: string;
  textColor: string;
}

const ADS_INVENTORY: AdItem[] = [
  // 1. Native Addon Ad
  {
    id: 'addon',
    isGoogle: false,
    title: 'Aetheria Addon v1.4.0',
    description: 'Download the official Aetheria Bedrock Addon! Unleash subterranean bosses and resonant ores.',
    tag: 'OFFICIAL DOWNLOAD',
    ctaText: 'Download on MCPEDL',
    url: 'https://mcpedl.com/',
    icon: <Gamepad2 className="w-5 h-5 text-sky-400" />,
    bgGradient: 'from-sky-950/30 via-[#111827]/80 to-[#0b0f19]/90',
    borderColor: 'border-sky-500/20',
    textColor: 'text-sky-400',
  },
  // 2. Native Discord Ad
  {
    id: 'discord',
    isGoogle: false,
    title: 'Join the Etherium Discord',
    description: 'Connect with over 10,000+ players, share your custom setups, and vote on expansion mobs!',
    tag: 'COMMUNITY HUB',
    ctaText: 'Join Discord Server',
    url: 'https://discord.com/',
    icon: <Users className="w-5 h-5 text-[#5865F2]" />,
    bgGradient: 'from-indigo-950/30 via-[#111827]/80 to-[#0b0f19]/90',
    borderColor: 'border-[#5865F2]/20',
    textColor: 'text-indigo-400',
  },
  // 3. Official Google AdSense API Unit
  {
    id: 'google-adsense',
    isGoogle: true,
    title: 'Google AdSense API',
    description: 'google.com, pub-9144292410564162, DIRECT, f08c47fec0942fa0',
    tag: 'ADS BY GOOGLE',
    ctaText: 'Advertisement',
    url: 'https://google.com',
    icon: <Info className="w-5 h-5 text-amber-400" />,
    bgGradient: 'from-slate-950/40 via-[#0b0f19]/90 to-[#070a10]/95',
    borderColor: 'border-amber-500/20',
    textColor: 'text-amber-400',
  }
];

export const AdBanner: React.FC<AdBannerProps> = ({ 
  type = 'inline', 
  slotId = 'default-slot',
  className = '' 
}) => {
  const [hasAd, setHasAd] = useState<boolean | null>(null);
  const [adItem, setAdItem] = useState<AdItem | null>(null);

  // Simulate an ad network lookup that occasionally returns no fill (e.g. 8% chance of empty state)
  useEffect(() => {
    const successRatio = Math.random() > 0.08;
    const timer = setTimeout(() => {
      setHasAd(successRatio);
    }, 120);

    return () => clearTimeout(timer);
  }, [slotId]);

  // Select an ad from the inventory
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * ADS_INVENTORY.length);
    setAdItem(ADS_INVENTORY[randomIndex]);
  }, [type, slotId]);

  // Attempt to load and invoke official Google AdSense scripts if a Google ad is active
  useEffect(() => {
    if (adItem && adItem.isGoogle && hasAd) {
      if (!document.getElementById('adsense-script')) {
        const script = document.createElement('script');
        script.id = 'adsense-script';
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9144292410564162';
        script.async = true;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      }

      const timer = setTimeout(() => {
        try {
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
          console.warn('AdSense push noticed (sandboxed sandbox or multiple SPA views rendering):', e);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [adItem, hasAd]);

  if (hasAd === null || !hasAd || !adItem) {
    // Return null so the reserved space collapses automatically if there is no ad
    return null;
  }

  // Define dimension presets for reserving spaces perfectly
  let sizeClasses = '';
  let isVertical = false;
  let isLeaderboard = false;

  if (type === 'sidebar') {
    sizeClasses = 'w-full max-w-[300px] lg:max-w-[340px] h-[250px] lg:h-[320px]';
    isVertical = true;
  } else if (type === 'footer') {
    sizeClasses = 'w-full max-w-[970px] lg:max-w-[1200px] min-h-[140px] sm:min-h-[110px]';
    isLeaderboard = true;
  } else {
    // inline
    sizeClasses = 'w-full max-w-[728px] lg:max-w-[1000px] min-h-[160px] sm:min-h-[110px]';
  }

  // If the active ad is from Google, we do not show simulated card graphics;
  // we strictly render the official HTML element structure, reserving the precise space for the ad to load.
  if (adItem.isGoogle) {
    return (
      <div className={`mx-auto ${sizeClasses} ${className} flex items-center justify-center overflow-hidden`}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', height: '100%', minHeight: 'inherit' }}
          data-ad-client="ca-pub-9144292410564162"
          data-ad-slot={slotId}
          data-ad-format={type === 'footer' ? 'horizontal' : type === 'sidebar' ? 'vertical' : 'auto'}
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  return (
    <div className={`mx-auto ${sizeClasses} ${className}`}>
      {/* Reserved Space Wrapper */}
      <div className={`w-full h-full relative overflow-hidden rounded-2xl bg-[#090d16] border ${adItem.borderColor} bg-gradient-to-br ${adItem.bgGradient} p-4 sm:py-3.5 sm:px-5 flex flex-col justify-between gap-3 shadow-lg transition-all duration-300`}>
        
        {/* Ad Branding Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/40 pb-2 shrink-0">
          <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded border bg-black/60 text-slate-400 border-slate-800">
            {adItem.tag}
          </span>
          <span className="text-[8px] font-mono text-[#475569] uppercase tracking-widest font-bold">
            SPONSORED
          </span>
        </div>

        {/* Dynamic Inner Layout according to banner type */}
        {isVertical ? (
          /* Sidebar Layout */
          <div className="flex-1 flex flex-col justify-between gap-4 py-1">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl shrink-0">
                  {adItem.icon}
                </div>
                <h4 className="text-xs font-black text-white tracking-tight uppercase leading-tight">
                  {adItem.title}
                </h4>
              </div>
              <p className="text-[11px] text-[#94a3b8] leading-relaxed font-normal">
                {adItem.description}
              </p>
            </div>

            <a
              href={adItem.url}
              target="_blank"
              referrerPolicy="no-referrer"
              rel="noopener noreferrer"
              className={`w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 border ${adItem.borderColor} ${adItem.textColor} text-[10px] font-black rounded-xl flex items-center justify-center gap-1.5 transition-all text-center select-none active:scale-95`}
            >
              <span>{adItem.ctaText}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : isLeaderboard ? (
          /* Footer/Leaderboard Layout */
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-center gap-4 sm:gap-8 max-w-3xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-3.5">
              <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl shrink-0">
                {adItem.icon}
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-white uppercase tracking-tight">
                  {adItem.title}
                </h4>
                <p className="text-[11px] text-[#94a3b8] leading-normal max-w-md hidden sm:block">
                  {adItem.description}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex justify-center">
              <a
                href={adItem.url}
                target="_blank"
                referrerPolicy="no-referrer"
                rel="noopener noreferrer"
                className={`py-1.5 px-3 bg-slate-900 hover:bg-slate-800 border ${adItem.borderColor} ${adItem.textColor} text-[10px] font-black rounded-lg flex items-center justify-center gap-1.5 transition-all select-none active:scale-95`}
              >
                <span className="whitespace-nowrap">{adItem.ctaText}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ) : (
          /* Inline standard layout */
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-center gap-4 sm:gap-8 max-w-3xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-3.5">
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl shrink-0">
                {adItem.icon}
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-white uppercase tracking-tight">
                  {adItem.title}
                </h4>
                <p className="text-[11px] text-[#94a3b8] leading-normal max-w-md">
                  {adItem.description}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex justify-center">
              <a
                href={adItem.url}
                target="_blank"
                referrerPolicy="no-referrer"
                rel="noopener noreferrer"
                className={`w-full sm:w-auto py-2 px-4 bg-slate-900 hover:bg-slate-800 border ${adItem.borderColor} ${adItem.textColor} text-[10px] font-black rounded-xl flex items-center justify-center gap-1.5 transition-all text-center select-none active:scale-95`}
              >
                <span className="whitespace-nowrap">{adItem.ctaText}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
