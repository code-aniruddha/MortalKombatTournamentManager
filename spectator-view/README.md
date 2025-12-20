# Mortal Kombat Tournament Spectator View

A read-only frontend for viewing live tournament brackets, match results, and player statistics in real-time.

## 🎮 Features

- **Live Tournament List** - Browse all active and completed tournaments
- **Real-Time Updates** - Automatic bracket updates via Supabase Realtime
- **Match Details** - View all matches with current status and results
- **Player Stats** - Complete fighter roster with seeding
- **Champion Display** - Prominent display of tournament winners
- **Responsive Design** - Works on all devices
- **No Admin Controls** - Pure spectator experience

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd spectator-view
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and add your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase URL and Anon Key (same as the admin panel).

### 3. Run Development Server

```bash
npm run dev
```

The spectator view will be available at **http://localhost:5174/**

## 📦 Build for Production

```bash
npm run build
npm run preview
```

## 🎨 Customization

The spectator view uses the same Mortal Kombat theme as the admin panel:
- **Blood Red** (#8B0000) - Primary accent
- **Soul Energy Green** (#00FF41) - Live indicators
- **Klassic Gold** (#C5A059) - Highlights
- **Obsidian Black** (#0D0D0D) - Background

## 🔗 Integration

This spectator view connects to the same Supabase database as the admin panel. Ensure both projects share the same `.env` configuration.

### Database Tables Used (Read-Only):
- `tournaments` - Tournament information
- `players` - Fighter roster
- `matches` - Match brackets and results

## 📱 Deployment

Deploy to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- Firebase Hosting

## ⚡ Performance

- Automatic data refresh every 10 seconds
- Real-time updates via WebSocket
- Optimized animations with Framer Motion
- Lazy loading for large tournaments

## 🔒 Security

This is a **read-only** application with no admin controls. Users can only view tournament data.

---

**Built with React + Vite + Supabase + Tailwind CSS**
