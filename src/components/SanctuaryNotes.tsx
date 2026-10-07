'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ReactionThread, { ThreadComment } from './ReactionThread';
import CollapsibleSection from './CollapsibleSection';

interface Note {
  id: string;
  content: string;
  author: string;
  created_at: string;
  hearted_by: string[] | null;
  comments: ThreadComment[] | null;
}

interface SanctuaryNotesProps {
  currentUser: 'Michael' | 'Tamae';
  lang: 'en' | 'ja';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

const AVATARS = {
  Kanagawa: 'https://sizdewlxjcfdekzzdofw.supabase.co/storage/v1/object/public/photos/Tamae.png',
  Texas: 'https://sizdewlxjcfdekzzdofw.supabase.co/storage/v1/object/public/photos/Michael.png'
};

export default function SanctuaryNotes({ currentUser, lang, title, subtitle, icon }: SanctuaryNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newContent, setNewContent] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchNotes() {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);

      if (isMounted) {
        if (!error && data) setNotes(data);
        setLoading(false);
      }
    }

    fetchNotes();

    const channel = supabase
      .channel('public-notes-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotes((prev) => [payload.new as Note, ...prev.filter(n => n.id !== payload.new.id)]);
          } else if (payload.eventType === 'UPDATE') {
            setNotes((prev) => prev.map((n) => (n.id === payload.new.id ? payload.new as Note : n)));
          } else if (payload.eventType === 'DELETE') {
            setNotes((prev) => prev.filter((n) => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const postNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const author = currentUser === 'Michael' ? 'Texas' : 'Kanagawa';
    await supabase.from('notes').insert([{ content: newContent, author }]);
    setNewContent('');
  };

  const toggleHeart = async (note: Note) => {
    const currentHearts = note.hearted_by || [];
    const newHearts = currentHearts.includes(currentUser) ? currentHearts.filter(u => u !== currentUser) : [...currentHearts, currentUser];
    setNotes(notes.map(n => n.id === note.id ? { ...n, hearted_by: newHearts } : n));
    await supabase.from('notes').update({ hearted_by: newHearts }).eq('id', note.id);
  };

  const postReply = async (content: string, note: Note) => {
    const author = currentUser === 'Michael' ? 'Texas' : 'Kanagawa';
    // eslint-disable-next-line react-hooks/purity
    const newComment: ThreadComment = { id: Date.now().toString(), author, content, created_at: new Date().toISOString() };
    const newComments = [...(note.comments || []), newComment];
    setNotes(notes.map(n => n.id === note.id ? { ...n, comments: newComments } : n));
    await supabase.from('notes').update({ comments: newComments }).eq('id', note.id);
  };

  const handleAddClick = () => {
    if (!isOpen) {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      inputRef.current?.focus();
    }
  };

  const actionButton = (
    <button 
      onClick={handleAddClick}
      className="flex items-center gap-1.5 text-xs font-mono bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-stone-300 hover:bg-zinc-800 transition-all cursor-pointer"
    >
      <Plus className="w-3.5 h-3.5" />
      <span className="hidden md:inline">{lang === 'ja' ? 'ノート追加' : 'Add Note'}</span>
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
        <div className="flex items-center justify-center text-stone-500 font-mono text-xs py-4">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading Notes...
        </div>
      ) : (
        <>
          <form onSubmit={postNote} className="mb-6 flex flex-col md:flex-row gap-3">
            <input
              ref={inputRef}
              type="text"
              placeholder="Drop a note..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="flex-1 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-stone-200 focus:outline-none focus:border-stone-500"
            />
            <button type="submit" className="px-4 py-2.5 rounded-lg bg-stone-200 text-zinc-950 text-sm font-medium hover:bg-white transition-all flex items-center justify-center gap-2 cursor-pointer">
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>

          <div className="space-y-4">
            {notes.length === 0 ? (
              <p className="text-xs text-stone-600 font-mono text-center py-4">No notes recorded yet.</p>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 flex flex-col gap-3 transition-all hover:bg-zinc-900/60 group">
                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-stone-500/30 bg-zinc-900 shrink-0 mt-0.5 shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={AVATARS[note.author as keyof typeof AVATARS] || AVATARS.Texas} alt={note.author} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-stone-400 tracking-widest uppercase">
                          {note.author === 'Kanagawa' ? 'Tamae' : 'Michael'}
                        </span>
                        <span className="text-[10px] font-mono text-stone-600">
                          {new Date(note.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-stone-200 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                      
                      <ReactionThread 
                        currentUser={currentUser}
                        heartedBy={note.hearted_by || []}
                        comments={note.comments || []}
                        onToggleHeart={() => toggleHeart(note)}
                        onAddComment={(content) => postReply(content, note)}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </CollapsibleSection>
  );
}