'use client';

import { Image as ImageIcon, Music, ExternalLink, Trash2 } from 'lucide-react';
import ReactionThread from '@/components/shared/ReactionThread';
import { SharedRecord } from '@/components/memories/MemoryLightbox';

interface MemoryRecordCardProps {
  record: SharedRecord;
  currentUser: 'Michael' | 'Tamae';
  lang: 'en' | 'ja';
  onOpenLightbox: (record: SharedRecord) => void;
  onDelete: (id: string) => void;
  onToggleHeart: (record: SharedRecord) => void;
  onPostReply: (content: string, record: SharedRecord) => void;
}

export default function MemoryRecordCard({
  record,
  currentUser,
  lang,
  onOpenLightbox,
  onDelete,
  onToggleHeart,
  onPostReply,
}: MemoryRecordCardProps) {
  const isMusic = record.media_type === 'music';
  const displayLocation =
    record.location === 'Texas'
      ? 'Michael'
      : record.location === 'Kanagawa'
        ? 'Tamae'
        : record.location;

  return (
    <div className="rounded-xl overflow-hidden bg-zinc-900/40 border border-zinc-800/60 group relative flex flex-col">
      <div
        className={`${
          isMusic ? 'h-56 sm:h-64' : 'max-h-112 flex items-center justify-center'
        } overflow-hidden relative bg-zinc-950`}
      >
        {isMusic && record.external_link ? (
          <a
            href={record.external_link}
            target="_blank"
            rel="noreferrer"
            className="block w-full h-full cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={record.image_url}
              alt={record.caption}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-80 blur-[2px] scale-105 group-hover:blur-none"
            />
          </a>
        ) : (
          <div
            onClick={() => onOpenLightbox(record)}
            className="w-full flex items-center justify-center cursor-zoom-in"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={record.image_url}
              alt={record.caption}
              className="w-full h-auto max-h-112 object-contain group-hover:scale-[1.02] transition-transform duration-500 opacity-95"
            />
          </div>
        )}

        <div className="absolute top-3 left-3 flex gap-2 pointer-events-none">
          <span className="px-2 py-1 rounded text-[10px] font-mono bg-zinc-950/80 backdrop-blur-md text-stone-300 border border-zinc-800 flex items-center gap-1.5 shadow-sm">
            {isMusic ? (
              <Music className="w-3 h-3 text-amber-500" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5 text-stone-400" />
            )}
            {displayLocation}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onDelete(record.id)}
          title={lang === 'ja' ? '削除' : 'Delete'}
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-stone-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between bg-zinc-900/40">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-stone-200">{record.caption}</p>
          <span className="text-[10px] font-mono text-stone-500 shrink-0 mt-0.5">
            {new Date(record.created_at).toLocaleDateString()}
          </span>
        </div>

        {isMusic && record.external_link && (
          <div className="mt-2">
            <a
              href={record.external_link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-500 hover:text-amber-400 transition-colors relative z-10 cursor-pointer"
            >
              Listen <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        <div className="mt-2 pt-2 border-t border-zinc-800/40">
          <ReactionThread
            currentUser={currentUser}
            heartedBy={record.hearted_by || []}
            comments={record.comments || []}
            onToggleHeart={() => onToggleHeart(record)}
            onAddComment={(content) => onPostReply(content, record)}
          />
        </div>
      </div>
    </div>
  );
}