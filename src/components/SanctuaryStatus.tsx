'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Cloud, Thermometer, CloudRain, CloudLightning, CloudSnow, CloudFog } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import { enUS, ja } from 'date-fns/locale';

interface SanctuaryStatusProps {
  lang: 'en' | 'ja';
}

export default function SanctuaryStatus({ lang }: SanctuaryStatusProps) {
  const [now, setNow] = useState(new Date());
  const [jpWeather, setJpWeather] = useState<{ tempC: number | null, code: number | null, isDay: boolean | null }>({ tempC: null, code: null, isDay: null });
  const [txWeather, setTxWeather] = useState<{ tempC: number | null, code: number | null, isDay: boolean | null }>({ tempC: null, code: null, isDay: null });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Fetch live weather + day/night status for Kanagawa (Yokohama) and Texas (Hawkins)
    Promise.all([
      fetch('https://api.open-meteo.com/v1/forecast?latitude=35.4478&longitude=139.6425&current=temperature_2m,weather_code,is_day'),
      fetch('https://api.open-meteo.com/v1/forecast?latitude=32.5896&longitude=-95.1972&current=temperature_2m,weather_code,is_day')
    ])
    .then(async ([jpRes, txRes]) => {
      const jpData = await jpRes.json();
      const txData = await txRes.json();
      setJpWeather({ tempC: jpData.current.temperature_2m, code: jpData.current.weather_code, isDay: jpData.current.is_day === 1 });
      setTxWeather({ tempC: txData.current.temperature_2m, code: txData.current.weather_code, isDay: txData.current.is_day === 1 });
    })
    .catch(console.error);
  }, []);

  const texasHour = parseInt(formatInTimeZone(now, 'America/Chicago', 'H'), 10);
  const japanHour = parseInt(formatInTimeZone(now, 'Asia/Tokyo', 'H'), 10);

  // Use the API's real day/night status, fallback to a safer time window if the API hasn't loaded yet
  const isTexasDay = txWeather.isDay !== null ? txWeather.isDay : (texasHour >= 6 && texasHour < 19);
  const isJapanDay = jpWeather.isDay !== null ? jpWeather.isDay : (japanHour >= 6 && japanHour < 19);

  const locale = lang === 'ja' ? ja : enUS;
  const formatStr = lang === 'ja' ? 'M月d日 (EEEE)' : 'EEEE, MMM d';
  
  const texasFormattedDate = formatInTimeZone(now, 'America/Chicago', formatStr, { locale });
  const japanFormattedDate = formatInTimeZone(now, 'Asia/Tokyo', formatStr, { locale });

  const getWeatherInfo = (code: number | null, isDay: boolean) => {
    if (code === null) return { Icon: Cloud, text: lang === 'ja' ? '取得中...' : 'Loading...' };
    if (code === 0) return { Icon: isDay ? Sun : Moon, text: lang === 'ja' ? '快晴' : 'Clear' };
    if (code <= 3) return { Icon: Cloud, text: lang === 'ja' ? '曇り' : 'Cloudy' };
    if (code === 45 || code === 48) return { Icon: CloudFog, text: lang === 'ja' ? '霧' : 'Fog' };
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { Icon: CloudRain, text: lang === 'ja' ? '雨' : 'Rain' };
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { Icon: CloudSnow, text: lang === 'ja' ? '雪' : 'Snow' };
    if (code >= 95) return { Icon: CloudLightning, text: lang === 'ja' ? '雷雨' : 'Storm' };
    return { Icon: Cloud, text: lang === 'ja' ? '不明' : 'Unknown' };
  };

  const jpWeatherDetails = getWeatherInfo(jpWeather.code, isJapanDay);
  const txWeatherDetails = getWeatherInfo(txWeather.code, isTexasDay);

  const formatTemp = (tempC: number | null) => {
    if (tempC === null) return '--';
    const tempF = (tempC * 9/5) + 32;
    return `${Math.round(tempC)}°C / ${Math.round(tempF)}°F`;
  };

  return (
    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Kanagawa Status (Tamae First) */}
      <div className="p-6 rounded-2xl bg-zinc-950/90 border border-zinc-800 backdrop-blur-xl flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <div className={`p-3.5 rounded-xl border shadow-inner ${isJapanDay ? 'bg-amber-950/30 border-amber-800/50 text-amber-400' : 'bg-blue-950/30 border-blue-800/50 text-blue-400'}`}>
            {isJapanDay ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-semibold">{lang === 'ja' ? '神奈川 (JST)' : 'Kanagawa (JST)'}</h4>
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" /> {formatTemp(jpWeather.tempC)}
              </span>
            </div>
            <p className="text-lg font-semibold text-zinc-100 mt-1 font-mono">
              {formatInTimeZone(now, 'Asia/Tokyo', 'h:mm:ss a')}
            </p>
            <p className="text-sm text-zinc-300 mt-0.5 font-mono">{japanFormattedDate}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-xs font-mono px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200">
            {isJapanDay ? (lang === 'ja' ? '昼' : 'Daytime') : (lang === 'ja' ? '夜' : 'Night')}
          </span>
          <span className="text-xs text-zinc-400 flex items-center gap-1.5">
            <jpWeatherDetails.Icon className="w-3.5 h-3.5" /> {jpWeatherDetails.text}
          </span>
        </div>
      </div>

      {/* Texas Status */}
      <div className="p-6 rounded-2xl bg-zinc-950/90 border border-zinc-800 backdrop-blur-xl flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <div className={`p-3.5 rounded-xl border shadow-inner ${isTexasDay ? 'bg-amber-950/30 border-amber-800/50 text-amber-400' : 'bg-blue-950/30 border-blue-800/50 text-blue-400'}`}>
            {isTexasDay ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-semibold">{lang === 'ja' ? 'テキサス (CDT)' : 'Texas (CDT)'}</h4>
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" /> {formatTemp(txWeather.tempC)}
              </span>
            </div>
            <p className="text-lg font-semibold text-zinc-100 mt-1 font-mono">
              {formatInTimeZone(now, 'America/Chicago', 'h:mm:ss a')}
            </p>
            <p className="text-sm text-zinc-300 mt-0.5 font-mono">{texasFormattedDate}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-xs font-mono px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200">
            {isTexasDay ? (lang === 'ja' ? '昼' : 'Daytime') : (lang === 'ja' ? '夜' : 'Night')}
          </span>
          <span className="text-xs text-zinc-400 flex items-center gap-1.5">
            <txWeatherDetails.Icon className="w-3.5 h-3.5" /> {txWeatherDetails.text}
          </span>
        </div>
      </div>
    </div>
  );
}