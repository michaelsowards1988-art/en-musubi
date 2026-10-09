'use client';

import { useState, useEffect } from 'react';
import { Lock, Unlock, Sparkles, Loader2, Archive, ChevronDown, ChevronUp, Plus, } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ReactionThread, { ThreadComment } from './ReactionThread';

interface Prompt {
  id: string;
  question_en: string;
  question_ja: string;
  michael_answer: string | null;
  tamae_answer: string | null;
  is_active: boolean;
  created_at: string;
  completed_at: string | null;
  michael_hearted_by: string[] | null;
  michael_comments: ThreadComment[] | null;
  tamae_hearted_by: string[] | null;
  tamae_comments: ThreadComment[] | null;
}

interface WeeklyUnlockProps {
  lang: 'en' | 'ja';
  currentUser: 'Michael' | 'Tamae';
}

function PromptContent({ prompt: initialPrompt, lang, currentUser }: { prompt: Prompt, lang: 'en' | 'ja', currentUser: 'Michael' | 'Tamae' }) {
  const [prompt, setPrompt] = useState<Prompt>(initialPrompt);
  const [prevInitial, setPrevInitial] = useState<Prompt>(initialPrompt);

  if (initialPrompt !== prevInitial) {
    setPrompt(initialPrompt);
    setPrevInitial(initialPrompt);
  }

  const [myAnswer, setMyAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Time capsule logic
  const bothAnswered = !!(prompt.michael_answer && prompt.tamae_answer);
  const isOlderThan86Hours = bothAnswered && prompt.completed_at 
    ? (new Date().getTime() - new Date(prompt.completed_at).getTime() > 86 * 60 * 60 * 1000) 
    : false;
  
  const [isRevealed, setIsRevealed] = useState(!isOlderThan86Hours);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myAnswer.trim()) return;
    setSubmitting(true);
    
    const partnerAnswer = currentUser === 'Michael' ? prompt.tamae_answer : prompt.michael_answer;
    const willComplete = !!partnerAnswer;
    const now = new Date().toISOString();

    const updateField: Partial<Prompt> = currentUser === 'Michael' 
      ? { michael_answer: myAnswer } 
      : { tamae_answer: myAnswer };
      
    if (willComplete) {
      updateField.completed_at = now;
    }

    await supabase.from('weekly_prompts').update(updateField).eq('id', prompt.id);
    setSubmitting(false);
  };

  const handleToggleHeart = async (targetUser: 'michael' | 'tamae') => {
    const col = `${targetUser}_hearted_by` as keyof Prompt;
    const currentHearts = (prompt[col] as string[]) || [];
    const newHearts = currentHearts.includes(currentUser) ? currentHearts.filter(u => u !== currentUser) : [...currentHearts, currentUser];
    
    setPrompt({ ...prompt, [col]: newHearts }); 
    await supabase.from('weekly_prompts').update({ [col]: newHearts }).eq('id', prompt.id);
  };

  const handleAddComment = async (targetUser: 'michael' | 'tamae', content: string) => {
    const col = `${targetUser}_comments` as keyof Prompt;
    const author = currentUser === 'Michael' ? 'Texas' : 'Kanagawa';
    
    const newComment = { id: Date.now().toString(), author, content, created_at: new Date().toISOString() };
    const newComments = [...((prompt[col] as ThreadComment[]) || []), newComment];
    
    setPrompt({ ...prompt, [col]: newComments }); 
    await supabase.from('weekly_prompts').update({ [col]: newComments }).eq('id', prompt.id);
  };

  const myCurrentAnswer = currentUser === 'Michael' ? prompt.michael_answer : prompt.tamae_answer;
  const partnerAnswer = currentUser === 'Michael' ? prompt.tamae_answer : prompt.michael_answer;

  const partnerAnsweredTextEn = currentUser === 'Michael' ? 'She has already answered!' : 'He has already answered!';
  const partnerAnsweredTextJa = currentUser === 'Michael' ? '彼女はすでに答えています！' : '彼はすでに答えています！';

  return (
    <div className="mt-4">
      {!myCurrentAnswer ? (
        <form onSubmit={handleSubmit} className="relative mt-2">
          <textarea value={myAnswer} onChange={(e) => setMyAnswer(e.target.value)} placeholder={lang === 'ja' ? 'あなたの答え...' : 'Your answer...'} className="w-full p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-stone-200 focus:outline-none focus:border-amber-700/50 resize-none min-h-25" required />
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-stone-500 font-mono">
              {partnerAnswer ? (lang === 'ja' ? partnerAnsweredTextJa : partnerAnsweredTextEn) : (lang === 'ja' ? 'まだ誰も答えていません' : 'Neither has answered yet.')}
            </span>
            <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-lg bg-amber-700/80 hover:bg-amber-600 text-white text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {lang === 'ja' ? 'ロック解除' : 'Submit & Unlock'}
            </button>
          </div>
        </form>
      ) : bothAnswered && !isRevealed ? (
        <button 
          onClick={() => setIsRevealed(true)}
          className="w-full py-3.5 mt-4 rounded-xl border border-amber-900/30 bg-amber-950/20 hover:bg-amber-950/40 hover:border-amber-700/50 transition-all flex items-center justify-center gap-2.5 group cursor-pointer animate-in fade-in"
        >
          <Lock className="w-4 h-4 text-amber-600/70 group-hover:text-amber-500 transition-colors" />
          <span className="text-xs font-mono text-stone-400 group-hover:text-stone-300 transition-colors">
            {lang === 'ja' ? '回答が確定しました。タップして開く' : 'Time capsule sealed. Tap to reveal.'}
          </span>
        </button>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800 flex flex-col h-full">
            <div className="flex-1">
              <span className="text-[10px] font-mono text-stone-500 tracking-widest uppercase mb-3 block">{currentUser}</span>
              <p className="text-sm text-stone-200 leading-relaxed whitespace-pre-wrap mb-2">{myCurrentAnswer}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-800/50">
              <ReactionThread 
                currentUser={currentUser}
                heartedBy={currentUser === 'Michael' ? (prompt.michael_hearted_by || []) : (prompt.tamae_hearted_by || [])}
                comments={currentUser === 'Michael' ? (prompt.michael_comments || []) : (prompt.tamae_comments || [])}
                onToggleHeart={() => handleToggleHeart(currentUser === 'Michael' ? 'michael' : 'tamae')}
                onAddComment={(content) => handleAddComment(currentUser === 'Michael' ? 'michael' : 'tamae', content)}
              />
            </div>
          </div>

          <div className={`p-5 rounded-xl border relative overflow-hidden flex flex-col h-full ${bothAnswered ? 'bg-zinc-900/40 border-amber-900/30' : 'bg-zinc-950 border-zinc-800/50'}`}>
            <span className="text-[10px] font-mono text-stone-500 tracking-widest uppercase mb-3 block">{currentUser === 'Michael' ? 'Tamae' : 'Michael'}</span>
            
            {bothAnswered ? (
              <div className="animate-in fade-in duration-1000 flex-1 flex flex-col h-full">
                <div className="flex-1">
                  <p className="text-sm text-stone-200 leading-relaxed whitespace-pre-wrap mb-2">{partnerAnswer}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-zinc-800/50">
                  <ReactionThread 
                    currentUser={currentUser}
                    heartedBy={currentUser === 'Michael' ? (prompt.tamae_hearted_by || []) : (prompt.michael_hearted_by || [])}
                    comments={currentUser === 'Michael' ? (prompt.tamae_comments || []) : (prompt.michael_comments || [])}
                    onToggleHeart={() => handleToggleHeart(currentUser === 'Michael' ? 'tamae' : 'michael')}
                    onAddComment={(content) => handleAddComment(currentUser === 'Michael' ? 'tamae' : 'michael', content)}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 opacity-50 flex-1">
                <Lock className="w-5 h-5 text-stone-600 mb-2" />
                <p className="text-xs text-stone-500 font-mono text-center">{lang === 'ja' ? 'パートナーの回答待ち...' : 'Waiting for their answer...'}</p>
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
  );
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
      const { data, error } = await supabase.from('weekly_prompts').select('*').order('created_at', { ascending: false });
      if (isMounted) {
        if (!error && data) {
          setActivePrompt(data.find(p => p.is_active) || null);
          setArchivedPrompts(data.filter(p => !p.is_active));
        }
        setLoading(false);
      }
    }
    fetchPrompts();

    const channel = supabase.channel('public:weekly_prompts').on('postgres_changes', { event: '*', schema: 'public', table: 'weekly_prompts' }, () => { fetchPrompts(); }).subscribe();
    return () => { isMounted = false; supabase.removeChannel(channel); };
  }, []);

  const handleAddPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromptEn.trim() || !newPromptJa.trim()) return;
    setIsSavingPrompt(true);
    if (activePrompt) await supabase.from('weekly_prompts').update({ is_active: false }).eq('id', activePrompt.id);
    await supabase.from('weekly_prompts').insert([{ question_en: newPromptEn, question_ja: newPromptJa, is_active: true }]);
    setNewPromptEn(''); setNewPromptJa(''); setIsAddingPrompt(false); setIsSavingPrompt(false); setView('active'); 
  };

  if (loading) return <div className="w-full max-w-4xl p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-center font-mono text-xs text-stone-500"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Syncing Prompt...</div>;
  if (!activePrompt && archivedPrompts.length === 0 && currentUser !== 'Michael') return null;

  return (
    <div className="w-full max-w-4xl rounded-2xl bg-zinc-950/80 backdrop-blur-xl border border-amber-900/30 shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden relative transition-all">
      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-amber-600 via-stone-500 to-amber-900"></div>
      
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-900/50 text-amber-500 shadow-inner">
              {view === 'archive' ? <Archive className="w-4 h-4" /> : (activePrompt && activePrompt.michael_answer && activePrompt.tamae_answer ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />)}
            </div>
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-amber-600 font-semibold">
                {view === 'archive' ? (lang === 'ja' ? '過去のプロンプト' : 'Prompt Archive') : (lang === 'ja' ? '今週のプロンプト' : 'Weekly Prompt')}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser === 'Michael' && (
              <button onClick={() => setIsAddingPrompt(!isAddingPrompt)} className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-500 hover:bg-zinc-800 hover:text-amber-400 transition-colors cursor-pointer">
                <Plus className="w-3 h-3" /> 
                <span className="hidden md:inline">{lang === 'ja' ? 'プロンプト追加' : 'Add Prompt'}</span>
                <span className="md:hidden">{lang === 'ja' ? '追加' : 'Add'}</span>
              </button>
            )}

            {archivedPrompts.length > 0 && (
              <button onClick={() => { setView(view === 'active' ? 'archive' : 'active'); setExpandedArchiveId(null); setIsAddingPrompt(false); }} className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-wider px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-stone-400 hover:text-stone-200 hover:bg-zinc-800 transition-colors cursor-pointer">
                {view === 'active' ? (lang === 'ja' ? 'アーカイブを見る' : 'View Archive') : (lang === 'ja' ? '現在に戻る' : 'Back to Current')}
              </button>
            )}
          </div>
        </div>

        {isAddingPrompt && (
          <form onSubmit={handleAddPrompt} className="mb-6 p-5 rounded-xl bg-zinc-900/60 border border-amber-900/40 flex flex-col gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-mono uppercase tracking-widest text-amber-500">Deploy New Prompt</span>
            </div>
            <input type="text" placeholder="English Question..." value={newPromptEn} onChange={(e) => setNewPromptEn(e.target.value)} className="w-full p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-stone-200 focus:outline-none focus:border-amber-700/50" required />
            <input type="text" placeholder="日本語の質問..." value={newPromptJa} onChange={(e) => setNewPromptJa(e.target.value)} className="w-full p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-stone-200 focus:outline-none focus:border-amber-700/50" required />
            <div className="flex justify-end mt-2">
              <button type="submit" disabled={isSavingPrompt} className="px-6 py-2.5 rounded-lg bg-amber-700/80 hover:bg-amber-600 text-white text-xs font-medium transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer">
                {isSavingPrompt ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Launch & Archive Old'}
              </button>
            </div>
          </form>
        )}

        {view === 'active' && activePrompt ? (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-xl md:text-2xl font-light text-stone-100 leading-relaxed">{lang === 'ja' ? activePrompt.question_ja : activePrompt.question_en}</h2>
            <PromptContent prompt={activePrompt} lang={lang} currentUser={currentUser} />
          </div>
        ) : view === 'active' && !activePrompt && !isAddingPrompt && (
          <div className="py-8 text-center text-sm font-mono text-stone-500">No active prompt right now.</div>
        )}

        {view === 'archive' && (
          <div className="space-y-3 animate-in fade-in duration-500">
            {archivedPrompts.map(prompt => {
              const isExpanded = expandedArchiveId === prompt.id;
              const bothAnswered = !!(prompt.michael_answer && prompt.tamae_answer);
              const myAnswer = currentUser === 'Michael' ? prompt.michael_answer : prompt.tamae_answer;

              return (
                <div key={prompt.id} className={`rounded-xl border transition-all overflow-hidden ${isExpanded ? 'bg-zinc-900/20 border-amber-900/30' : 'bg-zinc-900/40 border-zinc-800/40 hover:border-zinc-700/60'}`}>
                  <div onClick={() => setExpandedArchiveId(isExpanded ? null : prompt.id)} className="p-4 flex items-center justify-between cursor-pointer">
                    <div className="flex-1 min-w-0 pr-4">
                      <h4 className={`text-sm font-medium leading-relaxed transition-colors ${bothAnswered ? 'text-stone-200' : 'text-stone-400'}`}>{lang === 'ja' ? prompt.question_ja : prompt.question_en}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-stone-600">{new Date(prompt.created_at).toLocaleDateString()}</span>
                        {!bothAnswered && !myAnswer && <span className="text-[10px] font-mono text-amber-600/80 px-1.5 py-0.5 rounded bg-amber-950/30 border border-amber-900/30">{lang === 'ja' ? '未回答' : 'Needs Answer'}</span>}
                      </div>
                    </div>
                    <div className="text-stone-500 shrink-0">{isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</div>
                  </div>
                  {isExpanded && <div className="p-4 pt-0 border-t border-zinc-800/30 mt-2"><PromptContent prompt={prompt} lang={lang} currentUser={currentUser} /></div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}