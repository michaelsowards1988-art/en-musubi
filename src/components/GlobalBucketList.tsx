'use client';

import { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Loader2, Sparkles, MapPin, Heart, ChevronDown, ChevronUp, MessageCircle, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CollapsibleSection from './CollapsibleSection';
import { ThreadComment } from './ReactionThread';
import WorldMap from './WorldMap';

interface Idea {
  id: string;
  author: string;
  content: string;
  created_at: string;
  hearted_by?: string[];
  comments?: ThreadComment[];
}

interface Destination {
  id: string;
  title: string;
  creator: string;
  interested_users: string[];
  status: 'planned' | 'experienced';
  ideas: Idea[] | null;
  lat?: number;
  lng?: number;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
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
  Michael: 'https://sizdewlxjcfdekzzdofw.supabase.co/storage/v1/object/public/photos/Michael.png',
  Kanagawa: 'https://sizdewlxjcfdekzzdofw.supabase.co/storage/v1/object/public/photos/Tamae.png',
  Texas: 'https://sizdewlxjcfdekzzdofw.supabase.co/storage/v1/object/public/photos/Michael.png'
};

const generateId = () => Date.now().toString();
const getNowIso = () => new Date().toISOString();

export default function GlobalBucketList({ currentUser, lang, title, subtitle, icon }: GlobalBucketListProps) {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [burstingIds, setBurstingIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [expandedIdeaIds, setExpandedIdeaIds] = useState<string[]>([]);
  // Use a record to track reply input for each specific idea independently
  const [replyContents, setReplyContents] = useState<Record<string, string>>({});
  const [newIdea, setNewIdea] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<{lat: number, lng: number, name: string} | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      const { data, error } = await supabase.from('global_bucket_list').select('*').order('created_at', { ascending: true });
      if (isMounted) {
        if (!error && data) setDestinations(data);
        setLoading(false);
      }
    }
    loadData();

    const channel = supabase.channel('public:global_bucket_list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'global_bucket_list' }, (payload) => {
        if (payload.eventType === 'INSERT') setDestinations((prev) => [...prev, payload.new as Destination]);
        else if (payload.eventType === 'UPDATE') setDestinations((prev) => prev.map((d) => (d.id === payload.new.id ? payload.new as Destination : d)));
        else if (payload.eventType === 'DELETE') setDestinations((prev) => prev.filter((d) => d.id !== payload.old.id));
      }).subscribe();

    return () => { isMounted = false; supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2 || selectedPlace?.name === searchQuery) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults([]);
      return;
    }
    
    const delay = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&accept-language=${lang}`);
        const data = await res.json();
        setSearchResults(data);
      } catch (e) {
        console.error("Geocoding failed", e);
      } finally {
        setIsSearching(false);
      }
    }, 600);

    return () => clearTimeout(delay);
  }, [searchQuery, lang, selectedPlace]);

  const addDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlace) return;

    const { error } = await supabase
      .from('global_bucket_list')
      .insert([{ 
        title: selectedPlace.name, 
        creator: currentUser,
        interested_users: [currentUser],
        status: 'planned',
        ideas: [],
        lat: selectedPlace.lat,
        lng: selectedPlace.lng
      }]);

    if (!error) {
      setSearchQuery('');
      setSelectedPlace(null);
      setIsAdding(false);
    }
  };

  const joinWish = async (e: React.MouseEvent, item: Destination) => {
    e.stopPropagation();
    if (item.interested_users.includes(currentUser)) return;
    
    setBurstingIds(prev => [...prev, item.id]);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([30, 50, 30]);

    const newInterested = [...item.interested_users, currentUser];
    setDestinations(destinations.map(d => d.id === item.id ? { ...d, interested_users: newInterested } : d));
    await supabase.from('global_bucket_list').update({ interested_users: newInterested }).eq('id', item.id);

    setTimeout(() => {
      setBurstingIds(prev => prev.filter(bId => bId !== item.id));
      setExpandedId(item.id);
    }, 1500);
  };

  const toggleStatus = async (e: React.MouseEvent, id: string, currentStatus: Destination['status']) => {
    e.stopPropagation();
    const nextStatus: Destination['status'] = currentStatus === 'experienced' ? 'planned' : 'experienced';
    setDestinations(destinations.map(d => d.id === id ? { ...d, status: nextStatus } : d));
    await supabase.from('global_bucket_list').update({ status: nextStatus }).eq('id', id);
  };

  const addIdea = async (e: React.FormEvent, dest: Destination) => {
    e.preventDefault();
    if (!newIdea.trim()) return;
    
    const author = currentUser === 'Michael' ? 'Texas' : 'Kanagawa';
    const idea: Idea = { id: generateId(), author, content: newIdea, created_at: getNowIso() };
    const newIdeas = [...(dest.ideas || []), idea];

    setDestinations(destinations.map(d => d.id === dest.id ? { ...d, ideas: newIdeas } : d));
    setNewIdea('');
    await supabase.from('global_bucket_list').update({ ideas: newIdeas }).eq('id', dest.id);
  };

  const toggleIdeaHeart = async (destId: string, ideaId: string) => {
    const dest = destinations.find(d => d.id === destId);
    if (!dest || !dest.ideas) return;

    const updatedIdeas = dest.ideas.map(idea => {
      if (idea.id === ideaId) {
        const currentHearts = idea.hearted_by || [];
        const newHearts = currentHearts.includes(currentUser) ? currentHearts.filter(u => u !== currentUser) : [...currentHearts, currentUser];
        return { ...idea, hearted_by: newHearts };
      }
      return idea;
    });

    setDestinations(destinations.map(d => d.id === destId ? { ...d, ideas: updatedIdeas } : d));
    await supabase.from('global_bucket_list').update({ ideas: updatedIdeas }).eq('id', destId);
  };

  const postIdeaReply = async (content: string, destId: string, ideaId: string) => {
    const dest = destinations.find(d => d.id === destId);
    if (!dest || !dest.ideas) return;

    const author = currentUser === 'Michael' ? 'Texas' : 'Kanagawa';
    const newComment: ThreadComment = { id: generateId(), author, content, created_at: getNowIso() };

    const updatedIdeas = dest.ideas.map(idea => {
      if (idea.id === ideaId) {
        const newComments = [...(idea.comments || []), newComment];
        return { ...idea, comments: newComments };
      }
      return idea;
    });

    setDestinations(destinations.map(d => d.id === destId ? { ...d, ideas: updatedIdeas } : d));
    await supabase.from('global_bucket_list').update({ ideas: updatedIdeas }).eq('id', destId);
  };

  const toggleExpand = (item: Destination) => {
    setExpandedId(expandedId === item.id ? null : item.id);
  };

  const toggleIdeaExpand = (ideaId: string) => {
    setExpandedIdeaIds(prev => prev.includes(ideaId) ? prev.filter(id => id !== ideaId) : [...prev, ideaId]);
  };

  const actionButton = (
    <button onClick={() => { if (!isOpen) { setIsOpen(true); setIsAdding(true); } else setIsAdding(!isAdding); }} className="flex items-center gap-1.5 text-xs font-mono bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-all cursor-pointer">
      <Plus className="w-3.5 h-3.5" />
      <span className="hidden md:inline">{lang === 'ja' ? '場所を追加' : 'Add Destination'}</span>
      <span className="md:hidden">{lang === 'ja' ? '追加' : 'Add'}</span>
    </button>
  );

  return (
    <CollapsibleSection title={title} subtitle={subtitle} icon={icon} isControlled={true} isOpen={isOpen} onToggle={setIsOpen} actionButton={actionButton}>
      {loading ? (
        <div className="flex items-center justify-center text-zinc-500 font-mono text-xs py-4">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading Destinations...
        </div>
      ) : (
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/globe.svg" alt="Globe" className="w-[150%] h-auto max-w-none animate-[spin_240s_linear_infinite]" />
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            @keyframes bucketBurst {
              0% { transform: translate(0, 0) scale(1); opacity: 1; }
              100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
            }
          `}} />

          {/* Autocomplete Form */}
          {isAdding && (
            <form onSubmit={addDestination} className="mb-4 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex gap-3 relative z-30 backdrop-blur-md">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  {isSearching ? <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" /> : <Search className="w-4 h-4 text-zinc-500" />}
                </div>
                <input 
                  type="text" 
                  placeholder={lang === 'ja' ? '国や都市名を検索...' : 'Search country or city...'} 
                  value={searchQuery} 
                  onChange={(e) => { setSearchQuery(e.target.value); setSelectedPlace(null); }} 
                  className="w-full py-2.5 pl-10 pr-3 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-stone-500" 
                  autoFocus 
                />
                
                {searchResults.length > 0 && !selectedPlace && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50">
                    {searchResults.map((res, i) => {
                      const simpleName = res.display_name.split(',')[0];
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setSelectedPlace({ lat: parseFloat(res.lat), lng: parseFloat(res.lon), name: simpleName });
                            setSearchQuery(res.display_name);
                            setSearchResults([]);
                          }}
                          className="w-full text-left px-4 py-3 text-xs text-stone-300 hover:bg-zinc-800 border-b border-zinc-800/50 last:border-0 truncate cursor-pointer transition-colors"
                        >
                          {res.display_name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <button type="submit" disabled={!selectedPlace} className="px-4 py-2.5 rounded-lg bg-zinc-100 text-zinc-950 text-sm font-medium hover:bg-white transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                <MapPin className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save</span>
              </button>
            </form>
          )}

          <div className="space-y-3 relative z-20">
            {destinations.length === 0 ? (
              <p className="text-xs text-stone-600 font-mono text-center py-8">No destinations mapped yet.</p>
            ) : (
              destinations.map((item) => {
                const isShared = item.interested_users.length > 1;
                const isMineOnly = item.interested_users.includes(currentUser) && !isShared;
                const isPartnerOnly = !item.interested_users.includes(currentUser);
                const isExperienced = item.status === 'experienced';
                const isExpanded = expandedId === item.id;

                return (
                  <div 
                    key={item.id} 
                    className={`relative rounded-xl border transition-all duration-700 overflow-hidden flex flex-col cursor-pointer
                      ${isExpanded ? (isShared ? 'bg-red-950/10 border-red-900/30' : 'bg-zinc-900/40 border-zinc-700/60') :
                        isExperienced ? 'bg-zinc-950/80 border-zinc-900 opacity-60' : 
                        isShared ? 'bg-red-950/20 border-red-900/50 hover:border-red-700/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 
                        'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'}
                    `}
                  >
                    <div onClick={() => toggleExpand(item)} className="p-4 flex items-center justify-between gap-3 w-full">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div onClick={(e) => toggleStatus(e, item.id, item.status)} className="cursor-pointer shrink-0">
                          {isExperienced ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 transition-transform hover:scale-110" />
                          ) : (
                            <MapPin className={`w-5 h-5 transition-transform hover:scale-110 ${isShared ? 'text-red-500' : 'text-zinc-500'}`} />
                          )}
                        </div>
                        <span className={`text-base font-medium transition-colors truncate ${isExperienced ? 'text-zinc-500 line-through' : isShared ? 'text-red-100' : 'text-zinc-200'}`}>
                          {item.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 relative">
                        <div className="flex -space-x-2">
                          {item.interested_users.map(user => (
                            <div key={user} className={`w-7 h-7 rounded-full border-2 overflow-hidden ${isShared ? 'border-red-600' : 'border-zinc-700'}`}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={AVATARS[user as keyof typeof AVATARS]} alt={user} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>

                        {!isShared && isPartnerOnly && !isExperienced && (
                          <button 
                            onClick={(e) => joinWish(e, item)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-red-900/50 hover:text-red-400 text-xs font-mono text-zinc-300 transition-all cursor-pointer border border-transparent hover:border-red-700/50"
                          >
                            <Heart className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{lang === 'ja' ? '私も！' : 'Me too!'}</span>
                          </button>
                        )}
                        
                        {!isShared && isMineOnly && !isExperienced && (
                          <span className="text-[10px] font-mono text-zinc-600 border border-zinc-800 px-2 py-1 rounded bg-zinc-950">
                            {lang === 'ja' ? '待機中...' : 'Waiting...'}
                          </span>
                        )}

                        <div className="text-zinc-500 ml-1 shrink-0">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>

                        {burstingIds.includes(item.id) && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-50">
                            <Sparkles className="w-6 h-6 text-red-500 animate-ping absolute" />
                            {[...Array(12)].map((_, i) => {
                              const angle = (i * 30) * (Math.PI / 180);
                              const distance = 30 + Math.random() * 20;
                              const x = Math.cos(angle) * distance;
                              const y = Math.sin(angle) * distance;
                              return (
                                <div
                                  key={i}
                                  className="absolute w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,1)]"
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

                    {isExpanded && (
                      <div className="p-4 pt-0 border-t border-zinc-800/50 mt-2 bg-zinc-950/30 cursor-default" onClick={(e) => e.stopPropagation()}>
                        <h5 className={`text-[10px] font-mono mb-3 mt-4 uppercase tracking-widest flex items-center gap-2 ${isShared ? 'text-red-500' : 'text-zinc-500'}`}>
                          <MapPin className="w-3.5 h-3.5" /> 
                          {lang === 'ja' ? 'アイデアと旅程' : 'Itinerary & Ideas'}
                        </h5>
                        
                        <div className="flex flex-col gap-2.5 mb-4">
                          {!item.ideas || item.ideas.length === 0 ? (
                            <p className="text-xs text-stone-500 font-mono py-2">{lang === 'ja' ? 'アイデアを追加してください...' : 'Add things you want to do here...'}</p>
                          ) : (
                            item.ideas.map(idea => {
                              const hasComments = idea.comments && idea.comments.length > 0;
                              const isIdeaExpanded = expandedIdeaIds.includes(idea.id);
                              
                              const currentHearts = idea.hearted_by || [];
                              const anyoneHeartedIdea = currentHearts.length > 0;
                              const bothHeartedIdea = currentHearts.length >= 2;

                              return (
                                <div key={idea.id} className="bg-zinc-900/50 rounded-lg border border-zinc-800/40 overflow-hidden transition-all">
                                  <div 
                                    className="flex items-start gap-2.5 p-3 cursor-pointer hover:bg-zinc-800/30 transition-colors"
                                    onClick={() => toggleIdeaExpand(idea.id)}
                                  >
                                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 mt-0.5 border border-stone-500/20">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={AVATARS[idea.author as keyof typeof AVATARS]} alt={idea.author} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span className="text-[9px] font-mono text-stone-500 uppercase">{idea.author === 'Kanagawa' ? 'Tamae' : 'Michael'}</span>
                                          <span className="text-[9px] font-mono text-stone-600 hidden sm:inline">{new Date(idea.created_at).toLocaleDateString()}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 shrink-0">
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); toggleIdeaHeart(item.id, idea.id); }} 
                                            className="transition-all hover:scale-110 cursor-pointer"
                                          >
                                            {bothHeartedIdea ? (
                                              <div className="relative">
                                                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
                                                <Sparkles className="w-2 h-2 text-amber-400 absolute -top-1 -right-1" />
                                              </div>
                                            ) : anyoneHeartedIdea ? (
                                              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                                            ) : (
                                              <Heart className="w-3.5 h-3.5 text-stone-500 hover:text-stone-300" />
                                            )}
                                          </button>
                                          
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleIdeaExpand(idea.id);
                                            }}
                                            className={`flex items-center gap-1 transition-colors cursor-pointer ${hasComments && !isIdeaExpanded ? 'text-amber-500 hover:text-amber-400' : 'text-stone-500 hover:text-stone-300'}`}
                                          >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                            {hasComments && <span className="text-[9px] font-mono">{idea.comments!.length}</span>}
                                          </button>
                                          
                                          {hasComments && (
                                            <div className={`ml-1 ${hasComments && !isIdeaExpanded ? 'text-amber-500' : 'text-stone-500'}`}>
                                              {isIdeaExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <p className="text-xs text-stone-300 mb-1">{idea.content}</p>
                                    </div>
                                  </div>

                                  {isIdeaExpanded && (
                                    <div className="px-3 pb-3 bg-zinc-900/20 cursor-default" onClick={(e) => e.stopPropagation()}>
                                      <div className="ml-7 pl-3 border-l-2 border-zinc-800/50 flex flex-col gap-2.5 pt-2">
                                        {idea.comments?.map(comment => (
                                          <div key={comment.id} className="flex items-start gap-2">
                                            <div className="w-5 h-5 rounded-full overflow-hidden border border-stone-500/20 bg-zinc-950 shrink-0 mt-0.5">
                                              {/* eslint-disable-next-line @next/next/no-img-element */}
                                              <img src={AVATARS[comment.author as keyof typeof AVATARS]} alt={comment.author} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0 bg-zinc-950/50 p-2 rounded-lg border border-zinc-800/40">
                                              <div className="flex justify-between items-center mb-0.5">
                                                <span className="text-[9px] font-mono text-stone-500 uppercase">{comment.author === 'Kanagawa' ? 'Tamae' : 'Michael'}</span>
                                              </div>
                                              <p className="text-xs text-stone-300 whitespace-pre-wrap">{comment.content}</p>
                                            </div>
                                          </div>
                                        ))}

                                        <form 
                                          onSubmit={(e) => { 
                                            e.preventDefault(); 
                                            const content = replyContents[idea.id];
                                            if (content?.trim()) {
                                              postIdeaReply(content, item.id, idea.id); 
                                              setReplyContents(prev => ({ ...prev, [idea.id]: '' }));
                                            }
                                          }} 
                                          className="flex items-center gap-2 mt-1 animate-in fade-in"
                                        >
                                          <input
                                            type="text"
                                            placeholder={hasComments ? "Add a reply..." : "Add a thought..."}
                                            value={replyContents[idea.id] || ''}
                                            onChange={(e) => setReplyContents(prev => ({ ...prev, [idea.id]: e.target.value }))}
                                            className="flex-1 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-stone-200 focus:outline-none focus:border-red-700/50"
                                          />
                                          <button type="submit" disabled={!replyContents[idea.id]?.trim()} className="p-2 rounded-lg bg-red-600/80 text-white hover:bg-red-500 transition-all disabled:opacity-50 cursor-pointer">
                                            <Plus className="w-3.5 h-3.5" />
                                          </button>
                                        </form>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>

                        <form onSubmit={(e) => addIdea(e, item)} className="flex gap-2 mt-2">
                          <input 
                            type="text" 
                            value={newIdea} 
                            onChange={e => setNewIdea(e.target.value)} 
                            placeholder={lang === 'ja' ? 'アイデアを追加...' : 'Add an idea...'} 
                            className="flex-1 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-stone-200 focus:outline-none focus:border-red-700/50" 
                          />
                          <button type="submit" disabled={!newIdea.trim()} className={`px-4 rounded-lg text-white transition-all disabled:opacity-50 cursor-pointer ${isShared ? 'bg-red-600/80 hover:bg-red-500' : 'bg-zinc-700 hover:bg-zinc-600'}`}>
                            <Plus className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          <WorldMap destinations={destinations} lang={lang} />
          
        </div>
      )}
    </CollapsibleSection>
  );
}