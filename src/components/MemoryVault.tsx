'use client';

import { useState, useEffect } from 'react';
import { Image as ImageIcon, Plus, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Memory {
  id: string;
  image_url: string;
  caption: string;
  location: string;
  created_at: string;
}

export default function MemoryVault() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [location, setLocation] = useState('Texas');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchMemories() {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('created_at', { ascending: false });

      if (isMounted) {
        if (!error && data) {
          setMemories(data);
        }
        setLoading(false);
      }
    }

    fetchMemories();

    const channel = supabase
      .channel('public:memories')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'memories' },
        (payload) => {
          const newMemory = payload.new as Memory;
          setMemories((prev) => [newMemory, ...prev]);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const addMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl || !caption) return;

    await supabase
      .from('memories')
      .insert([{ image_url: imageUrl, caption, location }]);

    setImageUrl('');
    setCaption('');
    setIsAdding(false);
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl p-8 rounded-2xl bg-zinc-950 text-zinc-500 border border-zinc-800 shadow-2xl mt-8 flex items-center justify-center font-mono text-xs">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading Memory Vault...
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl p-6 rounded-2xl bg-zinc-950 text-zinc-100 border border-zinc-800 shadow-2xl mt-8">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/50">
        <div>
          <h2 className="text-xl font-light tracking-wide text-zinc-200">Memory Vault</h2>
          <p className="text-sm text-zinc-500 mt-1">Captured moments across Texas and Kanagawa</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 text-xs font-mono bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Moment</span>
          </button>
          <ImageIcon className="w-5 h-5 text-zinc-600" />
        </div>
      </div>

      {isAdding && (
        <form onSubmit={addMemory} className="mb-6 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-3">
          <div className="flex gap-3">
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 focus:outline-none focus:border-purple-500"
            >
              <option value="Texas">Texas</option>
              <option value="Kanagawa">Kanagawa</option>
            </select>
            <input
              type="text"
              placeholder="Image URL (direct link)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="flex-1 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>
          <input
            type="text"
            placeholder="Caption (e.g., Sunset walk by the lake)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
          />
          <button type="submit" className="py-2.5 rounded-lg bg-zinc-100 text-zinc-950 text-sm font-medium hover:bg-white transition-all flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Save to Vault</span>
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {memories.length === 0 ? (
          <p className="text-xs text-zinc-600 font-mono text-center py-8 col-span-2">No memories logged in the vault yet.</p>
        ) : (
          memories.map((memory) => (
            <div key={memory.id} className="rounded-xl overflow-hidden bg-zinc-900/40 border border-zinc-800/40 group">
              <div className="h-48 overflow-hidden relative bg-zinc-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={memory.image_url} 
                  alt={memory.caption} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" 
                />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-950/80 backdrop-blur-md text-zinc-300 border border-zinc-800">
                  {memory.location}
                </span>
              </div>
              <div className="p-4">
                <p className="text-sm font-medium text-zinc-200">{memory.caption}</p>
                <span className="block text-[10px] font-mono text-zinc-600 mt-2">
                  {new Date(memory.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}