'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Note {
  id: string;
  content: string;
  author: string;
  created_at: string;
}

export default function SanctuaryNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newContent, setNewContent] = useState('');
  const [author, setAuthor] = useState('Texas');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchNotes() {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (isMounted) {
        if (!error && data) {
          setNotes(data);
        }
        setLoading(false);
      }
    }

    fetchNotes();

    // Setup real-time listener
    const channel = supabase
      .channel('public:notes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notes' },
        (payload) => {
          const newNote = payload.new as Note;
          setNotes((prev) => [newNote, ...prev.filter((n) => n.id !== newNote.id)]);
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

    await supabase
      .from('notes')
      .insert([{ content: newContent, author }]);

    setNewContent('');
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl p-8 rounded-2xl bg-zinc-950 text-zinc-500 border border-zinc-800 shadow-2xl mt-8 flex items-center justify-center font-mono text-xs">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading Sanctuary Notes...
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl p-6 rounded-2xl bg-zinc-950 text-zinc-100 border border-zinc-800 shadow-2xl mt-8">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/50">
        <div>
          <h2 className="text-xl font-light tracking-wide text-zinc-200">Sanctuary Log</h2>
          <p className="text-sm text-zinc-500 mt-1">Shared notes and operational alignment</p>
        </div>
        <MessageSquare className="w-5 h-5 text-zinc-600" />
      </div>

      <form onSubmit={postNote} className="mb-6 flex flex-col md:flex-row gap-3">
        <select
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 focus:outline-none focus:border-purple-500"
        >
          <option value="Texas">Texas</option>
          <option value="Kanagawa">Kanagawa</option>
        </select>
        <input
          type="text"
          placeholder="Drop a note or update..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="flex-1 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
        />
        <button type="submit" className="px-4 py-2.5 rounded-lg bg-zinc-100 text-zinc-950 text-sm font-medium hover:bg-white transition-all flex items-center justify-center gap-2">
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-xs text-zinc-600 font-mono text-center py-4">No notes recorded yet.</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/40 flex items-start justify-between">
              <div>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-zinc-400 border border-zinc-800 mb-1.5">
                  {note.author}
                </span>
                <p className="text-sm text-zinc-200">{note.content}</p>
              </div>
              <span className="text-[10px] font-mono text-zinc-600">
                {new Date(note.created_at).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}