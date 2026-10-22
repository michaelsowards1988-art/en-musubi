'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, Loader2, Pencil, Trash2, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CollapsibleSection from './CollapsibleSection';
import ReactionThread, { ThreadComment } from './ReactionThread';

interface Itinerary {
  id: string;
  flight_number: string;
  route: string;
  travel_date: string;
  status: string;
  created_by?: string;
  hearted_by: string[] | null;
  comments: ThreadComment[] | null;
}

interface ItineraryTrackerProps {
  currentUser: 'Michael' | 'Tamae';
  lang: 'en' | 'ja';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

const generateId = () => Date.now().toString();
const getNowIso = () => new Date().toISOString();

export default function ItineraryTracker({
  currentUser,
  lang,
  title,
  subtitle,
  icon,
}: ItineraryTrackerProps) {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);

  const [flightNumber, setFlightNumber] = useState('');
  const [route, setRoute] = useState('');
  const [travelDate, setTravelDate] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFlightNumber, setEditFlightNumber] = useState('');
  const [editRoute, setEditRoute] = useState('');
  const [editTravelDate, setEditTravelDate] = useState('');

  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchItineraries() {
      const { data, error } = await supabase
        .from('itineraries')
        .select('*')
        .order('travel_date', { ascending: true });

      if (isMounted) {
        if (!error && data) {
          setItineraries(data);
        }
        setLoading(false);
      }
    }

    fetchItineraries();

    const channel = supabase
      .channel('public:itineraries')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'itineraries' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newItem = payload.new as Itinerary;
          setItineraries((prev) => [...prev.filter((i) => i.id !== newItem.id), newItem]);
        } else if (payload.eventType === 'UPDATE') {
          setItineraries((prev) =>
            prev.map((i) => (i.id === payload.new.id ? (payload.new as Itinerary) : i))
          );
        } else if (payload.eventType === 'DELETE') {
          setItineraries((prev) => prev.filter((i) => i.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const addItinerary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flightNumber || !route || !travelDate) return;

    await supabase.from('itineraries').insert([
      {
        flight_number: flightNumber.trim(),
        route: route.trim(),
        travel_date: travelDate,
        status: 'Confirmed',
        created_by: currentUser,
      },
    ]);

    setFlightNumber('');
    setRoute('');
    setTravelDate('');
    setIsAdding(false);
  };

  const saveEdit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editFlightNumber || !editRoute || !editTravelDate) return;

    const updates = {
      flight_number: editFlightNumber.trim(),
      route: editRoute.trim(),
      travel_date: editTravelDate,
    };

    setItineraries((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
    setEditingId(null);
    await supabase.from('itineraries').update(updates).eq('id', id);
  };

  const deleteItinerary = async (id: string) => {
    setItineraries((prev) => prev.filter((i) => i.id !== id));
    setEditingId(null);
    await supabase.from('itineraries').delete().eq('id', id);
  };

  const toggleHeart = async (item: Itinerary) => {
    const currentHearts = item.hearted_by || [];
    const newHearts = currentHearts.includes(currentUser)
      ? currentHearts.filter((u) => u !== currentUser)
      : [...currentHearts, currentUser];

    setItineraries(itineraries.map((i) => (i.id === item.id ? { ...i, hearted_by: newHearts } : i)));
    await supabase.from('itineraries').update({ hearted_by: newHearts }).eq('id', item.id);
  };

  const postReply = async (content: string, item: Itinerary) => {
    const author = currentUser === 'Michael' ? 'Texas' : 'Kanagawa';
    const newComment: ThreadComment = {
      id: generateId(),
      author,
      content,
      created_at: getNowIso(),
    };
    const newComments = [...(item.comments || []), newComment];

    setItineraries(itineraries.map((i) => (i.id === item.id ? { ...i, comments: newComments } : i)));
    await supabase.from('itineraries').update({ comments: newComments }).eq('id', item.id);
  };

  const handleAddClick = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsAdding(true);
    } else {
      setIsAdding(!isAdding);
    }
  };

  const actionButton = (
    <button
      onClick={handleAddClick}
      className="flex items-center gap-1.5 text-xs font-mono bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-all cursor-pointer"
    >
      <Plus className="w-3.5 h-3.5" />
      <span className="hidden md:inline">{lang === 'ja' ? 'フライト追加' : 'Add Flight'}</span>
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
        <div className="w-full p-8 rounded-2xl bg-zinc-950 text-zinc-500 flex items-center justify-center font-mono text-xs">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading Itineraries...
        </div>
      ) : (
        <>
          {isAdding && (
            <form
              onSubmit={addItinerary}
              className="mb-6 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col md:flex-row gap-3"
            >
              <input
                type="text"
                placeholder="Flight # (e.g., JL012)"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-stone-500 font-mono"
              />
              <input
                type="text"
                placeholder="Route (e.g., DFW -> HND)"
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="flex-1 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-stone-500"
              />
              <input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm font-mono text-zinc-200 focus:outline-none focus:border-stone-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-lg bg-zinc-100 text-zinc-950 text-sm font-medium hover:bg-white transition-all cursor-pointer"
              >
                Save
              </button>
            </form>
          )}

          <div className="space-y-3">
            {itineraries.length === 0 ? (
              <p className="text-xs text-zinc-600 font-mono text-center py-4">
                No active flight itineraries recorded.
              </p>
            ) : (
              itineraries.map((item) => {
                const isEditing = editingId === item.id;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/40 flex flex-col gap-2 group"
                  >
                    {isEditing ? (
                      <form onSubmit={(e) => saveEdit(e, item.id)} className="flex flex-col md:flex-row gap-2">
                        <input
                          type="text"
                          value={editFlightNumber}
                          onChange={(e) => setEditFlightNumber(e.target.value)}
                          className="p-2 rounded-lg bg-zinc-950 border border-amber-900/50 text-xs font-mono text-zinc-200 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={editRoute}
                          onChange={(e) => setEditRoute(e.target.value)}
                          className="flex-1 p-2 rounded-lg bg-zinc-950 border border-amber-900/50 text-sm text-zinc-200 focus:outline-none"
                        />
                        <input
                          type="date"
                          value={editTravelDate}
                          onChange={(e) => setEditTravelDate(e.target.value)}
                          className="p-2 rounded-lg bg-zinc-950 border border-amber-900/50 text-xs font-mono text-zinc-200 focus:outline-none"
                        />
                        <div className="flex gap-1.5">
                          <button
                            type="submit"
                            className="p-2 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteItinerary(item.id)}
                            className="p-2 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-900/50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-purple-400 font-mono text-xs">
                            {item.flight_number}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-zinc-200">{item.route}</span>
                            <span className="block text-[10px] font-mono text-zinc-500 uppercase">
                              {item.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(item.id);
                                setEditFlightNumber(item.flight_number);
                                setEditRoute(item.route);
                                setEditTravelDate(item.travel_date);
                              }}
                              title={lang === 'ja' ? '編集' : 'Edit'}
                              className="p-1.5 text-stone-500 hover:text-amber-400 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteItinerary(item.id)}
                              title={lang === 'ja' ? '削除' : 'Delete'}
                              className="p-1.5 text-stone-500 hover:text-red-400 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800/60">
                            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{item.travel_date}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pl-1">
                      <ReactionThread
                        currentUser={currentUser}
                        heartedBy={item.hearted_by || []}
                        comments={item.comments || []}
                        onToggleHeart={() => toggleHeart(item)}
                        onAddComment={(content) => postReply(content, item)}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </CollapsibleSection>
  );
}