'use client';

import { useState, useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import SanctuaryStatus from '@/components/SanctuaryStatus';
import WeeklyUnlock from '@/components/WeeklyUnlock';
import CountdownTicker from '@/components/CountdownTicker';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import MilestoneTracker from '@/components/MilestoneTracker';
import KeySuccessFactors from '@/components/KeySuccessFactors';
import ItineraryTracker from '@/components/ItineraryTracker';
import MemoryVault from '@/components/MemoryVault';
import SanctuaryNotes from '@/components/SanctuaryNotes';
import { supabase } from '@/lib/supabase';
import { Globe2, Target, Lightbulb, Plane, Image as ImageIcon, MessageSquare, CalendarDays } from 'lucide-react';

interface DashboardProps {
  currentUser: 'Michael' | 'Tamae';
}

export default function Dashboard({ currentUser }: DashboardProps) {
  const [lang, setLang] = useState<'en' | 'ja'>('ja'); 
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [activeFlare, setActiveFlare] = useState<'Michael' | 'Tamae' | null>(null);
  const [screenPulse, setScreenPulse] = useState(false);
  
  // Using refs for background processes avoids triggering cascading re-renders
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const prevBothOnline = useRef(false);

  // Background Visibility Manager (Prevents Stale Data)
  useEffect(() => {
    let hiddenTimestamp = 0;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenTimestamp = Date.now();
      } else if (document.visibilityState === 'visible') {
        if (hiddenTimestamp && Date.now() - hiddenTimestamp > 60000) {
          window.location.reload();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Language Sync
  useEffect(() => {
    const savedLang = localStorage.getItem('preferredLang');
    const finalLang = (savedLang === 'en' || savedLang === 'ja') ? savedLang : (currentUser === 'Michael' ? 'en' : 'ja');
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLang(finalLang);
  }, [currentUser]);

  // Realtime Connection & Pokes
  useEffect(() => {
    const channel = supabase.channel('online-presence', {
      config: { presence: { key: currentUser } },
    });
    
    presenceChannelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineUsers(Object.keys(state));
      })
      .on('broadcast', { event: 'force-refresh' }, () => {
        window.location.reload();
      })
      .on('broadcast', { event: 'poke' }, ({ payload }) => {
        const { from, to } = payload;
        setActiveFlare(from);
        
        if (to === currentUser) {
          setScreenPulse(true);
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([30, 50, 30]);
        }
        
        setTimeout(() => {
          setActiveFlare(null);
          setScreenPulse(false);
        }, 1500);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ online: true });
      });

    return () => { supabase.removeChannel(channel); };
  }, [currentUser]);

  // Arrival Flash Logic: Triggers when the other person joins while you are already viewing
  const bothOnline = onlineUsers.includes('Tamae') && onlineUsers.includes('Michael');
  
  useEffect(() => {
    if (bothOnline && !prevBothOnline.current && onlineUsers.length > 0) {
      setTimeout(() => {
        setScreenPulse(true);
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([30, 50, 30]);
      }, 0);
      
      setTimeout(() => setScreenPulse(false), 1500);
    }
    prevBothOnline.current = bothOnline;
  }, [bothOnline, onlineUsers.length]);

  const handleSetDefaultLang = () => {
    localStorage.setItem('preferredLang', lang);
    alert(lang === 'ja' ? 'デフォルト言語を保存しました！' : 'Default language saved!');
  };

  const handleAdminSync = async () => {
    if (presenceChannelRef.current) {
      await presenceChannelRef.current.send({ type: 'broadcast', event: 'force-refresh', payload: { action: 'refresh' } });
      window.location.reload();
    }
  };

  const handlePoke = async (target: 'Michael' | 'Tamae') => {
    if (!bothOnline || !presenceChannelRef.current || target === currentUser) return;
    setActiveFlare(currentUser);
    setTimeout(() => setActiveFlare(null), 1500);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15); 
    await presenceChannelRef.current.send({ type: 'broadcast', event: 'poke', payload: { from: currentUser, to: target } });
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
  const tamaeOnline = onlineUsers.includes('Tamae');
  const michaelOnline = onlineUsers.includes('Michael');

  return (
    <div className="w-full flex flex-col items-center">
      {/* The Ambient Screen Ripple Overlay */}
      <div 
        className={`fixed inset-0 z-50 pointer-events-none transition-all duration-1000 ${
          screenPulse ? 'bg-amber-600/15 backdrop-brightness-110' : 'bg-transparent backdrop-brightness-100'
        }`}
      ></div>

      {/* Sticky Header - Flush with the top of the browser */}
      <div className="w-full sticky top-0 z-40 bg-zinc-950/85 backdrop-blur-xl border-b border-zinc-800/60 shadow-[0_10px_30px_rgba(0,0,0,0.5)] pt-6 pb-4 px-6 md:px-16">
        <div className="w-full max-w-4xl mx-auto flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold tracking-widest text-stone-100 flex items-center gap-4">
              縁結び 
              
              <div className="flex items-center">
                <div className="relative flex items-center justify-center">
                  {activeFlare === 'Tamae' && <div className="absolute w-11 h-11 rounded-full bg-amber-500 animate-ping opacity-75"></div>}
                  <span 
                    onClick={() => handlePoke('Tamae')}
                    className={`relative z-10 w-11 h-11 rounded-full overflow-hidden border-2 inline-block shrink-0 transition-all duration-700 
                      ${tamaeOnline ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-110' : 'border-stone-500/40 bg-zinc-900 shadow-md scale-100'}
                      ${bothOnline && currentUser === 'Michael' ? 'cursor-pointer hover:border-amber-400 hover:scale-110' : ''}
                    `}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://sizdewlxjcfdekzzdofw.supabase.co/storage/v1/object/public/photos/Tamae.png" alt="Tamae" className="w-full h-full object-cover" />
                  </span>
                </div>
                
                <div className={`transition-all duration-1000 h-0.5 ${bothOnline ? 'w-6 bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'w-3 bg-transparent'}`}></div>
                
                <div className="relative flex items-center justify-center">
                  {activeFlare === 'Michael' && <div className="absolute w-11 h-11 rounded-full bg-amber-500 animate-ping opacity-75"></div>}
                  <span 
                    onClick={() => handlePoke('Michael')}
                    className={`relative z-10 w-11 h-11 rounded-full overflow-hidden border-2 inline-block shrink-0 transition-all duration-700 
                      ${michaelOnline ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-110' : 'border-stone-500/40 bg-zinc-900 shadow-md scale-100'}
                      ${bothOnline && currentUser === 'Tamae' ? 'cursor-pointer hover:border-amber-400 hover:scale-110' : ''}
                    `}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://sizdewlxjcfdekzzdofw.supabase.co/storage/v1/object/public/photos/Michael.png" alt="Michael" className="w-full h-full object-cover" />
                  </span>
                </div>
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
      </div>
      
      {/* Main Content Area - Padding re-added here so modules are centered */}
      <div className="w-full px-6 md:px-16 pb-16 flex flex-col items-center">
        <div className="w-full max-w-4xl space-y-6 relative z-10">
          <SanctuaryStatus lang={lang} currentUser={currentUser} />
          
          <WeeklyUnlock lang={lang} currentUser={currentUser} />
          
          <CountdownTicker lang={lang} />

          <MilestoneTracker 
            currentUser={currentUser} 
            lang={lang}
            title={currentLang.milestones} 
            subtitle={currentLang.milestones_sub} 
            icon={<Target className="w-5 h-5" />} 
          />

          <MemoryVault 
            currentUser={currentUser} 
            lang={lang}
            title={currentLang.vault} 
            subtitle={currentLang.vault_sub} 
            icon={<ImageIcon className="w-5 h-5" />} 
          />

          <SanctuaryNotes 
            currentUser={currentUser} 
            lang={lang}
            title={currentLang.notes} 
            subtitle={currentLang.notes_sub} 
            icon={<MessageSquare className="w-5 h-5" />} 
          />

          <AvailabilityCalendar 
            currentUser={currentUser} 
            lang={lang} 
            title={currentLang.sync} 
            subtitle={currentLang.sync_sub} 
            icon={<CalendarDays className="w-5 h-5" />} 
          />

          <ItineraryTracker 
            currentUser={currentUser} 
            lang={lang}
            title={currentLang.travel} 
            subtitle={currentLang.travel_sub} 
            icon={<Plane className="w-5 h-5" />} 
          />

          <KeySuccessFactors 
            currentUser={currentUser}
            lang={lang}
            title={currentLang.ksf} 
            subtitle={currentLang.ksf_sub} 
            icon={<Lightbulb className="w-5 h-5" />} 
          />
        </div>
      </div>
    </div>
  );
}