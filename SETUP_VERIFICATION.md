# ✅ SETUP VERIFICATION CHECKLIST

Run through this checklist to ensure everything is configured correctly.

## 📋 Pre-Flight Checks

### 1. Node.js & npm
```bash
node --version   # Should be 18.x or higher
npm --version    # Should be 9.x or higher
```

**✅ PASS** if both commands work and versions are correct.

---

### 2. Dependencies Installed
```bash
ls node_modules/@supabase/supabase-js
ls node_modules/react
ls node_modules/tailwindcss
```

**✅ PASS** if all three directories exist.

If not, run:
```bash
npm install
```

---

### 3. Environment Variables
```bash
# Check if .env file exists
ls .env

# Verify contents (should show URL and KEY without revealing values)
Select-String "VITE_SUPABASE_URL" .env
Select-String "VITE_SUPABASE_ANON_KEY" .env
```

**✅ PASS** if .env file exists and both variables are set.

If not:
```bash
cp .env.example .env
# Edit .env and add your Supabase credentials
```

---

### 4. Supabase Database
#### Check Tables Exist
In Supabase Dashboard → Database → Tables:
- [ ] `tournaments` table exists
- [ ] `players` table exists
- [ ] `matches` table exists

**✅ PASS** if all three tables exist.

If not, run `database/schema.sql` in SQL Editor.

#### Check Realtime Enabled
In Supabase Dashboard → Database → Replication:
- [ ] `tournaments` - Realtime ON
- [ ] `players` - Realtime ON
- [ ] `matches` - Realtime ON

**✅ PASS** if all three have realtime enabled.

---

### 5. TypeScript Configuration
```bash
# Check tsconfig.json exists
ls tsconfig.json

# Check for TypeScript errors
npx tsc --noEmit
```

**✅ PASS** if no errors appear.

---

### 6. Tailwind Configuration
```bash
# Check tailwind.config.js exists
ls tailwind.config.js

# Verify it includes mk- colors
Select-String "mk-red" tailwind.config.js
```

**✅ PASS** if file exists and custom colors are defined.

---

### 7. Build Test
```bash
npm run build
```

**✅ PASS** if build completes without errors.

Check output:
- `dist/` folder should be created
- `dist/index.html` should exist
- `dist/assets/` should contain JS and CSS files

---

### 8. Development Server Test
```bash
npm run dev
```

**✅ PASS** if:
- Server starts on http://localhost:5173
- No error messages in terminal
- Browser opens without console errors

---

## 🧪 Functional Tests

### Test 1: Create Tournament
1. Open http://localhost:5173
2. Click "CREATE NEW TOURNAMENT"
3. Enter tournament name: "Test Tournament"
4. Add players: "Player1", "Player2", "Player3", "Player4"
5. Click "START TOURNAMENT"

**✅ PASS** if:
- Tournament is created
- Bracket displays
- All matches show in Winners Bracket

---

### Test 2: Bracket Generation
Check the bracket display:
- [ ] Winners Bracket has 3 matches (4 players → 3 matches)
- [ ] Losers Bracket has 2 matches
- [ ] Grand Finals shows (2 matches)
- [ ] Round 1 matches have player names filled in

**✅ PASS** if all matches are generated correctly.

---

### Test 3: Report Match Result
1. Click on any Round 1 match (should have both players)
2. Modal should open
3. Click one player's name as winner
4. Match should update immediately

**✅ PASS** if:
- Modal opens
- Winner is recorded
- Match shows green border
- Winner advances to next match

---

### Test 4: Real-Time Sync
1. Open tournament in Chrome
2. Open SAME tournament URL in Firefox (or incognito)
3. Report a match result in Chrome
4. Check Firefox browser

**✅ PASS** if update appears in Firefox within 2 seconds.

---

### Test 5: BYE Player Handling
1. Create tournament with 7 players
2. System should add 1 BYE player
3. Check bracket

**✅ PASS** if:
- Total participants = 8 (7 players + 1 BYE)
- BYE matches auto-advance the opponent

---

### Test 6: Grand Finals
1. Complete all matches up to Grand Finals
2. Report Grand Finals result

**✅ PASS** if:
- Winner bracket champion wins → Tournament Complete
- Loser bracket champion wins → Set 2 created (Bracket Reset)

---

## 🔒 Security Checks

### 1. Environment Variables Not Committed
```bash
git status
```

**✅ PASS** if `.env` is NOT listed in changes to be committed.

---

### 2. Supabase Keys
- [ ] Using `anon` key (not `service_role` key)
- [ ] Keys stored in `.env` file only
- [ ] Keys NOT in source code files

**✅ PASS** if all keys are properly secured.

---

## 📱 Cross-Browser Testing

Test in:
- [ ] Chrome (Desktop)
- [ ] Firefox (Desktop)
- [ ] Safari (Desktop - if on Mac)
- [ ] Chrome (Mobile)
- [ ] Safari (Mobile - iOS)

**✅ PASS** if app works in all browsers.

---

## 🎯 Performance Checks

### 1. Page Load Time
Open DevTools → Network tab → Refresh page

**✅ PASS** if:
- Initial load < 3 seconds
- No 404 errors
- All assets load successfully

---

### 2. Bundle Size
```bash
npm run build
```

Check `dist/assets/`:
- Main JS file should be < 500KB
- CSS file should be < 50KB

**✅ PASS** if bundle sizes are reasonable.

---

### 3. Lighthouse Score
Open Chrome DevTools → Lighthouse → Run audit

**Target Scores**:
- Performance: > 80
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 80

**✅ PASS** if scores meet targets.

---

## 📊 Final Checklist

Before considering setup complete:

- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Supabase database schema deployed
- [ ] Realtime enabled on all tables
- [ ] TypeScript compiles without errors
- [ ] Build succeeds
- [ ] Dev server runs
- [ ] Can create tournament
- [ ] Can report match results
- [ ] Real-time updates work
- [ ] BYE players work correctly
- [ ] Grand Finals logic works
- [ ] Works in multiple browsers
- [ ] Mobile responsive
- [ ] No console errors

---

## 🚨 Common Issues & Fixes

### Issue: "Cannot find module '@supabase/supabase-js'"
**Fix**: Run `npm install`

### Issue: "Property 'env' does not exist on type 'ImportMeta'"
**Fix**: Check `src/vite-env.d.ts` exists

### Issue: "Failed to fetch"
**Fix**: Check Supabase URL and API key in `.env`

### Issue: "Realtime subscription not working"
**Fix**: Enable realtime in Supabase Dashboard → Database → Replication

### Issue: "Build fails with TypeScript errors"
**Fix**: Run `npx tsc --noEmit` to see detailed errors

---

## ✅ SUCCESS!

If all checks pass, your Mortal Kombat Tournament Manager is:
- ✅ Fully installed
- ✅ Properly configured
- ✅ Ready for development
- ✅ Ready for production deployment

## 🚀 Next Steps

1. **For Development**: Keep coding! Check [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
2. **For Production**: Follow [DEPLOYMENT.md](./DEPLOYMENT.md)
3. **For Understanding**: Read [ALGORITHM.md](./ALGORITHM.md)

---

**FLAWLESS VICTORY!** 🏆 Your setup is complete!
