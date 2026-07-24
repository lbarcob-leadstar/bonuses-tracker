import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin: requestOrigin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const origin = configuredAppUrl ?? (forwardedHost ? `${forwardedProto}://${forwardedHost}` : requestOrigin)

  return NextResponse.redirect(`${origin}/app`)
}
