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
        .limit(10);

      if (isMounted) {
        if (!error && data) {
          setNotes(data);
        }
        setLoading(false);
      }
    }

    fetchNotes();

    // Correct chaining order: .channel() -> .on() -> .subscribe()
    const channel = supabase
      .channel('public-notes-channel')
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
      <div className="flex items-center justify-center text-zinc-500 font-mono text-xs py-4">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading Notes...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800/40">
        <div>
          <h3 className="text-sm font-medium text-zinc-200">Our Notes</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Quick thoughts and messages back and forth</p>
        </div>
        <MessageSquare className="w-4 h-4 text-zinc-500" />
      </div>

      <form onSubmit={postNote} className="mb-4 flex flex-col md:flex-row gap-3">
        <select
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 focus:outline-none focus:border-stone-500"
        >
          <option value="Texas">Texas</option>
          <option value="Kanagawa">Kanagawa</option>
        </select>
        <input
          type="text"
          placeholder="Drop a note..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="flex-1 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-stone-500"
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