# 🚀 QUICK START GUIDE

Get your Mortal Kombat Tournament Manager running in 5 minutes!

## ⚡ Fast Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Supabase (3 minutes)

#### A. Create Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a name, database password, and region
3. Wait for project to initialize (~2 minutes)

#### B. Run Database Schema
1. Go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy entire contents of `database/schema.sql`
4. Paste and click **Run**
5. You should see: "Success. No rows returned"

#### C. Enable Realtime
1. Go to **Database** → **Replication** (left sidebar)
2. Find tables: `tournaments`, `players`, `matches`
3. Toggle the switch for each table to **enable** realtime
4. Click **Save**

#### D. Get Your Keys
1. Go to **Project Settings** → **API**
2. Copy these two values:
   - **Project URL** (e.g., https://xxxxx.supabase.co)
   - **anon public** key (long string starting with "eyJ...")

### 3. Configure Environment
```bash
# Copy the example file
cp .env.example .env

# Edit .env and paste your Supabase credentials
# VITE_SUPABASE_URL=https://xxxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### 4. Run the App
```bash
npm run dev
```

Open http://localhost:5173 in your browser!

## 🎮 First Tournament

1. Click **"CREATE NEW TOURNAMENT"**
2. Enter name: "MK Championship"
3. Add 4-8 players (just first names work fine)
4. Click **"START TOURNAMENT"**

You'll see the full bracket with:
- Winners Bracket (top)
- Losers Bracket (middle)
- Grand Finals (bottom)

Click any match with both players to report a winner!

## 🔍 Testing Real-Time

1. Open the tournament in your browser
2. Open the same URL in an incognito window
3. Report a match result in one window
4. Watch it update INSTANTLY in the other window ⚡

## ✅ Verification Checklist

- [ ] Dependencies installed (`node_modules` folder exists)
- [ ] Supabase project created
- [ ] Database schema executed successfully
- [ ] Realtime enabled for all 3 tables
- [ ] `.env` file created with correct credentials
- [ ] Dev server running without errors
- [ ] Can create a tournament
- [ ] Can see bracket visualization
- [ ] Can report match results

## 🆘 Common Issues

### "Missing Supabase environment variables"
```bash
# Make sure .env exists and has VITE_ prefix
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Restart dev server
npm run dev
```

### "Failed to create tournament"
- Check Supabase dashboard → **Database** → **Tables**
- Verify `tournaments`, `players`, `matches` tables exist
- Re-run `schema.sql` if tables are missing

### Port 5173 already in use
```bash
# Kill the process or change port
npm run dev -- --port 3000
```

### Realtime not working
- Go to **Database** → **Replication** in Supabase
- Toggle realtime ON for all 3 tables
- Refresh your browser

## 📚 Next Steps

Once running, explore:

- [README.md](./README.md) - Full documentation
- [database/README.md](./database/README.md) - Database details
- `src/lib/tournamentEngine.ts` - Core algorithm
- `src/components/` - UI components

## 🎯 Production Deployment

Ready to deploy? See [README.md](./README.md#-deployment) for Vercel deployment instructions.

---

**FIGHT!** 🥊 Your tournament system is ready!
