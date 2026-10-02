'use client';

import { useState, useEffect } from 'react';
import { Send, Loader2, Heart, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Comment {
  id: string;
  author: string;
  content: string;
  created_at: string;
}

interface Note {
  id: string;
  content: string;
  author: string;
  created_at: string;
  hearted_by: string[] | null;
  comments: Comment[] | null;
}

interface SanctuaryNotesProps {
  currentUser: 'Michael' | 'Tamae';
}

const AVATARS = {
  Kanagawa: 'https://sizdewlxjcfdekzzdofw.supabase.co/storage/v1/object/public/photos/Tamae.png',
  Texas: 'https://sizdewlxjcfdekzzdofw.supabase.co/storage/v1/object/public/photos/Michael.png'
};

export default function SanctuaryNotes({ currentUser }: SanctuaryNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newContent, setNewContent] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function fetchNotes() {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);

      if (isMounted) {
        if (!error && data) {
          setNotes(data);
        }
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

    await supabase
      .from('notes')
      .insert([{ content: newContent, author }]);

    setNewContent('');
  };

  const toggleHeart = async (note: Note) => {
    const currentHearts = note.hearted_by || [];
    const hasHearted = currentHearts.includes(currentUser);
    
    const newHearts = hasHearted 
      ? currentHearts.filter(u => u !== currentUser)
      : [...currentHearts, currentUser];

    // Optimistic UI update
    setNotes(notes.map(n => n.id === note.id ? { ...n, hearted_by: newHearts } : n));

    await supabase
      .from('notes')
      .update({ hearted_by: newHearts })
      .eq('id', note.id);
  };

  const postReply = async (e: React.FormEvent, note: Note) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    // Use the same author mapping logic so avatars match
    const author = currentUser === 'Michael' ? 'Texas' : 'Kanagawa';
    
    const newComment: Comment = {
      id: Date.now().toString(),
      author,
      content: replyContent,
      created_at: new Date().toISOString()
    };

    const newComments = [...(note.comments || []), newComment];

    // Optimistic UI update
    setNotes(notes.map(n => n.id === note.id ? { ...n, comments: newComments } : n));
    setReplyingTo(null);
    setReplyContent('');

    await supabase
      .from('notes')
      .update({ comments: newComments })
      .eq('id', note.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center text-stone-500 font-mono text-xs py-4">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading Notes...
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={postNote} className="mb-6 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Drop a note..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="flex-1 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-stone-200 focus:outline-none focus:border-stone-500"
        />
        <button type="submit" className="px-4 py-2.5 rounded-lg bg-stone-200 text-zinc-950 text-sm font-medium hover:bg-white transition-all flex items-center justify-center gap-2">
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>

      <div className="space-y-4">
        {notes.length === 0 ? (
          <p className="text-xs text-stone-600 font-mono text-center py-4">No notes recorded yet.</p>
        ) : (
          notes.map((note) => {
            const hasHearted = (note.hearted_by || []).includes(currentUser);
            const heartCount = (note.hearted_by || []).length;
            const comments = note.comments || [];

            return (
              <div key={note.id} className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 flex flex-col gap-3 transition-all hover:bg-zinc-900/60 group">
                
                {/* Main Note Content */}
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-stone-500/30 bg-zinc-900 shrink-0 mt-0.5 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={AVATARS[note.author as keyof typeof AVATARS] || AVATARS.Texas} 
                      alt={note.author} 
                      className="w-full h-full object-cover" 
                    />
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
                    
                    {/* Subtle Action Bar */}
                    <div className="flex items-center gap-4 mt-3">
                      <button 
                        onClick={() => toggleHeart(note)}
                        className={`flex items-center gap-1.5 text-xs transition-all ${hasHearted ? 'text-rose-500' : 'text-stone-500 hover:text-stone-300'}`}
                      >
                        <Heart className={`w-3.5 h-3.5 transition-transform ${hasHearted ? 'fill-current scale-110' : ''}`} />
                        {heartCount > 0 && <span className="font-mono text-[10px]">{heartCount}</span>}
                      </button>
                      <button 
                        onClick={() => {
                          setReplyingTo(replyingTo === note.id ? null : note.id);
                          setReplyContent('');
                        }}
                        className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-300 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {comments.length > 0 && <span className="font-mono text-[10px]">{comments.length}</span>}
                      </button>
                    </div>
                  </div>
                </div>

                {/* The Thread (Comments & Reply Box) */}
                {(comments.length > 0 || replyingTo === note.id) && (
                  <div className="ml-4 pl-4 md:ml-11 md:pl-4 border-l-2 border-zinc-800/50 flex flex-col gap-3 mt-1">
                    
                    {/* Existing Comments */}
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full overflow-hidden border border-stone-500/20 bg-zinc-950 shrink-0 mt-0.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={AVATARS[comment.author as keyof typeof AVATARS] || AVATARS.Texas} 
                            alt={comment.author} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="flex-1 min-w-0 bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800/40">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[9px] font-mono text-stone-500 uppercase">
                              {comment.author === 'Kanagawa' ? 'Tamae' : 'Michael'}
                            </span>
                          </div>
                          <p className="text-xs text-stone-300 whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    ))}

                    {/* Reply Input Form */}
                    {replyingTo === note.id && (
                      <form onSubmit={(e) => postReply(e, note)} className="flex items-center gap-2 mt-1 animate-in fade-in duration-300">
                        <input
                          type="text"
                          autoFocus
                          placeholder="Reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          className="flex-1 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-stone-200 focus:outline-none focus:border-stone-500"
                        />
                        <button type="submit" disabled={!replyContent.trim()} className="p-2 rounded-lg bg-stone-200 text-zinc-950 hover:bg-white transition-all disabled:opacity-50 disabled:hover:bg-stone-200">
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    )}
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}