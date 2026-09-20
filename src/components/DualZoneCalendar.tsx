'use client';

import { useState } from 'react';
import { format, addHours, startOfDay } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { Clock, MapPin } from 'lucide-react';

const TIMEZONES = {
  texas: 'America/Chicago',
  japan: 'Asia/Tokyo',
};

export default function DualZoneCalendar() {
  const [baseDate, setBaseDate] = useState(new Date());
  const timeBlocks = Array.from({ length: 12 }).map((_, i) => addHours(startOfDay(baseDate), i + 8));

  return (
    <div className="w-full max-w-4xl p-6 rounded-2xl bg-zinc-950 text-zinc-100 border border-zinc-800 shadow-2xl">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800/50">
        <div>
          <h2 className="text-xl font-light tracking-wide text-zinc-200">Schedule Sync</h2>
          <p className="text-sm text-zinc-500 mt-1">Coordinating CDT & JST</p>
        </div>
        <Clock className="w-5 h-5 text-zinc-600" />
      </div>

      <div className="grid grid-cols-2 gap-8 relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-800/50 -translate-x-1/2"></div>

        {/* Texas Column */}
        <div className="space-y-4 pr-4">
          <div className="flex items-center gap-2 mb-6 text-zinc-400">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium tracking-widest uppercase">Texas (CDT)</span>
          </div>
          
          {timeBlocks.map((time, idx) => (
            <div key={`tx-${idx}`} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/30 hover:border-zinc-700 transition-colors">
              <span className="text-zinc-300 font-mono text-sm">
                {formatInTimeZone(time, TIMEZONES.texas, 'h:mm a')}
              </span>
              <span className="text-xs text-zinc-500">
                {formatInTimeZone(time, TIMEZONES.texas, 'MMM d')}
              </span>
            </div>
          ))}
        </div>

        {/* Japan Column */}
        <div className="space-y-4 pl-4">
          <div className="flex items-center gap-2 mb-6 text-zinc-400">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium tracking-widest uppercase">Japan (JST)</span>
          </div>

          {timeBlocks.map((time, idx) => {
            const jstHour = parseInt(formatInTimeZone(time, TIMEZONES.japan, 'H'), 10);
            const isNight = jstHour < 6 || jstHour > 22;
            
            return (
              <div 
                key={`jp-${idx}`} 
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  isNight 
                    ? 'bg-zinc-950 border-zinc-900 text-zinc-600' 
                    : 'bg-zinc-900/50 border-zinc-800/30 hover:border-zinc-700 text-zinc-300'
                }`}
              >
                <span className="font-mono text-sm">
                  {formatInTimeZone(time, TIMEZONES.japan, 'h:mm a')}
                </span>
                <span className="text-xs opacity-70">
                  {formatInTimeZone(time, TIMEZONES.japan, 'MMM d')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}