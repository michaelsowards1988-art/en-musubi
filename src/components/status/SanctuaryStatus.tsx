'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import LocationCard from '@/components/status/LocationCard';
import { Drop, Holiday, WeatherState, getMoonPhase } from '@/components/status/statusHelpers';

interface SanctuaryStatusProps {
  lang: 'en' | 'ja';
  currentUser: 'Michael' | 'Tamae';
}

const getBurstTimestamp = () => Date.now();

export default function SanctuaryStatus({ lang, currentUser }: SanctuaryStatusProps) {
  const [now, setNow] = useState(new Date());
  const [jpWeather, setJpWeather] = useState<WeatherState>({ tempC: null, code: null, isDay: null });
  const [txWeather, setTxWeather] = useState<WeatherState>({ tempC: null, code: null, isDay: null });

  const [jpHolidays, setJpHolidays] = useState<Holiday[]>([]);
  const [txHolidays, setTxHolidays] = useState<Holiday[]>([]);

  const [drops, setDrops] = useState<Drop[]>([]);
  const [burstingIds, setBurstingIds] = useState<string[]>([]);

  const [kissCelebration, setKissCelebration] = useState<{
    key: number;
    cardOwner: 'Michael' | 'Tamae';
  } | null>(null);

  const [otsukaresamaBurst, setOtsukaresamaBurst] = useState<number | null>(null);
  const wasBurstingRef = useRef(false);
  const lastConsumedWasKissRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (burstingIds.length > 0) {
      wasBurstingRef.current = true;
    } else if (burstingIds.length === 0 && wasBurstingRef.current) {
      wasBurstingRef.current = false;
      if (!lastConsumedWasKissRef.current) {
        setOtsukaresamaBurst(getBurstTimestamp());
        setTimeout(() => setOtsukaresamaBurst(null), 4000);
      }
      lastConsumedWasKissRef.current = false;
    }
  }, [burstingIds.length]);

  useEffect(() => {
    let isMounted = true;
    const currentYear = new Date().getFullYear();

    const fetchHolidays = async (countryCode: string) => {
      try {
        const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${currentYear}/${countryCode}`);
        return res.ok ? await res.json() : [];
      } catch {
        return [];
      }
    };

    const fetchDrops = async () => {
      const { data, error } = await supabase.from('drops').select('*');
      if (isMounted && !error && data) setDrops(data);
    };

    Promise.all([
      fetch('https://api.open-meteo.com/v1/forecast?latitude=35.4478&longitude=139.6425&current=temperature_2m,weather_code,is_day').then(
        (r) => r.json()
      ),
      fetch('https://api.open-meteo.com/v1/forecast?latitude=32.5896&longitude=-95.1972&current=temperature_2m,weather_code,is_day').then(
        (r) => r.json()
      ),
      fetchHolidays('JP'),
      fetchHolidays('US'),
      fetchDrops(),
    ])
      .then(([jpData, txData, jpD, txD]) => {
        if (jpData?.current && isMounted) {
          setJpWeather({
            tempC: jpData.current.temperature_2m,
            code: jpData.current.weather_code,
            isDay: jpData.current.is_day === 1,
          });
        }
        if (txData?.current && isMounted) {
          setTxWeather({
            tempC: txData.current.temperature_2m,
            code: txData.current.weather_code,
            isDay: txData.current.is_day === 1,
          });
        }
        if (isMounted) {
          setJpHolidays(jpD);
          setTxHolidays(txD);
        }
      })
      .catch(console.error);

    const channel = supabase
      .channel('public:drops')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drops' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setDrops((prev) => [...prev, payload.new as Drop]);
        } else if (payload.eventType === 'DELETE') {
          setDrops((prev) => prev.filter((d) => d.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const targetPartner = currentUser === 'Michael' ? 'Tamae' : 'Michael';
  const partnerActiveDrops = drops
    .filter((d) => d.target_user === targetPartner)
    .map((d) => d.emoji);

  const triggerKissExplosionOnCard = (cardOwner: 'Michael' | 'Tamae') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 80, 40, 80, 120]);
    }
    setKissCelebration({ key: getBurstTimestamp(), cardOwner });
    setTimeout(() => setKissCelebration(null), 5000);
  };

  const handleToggleDropFromPack = async (emoji: string) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
    await supabase.from('drops').insert([{ target_user: targetPartner, emoji }]);
  };

  const handleConsumeDrop = async (drop: Drop) => {
    if (burstingIds.includes(drop.id)) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([20, 30, 20]);

    if (drop.emoji === '💋') {
      lastConsumedWasKissRef.current = true;
      triggerKissExplosionOnCard(currentUser);
    }

    setBurstingIds((prev) => [...prev, drop.id]);

    setTimeout(async () => {
      setDrops((prev) => prev.filter((d) => d.id !== drop.id));
      setBurstingIds((prev) => prev.filter((bId) => bId !== drop.id));
      await supabase.from('drops').delete().eq('id', drop.id);
    }, 1500);
  };

  const japanCard = (
    <LocationCard
      key="jp"
      lang={lang}
      now={now}
      titleLabel={lang === 'ja' ? '神奈川 (JST)' : 'Kanagawa (JST)'}
      timezone="Asia/Tokyo"
      weather={jpWeather}
      holidays={jpHolidays}
      isPartnerCard={currentUser !== 'Tamae'}
      partnerActiveDrops={partnerActiveDrops}
      myDrops={drops.filter((d) => d.target_user === 'Tamae')}
      burstingIds={burstingIds}
      otsukaresamaBurst={currentUser === 'Tamae' ? otsukaresamaBurst : null}
      kissCelebrationKey={kissCelebration?.cardOwner === 'Tamae' ? kissCelebration.key : null}
      onSendDrop={handleToggleDropFromPack}
      onTriggerKissBurst={() => triggerKissExplosionOnCard('Tamae')}
      onConsumeDrop={handleConsumeDrop}
    />
  );

  const texasCard = (
    <LocationCard
      key="tx"
      lang={lang}
      now={now}
      titleLabel={lang === 'ja' ? 'テキサス (CDT)' : 'Texas (CDT)'}
      timezone="America/Chicago"
      weather={txWeather}
      holidays={txHolidays}
      isPartnerCard={currentUser !== 'Michael'}
      partnerActiveDrops={partnerActiveDrops}
      myDrops={drops.filter((d) => d.target_user === 'Michael')}
      burstingIds={burstingIds}
      otsukaresamaBurst={currentUser === 'Michael' ? otsukaresamaBurst : null}
      kissCelebrationKey={kissCelebration?.cardOwner === 'Michael' ? kissCelebration.key : null}
      onSendDrop={handleToggleDropFromPack}
      onTriggerKissBurst={() => triggerKissExplosionOnCard('Michael')}
      onConsumeDrop={handleConsumeDrop}
    />
  );

  const moonPhase = getMoonPhase(now);

  return (
    <div className="w-full max-w-4xl flex flex-col gap-4 mb-6 relative">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes dropBurst {
          0% { transform: translate(0, 0) scale(1.2); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
        @keyframes otsukaresamaCardDim {
          0% { background-color: rgba(9, 9, 11, 0); backdrop-filter: blur(0px); opacity: 0; }
          15% { background-color: rgba(9, 9, 11, 0.85); backdrop-filter: blur(4px); opacity: 1; }
          85% { background-color: rgba(9, 9, 11, 0.85); backdrop-filter: blur(4px); opacity: 1; }
          100% { background-color: rgba(9, 9, 11, 0); backdrop-filter: blur(0px); opacity: 0; }
        }
        @keyframes otsukaresamaTextGlow {
          0% { opacity: 0; transform: scale(0.9) translateY(10px); text-shadow: 0 0 0 rgba(245,158,11,0); }
          15% { opacity: 1; transform: scale(1) translateY(0); text-shadow: 0 0 20px rgba(245,158,11,0.6); }
          85% { opacity: 1; transform: scale(1.05) translateY(-5px); text-shadow: 0 0 20px rgba(245,158,11,0.6); }
          100% { opacity: 0; transform: scale(1.1) translateY(-15px); text-shadow: 0 0 0 rgba(245,158,11,0); }
        }
        @keyframes kissCardDim {
          0% { background-color: rgba(24, 9, 14, 0); backdrop-filter: blur(0px); opacity: 0; }
          12% { background-color: rgba(24, 9, 14, 0.9); backdrop-filter: blur(4px); opacity: 1; }
          86% { background-color: rgba(24, 9, 14, 0.9); backdrop-filter: blur(4px); opacity: 1; }
          100% { background-color: rgba(24, 9, 14, 0); backdrop-filter: blur(0px); opacity: 0; }
        }
        @keyframes kissTextGlow {
          0% { opacity: 0; transform: scale(0.85) translateY(12px); text-shadow: 0 0 0 rgba(244,63,94,0); }
          15% { opacity: 1; transform: scale(1.03) translateY(0); text-shadow: 0 0 24px rgba(244,63,94,0.85); }
          85% { opacity: 1; transform: scale(1.08) translateY(-4px); text-shadow: 0 0 28px rgba(244,63,94,0.9); }
          100% { opacity: 0; transform: scale(1.14) translateY(-12px); text-shadow: 0 0 0 rgba(244,63,94,0); }
        }
        @keyframes kissConfettiFly {
          0% { transform: translate(0, 0) scale(0.3) rotate(0deg); opacity: 0; }
          12% { opacity: 1; }
          70% { opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(var(--sc)) rotate(var(--rot)); opacity: 0; }
        }
      `,
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentUser === 'Michael' ? [japanCard, texasCard] : [texasCard, japanCard]}
      </div>

      <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 backdrop-blur-xl flex items-center justify-center gap-2 md:gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-all group overflow-hidden">
        <span className="text-xl drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-transform group-hover:scale-110 shrink-0">
          {moonPhase.emoji}
        </span>
        <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs font-mono tracking-widest uppercase text-stone-400 min-w-0">
          <span className="truncate">{lang === 'ja' ? '同じ月を見上げて' : 'Under the Same Moon'}</span>
          <span className="opacity-30 shrink-0">|</span>
          <span className="text-amber-500/80 whitespace-nowrap shrink-0">
            {lang === 'ja' ? moonPhase.ja : moonPhase.en}
          </span>
        </div>
      </div>
    </div>
  );
}