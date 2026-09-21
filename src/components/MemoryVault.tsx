'use client';

import { useState, useEffect } from 'react';
import { Image as ImageIcon, Music, Plus, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchAppleMusicArt } from '@/lib/musicScraper';

interface SharedRecord {
  id: string;
  image_url: string;
  caption: string;
  location: string;
  media_type: 'image' | 'music';
  external_link: string | null;
  created_at: string;
}

export default function MemoryVault() {
  const [records, setRecords] = useState<SharedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [mediaType, setMediaType] = useState<'image' | 'music'>('image');
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [location, setLocation] = useState('Texas');
  const [externalLink, setExternalLink] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchRecords() {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('created_at', { ascending: false });

      if (isMounted) {
        if (!error && data) {
          setRecords(data);
        }
        setLoading(false);
      }
    }

    fetchRecords();

    const channel = supabase
      .channel('public:memories')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'memories' },
        (payload) => {
          const newRecord = payload.new as SharedRecord;
          setRecords((prev) => [newRecord, ...prev]);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const addRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption) return;
    if (mediaType === 'image' && !imageFile) return;
    if (mediaType === 'music' && !externalLink) return;

    setIsSaving(true);
    let finalImageUrl = '';

    try {
      if (mediaType === 'image' && imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `vault/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(fileName);

        finalImageUrl = publicUrl;
      } else if (mediaType === 'music') {
        const scrapedArt = await fetchAppleMusicArt(externalLink);
        finalImageUrl = scrapedArt || 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?q=80&w=500&auto=format&fit=crop';
      }

      await supabase
        .from('memories')
        .insert([{ 
          image_url: finalImageUrl, 
          caption, 
          location,
          media_type: mediaType,
          external_link: externalLink || null
        }]);

      setImageFile(null);
      setCaption('');
      setExternalLink('');
      setIsAdding(false);
    } catch (error) {
      console.error('Error saving record:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center text-stone-500 font-mono text-xs py-4">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading Records...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-4 pb-3 border-b border-zinc-800/40">
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 text-xs font-mono bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-stone-300 hover:bg-zinc-800 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Record</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={addRecord} className="mb-6 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-3">
          <div className="flex gap-3 mb-1">
            <button
              type="button"
              onClick={() => { setMediaType('image'); setExternalLink(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-mono flex items-center justify-center gap-2 transition-all ${mediaType === 'image' ? 'bg-stone-800 text-stone-200 border border-stone-700' : 'bg-zinc-950 text-stone-500 border border-zinc-800'}`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Photo
            </button>
            <button
              type="button"
              onClick={() => { setMediaType('music'); setImageFile(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-mono flex items-center justify-center gap-2 transition-all ${mediaType === 'music' ? 'bg-stone-800 text-stone-200 border border-stone-700' : 'bg-zinc-950 text-stone-500 border border-zinc-800'}`}
            >
              <Music className="w-3.5 h-3.5" /> Music
            </button>
          </div>

          <div className="flex gap-3">
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-stone-300 focus:outline-none focus:border-stone-500"
            >
              <option value="Texas">Texas</option>
              <option value="Kanagawa">Kanagawa</option>
            </select>
            
            {mediaType === 'image' ? (
              <input
                key="image-upload-input"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="flex-1 block w-full text-sm text-stone-400 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-mono file:bg-stone-800 file:text-stone-300 hover:file:bg-stone-700 transition-all bg-zinc-950 border border-zinc-800 rounded-lg cursor-pointer focus:outline-none focus:border-stone-500"
              />
            ) : (
              <input
                key="music-link-input"
                type="text"
                placeholder="Paste Apple Music Link..."
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                className="flex-1 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-stone-200 focus:outline-none focus:border-stone-500 font-mono"
              />
            )}
          </div>
          
          <input
            type="text"
            placeholder={mediaType === 'music' ? 'Caption (e.g., Gesaffelstein - Pursuit)' : 'Caption (e.g., Sunset by the lake)'}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-stone-200 focus:outline-none focus:border-stone-500"
          />

          <button 
            type="submit" 
            disabled={isSaving}
            className="py-2.5 mt-1 rounded-lg bg-stone-200 text-zinc-950 text-sm font-medium hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 text-zinc-950 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-700" />
            )}
            <span>{isSaving ? 'Fetching & Saving...' : 'Save to Records'}</span>
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {records.length === 0 ? (
          <p className="text-xs text-stone-600 font-mono text-center py-8 col-span-2">No records logged yet.</p>
        ) : (
          records.map((record) => {
            const isMusic = record.media_type === 'music';
            
            return (
              <div key={record.id} className="rounded-xl overflow-hidden bg-zinc-900/40 border border-zinc-800/60 group relative flex flex-col">
                <div className={`${isMusic ? 'h-56 sm:h-64' : 'h-48 md:h-56'} overflow-hidden relative bg-zinc-950`}>
                  {/* Make the image clickable if it is music and has a link */}
                  {isMusic && record.external_link ? (
                    <a href={record.external_link} target="_blank" rel="noreferrer" className="block w-full h-full cursor-pointer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={record.image_url} 
                        alt={record.caption} 
                        className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-80 ${isMusic ? 'blur-[2px] scale-105 group-hover:blur-none' : ''}`} 
                      />
                    </a>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={record.image_url} 
                      alt={record.caption} 
                      className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-80 ${isMusic ? 'blur-[2px] scale-105 group-hover:blur-none' : ''}`} 
                    />
                  )}
                  
                  {/* Badge overlay with pointer-events-none so it doesn't block the link click */}
                  <div className="absolute top-3 left-3 flex gap-2 pointer-events-none">
                    <span className="px-2 py-1 rounded text-[10px] font-mono bg-zinc-950/80 backdrop-blur-md text-stone-300 border border-zinc-800 flex items-center gap-1.5 shadow-sm">
                      {isMusic ? <Music className="w-3 h-3 text-amber-500" /> : <ImageIcon className="w-3 h-3 text-stone-400" />}
                      {record.location}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 flex-1 flex flex-col justify-between bg-zinc-900/40">
                  <div>
                    <p className="text-sm font-medium text-stone-200">{record.caption}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] font-mono text-stone-500">
                      {new Date(record.created_at).toLocaleDateString()}
                    </span>
                    {isMusic && record.external_link && (
                      <a 
                        href={record.external_link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[10px] font-mono text-amber-500 hover:text-amber-400 transition-colors relative z-10"
                      >
                        Listen <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}