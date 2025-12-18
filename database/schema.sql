-- =====================================================
-- MORTAL KOMBAT TOURNAMENT DATABASE SCHEMA
-- Double Elimination Tournament System
-- =====================================================

-- Create ENUM types for better type safety
CREATE TYPE tournament_status AS ENUM ('Setup', 'In-Progress', 'Completed');
CREATE TYPE bracket_type AS ENUM ('Winners', 'Losers', 'GrandFinals', 'GrandFinalsReset');

-- =====================================================
-- TOURNAMENTS TABLE
-- Stores tournament metadata
-- =====================================================
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    status tournament_status NOT NULL DEFAULT 'Setup',
    participant_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- PLAYERS TABLE
-- Stores player information and seeding
-- =====================================================
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    seed INTEGER NOT NULL,
    is_bye BOOLEAN DEFAULT FALSE, -- For phantom "Bye" players
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_player_per_tournament UNIQUE (tournament_id, name),
    CONSTRAINT unique_seed_per_tournament UNIQUE (tournament_id, seed)
);

-- =====================================================
-- MATCHES TABLE
-- The core table tracking all tournament matches
-- =====================================================
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,

    -- Match Position in Bracket
    round_number INTEGER NOT NULL,
    bracket_type bracket_type NOT NULL,
    match_order INTEGER NOT NULL, -- Position within the round (0, 1, 2...)

    -- Participants (Nullable for progressive filling)
    player1_id UUID REFERENCES players(id) ON DELETE SET NULL,
    player2_id UUID REFERENCES players(id) ON DELETE SET NULL,

    -- Result
    winner_id UUID REFERENCES players(id) ON DELETE SET NULL,

    -- Progression Paths
    next_match_id_win UUID REFERENCES matches(id) ON DELETE SET NULL,
    next_match_id_lose UUID REFERENCES matches(id) ON DELETE SET NULL,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT valid_winner CHECK (
        winner_id IS NULL OR
        winner_id = player1_id OR
        winner_id = player2_id
    ),
    CONSTRAINT unique_match_position UNIQUE (tournament_id, bracket_type, round_number, match_order)
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================
CREATE INDEX idx_players_tournament ON players(tournament_id);
CREATE INDEX idx_players_seed ON players(tournament_id, seed);
CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_bracket ON matches(tournament_id, bracket_type, round_number);
CREATE INDEX idx_matches_participants ON matches(player1_id, player2_id);
CREATE INDEX idx_matches_winner ON matches(winner_id);
CREATE INDEX idx_matches_progression ON matches(next_match_id_win, next_match_id_lose);

-- =====================================================
-- TRIGGER for updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tournaments_updated_at
    BEFORE UPDATE ON tournaments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (Optional - for multi-tenant)
-- Enable if you want different users to manage separate tournaments
-- =====================================================
-- ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE players ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SAMPLE QUERIES FOR TESTING
-- =====================================================

-- Get all matches for a tournament with player names
-- SELECT
--     m.id,
--     m.round_number,
--     m.bracket_type,
--     m.match_order,
--     p1.name as player1_name,
--     p2.name as player2_name,
--     pw.name as winner_name,
--     m.next_match_id_win,
--     m.next_match_id_lose
-- FROM matches m
-- LEFT JOIN players p1 ON m.player1_id = p1.id
-- LEFT JOIN players p2 ON m.player2_id = p2.id
-- LEFT JOIN players pw ON m.winner_id = pw.id
-- WHERE m.tournament_id = 'YOUR_TOURNAMENT_ID'
-- ORDER BY m.bracket_type, m.round_number, m.match_order;

-- Get tournament bracket structure
-- SELECT
--     bracket_type,
--     round_number,
--     COUNT(*) as match_count
-- FROM matches
-- WHERE tournament_id = 'YOUR_TOURNAMENT_ID'
-- GROUP BY bracket_type, round_number
-- ORDER BY bracket_type, round_number;
