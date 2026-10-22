'use client';

import { useState, useEffect } from 'react';
import { Plus, Loader2, MapPin, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateId, getNowIso } from '@/lib/utils';
import CollapsibleSection from '@/components/shared/CollapsibleSection';
import { ThreadComment } from '@/components/shared/ReactionThread';
import WorldMap from '@/components/bucket/WorldMap';
import DestinationCard from '@/components/bucket/DestinationCard';
import { Destination, Idea, NominatimResult } from '@/components/bucket/bucketTypes';

interface GlobalBucketListProps {
  currentUser: 'Michael' | 'Tamae';
  lang: 'en' | 'ja';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

export default function GlobalBucketList({
  currentUser,
  lang,
  title,
  subtitle,
  icon,
}: GlobalBucketListProps) {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [burstingIds, setBurstingIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [avatarBust, setAvatarBust] = useState('1');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<{ lat: number; lng: number; name: string } | null>(null);

  useEffect(() => {
    const syncBust = () => setAvatarBust(localStorage.getItem('avatar_bust') || '1');
    syncBust();
    window.addEventListener('avatar-bust-changed', syncBust);
    return () => window.removeEventListener('avatar-bust-changed', syncBust);
  }, []);

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'global_bucket_list' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setDestinations((prev) => [...prev, payload.new as Destination]);
        } else if (payload.eventType === 'UPDATE') {
          setDestinations((prev) =>
            prev.map((d) => (d.id === payload.new.id ? (payload.new as Destination) : d))
          );
        } else if (payload.eventType === 'DELETE') {
          setDestinations((prev) => prev.filter((d) => d.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2 || selectedPlace?.name === searchQuery) {
      return;
    }

    const delay = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            searchQuery
          )}&format=json&limit=5&accept-language=${lang}`
        );
        const data = await res.json();
        setSearchResults(data);
      } catch (e) {
        console.error('Geocoding failed', e);
      } finally {
        setIsSearching(false);
      }
    }, 600);

    return () => clearTimeout(delay);
  }, [searchQuery, lang, selectedPlace]);

  const addDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlace) return;

    const { error } = await supabase.from('global_bucket_list').insert([
      {
        title: selectedPlace.name,
        creator: currentUser,
        interested_users: [currentUser],
        status: 'planned',
        ideas: [],
        lat: selectedPlace.lat,
        lng: selectedPlace.lng,
      },
    ]);

    if (!error) {
      setSearchQuery('');
      setSelectedPlace(null);
      setIsAdding(false);
    }
  };

  const deleteDestination = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDestinations((prev) => prev.filter((d) => d.id !== id));
    if (expandedId === id) setExpandedId(null);
    await supabase.from('global_bucket_list').delete().eq('id', id);
  };

  const joinWish = async (e: React.MouseEvent, item: Destination) => {
    e.stopPropagation();
    if (item.interested_users.includes(currentUser)) return;

    setBurstingIds((prev) => [...prev, item.id]);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([30, 50, 30]);

    const newInterested = [...item.interested_users, currentUser];
    setDestinations(destinations.map((d) => (d.id === item.id ? { ...d, interested_users: newInterested } : d)));
    await supabase.from('global_bucket_list').update({ interested_users: newInterested }).eq('id', item.id);

    setTimeout(() => {
      setBurstingIds((prev) => prev.filter((bId) => bId !== item.id));
      setExpandedId(item.id);
    }, 1500);
  };

  const toggleStatus = async (e: React.MouseEvent, id: string, currentStatus: Destination['status']) => {
    e.stopPropagation();
    const nextStatus: Destination['status'] = currentStatus === 'experienced' ? 'planned' : 'experienced';
    setDestinations(destinations.map((d) => (d.id === id ? { ...d, status: nextStatus } : d)));
    await supabase.from('global_bucket_list').update({ status: nextStatus }).eq('id', id);
  };

  const addIdea = async (dest: Destination, content: string) => {
    const author = currentUser === 'Michael' ? 'Texas' : 'Kanagawa';
    const idea: Idea = { id: generateId(), author, content, created_at: getNowIso() };
    const newIdeas = [...(dest.ideas || []), idea];

    setDestinations(destinations.map((d) => (d.id === dest.id ? { ...d, ideas: newIdeas } : d)));
    await supabase.from('global_bucket_list').update({ ideas: newIdeas }).eq('id', dest.id);
  };

  const deleteIdea = async (e: React.MouseEvent, destId: string, ideaId: string) => {
    e.stopPropagation();
    const dest = destinations.find((d) => d.id === destId);
    if (!dest || !dest.ideas) return;

    const updatedIdeas = dest.ideas.filter((idea) => idea.id !== ideaId);
    setDestinations(destinations.map((d) => (d.id === destId ? { ...d, ideas: updatedIdeas } : d)));
    await supabase.from('global_bucket_list').update({ ideas: updatedIdeas }).eq('id', destId);
  };

  const toggleIdeaHeart = async (destId: string, ideaId: string) => {
    const dest = destinations.find((d) => d.id === destId);
    if (!dest || !dest.ideas) return;

    const updatedIdeas = dest.ideas.map((idea) => {
      if (idea.id === ideaId) {
        const currentHearts = idea.hearted_by || [];
        const newHearts = currentHearts.includes(currentUser)
          ? currentHearts.filter((u) => u !== currentUser)
          : [...currentHearts, currentUser];
        return { ...idea, hearted_by: newHearts };
      }
      return idea;
    });

    setDestinations(destinations.map((d) => (d.id === destId ? { ...d, ideas: updatedIdeas } : d)));
    await supabase.from('global_bucket_list').update({ ideas: updatedIdeas }).eq('id', destId);
  };

  const postIdeaReply = async (content: string, destId: string, ideaId: string) => {
    const dest = destinations.find((d) => d.id === destId);
    if (!dest || !dest.ideas) return;

    const author = currentUser === 'Michael' ? 'Texas' : 'Kanagawa';
    const newComment: ThreadComment = { id: generateId(), author, content, created_at: getNowIso() };

    const updatedIdeas = dest.ideas.map((idea) => {
      if (idea.id === ideaId) {
        const newComments = [...(idea.comments || []), newComment];
        return { ...idea, comments: newComments };
      }
      return idea;
    });

    setDestinations(destinations.map((d) => (d.id === destId ? { ...d, ideas: updatedIdeas } : d)));
    await supabase.from('global_bucket_list').update({ ideas: updatedIdeas }).eq('id', destId);
  };

  const actionButton = (
    <button
      onClick={() => {
        if (!isOpen) {
          setIsOpen(true);
          setIsAdding(true);
        } else setIsAdding(!isAdding);
      }}
      className="flex items-center gap-1.5 text-xs font-mono bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-all cursor-pointer"
    >
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
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading Destinations...
        </div>
      ) : (
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/globe.svg"
              alt="Globe"
              className="w-[150%] h-auto max-w-none animate-[spin_240s_linear_infinite]"
            />
          </div>

          <style
            dangerouslySetInnerHTML={{
              __html: `
            @keyframes bucketBurst {
              0% { transform: translate(0, 0) scale(1); opacity: 1; }
              100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
            }
          `,
            }}
          />

          {isAdding && (
            <form
              onSubmit={addDestination}
              className="mb-4 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex gap-3 relative z-30 backdrop-blur-md"
            >
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 text-zinc-500" />
                  )}
                </div>
                <input
                  type="text"
                  placeholder={lang === 'ja' ? '国や都市名を検索...' : 'Search country or city...'}
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    setSelectedPlace(null);
                    if (val.length < 2) setSearchResults([]);
                  }}
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
                            setSelectedPlace({
                              lat: parseFloat(res.lat),
                              lng: parseFloat(res.lon),
                              name: simpleName,
                            });
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
              <button
                type="submit"
                disabled={!selectedPlace}
                className="px-4 py-2.5 rounded-lg bg-zinc-100 text-zinc-950 text-sm font-medium hover:bg-white transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save</span>
              </button>
            </form>
          )}

          <div className="space-y-3 relative z-20">
            {destinations.length === 0 ? (
              <p className="text-xs text-stone-600 font-mono text-center py-8">
                No destinations mapped yet.
              </p>
            ) : (
              destinations.map((item) => (
                <DestinationCard
                  key={item.id}
                  item={item}
                  currentUser={currentUser}
                  lang={lang}
                  avatarBust={avatarBust}
                  isExpanded={expandedId === item.id}
                  isBursting={burstingIds.includes(item.id)}
                  onToggleExpand={(d) => setExpandedId(expandedId === d.id ? null : d.id)}
                  onToggleStatus={toggleStatus}
                  onDeleteDestination={deleteDestination}
                  onJoinWish={joinWish}
                  onAddIdea={addIdea}
                  onDeleteIdea={deleteIdea}
                  onToggleIdeaHeart={toggleIdeaHeart}
                  onPostIdeaReply={postIdeaReply}
                />
              ))
            )}
          </div>

          <WorldMap destinations={destinations} lang={lang} />
        </div>
      )}
    </CollapsibleSection>
  );
}