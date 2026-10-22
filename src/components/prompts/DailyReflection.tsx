'use client';

import { useState, useEffect } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Loader2, Quote, RotateCcw } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import { supabase } from '@/lib/supabase';
import ReactionThread, { ThreadComment } from '@/components/shared/ReactionThread';

interface ReflectionRecord {
  id: string;
  month_day: string;
  title_en: string;
  title_ja: string;
  quote_en: string;
  quote_ja: string;
  author_en: string;
  author_ja: string;
  reflection_en: string;
  reflection_ja: string;
  hearted_by: string[] | null;
  comments: ThreadComment[] | null;
}

interface DailyReflectionProps {
  lang: 'en' | 'ja';
  currentUser: 'Michael' | 'Tamae';
}

const generateId = () => Date.now().toString();
const getNowIso = () => new Date().toISOString();

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function DailyReflection({ lang, currentUser }: DailyReflectionProps) {
  const [reflections, setReflections] = useState<ReflectionRecord[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [todayIndex, setTodayIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    // Anchor today's MM-DD to Asia/Tokyo so both Kanagawa & Texas unlock the new reflection together
    const todayJstMmDd = formatInTimeZone(new Date(), 'Asia/Tokyo', 'MM-dd');

    async function fetchReflections() {
      const { data, error } = await supabase
        .from('daily_reflections')
        .select('*')
        .order('month_day', { ascending: true });

      if (isMounted) {
        if (!error && data && data.length > 0) {
          const allData = data as ReflectionRecord[];
          // Lock future dates: only allow viewing reflections up to today's JST date
          const unlocked = allData.filter((r) => r.month_day <= todayJstMmDd);
          const visibleList = unlocked.length > 0 ? unlocked : [allData[0]];

          setReflections(visibleList);

          const latestIdx = visibleList.length - 1;
          setTodayIndex(latestIdx);
          setCurrentIndex(latestIdx);
        }
        setLoading(false);
      }
    }

    fetchReflections();

    const channel = supabase
      .channel('public:daily_reflections')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_reflections' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setReflections((prev) =>
              prev.map((r) => (r.id === payload.new.id ? (payload.new as ReflectionRecord) : r))
            );
          } else if (payload.eventType === 'INSERT') {
            const newRec = payload.new as ReflectionRecord;
            if (newRec.month_day <= todayJstMmDd) {
              setReflections((prev) =>
                [...prev.filter((r) => r.id !== newRec.id), newRec].sort((a, b) =>
                  a.month_day.localeCompare(b.month_day)
                )
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-4xl p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-center font-mono text-xs text-stone-500">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Syncing Daily Reflection...
      </div>
    );
  }

  if (reflections.length === 0) return null;

  const current = reflections[currentIndex] || reflections[todayIndex] || reflections[0];
  const isViewingToday = currentIndex === todayIndex;
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < todayIndex;

  const formatMmDdLabel = (mmDd: string) => {
    const [mStr, dStr] = mmDd.split('-');
    const m = parseInt(mStr, 10);
    const d = parseInt(dStr, 10);
    if (lang === 'ja') return `${m}月${d}日`;
    return `${MONTH_NAMES_EN[m - 1] || mStr} ${d}`;
  };

  const toggleHeart = async () => {
    const currentHearts = current.hearted_by || [];
    const newHearts = currentHearts.includes(currentUser)
      ? currentHearts.filter((u) => u !== currentUser)
      : [...currentHearts, currentUser];

    setReflections((prev) =>
      prev.map((r) => (r.id === current.id ? { ...r, hearted_by: newHearts } : r))
    );
    await supabase.from('daily_reflections').update({ hearted_by: newHearts }).eq('id', current.id);
  };

  const postReply = async (content: string) => {
    const author = currentUser === 'Michael' ? 'Texas' : 'Kanagawa';
    const newComment: ThreadComment = {
      id: generateId(),
      author,
      content,
      created_at: getNowIso(),
    };
    const newComments = [...(current.comments || []), newComment];

    setReflections((prev) =>
      prev.map((r) => (r.id === current.id ? { ...r, comments: newComments } : r))
    );
    await supabase.from('daily_reflections').update({ comments: newComments }).eq('id', current.id);
  };

  return (
    <div className="w-full max-w-4xl rounded-2xl bg-zinc-950/80 backdrop-blur-xl border border-stone-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden relative transition-all">
      <div className="p-6 md:p-8">
        {/* Top Bar: Label & Past-Only Day Navigation */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-stone-900/60 border border-stone-800/60 text-amber-500/90 shadow-inner">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-amber-500/90 font-semibold">
                {lang === 'ja' ? '日々の思索' : 'Daily Reflection'}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[11px] font-mono text-stone-400">
                  {formatMmDdLabel(current.month_day)}
                </p>
                {isViewingToday && (
                  <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-900/40">
                    {lang === 'ja' ? '今日' : 'Today'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!isViewingToday && (
              <button
                type="button"
                onClick={() => setCurrentIndex(todayIndex)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/50 text-[10px] font-mono uppercase tracking-wider text-amber-400 hover:bg-amber-900/50 transition-all cursor-pointer mr-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{lang === 'ja' ? '今日に戻る' : 'Today'}</span>
              </button>
            )}

            <button
              type="button"
              disabled={!canGoBack}
              onClick={() => canGoBack && setCurrentIndex((prev) => prev - 1)}
              title={lang === 'ja' ? '前の日' : 'Previous Day'}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={!canGoForward}
              onClick={() => canGoForward && setCurrentIndex((prev) => prev + 1)}
              title={
                canGoForward
                  ? lang === 'ja'
                    ? '次の日'
                    : 'Next Day'
                  : lang === 'ja'
                    ? '明日の思索はJST午前0時に解放されます'
                    : 'Tomorrow unlocks at midnight JST'
              }
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-lg md:text-xl font-medium text-stone-100 tracking-wide mb-4">
          {lang === 'ja' ? current.title_ja : current.title_en}
        </h2>

        {/* Stoic / Literary Quote Callout */}
        <div className="relative p-4 md:p-5 rounded-xl bg-zinc-900/50 border-l-2 border-amber-600/70 mb-5">
          <Quote className="w-4 h-4 text-amber-600/30 absolute top-3 right-3 pointer-events-none" />
          <p className="text-sm md:text-base italic text-stone-200 leading-relaxed font-serif">
            &ldquo;{lang === 'ja' ? current.quote_ja : current.quote_en}&rdquo;
          </p>
          <span className="block text-[11px] font-mono text-amber-500/80 uppercase tracking-wider mt-2">
            — {lang === 'ja' ? current.author_ja : current.author_en}
          </span>
        </div>

        {/* Daily Meditation / Thought Body */}
        <p className="text-sm text-stone-300 leading-relaxed whitespace-pre-wrap">
          {lang === 'ja' ? current.reflection_ja : current.reflection_en}
        </p>

        {/* Shared Reactions & Comment Thread */}
        <div className="mt-5 pt-4 border-t border-zinc-800/50">
          <ReactionThread
            currentUser={currentUser}
            heartedBy={current.hearted_by || []}
            comments={current.comments || []}
            onToggleHeart={toggleHeart}
            onAddComment={postReply}
          />
        </div>
      </div>
    </div>
  );
}