'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Cloud, Thermometer, CloudRain, CloudLightning, CloudSnow, CloudFog } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import { enUS, ja } from 'date-fns/locale';

interface SanctuaryStatusProps {
  lang: 'en' | 'ja';
  currentUser: 'Michael' | 'Tamae';
}

interface Holiday {
  date: string;
  name: string;
  localName: string;
}

// Cultural Dictionary for Context
const HOLIDAY_INFO: Record<string, { en: string, ja: string }> = {
  "New Year's Day": { en: "Celebrating the start of the new year.", ja: "年の初めを祝う日。" },
  "Coming of Age Day": { en: "Celebrating youth who have reached adulthood.", ja: "新成人を祝い励ます日。" },
  "National Foundation Day": { en: "Reflecting on the nation's founding.", ja: "建国をしのび、国を愛する心を養う日。" },
  "The Emperor's Birthday": { en: "Celebrating the reigning Emperor's birthday.", ja: "天皇の誕生日を祝う日。" },
  "Vernal Equinox Day": { en: "Praising nature and caring for living things.", ja: "自然をたたえ、生物をいつくしむ日。" },
  "Shōwa Day": { en: "Honoring the birthday of former Emperor Showa.", ja: "激動の日々を経て、復興を遂げた昭和の時代を顧みる日。" },
  "Constitution Memorial Day": { en: "Commemorates the 1947 Constitution.", ja: "日本国憲法の施行を記念する日。" },
  "Greenery Day": { en: "A day to commune with nature and be thankful for blessings.", ja: "自然に親しむとともにその恩恵に感謝する日。" },
  "Children's Day": { en: "Celebrating children's personalities and happiness.", ja: "こどもの人格を重んじ、幸福をはかる日。" },
  "Marine Day": { en: "Giving thanks to the ocean's bounty.", ja: "海の恩恵に感謝する日。" },
  "Mountain Day": { en: "Getting familiar with mountains and their blessings.", ja: "山に親しむ機会を得て、山の恩恵に感謝する日。" },
  "Respect for the Aged Day": { en: "Honoring elderly citizens and celebrating longevity.", ja: "長年社会につくしてきた老人を敬愛し、長寿を祝う日。" },
  "Autumnal Equinox Day": { en: "Honoring ancestors and remembering the dead.", ja: "祖先をうやまい、なくなった人々をしのぶ日。" },
  "Sports Day": { en: "Promoting sports and a healthy mind and body.", ja: "スポーツを楽しみ、健康な心身を培う日。" },
  "Culture Day": { en: "Celebrating peace, freedom, and culture.", ja: "自由と平和を愛し、文化をすすめる日。" },
  "Labor Thanksgiving Day": { en: "Commending labor and celebrating production.", ja: "勤労をたつとび、生産を祝い、国民たがいに感謝しあう日。" },
  "Independence Day": { en: "Commemorates the Declaration of Independence in 1776.", ja: "1776年の独立宣言を記念する日。" },
  "Thanksgiving Day": { en: "A national day of giving thanks for the harvest.", ja: "秋の収穫と恩恵に感謝する日。" },
  "Memorial Day": { en: "Honoring military personnel who died in service.", ja: "兵役中に亡くなった人々を追悼する日。" },
  "Labor Day": { en: "Honoring the American labor movement.", ja: "アメリカの労働運動と労働者をたたえる日。" },
  "Veterans Day": { en: "Honoring all military veterans.", ja: "すべての退役軍人をたたえる日。" },
  "Martin Luther King, Jr. Day": { en: "Celebrating the life of the civil rights leader.", ja: "公民権運動の指導者キング牧師をたたえる日。" },
  "Washington's Birthday": { en: "Honoring the first US President.", ja: "初代大統領ワシントンをたたえる日（大統領の日）。" },
  "Juneteenth": { en: "Commemorates the emancipation of enslaved African Americans.", ja: "アフリカ系アメリカ人の奴隷解放を記念する日。" },
  "Columbus Day": { en: "Commemorates the landing of Christopher Columbus in 1492.", ja: "1492年のコロンブスのアメリカ大陸到達を記念する日。" },
  "Christmas Day": { en: "Celebrating the birth of Jesus Christ.", ja: "イエス・キリストの降誕を祝う日。" }
};

