'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Info } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { supabase } from '@/lib/supabase';

interface Availability {
  id: string;
  date: string;
  user_id: string;
  status: 'free' | 'busy';
}

interface AvailabilityCalendarProps {
  currentUser: 'Michael' | 'Tamae';
  lang: 'en' | 'ja';
}

export default function AvailabilityCalendar({ currentUser, lang }: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchAvailabilities() {
      const { data, error } = await supabase
        .from('availability')
        .select('*');

      if (isMounted) {
        if (!error && data) setAvailabilities(data);
        setLoading(false);
      }
    }

    fetchAvailabilities();

    const channel = supabase
      .channel('public:availability')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'availability' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setAvailabilities((prev) => {
              const filtered = prev.filter(a => a.id !== payload.new.id);
              return [...filtered, payload.new as Availability];
            });
          } else if (payload.eventType === 'DELETE') {
            setAvailabilities((prev) => prev.filter(a => a.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDayClick = async (dateStr: string) => {
    const existing = availabilities.find(a => a.date === dateStr && a.user_id === currentUser);
    
    // Cycle: null -> 'free' -> 'busy' -> null
    let nextStatus: 'free' | 'busy' | null = 'free';
    if (existing?.status === 'free') nextStatus = 'busy';
    if (existing?.status === 'busy') nextStatus = null;

    if (nextStatus === null && existing) {
      // Optimistic UI update
      setAvailabilities(prev => prev.filter(a => a.id !== existing.id));
      await supabase.from('availability').delete().eq('id', existing.id);
    } else if (nextStatus !== null) {
      // eslint-disable-next-line react-hooks/purity
      const tempId = existing?.id || Date.now().toString();
      
      // Optimistic UI update
      setAvailabilities(prev => {
        const filtered = prev.filter(a => !(a.date === dateStr && a.user_id === currentUser));
        return [...filtered, { id: tempId, date: dateStr, user_id: currentUser, status: nextStatus as 'free' | 'busy' }];
      });

      await supabase
        .from('availability')
        .upsert({ date: dateStr, user_id: currentUser, status: nextStatus }, { onConflict: 'date,user_id' });
    }
  };

  if (loading) {
    return (
      <div className="w-full p-8 rounded-2xl bg-zinc-950 flex items-center justify-center font-mono text-xs text-zinc-500">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Syncing Calendar...
      </div>
    );
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getDayStatus = (dateStr: string, user: 'Michael' | 'Tamae') => {
    return availabilities.find(a => a.date === dateStr && a.user_id === user)?.status;
  };

  return (
    <div className="w-full">
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-light text-stone-100 flex items-center gap-2">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-stone-400 hover:text-stone-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-stone-400 hover:text-stone-200 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-[10px] font-mono text-stone-500 uppercase tracking-wider bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/40">
        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500/80"></div> {lang === 'ja' ? '空き' : 'Free'}</span>
        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500/80"></div> {lang === 'ja' ? '予定あり' : 'Busy'}</span>
        <div className="ml-auto flex items-center gap-2 text-stone-600">
          <Info className="w-3 h-3" />
          <span className="hidden md:inline">{lang === 'ja' ? '左: Tamae / 右: Michael' : 'Left: Tamae / Right: Michael'}</span>
          <span className="md:hidden">L:T / R:M</span>
        </div>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 text-center text-[10px] font-mono text-stone-500 uppercase">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="py-1">{day}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);
          
          const tamaeStatus = getDayStatus(dateStr, 'Tamae');
          const michaelStatus = getDayStatus(dateStr, 'Michael');

          return (
            <div 
              key={dateStr}
              onClick={() => handleDayClick(dateStr)}
              className={`
                relative h-14 md:h-20 rounded-xl border transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center group
                ${isCurrentMonth ? 'bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-800/60' : 'bg-zinc-950/50 border-zinc-900/50 opacity-50'}
                ${isTodayDate ? 'ring-1 ring-amber-500/50' : ''}
              `}
            >
              <span className={`text-xs md:text-sm font-mono mb-2 ${isTodayDate ? 'text-amber-400 font-bold' : 'text-stone-300'}`}>
                {format(day, 'd')}
              </span>

              {/* Status Indicators (Left: Tamae, Right: Michael) */}
              <div className="absolute bottom-1.5 left-0 right-0 px-1.5 flex gap-1 h-1.5 md:h-2">
                <div className={`w-1/2 rounded-full transition-colors ${tamaeStatus === 'free' ? 'bg-emerald-500/80' : tamaeStatus === 'busy' ? 'bg-red-500/80' : 'bg-zinc-800/30 group-hover:bg-zinc-700/50'}`}></div>
                <div className={`w-1/2 rounded-full transition-colors ${michaelStatus === 'free' ? 'bg-emerald-500/80' : michaelStatus === 'busy' ? 'bg-red-500/80' : 'bg-zinc-800/30 group-hover:bg-zinc-700/50'}`}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}