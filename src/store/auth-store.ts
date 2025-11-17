import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  username: string
  role: string
  active: boolean
  created_at: string
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  isAdmin: () => boolean
  isActive: () => boolean
  loadProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  isAdmin: () => {
    const { profile } = get()
    return (profile?.role ?? '') === 'admin'
  },
  isActive: () => {
    const { profile } = get()
    return profile?.active ?? false
  },
  loadProfile: async () => {
    const { user } = get()
    if (!user) {
      set({ profile: null })
      return
    }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error
        
        // Verificar que el usuario esté activo
        if (data && !data.active) {
          console.warn('Usuario desactivado')
          set({ profile: null, user: null })
          await supabase.auth.signOut()
          return
        }
        
        set({ profile: data })
      } catch (error) {
        console.error('Error loading profile:', error)
        set({ profile: null })
      }
  },
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },
  initialize: async () => {
    set({ loading: true })
    const { data: { session } } = await supabase.auth.getSession()
    set({ user: session?.user ?? null })
    
    // Cargar perfil si hay usuario
    if (session?.user) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error) throw error
        
        // Verificar que el usuario esté activo
        if (data && !data.active) {
          console.warn('Usuario desactivado')
          set({ profile: null, user: null })
          await supabase.auth.signOut()
          return
        }
        
        set({ profile: data })
      } catch (error) {
        console.error('Error loading profile:', error)
        set({ profile: null })
      }
    } else {
      set({ profile: null })
    }

    set({ loading: false })

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ user: session?.user ?? null })
      
      if (session?.user) {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (error) throw error
          
          // Verificar que el usuario esté activo
          if (data && !data.active) {
            console.warn('Usuario desactivado')
            set({ profile: null, user: null })
            await supabase.auth.signOut()
            return
          }
          
          set({ profile: data })
        } catch (error) {
          console.error('Error loading profile:', error)
          set({ profile: null })
        }
      } else {
        set({ profile: null })
      }
    })
  },
}))

