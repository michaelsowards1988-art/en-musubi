'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, Plus, CheckCircle2, Loader2, Sparkles, Pencil, Trash2, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CollapsibleSection from '@/components/shared/CollapsibleSection';
import ReactionThread, { ThreadComment } from '@/components/shared/ReactionThread';

interface Factor {
  id: string;
  title: string;
  status: 'active' | 'achieved';
  hearted_by: string[] | null;
  comments: ThreadComment[] | null;
}

interface KeySuccessFactorsProps {
  currentUser: 'Michael' | 'Tamae';
  lang: 'en' | 'ja';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

const generateId = () => Date.now().toString();
const getNowIso = () => new Date().toISOString();

export default function KeySuccessFactors({
  currentUser,
  lang,
  title,
  subtitle,
  icon,
}: KeySuccessFactorsProps) {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const { data, error } = await supabase
        .from('success_factors')
        .select('*')
        .order('created_at', { ascending: true });

      if (isMounted) {
        if (!error && data) setFactors(data);
        setLoading(false);
      }
    }

    loadData();

    const channel = supabase
      .channel('public:success_factors')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'success_factors' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setFactors((prev) => [...prev.filter((f) => f.id !== payload.new.id), payload.new as Factor]);
        } else if (payload.eventType === 'UPDATE') {
          setFactors((prev) => prev.map((f) => (f.id === payload.new.id ? (payload.new as Factor) : f)));
        } else if (payload.eventType === 'DELETE') {
          setFactors((prev) => prev.filter((f) => f.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleStatus = async (id: string, currentStatus: Factor['status']) => {
    const nextStatus: Factor['status'] = currentStatus === 'achieved' ? 'active' : 'achieved';
    setFactors(factors.map((f) => (f.id === id ? { ...f, status: nextStatus } : f)));
    await supabase.from('success_factors').update({ status: nextStatus }).eq('id', id);
  };

  const addFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const { data, error } = await supabase
      .from('success_factors')
      .insert([{ title: newTitle.trim(), status: 'active' }])
      .select();
    if (!error && data) {
      setNewTitle('');
      setIsAdding(false);
    }
  };

  const saveEdit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    setFactors((prev) => prev.map((f) => (f.id === id ? { ...f, title: editTitle.trim() } : f)));
    setEditingId(null);
    await supabase.from('success_factors').update({ title: editTitle.trim() }).eq('id', id);
  };

  const deleteFactor = async (id: string) => {
    setFactors((prev) => prev.filter((f) => f.id !== id));
    setEditingId(null);
    await supabase.from('success_factors').delete().eq('id', id);
  };

  const toggleHeart = async (factor: Factor) => {
    const currentHearts = factor.hearted_by || [];
    const newHearts = currentHearts.includes(currentUser)
      ? currentHearts.filter((u) => u !== currentUser)
      : [...currentHearts, currentUser];
    setFactors(factors.map((f) => (f.id === factor.id ? { ...f, hearted_by: newHearts } : f)));
    await supabase.from('success_factors').update({ hearted_by: newHearts }).eq('id', factor.id);
  };

  const postReply = async (content: string, factor: Factor) => {
    const author = currentUser === 'Michael' ? 'Texas' : 'Kanagawa';
    const newComment: ThreadComment = {
      id: generateId(),
      author,
      content,
      created_at: getNowIso(),
    };
    const newComments = [...(factor.comments || []), newComment];
    setFactors(factors.map((f) => (f.id === factor.id ? { ...f, comments: newComments } : f)));
    await supabase.from('success_factors').update({ comments: newComments }).eq('id', factor.id);
  };

  const handleAddClick = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsAdding(true);
    } else {
      setIsAdding(!isAdding);
    }
  };

  const actionButton = (
    <button
      onClick={handleAddClick}
      className="flex items-center gap-1.5 text-xs font-mono bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-all cursor-pointer"
    >
      <Plus className="w-3.5 h-3.5" />
      <span className="hidden md:inline">{lang === 'ja' ? 'フォーカス追加' : 'Add Focus'}</span>
      <span className="md:hidden">{lang === 'ja' ? '追加' : 'Add'}</span>
    </button>
  );

  return (
    <CollapsibleSection
      title={title}
      subtitle={subtitle}
      icon={icon}
      isControlled={true}
      isOpen={isOpen}
      onToggle={setIsOpen}
      actionButton={actionButton}
    >
      {loading ? (
        <div className="flex items-center justify-center text-zinc-500 font-mono text-xs py-4">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading Key Success Factors...
        </div>
      ) : (
        <>
          {isAdding && (
            <form
              onSubmit={addFactor}
              className="mb-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex gap-3"
            >
              <input
                type="text"
                placeholder="Focus area (e.g., Daily Japanese & English practice)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-stone-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-lg bg-zinc-100 text-zinc-950 text-sm font-medium hover:bg-white transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Save</span>
              </button>
            </form>
          )}

          <div className="space-y-3">
            {factors.map((item) => {
              const isEditing = editingId === item.id;

              return (
                <div
                  key={item.id}
                  className="flex flex-col p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/40 hover:bg-zinc-900/60 transition-all group"
                >
                  <div className="flex items-start gap-3 w-full">
                    <div
                      onClick={() => toggleStatus(item.id, item.status)}
                      className="mt-0.5 cursor-pointer shrink-0"
                    >
                      {item.status === 'achieved' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 transition-transform hover:scale-110" />
                      ) : (
                        <Lightbulb className="w-5 h-5 text-purple-400 transition-transform hover:scale-110" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <form onSubmit={(e) => saveEdit(e, item.id)} className="flex items-center gap-2 mb-1">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="flex-1 p-2 rounded-lg bg-zinc-950 border border-amber-900/50 text-sm text-zinc-200 focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="p-2 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-sm font-medium transition-colors ${
                              item.status === 'achieved' ? 'text-zinc-500 line-through' : 'text-zinc-200'
                            }`}
                          >
                            {item.title}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(item.id);
                                setEditTitle(item.title);
                              }}
                              title={lang === 'ja' ? '編集' : 'Edit'}
                              className="p-1 text-stone-500 hover:text-amber-400 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteFactor(item.id)}
                              title={lang === 'ja' ? '削除' : 'Delete'}
                              className="p-1 text-stone-500 hover:text-red-400 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                      <ReactionThread
                        currentUser={currentUser}
                        heartedBy={item.hearted_by || []}
                        comments={item.comments || []}
                        onToggleHeart={() => toggleHeart(item)}
                        onAddComment={(content) => postReply(content, item)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </CollapsibleSection>
  );
}