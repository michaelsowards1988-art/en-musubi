'use client';

import { useState, useEffect, useRef } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { MapPin, Loader2 } from 'lucide-react';
import CollapsibleSection from './CollapsibleSection';

interface DualZoneCalendarProps {
  currentUser: 'Michael' | 'Tamae'; // Kept in interface to satisfy parent types
  lang: 'en' | 'ja';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

const TIMEZONES = {
  texas: 'America/Chicago',
  japan: 'Asia/Tokyo',
};

export default function DualZoneCalendar({ lang, title, subtitle, icon }: DualZoneCalendarProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const currentHourRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Pushing to the next tick avoids the synchronous state update linter error
    setTimeout(() => setMounted(true), 0);
  }, []);

  // Auto-scroll to the current hour when the section is opened
  useEffect(() => {
    if (isOpen && currentHourRef.current) {
      setTimeout(() => {
        currentHourRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [isOpen]);

  // Generate a full 24-hour window starting from midnight JST today
  const jstDateStr = formatInTimeZone(new Date(), TIMEZONES.japan, 'yyyy-MM-dd');
  const timeBlocks = Array.from({ length: 24 }).map((_, i) => {
    const hour = i.toString().padStart(2, '0');
    return new Date(`${jstDateStr}T${hour}:00:00+09:00`);
  });

  const currentJpHour = parseInt(formatInTimeZone(new Date(), TIMEZONES.japan, 'H'), 10);

  const renderCalendar = () => {
    if (!mounted) {
      return (
        <div className="flex items-center justify-center text-stone-500 font-mono text-xs py-8">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Syncing Timezones...
        </div>
      );
    }

    return (
      <div className="w-full">
        {/* Centered Header Legend */}
        <div className="flex items-center justify-center gap-4 md:gap-8 mb-4 px-2 text-stone-500 font-mono text-[10px] tracking-widest uppercase">
          <div className="flex items-center justify-end gap-1.5 w-28 md:w-32">
            <MapPin className="w-3 h-3" /> 
            {lang === 'ja' ? '神奈川 (JST)' : 'Kanagawa (JST)'}
          </div>
          <div className="w-8 md:w-12"></div> {/* Spacer for the bridge */}
          <div className="flex items-center justify-start gap-1.5 w-28 md:w-32">
            {lang === 'ja' ? 'テキサス (CDT)' : 'Texas (CDT)'} 
            <MapPin className="w-3 h-3" />
          </div>
        </div>
        
        {/* Full Height Timeline Container (No internal scroll) */}
        <div className="space-y-2">
          {timeBlocks.map((time, idx) => {
            const jpHour = parseInt(formatInTimeZone(time, TIMEZONES.japan, 'H'), 10);
            const isCurrentHour = jpHour === currentJpHour;

            return (
              <div 
                key={idx}
                ref={isCurrentHour ? currentHourRef : null}
                className={`relative flex items-center justify-center gap-4 md:gap-8 p-3.5 md:p-4 rounded-xl border transition-all ${
                  isCurrentHour 
                    ? 'ring-1 ring-amber-500/50 bg-zinc-900/80 border-zinc-700/80 shadow-md' 
                    : 'bg-zinc-950/50 border-zinc-800/40 opacity-80 hover:opacity-100 hover:bg-zinc-900/40'
                }`}
              >
                {/* Japan Side (Right-aligned against center) */}
                <div className="flex flex-col text-right w-28 md:w-32">
                  <div className={`font-mono text-xs md:text-sm ${isCurrentHour ? 'text-stone-100 font-bold' : 'text-stone-300'}`}>
                    {formatInTimeZone(time, TIMEZONES.japan, 'h:mm a')}
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                    {formatInTimeZone(time, TIMEZONES.japan, 'MMM d')}
                  </div>
                </div>

                {/* Neutral Connection Bridge */}
                <div className={`w-8 md:w-12 border-t border-dashed ${isCurrentHour ? 'border-amber-700/50' : 'border-zinc-800'}`}></div>

                {/* Texas Side (Left-aligned against center) */}
                <div className="flex flex-col text-left w-28 md:w-32">
                  <div className={`font-mono text-xs md:text-sm ${isCurrentHour ? 'text-stone-100 font-bold' : 'text-stone-300'}`}>
                    {formatInTimeZone(time, TIMEZONES.texas, 'h:mm a')}
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                    {formatInTimeZone(time, TIMEZONES.texas, 'MMM d')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <CollapsibleSection
      title={title}
      subtitle={subtitle}
      icon={icon}
      isControlled={true}
      isOpen={isOpen}
      onToggle={setIsOpen}
    >
      {renderCalendar()}
    </CollapsibleSection>
  );
}