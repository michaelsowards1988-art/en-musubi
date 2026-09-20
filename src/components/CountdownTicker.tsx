'use client';

import { useState, useEffect, useMemo } from 'react';
import { Timer } from 'lucide-react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownTickerProps {
  lang: 'en' | 'ja';
}

export default function CountdownTicker({ lang }: CountdownTickerProps) {
  const targetDate = useMemo(() => new Date('2026-12-15T00:00:00'), []);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    function calculateTime() {
      const difference = targetDate.getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    }

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="w-full max-w-4xl rounded-2xl bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.5)] mb-6 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-5">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-stone-900/50 border border-stone-800/50 text-amber-600/80 shadow-inner shrink-0">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-light tracking-wide text-stone-100">
              {lang === 'ja' ? '次の目標期間' : 'Next Window Target'}
            </h2>
            <p className="text-xs text-stone-400 font-mono mt-0.5">
              {lang === 'ja' ? '年末の訪問' : 'End-of-Year Visit'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 md:flex items-center gap-2 md:gap-3 font-mono text-xs w-full md:w-auto">
          <div className="text-center px-2 md:px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-center">
            <span className="text-base font-semibold text-stone-100">{timeLeft.days}</span>
            <span className="block text-[10px] text-stone-500 uppercase mt-0.5">{lang === 'ja' ? '日' : 'Days'}</span>
          </div>
          <div className="text-center px-2 md:px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-center">
            <span className="text-base font-semibold text-stone-100">{timeLeft.hours}</span>
            <span className="block text-[10px] text-stone-500 uppercase mt-0.5">{lang === 'ja' ? '時間' : 'Hours'}</span>
          </div>
          <div className="text-center px-2 md:px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-center">
            <span className="text-base font-semibold text-stone-100">{timeLeft.minutes}</span>
            <span className="block text-[10px] text-stone-500 uppercase mt-0.5">{lang === 'ja' ? '分' : 'Mins'}</span>
          </div>
          <div className="text-center px-2 md:px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-center">
            <span className="text-base font-semibold text-stone-100">{timeLeft.seconds}</span>
            <span className="block text-[10px] text-stone-500 uppercase mt-0.5">{lang === 'ja' ? '秒' : 'Secs'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}