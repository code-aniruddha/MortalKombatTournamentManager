export interface Tournament {
  id: string;
  name: string;
  participant_count: number;
  status: 'Setup' | 'In-Progress' | 'Completed';
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface Player {
  id: string;
  tournament_id: string;
  name: string;
  seed: number;
  is_bye: boolean;
  created_at: string;
}

export interface Match {
  id: string;
  tournament_id: string;
  round_number: number;
  match_order: number;
  bracket_type: 'Winners' | 'Losers' | 'GrandFinals' | 'GrandFinalsReset';
  player1_id: string | null;
  player2_id: string | null;
  player1_slot: number | null;
  player2_slot: number | null;
  next_match_id_winner: string | null;
  next_match_id_loser: string | null;
  next_match_slot_winner: number | null;
  next_match_slot_loser: number | null;
  winner_id: string | null;
  completed_at: string | null;
  created_at: string;
}
