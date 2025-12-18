import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// =====================================================
// REALTIME SUBSCRIPTIONS
// =====================================================

/**
 * Subscribe to match updates for real-time bracket updates
 */
export function subscribeToMatches(
  tournamentId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`matches:${tournamentId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'matches',
        filter: `tournament_id=eq.${tournamentId}`,
      },
      callback
    )
    .subscribe();
}

/**
 * Subscribe to tournament status changes
 */
export function subscribeToTournament(
  tournamentId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`tournament:${tournamentId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'tournaments',
        filter: `id=eq.${tournamentId}`,
      },
      callback
    )
    .subscribe();
}

/**
 * Subscribe to new players joining
 */
export function subscribeToPlayers(
  tournamentId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`players:${tournamentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `tournament_id=eq.${tournamentId}`,
      },
      callback
    )
    .subscribe();
}
