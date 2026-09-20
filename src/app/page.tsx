'use client';

import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import DualZoneCalendar from '@/components/DualZoneCalendar';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const { error } = await supabase.auth.signInWithPassword({
      email: 'sync@en-musubi.local',
      password: passcode,
    });

    if (error) setError('Incorrect passcode.');
  };

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">Loading...</div>;

  // The locked gateway
  if (!session) {
    return (
      <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 selection:bg-zinc-800">
        <div className="w-full max-w-sm p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 shadow-2xl text-center">
          <h1 className="text-3xl font-light tracking-widest text-zinc-100 mb-2">縁結び</h1>
          <p className="text-zinc-500 tracking-wide text-xs mb-8 uppercase">Secure Access</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter Passcode"
              className="w-full p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-center focus:outline-none focus:border-zinc-600 transition-colors"
            />
            <button type="submit" className="w-full p-3 rounded-lg bg-zinc-100 text-zinc-900 font-medium hover:bg-white transition-colors">
              Connect
            </button>
            {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
          </form>
        </div>
      </main>
    );
  }

  // The unlocked dashboard
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center p-8 md:p-24 selection:bg-zinc-800">
      <div className="w-full max-w-4xl mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-light tracking-widest text-zinc-100 mb-2">
            縁結び
          </h1>
          <p className="text-zinc-500 tracking-wide text-sm">
            Logistics & Sync — Texas to Kanagawa
          </p>
        </div>
        <button 
          onClick={() => supabase.auth.signOut()} 
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors mb-1"
        >
          Lock
        </button>
      </div>
      
      <DualZoneCalendar />
    </main>
  );
}