import { create } from 'zustand'
import { User, Session } from '@supabase/supabase-js'
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
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  isAdmin: () => boolean
  isActive: () => boolean
  isValidSession: () => boolean
  loadProfile: () => Promise<void>
  verifySession: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
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
  isValidSession: () => {
    const { session, user, profile } = get()
    if (!session || !user) return false
    
    // Verificar que la sesión no haya expirado
    const now = Math.floor(Date.now() / 1000)
    if (session.expires_at && session.expires_at < now) {
      return false
    }
    
    // Verificar que el perfil esté activo
    if (!profile || !profile.active) {
      return false
    }
    
    return true
  },
  verifySession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error verifying session:', error)
        set({ session: null, user: null, profile: null })
        return false
      }
      
      if (!session) {
        set({ session: null, user: null, profile: null })
        return false
      }
      
      // Verificar que la sesión no haya expirado
      const now = Math.floor(Date.now() / 1000)
      if (session.expires_at && session.expires_at < now) {
        console.warn('Session expired')
        set({ session: null, user: null, profile: null })
        await supabase.auth.signOut()
        return false
      }
      
      // Verificar que el usuario tenga perfil activo
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (profileError || !profileData) {
        console.error('Error loading profile:', profileError)
        set({ session: null, user: null, profile: null })
        await supabase.auth.signOut()
        return false
      }
      
      if (!profileData.active) {
        console.warn('User profile is not active')
        set({ session: null, user: null, profile: null })
        await supabase.auth.signOut()
        return false
      }
      
      set({ 
        session, 
        user: session.user, 
        profile: profileData 
      })
      
      return true
    } catch (error) {
      console.error('Error in verifySession:', error)
      set({ session: null, user: null, profile: null })
      return false
    }
  },
  loadProfile: async () => {
    const { user, session } = get()
    if (!user || !session) {
      set({ profile: null })
      return
    }

    // Verificar que la sesión no haya expirado
    const now = Math.floor(Date.now() / 1000)
    if (session.expires_at && session.expires_at < now) {
      console.warn('Session expired')
      set({ profile: null, user: null, session: null })
      await supabase.auth.signOut()
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
        set({ profile: null, user: null, session: null })
        await supabase.auth.signOut()
        return
      }
      
      set({ profile: data })
    } catch (error) {
      console.error('Error loading profile:', error)
      set({ profile: null, user: null, session: null })
      await supabase.auth.signOut()
    }
  },
  signOut: async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      // Limpiar todo el estado independientemente de si hubo error
      set({ user: null, session: null, profile: null })
      // Limpiar sessionStorage y localStorage relacionado con auth
      sessionStorage.clear()
      // No limpiar todo localStorage porque puede tener otras cosas
      // Solo limpiar lo relacionado con Supabase
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    }
  },
  initialize: async () => {
    set({ loading: true })
    
    // Verificar sesión inicial (verifySession ya actualiza el estado)
    await get().verifySession()
    
    set({ loading: false })

    // Configurar listener para cambios de autenticación
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)
      
      if (event === 'SIGNED_OUT' || !session) {
        set({ session: null, user: null, profile: null })
        return
      }
      
      // Verificar sesión cuando cambia el estado (verifySession ya actualiza el estado)
      await get().verifySession()
    })
    
    // Verificar sesión periódicamente (cada 5 minutos)
    setInterval(async () => {
      const { session } = get()
      if (session) {
        await get().verifySession()
      }
    }, 5 * 60 * 1000) // 5 minutos
  },
}))

