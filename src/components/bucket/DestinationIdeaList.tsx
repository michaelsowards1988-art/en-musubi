'use client';

import { useState } from 'react';
import {
  MapPin,
  Trash2,
  Heart,
  Sparkles,
  MessageCircle,
  ChevronUp,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { getPersonalAvatarUrl } from '@/lib/utils';
import { Destination } from '@/components/bucket/bucketTypes';

interface DestinationIdeaListProps {
  destination: Destination;
  isShared: boolean;
  lang: 'en' | 'ja';
  avatarBust: string;
  onAddIdea: (dest: Destination, content: string) => void;
  onDeleteIdea: (e: React.MouseEvent, destId: string, ideaId: string) => void;
  onToggleIdeaHeart: (destId: string, ideaId: string) => void;
  onPostIdeaReply: (content: string, destId: string, ideaId: string) => void;
}

export default function DestinationIdeaList({
  destination,
  isShared,
  lang,
  avatarBust,
  onAddIdea,
  onDeleteIdea,
  onToggleIdeaHeart,
  onPostIdeaReply,
}: DestinationIdeaListProps) {
  const [expandedIdeaIds, setExpandedIdeaIds] = useState<string[]>([]);
  const [replyContents, setReplyContents] = useState<Record<string, string>>({});
  const [newIdea, setNewIdea] = useState('');

  const toggleIdeaExpand = (ideaId: string) => {
    setExpandedIdeaIds((prev) =>
      prev.includes(ideaId) ? prev.filter((id) => id !== ideaId) : [...prev, ideaId]
    );
  };

  const handleIdeaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdea.trim()) return;
    onAddIdea(destination, newIdea.trim());
    setNewIdea('');
  };

  return (
    <div
      className="p-4 pt-0 border-t border-zinc-800/50 mt-2 bg-zinc-950/30 cursor-default"
      onClick={(e) => e.stopPropagation()}
    >
      <h5
        className={`text-[10px] font-mono mb-3 mt-4 uppercase tracking-widest flex items-center gap-2 ${
          isShared ? 'text-red-500' : 'text-zinc-500'
        }`}
      >
        <MapPin className="w-3.5 h-3.5" />
        {lang === 'ja' ? 'アイデアと旅程' : 'Itinerary & Ideas'}
      </h5>

      <div className="flex flex-col gap-2.5 mb-4">
        {!destination.ideas || destination.ideas.length === 0 ? (
          <p className="text-xs text-stone-500 font-mono py-2">
            {lang === 'ja'
              ? 'アイデアを追加してください...'
              : 'Add things you want to do here...'}
          </p>
        ) : (
          destination.ideas.map((idea) => {
            const hasComments = idea.comments && idea.comments.length > 0;
            const isIdeaExpanded = expandedIdeaIds.includes(idea.id);

            const currentHearts = idea.hearted_by || [];
            const anyoneHeartedIdea = currentHearts.length > 0;
            const bothHeartedIdea = currentHearts.length >= 2;

            return (
              <div
                key={idea.id}
                className="bg-zinc-900/50 rounded-lg border border-zinc-800/40 overflow-hidden transition-all group/idea"
              >
                <div
                  className="flex items-start gap-2.5 p-3 cursor-pointer hover:bg-zinc-800/30 transition-colors"
                  onClick={() => toggleIdeaExpand(idea.id)}
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 mt-0.5 border border-stone-500/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getPersonalAvatarUrl(idea.author, avatarBust)}
                      alt={idea.author}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-mono text-stone-500 uppercase">
                          {idea.author === 'Kanagawa' ? 'Tamae' : 'Michael'}
                        </span>
                        <span className="text-[9px] font-mono text-stone-600 hidden sm:inline">
                          {new Date(idea.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => onDeleteIdea(e, destination.id, idea.id)}
                          title={lang === 'ja' ? '削除' : 'Delete'}
                          className="text-stone-600 hover:text-red-400 opacity-0 group-hover/idea:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleIdeaHeart(destination.id, idea.id);
                          }}
                          className="transition-all hover:scale-110 cursor-pointer"
                        >
                          {bothHeartedIdea ? (
                            <div className="relative">
                              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
                              <Sparkles className="w-2 h-2 text-amber-400 absolute -top-1 -right-1" />
                            </div>
                          ) : anyoneHeartedIdea ? (
                            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                          ) : (
                            <Heart className="w-3.5 h-3.5 text-stone-500 hover:text-stone-300" />
                          )}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleIdeaExpand(idea.id);
                          }}
                          className={`flex items-center gap-1 transition-colors cursor-pointer ${
                            hasComments && !isIdeaExpanded
                              ? 'text-amber-500 hover:text-amber-400'
                              : 'text-stone-500 hover:text-stone-300'
                          }`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          {hasComments && (
                            <span className="text-[9px] font-mono">{idea.comments!.length}</span>
                          )}
                        </button>

                        {hasComments && (
                          <div
                            className={`ml-1 ${
                              hasComments && !isIdeaExpanded ? 'text-amber-500' : 'text-stone-500'
                            }`}
                          >
                            {isIdeaExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-stone-300 mb-1">{idea.content}</p>
                  </div>
                </div>

                {isIdeaExpanded && (
                  <div
                    className="px-3 pb-3 bg-zinc-900/20 cursor-default"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="ml-7 pl-3 border-l-2 border-zinc-800/50 flex flex-col gap-2.5 pt-2">
                      {idea.comments?.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full overflow-hidden border border-stone-500/20 bg-zinc-950 shrink-0 mt-0.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getPersonalAvatarUrl(comment.author, avatarBust)}
                              alt={comment.author}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0 bg-zinc-950/50 p-2 rounded-lg border border-zinc-800/40">
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="text-[9px] font-mono text-stone-500 uppercase">
                                {comment.author === 'Kanagawa' ? 'Tamae' : 'Michael'}
                              </span>
                            </div>
                            <p className="text-xs text-stone-300 whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))}

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const content = replyContents[idea.id];
                          if (content?.trim()) {
                            onPostIdeaReply(content, destination.id, idea.id);
                            setReplyContents((prev) => ({ ...prev, [idea.id]: '' }));
                          }
                        }}
                        className="flex items-center gap-2 mt-1 animate-in fade-in"
                      >
                        <input
                          type="text"
                          placeholder={hasComments ? 'Add a reply...' : 'Add a thought...'}
                          value={replyContents[idea.id] || ''}
                          onChange={(e) =>
                            setReplyContents((prev) => ({
                              ...prev,
                              [idea.id]: e.target.value,
                            }))
                          }
                          className="flex-1 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-stone-200 focus:outline-none focus:border-red-700/50"
                        />
                        <button
                          type="submit"
                          disabled={!replyContents[idea.id]?.trim()}
                          className="p-2 rounded-lg bg-red-600/80 text-white hover:bg-red-500 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleIdeaSubmit} className="flex gap-2 mt-2">
        <input
          type="text"
          value={newIdea}
          onChange={(e) => setNewIdea(e.target.value)}
          placeholder={lang === 'ja' ? 'アイデアを追加...' : 'Add an idea...'}
          className="flex-1 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-stone-200 focus:outline-none focus:border-red-700/50"
        />
        <button
          type="submit"
          disabled={!newIdea.trim()}
          className={`px-4 rounded-lg text-white transition-all disabled:opacity-50 cursor-pointer ${
            isShared ? 'bg-red-600/80 hover:bg-red-500' : 'bg-zinc-700 hover:bg-zinc-600'
          }`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}