# Configuración de Edge Function para Crear Usuarios

Para que los admins puedan crear usuarios sin necesidad de habilitar el registro público en Supabase, necesitas crear una Edge Function desde el Dashboard.

## Pasos para Crear la Función desde el Dashboard

### 1. Acceder a Edge Functions

1. Ve a tu Dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. En el menú lateral, ve a **Edge Functions**

### 2. Crear Nueva Función

1. Haz clic en **"Create a new function"** o **"New Function"**
2. Nombre de la función: `create-user`
3. Haz clic en **"Create function"**

### 3. Pegar el Código

Copia y pega el siguiente código en el editor:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Create admin client to use Admin API
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify that the current user is an admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role, active')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin' || !profile.active) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { username, password } = await req.json()

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const normalizedUsername = username.toLowerCase().trim()
    const email = `${normalizedUsername}@example.com`

    // Check if username already exists in user_profiles
    const { data: existingProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('id, username')
      .eq('username', normalizedUsername)
      .maybeSingle()

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: 'Username already exists' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user already exists in auth by email BEFORE trying to create
    let existingAuthUser = null
    try {
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      if (!listError && users && users.users) {
        existingAuthUser = users.users.find(u => u.email === email)
      }
    } catch (listError) {
      // If listUsers fails, continue and try to create (might be a new user)
      console.error('Error listing users:', listError)
    }

    let userId: string
    let isNewUser = false

    if (existingAuthUser) {
      // User exists in auth, check if profile exists
      const { data: existingProfileByUserId } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('id', existingAuthUser.id)
        .maybeSingle()

      if (existingProfileByUserId) {
        return new Response(
          JSON.stringify({ error: 'User already exists with this username' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // User exists in auth but no profile, update password and use existing user
      try {
        await supabaseAdmin.auth.admin.updateUserById(existingAuthUser.id, {
          password: password,
          user_metadata: { username: normalizedUsername },
        })
        userId = existingAuthUser.id
      } catch (updateError: any) {
        return new Response(
          JSON.stringify({ error: updateError?.message || 'Failed to update existing user' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      // User doesn't exist in auth, create new user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: { username: normalizedUsername },
      })

      if (authError || !authData.user) {
        return new Response(
          JSON.stringify({ error: authError?.message || 'Failed to create user' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      userId = authData.user.id
      isNewUser = true
    }

    // Double-check that profile doesn't exist before inserting (race condition protection)
    const { data: doubleCheckProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('id, username')
      .eq('id', userId)
      .maybeSingle()

    if (doubleCheckProfile) {
      // Profile already exists - this can happen if:
      // 1. There's a database trigger that auto-creates profiles
      // 2. A previous request partially succeeded
      // 3. Race condition between checks
      // Check if the username matches - if so, return success (idempotent operation)
      if (doubleCheckProfile.username === normalizedUsername) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            user: {
              id: userId,
              username: normalizedUsername,
            },
            message: 'User already exists'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        // Username doesn't match - this is an error
        return new Response(
          JSON.stringify({ error: 'User ID already exists with different username' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Create user profile
    const { error: profileInsertError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: userId,
        username: normalizedUsername,
        role: 'user',
        active: true,
      })

    if (profileInsertError) {
      // If profile creation fails and we created a new user, try to delete it
      if (isNewUser) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(userId)
        } catch (deleteError) {
          console.error('Failed to delete user after profile creation failure:', deleteError)
        }
      }
      return new Response(
        JSON.stringify({ error: profileInsertError.message || 'Failed to create user profile' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: userId,
          username: normalizedUsername,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### 4. Guardar y Desplegar

1. Haz clic en **"Deploy"** o **"Save"** para guardar y desplegar la función
2. Espera a que se complete el despliegue (puede tomar unos segundos)

### 5. Verificar que la función esté desplegada

La función `create-user` debería aparecer en la lista de Edge Functions con estado "Active" o "Deployed"

## Configuración de Variables de Entorno

La función Edge usa automáticamente las siguientes variables de entorno de Supabase:
- `SUPABASE_URL` - Se configura automáticamente
- `SUPABASE_ANON_KEY` - Se configura automáticamente  
- `SUPABASE_SERVICE_ROLE_KEY` - Se configura automáticamente

No necesitas configurar nada manualmente, Supabase las inyecta automáticamente.

## Cómo Funciona

1. El admin llama a la función desde el frontend
2. La función verifica que el usuario actual sea admin y esté activo
3. La función usa el Admin API (service_role) para crear el usuario en auth
4. La función crea el perfil en `user_profiles`
5. Retorna éxito o error

## Deshabilitar Registro Público

Una vez desplegada la función, puedes deshabilitar el registro público en Supabase:

1. Ve a Authentication → Settings
2. Desactiva "Enable email signup"
3. Guarda los cambios

Esto asegura que solo los admins puedan crear usuarios a través de la función Edge.

## Troubleshooting

### Error: "Function not found"
- Asegúrate de haber desplegado la función: `supabase functions deploy create-user`
- Verifica que el nombre de la función sea exactamente `create-user`

### Error: "Unauthorized" o "Forbidden"
- Verifica que el usuario que intenta crear usuarios sea admin
- Verifica que el admin esté activo (`active = true`)

### Error: "Service role key not found"
- Las variables de entorno se configuran automáticamente
- Si hay problemas, verifica en Supabase Dashboard → Settings → API → Service Role Key

## Actualizar la Función

Si necesitas hacer cambios a la función:

1. Ve a Edge Functions en el Dashboard
2. Selecciona la función `create-user`
3. Edita el código
4. Haz clic en **"Deploy"** o **"Save"** para actualizar

