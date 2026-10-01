'use client';

import { useState, useEffect } from 'react';
import { Session, RealtimeChannel } from '@supabase/supabase-js';
import SanctuaryStatus from '@/components/SanctuaryStatus';
import WeeklyUnlock from '@/components/WeeklyUnlock';
import CountdownTicker from '@/components/CountdownTicker';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import MilestoneTracker from '@/components/MilestoneTracker';
import KeySuccessFactors from '@/components/KeySuccessFactors';
import ItineraryTracker from '@/components/ItineraryTracker';
import MemoryVault from '@/components/MemoryVault';
import SanctuaryNotes from '@/components/SanctuaryNotes';
import CollapsibleSection from '@/components/CollapsibleSection';
import { supabase } from '@/lib/supabase';
import { Sparkles, Globe2, Target, Lightbulb, Plane, Image as ImageIcon, MessageSquare, CalendarDays } from 'lucide-react';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [lang, setLang] = useState<'en' | 'ja'>('ja'); 
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [presenceChannel, setPresenceChannel] = useState<RealtimeChannel | null>(null);

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

  const currentUser = session?.user?.email === 'michael@en-musubi.local' ? 'Michael' : 'Tamae';

  // Smart Language Initialization
  useEffect(() => {
    if (session) {
      const savedLang = localStorage.getItem('preferredLang');
      if (savedLang === 'en' || savedLang === 'ja') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLang(savedLang);
      } else {
        setLang(currentUser === 'Michael' ? 'en' : 'ja');
      }
    }
  }, [session, currentUser]);

  // Realtime Presence & Remote Refresh Listener
  useEffect(() => {
    if (!session) return;

    const channel = supabase.channel('online-presence', {
      config: { presence: { key: currentUser } },
    });
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPresenceChannel(channel);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineUsers(Object.keys(state));
      })
      .on('broadcast', { event: 'force-refresh' }, () => {
        window.location.reload();
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online: true });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, currentUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    let targetEmail = 'sync@en-musubi.local'; 
    if (passcode === 'enmusubi') {
      targetEmail = 'michael@en-musubi.local'; 
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: passcode,
    });

    if (error) setError('Incorrect passcode.');
  };

  const handleSetDefaultLang = () => {
    localStorage.setItem('preferredLang', lang);
    alert(lang === 'ja' ? 'デフォルト言語を保存しました！' : 'Default language saved!');
  };

  const handleAdminSync = async () => {
    if (presenceChannel) {
      await presenceChannel.send({
        type: 'broadcast',
        event: 'force-refresh',
        payload: { action: 'refresh' },
      });
      window.location.reload();
    }
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
      sync: "Availability",
      sync_sub: "Blackout dates and target visits",
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
      sync: "スケジュール調整",
      sync_sub: "訪問可能日と予定",
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

  if (!session) {
    return (
      <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 selection:bg-stone-800 relative overflow-hidden">
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

  const tamaeOnline = onlineUsers.includes('Tamae');
  const michaelOnline = onlineUsers.includes('Michael');
  const bothOnline = tamaeOnline && michaelOnline;

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center p-6 md:p-16 selection:bg-stone-800 relative overflow-hidden text-stone-100">
      <div className="absolute w-200 h-200 bg-stone-800/10 rounded-full blur-3xl pointer-events-none -top-96 left-1/2 -translate-x-1/2"></div>

      <div className="w-full max-w-4xl mb-6 flex justify-between items-end border-b border-zinc-900 pb-6 relative z-10">
        <div>
          <h1 className="text-4xl font-bold tracking-widest text-stone-100 flex items-center gap-4">
            縁結び 
            
            <div className="flex items-center">
              <span className={`relative z-10 w-11 h-11 rounded-full overflow-hidden border-2 inline-block shrink-0 transition-all duration-700 ${tamaeOnline ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-110' : 'border-stone-500/40 bg-zinc-900 shadow-md scale-100'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://sizdewlxjcfdekzzdofw.supabase.co/storage/v1/object/public/photos/Tamae.png" alt="Tamae" className="w-full h-full object-cover" />
              </span>
              
              <div className={`transition-all duration-1000 h-0.5 ${bothOnline ? 'w-6 bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'w-3 bg-transparent'}`}></div>
              
              <span className={`relative z-10 w-11 h-11 rounded-full overflow-hidden border-2 inline-block shrink-0 transition-all duration-700 ${michaelOnline ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-110' : 'border-stone-500/40 bg-zinc-900 shadow-md scale-100'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://sizdewlxjcfdekzzdofw.supabase.co/storage/v1/object/public/photos/Michael.png" alt="Michael" className="w-full h-full object-cover" />
              </span>
            </div>

          </h1>
          <p className="text-stone-400 text-sm font-mono mt-2 tracking-wider font-medium">{currentLang.title}</p>
        </div>

        <div className="flex flex-col items-end gap-1 mb-1">
          <button 
            onClick={() => setLang(prev => prev === 'en' ? 'ja' : 'en')} 
            className="flex items-center gap-2 text-sm text-stone-300 hover:text-white bg-zinc-900/90 border border-zinc-800 px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Globe2 className="w-4 h-4 text-stone-400" />
            <span className="font-medium">{currentLang.langToggle}</span>
          </button>
          
          <div className="flex items-center gap-3 mt-1">
            {currentUser === 'Michael' && (
              <button 
                onClick={handleAdminSync}
                className="text-[10px] text-red-500/70 hover:text-red-400 transition-colors uppercase font-mono tracking-wider cursor-pointer"
              >
                Force Remote Sync
              </button>
            )}
            <button 
              onClick={handleSetDefaultLang}
              className="text-[10px] text-stone-500 hover:text-stone-300 transition-colors uppercase font-mono tracking-wider cursor-pointer"
            >
              {lang === 'ja' ? 'デフォルトにする' : 'Make Default'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="w-full max-w-4xl space-y-6 relative z-10">
        <SanctuaryStatus lang={lang} currentUser={currentUser} />
        
        <WeeklyUnlock lang={lang} currentUser={currentUser} />
        
        <CountdownTicker lang={lang} />

        <MilestoneTracker 
          currentUser={currentUser} 
          title={currentLang.milestones} 
          subtitle={currentLang.milestones_sub} 
          icon={<Target className="w-5 h-5" />} 
        />

        <MemoryVault 
          currentUser={currentUser} 
          title={currentLang.vault} 
          subtitle={currentLang.vault_sub} 
          icon={<ImageIcon className="w-5 h-5" />} 
        />

        <CollapsibleSection title={currentLang.notes} subtitle={currentLang.notes_sub} icon={<MessageSquare className="w-5 h-5" />} defaultOpen={false}>
          <SanctuaryNotes currentUser={currentUser} />
        </CollapsibleSection>

        <CollapsibleSection title={currentLang.sync} subtitle={currentLang.sync_sub} icon={<CalendarDays className="w-5 h-5" />} defaultOpen={false}>
          <AvailabilityCalendar currentUser={currentUser} lang={lang} />
        </CollapsibleSection>

        <ItineraryTracker 
          currentUser={currentUser} 
          title={currentLang.travel} 
          subtitle={currentLang.travel_sub} 
          icon={<Plane className="w-5 h-5" />} 
        />

        <KeySuccessFactors 
          title={currentLang.ksf} 
          subtitle={currentLang.ksf_sub} 
          icon={<Lightbulb className="w-5 h-5" />} 
        />
      </div>
    </main>
  );
}