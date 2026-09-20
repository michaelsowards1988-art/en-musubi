'use client';

import { useState, useEffect } from 'react';
import { Target, Calendar, CheckCircle2, Clock, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Milestone {
  id: string;
  title: string;
  target_date: string;
  status: 'planned' | 'in_progress' | 'achieved';
}

export default function MilestoneTracker() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .order('target_date', { ascending: true });

      if (isMounted) {
        if (!error && data) {
          setMilestones(data);
        }
        setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleStatus = async (id: string, currentStatus: Milestone['status']) => {
    const nextStatus: Milestone['status'] = currentStatus === 'achieved' ? 'planned' : 'achieved';
    
    // Optimistic UI update
    setMilestones(milestones.map(m => m.id === id ? { ...m, status: nextStatus } : m));

    await supabase
      .from('milestones')
      .update({ status: nextStatus })
      .eq('id', id);
  };

  const addMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate) return;

    const { data, error } = await supabase
      .from('milestones')
      .insert([{ title: newTitle, target_date: newDate, status: 'planned' }])
      .select();

    if (!error && data) {
      setMilestones([...milestones, data[0] as Milestone]);
      setNewTitle('');
      setNewDate('');
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl p-8 rounded-2xl bg-zinc-950 text-zinc-500 border border-zinc-800 shadow-2xl mt-8 flex items-center justify-center font-mono text-xs">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading Milestones...
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl p-6 rounded-2xl bg-zinc-950 text-zinc-100 border border-zinc-800 shadow-2xl mt-8">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/50">
        <div>
          <h2 className="text-xl font-light tracking-wide text-zinc-200">Key Success Factors</h2>
          <p className="text-sm text-zinc-500 mt-1">Upcoming logistical milestones & horizon targets</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 text-xs font-mono bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Target</span>
          </button>
          <Target className="w-5 h-5 text-zinc-600" />
        </div>
      </div>

      {isAdding && (
        <form onSubmit={addMilestone} className="mb-6 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Milestone title (e.g., Summer Visit)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
          />
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm font-mono text-zinc-200 focus:outline-none focus:border-purple-500"
          />
          <button type="submit" className="px-4 py-2.5 rounded-lg bg-zinc-100 text-zinc-950 text-sm font-medium hover:bg-white transition-all">
            Save
          </button>
        </form>
      )}

      <div className="space-y-3">
        {milestones.map((item) => (
          <div 
            key={item.id} 
            onClick={() => toggleStatus(item.id, item.status)}
            className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/40 hover:border-zinc-700/60 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              {item.status === 'achieved' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 transition-transform group-hover:scale-110" />
              ) : (
                <Clock className="w-4 h-4 text-zinc-500 transition-transform group-hover:scale-110" />
              )}
              <span className={`text-sm font-medium transition-colors ${item.status === 'achieved' ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                {item.title}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800/60">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>{item.target_date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}