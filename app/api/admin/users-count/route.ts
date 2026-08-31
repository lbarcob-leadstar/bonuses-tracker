import { createAdminClient } from '@/lib/supabase-admin'

/**
 * GET /api/admin/users-count
 * Returns the total number of registered users
 */
export async function GET() {
  try {
    const adminClient = createAdminClient()
    
    // Get count of all users from auth
    const { data: users, error } = await adminClient.auth.admin.listUsers({
      perPage: 1,
    })
    
    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({
      totalUsers: users?.total ?? 0,
      message: `Total registered users: ${users?.total ?? 0}`,
    })
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    return Response.json({ error }, { status: 500 })
  }
}
