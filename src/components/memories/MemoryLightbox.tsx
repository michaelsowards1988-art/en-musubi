'use client';

import { X } from 'lucide-react';
import { ThreadComment } from '@/components/shared/ReactionThread';

export interface SharedRecord {
  id: string;
  image_url: string;
  caption: string;
  location: string;
  media_type: 'image' | 'music';
  external_link: string | null;
  created_at: string;
  hearted_by: string[] | null;
  comments: ThreadComment[] | null;
}

interface MemoryLightboxProps {
  record: SharedRecord | null;
  onClose: () => void;
}

export default function MemoryLightbox({ record, onClose }: MemoryLightboxProps) {
  if (!record) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-8 cursor-zoom-out animate-in fade-in duration-200"
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2.5 rounded-full bg-zinc-900 border border-zinc-700 text-stone-300 hover:text-white cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={record.image_url}
        alt={record.caption}
        className="max-w-full max-h-[82vh] object-contain rounded-xl border border-zinc-800 shadow-2xl"
      />
      <p className="mt-4 text-sm font-medium text-stone-200">{record.caption}</p>
    </div>
  );
}