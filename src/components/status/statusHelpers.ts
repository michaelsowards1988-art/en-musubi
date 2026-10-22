import {
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudFog,
} from 'lucide-react';

export interface Holiday {
  date: string;
  name: string;
  localName: string;
}

export interface Drop {
  id: string;
  target_user: string;
  emoji: string;
}

export interface WeatherState {
  tempC: number | null;
  code: number | null;
  isDay: boolean | null;
}

export const KISS_CONFETTI = Array.from({ length: 24 }).map((_, i) => {
  const angle = i * 15 * (Math.PI / 180);
  const distance = 65 + ((i * 29) % 95);
  return {
    tx: Math.round(Math.cos(angle) * distance),
    ty: Math.round(Math.sin(angle) * distance - 20),
    rot: ((i * 47) % 90) - 45,
    delay: (i % 8) * 0.09,
    scale: 0.75 + (i % 4) * 0.25,
    char: i % 4 === 0 ? '✨' : '💋',
  };
});

export const HOLIDAY_INFO: Record<string, { en: string; ja: string }> = {
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
  "Christmas Day": { en: "Celebrating the birth of Jesus Christ.", ja: "イエス・キリストの降誕を祝う日。" },
};

export const getMoonPhase = (date: Date) => {
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

export const getWeatherInfo = (code: number | null, isDay: boolean, lang: 'en' | 'ja') => {
  if (code === null) return { Icon: Cloud, text: lang === 'ja' ? '取得中...' : 'Loading...' };
  if (code === 0) return { Icon: isDay ? Sun : Moon, text: lang === 'ja' ? '快晴' : 'Clear' };
  if (code <= 3) return { Icon: Cloud, text: lang === 'ja' ? '曇り' : 'Cloudy' };
  if (code === 45 || code === 48) return { Icon: CloudFog, text: lang === 'ja' ? '霧' : 'Fog' };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { Icon: CloudRain, text: lang === 'ja' ? '雨' : 'Rain' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { Icon: CloudSnow, text: lang === 'ja' ? '雪' : 'Snow' };
  if (code >= 95) return { Icon: CloudLightning, text: lang === 'ja' ? '雷雨' : 'Storm' };
  return { Icon: Cloud, text: lang === 'ja' ? '不明' : 'Unknown' };
};

export const formatTemp = (tempC: number | null) => {
  if (tempC === null) return '--';
  const tempF = (tempC * 9) / 5 + 32;
  return `${Math.round(tempC)}°C / ${Math.round(tempF)}°F`;
};