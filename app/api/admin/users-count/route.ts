import { createAdminClient } from '@/lib/supabase-admin'

/**
 * GET /api/admin/users-count
 * Returns the total number of registered users and how many were active in the last 24h
 */
export async function GET() {
  try {
    const adminClient = createAdminClient()

    const [{ data: users, error: usersError }, { count: activeCount, error: activeError }] = await Promise.all([
      adminClient.auth.admin.listUsers({ perPage: 1 }),
      adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gt('last_seen_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ])

    if (usersError) {
      return Response.json({ error: usersError.message }, { status: 500 })
    }
    if (activeError) {
      return Response.json({ error: activeError.message }, { status: 500 })
    }

    return Response.json({
      totalUsers: users?.total ?? 0,
      activeToday: activeCount ?? 0,
    })
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    return Response.json({ error }, { status: 500 })
  }
}
