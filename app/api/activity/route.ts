import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  const authorization = request.headers.get('authorization')
  const accessToken = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null

  if (!accessToken) {
    return Response.json({ error: 'Missing access token' }, { status: 401 })
  }

  try {
    const adminClient = createAdminClient()
    const { data: { user }, error: userError } = await adminClient.auth.getUser(accessToken)

    if (userError || !user) {
      return Response.json({ error: 'Invalid access token' }, { status: 401 })
    }

    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({ id: user.id, last_seen_at: new Date().toISOString() }, { onConflict: 'id' })

    if (profileError) {
      return Response.json({ error: profileError.message }, { status: 500 })
    }

    return Response.json({ recorded: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return Response.json({ error: message }, { status: 500 })
  }
}