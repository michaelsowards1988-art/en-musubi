'use client';

import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import AuthGate from '@/components/auth/AuthGate';
import Dashboard from '@/components/dashboard/Dashboard';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-stone-400 font-mono text-sm tracking-widest uppercase">
        Establishing Connection...
      </div>
    );
  }

  if (!session) {
    return <AuthGate />;
  }

  const currentUser = session.user?.email === 'michael@en-musubi.local' ? 'Michael' : 'Tamae';

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col selection:bg-stone-800 relative overflow-x-hidden text-stone-100">
      <div className="absolute w-200 h-200 bg-stone-800/10 rounded-full blur-3xl pointer-events-none -top-96 left-1/2 -translate-x-1/2"></div>
      <Dashboard currentUser={currentUser} />
    </main>
  );
}