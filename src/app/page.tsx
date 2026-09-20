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
import { Sparkles, Globe2, Target, Lightbulb, Plane, Image as ImageIcon, MessageSquare, Clock } from 'lucide-react';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'en' | 'ja'>('en');

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

  const t = {
    en: {
      title: "Kanagawa — Texas",
      milestones: "Milestones",
      milestones_sub: "Upcoming horizon targets",
      ksf: "Key Success Factors",
      ksf_sub: "Core focuses and cornerstones",
      travel: "Travel & Itinerary",
      travel_sub: "Cross-Pacific flights",
      vault: "Memory Vault",
      vault_sub: "Moments across Kanagawa and Texas",
      notes: "Our Notes",
      notes_sub: "Shared thoughts and messages",
      sync: "Schedule Sync",
      sync_sub: "Coordinating JST & CDT time zones",
      langToggle: "日本語"
    },
    ja: {
      title: "神奈川 — テキサス",
      milestones: "マイルストーン",
      milestones_sub: "今後の目標",
      ksf: "成功の鍵",
      ksf_sub: "中心となる焦点",
      travel: "旅行と旅程",
      travel_sub: "太平洋横断フライト",
      vault: "私たちの記録",
      vault_sub: "神奈川とテキサスでの瞬間",
      notes: "私たちのノート",
      notes_sub: "共有する考えとメッセージ",
      sync: "スケジュール同期",
      sync_sub: "JSTとCDTのタイムゾーン調整",
      langToggle: "English"
    }
  };

  const currentLang = t[lang];

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-stone-400 font-mono text-sm tracking-widest uppercase">
        Establishing Connection...
      </div>
    );
  }

  // The locked gateway
  if (!session) {
    return (
      <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 selection:bg-stone-800 relative overflow-hidden">
        {/* Soft, warm ambient glow replacing neon purple/blue */}
        <div className="absolute w-125 h-125 bg-amber-900/10 rounded-full blur-3xl pointer-events-none -top-48 -left-48"></div>
        <div className="absolute w-125 h-125 bg-stone-800/20 rounded-full blur-3xl pointer-events-none -bottom-48 -right-48"></div>

        <div className="w-full max-w-sm p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl shadow-2xl text-center relative z-10">
          <div className="inline-flex p-3 rounded-xl bg-zinc-950 border border-zinc-800 mb-6 text-stone-300 shadow-inner">
            <Sparkles className="w-6 h-6 text-amber-600/80" />
          </div>
          
          <h1 className="text-4xl font-bold tracking-widest text-stone-100 mb-2">縁結び</h1>
          <p className="text-stone-400 tracking-wider text-sm mb-8 uppercase font-mono font-medium">Kanagawa — Texas</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Passcode"
              className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-stone-100 text-center text-base font-mono tracking-widest focus:outline-none focus:border-stone-500 transition-all placeholder:text-zinc-600 shadow-inner"
            />
            <button 
              type="submit" 
              className="w-full py-4 rounded-xl bg-stone-200 text-zinc-900 font-medium text-base hover:bg-white hover:shadow-lg hover:shadow-stone-100/10 transition-all cursor-pointer"
            >
              Connect
            </button>
            {error && <p className="text-red-400/80 text-sm font-mono mt-3">{error}</p>}
          </form>
        </div>
      </main>
    );
  }

  // The unlocked dashboard
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center p-6 md:p-16 selection:bg-stone-800 relative overflow-hidden text-stone-100">
      <div className="absolute w-200 h-200 bg-stone-800/10 rounded-full blur-3xl pointer-events-none -top-96 left-1/2 -translate-x-1/2"></div>

      <div className="w-full max-w-4xl mb-6 flex justify-between items-end border-b border-zinc-900 pb-6 relative z-10">
        <div>
          <h1 className="text-4xl font-bold tracking-widest text-stone-100 flex items-center gap-4">
            縁結び 
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full overflow-hidden border border-stone-500/40 bg-zinc-900 inline-block shadow-md shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://sizdewlxjcfdekzzdofw.supabase.co/storage/v1/object/public/photos/Tamae.png" alt="Tamae" className="w-full h-full object-cover" />
              </span>
              <span className="w-10 h-10 rounded-full overflow-hidden border border-stone-500/40 bg-zinc-900 inline-block shadow-md shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://sizdewlxjcfdekzzdofw.supabase.co/storage/v1/object/public/photos/Michael.png" alt="Michael" className="w-full h-full object-cover" />
              </span>
            </div>
          </h1>
          <p className="text-stone-400 text-sm font-mono mt-2 tracking-wider font-medium">{currentLang.title}</p>
        </div>

        <button 
          onClick={() => setLang(prev => prev === 'en' ? 'ja' : 'en')} 
          className="flex items-center gap-2 text-sm text-stone-300 hover:text-white bg-zinc-900/90 border border-zinc-800 px-4 py-2.5 rounded-xl transition-all mb-1 shadow-sm cursor-pointer"
        >
          <Globe2 className="w-4 h-4 text-stone-400" />
          <span className="font-medium">{currentLang.langToggle}</span>
        </button>
      </div>
      
      <div className="w-full max-w-4xl space-y-6 relative z-10">
        <SanctuaryStatus lang={lang} />
        <CountdownTicker lang={lang} />

        <CollapsibleSection title={currentLang.milestones} subtitle={currentLang.milestones_sub} icon={<Target className="w-5 h-5" />} defaultOpen={false}>
          <MilestoneTracker />
        </CollapsibleSection>

        <CollapsibleSection title={currentLang.ksf} subtitle={currentLang.ksf_sub} icon={<Lightbulb className="w-5 h-5" />} defaultOpen={false}>
          <KeySuccessFactors />
        </CollapsibleSection>

        <CollapsibleSection title={currentLang.travel} subtitle={currentLang.travel_sub} icon={<Plane className="w-5 h-5" />} defaultOpen={false}>
          <ItineraryTracker />
        </CollapsibleSection>

        <CollapsibleSection title={currentLang.vault} subtitle={currentLang.vault_sub} icon={<ImageIcon className="w-5 h-5" />} defaultOpen={false}>
          <MemoryVault />
        </CollapsibleSection>

        <CollapsibleSection title={currentLang.notes} subtitle={currentLang.notes_sub} icon={<MessageSquare className="w-5 h-5" />} defaultOpen={false}>
          <SanctuaryNotes />
        </CollapsibleSection>

        <CollapsibleSection title={currentLang.sync} subtitle={currentLang.sync_sub} icon={<Clock className="w-5 h-5" />} defaultOpen={false}>
          <DualZoneCalendar />
        </CollapsibleSection>
      </div>
    </main>
  );
}