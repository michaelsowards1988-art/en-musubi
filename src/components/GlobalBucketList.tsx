'use client';

import { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Loader2, Sparkles, MapPin, Heart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CollapsibleSection from './CollapsibleSection';

interface Destination {
  id: string;
  title: string;
  creator: string;
  interested_users: string[];
  status: 'planned' | 'experienced';
}

interface GlobalBucketListProps {
  currentUser: 'Michael' | 'Tamae';
  lang: 'en' | 'ja';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

const AVATARS = {
  Tamae: 'https://sizdewlxjcfdekzzdofw.supabase.co/storage/v1/object/public/photos/Tamae.png',
  Michael: 'https://sizdewlxjcfdekzzdofw.supabase.co/storage/v1/object/public/photos/Michael.png'
};

export default function GlobalBucketList({ currentUser, lang, title, subtitle, icon }: GlobalBucketListProps) {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [burstingIds, setBurstingIds] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const { data, error } = await supabase
        .from('global_bucket_list')
        .select('*')
        .order('created_at', { ascending: true });

      if (isMounted) {
        if (!error && data) setDestinations(data);
        setLoading(false);
      }
    }

    loadData();

    const channel = supabase
      .channel('public:global_bucket_list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'global_bucket_list' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDestinations((prev) => [...prev, payload.new as Destination]);
          } else if (payload.eventType === 'UPDATE') {
            setDestinations((prev) => prev.map((d) => (d.id === payload.new.id ? payload.new as Destination : d)));
          } else if (payload.eventType === 'DELETE') {
            setDestinations((prev) => prev.filter((d) => d.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const addDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const { error } = await supabase
      .from('global_bucket_list')
      .insert([{ 
        title: newTitle, 
        creator: currentUser,
        interested_users: [currentUser],
        status: 'planned' 
      }]);

    if (!error) {
      setNewTitle('');
      setIsAdding(false);
    }
  };

  const joinWish = async (item: Destination) => {
    if (item.interested_users.includes(currentUser)) return;
    
    // Trigger local burst animation
    setBurstingIds(prev => [...prev, item.id]);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([30, 50, 30]);

    const newInterested = [...item.interested_users, currentUser];
    
    // Optimistic UI update
    setDestinations(destinations.map(d => d.id === item.id ? { ...d, interested_users: newInterested } : d));
    
    await supabase.from('global_bucket_list').update({ interested_users: newInterested }).eq('id', item.id);

    setTimeout(() => {
      setBurstingIds(prev => prev.filter(bId => bId !== item.id));
    }, 1500);
  };

  const toggleStatus = async (id: string, currentStatus: Destination['status']) => {
    const nextStatus: Destination['status'] = currentStatus === 'experienced' ? 'planned' : 'experienced';
    setDestinations(destinations.map(d => d.id === id ? { ...d, status: nextStatus } : d));
    await supabase.from('global_bucket_list').update({ status: nextStatus }).eq('id', id);
  };

  const actionButton = (
    <button onClick={() => { if (!isOpen) { setIsOpen(true); setIsAdding(true); } else setIsAdding(!isAdding); }} className="flex items-center gap-1.5 text-xs font-mono bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-all cursor-pointer">
      <Plus className="w-3.5 h-3.5" />
      <span className="hidden md:inline">{lang === 'ja' ? '場所を追加' : 'Add Destination'}</span>
      <span className="md:hidden">{lang === 'ja' ? '追加' : 'Add'}</span>
    </button>
  );

  return (
    <CollapsibleSection
      title={title}
      subtitle={subtitle}
      icon={icon}
      isControlled={true}
      isOpen={isOpen}
      onToggle={setIsOpen}
      actionButton={actionButton}
    >
      {loading ? (
        <div className="flex items-center justify-center text-zinc-500 font-mono text-xs py-4">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Syncing Global Map...
        </div>
      ) : (
        <div className="relative">
          {/* Ambient Globe Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/globe.svg" alt="Globe" className="w-[150%] h-auto max-w-none animate-[spin_240s_linear_infinite]" />
          </div>

          {/* Sparkle CSS for the mutual spark */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes bucketBurst {
              0% { transform: translate(0, 0) scale(1); opacity: 1; }
              100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
            }
          `}} />

          {isAdding && (
            <form onSubmit={addDestination} className="mb-4 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex gap-3 relative z-10 backdrop-blur-md">
              <input type="text" placeholder={lang === 'ja' ? '国や都市名...' : 'Country or City...'} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="flex-1 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-stone-500" autoFocus />
              <button type="submit" className="px-4 py-2.5 rounded-lg bg-zinc-100 text-zinc-950 text-sm font-medium hover:bg-white transition-all flex items-center gap-2 cursor-pointer">
                <MapPin className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </form>
          )}

          <div className="space-y-3 relative z-10">
            {destinations.length === 0 ? (
              <p className="text-xs text-stone-600 font-mono text-center py-8">No destinations added yet.</p>
            ) : (
              destinations.map((item) => {
                const isShared = item.interested_users.length > 1;
                const isMineOnly = item.interested_users.includes(currentUser) && !isShared;
                const isPartnerOnly = !item.interested_users.includes(currentUser);
                const isExperienced = item.status === 'experienced';

                return (
                  <div 
                    key={item.id} 
                    className={`relative p-4 rounded-xl border transition-all duration-700 overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4
                      ${isExperienced ? 'bg-zinc-950/80 border-zinc-900 opacity-60' : 
                        isShared ? 'bg-amber-950/20 border-amber-900/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 
                        'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div onClick={() => toggleStatus(item.id, item.status)} className="cursor-pointer shrink-0">
                        {isExperienced ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 transition-transform hover:scale-110" />
                        ) : (
                          <MapPin className={`w-5 h-5 transition-transform hover:scale-110 ${isShared ? 'text-amber-500' : 'text-zinc-500'}`} />
                        )}
                      </div>
                      <span className={`text-base font-medium transition-colors ${isExperienced ? 'text-zinc-500 line-through' : isShared ? 'text-amber-100' : 'text-zinc-200'}`}>
                        {item.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 ml-8 md:ml-0 relative">
                      {/* Avatar Display */}
                      <div className="flex -space-x-2">
                        {item.interested_users.map(user => (
                          <div key={user} className={`w-7 h-7 rounded-full border-2 overflow-hidden ${isShared ? 'border-amber-600' : 'border-zinc-700'}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={AVATARS[user as keyof typeof AVATARS]} alt={user} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>

                      {/* Action Button for Unshared Items */}
                      {!isShared && isPartnerOnly && !isExperienced && (
                        <button 
                          onClick={() => joinWish(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-amber-900/50 hover:text-amber-400 text-xs font-mono text-zinc-300 transition-all cursor-pointer border border-transparent hover:border-amber-700/50"
                        >
                          <Heart className="w-3.5 h-3.5" />
                          {lang === 'ja' ? '私も！' : 'Me too!'}
                        </button>
                      )}
                      
                      {!isShared && isMineOnly && !isExperienced && (
                        <span className="text-[10px] font-mono text-zinc-600 border border-zinc-800 px-2 py-1 rounded bg-zinc-950">
                          {lang === 'ja' ? '待機中...' : 'Waiting...'}
                        </span>
                      )}

                      {/* Mutual Spark Animation Overlay */}
                      {burstingIds.includes(item.id) && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-50">
                          <Sparkles className="w-6 h-6 text-amber-400 animate-ping absolute" />
                          {[...Array(12)].map((_, i) => {
                            const angle = (i * 30) * (Math.PI / 180);
                            const distance = 30 + Math.random() * 20;
                            const x = Math.cos(angle) * distance;
                            const y = Math.sin(angle) * distance;
                            return (
                              <div
                                key={i}
                                className="absolute w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(252,211,77,1)]"
                                style={{
                                  animation: `bucketBurst 1s ease-out forwards`,
                                  '--tx': `${x}px`,
                                  '--ty': `${y}px`,
                                } as React.CSSProperties}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
}