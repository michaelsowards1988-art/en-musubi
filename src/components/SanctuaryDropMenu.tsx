'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Sparkles } from 'lucide-react';

export interface DropItem {
  emoji: string;
  labelEn: string;
  labelJa: string;
  isCustom?: boolean;
}

export interface DropPack {
  id: string;
  nameEn: string;
  nameJa: string;
  badgeEn: string;
  badgeJa: string;
  items: DropItem[];
}

export const SANCTUARY_DROP_PACKS: DropPack[] = [
  {
    id: 'classics',
    nameEn: 'Classics',
    nameJa: '定番',
    badgeEn: 'Signature',
    badgeJa: 'オリジナル',
    items: [
      { emoji: '💄', labelEn: 'Lipstick', labelJa: 'リップ' },
      { emoji: '☕', labelEn: 'Coffee', labelJa: 'コーヒー' },
      { emoji: '🍫', labelEn: 'Chocolate', labelJa: 'チョコレート' },
      { emoji: '🍵', labelEn: 'Matcha', labelJa: '抹茶' },
      { emoji: '🥞', labelEn: 'Pancakes', labelJa: 'パンケーキ' },
      { emoji: '🥙', labelEn: 'Pita Moon', labelJa: 'ピタパンの月' },
      { emoji: '🪷', labelEn: 'Lotus', labelJa: '蓮の花' },
      { emoji: '♨️', labelEn: 'Onsen', labelJa: '温泉' },
      { emoji: '💋', labelEn: 'Kiss Mark', labelJa: 'ちゅっ！' },
    ],
  },
  {
    id: 'seasons',
    nameEn: 'Seasons',
    nameJa: '四季',
    badgeEn: 'Kigo',
    badgeJa: '季節の彩り',
    items: [
      { emoji: '🌸', labelEn: 'Sakura', labelJa: '桜' },
      { emoji: '🍁', labelEn: 'Momiji', labelJa: '紅葉' },
      { emoji: '🌕', labelEn: 'Full Moon', labelJa: '名月' },
      { emoji: '🎋', labelEn: 'Tanabata', labelJa: '七夕' },
      { emoji: '🎐', labelEn: 'Wind Chime', labelJa: '風鈴' },
      { emoji: '❄️', labelEn: 'First Snow', labelJa: '初雪' },
      { emoji: '🍡', labelEn: 'Tsukimi Dango', labelJa: '月見団子' },
      { emoji: '⛩️', labelEn: 'Shrine Gate', labelJa: '鳥居' },
      { emoji: '🌊', labelEn: 'Pacific Wave', labelJa: '太平洋の波' },
    ],
  },
  {
    id: 'cozy',
    nameEn: 'Cozy',
    nameJa: '癒やし',
    badgeEn: 'Otsukaresama',
    badgeJa: 'お疲れ様',
    items: [
      { emoji: '🥂', labelEn: 'Evening Toast', labelJa: '乾杯' },
      { emoji: '🍶', labelEn: 'Warm Sake', labelJa: '熱燗' },
      { emoji: '🍜', labelEn: 'Ramen', labelJa: 'ラーメン' },
      { emoji: '🍙', labelEn: 'Onigiri', labelJa: 'おにぎり' },
      { emoji: '🍰', labelEn: 'Shortcake', labelJa: 'ケーキ' },
      { emoji: '🕯️', labelEn: 'Warm Light', labelJa: '灯火' },
      { emoji: '🌙', labelEn: 'Goodnight', labelJa: 'おやすみ' },
      { emoji: '✈️', labelEn: 'Counting Down', labelJa: '再会へ' },
      { emoji: '💌', labelEn: 'Love Note', labelJa: '恋文' },
    ],
  },
  {
    id: 'romance',
    nameEn: 'Sweet',
    nameJa: '愛と遊び心',
    badgeEn: 'En-Musubi',
    badgeJa: '縁結び',
    items: [
      { emoji: '🎀', labelEn: 'Red Knot', labelJa: '赤い結び' },
      { emoji: '❤️‍🔥', labelEn: 'Heart on Fire', labelJa: '情熱' },
      { emoji: '🫂', labelEn: 'Warm Hug', labelJa: 'ハグ' },
      { emoji: '✨', labelEn: 'Thinking of You', labelJa: '想ってるよ' },
      { emoji: '🎶', labelEn: 'Our Song', labelJa: 'ふたりの音楽' },
      { emoji: '🌹', labelEn: 'Single Rose', labelJa: '薔薇' },
      { emoji: '👑', labelEn: 'My Favorite', labelJa: '特別' },
      { emoji: '🥰', labelEn: 'Adore You', labelJa: '大好き' },
      { emoji: '💋', labelEn: 'Muah! / ちゅっ', labelJa: 'ちゅっ！' },
    ],
  },
];

