'use client';

import { useState } from 'react';
import { Lock, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateId, getNowIso } from '@/lib/utils';
import ReactionThread, { ThreadComment } from '@/components/shared/ReactionThread';

export interface Prompt {
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

interface PromptContentProps {
  prompt: Prompt;
  lang: 'en' | 'ja';
  currentUser: 'Michael' | 'Tamae';
}

export default function PromptContent({
  prompt: initialPrompt,
  lang,
  currentUser,
}: PromptContentProps) {
  const [prompt, setPrompt] = useState<Prompt>(initialPrompt);
  const [prevInitial, setPrevInitial] = useState<Prompt>(initialPrompt);

  if (initialPrompt !== prevInitial) {
    setPrompt(initialPrompt);
    setPrevInitial(initialPrompt);
  }

  const [myAnswer, setMyAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const bothAnswered = !!(prompt.michael_answer && prompt.tamae_answer);
  const isOlderThan86Hours =
    bothAnswered && prompt.completed_at
      ? new Date().getTime() - new Date(prompt.completed_at).getTime() > 86 * 60 * 60 * 1000
      : false;

  const [isRevealed, setIsRevealed] = useState(!isOlderThan86Hours);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myAnswer.trim()) return;
    setSubmitting(true);

    const partnerAnswer = currentUser === 'Michael' ? prompt.tamae_answer : prompt.michael_answer;
    const willComplete = !!partnerAnswer;
    const now = getNowIso();

    const updateField: Partial<Prompt> =
      currentUser === 'Michael' ? { michael_answer: myAnswer } : { tamae_answer: myAnswer };

    if (willComplete) {
      updateField.completed_at = now;
    }

    await supabase.from('weekly_prompts').update(updateField).eq('id', prompt.id);
    setSubmitting(false);
  };

  const handleToggleHeart = async (targetUser: 'michael' | 'tamae') => {
    const col = `${targetUser}_hearted_by` as keyof Prompt;
    const currentHearts = (prompt[col] as string[]) || [];
    const newHearts = currentHearts.includes(currentUser)
      ? currentHearts.filter((u) => u !== currentUser)
      : [...currentHearts, currentUser];

    setPrompt({ ...prompt, [col]: newHearts });
    await supabase.from('weekly_prompts').update({ [col]: newHearts }).eq('id', prompt.id);
  };

  const handleAddComment = async (targetUser: 'michael' | 'tamae', content: string) => {
    const col = `${targetUser}_comments` as keyof Prompt;
    const author = currentUser === 'Michael' ? 'Texas' : 'Kanagawa';

    const newComment: ThreadComment = {
      id: generateId(),
      author,
      content,
      created_at: getNowIso(),
    };
    const newComments = [...((prompt[col] as ThreadComment[]) || []), newComment];

    setPrompt({ ...prompt, [col]: newComments });
    await supabase.from('weekly_prompts').update({ [col]: newComments }).eq('id', prompt.id);
  };

  const myCurrentAnswer = currentUser === 'Michael' ? prompt.michael_answer : prompt.tamae_answer;
  const partnerAnswer = currentUser === 'Michael' ? prompt.tamae_answer : prompt.michael_answer;

  const partnerAnsweredTextEn =
    currentUser === 'Michael' ? 'She has already answered!' : 'He has already answered!';
  const partnerAnsweredTextJa =
    currentUser === 'Michael' ? '彼女はすでに答えています！' : '彼はすでに答えています！';

  return (
    <div className="mt-4">
      {!myCurrentAnswer ? (
        <form onSubmit={handleSubmit} className="relative mt-2">
          <textarea
            value={myAnswer}
            onChange={(e) => setMyAnswer(e.target.value)}
            placeholder={lang === 'ja' ? 'あなたの答え...' : 'Your answer...'}
            className="w-full p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-stone-200 focus:outline-none focus:border-amber-700/50 resize-none min-h-25"
            required
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-stone-500 font-mono">
              {partnerAnswer
                ? lang === 'ja'
                  ? partnerAnsweredTextJa
                  : partnerAnsweredTextEn
                : lang === 'ja'
                  ? 'まだ誰も答えていません'
                  : 'Neither has answered yet.'}
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-lg bg-amber-700/80 hover:bg-amber-600 text-white text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
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
              <span className="text-[10px] font-mono text-stone-500 tracking-widest uppercase mb-3 block">
                {currentUser}
              </span>
              <p className="text-sm text-stone-200 leading-relaxed whitespace-pre-wrap mb-2">
                {myCurrentAnswer}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-800/50">
              <ReactionThread
                currentUser={currentUser}
                heartedBy={
                  currentUser === 'Michael'
                    ? prompt.michael_hearted_by || []
                    : prompt.tamae_hearted_by || []
                }
                comments={
                  currentUser === 'Michael'
                    ? prompt.michael_comments || []
                    : prompt.tamae_comments || []
                }
                onToggleHeart={() =>
                  handleToggleHeart(currentUser === 'Michael' ? 'michael' : 'tamae')
                }
                onAddComment={(content) =>
                  handleAddComment(currentUser === 'Michael' ? 'michael' : 'tamae', content)
                }
              />
            </div>
          </div>

          <div
            className={`p-5 rounded-xl border relative overflow-hidden flex flex-col h-full ${
              bothAnswered ? 'bg-zinc-900/40 border-amber-900/30' : 'bg-zinc-950 border-zinc-800/50'
            }`}
          >
            <span className="text-[10px] font-mono text-stone-500 tracking-widest uppercase mb-3 block">
              {currentUser === 'Michael' ? 'Tamae' : 'Michael'}
            </span>

            {bothAnswered ? (
              <div className="animate-in fade-in duration-1000 flex-1 flex flex-col h-full">
                <div className="flex-1">
                  <p className="text-sm text-stone-200 leading-relaxed whitespace-pre-wrap mb-2">
                    {partnerAnswer}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-zinc-800/50">
                  <ReactionThread
                    currentUser={currentUser}
                    heartedBy={
                      currentUser === 'Michael'
                        ? prompt.tamae_hearted_by || []
                        : prompt.michael_hearted_by || []
                    }
                    comments={
                      currentUser === 'Michael'
                        ? prompt.tamae_comments || []
                        : prompt.michael_comments || []
                    }
                    onToggleHeart={() =>
                      handleToggleHeart(currentUser === 'Michael' ? 'tamae' : 'michael')
                    }
                    onAddComment={(content) =>
                      handleAddComment(currentUser === 'Michael' ? 'tamae' : 'michael', content)
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 opacity-50 flex-1">
                <Lock className="w-5 h-5 text-stone-600 mb-2" />
                <p className="text-xs text-stone-500 font-mono text-center">
                  {lang === 'ja' ? 'パートナーの回答待ち...' : 'Waiting for their answer...'}
                </p>
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