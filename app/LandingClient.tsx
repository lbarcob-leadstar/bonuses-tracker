'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function LandingPage() {
  const supabase = createClient()
  const [bonusCount, setBonusCount] = useState(10)

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

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
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

      <header className="casino-header relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/UG-logo.png"
              alt="UG logo"
              className="w-14 h-14 object-contain flex-shrink-0"
            />
            <h1 className="font-black text-lg md:text-xl leading-tight" style={{ color: '#FFE799', textShadow: '0 0 10px rgba(255, 231, 153, 0.3)' }}>
              United Gamblers Daily Bonus Tracker
            </h1>
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
