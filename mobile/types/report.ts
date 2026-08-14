export type Report = {
  id: string;
  title: string;
  description?: string;
  category: string;
  latitude: number;
  longitude: number;
  status: string;
  progress: number;
  priority: string;
  view_count: number;
  follower_count: number;
  created_at: string;
};
