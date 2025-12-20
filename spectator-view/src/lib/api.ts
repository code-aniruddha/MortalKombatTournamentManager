import { supabase } from './supabase';
import type { Tournament, Player, Match } from './types';

export async function listTournaments(): Promise<{ tournaments: Tournament[]; error: any }> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false });

  return { tournaments: data || [], error };
}

export async function getTournament(id: string): Promise<{ tournament: Tournament | null; error: any }> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single();

  return { tournament: data, error };
}

export async function getPlayers(tournamentId: string): Promise<{ players: Player[]; error: any }> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('seed', { ascending: true });

  return { players: data || [], error };
}

export async function getMatches(tournamentId: string): Promise<{ matches: Match[]; error: any }> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('round_number', { ascending: true });

  return { matches: data || [], error };
}
