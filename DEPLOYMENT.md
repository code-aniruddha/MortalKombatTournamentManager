# 🚀 DEPLOYMENT GUIDE

Complete guide for deploying your Mortal Kombat Tournament Manager to production.

## 📋 Pre-Deployment Checklist

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] Environment variables configured
- [ ] Database schema deployed to Supabase
- [ ] Realtime enabled on all tables
- [ ] .env file NOT committed to Git
- [ ] Build succeeds locally (`npm run build`)

### Testing
- [ ] Tournament creation works
- [ ] Player management works
- [ ] Bracket generation correct
- [ ] Match results update properly
- [ ] Real-time updates functioning
- [ ] Works on mobile devices

## 🌐 Deployment Options

### Option 1: Vercel (Recommended) ⭐

**Why Vercel?**
- Built specifically for Vite/React apps
- Zero configuration required
- Automatic HTTPS
- Global CDN
- Free tier available

#### Step-by-Step Deployment

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit: MK Tournament Manager"
git remote add origin https://github.com/yourusername/mk-tournament.git
git push -u origin main
```

2. **Connect to Vercel**
- Go to [vercel.com](https://vercel.com)
- Click **"New Project"**
- Import your GitHub repository
- Vercel auto-detects Vite configuration

3. **Add Environment Variables**
In Vercel dashboard → Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**Important**: Add these for all environments (Production, Preview, Development)

4. **Deploy**
- Click **"Deploy"**
- Wait 1-2 minutes
- Your app is live! 🎉

5. **Custom Domain (Optional)**
- Settings → Domains
- Add your custom domain
- Follow DNS configuration instructions

**Deployment URL Example**: `https://mk-tournament-manager.vercel.app`

---

### Option 2: Netlify

**Pros**: Similar to Vercel, generous free tier

#### Deployment Steps

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Build for Production**
```bash
npm run build
```

3. **Deploy**
```bash
netlify deploy --prod
```

4. **Set Environment Variables**
```bash
netlify env:set VITE_SUPABASE_URL "https://xxxxx.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "eyJhbGc..."
```

---

### Option 3: Traditional Hosting (Apache/Nginx)

**Use Case**: Self-hosted or existing server

#### Build Process
```bash
npm run build
```

This creates a `dist/` folder with:
- `index.html`
- `assets/` (JS, CSS, images)

#### Apache Configuration
```apache
<VirtualHost *:80>
    ServerName tournament.yourdomain.com
    DocumentRoot /var/www/tournament/dist

    <Directory /var/www/tournament/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # Handle React Router (if added later)
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name tournament.yourdomain.com;
    root /var/www/tournament/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Environment Variables for Server Hosting
Create `dist/.env` or use server environment variables:
```bash
export VITE_SUPABASE_URL="https://xxxxx.supabase.co"
export VITE_SUPABASE_ANON_KEY="eyJhbGc..."
```

**Note**: Vite bakes environment variables into the build, so rebuild after changing them.

---

## 🔐 Security Best Practices

### Environment Variables
```bash
# ❌ NEVER commit these
.env
.env.local
.env.production

# ✅ Always commit this
.env.example
```

### Supabase Security

#### Enable Row Level Security (Production)
```sql
-- Enable RLS on all tables
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read tournaments
CREATE POLICY "Public read access" ON tournaments
    FOR SELECT USING (true);

-- Policy: Anyone can create tournaments (adjust for auth later)
CREATE POLICY "Public create access" ON tournaments
    FOR INSERT WITH CHECK (true);

-- Similar policies for players and matches
```

#### API Key Management
- Use `anon` key for client (safe to expose)
- Never expose `service_role` key
- Rotate keys if compromised (Project Settings → API)

### Rate Limiting
Supabase free tier limits:
- 500 requests/hour
- 200 concurrent connections

For production, upgrade or implement client-side throttling.

---

## 📊 Performance Optimization

### Build Optimizations

#### 1. Code Splitting (Already handled by Vite)
```typescript
// Vite automatically splits routes
const BracketView = lazy(() => import('./components/BracketView'))
```

#### 2. Minimize Bundle Size
```bash
# Analyze bundle
npm install -D rollup-plugin-visualizer
```

Add to `vite.config.ts`:
```typescript
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true })
  ]
})
```

#### 3. Image Optimization
Store tournament banners in Supabase Storage:
```typescript
const { data } = await supabase.storage
  .from('tournament-assets')
  .upload('banner.jpg', file)
