'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AuthGate() {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let targetEmail = 'sync@en-musubi.local';
    if (passcode === 'enmusubi') {
      targetEmail = 'michael@en-musubi.local';
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: passcode,
    });

    if (error) setError('Incorrect passcode.');
  };

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 selection:bg-stone-800 relative overflow-x-hidden">
      <div className="absolute w-125 h-125 bg-amber-900/10 rounded-full blur-3xl pointer-events-none -top-48 -left-48"></div>
      <div className="absolute w-125 h-125 bg-stone-800/20 rounded-full blur-3xl pointer-events-none -bottom-48 -right-48"></div>

      <div className="w-full max-w-sm p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl shadow-2xl text-center relative z-10">
        <div className="inline-flex p-3 rounded-xl bg-zinc-950 border border-zinc-800 mb-6 text-stone-300 shadow-inner">
          <Sparkles className="w-6 h-6 text-amber-600/80" />
        </div>

        <h1 className="text-4xl font-bold tracking-widest text-stone-100 mb-2">縁結び</h1>
        <p className="text-stone-400 tracking-wider text-sm mb-8 uppercase font-mono font-medium">
          Kanagawa — Texas
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Passcode"
            className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-stone-100 text-center text-base font-mono tracking-widest focus:outline-none focus:border-stone-500 transition-all placeholder:text-zinc-600 shadow-inner"
          />
          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-stone-200 text-zinc-900 font-medium text-base hover:bg-white hover:shadow-lg hover:shadow-stone-100/10 transition-all cursor-pointer"
          >
            Connect
          </button>
          {error && <p className="text-red-400/80 text-sm font-mono mt-3">{error}</p>}
        </form>
      </div>
    </main>
  );
}