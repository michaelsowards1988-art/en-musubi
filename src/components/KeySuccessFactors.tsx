'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, Plus, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Factor {
  id: string;
  title: string;
  status: 'active' | 'achieved';
}

export default function KeySuccessFactors() {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const { data, error } = await supabase
        .from('success_factors')
        .select('*')
        .order('created_at', { ascending: true });

      if (isMounted) {
        if (!error && data) {
          setFactors(data);
        }
        setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleStatus = async (id: string, currentStatus: Factor['status']) => {
    const nextStatus: Factor['status'] = currentStatus === 'achieved' ? 'active' : 'achieved';
    
    setFactors(factors.map(f => f.id === id ? { ...f, status: nextStatus } : f));

    await supabase
      .from('success_factors')
      .update({ status: nextStatus })
      .eq('id', id);
  };

  const addFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const { data, error } = await supabase
      .from('success_factors')
      .insert([{ title: newTitle, status: 'active' }])
      .select();

    if (!error && data) {
      setFactors([...factors, data[0] as Factor]);
      setNewTitle('');
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center text-zinc-500 font-mono text-xs py-4">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading Key Success Factors...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800/40">
        <div>
          <h3 className="text-sm font-medium text-zinc-200">Key Success Factors</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Core focuses and relationship cornerstones</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 text-xs font-mono bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Focus</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={addFactor} className="mb-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex gap-3">
          <input
            type="text"
            placeholder="Focus area (e.g., Daily Japanese & English practice)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-stone-500"
          />
          <button type="submit" className="px-4 py-2.5 rounded-lg bg-zinc-100 text-zinc-950 text-sm font-medium hover:bg-white transition-all flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Save</span>
          </button>
        </form>
      )}

      <div className="space-y-3">
        {factors.map((item) => (
          <div 
            key={item.id} 
            onClick={() => toggleStatus(item.id, item.status)}
            className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/40 hover:border-zinc-700/60 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              {item.status === 'achieved' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 transition-transform group-hover:scale-110" />
              ) : (
                <Lightbulb className="w-4 h-4 text-purple-400 transition-transform group-hover:scale-110" />
              )}
              <span className={`text-sm font-medium transition-colors ${item.status === 'achieved' ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                {item.title}
              </span>
            </div>

            <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800/60 text-zinc-400">
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}