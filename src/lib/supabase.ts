import { createClient } from '@supabase/supabase-js'

const supabaseUrl: string = (import.meta as any).env.VITE_SUPABASE_URL
const supabaseAnonKey: string = (import.meta as any).env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          username: string
          role: string
          active: boolean
          created_at: string
        }
        Insert: {
          id: string
          username: string
          role?: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          role?: string
          active?: boolean
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          sku: string | null
          category_id: string | null
          current_stock: number
          min_stock: number
          price: number | null
          image_path: string | null
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          sku?: string | null
          category_id?: string | null
          current_stock?: number
          min_stock?: number
          price?: number | null
          image_path?: string | null
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          sku?: string | null
          category_id?: string | null
          current_stock?: number
          min_stock?: number
          price?: number | null
          image_path?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      stock_movements: {
        Row: {
          id: string
          product_id: string
          type: 'entry' | 'exit'
          quantity: number
          reason: string | null
          notes: string | null
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          product_id: string
          type: 'entry' | 'exit'
          quantity: number
          reason?: string | null
          notes?: string | null
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          product_id?: string
          type?: 'entry' | 'exit'
          quantity?: number
          reason?: string | null
          notes?: string | null
          created_at?: string
          user_id?: string
        }
      }
    }
  }
}

