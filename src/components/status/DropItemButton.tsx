'use client';

import React from 'react';
import { Drop } from '@/components/status/statusHelpers';

interface DropItemButtonProps {
  drop: Drop;
  index: number;
  isBursting: boolean;
  onConsume: (drop: Drop) => void;
}

export default function DropItemButton({
  drop,
  index,
  isBursting,
  onConsume,
}: DropItemButtonProps) {
  let hash = (index + 1) * 137;
  for (let i = 0; i < drop.id.length; i++) {
    hash = (hash * 31 + drop.id.charCodeAt(i)) % 10000;
  }

  const delaySecs = -((hash % 200) / 100);
  const durationSecs = 1.75 + ((hash % 70) / 100);

  return (
    <div
      className={`relative flex items-center justify-center transition-[width] duration-700 ease-in-out overflow-visible ${
        isBursting ? 'w-0 pointer-events-none' : 'w-8 h-8'
      }`}
    >
      <button
        onClick={() => onConsume(drop)}
        style={
          isBursting
            ? undefined
            : {
                animationDelay: `${delaySecs}s`,
                animationDuration: `${durationSecs}s`,
              }
        }
        className={`text-xl transition-all cursor-pointer drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] ${
          isBursting
            ? 'scale-0 opacity-0 duration-1000'
            : 'animate-[bounce_2s_infinite] hover:scale-125 duration-300'
        }`}
      >
        {drop.emoji}
      </button>

      {isBursting && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          {[...Array(12)].map((_, i) => {
            const angle = i * 30 * (Math.PI / 180);
            const distance = 40 + ((i * 7) % 20);
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            return (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 bg-amber-300 rounded-full shadow-[0_0_8px_rgba(252,211,77,1)]"
                style={
                  {
                    animation: `dropBurst 1.5s ease-out forwards`,
                    '--tx': `${x}px`,
                    '--ty': `${y}px`,
                  } as React.CSSProperties
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}