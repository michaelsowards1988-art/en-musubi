'use client';

import { useState, useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import SanctuaryStatus from '@/components/status/SanctuaryStatus';
import DailyReflection from '@/components/prompts/DailyReflection';
import WeeklyUnlock from '@/components/prompts/WeeklyUnlock';
import CountdownTicker from '@/components/planning/CountdownTicker';
import AvailabilityCalendar from '@/components/planning/AvailabilityCalendar';
import MilestoneTracker from '@/components/planning/MilestoneTracker';
import KeySuccessFactors from '@/components/planning/KeySuccessFactors';
import GlobalBucketList from '@/components/bucket/GlobalBucketList';
import ItineraryTracker from '@/components/planning/ItineraryTracker';
import MemoryVault from '@/components/memories/MemoryVault';
import SanctuaryNotes from '@/components/memories/SanctuaryNotes';
import DualZoneCalendar from '@/components/planning/DualZoneCalendar';
import SettingsModal from '@/components/dashboard/SettingsModal';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { PERSONAL_TRANSLATIONS } from '@/components/dashboard/translations';
import { supabase } from '@/lib/supabase';
import {
  Target,
  Lightbulb,
  Plane,
  Image as ImageIcon,
  MessageSquare,
  CalendarDays,
  Clock,
  Map as MapIcon,
} from 'lucide-react';

interface DashboardProps {
  currentUser: 'Michael' | 'Tamae';
}

export default function Dashboard({ currentUser }: DashboardProps) {
  const [lang, setLang] = useState<'en' | 'ja'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('preferredLang');
      if (saved === 'en' || saved === 'ja') return saved;
    }
    return currentUser === 'Michael' ? 'en' : 'ja';
  });

  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [activeFlare, setActiveFlare] = useState<'Michael' | 'Tamae' | null>(null);
  const [screenPulse, setScreenPulse] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [avatarBust, setAvatarBust] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('avatar_bust');
      if (saved) return parseInt(saved, 10) || 1;
    }
    return 1;
  });

  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const prevBothOnline = useRef(false);

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
      .on('broadcast', { event: 'avatar-updated' }, ({ payload }) => {
        if (payload?.bust) {
          localStorage.setItem('avatar_bust', payload.bust.toString());
          setAvatarBust(payload.bust);
          window.dispatchEvent(new Event('avatar-bust-changed'));
        }
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const tamaeOnline = onlineUsers.includes('Tamae');
  const michaelOnline = onlineUsers.includes('Michael');
  const bothOnline = tamaeOnline && michaelOnline;

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
      await presenceChannelRef.current.send({
        type: 'broadcast',
        event: 'force-refresh',
        payload: { action: 'refresh' },
      });
      window.location.reload();
    }
  };

  const handleAvatarUpdated = async (newBust: number) => {
    setAvatarBust(newBust);
    window.dispatchEvent(new Event('avatar-bust-changed'));
    if (presenceChannelRef.current) {
      await presenceChannelRef.current.send({
        type: 'broadcast',
        event: 'avatar-updated',
        payload: { bust: newBust },
      });
    }
  };

  const handlePoke = async (target: 'Michael' | 'Tamae') => {
    if (target === currentUser) {
      setIsSettingsOpen(true);
      return;
    }
    if (!bothOnline || !presenceChannelRef.current) return;
    setActiveFlare(currentUser);
    setTimeout(() => setActiveFlare(null), 1500);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
    await presenceChannelRef.current.send({
      type: 'broadcast',
      event: 'poke',
      payload: { from: currentUser, to: target },
    });
  };

  const currentLang = PERSONAL_TRANSLATIONS[lang];

  return (
    <div className="w-full flex flex-col items-center">
      <div
        className={`fixed inset-0 z-50 pointer-events-none transition-all duration-1000 ${
          screenPulse ? 'bg-amber-600/15 backdrop-brightness-110' : 'bg-transparent backdrop-brightness-100'
        }`}
      ></div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
        lang={lang}
        avatarBust={avatarBust}
        onAvatarUpdated={handleAvatarUpdated}
      />

      <DashboardHeader
        currentUser={currentUser}
        lang={lang}
        titleText={currentLang.title}
        langToggleText={currentLang.langToggle}
        tamaeOnline={tamaeOnline}
        michaelOnline={michaelOnline}
        bothOnline={bothOnline}
        activeFlare={activeFlare}
        avatarBust={avatarBust}
        onPoke={handlePoke}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleLang={() => setLang((prev) => (prev === 'en' ? 'ja' : 'en'))}
        onAdminSync={handleAdminSync}
        onSetDefaultLang={handleSetDefaultLang}
      />

      <div className="w-full px-6 md:px-16 pt-8 pb-16 flex flex-col items-center">
        <div className="w-full max-w-4xl space-y-6 relative z-10">
          <SanctuaryStatus lang={lang} currentUser={currentUser} />

          <CountdownTicker lang={lang} />

          <DailyReflection lang={lang} currentUser={currentUser} />

          <WeeklyUnlock lang={lang} currentUser={currentUser} />

          <GlobalBucketList
            currentUser={currentUser}
            lang={lang}
            title={currentLang.bucket}
            subtitle={currentLang.bucket_sub}
            icon={<MapIcon className="w-5 h-5" />}
          />

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

          <DualZoneCalendar
            currentUser={currentUser}
            lang={lang}
            title={currentLang.timezone}
            subtitle={currentLang.timezone_sub}
            icon={<Clock className="w-5 h-5" />}
          />
        </div>
      </div>
    </div>
  );
}