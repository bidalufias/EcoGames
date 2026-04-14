import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export interface LeaderboardEntry {
  id?: string;
  game_id: string;
  player_name: string;
  score: number;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export async function fetchLeaderboard(gameId: string, limit = 10): Promise<LeaderboardEntry[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('game_id', gameId)
    .order('score', { ascending: false })
    .limit(limit);
  if (error) { console.error('Leaderboard fetch error:', error); return []; }
  return data || [];
}

export async function submitScore(entry: LeaderboardEntry): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('leaderboard').insert([entry]);
  if (error) { console.error('Score submit error:', error); return false; }
  return true;
}
