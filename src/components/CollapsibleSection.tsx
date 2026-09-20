'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function CollapsibleSection({
  title,
  subtitle,
  icon,
  children,
  defaultOpen = true,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="w-full max-w-4xl rounded-2xl bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-all overflow-hidden group">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-6 cursor-pointer select-none hover:bg-zinc-900/30 transition-colors border-b border-zinc-800/40"
      >
        <div className="flex items-center gap-4">
          {/* Muted Stone Background & Warm Amber Icon */}
          <div className="p-2.5 rounded-xl bg-stone-900/50 border border-stone-800/50 text-amber-600/80 shadow-inner">
            {icon}
          </div>
          <div>
            {/* Hover transitions to a soft warm off-white/amber */}
            <h2 className="text-lg font-light tracking-wide text-stone-100 group-hover:text-amber-100/90 transition-colors">{title}</h2>
            <p className="text-xs text-stone-400 font-mono mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="p-6 pt-5 animate-in fade-in duration-300">
          {children}
        </div>
      )}
    </div>
  );
}