```

### Supabase Optimizations

#### Connection Pooling
Enable in Supabase Dashboard:
- Database → Connection pooling
- Use pooled connection string for production

#### Indexes (Already in schema)
Verify indexes exist:
```sql
SELECT * FROM pg_indexes WHERE tablename IN ('tournaments', 'players', 'matches');
```

#### Query Optimization
```typescript
// ❌ Bad: N+1 queries
for (const match of matches) {
  const player1 = await getPlayer(match.player1_id)
  const player2 = await getPlayer(match.player2_id)
}

// ✅ Good: Single query with joins
const matches = await supabase
  .from('matches')
  .select(`
    *,
    player1:players!player1_id(*),
    player2:players!player2_id(*)
  `)
```

---

## 🔍 Monitoring & Analytics

### Supabase Dashboard
Monitor in real-time:
- Database usage (Tables → Rows)
- API requests (Logs → Edge Functions)
- Realtime connections (Realtime → Connections)

### Error Tracking
Add Sentry for production errors:
```bash
npm install @sentry/react
```

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE,
});
```

### Analytics
Add Google Analytics or Plausible:
```html
<!-- In index.html -->
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

---

## 🐛 Production Troubleshooting

### Common Issues

#### "CORS Error"
**Cause**: Supabase URL not whitelisted
**Fix**: Project Settings → API → Allowed Origins → Add your domain

#### "Realtime not connecting"
**Cause**: Websocket blocked or not enabled
**Fix**:
1. Check Supabase realtime status
2. Verify browser console for connection errors
3. Check if behind corporate firewall

#### "Environment variables undefined"
**Cause**: Build didn't include .env
**Fix**:
1. Ensure variables start with `VITE_`
2. Rebuild: `npm run build`
3. Verify in Vercel/Netlify dashboard

#### "White screen after deployment"
**Cause**: Build errors or wrong base path
**Fix**:
```typescript
// vite.config.ts
export default defineConfig({
  base: '/', // Ensure this matches your hosting path
  plugins: [react()]
})
```

### Debug Mode
```typescript
// Enable verbose logging in production
if (import.meta.env.VITE_DEBUG === 'true') {
  console.log('Supabase config:', {
    url: import.meta.env.VITE_SUPABASE_URL,
    hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
  })
}
```

---

## 📱 Mobile Optimization

### PWA (Progressive Web App) - Optional
Make it installable:

```bash
npm install -D vite-plugin-pwa
```

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MK Tournament Manager',
        short_name: 'MK Tourney',
        theme_color: '#E71D36',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
```

---

## 🔄 Continuous Deployment

### GitHub Actions (Auto-deploy on push)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## ✅ Post-Deployment Checklist

- [ ] App loads on production URL
- [ ] Can create new tournament
- [ ] Bracket displays correctly
- [ ] Match results update in real-time
- [ ] No console errors
- [ ] Works on mobile (Chrome/Safari)
- [ ] SSL certificate active (HTTPS)
- [ ] Environment variables secure
- [ ] Database connections stable
- [ ] Monitoring enabled

---

## 📈 Scaling Considerations

### Current Limits (Free Tier)
- Supabase: 500MB database, 1GB bandwidth/month
- Vercel: 100GB bandwidth/month
- Expected capacity: ~50 concurrent tournaments

### Upgrade Path
1. **100+ concurrent users**: Upgrade Supabase to Pro ($25/month)
2. **Custom domain**: Free on Vercel
3. **Global CDN**: Included in Vercel
4. **Database backups**: Enable in Supabase dashboard

---

**Your tournament manager is now LIVE!** 🎉🥊

Next: Share the URL with your fighting game community!
