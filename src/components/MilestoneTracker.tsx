'use client';

import { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Clock, Plus, Loader2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CollapsibleSection from './CollapsibleSection';
import ReactionThread, { ThreadComment } from './ReactionThread';

interface Milestone {
  id: string;
  title: string;
  target_date: string;
  status: 'planned' | 'in_progress' | 'achieved';
  created_by?: string;
  hearted_by: string[] | null;
  comments: ThreadComment[] | null;
}

interface MilestoneTrackerProps {
  currentUser: 'Michael' | 'Tamae';
  lang: 'en' | 'ja';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

export default function MilestoneTracker({ currentUser, lang, title, subtitle, icon }: MilestoneTrackerProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const { data, error } = await supabase.from('milestones').select('*').order('target_date', { ascending: true });
      if (isMounted) {
        if (!error && data) setMilestones(data);
        setLoading(false);
      }
    }

    loadData();

    const channel = supabase
      .channel('public:milestones:tracker')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'milestones' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMilestones(prev => [...prev, payload.new as Milestone].sort((a,b) => a.target_date.localeCompare(b.target_date)));
        } else if (payload.eventType === 'UPDATE') {
          setMilestones(prev => prev.map(m => m.id === payload.new.id ? payload.new as Milestone : m));
        } else if (payload.eventType === 'DELETE') {
          setMilestones(prev => prev.filter(m => m.id !== payload.old.id));
        }
      }).subscribe();

    return () => { isMounted = false; supabase.removeChannel(channel); };
  }, []);

  const toggleStatus = async (id: string, currentStatus: Milestone['status']) => {
    const nextStatus: Milestone['status'] = currentStatus === 'achieved' ? 'planned' : 'achieved';
    setMilestones(milestones.map(m => m.id === id ? { ...m, status: nextStatus } : m));
    await supabase.from('milestones').update({ status: nextStatus }).eq('id', id);
  };

  const toggleHeart = async (item: Milestone) => {
    const currentHearts = item.hearted_by || [];
    const newHearts = currentHearts.includes(currentUser) ? currentHearts.filter(u => u !== currentUser) : [...currentHearts, currentUser];
    setMilestones(milestones.map(m => m.id === item.id ? { ...m, hearted_by: newHearts } : m));
    await supabase.from('milestones').update({ hearted_by: newHearts }).eq('id', item.id);
  };

  const postReply = async (content: string, item: Milestone) => {
    const author = currentUser === 'Michael' ? 'Texas' : 'Kanagawa';
    const newComment: ThreadComment = { id: Date.now().toString(), author, content, created_at: new Date().toISOString() };
    const newComments = [...(item.comments || []), newComment];
    setMilestones(milestones.map(m => m.id === item.id ? { ...m, comments: newComments } : m));
    await supabase.from('milestones').update({ comments: newComments }).eq('id', item.id);
  };

  const addMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate) return;
    const { data, error } = await supabase.from('milestones').insert([{ title: newTitle, target_date: newDate, status: 'planned', created_by: currentUser }]).select();
    if (!error && data) {
      setNewTitle(''); setNewDate(''); setIsAdding(false);
    }
  };

  const saveEdit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editTitle || !editDate) return;
    setMilestones(milestones.map(m => m.id === id ? { ...m, title: editTitle, target_date: editDate } : m));
    setEditingId(null);
    await supabase.from('milestones').update({ title: editTitle, target_date: editDate }).eq('id', id);
  };

  const actionButton = (
    <button onClick={() => { if(!isOpen){setIsOpen(true); setIsAdding(true);} else setIsAdding(!isAdding); }} className="flex items-center gap-1.5 text-xs font-mono bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-all cursor-pointer">
      <Plus className="w-3.5 h-3.5" />
      <span className="hidden md:inline">{lang === 'ja' ? '目標追加' : 'Add Target'}</span>
      <span className="md:hidden">{lang === 'ja' ? '追加' : 'Add'}</span>
    </button>
  );

  return (
    <CollapsibleSection title={title} subtitle={subtitle} icon={icon} isControlled={true} isOpen={isOpen} onToggle={setIsOpen} actionButton={actionButton}>
      {loading ? (
        <div className="flex items-center justify-center text-zinc-500 font-mono text-xs py-4"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading Milestones...</div>
      ) : (
        <>
          {isAdding && (
            <form onSubmit={addMilestone} className="mb-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col md:flex-row gap-3">
              <input type="text" placeholder="Milestone title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="flex-1 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-stone-500" autoFocus />
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm font-mono text-zinc-200 focus:outline-none focus:border-stone-500" />
              <button type="submit" className="px-4 py-2.5 rounded-lg bg-zinc-100 text-zinc-950 text-sm font-medium hover:bg-white transition-all cursor-pointer">Save</button>
            </form>
          )}

          <div className="space-y-3">
            {milestones.map((item) => (
              <div 
                key={item.id} 
                onClick={() => { if (editingId !== item.id) { setEditingId(item.id); setEditTitle(item.title); setEditDate(item.target_date); } }}
                className={`rounded-xl bg-zinc-900/40 border border-zinc-800/40 hover:border-zinc-700/60 transition-all group ${editingId !== item.id ? 'cursor-pointer p-0' : 'p-4'}`}
              >
                {editingId === item.id ? (
                  <form onSubmit={(e) => saveEdit(e, item.id)} className="flex flex-col md:flex-row gap-3">
                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="flex-1 p-2 rounded-lg bg-zinc-950 border border-amber-900/50 text-sm text-zinc-200 focus:outline-none focus:border-amber-500" autoFocus />
                    <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="p-2 rounded-lg bg-zinc-950 border border-amber-900/50 text-sm font-mono text-zinc-200 focus:outline-none focus:border-amber-500" />
                    <div className="flex gap-2">
                      <button type="submit" className="px-4 py-2 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white text-xs font-medium transition-all cursor-pointer">Save</button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all flex items-center justify-center cursor-pointer"><X className="w-4 h-4" /></button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col p-4 w-full">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div onClick={(e) => { e.stopPropagation(); toggleStatus(item.id, item.status); }} className="p-1 -ml-1 rounded-md hover:bg-zinc-800/50 cursor-pointer shrink-0" title="Toggle Status">
                          {item.status === 'achieved' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 transition-transform hover:scale-110" /> : <Clock className="w-4 h-4 text-zinc-500 transition-transform hover:scale-110" />}
                        </div>
                        <span className={`text-sm font-medium transition-colors group-hover:text-amber-400 truncate flex-1 ${item.status === 'achieved' ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                          {item.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800/60 group-hover:border-amber-900/50 group-hover:text-amber-400/80 transition-all shrink-0 ml-3">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{item.target_date}</span>
                      </div>
                    </div>

                    <div onClick={(e) => e.stopPropagation()} className="w-full pl-8">
                      <ReactionThread 
                        currentUser={currentUser}
                        heartedBy={item.hearted_by || []}
                        comments={item.comments || []}
                        onToggleHeart={() => toggleHeart(item)}
                        onAddComment={(content) => postReply(content, item)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </CollapsibleSection>
  );
}