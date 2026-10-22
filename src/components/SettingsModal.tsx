'use client';

import { useState } from 'react';
import { X, Camera, Loader2, Check, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: 'Michael' | 'Tamae';
  lang: 'en' | 'ja';
  avatarBust: number;
  onAvatarUpdated: (newBust: number) => void;
}

const BASE_AVATARS = {
  Tamae: 'https://sizdewlxjcfdekzzdofw.supabase.co/storage/v1/object/public/photos/Tamae.png',
  Michael: 'https://sizdewlxjcfdekzzdofw.supabase.co/storage/v1/object/public/photos/Michael.png',
};

export default function SettingsModal({
  isOpen,
  onClose,
  currentUser,
  lang,
  avatarBust,
  onAvatarUpdated,
}: SettingsModalProps) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const currentAvatarUrl = `${BASE_AVATARS[currentUser]}?v=${avatarBust}`;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setErrorMsg('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avatarFile) {
      onClose();
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      const fileName = `${currentUser}.png`;
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, avatarFile, {
          upsert: true,
          cacheControl: '0',
          contentType: avatarFile.type,
        });

      if (uploadError) throw uploadError;

      const newBust = Date.now();
      localStorage.setItem('avatar_bust', newBust.toString());
      onAvatarUpdated(newBust);
      setAvatarFile(null);
      setAvatarPreview(null);
      onClose();
    } catch (err: unknown) {
      console.error('Failed to update avatar:', err);
      setErrorMsg(lang === 'ja' ? '画像のアップロードに失敗しました' : 'Failed to upload photo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-medium text-stone-100">
              {lang === 'ja' ? 'プロフィール設定' : 'Profile Settings'}
            </h3>
            <p className="text-[11px] font-mono text-stone-400 mt-0.5">
              {currentUser} ({currentUser === 'Tamae' ? 'Kanagawa' : 'Texas'})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-stone-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 flex flex-col items-center space-y-5">
          <label className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-amber-500/70 bg-zinc-950 cursor-pointer group shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarPreview || currentAvatarUrl}
              alt={currentUser}
              className="w-full h-full object-cover group-hover:opacity-60 transition-opacity"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </label>

          <p className="text-xs font-mono text-stone-400 text-center">
            {lang === 'ja'
              ? 'アイコンをタップして新しい写真を選択'
              : 'Tap your icon above to choose a new photo'}
          </p>

          {errorMsg && <p className="text-xs font-mono text-red-400 text-center">{errorMsg}</p>}

          <button
            type="submit"
            disabled={isSaving || !avatarFile}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>{lang === 'ja' ? 'アイコンを保存' : 'Save New Photo'}</span>
          </button>
        </form>

        <div className="p-5 pt-3 border-t border-zinc-800/80 bg-zinc-950/40">
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.reload();
            }}
            className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-stone-300 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{lang === 'ja' ? 'ログアウト' : 'Lock Sanctuary (Sign Out)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}