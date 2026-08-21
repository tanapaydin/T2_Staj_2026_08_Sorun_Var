export type Report = {
  id: string;
  title: string;
  description?: string;
  category: string;

  latitude: number;
  longitude: number;

  city?: string | null;
  municipality?: string | null;
  district?: string | null;
  neighborhood?: string | null;
  address?: string | null;

  status: string;
  progress: number;
  priority: string;
  view_count: number;
  follower_count: number;
  created_at: string;
  followed_at?: string | null;
};