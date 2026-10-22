'use client';

import React from 'react';
import { Sun, Moon, Thermometer } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import { enUS, ja } from 'date-fns/locale';
import { SanctuaryDropMenu } from '@/components/status/SanctuaryDropMenu';
import DropItemButton from '@/components/status/DropItemButton';
import {
  Drop,
  Holiday,
  WeatherState,
  HOLIDAY_INFO,
  KISS_CONFETTI,
  getWeatherInfo,
  formatTemp,
} from '@/components/status/statusHelpers';

interface LocationCardProps {
  lang: 'en' | 'ja';
  now: Date;
  titleLabel: string;
  timezone: string;
  weather: WeatherState;
  holidays: Holiday[];
  isPartnerCard: boolean;
  partnerActiveDrops: string[];
  myDrops: Drop[];
  burstingIds: string[];
  otsukaresamaBurst: number | null;
  kissCelebrationKey: number | null;
  onSendDrop: (emoji: string) => void;
  onTriggerKissBurst: () => void;
  onConsumeDrop: (drop: Drop) => void;
}

export default function LocationCard({
  lang,
  now,
  titleLabel,
  timezone,
  weather,
  holidays,
  isPartnerCard,
  partnerActiveDrops,
  myDrops,
  burstingIds,
  otsukaresamaBurst,
  kissCelebrationKey,
  onSendDrop,
  onTriggerKissBurst,
  onConsumeDrop,
}: LocationCardProps) {
  const localHour = parseInt(formatInTimeZone(now, timezone, 'H'), 10);
  const isDay = weather.isDay !== null ? weather.isDay : localHour >= 6 && localHour < 19;
  const weatherDetails = getWeatherInfo(weather.code, isDay, lang);

  const locale = lang === 'ja' ? ja : enUS;
  const formatStr = lang === 'ja' ? 'M月d日 (EEEE)' : 'EEEE, MMM d';
  const formattedDate = formatInTimeZone(now, timezone, formatStr, { locale });
  const dateStr = formatInTimeZone(now, timezone, 'yyyy-MM-dd');

  const todayHoliday = holidays.find((h) => h.date === dateStr);
  const displayHoliday = todayHoliday
    ? lang === 'ja'
      ? todayHoliday.name === "New Year's Day"
        ? '元日'
        : todayHoliday.localName
      : todayHoliday.name
    : null;
  const holidayDesc = todayHoliday ? HOLIDAY_INFO[todayHoliday.name]?.[lang] : null;

  return (
    <div
      className={`relative p-5 md:p-6 rounded-2xl bg-zinc-950/90 border border-zinc-800 backdrop-blur-xl flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.5)] h-full ${
        isPartnerCard ? 'z-30' : 'z-10'
      }`}
    >
      {!isPartnerCard && otsukaresamaBurst && (
        <div
          key={otsukaresamaBurst}
          className="absolute inset-0 z-40 rounded-2xl flex items-center justify-center pointer-events-none"
          style={{ animation: 'otsukaresamaCardDim 3.5s ease-in-out forwards' }}
        >
          <span
            className="text-2xl md:text-3xl text-amber-400 tracking-[0.3em] ml-3"
            style={{
              animation: 'otsukaresamaTextGlow 3.5s ease-in-out forwards',
              fontFamily: '"Shippori Mincho", "Noto Serif JP", serif',
            }}
          >
            お疲れ様
          </span>
        </div>
      )}

      {kissCelebrationKey && (
        <div
          key={kissCelebrationKey}
          className="absolute inset-0 z-40 rounded-2xl flex flex-col items-center justify-center pointer-events-none overflow-hidden"
          style={{ animation: 'kissCardDim 4.8s ease-in-out forwards' }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            {KISS_CONFETTI.map((p, idx) => (
              <span
                key={idx}
                className="absolute text-xl select-none"
                style={
                  {
                    animation: `kissConfettiFly 4.4s cubic-bezier(0.12, 0.8, 0.25, 1) ${p.delay}s forwards`,
                    '--tx': `${p.tx}px`,
                    '--ty': `${p.ty}px`,
                    '--rot': `${p.rot}deg`,
                    '--sc': p.scale,
                  } as React.CSSProperties
                }
              >
                {p.char}
              </span>
            ))}
          </div>

          <div
            className="relative z-10 flex flex-col items-center"
            style={{
              animation: 'kissTextGlow 4.8s ease-in-out forwards',
              fontFamily: '"Shippori Mincho", "Noto Serif JP", serif',
            }}
          >
            <span className="text-2xl md:text-3xl text-rose-400 tracking-[0.2em] ml-2 font-semibold">
              {lang === 'ja' ? 'ちゅっ！💋' : 'Muah! 💋'}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between w-full relative z-10">
        <div className="flex items-start gap-3 md:gap-4 pointer-events-none">
          <div
            className={`p-3 rounded-xl border shadow-inner mt-1 shrink-0 ${
              isDay
                ? 'bg-amber-950/30 border-amber-800/50 text-amber-400'
                : 'bg-blue-950/30 border-blue-800/50 text-blue-400'
            }`}
          >
            {isDay ? <Sun className="w-5 h-5 md:w-6 md:h-6" /> : <Moon className="w-5 h-5 md:w-6 md:h-6" />}
          </div>
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h4 className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-zinc-300 font-semibold">
                {titleLabel}
              </h4>
              <span className="text-[10px] md:text-xs font-mono text-zinc-400 flex items-center gap-1 whitespace-nowrap">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" /> {formatTemp(weather.tempC)}
              </span>
            </div>
            <p className="text-base md:text-lg font-semibold text-zinc-100 mt-1 font-mono whitespace-nowrap">
              {formatInTimeZone(now, timezone, 'h:mm:ss a')}
            </p>
            <div className="mt-0.5">
              <span className="text-xs md:text-sm text-zinc-300 font-mono block whitespace-nowrap">
                {formattedDate}
              </span>
              {displayHoliday && (
                <div className="mt-2.5 pointer-events-auto">
                  <span className="w-max px-2 py-0.5 rounded text-[9px] font-mono tracking-widest uppercase bg-amber-950/30 text-amber-500/90 border border-amber-900/30 block">
                    ★ {displayHoliday}
                  </span>
                  {holidayDesc && (
                    <span className="block mt-1.5 text-[10px] font-mono text-stone-500 leading-snug pr-4">
                      {holidayDesc}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0 ml-4 relative z-20">
          <div className="flex items-center justify-end gap-2 shrink-0">
            {isPartnerCard && (
              <SanctuaryDropMenu
                lang={lang}
                activeDrops={partnerActiveDrops}
                onToggleDrop={onSendDrop}
                onTriggerKissBurst={onTriggerKissBurst}
              />
            )}
            <span className="text-[10px] md:text-xs font-mono px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 shrink-0">
              {isDay ? (lang === 'ja' ? '昼' : 'Daytime') : lang === 'ja' ? '夜' : 'Night'}
            </span>
          </div>
          <span className="text-[10px] md:text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5 whitespace-nowrap shrink-0">
            <weatherDetails.Icon className="w-3.5 h-3.5 shrink-0" /> {weatherDetails.text}
          </span>
        </div>
      </div>

      {!isPartnerCard && myDrops.length > 0 && (
        <div className="flex flex-wrap justify-end gap-1.5 mt-4 pt-3 border-t border-zinc-800/40 w-full relative z-10">
          {myDrops.map((drop, idx) => (
            <DropItemButton
              key={drop.id}
              drop={drop}
              index={idx}
              isBursting={burstingIds.includes(drop.id)}
              onConsume={onConsumeDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
}