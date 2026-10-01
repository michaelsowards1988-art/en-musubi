'use client';

import { useState, useEffect } from 'react';
import { Lock, Unlock, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Prompt {
  id: string;
  question_en: string;
  question_ja: string;
  michael_answer: string | null;
  tamae_answer: string | null;
}

interface WeeklyUnlockProps {
  lang: 'en' | 'ja';
  currentUser: 'Michael' | 'Tamae';
}

export default function WeeklyUnlock({ lang, currentUser }: WeeklyUnlockProps) {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [myAnswer, setMyAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchActivePrompt() {
      const { data, error } = await supabase
        .from('weekly_prompts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (isMounted) {
        if (!error && data) setPrompt(data);
        setLoading(false);
      }
    }

    fetchActivePrompt();

    // Listen for real-time un-blurring
    const channel = supabase
      .channel('public:weekly_prompts')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'weekly_prompts' },
        (payload) => {
          setPrompt(payload.new as Prompt);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myAnswer.trim() || !prompt) return;
    setSubmitting(true);

    const updateField = currentUser === 'Michael' ? { michael_answer: myAnswer } : { tamae_answer: myAnswer };

    const { error } = await supabase
      .from('weekly_prompts')
      .update(updateField)
      .eq('id', prompt.id);

    if (!error) {
      setPrompt({ ...prompt, ...updateField });
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 shadow-2xl flex items-center justify-center font-mono text-xs text-stone-500">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Syncing Prompt...
      </div>
    );
  }

  if (!prompt) return null;

  const myCurrentAnswer = currentUser === 'Michael' ? prompt.michael_answer : prompt.tamae_answer;
  const partnerAnswer = currentUser === 'Michael' ? prompt.tamae_answer : prompt.michael_answer;
  const bothAnswered = !!(prompt.michael_answer && prompt.tamae_answer);

  return (
    <div className="w-full max-w-4xl rounded-2xl bg-zinc-950/80 backdrop-blur-xl border border-amber-900/30 shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-amber-600 via-stone-500 to-amber-900"></div>
      
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-900/50 text-amber-500 shadow-inner">
            {bothAnswered ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-amber-600 font-semibold">
              {lang === 'ja' ? '今週のプロンプト' : 'Weekly Prompt'}
            </h3>
          </div>
        </div>

        <h2 className="text-xl md:text-2xl font-light text-stone-100 mb-8 leading-relaxed">
          {lang === 'ja' ? prompt.question_ja : prompt.question_en}
        </h2>

        {/* State 1: I haven't answered yet */}
        {!myCurrentAnswer && (
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              value={myAnswer}
              onChange={(e) => setMyAnswer(e.target.value)}
              placeholder={lang === 'ja' ? 'あなたの答え...' : 'Your answer...'}
              className="w-full p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-stone-200 focus:outline-none focus:border-amber-700/50 resize-none min-h-25"
              required
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-stone-500 font-mono">
                {partnerAnswer ? (lang === 'ja' ? '彼女はすでに答えています！' : 'She has already answered!') : (lang === 'ja' ? 'まだ誰も答えていません' : 'Neither has answered yet.')}
              </span>
              <button 
                type="submit" 
                disabled={submitting}
                className="px-6 py-2.5 rounded-lg bg-amber-700/80 hover:bg-amber-600 text-white text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {lang === 'ja' ? 'ロック解除' : 'Submit & Unlock'}
              </button>
            </div>
          </form>
        )}

        {/* State 2: I answered, displaying both statuses */}
        {myCurrentAnswer && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* My Answer */}
            <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800">
              <span className="text-[10px] font-mono text-stone-500 tracking-widest uppercase mb-2 block">
                {currentUser}
              </span>
              <p className="text-sm text-stone-200 leading-relaxed whitespace-pre-wrap">{myCurrentAnswer}</p>
            </div>

            {/* Partner's Answer */}
            <div className={`p-5 rounded-xl border relative overflow-hidden ${bothAnswered ? 'bg-zinc-900/40 border-amber-900/30' : 'bg-zinc-950 border-zinc-800/50'}`}>
              <span className="text-[10px] font-mono text-stone-500 tracking-widest uppercase mb-2 block">
                {currentUser === 'Michael' ? 'Tamae' : 'Michael'}
              </span>
              
              {bothAnswered ? (
                <p className="text-sm text-stone-200 leading-relaxed whitespace-pre-wrap animate-in fade-in duration-1000">
                  {partnerAnswer}
                </p>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 opacity-50">
                  <Lock className="w-5 h-5 text-stone-600 mb-2" />
                  <p className="text-xs text-stone-500 font-mono text-center">
                    {lang === 'ja' ? 'パートナーの回答待ち...' : 'Waiting for their answer...'}
                  </p>
                  {/* Fake blurred text for visual effect */}
                  <div className="mt-4 space-y-2 w-full select-none blur-sm opacity-30">
                    <div className="h-2 bg-stone-500 rounded w-3/4"></div>
                    <div className="h-2 bg-stone-500 rounded w-1/2"></div>
                    <div className="h-2 bg-stone-500 rounded w-5/6"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}