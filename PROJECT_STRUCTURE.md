# 📁 PROJECT STRUCTURE OVERVIEW

Complete breakdown of the Mortal Kombat Tournament Manager architecture.

## 🗂️ Directory Structure

```
TournamentManagement/
├── database/                    # Database schema and documentation
│   ├── schema.sql              # PostgreSQL schema with ENUMs, tables, indexes
│   └── README.md               # Database setup instructions
│
├── src/
│   ├── lib/                    # Core business logic
│   │   ├── tournamentEngine.ts # Double elimination algorithm
│   │   ├── api.ts             # Supabase CRUD operations
│   │   ├── supabase.ts        # Database client & realtime subscriptions
│   │   └── database.types.ts  # TypeScript types for Supabase
│   │
│   ├── components/             # React UI components
│   │   ├── TournamentSetup.tsx # Tournament creation wizard
│   │   └── BracketView.tsx    # Live bracket visualization
│   │
│   ├── App.tsx                # Main app component with routing
│   ├── index.css              # Global styles with Tailwind
│   └── main.tsx               # React entry point
│
├── public/                     # Static assets
├── .env.example               # Environment variables template
├── .env                       # Your local environment variables (gitignored)
├── tailwind.config.js         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration
├── vite.config.js             # Vite build configuration
├── package.json               # Dependencies and scripts
├── README.md                  # Full documentation
└── QUICKSTART.md             # 5-minute setup guide
```

## 🧩 Component Architecture

### App.tsx (Main Router)
```
App
├── Home View (Tournament List)
├── Setup View (TournamentSetup)
└── Bracket View (BracketView)
```

### TournamentSetup.tsx
**Purpose**: Create new tournaments and add players

**Key Features**:
- Dynamic player input fields
- Automatic BYE calculation
- Form validation
- Tournament initialization

**Flow**:
1. Create tournament record
2. Add players with seeds
3. Generate bracket structure
4. Update status to "In-Progress"

### BracketView.tsx
**Purpose**: Display and manage live tournament brackets

**Key Features**:
- Separate Winners/Losers bracket rendering
- Real-time match updates via Supabase
- Match result reporting modal
- Completed match highlighting

**Flow**:
1. Load tournament matches and players
2. Subscribe to realtime updates
3. Group matches by bracket and round
4. Handle match result submissions

## 🔧 Core Library Modules

### tournamentEngine.ts
**The Algorithm Brain**

#### Key Functions:

```typescript
// Utility Functions
isPowerOfTwo(n: number): boolean
getNextPowerOfTwo(n: number): number
getWinnersBracketRounds(count: number): number
getLosersBracketRounds(count: number): number
getDropDownRound(wbRound: number): number
generateSeedPairings(count: number): [number, number][]

// Main Algorithm
generateDoubleEliminationBracket(
  tournamentId: string,
  players: Player[]
): BracketStructure

// Match Processing
processMatchResult(
  match: Match,
  winnerId: string,
  allMatches: Match[]
): MatchResult

// Validation
validateBracketStructure(
  participantCount: number,
  matches: Match[]
): { valid: boolean; errors: string[] }
```

#### Algorithm Complexity:
- **Space**: O(N) where N = participant count
- **Time**: O(N log N) for bracket generation
- **Matches Generated**: 2N - 3 total matches

### api.ts
**Database Operations**

#### Tournament Operations:
```typescript
createTournament(name, participantCount)
getTournament(id)
updateTournamentStatus(id, status)
listTournaments()
```

#### Player Operations:
```typescript
addPlayer(tournamentId, name, seed, isBye)
getPlayers(tournamentId)
addPlayers(tournamentId, playerNames[])
addByePlayers(tournamentId, currentPlayerCount)
```

#### Match Operations:
```typescript
getMatches(tournamentId)
initializeBracket(tournamentId)
reportMatchResult(matchId, winnerId)
getMatchWithPlayers(matchId)
```

### supabase.ts
**Realtime Subscriptions**

```typescript
// Match updates
subscribeToMatches(tournamentId, callback)

// Tournament status changes
subscribeToTournament(tournamentId, callback)

// Player additions
subscribeToPlayers(tournamentId, callback)
```

**How Realtime Works**:
1. Client subscribes to table changes
2. Supabase Postgres triggers push notifications
3. All connected clients receive updates
4. React components re-render automatically

## 🗄️ Database Schema Deep Dive

### Tournaments Table
```sql
id              UUID (Primary Key)
name            VARCHAR(255)
status          ENUM ('Setup', 'In-Progress', 'Completed')
participant_count INTEGER
created_at      TIMESTAMP
updated_at      TIMESTAMP
started_at      TIMESTAMP
completed_at    TIMESTAMP
```

### Players Table
```sql
id              UUID (Primary Key)
tournament_id   UUID (Foreign Key → tournaments.id)
name            VARCHAR(255)
seed            INTEGER (1 = highest seed)
is_bye          BOOLEAN
created_at      TIMESTAMP

UNIQUE (tournament_id, name)
UNIQUE (tournament_id, seed)
```

