// Database types for Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      tournaments: {
        Row: {
          id: string
          name: string
          status: 'Setup' | 'In-Progress' | 'Completed'
          participant_count: number
          created_at: string
          updated_at: string
          started_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          name: string
          status?: 'Setup' | 'In-Progress' | 'Completed'
          participant_count: number
          created_at?: string
          updated_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          status?: 'Setup' | 'In-Progress' | 'Completed'
          participant_count?: number
          created_at?: string
          updated_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
        Relationships: []
      }
      players: {
        Row: {
          id: string
          tournament_id: string
          name: string
          seed: number
          is_bye: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          name: string
          seed: number
          is_bye?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          name?: string
          seed?: number
          is_bye?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_tournament_id_fkey"
            columns: ["tournament_id"]
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          }
        ]
      }
      matches: {
        Row: {
          id: string
          tournament_id: string
          round_number: number
          bracket_type: 'Winners' | 'Losers' | 'GrandFinals' | 'GrandFinalsReset'
          match_order: number
          player1_id: string | null
          player2_id: string | null
          winner_id: string | null
          next_match_id_win: string | null
          next_match_id_lose: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          tournament_id: string
          round_number: number
          bracket_type: 'Winners' | 'Losers' | 'GrandFinals' | 'GrandFinalsReset'
          match_order: number
          player1_id?: string | null
          player2_id?: string | null
          winner_id?: string | null
          next_match_id_win?: string | null
          next_match_id_lose?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          tournament_id?: string
          round_number?: number
          bracket_type?: 'Winners' | 'Losers' | 'GrandFinals' | 'GrandFinalsReset'
          match_order?: number
          player1_id?: string | null
          player2_id?: string | null
          winner_id?: string | null
          next_match_id_win?: string | null
          next_match_id_lose?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_player1_id_fkey"
            columns: ["player1_id"]
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_player2_id_fkey"
            columns: ["player2_id"]
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_id_fkey"
            columns: ["winner_id"]
            referencedRelation: "players"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
