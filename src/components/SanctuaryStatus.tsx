'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';

export default function SanctuaryStatus() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const texasHour = parseInt(formatInTimeZone(now, 'America/Chicago', 'H'), 10);
  const japanHour = parseInt(formatInTimeZone(now, 'Asia/Tokyo', 'H'), 10);

  const isTexasDay = texasHour >= 6 && texasHour < 20;
  const isJapanDay = japanHour >= 6 && japanHour < 20;

  return (
    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Texas Status */}
      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${isTexasDay ? 'bg-amber-950/20 border-amber-800/40 text-amber-400' : 'bg-blue-950/20 border-blue-800/40 text-blue-400'}`}>
            {isTexasDay ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400">Texas (CDT)</h4>
            <p className="text-sm font-medium text-zinc-200">
              {formatInTimeZone(now, 'America/Chicago', 'h:mm:ss a')}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
          {isTexasDay ? 'Daytime' : 'Night'}
        </span>
      </div>

      {/* Kanagawa Status */}
      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${isJapanDay ? 'bg-amber-950/20 border-amber-800/40 text-amber-400' : 'bg-blue-950/20 border-blue-800/40 text-blue-400'}`}>
            {isJapanDay ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400">Kanagawa (JST)</h4>
            <p className="text-sm font-medium text-zinc-200">
              {formatInTimeZone(now, 'Asia/Tokyo', 'h:mm:ss a')}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
          {isJapanDay ? 'Daytime' : 'Night'}
        </span>
      </div>
    </div>
  );
}