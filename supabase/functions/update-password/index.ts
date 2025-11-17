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

    // Parse request body
    const body = await req.json()
    const { targetUserId, currentPassword, newPassword, isAdminChange } = body

    // Validate required fields
    if (!newPassword) {
      return new Response(
        JSON.stringify({ error: 'New password is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let targetUser = user
    let isAdmin = false

    // Check if user is admin
    const { data: currentUserProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role, active')
      .eq('id', user.id)
      .single()

    if (profileError || !currentUserProfile || !currentUserProfile.active) {
      return new Response(
        JSON.stringify({ error: 'User profile not found or inactive' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    isAdmin = currentUserProfile.role === 'admin'

    // If changing another user's password, verify admin access
    if (targetUserId && targetUserId !== user.id) {
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: Admin access required to change other users\' passwords' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!isAdminChange) {
        return new Response(
          JSON.stringify({ error: 'Admin change flag required when changing another user\'s password' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify target user exists and is active
      const { data: targetProfile, error: targetError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, username, active, role')
        .eq('id', targetUserId)
        .single()

      if (targetError || !targetProfile) {
        return new Response(
          JSON.stringify({ error: 'Target user not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!targetProfile.active) {
        return new Response(
          JSON.stringify({ error: 'Cannot change password for inactive user' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Prevent admin from changing their own password through admin route
      // (they should use the regular change password flow)
      if (targetUserId === user.id) {
        return new Response(
          JSON.stringify({ error: 'Use the regular password change flow to change your own password' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get target user's auth data
      const { data: targetAuthUser, error: targetAuthError } = await supabaseAdmin.auth.admin.getUserById(targetUserId)
      
      if (targetAuthError || !targetAuthUser) {
        return new Response(
          JSON.stringify({ error: 'Target user auth data not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      targetUser = targetAuthUser.user
    } else {
      // User changing their own password - verify current password
      if (!currentPassword) {
        return new Response(
          JSON.stringify({ error: 'Current password is required to change your own password' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify current password by attempting to sign in
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      if (!profile) {
        return new Response(
          JSON.stringify({ error: 'User profile not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const email = `${profile.username}@example.com`
      
      // Verify current password by attempting to sign in with a temporary client
      // This doesn't affect the current session
      const tempClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      )
      
      const { error: signInError } = await tempClient.auth.signInWithPassword({
        email,
        password: currentPassword,
      })

      if (signInError) {
        return new Response(
          JSON.stringify({ error: 'Current password is incorrect' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Update password using Admin API
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      {
        password: newPassword,
      }
    )

    if (updateError || !updateData) {
      return new Response(
        JSON.stringify({ error: updateError?.message || 'Failed to update password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Password updated successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

