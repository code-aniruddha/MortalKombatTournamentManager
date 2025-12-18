import { supabase } from './supabase';
import type { Tournament, Player, Match } from './tournamentEngine';
import {
  generateDoubleEliminationBracket,
  getNextPowerOfTwo,
  getWinnersBracketRounds,
  getLosersBracketRounds,
  getDropDownRound,
} from './tournamentEngine';

// =====================================================
// TOURNAMENT CRUD OPERATIONS
// =====================================================

/**
 * Create a new tournament
 */
export async function createTournament(
  name: string,
  participantCount: number
): Promise<{ tournament: Tournament | null; error: any }> {
  const { data, error } = await supabase
    .from('tournaments')
    .insert({
      name,
      participant_count: participantCount,
      status: 'Setup',
    })
    .select()
    .single();

  return { tournament: data, error };
}

/**
 * Get tournament by ID
 */
export async function getTournament(
  id: string
): Promise<{ tournament: Tournament | null; error: any }> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single();

  return { tournament: data, error };
}

/**
 * Update tournament status
 */
export async function updateTournamentStatus(
  id: string,
  status: 'Setup' | 'In-Progress' | 'Completed'
): Promise<{ success: boolean; error: any }> {
  const updateData: any = { status };

  if (status === 'In-Progress') {
    updateData.started_at = new Date().toISOString();
  } else if (status === 'Completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('tournaments')
    .update(updateData)
    .eq('id', id);

  return { success: !error, error };
}

/**
 * List all tournaments
 */
export async function listTournaments(): Promise<{
  tournaments: Tournament[];
  error: any;
}> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false });

  return { tournaments: data || [], error };
}

/**
 * Delete a tournament and all associated data
 */
export async function deleteTournament(
  id: string
): Promise<{ success: boolean; error: any }> {
  try {
    // Delete tournament (cascade will handle matches and players)
    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', id);

    return { success: !error, error };
  } catch (error) {
    console.error('Error deleting tournament:', error);
    return { success: false, error };
  }
}

// =====================================================
// PLAYER OPERATIONS
// =====================================================

/**
 * Add a player to a tournament
 */
export async function addPlayer(
  tournamentId: string,
  name: string,
  seed: number,
  isBye: boolean = false
): Promise<{ player: Player | null; error: any }> {
  const { data, error } = await supabase
    .from('players')
    .insert({
      tournament_id: tournamentId,
      name,
      seed,
      is_bye: isBye,
    })
    .select()
    .single();

  return { player: data, error };
}

/**
 * Get all players for a tournament
 */
export async function getPlayers(
  tournamentId: string
): Promise<{ players: Player[]; error: any }> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('seed', { ascending: true });

  return { players: data || [], error };
}

/**
 * Batch add multiple players
 */
export async function addPlayers(
  tournamentId: string,
  playerNames: string[]
): Promise<{ players: Player[]; error: any }> {
  // Prepare player data with seeds
  const playerData = playerNames.map((name, index) => ({
    tournament_id: tournamentId,
    name,
    seed: index + 1,
    is_bye: false,
  }));

  const { data, error } = await supabase
    .from('players')
    .insert(playerData)
    .select();

  return { players: data || [], error };
}

/**
 * Add "Bye" players to reach next power of 2
 */
export async function addByePlayers(
  tournamentId: string,
  currentPlayerCount: number
): Promise<{ players: Player[]; error: any }> {
  const targetCount = getNextPowerOfTwo(currentPlayerCount);
  const byesNeeded = targetCount - currentPlayerCount;

  if (byesNeeded === 0) {
    return { players: [], error: null };
  }

  const byePlayers = Array.from({ length: byesNeeded }, (_, i) => ({
    tournament_id: tournamentId,
    name: `BYE ${i + 1}`,
    seed: currentPlayerCount + i + 1,
    is_bye: true,
  }));

  const { data, error } = await supabase
    .from('players')
    .insert(byePlayers)
    .select();

  return { players: data || [], error };
}

