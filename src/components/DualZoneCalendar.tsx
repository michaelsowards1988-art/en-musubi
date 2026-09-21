'use client';

import { useState, useEffect } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { MapPin } from 'lucide-react';

const TIMEZONES = {
  texas: 'America/Chicago',
  japan: 'Asia/Tokyo',
};

export default function DualZoneCalendar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Avoid visual flashing and server/client time mismatches
  if (!mounted) return null;

  // 1. Get the current date in Japan (YYYY-MM-DD)
  const jstDateStr = formatInTimeZone(new Date(), TIMEZONES.japan, 'yyyy-MM-dd');
  
  // 2. Generate 12 hourly blocks starting at 8:00 AM JST
  const timeBlocks = Array.from({ length: 12 }).map((_, i) => {
    const hour = (i + 8).toString().padStart(2, '0');
    // The +09:00 forces Javascript to interpret this exact hour as Japan Standard Time
    return new Date(`${jstDateStr}T${hour}:00:00+09:00`);
  });

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-8 relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-800/50 -translate-x-1/2"></div>

        {/* Japan Column (Anchor) */}
        <div className="space-y-4 pr-4">
          <div className="flex items-center gap-2 mb-6 text-zinc-400">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium tracking-widest uppercase">Japan (JST)</span>
          </div>

          {timeBlocks.map((time, idx) => (
            <div 
              key={`jp-${idx}`} 
              className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/30 hover:border-zinc-700 transition-colors text-zinc-300"
            >
              <span className="font-mono text-sm">
                {formatInTimeZone(time, TIMEZONES.japan, 'h:mm a')}
              </span>
              <span className="text-xs opacity-70">
                {formatInTimeZone(time, TIMEZONES.japan, 'MMM d')}
              </span>
            </div>
          ))}
        </div>

        {/* Texas Column (Reactionary) */}
        <div className="space-y-4 pl-4">
          <div className="flex items-center gap-2 mb-6 text-zinc-400">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium tracking-widest uppercase">Texas (CDT)</span>
          </div>
          
          {timeBlocks.map((time, idx) => {
            // Check if Texas is asleep (before 6 AM or after 10 PM)
            const txHour = parseInt(formatInTimeZone(time, TIMEZONES.texas, 'H'), 10);
            const isNight = txHour < 6 || txHour > 22;

            return (
              <div 
                key={`tx-${idx}`} 
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  isNight 
                    ? 'bg-zinc-950 border-zinc-900 text-zinc-600' 
                    : 'bg-zinc-900/50 border-zinc-800/30 hover:border-zinc-700 text-zinc-300'
                }`}
              >
                <span className="font-mono text-sm">
                  {formatInTimeZone(time, TIMEZONES.texas, 'h:mm a')}
                </span>
                <span className="text-xs opacity-70">
                  {formatInTimeZone(time, TIMEZONES.texas, 'MMM d')}
                </span>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}