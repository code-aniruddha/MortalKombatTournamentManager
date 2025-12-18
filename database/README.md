# Database Setup Instructions

## Prerequisites
1. Create a Supabase account at https://supabase.com
2. Create a new project in Supabase

## Setup Steps

### 1. Run the Schema
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `schema.sql`
4. Paste and run the SQL script

### 2. Enable Realtime
1. Go to **Database** → **Replication**
2. Enable realtime for these tables:
   - `tournaments`
   - `players`
   - `matches`

### 3. Get Your Credentials
1. Go to **Project Settings** → **API**
2. Copy your:
   - **Project URL** (VITE_SUPABASE_URL)
   - **anon/public key** (VITE_SUPABASE_ANON_KEY)

### 4. Configure Environment Variables
Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Database Structure

### Tables Overview

#### `tournaments`
- Stores tournament metadata
- Status: Setup → In-Progress → Completed

#### `players`
- Linked to tournaments
- Contains seeding information
- Supports "Bye" players for power-of-2 bracket sizing

#### `matches`
- Core bracket structure
- Tracks player progression through winners/losers brackets
- Self-referencing for match flow (next_match_id_win, next_match_id_lose)

## Realtime Events
The application subscribes to:
- `matches:UPDATE` - When match results are reported
- `tournaments:UPDATE` - When tournament status changes
- `players:INSERT` - When new players join

## Security Considerations
Currently, the schema has RLS (Row Level Security) disabled for development.
For production, enable RLS and add appropriate policies based on your authentication setup.