// Astronomical calculation of the current moon phase
const getMoonPhase = (date: Date) => {
  const LUNAR_MONTH = 29.53058867;
  const knownNewMoon = new Date('2024-01-11T11:57:00Z').getTime();
  const days = (date.getTime() - knownNewMoon) / 86400000;
  const phase = (days % LUNAR_MONTH) / LUNAR_MONTH;
  const normalizedPhase = phase < 0 ? phase + 1 : phase;

  if (normalizedPhase < 0.03 || normalizedPhase > 0.97) return { emoji: '🌑', en: 'New Moon', ja: '新月' };
  if (normalizedPhase < 0.22) return { emoji: '🌒', en: 'Waxing Crescent', ja: '三日月' };
  if (normalizedPhase < 0.28) return { emoji: '🌓', en: 'First Quarter', ja: '上弦の月' };
  if (normalizedPhase < 0.47) return { emoji: '🌔', en: 'Waxing Gibbous', ja: '十三夜' };
  if (normalizedPhase < 0.53) return { emoji: '🌕', en: 'Full Moon', ja: '満月' };
  if (normalizedPhase < 0.72) return { emoji: '🌖', en: 'Waning Gibbous', ja: '十六夜' };
  if (normalizedPhase < 0.78) return { emoji: '🌗', en: 'Last Quarter', ja: '下弦の月' };
  return { emoji: '🌘', en: 'Waning Crescent', ja: '二十六夜' };
};

