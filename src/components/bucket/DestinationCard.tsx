'use client';

import React from 'react';
import {
  CheckCircle2,
  MapPin,
  Trash2,
  Heart,
  ChevronUp,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { getPersonalAvatarUrl } from '@/lib/utils';
import { Destination } from '@/components/bucket/bucketTypes';
import DestinationIdeaList from '@/components/bucket/DestinationIdeaList';

interface DestinationCardProps {
  item: Destination;
  currentUser: 'Michael' | 'Tamae';
  lang: 'en' | 'ja';
  avatarBust: string;
  isExpanded: boolean;
  isBursting: boolean;
  onToggleExpand: (item: Destination) => void;
  onToggleStatus: (e: React.MouseEvent, id: string, currentStatus: Destination['status']) => void;
  onDeleteDestination: (e: React.MouseEvent, id: string) => void;
  onJoinWish: (e: React.MouseEvent, item: Destination) => void;
  onAddIdea: (dest: Destination, content: string) => void;
  onDeleteIdea: (e: React.MouseEvent, destId: string, ideaId: string) => void;
  onToggleIdeaHeart: (destId: string, ideaId: string) => void;
  onPostIdeaReply: (content: string, destId: string, ideaId: string) => void;
}

export default function DestinationCard({
  item,
  currentUser,
  lang,
  avatarBust,
  isExpanded,
  isBursting,
  onToggleExpand,
  onToggleStatus,
  onDeleteDestination,
  onJoinWish,
  onAddIdea,
  onDeleteIdea,
  onToggleIdeaHeart,
  onPostIdeaReply,
}: DestinationCardProps) {
  const isShared = item.interested_users.length > 1;
  const isMineOnly = item.interested_users.includes(currentUser) && !isShared;
  const isPartnerOnly = !item.interested_users.includes(currentUser);
  const isExperienced = item.status === 'experienced';

  return (
    <div
      className={`relative rounded-xl border transition-all duration-700 overflow-hidden flex flex-col cursor-pointer group
        ${
          isExpanded
            ? isShared
              ? 'bg-red-950/10 border-red-900/30'
              : 'bg-zinc-900/40 border-zinc-700/60'
            : isExperienced
              ? 'bg-zinc-950/80 border-zinc-900 opacity-60'
              : isShared
                ? 'bg-red-950/20 border-red-900/50 hover:border-red-700/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
        }
      `}
    >
      <div
        onClick={() => onToggleExpand(item)}
        className="p-4 flex items-center justify-between gap-3 w-full"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            onClick={(e) => onToggleStatus(e, item.id, item.status)}
            className="cursor-pointer shrink-0"
          >
            {isExperienced ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 transition-transform hover:scale-110" />
            ) : (
              <MapPin
                className={`w-5 h-5 transition-transform hover:scale-110 ${
                  isShared ? 'text-red-500' : 'text-zinc-500'
                }`}
              />
            )}
          </div>
          <span
            className={`text-base font-medium transition-colors truncate ${
              isExperienced
                ? 'text-zinc-500 line-through'
                : isShared
                  ? 'text-red-100'
                  : 'text-zinc-200'
            }`}
          >
            {item.title}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative">
          <button
            type="button"
            onClick={(e) => onDeleteDestination(e, item.id)}
            title={lang === 'ja' ? '削除' : 'Delete'}
            className="p-1.5 text-stone-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="flex -space-x-2">
            {item.interested_users.map((user) => (
              <div
                key={user}
                className={`w-7 h-7 rounded-full border-2 overflow-hidden ${
                  isShared ? 'border-red-600' : 'border-zinc-700'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getPersonalAvatarUrl(user, avatarBust)}
                  alt={user}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          {!isShared && isPartnerOnly && !isExperienced && (
            <button
              onClick={(e) => onJoinWish(e, item)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-red-900/50 hover:text-red-400 text-xs font-mono text-zinc-300 transition-all cursor-pointer border border-transparent hover:border-red-700/50"
            >
              <Heart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'ja' ? '私も！' : 'Me too!'}</span>
            </button>
          )}

          {!isShared && isMineOnly && !isExperienced && (
            <span className="text-[10px] font-mono text-zinc-600 border border-zinc-800 px-2 py-1 rounded bg-zinc-950">
              {lang === 'ja' ? '待機中...' : 'Waiting...'}
            </span>
          )}

          <div className="text-zinc-500 ml-1 shrink-0">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>

          {isBursting && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-50">
              <Sparkles className="w-6 h-6 text-red-500 animate-ping absolute" />
              {[...Array(12)].map((_, i) => {
                const angle = i * 30 * (Math.PI / 180);
                const distance = 30 + ((i * 7) % 20);
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                return (
                  <div
                    key={i}
                    className="absolute w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,1)]"
                    style={
                      {
                        animation: `bucketBurst 1s ease-out forwards`,
                        '--tx': `${x}px`,
                        '--ty': `${y}px`,
                      } as React.CSSProperties
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <DestinationIdeaList
          destination={item}
          isShared={isShared}
          lang={lang}
          avatarBust={avatarBust}
          onAddIdea={onAddIdea}
          onDeleteIdea={onDeleteIdea}
          onToggleIdeaHeart={onToggleIdeaHeart}
          onPostIdeaReply={onPostIdeaReply}
        />
      )}
    </div>
  );
}