// =====================================================
// MATCH OPERATIONS
// =====================================================

/**
 * Get all matches for a tournament
 */
export async function getMatches(
  tournamentId: string
): Promise<{ matches: Match[]; error: any }> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('bracket_type', { ascending: true })
    .order('round_number', { ascending: true })
    .order('match_order', { ascending: true });

  return { matches: data || [], error };
}

/**
 * Create the complete bracket structure for a tournament
 */
export async function initializeBracket(
  tournamentId: string
): Promise<{ success: boolean; error: any }> {
  try {
    // Get players
    const { players, error: playersError } = await getPlayers(tournamentId);
    if (playersError) throw playersError;

    // Add bye players if needed
    const targetCount = getNextPowerOfTwo(players.length);
    if (targetCount > players.length) {
      const { players: byePlayers, error: byeError } = await addByePlayers(
        tournamentId,
        players.length
      );
      if (byeError) throw byeError;
      players.push(...byePlayers);
    }

    // Generate bracket structure
    const bracket = generateDoubleEliminationBracket(tournamentId, players);

    // Combine all matches
    const allMatches = [
      ...bracket.winnersBracket,
      ...bracket.losersBracket,
      ...bracket.grandFinals,
    ];

    // Insert matches into database (remove temp IDs)
    const matchesData = allMatches.map((match) => ({
      tournament_id: match.tournament_id,
      round_number: match.round_number,
      bracket_type: match.bracket_type,
      match_order: match.match_order,
      player1_id: match.player1_id,
      player2_id: match.player2_id,
      winner_id: match.winner_id,
      next_match_id_win: null, // Will be linked in a second pass
      next_match_id_lose: null,
    }));

    const { data: insertedMatches, error: insertError } = await supabase
      .from('matches')
      .insert(matchesData)
      .select();

    if (insertError) throw insertError;

    // Second pass: Create a map from match position (bracket_type, round_number, match_order) to real ID
    const matchPositionMap = new Map<string, string>();
    insertedMatches?.forEach((match) => {
      const key = `${match.bracket_type}-${match.round_number}-${match.match_order}`;
      matchPositionMap.set(key, match.id);
    });

    // Update matches with correct progression IDs
    // For each temp match, find its next matches by their position
    const updates = allMatches.map((tempMatch) => {
      const currentKey = `${tempMatch.bracket_type}-${tempMatch.round_number}-${tempMatch.match_order}`;
      const matchId = matchPositionMap.get(currentKey);

      if (!matchId) return null;

      let next_match_id_win: string | null = null;
      let next_match_id_lose: string | null = null;

      // If there's a next_match_id_win in temp match, find it by position
      if (tempMatch.next_match_id_win) {
        // The next_match_id_win is a temp ID, we need to find the real match
        // by looking at the tournament engine to find what bracket/round/order it should be
        // This is complex, so instead we'll rebuild the links based on logic

        if (tempMatch.bracket_type === 'Winners') {
          if (tempMatch.round_number < getWinnersBracketRounds(players.length)) {
            const nextRound = tempMatch.round_number + 1;
            const nextOrder = Math.floor(tempMatch.match_order / 2);
            const nextKey = `Winners-${nextRound}-${nextOrder}`;
            next_match_id_win = matchPositionMap.get(nextKey) || null;
          }
        } else if (tempMatch.bracket_type === 'Losers') {
          if (tempMatch.round_number < getLosersBracketRounds(players.length)) {
            const nextRound = tempMatch.round_number + 1;
            let nextOrder: number;

            if (tempMatch.round_number % 2 === 1) {
              // ODD LB round → winners keep same match order (merge with WB drop-downs)
              nextOrder = tempMatch.match_order;
            } else {
              // EVEN LB round → consolidation (two matches merge into one)
              nextOrder = Math.floor(tempMatch.match_order / 2);
            }

            const nextKey = `Losers-${nextRound}-${nextOrder}`;
            next_match_id_win = matchPositionMap.get(nextKey) || null;
          }
        }
      }

      // Handle loser progression from WB to LB
      if (tempMatch.bracket_type === 'Winners' && tempMatch.next_match_id_lose) {
        const dropRound = getDropDownRound(tempMatch.round_number);
        let lbMatchOrder: number;

        if (tempMatch.round_number === 1) {
          // WB R1: Each pair of WB matches feeds into 1 LB match
          lbMatchOrder = Math.floor(tempMatch.match_order / 2);
        } else {
          // WB R2+: Match order corresponds to position in merge round
          lbMatchOrder = tempMatch.match_order;
        }

        const lbKey = `Losers-${dropRound}-${lbMatchOrder}`;
        next_match_id_lose = matchPositionMap.get(lbKey) || null;
      }

      // Handle Grand Finals
      if (tempMatch.bracket_type === 'Winners' && tempMatch.round_number === getWinnersBracketRounds(players.length)) {
        // This is the WB Finals, it feeds to Grand Finals
        const gfKey = `GrandFinals-1-0`;
        next_match_id_win = matchPositionMap.get(gfKey) || null;
      }

      if (tempMatch.bracket_type === 'Losers' && tempMatch.round_number === getLosersBracketRounds(players.length)) {
        // This is the LB Finals, it feeds to Grand Finals
        const gfKey = `GrandFinals-1-0`;
        next_match_id_win = matchPositionMap.get(gfKey) || null;
      }

      return {
        id: matchId,
        next_match_id_win,
        next_match_id_lose,
      };
    }).filter((u) => u !== null);

    if (updates && updates.length > 0) {
      for (const update of updates) {
        await supabase
          .from('matches')
          .update({
            next_match_id_win: update.next_match_id_win,
            next_match_id_lose: update.next_match_id_lose,
          })
          .eq('id', update.id);
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error initializing bracket:', error);
    return { success: false, error };
  }
}

/**
 * Automatically resolve matches with BYE players
 */
export async function autoResolveByes(tournamentId: string): Promise<void> {
  const { matches } = await getMatches(tournamentId);
  const { players } = await getPlayers(tournamentId);

  for (const match of matches) {
    // Skip already completed matches
    if (match.winner_id) continue;

    // Skip matches that aren't ready yet
    if (!match.player1_id || !match.player2_id) continue;

    const player1 = players.find(p => p.id === match.player1_id);
    const player2 = players.find(p => p.id === match.player2_id);

    // If one player is a BYE, auto-advance the other
    if (player1?.is_bye && !player2?.is_bye) {
      await reportMatchResult(match.id, match.player2_id!);
    } else if (player2?.is_bye && !player1?.is_bye) {
      await reportMatchResult(match.id, match.player1_id!);
    }
  }
}

/**
 * Report a match result
 */
export async function reportMatchResult(
  matchId: string,
  winnerId: string
): Promise<{ success: boolean; error: any }> {
  try {
    // Get the match details
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError || !match) throw matchError || new Error('Match not found');

    // Validate winner is one of the players
    if (winnerId !== match.player1_id && winnerId !== match.player2_id) {
      throw new Error('Winner must be one of the match participants');
    }

    const loserId =
      match.player1_id === winnerId ? match.player2_id : match.player1_id;

    // Update the match with winner
    const { error: updateError } = await supabase
      .from('matches')
      .update({
        winner_id: winnerId,
        completed_at: new Date().toISOString(),
      })
      .eq('id', matchId);

    if (updateError) throw updateError;

    // Progress winner to next match
    if (match.next_match_id_win) {
      const { data: nextMatch, error: nextMatchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', match.next_match_id_win)
        .single();

      if (nextMatchError) throw nextMatchError;

      // Determine which slot to fill based on match type
      const updateData: any = {};

      // Special handling for LB even rounds (merge rounds)
      if (match.bracket_type === 'Losers' && match.round_number % 2 === 1) {
        // ODD LB round winner goes to player1 slot (they arrive first)
        if (!nextMatch.player1_id) {
          updateData.player1_id = winnerId;
        } else if (!nextMatch.player2_id) {
          updateData.player2_id = winnerId;
        }
      } else {
        // Standard progression: fill first available slot
        if (!nextMatch.player1_id) {
          updateData.player1_id = winnerId;
        } else if (!nextMatch.player2_id) {
          updateData.player2_id = winnerId;
        }
      }

      if (Object.keys(updateData).length > 0) {
        await supabase
          .from('matches')
          .update(updateData)
          .eq('id', match.next_match_id_win);
      }
    }

    // Progress loser to losers bracket
    if (match.next_match_id_lose && loserId) {
      const { data: loserMatch, error: loserMatchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', match.next_match_id_lose)
        .single();

      if (loserMatchError) throw loserMatchError;

      // For WB losers dropping into LB even rounds (merge rounds)
      // They should go to player2 slot (WB losers arrive second)
      const updateData: any = {};

      if (match.bracket_type === 'Winners' && match.round_number > 1) {
        // WB Round 2+ losers go to player2 slot of LB merge round
        if (!loserMatch.player2_id) {
          updateData.player2_id = loserId;
        } else if (!loserMatch.player1_id) {
          updateData.player1_id = loserId;
        }
      } else {
        // WB Round 1 or LB progression: fill first available slot
        if (!loserMatch.player1_id) {
          updateData.player1_id = loserId;
        } else if (!loserMatch.player2_id) {
          updateData.player2_id = loserId;
        }
      }

      if (Object.keys(updateData).length > 0) {
        await supabase
          .from('matches')
          .update(updateData)
          .eq('id', match.next_match_id_lose);
      }
    }

    // Handle Grand Finals Logic (Lucky Loser Rule)
    if (match.bracket_type === 'GrandFinals') {
      // Get all matches to determine who came from where
      const { matches: allMatches } = await getMatches(match.tournament_id);

      // Find WB and LB Finals
      const wbFinals = allMatches.find(
        m => m.bracket_type === 'Winners' && m.next_match_id_win === matchId
      );
      const lbFinals = allMatches.find(
        m => m.bracket_type === 'Losers' && m.next_match_id_win === matchId
      );

      // Determine who is WB champion and LB champion
      const wbChampionId = wbFinals?.winner_id;
      const lbChampionId = lbFinals?.winner_id;

      // Check if LB Champion won (Lucky Loser Rule - triggers bracket reset)
      if (lbChampionId && winnerId === lbChampionId) {
        // LB Champion won! Trigger RESET PROTOCOL
        const resetMatch = allMatches.find(
          m => m.bracket_type === 'GrandFinalsReset'
        );

        if (resetMatch && !resetMatch.player1_id) {
          // Set up the reset match - both players compete again
          await supabase
            .from('matches')
            .update({
              player1_id: wbChampionId,
              player2_id: lbChampionId,
            })
            .eq('id', resetMatch.id);
        }
      } else if (wbChampionId && winnerId === wbChampionId) {
        // WB Champion won - Tournament Complete (no reset needed)
        await updateTournamentStatus(match.tournament_id, 'Completed');
      } else {
        // Fallback: mark complete if Grand Finals is done
        await updateTournamentStatus(match.tournament_id, 'Completed');
      }
    } else if (match.bracket_type === 'GrandFinalsReset') {
      // Reset match complete - Tournament ends regardless of winner
      await updateTournamentStatus(match.tournament_id, 'Completed');
    }

    // Auto-resolve any matches with BYE players that are now ready
    await autoResolveByes(match.tournament_id);

    return { success: true, error: null };
  } catch (error) {
    console.error('Error reporting match result:', error);
    return { success: false, error };
  }
}

/**
 * Get match with player details
 */
export async function getMatchWithPlayers(matchId: string) {
  const { data, error } = await supabase
    .from('matches')
    .select(
      `
      *,
      player1:players!matches_player1_id_fkey(*),
      player2:players!matches_player2_id_fkey(*),
      winner:players!matches_winner_id_fkey(*)
    `
    )
    .eq('id', matchId)
    .single();

  return { match: data, error };
}
