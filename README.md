# 🥊 MORTAL KOMBAT TOURNAMENT MANAGER

A comprehensive **Double Elimination Tournament System** built with React, Vite, Supabase, and Tailwind CSS. Designed specifically for Mortal Kombat tournaments with real-time bracket updates and the Lucky Loser rule.

## 🎮 Features

- **Double Elimination Brackets**: Players are eliminated only after 2 losses
- **Winners & Losers Brackets**: Separate bracket progression with drop-down mechanics
- **Grand Finals Reset**: Lucky Loser rule - bracket reset if losers bracket winner wins
- **Real-Time Updates**: Powered by Supabase Realtime - all participants see updates instantly
- **Automatic Seeding**: Optimal seeding (1 vs 16, 2 vs 15, etc.)
- **Power of 2 Brackets**: Automatic BYE player generation
- **Responsive Design**: Mobile-friendly Kombat-themed UI

## 🏗️ Tech Stack

| Layer | Technology | Why? |
|-------|-----------|------|
| **Frontend** | React + Vite | Fast development with react-tournament-bracket support |
| **Database** | Supabase (PostgreSQL) | Built-in Realtime subscriptions for live updates |
| **Styling** | Tailwind CSS | Rapid UI development with custom Mortal Kombat theme |
| **Language** | TypeScript | Type safety for complex tournament logic |
| **Hosting** | Vercel | One-click deployment (recommended) |

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier works)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema from `database/schema.sql`
3. Enable Realtime:
   - Navigate to **Database → Replication**
   - Enable realtime for: `tournaments`, `players`, `matches`

### Step 3: Configure Environment

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from **Project Settings → API** in Supabase.

### Step 4: Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

## 🎯 How It Works

### Tournament Algorithm

#### Step 1: Initialization
```
Input: N players
1. Check if N is power of 2 (4, 8, 16, 32)
2. If not, add BYE players: nextPowerOf2(N) - N
3. Seed players: highest vs lowest (1 vs 16, 2 vs 15)
```

#### Step 2: Bracket Generation
```
Winners Bracket:
- Rounds: log₂(N)
- Total Matches: N - 1

Losers Bracket:
- Rounds: (2 × log₂(N)) - 1
- Total Matches: N - 2
- Odd Rounds: Internal LB matches
- Even Rounds: LB survivors + WB drop-downs
```

#### Step 3: Drop-Down Formula
```
WB Round → LB Round mapping:
- WB R1 → LB R1
- WB R2 → LB R2
- WB R3 → LB R4
- Formula: (WB_Round × 2) - 2 (except R1)
```

#### Step 4: Grand Finals
```
Matchup: WB Winner (0 losses) vs LB Winner (1 loss)

Scenario A: WB Winner wins
→ Tournament Complete

Scenario B: LB Winner wins
→ Both players have 1 loss
→ BRACKET RESET: Play Set 2
→ Winner of Set 2 = Champion
```

### Database Schema

#### tournaments
```sql
id, name, status, participant_count, created_at, updated_at
Status: 'Setup' | 'In-Progress' | 'Completed'
```

#### players
```sql
id, tournament_id, name, seed, is_bye
Seed: 1 (highest) to N (lowest)
```

#### matches
```sql
id, tournament_id, round_number, bracket_type, match_order,
player1_id, player2_id, winner_id,
next_match_id_win, next_match_id_lose
```

### Code Architecture

```
src/
├── lib/
│   ├── tournamentEngine.ts   # Core algorithm & bracket generation
│   ├── supabase.ts           # Database client & realtime subscriptions
│   ├── api.ts                # CRUD operations
│   └── database.types.ts     # TypeScript types for Supabase
├── components/
│   ├── TournamentSetup.tsx   # Tournament creation wizard
│   └── BracketView.tsx       # Live bracket visualization
└── App.tsx                   # Main app with routing
```

## 🎬 Usage Guide

### Creating a Tournament

1. Click **"CREATE NEW TOURNAMENT"**
2. Enter tournament name
3. Add player names (minimum 2)
4. Click **"START TOURNAMENT"**
   - System automatically adds BYE players if needed
   - Generates complete bracket structure
   - Seeds players optimally

### Reporting Match Results

1. Navigate to tournament bracket
2. Click on any match with both players assigned
3. Select the winner
4. System automatically:
   - Updates match result
   - Moves winner to next match
   - Drops loser to losers bracket (or eliminates)
   - Broadcasts update to all viewers

### Real-Time Spectating

Multiple users can view the same bracket simultaneously. All updates appear instantly without page refresh thanks to Supabase Realtime.

## 🔧 Customization

### Styling
Edit `tailwind.config.js` to customize the Mortal Kombat theme:
```js
colors: {
  'mk-red': '#E71D36',
  'mk-black': '#0A0A0A',
  'mk-gold': '#FFD700',
  'mk-gray': '#2D2D2D',
}
```

### Tournament Rules
Modify `src/lib/tournamentEngine.ts` to adjust:
- Seeding algorithm (`generateSeedPairings`)
- Drop-down mapping (`getDropDownRound`)
- Match progression (`processMatchResult`)

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables in Vercel
```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

## 🐛 Troubleshooting

### "Missing Supabase environment variables"
- Ensure `.env` file exists
- Check variable names start with `VITE_`
- Restart dev server after changing `.env`

### Realtime updates not working
- Verify realtime is enabled in Supabase
- Check browser console for connection errors
- Ensure correct tournament ID in URL

### Bracket not generating
- Check all players have unique seeds
- Verify database schema matches `schema.sql`
- Check browser console for errors

## 📝 Example: 8-Player Tournament

```
Initial Seeding (WB Round 1):
Match 1: Player 1 vs Player 8
Match 2: Player 4 vs Player 5
Match 3: Player 2 vs Player 7
Match 4: Player 3 vs Player 6

Winners advance to WB R2
Losers drop to LB R1
```

## 🤝 Contributing

This is a complete tournament management system. To extend:

1. **Add Statistics**: Track player win/loss records
2. **Match History**: Store detailed match data
3. **Swiss System**: Implement alternative tournament formats
4. **Authentication**: Add user accounts with Supabase Auth
5. **Chat**: Add spectator chat with Supabase Realtime

## 📄 License

MIT License - Feel free to use for your tournaments!

## 🙏 Acknowledgments

- Built for Mortal Kombat tournament organizers
- Algorithm based on standard double elimination principles
- Powered by Supabase's amazing Realtime infrastructure

---

**FINISH HIM!** 🔥 Now go organize some epic tournaments!
