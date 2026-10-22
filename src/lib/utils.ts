export type PersonalUser = 'Michael' | 'Tamae';

export const BASE_AVATARS: Record<'Michael' | 'Tamae' | 'Texas' | 'Kanagawa', string> = {
  Tamae: 'https://sizdewlxjcfdekzzdofw.supabase.co/storage/v1/object/public/photos/Tamae.png',
  Michael: 'https://sizdewlxjcfdekzzdofw.supabase.co/storage/v1/object/public/photos/Michael.png',
  Kanagawa: 'https://sizdewlxjcfdekzzdofw.supabase.co/storage/v1/object/public/photos/Tamae.png',
  Texas: 'https://sizdewlxjcfdekzzdofw.supabase.co/storage/v1/object/public/photos/Michael.png',
};

export const getPersonalAvatarUrl = (
  userOrLocation: string,
  bust: string | number = 1
): string => {
  const base =
    BASE_AVATARS[userOrLocation as keyof typeof BASE_AVATARS] || BASE_AVATARS.Texas;
  return `${base}?v=${bust}`;
};

export const generateId = (): string => Date.now().toString();

export const getNowIso = (): string => new Date().toISOString();

export const generateFilePrefix = (): string =>
  `${Date.now()}-${Math.random().toString(36).substring(2)}`;