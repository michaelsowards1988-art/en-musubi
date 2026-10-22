'use client';

import React from 'react';
import { Globe2, Settings } from 'lucide-react';
import { getPersonalAvatarUrl } from '@/lib/utils';

interface DashboardHeaderProps {
  currentUser: 'Michael' | 'Tamae';
  lang: 'en' | 'ja';
  titleText: string;
  langToggleText: string;
  tamaeOnline: boolean;
  michaelOnline: boolean;
  bothOnline: boolean;
  activeFlare: 'Michael' | 'Tamae' | null;
  avatarBust: number;
  onPoke: (target: 'Michael' | 'Tamae') => void;
  onOpenSettings: () => void;
  onToggleLang: () => void;
  onAdminSync: () => void;
  onSetDefaultLang: () => void;
}

export default function DashboardHeader({
  currentUser,
  lang,
  titleText,
  langToggleText,
  tamaeOnline,
  michaelOnline,
  bothOnline,
  activeFlare,
  avatarBust,
  onPoke,
  onOpenSettings,
  onToggleLang,
  onAdminSync,
  onSetDefaultLang,
}: DashboardHeaderProps) {
  return (
    <div className="w-full sticky top-0 z-40 bg-zinc-950/85 backdrop-blur-xl border-b border-zinc-800/60 shadow-[0_10px_30px_rgba(0,0,0,0.5)] pt-6 pb-4 px-6 md:px-16">
      <div className="w-full max-w-4xl mx-auto flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-widest text-stone-100 flex items-center gap-4">
            縁結び
            <div className="flex items-center">
              <div className="relative flex items-center justify-center">
                {activeFlare === 'Tamae' && (
                  <div className="absolute w-11 h-11 rounded-full bg-amber-500 animate-ping opacity-75"></div>
                )}
                <span
                  onClick={() => onPoke('Tamae')}
                  className={`relative z-10 w-11 h-11 rounded-full overflow-hidden border-2 inline-block shrink-0 transition-all duration-700 cursor-pointer ${
                    tamaeOnline && !bothOnline
                      ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-110'
                      : ''
                  } ${
                    bothOnline
                      ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] scale-110'
                      : ''
                  } ${
                    !tamaeOnline && !bothOnline
                      ? 'border-stone-500/40 bg-zinc-900 shadow-md scale-100'
                      : ''
                  } ${
                    bothOnline && currentUser === 'Michael'
                      ? 'hover:border-red-400 hover:scale-110'
                      : ''
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getPersonalAvatarUrl('Tamae', avatarBust)}
                    alt="Tamae"
                    className="w-full h-full object-cover"
                  />
                </span>
              </div>
              <div
                className={`transition-all duration-1000 h-0.5 ${
                  bothOnline
                    ? 'w-8 bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.9)]'
                    : 'w-3 bg-transparent'
                }`}
              ></div>
              <div className="relative flex items-center justify-center">
                {activeFlare === 'Michael' && (
                  <div className="absolute w-11 h-11 rounded-full bg-amber-500 animate-ping opacity-75"></div>
                )}
                <span
                  onClick={() => onPoke('Michael')}
                  className={`relative z-10 w-11 h-11 rounded-full overflow-hidden border-2 inline-block shrink-0 transition-all duration-700 cursor-pointer ${
                    michaelOnline && !bothOnline
                      ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-110'
                      : ''
                  } ${
                    bothOnline
                      ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] scale-110'
                      : ''
                  } ${
                    !michaelOnline && !bothOnline
                      ? 'border-stone-500/40 bg-zinc-900 shadow-md scale-100'
                      : ''
                  } ${
                    bothOnline && currentUser === 'Tamae'
                      ? 'hover:border-red-400 hover:scale-110'
                      : ''
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getPersonalAvatarUrl('Michael', avatarBust)}
                    alt="Michael"
                    className="w-full h-full object-cover"
                  />
                </span>
              </div>
            </div>
          </h1>
          <p className="text-stone-400 text-sm font-mono mt-2 tracking-wider font-medium">
            {titleText}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 mb-1">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleLang}
              className="flex items-center gap-2 text-sm text-stone-300 hover:text-white bg-zinc-900/90 border border-zinc-800 px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Globe2 className="w-4 h-4 text-stone-400" />
              <span className="font-medium">{langToggleText}</span>
            </button>
            <button
              onClick={onOpenSettings}
              title={lang === 'ja' ? 'プロフィール設定' : 'Profile Settings'}
              className="p-2.5 text-stone-400 hover:text-amber-400 bg-zinc-900/90 border border-zinc-800 rounded-xl transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {currentUser === 'Michael' && (
              <button
                onClick={onAdminSync}
                className="text-[10px] text-red-500/70 hover:text-red-400 transition-colors uppercase font-mono tracking-wider cursor-pointer"
              >
                Force Remote Sync
              </button>
            )}
            <button
              onClick={onSetDefaultLang}
              className="text-[10px] text-stone-500 hover:text-stone-300 transition-colors uppercase font-mono tracking-wider cursor-pointer"
            >
              {lang === 'ja' ? 'デフォルトにする' : 'Make Default'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}