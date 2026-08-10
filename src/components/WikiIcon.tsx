import React from 'react';

export const WikiIcon = ({ icon, className = "w-4 h-4" }: { icon: string | undefined, className?: string }) => {
  if (!icon) return <span className="select-none">📄</span>;
  if (icon.startsWith('http') || icon.startsWith('data:image') || icon.startsWith('/')) {
    return <img src={icon} alt="icon" className={`${className} object-contain`} />;
  }
  return <span className={`select-none shrink-0 ${className.includes('text-') ? className : ''}`}>{icon}</span>;
};