### Matches Table
```sql
id                  UUID (Primary Key)
tournament_id       UUID (Foreign Key → tournaments.id)
round_number        INTEGER
bracket_type        ENUM ('Winners', 'Losers', 'GrandFinals', 'GrandFinalsReset')
match_order         INTEGER
player1_id          UUID (Foreign Key → players.id)
player2_id          UUID (Foreign Key → players.id)
winner_id           UUID (Foreign Key → players.id)
next_match_id_win   UUID (Foreign Key → matches.id)
next_match_id_lose  UUID (Foreign Key → matches.id)
created_at          TIMESTAMP
completed_at        TIMESTAMP

UNIQUE (tournament_id, bracket_type, round_number, match_order)
```

**Key Relationships**:
- `next_match_id_win`: Where the winner advances
- `next_match_id_lose`: Where the loser drops (or NULL if eliminated)

## 🎨 Styling System

### Tailwind Configuration
```javascript
colors: {
  'mk-red': '#E71D36',      // Primary accent
  'mk-black': '#0A0A0A',    // Background
  'mk-gold': '#FFD700',     // Highlights
  'mk-gray': '#2D2D2D',     // Cards
}
```

### Design Tokens:
- **Typography**: Impact font for headers (Mortal Kombat style)
- **Borders**: 2px borders with mk-red/mk-gold
- **Shadows**: Drop shadows for depth
- **Transitions**: 0.3s for hover effects

## 🔐 Environment Variables

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**Why VITE_ prefix?**
- Vite only exposes variables with `VITE_` prefix to the client
- Security: Server-side variables stay private

## 📊 Data Flow

### Tournament Creation Flow
```
User Input (TournamentSetup)
  ↓
createTournament() → Supabase
  ↓
addPlayers() → Supabase
  ↓
addByePlayers() → Supabase (if needed)
  ↓
initializeBracket()
  ↓ (calls)
generateDoubleEliminationBracket() → in-memory
  ↓
Insert all matches → Supabase
  ↓
Update match progression IDs → Supabase
  ↓
updateTournamentStatus('In-Progress') → Supabase
  ↓
Navigate to BracketView
```

### Match Result Flow
```
User clicks match (BracketView)
  ↓
Modal opens with winner selection
  ↓
reportMatchResult(matchId, winnerId)
  ↓
Update match.winner_id → Supabase
  ↓
Find next_match_id_win → Update player slot
  ↓
Find next_match_id_lose → Update player slot (if exists)
  ↓
Supabase Realtime broadcasts change
  ↓
All subscribed clients receive update
  ↓
React components re-render with new data
```

## 🧪 Testing Strategy

### Manual Testing Checklist
- [ ] Create tournament with 2, 4, 8, 16 players
- [ ] Verify BYE players added correctly
- [ ] Check bracket structure matches algorithm
- [ ] Report match results sequentially
- [ ] Verify winners progress correctly
- [ ] Test losers drop to correct LB round
- [ ] Test Grand Finals normal win
- [ ] Test Grand Finals bracket reset
- [ ] Test realtime updates with multiple windows

### Edge Cases to Test
- Odd number of players (e.g., 7 → adds 1 BYE)
- Single BYE vs BYE match (should auto-progress)
- Reporting result for match without both players
- Network disconnection during realtime subscription
- Concurrent match result submissions

## 🚀 Performance Considerations

### Optimization Strategies
1. **Database Indexes**: All foreign keys indexed
2. **Realtime Filtering**: Subscribe only to specific tournament
3. **Batch Inserts**: Create all matches in single transaction
4. **Lazy Loading**: Load tournament data on-demand
5. **Memoization**: React components use proper keys

### Scalability Limits
- **Players per Tournament**: 256 (practical limit)
- **Concurrent Tournaments**: Unlimited (database-limited)
- **Realtime Connections**: 200 (Supabase free tier)
- **API Requests**: 500/hour (Supabase free tier)

## 📦 Build & Deployment

### Development
```bash
npm run dev          # Start dev server with HMR
npm run lint         # Run ESLint
```

### Production
```bash
npm run build        # Build for production
npm run preview      # Preview production build
```

### Build Output
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js      # Bundled JS
│   └── index-[hash].css     # Bundled CSS
└── ...
```

## 🔄 State Management

**Current Approach**: React useState + Supabase Realtime

**Why no Redux/Zustand?**
- Supabase Realtime acts as the source of truth
- State is fetched on-demand and updated via subscriptions
- Reduces complexity and bundle size

**State Flow**:
```
Supabase (Source of Truth)
  ↓ (fetch on mount)
React Component State
  ↓ (user interaction)
API Call → Supabase
  ↓ (realtime broadcast)
All Components Update
```

## 🛠️ Customization Points

### Easy Customizations
1. **Styling**: Edit `tailwind.config.js` colors
2. **Seeding**: Modify `generateSeedPairings()`
3. **Match Format**: Add "best of" rounds in database
4. **Player Stats**: Add wins/losses columns

### Advanced Customizations
1. **Swiss System**: Replace bracket generator
2. **Single Elimination**: Remove losers bracket logic
3. **Authentication**: Add Supabase Auth
4. **Match Chat**: Use Supabase Realtime channels
5. **Video Streaming**: Integrate OBS/Twitch API

## 📚 Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vite](https://vitejs.dev)
- [Double Elimination](https://en.wikipedia.org/wiki/Double-elimination_tournament)

---

**Need Help?** Check [QUICKSTART.md](./QUICKSTART.md) or [README.md](./README.md)
