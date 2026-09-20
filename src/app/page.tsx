'use client';

import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import SanctuaryStatus from '@/components/SanctuaryStatus';
import CountdownTicker from '@/components/CountdownTicker';
import DualZoneCalendar from '@/components/DualZoneCalendar';
import MilestoneTracker from '@/components/MilestoneTracker';
import ItineraryTracker from '@/components/ItineraryTracker';
import MemoryVault from '@/components/MemoryVault';
import SanctuaryNotes from '@/components/SanctuaryNotes';
import { supabase } from '@/lib/supabase';
import { Sparkles, Lock } from 'lucide-react';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const { error } = await supabase.auth.signInWithPassword({
      email: 'sync@en-musubi.local',
      password: passcode,
    });

    if (error) setError('Incorrect passcode.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-600 font-mono text-xs tracking-widest uppercase">
        Establishing Sanctuary...
      </div>
    );
  }

  // The locked gateway
  if (!session) {
    return (
      <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 selection:bg-zinc-800 relative overflow-hidden">
        <div className="absolute w-125 h-125 bg-purple-950/20 rounded-full blur-3xl pointer-events-none -top-48 -left-48"></div>
        <div className="absolute w-125 h-125 bg-blue-950/10 rounded-full blur-3xl pointer-events-none -bottom-48 -right-48"></div>

        <div className="w-full max-w-sm p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-xl shadow-2xl text-center relative z-10">
          <div className="inline-flex p-3 rounded-xl bg-zinc-950 border border-zinc-800/60 mb-6 text-zinc-400">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          
          <h1 className="text-3xl font-light tracking-widest text-zinc-100 mb-2">縁結び</h1>
          <p className="text-zinc-500 tracking-wider text-[10px] mb-8 uppercase font-mono">Texas — Kanagawa Sanctuary</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Passcode"
              className="w-full p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-200 text-center text-sm font-mono tracking-widest focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-zinc-700"
            />
            <button 
              type="submit" 
              className="w-full py-3 rounded-xl bg-zinc-100 text-zinc-950 font-medium text-sm hover:bg-white hover:shadow-lg hover:shadow-zinc-100/10 transition-all"
            >
              Connect
            </button>
            {error && <p className="text-red-400 text-xs font-mono mt-3">{error}</p>}
          </form>
        </div>
      </main>
    );
  }

  // The unlocked dashboard
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center p-6 md:p-16 selection:bg-zinc-800 relative overflow-hidden">
      <div className="absolute w-200 h-200 bg-purple-950/10 rounded-full blur-3xl pointer-events-none -top-96 left-1/2 -translate-x-1/2"></div>

      <div className="w-full max-w-4xl mb-6 flex justify-between items-end border-b border-zinc-900 pb-6 relative z-10">
        <div>
          <h1 className="text-3xl font-light tracking-widest text-zinc-100">
            縁結び
          </h1>
          <p className="text-zinc-500 text-xs font-mono mt-1">Texas — Kanagawa Logistical Bridge</p>
        </div>

        <button 
          onClick={() => supabase.auth.signOut()} 
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-900/60 border border-zinc-800/60 px-3 py-1.5 rounded-lg transition-all mb-1"
        >
          <Lock className="w-3 h-3" />
          <span>Lock</span>
        </button>
      </div>
      
      <div className="w-full max-w-4xl space-y-6 relative z-10">
        <SanctuaryStatus />
        <CountdownTicker />
        <DualZoneCalendar />
        <MilestoneTracker />
        <ItineraryTracker />
        <MemoryVault />
        <SanctuaryNotes />
      </div>
    </main>
  );
}