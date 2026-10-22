'use client';

import { useState, useEffect } from 'react';
import { Lock, Unlock, Sparkles, Loader2, Archive, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PromptContent, { Prompt } from '@/components/prompts/PromptContent';

interface WeeklyUnlockProps {
  lang: 'en' | 'ja';
  currentUser: 'Michael' | 'Tamae';
}

export default function WeeklyUnlock({ lang, currentUser }: WeeklyUnlockProps) {
  const [activePrompt, setActivePrompt] = useState<Prompt | null>(null);
  const [archivedPrompts, setArchivedPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<'active' | 'archive'>('active');
  const [expandedArchiveId, setExpandedArchiveId] = useState<string | null>(null);

  const [isAddingPrompt, setIsAddingPrompt] = useState(false);
  const [newPromptEn, setNewPromptEn] = useState('');
  const [newPromptJa, setNewPromptJa] = useState('');
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchPrompts() {
      await supabase.auth.getSession();
      const { data, error } = await supabase
        .from('weekly_prompts')
        .select('*')
        .order('created_at', { ascending: false });
      if (isMounted) {
        if (!error && data) {
          setActivePrompt(data.find((p) => p.is_active) || null);
          setArchivedPrompts(data.filter((p) => !p.is_active));
        }
        setLoading(false);
      }
    }
    fetchPrompts();

    const channel = supabase
      .channel('public:weekly_prompts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weekly_prompts' }, () => {
        fetchPrompts();
      })
      .subscribe();
    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromptEn.trim() || !newPromptJa.trim()) return;
    setIsSavingPrompt(true);
    if (activePrompt) {
      await supabase.from('weekly_prompts').update({ is_active: false }).eq('id', activePrompt.id);
    }
    await supabase
      .from('weekly_prompts')
      .insert([{ question_en: newPromptEn, question_ja: newPromptJa, is_active: true }]);
    setNewPromptEn('');
    setNewPromptJa('');
    setIsAddingPrompt(false);
    setIsSavingPrompt(false);
    setView('active');
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-center font-mono text-xs text-stone-500">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Syncing Prompt...
      </div>
    );
  }
  if (!activePrompt && archivedPrompts.length === 0 && currentUser !== 'Michael') return null;

  return (
    <div className="w-full max-w-4xl rounded-2xl bg-zinc-950/80 backdrop-blur-xl border border-amber-900/30 shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden relative transition-all">
      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-amber-600 via-stone-500 to-amber-900"></div>

      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-900/50 text-amber-500 shadow-inner">
              {view === 'archive' ? (
                <Archive className="w-4 h-4" />
              ) : activePrompt && activePrompt.michael_answer && activePrompt.tamae_answer ? (
                <Unlock className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-amber-600 font-semibold">
                {view === 'archive'
                  ? lang === 'ja'
                    ? '過去のプロンプト'
                    : 'Prompt Archive'
                  : lang === 'ja'
                    ? '今週のプロンプト'
                    : 'Weekly Prompt'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser === 'Michael' && (
              <button
                onClick={() => setIsAddingPrompt(!isAddingPrompt)}
                className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-500 hover:bg-zinc-800 hover:text-amber-400 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span className="hidden md:inline">
                  {lang === 'ja' ? 'プロンプト追加' : 'Add Prompt'}
                </span>
                <span className="md:hidden">{lang === 'ja' ? '追加' : 'Add'}</span>
              </button>
            )}

            {archivedPrompts.length > 0 && (
              <button
                onClick={() => {
                  setView(view === 'active' ? 'archive' : 'active');
                  setExpandedArchiveId(null);
                  setIsAddingPrompt(false);
                }}
                className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-wider px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-stone-400 hover:text-stone-200 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                {view === 'active'
                  ? lang === 'ja'
                    ? 'アーカイブを見る'
                    : 'View Archive'
                  : lang === 'ja'
                    ? '現在に戻る'
                    : 'Back to Current'}
              </button>
            )}
          </div>
        </div>

        {isAddingPrompt && (
          <form
            onSubmit={handleAddPrompt}
            className="mb-6 p-5 rounded-xl bg-zinc-900/60 border border-amber-900/40 flex flex-col gap-3 animate-in fade-in"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-mono uppercase tracking-widest text-amber-500">
                Deploy New Prompt
              </span>
            </div>
            <input
              type="text"
              placeholder="English Question..."
              value={newPromptEn}
              onChange={(e) => setNewPromptEn(e.target.value)}
              className="w-full p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-stone-200 focus:outline-none focus:border-amber-700/50"
              required
            />
            <input
              type="text"
              placeholder="日本語の質問..."
              value={newPromptJa}
              onChange={(e) => setNewPromptJa(e.target.value)}
              className="w-full p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-stone-200 focus:outline-none focus:border-amber-700/50"
              required
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={isSavingPrompt}
                className="px-6 py-2.5 rounded-lg bg-amber-700/80 hover:bg-amber-600 text-white text-xs font-medium transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSavingPrompt ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Launch & Archive Old'}
              </button>
            </div>
          </form>
        )}

        {view === 'active' && activePrompt ? (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-xl md:text-2xl font-light text-stone-100 leading-relaxed">
              {lang === 'ja' ? activePrompt.question_ja : activePrompt.question_en}
            </h2>
            <PromptContent prompt={activePrompt} lang={lang} currentUser={currentUser} />
          </div>
        ) : (
          view === 'active' &&
          !activePrompt &&
          !isAddingPrompt && (
            <div className="py-8 text-center text-sm font-mono text-stone-500">
              No active prompt right now.
            </div>
          )
        )}

        {view === 'archive' && (
          <div className="space-y-3 animate-in fade-in duration-500">
            {archivedPrompts.map((prompt) => {
              const isExpanded = expandedArchiveId === prompt.id;
              const bothAnswered = !!(prompt.michael_answer && prompt.tamae_answer);
              const myAnswer =
                currentUser === 'Michael' ? prompt.michael_answer : prompt.tamae_answer;

              return (
                <div
                  key={prompt.id}
                  className={`rounded-xl border transition-all overflow-hidden ${
                    isExpanded
                      ? 'bg-zinc-900/20 border-amber-900/30'
                      : 'bg-zinc-900/40 border-zinc-800/40 hover:border-zinc-700/60'
                  }`}
                >
                  <div
                    onClick={() => setExpandedArchiveId(isExpanded ? null : prompt.id)}
                    className="p-4 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <h4
                        className={`text-sm font-medium leading-relaxed transition-colors ${
                          bothAnswered ? 'text-stone-200' : 'text-stone-400'
                        }`}
                      >
                        {lang === 'ja' ? prompt.question_ja : prompt.question_en}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-stone-600">
                          {new Date(prompt.created_at).toLocaleDateString()}
                        </span>
                        {!bothAnswered && !myAnswer && (
                          <span className="text-[10px] font-mono text-amber-600/80 px-1.5 py-0.5 rounded bg-amber-950/30 border border-amber-900/30">
                            {lang === 'ja' ? '未回答' : 'Needs Answer'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-stone-500 shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-zinc-800/30 mt-2">
                      <PromptContent prompt={prompt} lang={lang} currentUser={currentUser} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}