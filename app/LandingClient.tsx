'use client'

import { createClient } from '@/lib/supabase'

export default function LandingPage() {
  const supabase = createClient()

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #1e252e 0%, #2C343F 50%, #1e252e 100%)' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
          style={{ background: 'rgba(229,45,75,0.15)', border: '1px solid rgba(229,45,75,0.4)', color: '#E52D4B' }}>
          🎰 Daily Bonus Tracker
        </div>
        <h1 className="text-5xl md:text-7xl font-black mb-4 leading-tight tracking-tight">
          Never Miss a{' '}
          <span style={{ color: '#FFE799', textShadow: '0 0 30px rgba(255,231,153,0.5)' }}>
            Daily Bonus
          </span>
          {' '}Again
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mb-10" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Track all your sweepstakes casino daily bonuses in one place.
          Check them off as you claim, build your streaks, and never leave free coins on the table.
        </p>
        <button
          onClick={handleLogin}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-bold transition-all duration-300 hover:scale-105 cursor-pointer"
          style={{ background: '#E52D4B', boxShadow: '0 0 30px rgba(229,45,75,0.5)' }}
        >
          <GoogleIcon />
          Sign in with Google — It&apos;s Free
        </button>
        <p className="mt-4 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          No credit card required · Syncs across all your devices
        </p>
      </div>
      <div className="w-full max-w-5xl mx-auto px-4 pb-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: '✅', title: '103 Casinos', desc: 'All major sweepstakes casinos tracked in one dashboard' },
          { icon: '🔥', title: 'Streak Tracker', desc: 'See how many days in a row you\'ve claimed each bonus' },
          { icon: '🔄', title: 'Auto-Reset', desc: 'Bonuses reset at midnight so you\'re always up to date' },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl p-6 text-center"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-4xl mb-3">{f.icon}</div>
            <h3 className="font-bold text-lg mb-2" style={{ color: '#FFE799' }}>{f.title}</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>{f.desc}</p>
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
