import { ThreadComment } from '@/components/shared/ReactionThread';

export interface Idea {
  id: string;
  author: string;
  content: string;
  created_at: string;
  hearted_by?: string[];
  comments?: ThreadComment[];
}

export interface Destination {
  id: string;
  title: string;
  creator: string;
  interested_users: string[];
  status: 'planned' | 'experienced';
  ideas: Idea[] | null;
  lat?: number;
  lng?: number;
}

export interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}