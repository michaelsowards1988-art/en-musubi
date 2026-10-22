'use client';

import { useState, useEffect } from 'react';
import { Image as ImageIcon, Music, Plus, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateId, getNowIso, generateFilePrefix } from '@/lib/utils';
import { fetchAppleMusicArt } from '@/lib/musicScraper';
import CollapsibleSection from '@/components/shared/CollapsibleSection';
import { ThreadComment } from '@/components/shared/ReactionThread';
import MemoryLightbox, { SharedRecord } from '@/components/memories/MemoryLightbox';
import MemoryRecordCard from '@/components/memories/MemoryRecordCard';

interface MemoryVaultProps {
  currentUser: 'Michael' | 'Tamae';
  lang: 'en' | 'ja';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

export default function MemoryVault({ currentUser, lang, title, subtitle, icon }: MemoryVaultProps) {
  const [records, setRecords] = useState<SharedRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [mediaType, setMediaType] = useState<'image' | 'music'>('image');
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [externalLink, setExternalLink] = useState('');

  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lightboxRecord, setLightboxRecord] = useState<SharedRecord | null>(null);

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'memories' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newRecord = payload.new as SharedRecord;
          setRecords((prev) => [newRecord, ...prev.filter((r) => r.id !== newRecord.id)]);
        } else if (payload.eventType === 'UPDATE') {
          setRecords((prev) =>
            prev.map((r) => (r.id === payload.new.id ? (payload.new as SharedRecord) : r))
          );
        } else if (payload.eventType === 'DELETE') {
          setRecords((prev) => prev.filter((r) => r.id !== payload.old.id));
        }
      })
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
        const fileName = `vault/${generateFilePrefix()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('photos').getPublicUrl(fileName);

        finalImageUrl = publicUrl;
      } else if (mediaType === 'music') {
        const scrapedArt = await fetchAppleMusicArt(externalLink);
        finalImageUrl =
          scrapedArt ||
          'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?q=80&w=500&auto=format&fit=crop';
      }

      const location = currentUser === 'Michael' ? 'Michael' : 'Tamae';

      await supabase.from('memories').insert([
        {
          image_url: finalImageUrl,
          caption,
          location,
          media_type: mediaType,
          external_link: externalLink || null,
        },
      ]);

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

  const deleteRecord = async (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    await supabase.from('memories').delete().eq('id', id);
  };

  const toggleHeart = async (record: SharedRecord) => {
    const currentHearts = record.hearted_by || [];
    const newHearts = currentHearts.includes(currentUser)
      ? currentHearts.filter((u) => u !== currentUser)
      : [...currentHearts, currentUser];

    setRecords(records.map((r) => (r.id === record.id ? { ...r, hearted_by: newHearts } : r)));
    await supabase.from('memories').update({ hearted_by: newHearts }).eq('id', record.id);
  };

  const postReply = async (content: string, record: SharedRecord) => {
    const author = currentUser === 'Michael' ? 'Texas' : 'Kanagawa';
    const newComment: ThreadComment = {
      id: generateId(),
      author,
      content,
      created_at: getNowIso(),
    };
    const newComments = [...(record.comments || []), newComment];

    setRecords(records.map((r) => (r.id === record.id ? { ...r, comments: newComments } : r)));
    await supabase.from('memories').update({ comments: newComments }).eq('id', record.id);
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
      className="flex items-center gap-1.5 text-xs font-mono bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-stone-300 hover:bg-zinc-800 transition-all cursor-pointer"
    >
      <Plus className="w-3.5 h-3.5" />
      <span className="hidden md:inline">{lang === 'ja' ? '記録追加' : 'Add Record'}</span>
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
        <div className="flex items-center justify-center text-stone-500 font-mono text-xs py-4">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading Records...
        </div>
      ) : (
        <>
          {isAdding && (
            <form
              onSubmit={addRecord}
              className="mb-6 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-3"
            >
              <div className="flex gap-3 mb-1">
                <button
                  type="button"
                  onClick={() => {
                    setMediaType('image');
                    setExternalLink('');
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    mediaType === 'image'
                      ? 'bg-stone-800 text-stone-200 border border-stone-700'
                      : 'bg-zinc-950 text-stone-500 border border-zinc-800'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" /> Photo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMediaType('music');
                    setImageFile(null);
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    mediaType === 'music'
                      ? 'bg-stone-800 text-stone-200 border border-stone-700'
                      : 'bg-zinc-950 text-stone-500 border border-zinc-800'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" /> Music
                </button>
              </div>

              <div className="flex gap-3">
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
                placeholder={
                  mediaType === 'music'
                    ? 'Caption (e.g., Gesaffelstein - Pursuit)'
                    : 'Caption (e.g., Sunset by the lake)'
                }
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-stone-200 focus:outline-none focus:border-stone-500"
              />

              <button
                type="submit"
                disabled={isSaving}
                className="py-2.5 mt-1 rounded-lg bg-stone-200 text-zinc-950 text-sm font-medium hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {records.length === 0 ? (
              <p className="text-xs text-stone-600 font-mono text-center py-8 col-span-2">
                No records logged yet.
              </p>
            ) : (
              records.map((record) => (
                <MemoryRecordCard
                  key={record.id}
                  record={record}
                  currentUser={currentUser}
                  lang={lang}
                  onOpenLightbox={setLightboxRecord}
                  onDelete={deleteRecord}
                  onToggleHeart={toggleHeart}
                  onPostReply={postReply}
                />
              ))
            )}
          </div>

          <MemoryLightbox record={lightboxRecord} onClose={() => setLightboxRecord(null)} />
        </>
      )}
    </CollapsibleSection>
  );
}