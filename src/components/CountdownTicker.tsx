'use client';

import { useState, useEffect, useMemo } from 'react';
import { Timer } from 'lucide-react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTicker() {
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
    <div className="w-full max-w-4xl p-5 rounded-2xl bg-zinc-950 text-zinc-100 border border-zinc-800 shadow-2xl flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-purple-400">
          <Timer className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400">Next Window Target</h3>
          <p className="text-sm font-medium text-zinc-200">End-of-Year Visit</p>
        </div>
      </div>

      <div className="flex items-center gap-3 font-mono text-xs">
        <div className="text-center px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800/80">
          <span className="text-sm font-semibold text-zinc-100">{timeLeft.days}</span>
          <span className="block text-[10px] text-zinc-500 uppercase">Days</span>
        </div>
        <div className="text-center px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800/80">
          <span className="text-sm font-semibold text-zinc-100">{timeLeft.hours}</span>
          <span className="block text-[10px] text-zinc-500 uppercase">Hours</span>
        </div>
        <div className="text-center px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800/80">
          <span className="text-sm font-semibold text-zinc-100">{timeLeft.minutes}</span>
          <span className="block text-[10px] text-zinc-500 uppercase">Mins</span>
        </div>
        <div className="text-center px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800/80">
          <span className="text-sm font-semibold text-zinc-100">{timeLeft.seconds}</span>
          <span className="block text-[10px] text-zinc-500 uppercase">Secs</span>
        </div>
      </div>
    </div>
  );
}