'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CollapsibleSection from '@/components/shared/CollapsibleSection';
import ReactionThread, { ThreadComment } from '@/components/shared/ReactionThread';

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
  Texas: 'https://sizdewlxjcfdekzzdofw.supabase.co/storage/v1/object/public/photos/Michael.png',
};

const generateId = () => Date.now().toString();
const getNowIso = () => new Date().toISOString();

export default function SanctuaryNotes({
  currentUser,
  lang,
  title,
  subtitle,
  icon,
}: SanctuaryNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newContent, setNewContent] = useState('');
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [avatarBust, setAvatarBust] = useState('1');

  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const syncBust = () => setAvatarBust(localStorage.getItem('avatar_bust') || '1');
    syncBust();
    window.addEventListener('avatar-bust-changed', syncBust);
    return () => window.removeEventListener('avatar-bust-changed', syncBust);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchNotes() {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (isMounted) {
        if (!error && data) setNotes(data);
        setLoading(false);
      }
    }

    fetchNotes();

    const channel = supabase
      .channel('public-notes-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setNotes((prev) => [payload.new as Note, ...prev.filter((n) => n.id !== payload.new.id)]);
        } else if (payload.eventType === 'UPDATE') {
          setNotes((prev) => prev.map((n) => (n.id === payload.new.id ? (payload.new as Note) : n)));
        } else if (payload.eventType === 'DELETE') {
          setNotes((prev) => prev.filter((n) => n.id !== payload.old.id));
        }
      })
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
    await supabase.from('notes').insert([{ content: newContent.trim(), author }]);
    setNewContent('');
  };

  const saveEdit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, content: editContent.trim() } : n)));
    setEditingId(null);
    await supabase.from('notes').update({ content: editContent.trim() }).eq('id', id);
  };

  const deleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await supabase.from('notes').delete().eq('id', id);
  };

  const toggleHeart = async (note: Note) => {
    const currentHearts = note.hearted_by || [];
    const newHearts = currentHearts.includes(currentUser)
      ? currentHearts.filter((u) => u !== currentUser)
      : [...currentHearts, currentUser];
    setNotes(notes.map((n) => (n.id === note.id ? { ...n, hearted_by: newHearts } : n)));
    await supabase.from('notes').update({ hearted_by: newHearts }).eq('id', note.id);
  };

  const postReply = async (content: string, note: Note) => {
    const author = currentUser === 'Michael' ? 'Texas' : 'Kanagawa';
    const newComment: ThreadComment = {
      id: generateId(),
      author,
      content,
      created_at: getNowIso(),
    };
    const newComments = [...(note.comments || []), newComment];
    setNotes(notes.map((n) => (n.id === note.id ? { ...n, comments: newComments } : n)));
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
              placeholder={lang === 'ja' ? 'メッセージを残す...' : 'Drop a note...'}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="flex-1 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-stone-200 focus:outline-none focus:border-stone-500"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg bg-stone-200 text-zinc-950 text-sm font-medium hover:bg-white transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{lang === 'ja' ? '送信' : 'Send'}</span>
            </button>
          </form>

          <div className="space-y-4">
            {notes.length === 0 ? (
              <p className="text-xs text-stone-600 font-mono text-center py-4">
                No notes recorded yet.
              </p>
            ) : (
              notes.map((note) => {
                const isEditing = editingId === note.id;
                const baseAvatar = AVATARS[note.author as keyof typeof AVATARS] || AVATARS.Texas;

                return (
                  <div
                    key={note.id}
                    className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 flex flex-col gap-3 transition-all hover:bg-zinc-900/60 group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-stone-500/30 bg-zinc-900 shrink-0 mt-0.5 shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`${baseAvatar}?v=${avatarBust}`}
                          alt={note.author}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono text-stone-400 tracking-widest uppercase">
                            {note.author === 'Kanagawa' ? 'Tamae' : 'Michael'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-stone-600">
                              {new Date(note.created_at).toLocaleDateString()}
                            </span>
                            {!isEditing && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(note.id);
                                    setEditContent(note.content);
                                  }}
                                  title={lang === 'ja' ? '編集' : 'Edit'}
                                  className="p-1 text-stone-500 hover:text-amber-400 cursor-pointer"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteNote(note.id)}
                                  title={lang === 'ja' ? '削除' : 'Delete'}
                                  className="p-1 text-stone-500 hover:text-red-400 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {isEditing ? (
                          <form onSubmit={(e) => saveEdit(e, note.id)} className="flex items-center gap-2 mt-1">
                            <input
                              type="text"
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="flex-1 p-2 rounded-lg bg-zinc-950 border border-amber-900/50 text-sm text-stone-200 focus:outline-none focus:border-amber-500"
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
                              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-stone-300 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        ) : (
                          <p className="text-sm text-stone-200 leading-relaxed whitespace-pre-wrap">
                            {note.content}
                          </p>
                        )}

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
                );
              })
            )}
          </div>
        </>
      )}
    </CollapsibleSection>
  );
}