export default function SanctuaryStatus({ lang, currentUser }: SanctuaryStatusProps) {
  const [now, setNow] = useState(new Date());
  const [jpWeather, setJpWeather] = useState<{ tempC: number | null, code: number | null, isDay: boolean | null }>({ tempC: null, code: null, isDay: null });
  const [txWeather, setTxWeather] = useState<{ tempC: number | null, code: number | null, isDay: boolean | null }>({ tempC: null, code: null, isDay: null });
  
  const [jpHolidays, setJpHolidays] = useState<Holiday[]>([]);
  const [txHolidays, setTxHolidays] = useState<Holiday[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const currentYear = new Date().getFullYear();

    const fetchHolidays = async (countryCode: string) => {
      try {
        const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${currentYear}/${countryCode}`);
        return res.ok ? await res.json() : [];
      } catch {
        return [];
      }
    };

    Promise.all([
      fetch('https://api.open-meteo.com/v1/forecast?latitude=35.4478&longitude=139.6425&current=temperature_2m,weather_code,is_day').then(r => r.json()),
      fetch('https://api.open-meteo.com/v1/forecast?latitude=32.5896&longitude=-95.1972&current=temperature_2m,weather_code,is_day').then(r => r.json()),
      fetchHolidays('JP'),
      fetchHolidays('US')
    ])
    .then(([jpData, txData, jpD, txD]) => {
      if (jpData?.current) {
        setJpWeather({ tempC: jpData.current.temperature_2m, code: jpData.current.weather_code, isDay: jpData.current.is_day === 1 });
      }
      if (txData?.current) {
        setTxWeather({ tempC: txData.current.temperature_2m, code: txData.current.weather_code, isDay: txData.current.is_day === 1 });
      }
      setJpHolidays(jpD);
      setTxHolidays(txD);
    })
    .catch(console.error);
  }, []);

  const texasHour = parseInt(formatInTimeZone(now, 'America/Chicago', 'H'), 10);
  const japanHour = parseInt(formatInTimeZone(now, 'Asia/Tokyo', 'H'), 10);

  const isTexasDay = txWeather.isDay !== null ? txWeather.isDay : (texasHour >= 6 && texasHour < 19);
  const isJapanDay = jpWeather.isDay !== null ? jpWeather.isDay : (japanHour >= 6 && japanHour < 19);

  const locale = lang === 'ja' ? ja : enUS;
  const formatStr = lang === 'ja' ? 'M月d日 (EEEE)' : 'EEEE, MMM d';
  
  const texasFormattedDate = formatInTimeZone(now, 'America/Chicago', formatStr, { locale });
  const japanFormattedDate = formatInTimeZone(now, 'Asia/Tokyo', formatStr, { locale });

  // Holiday Matchers
  const jpDateStr = formatInTimeZone(now, 'Asia/Tokyo', 'yyyy-MM-dd');
  const txDateStr = formatInTimeZone(now, 'America/Chicago', 'yyyy-MM-dd');
  
  const todayJpHoliday = jpHolidays.find(h => h.date === jpDateStr);
  const todayTxHoliday = txHolidays.find(h => h.date === txDateStr);

  const displayJpHoliday = todayJpHoliday ? (lang === 'ja' ? todayJpHoliday.localName : todayJpHoliday.name) : null;
  const displayTxHoliday = todayTxHoliday ? (lang === 'ja' && todayTxHoliday.name === "New Year's Day" ? '元日' : todayTxHoliday.name) : null;

  // Retrieve descriptions from dictionary, falling back gracefully if not found
  const jpDesc = todayJpHoliday ? HOLIDAY_INFO[todayJpHoliday.name]?.[lang] : null;
  const txDesc = todayTxHoliday ? HOLIDAY_INFO[todayTxHoliday.name]?.[lang] : null;

  const moonPhase = getMoonPhase(now);

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

  const japanCard = (
    <div key="jp" className="p-6 rounded-2xl bg-zinc-950/90 border border-zinc-800 backdrop-blur-xl flex items-start justify-between shadow-[0_8px_30px_rgb(0,0,0,0.5)] h-full">
      <div className="flex items-start gap-4">
        <div className={`p-3.5 rounded-xl border shadow-inner mt-1 ${isJapanDay ? 'bg-amber-950/30 border-amber-800/50 text-amber-400' : 'bg-blue-950/30 border-blue-800/50 text-blue-400'}`}>
          {isJapanDay ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-semibold">{lang === 'ja' ? '神奈川 (JST)' : 'Kanagawa (JST)'}</h4>
            <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" /> {formatTemp(jpWeather.tempC)}
            </span>
          </div>
          <p className="text-lg font-semibold text-zinc-100 mt-1 font-mono">
            {formatInTimeZone(now, 'Asia/Tokyo', 'h:mm:ss a')}
          </p>
          <div className="mt-0.5">
            <span className="text-sm text-zinc-300 font-mono block">{japanFormattedDate}</span>
            {displayJpHoliday && (
              <div className="mt-2.5">
                <span className="w-max px-2 py-0.5 rounded text-[9px] font-mono tracking-widest uppercase bg-amber-950/30 text-amber-500/90 border border-amber-900/30">
                  ★ {displayJpHoliday}
                </span>
                {jpDesc && (
                  <span className="block mt-1.5 text-[10px] font-mono text-stone-500 leading-snug pr-4">
                    {jpDesc}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="text-xs font-mono px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200">
          {isJapanDay ? (lang === 'ja' ? '昼' : 'Daytime') : (lang === 'ja' ? '夜' : 'Night')}
        </span>
        <span className="text-xs text-zinc-400 flex items-center gap-1.5">
          <jpWeatherDetails.Icon className="w-3.5 h-3.5" /> {jpWeatherDetails.text}
        </span>
      </div>
    </div>
  );

  const texasCard = (
    <div key="tx" className="p-6 rounded-2xl bg-zinc-950/90 border border-zinc-800 backdrop-blur-xl flex items-start justify-between shadow-[0_8px_30px_rgb(0,0,0,0.5)] h-full">
      <div className="flex items-start gap-4">
        <div className={`p-3.5 rounded-xl border shadow-inner mt-1 ${isTexasDay ? 'bg-amber-950/30 border-amber-800/50 text-amber-400' : 'bg-blue-950/30 border-blue-800/50 text-blue-400'}`}>
          {isTexasDay ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-semibold">{lang === 'ja' ? 'テキサス (CDT)' : 'Texas (CDT)'}</h4>
            <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" /> {formatTemp(txWeather.tempC)}
            </span>
          </div>
          <p className="text-lg font-semibold text-zinc-100 mt-1 font-mono">
            {formatInTimeZone(now, 'America/Chicago', 'h:mm:ss a')}
          </p>
          <div className="mt-0.5">
            <span className="text-sm text-zinc-300 font-mono block">{texasFormattedDate}</span>
            {displayTxHoliday && (
              <div className="mt-2.5">
                <span className="w-max px-2 py-0.5 rounded text-[9px] font-mono tracking-widest uppercase bg-amber-950/30 text-amber-500/90 border border-amber-900/30">
                  ★ {displayTxHoliday}
                </span>
                {txDesc && (
                  <span className="block mt-1.5 text-[10px] font-mono text-stone-500 leading-snug pr-4">
                    {txDesc}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="text-xs font-mono px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200">
          {isTexasDay ? (lang === 'ja' ? '昼' : 'Daytime') : (lang === 'ja' ? '夜' : 'Night')}
        </span>
        <span className="text-xs text-zinc-400 flex items-center gap-1.5">
          <txWeatherDetails.Icon className="w-3.5 h-3.5" /> {txWeatherDetails.text}
        </span>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl flex flex-col gap-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Partner-First Rendering */}
        {currentUser === 'Michael' ? [japanCard, texasCard] : [texasCard, japanCard]}
      </div>
      
      {/* Under the Same Moon Banner */}
      <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 backdrop-blur-xl flex items-center justify-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-all group">
        <span className="text-xl drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-transform group-hover:scale-110">
          {moonPhase.emoji}
        </span>
        <p className="text-xs font-mono tracking-widest uppercase text-stone-400">
          {lang === 'ja' ? '同じ月を見上げて' : 'Under the Same Moon'}
          <span className="mx-3 opacity-30">|</span>
          <span className="text-amber-500/80">{lang === 'ja' ? moonPhase.ja : moonPhase.en}</span>
        </p>
      </div>
    </div>
  );
}