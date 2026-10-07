import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Send, Sparkles } from 'lucide-react';

export interface ThreadComment {
  id: string;
  author: string;
  content: string;
  created_at: string;
}

interface ReactionThreadProps {
  currentUser: 'Michael' | 'Tamae'; // Kept in interface so parent components don't throw TypeScript errors
  heartedBy: string[];
  comments: ThreadComment[];
  onToggleHeart: () => void;
  onAddComment: (content: string) => void;
}

const AVATARS = {
  Kanagawa: 'https://sizdewlxjcfdekzzdofw.supabase.co/storage/v1/object/public/photos/Tamae.png',
  Texas: 'https://sizdewlxjcfdekzzdofw.supabase.co/storage/v1/object/public/photos/Michael.png'
};

export default function ReactionThread({ heartedBy, comments, onToggleHeart, onAddComment }: ReactionThreadProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const bothHearted = heartedBy.length >= 2;
  const anyoneHearted = heartedBy.length > 0;

  // Auto-close the reply input when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setIsReplying(false);
      }
    };

    if (isReplying) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isReplying]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    onAddComment(replyContent);
    setReplyContent('');
    setIsReplying(false);
  };

  return (
    <div className="w-full">
      {/* Action Bar */}
      <div className="flex items-center gap-4 mt-3">
        <button 
          onClick={onToggleHeart}
          className="flex items-center justify-center transition-all cursor-pointer relative"
        >
          {bothHearted ? (
            <div className="relative">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
              <Sparkles className="w-2.5 h-2.5 text-amber-400 absolute -top-1 -right-1" />
            </div>
          ) : anyoneHearted ? (
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          ) : (
            <Heart className="w-3.5 h-3.5 text-stone-500 hover:text-stone-300" />
          )}
        </button>
        
        <button 
          onClick={() => setIsReplying(!isReplying)}
          className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {comments.length > 0 && <span className="font-mono text-[10px]">{comments.length}</span>}
        </button>
      </div>

      {/* Comments Thread */}
      {(comments.length > 0 || isReplying) && (
        <div className="ml-1 pl-4 border-l-2 border-zinc-800/50 flex flex-col gap-3 mt-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full overflow-hidden border border-stone-500/20 bg-zinc-950 shrink-0 mt-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={AVATARS[comment.author as keyof typeof AVATARS] || AVATARS.Texas} 
                  alt={comment.author} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="flex-1 min-w-0 bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800/40">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] font-mono text-stone-500 uppercase">
                    {comment.author === 'Kanagawa' ? 'Tamae' : 'Michael'}
                  </span>
                </div>
                <p className="text-xs text-stone-300 whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          ))}

          {isReplying && (
            <form ref={formRef} onSubmit={handleSubmit} className="flex items-center gap-2 mt-1 animate-in fade-in duration-300">
              <input
                type="text"
                autoFocus
                placeholder="Add a thought..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="flex-1 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-stone-200 focus:outline-none focus:border-stone-500"
              />
              <button type="submit" disabled={!replyContent.trim()} className="p-2 rounded-lg bg-stone-200 text-zinc-950 hover:bg-white transition-all disabled:opacity-50 disabled:hover:bg-stone-200 cursor-pointer">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}