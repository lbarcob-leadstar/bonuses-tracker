'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function LandingPage() {
  const supabase = createClient()
  const [bonusCount, setBonusCount] = useState(10)
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  const [showEmailSignup, setShowEmailSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [emailConfirm, setEmailConfirm] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [emailSignupLoading, setEmailSignupLoading] = useState(false)
  const [emailSignupError, setEmailSignupError] = useState<string | null>(null)
  const [emailSignupMessage, setEmailSignupMessage] = useState<string | null>(null)
  const [casinoLogos, setCasinoLogos] = useState<string[]>([])

  useEffect(() => {
    const start = 10
    const end = 100
    const durationMs = 2400
    const tickMs = 55
    const totalTicks = Math.ceil(durationMs / tickMs)
    let tick = 0
    let current = start

    const timerId = window.setInterval(() => {
      tick += 1
      const phase = tick / totalTicks

      let increment = 1
      if (phase < 0.65) {
        increment = Math.max(2, Math.round(9 - phase * 9))
      } else {
        const remainingTicks = Math.max(1, totalTicks - tick)
        increment = Math.max(1, Math.ceil((end - current) / remainingTicks))
      }

      current = Math.min(end, current + increment)
      setBonusCount(current)

      if (tick >= totalTicks || current >= end) {
        setBonusCount(end)
        window.clearInterval(timerId)
      }
    }, tickMs)

    return () => window.clearInterval(timerId)
  }, [])

  useEffect(() => {
    const loadCasinoLogos = async () => {
      const { data, error } = await supabase
        .from('casinos')
        .select('logo_url, sort_order')
        .eq('is_active', true)
        .not('logo_url', 'is', null)
        .order('sort_order', { ascending: true })

      if (error) return

      const logos = (data ?? [])
        .map((item) => item.logo_url)
        .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)

      setCasinoLogos(logos)
    }

    void loadCasinoLogos()
  }, [supabase])

  const logoColumns = useMemo(() => {
    if (casinoLogos.length === 0) return [] as string[][]

    const totalColumns = 6
    const minItemsPerColumn = 12

    return Array.from({ length: totalColumns }, (_, columnIndex) => {
      const rotated = [...casinoLogos.slice(columnIndex), ...casinoLogos.slice(0, columnIndex)]
      const repeated: string[] = []

      while (repeated.length < minItemsPerColumn) {
        repeated.push(...rotated)
      }

      return repeated.slice(0, minItemsPerColumn)
    })
  }, [casinoLogos])

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${appBaseUrl ?? window.location.origin}/auth/callback`,
      },
    })
  }

  const handleEmailSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedEmailConfirm = emailConfirm.trim().toLowerCase()

    setEmailSignupError(null)
    setEmailSignupMessage(null)

    if (!normalizedEmail || !normalizedEmailConfirm || !password || !passwordConfirm) {
      setEmailSignupError('Please complete all fields.')
      return
    }

    if (normalizedEmail !== normalizedEmailConfirm) {
      setEmailSignupError('Emails do not match.')
      return
    }

    if (password !== passwordConfirm) {
      setEmailSignupError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setEmailSignupError('Password must be at least 6 characters long.')
      return
    }

    setEmailSignupLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      })

      if (error) throw error

      if (data.session) {
        window.location.href = '/app'
        return
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (signInError) {
        setEmailSignupMessage('Account created. Enable email confirmation OFF in Supabase to allow instant login without verification email.')
        return
      }

      if (signInData.session) {
        window.location.href = '/app'
        return
      }

      setEmailSignupMessage('Account created. You can now sign in.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not create your account.'
      setEmailSignupError(message)
    } finally {
      setEmailSignupLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{
        background:
          'linear-gradient(138deg, #101720 0%, #152131 40%, #1c1e2f 76%, #2a1f30 100%), radial-gradient(circle at 12% 10%, rgba(73,148,201,0.2), transparent 36%), radial-gradient(circle at 82% 18%, rgba(229,45,75,0.18), transparent 38%)',
      }}
    >
      <div className="casino-texture" />

      {logoColumns.length > 0 && (
        <div className="landing-logo-marquee" aria-hidden="true">
          {logoColumns.map((column, columnIndex) => (
            <div
              key={`logo-col-${columnIndex}`}
              className={`landing-logo-column ${columnIndex % 2 === 0 ? 'landing-logo-column-up' : 'landing-logo-column-down'} ${columnIndex >= 4 ? 'hidden lg:flex' : columnIndex >= 2 ? 'hidden md:flex' : 'flex'}`}
            >
              <div className="landing-logo-track">
                {[...column, ...column].map((logoUrl, logoIndex) => (
                  <div key={`logo-${columnIndex}-${logoIndex}`} className="landing-logo-chip">
                    <img src={logoUrl} alt="Casino logo" className="landing-logo-image" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <header className="casino-header relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center min-w-0">
            <img
              src="/DBT-logo.png"
              alt="Daily Bonus Tracker"
              className="h-12 sm:h-14 md:h-16 w-auto object-contain flex-shrink-0"
            />
          </div>
        </div>
      </header>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center pt-10 pb-14">
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
          style={{ background: 'rgba(73,148,201,0.16)', border: '1px solid rgba(73,148,201,0.42)', color: '#d8f0ff' }}>
          Built for daily bonus grinders
        </div>

        <h2 className="text-5xl md:text-7xl font-black mb-4 leading-tight tracking-tight" style={{ color: '#f0f6ff' }}>
          Track{' '}
          <span style={{ color: '#FFE799', textShadow: '0 0 22px rgba(255,231,153,0.45)', fontVariantNumeric: 'tabular-nums' }}>
            {bonusCount >= 100 ? '100+' : bonusCount}
          </span>{' '}
          daily casino bonuses
        </h2>

        <p className="text-lg md:text-xl max-w-3xl mb-10" style={{ color: 'rgba(255,255,255,0.68)' }}>
          Claim faster, keep streaks alive, and get a single view of your daily progress across all major brands.
        </p>

        <button
          onClick={handleLogin}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-bold transition-all duration-300 hover:scale-105 cursor-pointer"
          style={{ background: '#E52D4B', boxShadow: '0 0 30px rgba(229,45,75,0.5)', color: '#fff' }}
        >
          <GoogleIcon />
          Sign in with Google — It&apos;s Free
        </button>

        <p className="mt-4 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          No credit card required · Syncs across all your devices
        </p>

        <button
          onClick={() => {
            setShowEmailSignup((prev) => !prev)
            setEmailSignupError(null)
            setEmailSignupMessage(null)
          }}
          className="mt-5 text-sm font-semibold cursor-pointer"
          style={{ color: '#CFE8FF' }}
        >
          {showEmailSignup ? 'Hide email sign up ▲' : 'Sign up with email ▼'}
        </button>

        {showEmailSignup && (
          <form
            onSubmit={handleEmailSignup}
            className="mt-4 w-full max-w-md rounded-2xl p-4 text-left"
            style={{ background: 'rgba(18,26,37,0.72)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}
          >
            <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.72)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full px-3 py-2.5 rounded-xl outline-none text-sm mb-3"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: '#fff' }}
              placeholder="you@example.com"
            />

            <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.72)' }}>
              Confirm email
            </label>
            <input
              type="email"
              value={emailConfirm}
              onChange={(e) => setEmailConfirm(e.target.value)}
              autoComplete="email"
              className="w-full px-3 py-2.5 rounded-xl outline-none text-sm mb-3"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: '#fff' }}
              placeholder="repeat your email"
            />

            <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.72)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full px-3 py-2.5 rounded-xl outline-none text-sm mb-3"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: '#fff' }}
              placeholder="at least 6 characters"
            />

            <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.72)' }}>
              Confirm password
            </label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              className="w-full px-3 py-2.5 rounded-xl outline-none text-sm"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: '#fff' }}
              placeholder="repeat your password"
            />

            {emailSignupError && (
              <p className="mt-3 text-xs font-semibold" style={{ color: '#FFB4C0' }}>
                {emailSignupError}
              </p>
            )}

            {emailSignupMessage && !emailSignupError && (
              <p className="mt-3 text-xs font-semibold" style={{ color: '#B8F0C8' }}>
                {emailSignupMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={emailSignupLoading}
              className="mt-4 w-full px-4 py-3 rounded-xl text-sm font-bold cursor-pointer transition-opacity"
              style={{ background: '#4994C9', color: '#fff', opacity: emailSignupLoading ? 0.7 : 1 }}
            >
              {emailSignupLoading ? 'Creating account...' : 'Create account with email'}
            </button>
          </form>
        )}
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 pb-14 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: '🎯', title: 'Smart Claim Flow', desc: 'Claim, unclaim, and track cooldowns per casino without friction.' },
          { icon: '🔥', title: 'Streak Momentum', desc: 'Build streaks every day and see progress at a glance.' },
          { icon: '📊', title: 'Personal Stats', desc: 'Monitor total claims, top casinos, and activity trends over time.' },
        ].map((feature) => (
          <div key={feature.title} className="casino-panel rounded-2xl p-5 text-left">
            <div className="text-2xl mb-2">{feature.icon}</div>
            <h3 className="font-bold text-lg mb-1" style={{ color: '#FFE799' }}>{feature.title}</h3>
            <p style={{ color: 'rgba(255,255,255,0.68)' }}>{feature.desc}</p>
          </div>
        ))}
      </div>

      <footer className="relative z-10 pb-8 px-4">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-center gap-4 text-sm">
          <a
            href="/privacy-policy"
            className="font-semibold transition-opacity duration-200 hover:opacity-100"
            style={{ color: 'rgba(255,255,255,0.72)', opacity: 0.88 }}
          >
            Privacy Policy
          </a>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
          <a
            href="/terms-of-service"
            className="font-semibold transition-opacity duration-200 hover:opacity-100"
            style={{ color: 'rgba(255,255,255,0.72)', opacity: 0.88 }}
          >
            Terms of Service
          </a>
        </div>
      </footer>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
      <path d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h13.2c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.3-10.6 7.3-17.3z" fill="#4285F4"/>
      <path d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.9-6c-2.1 1.4-4.9 2.3-8 2.3-6.1 0-11.3-4.1-13.2-9.7H2.7v6.2C6.6 42.6 14.7 48 24 48z" fill="#34A853"/>
      <path d="M10.8 28.8A14.4 14.4 0 0 1 10 24c0-1.7.3-3.3.8-4.8v-6.2H2.7A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.7 10.8l8.1-6z" fill="#FBBC05"/>
      <path d="M24 9.5c3.4 0 6.5 1.2 8.9 3.5l6.7-6.7C35.9 2.4 30.5 0 24 0 14.7 0 6.6 5.4 2.7 13.2l8.1 6.2C12.7 13.6 17.9 9.5 24 9.5z" fill="#EA4335"/>
    </svg>
  )
}