const CUSTOM_DROPS_STORAGE_KEY = 'en_musubi_custom_drops_v1';

interface SanctuaryDropMenuProps {
  lang: 'en' | 'ja';
  activeDrops: string[];
  onToggleDrop: (emoji: string) => void;
  onTriggerKissBurst?: () => void;
}

export const SanctuaryDropMenu: React.FC<SanctuaryDropMenuProps> = ({
  lang,
  activeDrops = [],
  onToggleDrop,
  onTriggerKissBurst,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<string>('classics');
  const [justSentEmoji, setJustSentEmoji] = useState<string | null>(null);

  // Lazy-initialized state for React 19 ESLint compliance
  const [customItems, setCustomItems] = useState<DropItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(CUSTOM_DROPS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load custom drops:', e);
      return [];
    }
  });

  const [newEmojiInput, setNewEmojiInput] = useState('');
  const [newLabelInput, setNewLabelInput] = useState('');

  const saveCustomItems = (items: DropItem[]) => {
    setCustomItems(items);
    try {
      localStorage.setItem(CUSTOM_DROPS_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save custom drops:', e);
    }
  };

  const handleAddCustomEmoji = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmoji = newEmojiInput.trim();
    if (!trimmedEmoji) return;

    const label = newLabelInput.trim() || (lang === 'ja' ? 'カスタム' : 'Custom');
    const newItem: DropItem = {
      emoji: trimmedEmoji,
      labelEn: label,
      labelJa: label,
      isCustom: true,
    };

    const updated = [newItem, ...customItems.filter((i) => i.emoji !== trimmedEmoji)];
    saveCustomItems(updated);
    setNewEmojiInput('');
    setNewLabelInput('');
  };

  const handleDeleteCustomEmoji = (e: React.MouseEvent, emojiToRemove: string) => {
    e.stopPropagation();
    const updated = customItems.filter((i) => i.emoji !== emojiToRemove);
    saveCustomItems(updated);
  };

  const allPacks: DropPack[] = [
    ...SANCTUARY_DROP_PACKS,
    {
      id: 'custom',
      nameEn: '+ Custom',
      nameJa: '+ 追加',
      badgeEn: 'Custom',
      badgeJa: '自由追加',
      items: customItems,
    },
  ];

  const currentPack = allPacks.find((p) => p.id === selectedPackId) || allPacks[0];

  const handleSelectEmoji = (item: DropItem) => {
    setJustSentEmoji(item.emoji);
    setTimeout(() => setJustSentEmoji(null), 500);

    onToggleDrop(item.emoji);

    if (item.emoji === '💋' && onTriggerKissBurst) {
      onTriggerKissBurst();
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block">
      {/* The + Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={lang === 'en' ? 'Otsukaresama Drops' : 'お疲れ様ドロップ'}
        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 border cursor-pointer ${
          isOpen
            ? 'bg-amber-500/20 border-amber-400/60 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] rotate-45'
            : 'bg-zinc-900/90 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500'
        }`}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <>
          {/* Invisible backdrop to close when tapping outside */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 mt-2.5 w-76 sm:w-84 rounded-2xl bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/90 shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-3.5 z-50 animate-in fade-in zoom-in-95 duration-200">
            {/* Minimalist Header */}
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-800/80">
              <h4 className="text-xs font-mono font-semibold tracking-widest uppercase text-stone-200">
                {lang === 'en' ? 'Otsukaresama Drops' : 'お疲れ様ドロップ'}
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
                {lang === 'en' ? currentPack.badgeEn : currentPack.badgeJa}
              </span>
            </div>

            {/* Wrapped Pack Selector Pills — Zero Scrollbars! */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              {allPacks.map((pack) => {
                const isSelected = pack.id === selectedPackId;
                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => setSelectedPackId(pack.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                        : 'bg-zinc-900/70 text-zinc-400 border border-zinc-800/60 hover:text-zinc-200 hover:bg-zinc-900'
                    }`}
                  >
                    {lang === 'en' ? pack.nameEn : pack.nameJa}
                  </button>
                );
              })}
            </div>

            {/* Custom Emoji Creator Bar */}
            {selectedPackId === 'custom' && (
              <form
                onSubmit={handleAddCustomEmoji}
                className="mb-3 p-2 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex items-center gap-1.5"
              >
                <input
                  type="text"
                  placeholder="😊"
                  value={newEmojiInput}
                  onChange={(e) => setNewEmojiInput(e.target.value)}
                  className="w-10 p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-center text-sm text-zinc-100 focus:outline-none focus:border-amber-500/50"
                  maxLength={8}
                />
                <input
                  type="text"
                  placeholder={lang === 'ja' ? 'ラベル' : 'Label'}
                  value={newLabelInput}
                  onChange={(e) => setNewLabelInput(e.target.value)}
                  className="flex-1 min-w-0 p-1.5 px-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
                  maxLength={18}
                />
                <button
                  type="submit"
                  disabled={!newEmojiInput.trim()}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white text-xs font-medium transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{lang === 'ja' ? '追加' : 'Add'}</span>
                </button>
              </form>
            )}

            {/* 3x3 Curated Emoji Grid */}
            {currentPack.items.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500 font-mono">
                {lang === 'ja'
                  ? '上の入力欄から好きな絵文字を追加 ✨'
                  : 'Add any emoji above ✨'}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {currentPack.items.map((item, idx) => {
                  const isUnpoppedOnCard = activeDrops.includes(item.emoji);
                  const isJustSent = justSentEmoji === item.emoji;

                  return (
                    <button
                      key={`${currentPack.id}-${item.emoji}-${idx}`}
                      type="button"
                      onClick={() => handleSelectEmoji(item)}
                      className={`group relative flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl border transition-all duration-200 cursor-pointer bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/80 hover:border-zinc-700 ${
                        isJustSent ? 'scale-90 border-amber-500/60 bg-amber-500/10' : 'hover:scale-[1.03]'
                      }`}
                    >
                      <span className="text-2xl leading-none select-none transition-transform duration-200 group-hover:scale-110">
                        {item.emoji}
                      </span>
                      <span className="mt-1.5 text-[10px] font-medium truncate max-w-full text-zinc-400 group-hover:text-zinc-200">
                        {lang === 'en' ? item.labelEn : item.labelJa}
                      </span>

                      {/* Subtle tiny dot showing it's currently waiting on the card */}
                      {isUnpoppedOnCard && (
                        <span
                          title={lang === 'ja' ? '送信済み' : 'Sent on card'}
                          className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400/80"
                        />
                      )}

                      {/* Delete button for custom emojis */}
                      {item.isCustom && (
                        <span
                          onClick={(e) => handleDeleteCustomEmoji(e, item.emoji)}
                          title={lang === 'ja' ? '削除' : 'Remove'}
                          className="absolute top-1 left-1 p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};