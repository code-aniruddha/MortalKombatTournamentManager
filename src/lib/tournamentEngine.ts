// =====================================================
// TYPES AND INTERFACES
// =====================================================

export type BracketType = 'Winners' | 'Losers' | 'GrandFinals' | 'GrandFinalsReset';
export type TournamentStatus = 'Setup' | 'In-Progress' | 'Completed';

export interface Player {
  id: string;
  tournament_id: string;
  name: string;
  seed: number;
  is_bye: boolean;
}

export interface Match {
  id: string;
  tournament_id: string;
  round_number: number;
  bracket_type: BracketType;
  match_order: number;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
  next_match_id_win: string | null;
  next_match_id_lose: string | null;
  completed_at: string | null;
}

export interface Tournament {
  id: string;
  name: string;
  status: TournamentStatus;
  participant_count: number;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Check if a number is a power of 2
 */
export function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

/**
 * Get the next power of 2 greater than or equal to n
 */
export function getNextPowerOfTwo(n: number): number {
  if (n <= 0) return 1;
  let power = 1;
  while (power < n) {
    power *= 2;
  }
  return power;
}

/**
 * MATHEMATICAL FORMULA: Winners Bracket Rounds
 *
 * Formula: log₂(N)
 * Where N = number of participants (must be power of 2)
 *
 * Examples:
 * - 4 players: log₂(4) = 2 rounds (Semifinals, Finals)
 * - 8 players: log₂(8) = 3 rounds (Quarterfinals, Semifinals, Finals)
 * - 16 players: log₂(16) = 4 rounds
 * - 32 players: log₂(32) = 5 rounds
 */
export function getWinnersBracketRounds(participantCount: number): number {
  return Math.log2(participantCount);
}

/**
 * MATHEMATICAL FORMULA: Losers Bracket Rounds
 *
 * Formula: 2 × (log₂(N) - 1)
 * Simplified: 2 × log₂(N) - 2
 * Where N = number of participants
 *
 * Explanation: LB alternates between consolidation (odd) and merge (even) rounds.
 * Each WB round (except R1) contributes 2 LB rounds: one merge + one consolidation.
 *
 * Examples:
 * - 4 players: 2 × (2 - 1) = 2 rounds
 * - 8 players: 2 × (3 - 1) = 4 rounds
 * - 16 players: 2 × (4 - 1) = 6 rounds
 * - 32 players: 2 × (5 - 1) = 8 rounds
 *
 * Structure for 8 players (4 LB rounds):
 * - LB R1: WB R1 losers fight (2 matches)
 * - LB R2: LB R1 winners vs WB R2 losers (2 matches)
 * - LB R3: LB R2 winners fight (1 match)
 * - LB R4: LB R3 winner vs WB R3 loser (1 match) → Grand Finals
 */
export function getLosersBracketRounds(participantCount: number): number {
  return 2 * (Math.log2(participantCount) - 1);
}

/**
 * MATHEMATICAL FORMULA: Drop-Down Round Calculation
 *
 * When a player loses in Winners Bracket, they drop to Losers Bracket.
 * This formula determines which LB round they enter.
 *
 * Formula:
 * - If WB_Round = 1: Drop to LB_Round 1
 * - If WB_Round > 1: Drop to LB_Round = ((WB_Round - 1) × 2)
 *
 * Examples:
 * - WB R1 losers → LB R1
 * - WB R2 losers → LB R2 = ((2-1) × 2) = 2
 * - WB R3 losers → LB R4 = ((3-1) × 2) = 4
 * - WB R4 losers → LB R6 = ((4-1) × 2) = 6
 *
 * Reasoning:
 * - WB R1 losers haven't faced each other yet, so they start LB
 * - WB R2+ losers enter "merge rounds" where they face LB survivors
 * - The ×2 factor accounts for LB's alternating structure
 */
export function getDropDownRound(wbRound: number): number {
  if (wbRound === 1) return 1;
  return (wbRound - 1) * 2;
}

/**
 * Generate seeded pairings for Round 1
 * Matches highest seed vs lowest seed (1 vs 16, 2 vs 15, etc.)
 */
export function generateSeedPairings(participantCount: number): [number, number][] {
  const pairings: [number, number][] = [];
  const half = participantCount / 2;

  for (let i = 0; i < half; i++) {
    const highSeed = i + 1;
    const lowSeed = participantCount - i;
    pairings.push([highSeed, lowSeed]);
  }

  return pairings;
}

// =====================================================
// DOUBLE ELIMINATION BRACKET GENERATOR
// =====================================================

export interface BracketStructure {
  winnersBracket: Match[];
  losersBracket: Match[];
  grandFinals: Match[];
}

/**
 * Generate the complete double elimination bracket structure
 * This creates all matches with proper progression paths
 */
export function generateDoubleEliminationBracket(
  tournamentId: string,
  players: Player[]
): BracketStructure {
  const participantCount = players.length;
  const wbRounds = getWinnersBracketRounds(participantCount);
  const lbRounds = getLosersBracketRounds(participantCount);

  const winnersBracket: Match[] = [];
  const losersBracket: Match[] = [];
  const grandFinals: Match[] = [];

  // Track match IDs for linking (using temporary IDs)
  const wbMatchMap = new Map<string, string>(); // key: "round-order" -> matchId
  const lbMatchMap = new Map<string, string>();

  // =====================================================
  // STEP 1: Generate Winners Bracket
  // =====================================================
  let tempMatchId = 0;

  for (let round = 1; round <= wbRounds; round++) {
    const matchesInRound = participantCount / Math.pow(2, round);

    for (let matchOrder = 0; matchOrder < matchesInRound; matchOrder++) {
      const matchId = `temp-wb-${tempMatchId++}`;
      wbMatchMap.set(`${round}-${matchOrder}`, matchId);

      const match: Match = {
        id: matchId,
        tournament_id: tournamentId,
        round_number: round,
        bracket_type: 'Winners',
        match_order: matchOrder,
        player1_id: null,
        player2_id: null,
        winner_id: null,
        next_match_id_win: null,
        next_match_id_lose: null,
        completed_at: null,
      };

      // Set initial players for Round 1
      if (round === 1) {
        const pairings = generateSeedPairings(participantCount);
        const [seed1, seed2] = pairings[matchOrder];
        const player1 = players.find(p => p.seed === seed1);
        const player2 = players.find(p => p.seed === seed2);

        if (player1) match.player1_id = player1.id;
        if (player2) match.player2_id = player2.id;
      }

      winnersBracket.push(match);
    }
  }

  // Link winner progressions after all matches are created
  for (const wbMatch of winnersBracket) {
    if (wbMatch.round_number < wbRounds) {
      const nextMatchOrder = Math.floor(wbMatch.match_order / 2);
      const nextMatchKey = `${wbMatch.round_number + 1}-${nextMatchOrder}`;
      if (wbMatchMap.has(nextMatchKey)) {
        wbMatch.next_match_id_win = wbMatchMap.get(nextMatchKey)!;
      }
    }
  }

  // =====================================================
  // STEP 2: Generate Losers Bracket (CORRECTED ALGORITHM)
  // =====================================================
  /**
   * CORRECTED Losers Bracket Structure:
   *
   * Pattern: Alternates between Consolidation (odd) and Merge (even) rounds
   *
   * For 8 players (3 WB rounds, 5 LB rounds):
   * - LB R1 (ODD): 2 matches - WB R1 losers fight each other (h vs b, f vs e)
   * - LB R2 (EVEN): 2 matches - LB R1 winners meet WB R2 losers (b vs a, f vs c)
   * - LB R3 (ODD): 1 match - LB R2 winners fight (winner[b,a] vs winner[f,c])
   * - LB R4 (EVEN): 1 match - LB R3 winner meets WB R3 loser
   * - LB R5 (ODD): Finals path
   */

  // Helper: deterministic count of LB matches per round (power-of-two participants)
  const getLbMatchesInRound = (round: number): number => {
    if (round === 1) {
      // WB R1 produces N/2 losers; they pair up → N/4 matches
      return Math.floor(participantCount / 4);
    }

    if (round % 2 === 0) {
      // Merge rounds: LB survivors meet WB drop-downs
      // Formula: N / 2^(round/2 + 1)
      const matches = Math.floor(participantCount / Math.pow(2, (round / 2) + 1));
      return matches;
    }

    // Consolidation rounds: winners from previous merge round face each other
    // Formula: N / 2^(((round + 1) / 2) + 1)
    const matches = Math.floor(participantCount / Math.pow(2, ((round + 1) / 2) + 1));
    return matches;
  };

  for (let round = 1; round <= lbRounds; round++) {
    const matchesInRound = getLbMatchesInRound(round);

    for (let matchOrder = 0; matchOrder < matchesInRound; matchOrder++) {
      const matchId = `temp-lb-${tempMatchId++}`;
      lbMatchMap.set(`${round}-${matchOrder}`, matchId);

      const match: Match = {
        id: matchId,
        tournament_id: tournamentId,
        round_number: round,
        bracket_type: 'Losers',
        match_order: matchOrder,
        player1_id: null,
        player2_id: null,
        winner_id: null,
        next_match_id_win: null,
        next_match_id_lose: null, // Losers are eliminated
        completed_at: null,
      };

      losersBracket.push(match);
    }
  }

  // Link winner progressions in Losers Bracket
  /**
   * LB progression logic:
   * - ODD round winners → go to NEXT round (even, merge with WB losers)
   * - EVEN round winners → go to NEXT round (odd, consolidation)
   *
   * For 8 players:
   * - LB R1 M0 winner → LB R2 M0 (plays against WB R2 M0 loser)
   * - LB R1 M1 winner → LB R2 M1 (plays against WB R2 M1 loser)
   * - LB R2 M0 winner → LB R3 M0
   * - LB R2 M1 winner → LB R3 M0 (both feed into same consolidation match)
   * - LB R3 M0 winner → LB R4 M0 (plays against WB R3 loser)
   */
  for (const lbMatch of losersBracket) {
    if (lbMatch.round_number < lbRounds) {
      let nextMatchOrder: number;

      if (lbMatch.round_number % 2 === 1) {
        // ODD round: winners stay at same match order (they'll meet WB losers)
        nextMatchOrder = lbMatch.match_order;
      } else {
        // EVEN round: winners consolidate (2 matches → 1 match)
        nextMatchOrder = Math.floor(lbMatch.match_order / 2);
      }

      const nextMatchKey = `${lbMatch.round_number + 1}-${nextMatchOrder}`;
      if (lbMatchMap.has(nextMatchKey)) {
        lbMatch.next_match_id_win = lbMatchMap.get(nextMatchKey)!;
      }
    }
  }

  // =====================================================
  // STEP 3: Link Winners Bracket losers to Losers Bracket (Drop-Down Logic)
  // =====================================================
  /**
   * Drop-down logic from WB to LB:
   * According to the formula: WB_Round = 1 → LB_Round 1
   *                          WB_Round > 1 → LB_Round = ((WB_Round - 1) × 2)
   *
   * WB Round 1 → LB Round 1
   * WB Round 2 → LB Round 2
   * WB Round 3 → LB Round 4
   * WB Round 4 → LB Round 6
   *
   * Slot Assignment:
   * - WB losers enter EVEN rounds of LB (2, 4, 6...)
   * - They face winners from ODD rounds (1, 3, 5...)
   */

  /**
   * CORRECTED WB to LB Drop-Down Logic:
   *
   * Key insight: In LB R1, we want cross-bracket pairing!
   * If WB R1 has matches feeding into WB R2 M0, their losers should fight each other
   *
   * For 8 players with correct pairing:
   * WB R1: M0(a vs h), M1(b vs g), M2(c vs f), M3(d vs e)
   *   Winners: a,b → go to WB R2 M0
   *   Winners: c,d → go to WB R2 M1
   *   Losers from M0,M1: h,b → should fight in LB R1 M0
   *   Losers from M2,M3: f,e → should fight in LB R1 M1
   *
   * Wait, that doesn't match your image. Let me re-analyze:
   * Your image shows: h vs b and f vs e
   *
   * Actually, the system needs to place losers such that they DON'T immediately
   * fight someone from their own side of the bracket. Let me trace actual seeds:
   *
   * For proper bracket flow, WB R1 losers need to be arranged so that
   * losers from opposite sides of the bracket fight each other in LB R1.
   *
   * The match order assignment for R1 should be:
   * - WB M0 loser and WB M1 loser → LB R1 (creates one match between them)
   * - WB M2 loser and WB M3 loser → LB R1 (creates another match)
   */
  for (const wbMatch of winnersBracket) {
    const dropRound = getDropDownRound(wbMatch.round_number);
    let lbMatchOrder: number;

    if (wbMatch.round_number === 1) {
      // WB R1: Losers from adjacent matches go to same LB R1 match
      // This creates the cross-bracket pairing in LB R1
      lbMatchOrder = Math.floor(wbMatch.match_order / 2);
    } else {
      // WB R2+: Direct mapping to LB merge rounds
      lbMatchOrder = wbMatch.match_order;
    }

    const lbMatchKey = `${dropRound}-${lbMatchOrder}`;

    if (lbMatchMap.has(lbMatchKey)) {
      wbMatch.next_match_id_lose = lbMatchMap.get(lbMatchKey)!;
    }
  }

  // =====================================================
  // STEP 4: Create Grand Finals matches
  // =====================================================

  const grandFinalsMatch: Match = {
    id: `temp-gf-${tempMatchId++}`,
    tournament_id: tournamentId,
    round_number: 1,
    bracket_type: 'GrandFinals',
    match_order: 0,
    player1_id: null, // Will be filled by WB Finals winner
    player2_id: null, // Will be filled by LB Finals winner
    winner_id: null,
    next_match_id_win: null, // Tournament ends or triggers reset
    next_match_id_lose: null,
    completed_at: null,
  };

  const grandFinalsReset: Match = {
    id: `temp-gfr-${tempMatchId++}`,
    tournament_id: tournamentId,
    round_number: 2,
    bracket_type: 'GrandFinalsReset',
    match_order: 0,
    player1_id: null,
    player2_id: null,
    winner_id: null,
    next_match_id_win: null,
    next_match_id_lose: null,
    completed_at: null,
  };

  grandFinals.push(grandFinalsMatch, grandFinalsReset);

  // Link WB Finals and LB Finals to Grand Finals
  const wbFinals = winnersBracket[winnersBracket.length - 1];
  const lbFinals = losersBracket[losersBracket.length - 1];

  if (wbFinals) wbFinals.next_match_id_win = grandFinalsMatch.id;
  if (lbFinals) lbFinals.next_match_id_win = grandFinalsMatch.id;

  return {
    winnersBracket,
    losersBracket,
    grandFinals,
  };
}

// =====================================================
// MATCH PROGRESSION LOGIC
// =====================================================

export interface MatchResult {
  winnerId: string;
  loserId: string;
  nextMatchUpdates: {
    matchId: string;
    playerSlot: 'player1' | 'player2';
    playerId: string;
  }[];
  tournamentComplete: boolean;
  resetRequired: boolean;
}

/**
 * Process a match result and determine what happens next
 */
export function processMatchResult(
  match: Match,
  winnerId: string,
  allMatches: Match[]
): MatchResult {
  const loserId = match.player1_id === winnerId ? match.player2_id! : match.player1_id!;
  const nextMatchUpdates: MatchResult['nextMatchUpdates'] = [];

  let tournamentComplete = false;
  let resetRequired = false;

  // Handle Grand Finals
  if (match.bracket_type === 'GrandFinals') {
    // Check if winner came from Winners Bracket (0 losses)
    // This requires tracking player loss count, simplified here
    // If LB player wins, trigger reset
    resetRequired = true; // Simplified: always allow reset option

    if (!resetRequired) {
      tournamentComplete = true;
    }
  }

  if (match.bracket_type === 'GrandFinalsReset') {
    tournamentComplete = true;
  }

  // Move winner to next match (if exists)
  if (match.next_match_id_win) {
    const nextMatch = allMatches.find(m => m.id === match.next_match_id_win);
    if (nextMatch) {
      // Determine which slot to fill (player1 or player2)
      const slot = nextMatch.player1_id === null ? 'player1' : 'player2';
      nextMatchUpdates.push({
        matchId: nextMatch.id,
        playerSlot: slot,
        playerId: winnerId,
      });
    }
  }

  // Move loser to losers bracket (if exists)
  if (match.next_match_id_lose) {
    const nextMatch = allMatches.find(m => m.id === match.next_match_id_lose);
    if (nextMatch) {
      const slot = nextMatch.player1_id === null ? 'player1' : 'player2';
      nextMatchUpdates.push({
        matchId: nextMatch.id,
        playerSlot: slot,
        playerId: loserId,
      });
    }
  }

  return {
    winnerId,
    loserId,
    nextMatchUpdates,
    tournamentComplete,
    resetRequired,
  };
}

// =====================================================
// BRACKET VALIDATION
// =====================================================

/**
 * Validate that a tournament has proper bracket structure
 */
export function validateBracketStructure(
  participantCount: number,
  matches: Match[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check participant count is power of 2
  if (!isPowerOfTwo(participantCount)) {
    errors.push(`Participant count ${participantCount} is not a power of 2`);
  }

  // Check Winners Bracket has correct number of matches
  const wbMatches = matches.filter(m => m.bracket_type === 'Winners');
  const expectedWbMatches = participantCount - 1; // N-1 matches to determine winner
  if (wbMatches.length !== expectedWbMatches) {
    errors.push(
      `Winners Bracket should have ${expectedWbMatches} matches, found ${wbMatches.length}`
    );
  }

  // Check Losers Bracket structure
  const lbMatches = matches.filter(m => m.bracket_type === 'Losers');
  const expectedLbMatches = participantCount - 2; // N-2 matches in losers bracket
  if (lbMatches.length !== expectedLbMatches) {
    errors.push(
      `Losers Bracket should have ${expectedLbMatches} matches, found ${lbMatches.length}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
