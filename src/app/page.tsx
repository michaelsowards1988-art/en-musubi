'use client';

import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import SanctuaryStatus from '@/components/SanctuaryStatus';
import CountdownTicker from '@/components/CountdownTicker';
import DualZoneCalendar from '@/components/DualZoneCalendar';
import MilestoneTracker from '@/components/MilestoneTracker';
import KeySuccessFactors from '@/components/KeySuccessFactors';
import ItineraryTracker from '@/components/ItineraryTracker';
import MemoryVault from '@/components/MemoryVault';
import SanctuaryNotes from '@/components/SanctuaryNotes';
import CollapsibleSection from '@/components/CollapsibleSection';
import { supabase } from '@/lib/supabase';
import { Sparkles, Lock, Target, Lightbulb, Plane, Image as ImageIcon, MessageSquare, Clock } from 'lucide-react';

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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 font-mono text-xs tracking-widest uppercase">
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
          <div className="inline-flex p-3 rounded-xl bg-zinc-950 border border-zinc-800/60 mb-6 text-zinc-300">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          
          <h1 className="text-3xl font-light tracking-widest text-zinc-100 mb-2">縁結び</h1>
          <p className="text-zinc-400 tracking-wider text-[11px] mb-8 uppercase font-mono">Texas — Kanagawa Sanctuary</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Passcode"
              className="w-full p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-center text-sm font-mono tracking-widest focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-zinc-600 shadow-inner"
            />
            <button 
              type="submit" 
              className="w-full py-3.5 rounded-xl bg-zinc-100 text-zinc-950 font-medium text-sm hover:bg-white hover:shadow-lg hover:shadow-zinc-100/10 transition-all cursor-pointer"
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
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center p-6 md:p-16 selection:bg-zinc-800 relative overflow-hidden text-zinc-100">
      <div className="absolute w-200 h-200 bg-purple-950/10 rounded-full blur-3xl pointer-events-none -top-96 left-1/2 -translate-x-1/2"></div>

      <div className="w-full max-w-4xl mb-6 flex justify-between items-end border-b border-zinc-900 pb-6 relative z-10">
        <div>
          <h1 className="text-3xl font-light tracking-widest text-zinc-100 flex items-center gap-3">
            縁結び 
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full overflow-hidden border border-purple-500/40 bg-zinc-900 inline-block shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://sizdewlxjcfdekzzdofw.supabase.co/storage/v1/object/public/photos/Michael.png" alt="Michael" className="w-full h-full object-cover" />
              </span>
              <span className="w-8 h-8 rounded-full overflow-hidden border border-purple-500/40 bg-zinc-900 inline-block shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://sizdewlxjcfdekzzdofw.supabase.co/storage/v1/object/public/photos/Tamae.png" alt="Tamae" className="w-full h-full object-cover" />
              </span>
            </div>
          </h1>
          <p className="text-zinc-400 text-xs font-mono mt-1 tracking-wide">Texas — Kanagawa Sanctuary</p>
        </div>

        <button 
          onClick={() => supabase.auth.signOut()} 
          className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-zinc-100 bg-zinc-900/80 border border-zinc-800 px-3.5 py-2 rounded-xl transition-all mb-1 shadow-sm cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5 text-zinc-400" />
          <span>Lock</span>
        </button>
      </div>
      
      <div className="w-full max-w-4xl space-y-6 relative z-10">
        <SanctuaryStatus />
        <CountdownTicker />

        <CollapsibleSection title="Milestones" subtitle="Upcoming horizon targets" icon={<Target className="w-4 h-4" />} defaultOpen={false}>
          <MilestoneTracker />
        </CollapsibleSection>

        <CollapsibleSection title="Key Success Factors" subtitle="Core focuses and cornerstones" icon={<Lightbulb className="w-4 h-4" />} defaultOpen={false}>
          <KeySuccessFactors />
        </CollapsibleSection>

        <CollapsibleSection title="Travel & Itinerary" subtitle="Cross-Pacific flights" icon={<Plane className="w-4 h-4" />} defaultOpen={false}>
          <ItineraryTracker />
        </CollapsibleSection>

        <CollapsibleSection title="Memory Vault" subtitle="Moments across Texas and Kanagawa" icon={<ImageIcon className="w-4 h-4" />} defaultOpen={false}>
          <MemoryVault />
        </CollapsibleSection>

        <CollapsibleSection title="Our Notes" subtitle="Shared thoughts and messages" icon={<MessageSquare className="w-4 h-4" />} defaultOpen={false}>
          <SanctuaryNotes />
        </CollapsibleSection>

        <CollapsibleSection title="Schedule Sync" subtitle="Coordinating CDT & JST time zones" icon={<Clock className="w-4 h-4" />} defaultOpen={false}>
          <DualZoneCalendar />
        </CollapsibleSection>
      </div>
    </main>
  );
}