'use client';

import { useState, useEffect } from 'react';
import { Plane, Calendar, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Itinerary {
  id: string;
  flight_number: string;
  route: string;
  travel_date: string;
  status: string;
}

export default function ItineraryTracker() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [flightNumber, setFlightNumber] = useState('');
  const [route, setRoute] = useState('');
  const [travelDate, setTravelDate] = useState('');
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
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'itineraries' },
        (payload) => {
          const newItem = payload.new as Itinerary;
          setItineraries((prev) => [...prev, newItem]);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const addItinerary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flightNumber || !route || !travelDate) return;

    await supabase
      .from('itineraries')
      .insert([{ flight_number: flightNumber, route, travel_date: travelDate, status: 'Confirmed' }]);

    setFlightNumber('');
    setRoute('');
    setTravelDate('');
    setIsAdding(false);
  };

  if (loading) {
    return (
      <div className="w-full p-8 rounded-2xl bg-zinc-950 text-zinc-500 flex items-center justify-center font-mono text-xs">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading Itineraries...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-6 pb-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 text-xs font-mono bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Flight</span>
          </button>
          <Plane className="w-5 h-5 text-zinc-600" />
        </div>
      </div>

      {isAdding && (
        <form onSubmit={addItinerary} className="mb-6 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col md:flex-row gap-3">
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
          <button type="submit" className="px-4 py-2.5 rounded-lg bg-zinc-100 text-zinc-950 text-sm font-medium hover:bg-white transition-all">
            Save
          </button>
        </form>
      )}

      <div className="space-y-3">
        {itineraries.length === 0 ? (
          <p className="text-xs text-zinc-600 font-mono text-center py-4">No active flight itineraries recorded.</p>
        ) : (
          itineraries.map((item) => (
            <div key={item.id} className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-purple-400 font-mono text-xs">
                  {item.flight_number}
                </div>
                <div>
                  <span className="text-sm font-medium text-zinc-200">{item.route}</span>
                  <span className="block text-[10px] font-mono text-zinc-500 uppercase">{item.status}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800/60">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>{item.travel_date}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}