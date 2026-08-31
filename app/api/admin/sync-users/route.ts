import { createAdminClient } from '@/lib/supabase-admin'

/**
 * GET /api/admin/sync-users
 * Syncs all auth.users to the profiles table
 * This endpoint should be called after users are created
 */
export async function GET(req: Request) {
  // Check for admin authorization
  const authHeader = req.headers.get('authorization')
  const expectedToken = process.env.ADMIN_API_TOKEN
  
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const adminClient = createAdminClient()
    
    // Get all users from auth
    const { data: users, error: usersError } = await adminClient.auth.admin.listUsers({
      perPage: 1000,
    })
    
    if (usersError) {
      return Response.json({ error: usersError.message }, { status: 500 })
    }

    if (!users) {
      return Response.json({ synced: 0 })
    }

    // Sync each user to profiles table
    const syncedIds = []
    for (const user of users.users) {
      const { error: profileError } = await adminClient
        .from('profiles')
        .upsert({
          id: user.id,
          created_at: user.created_at,
          last_seen_at: new Date().toISOString(),
        }, { onConflict: 'id' })
      
      if (!profileError) {
        syncedIds.push(user.id)
      }
    }

    return Response.json({
      synced: syncedIds.length,
      total: users.users.length,
      message: `Synced ${syncedIds.length} users to profiles table`,
    })
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    return Response.json({ error }, { status: 500 })
  }
}
