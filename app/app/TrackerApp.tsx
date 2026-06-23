'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { CasinoWithClaim } from '@/types'

export default function TrackerApp() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [casinos, setCasinos] = useState<CasinoWithClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'claimed' | 'unclaimed'>('all')
  const [search, setSearch] = useState('')
  const today = new Date().toISOString().split('T')[0]

  const loadData = useCallback(async (userId: string) => {
    const { data: casinoData } = await supabase.from('casinos').select('*').eq('is_active', true).order('sort_order')
    const { data: claimsData } = await supabase.from('user_claims').select('*').eq('user_id', userId).eq('claimed_date', today)
    const claimMap = new Map(claimsData?.map((c) => [c.casino_id, c]) ?? [])
    const merged: CasinoWithClaim[] = (casinoData ?? []).map((casino) => {
      const claim = claimMap.get(casino.id)
      return { ...casino, claimed_today: !!claim, streak: claim?.streak ?? 0 }
    })
    setCasinos(merged)
    setLoading(false)
  }, [supabase, today])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        loadData(session.user.id)
      } else {
        window.location.href = '/'
      }
    })
  }, [supabase, loadData])

  const toggleClaim = async (casino: CasinoWithClaim) => {
    if (!user) return
    if (!casino.claimed_today) {
      const { data: lastClaim } = await supabase
        .from('user_claims').select('claimed_date, streak')
        .eq('user_id', user.id).eq('casino_id', casino.id)
        .order('claimed_date', { ascending: false }).limit(1).maybeSingle()
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      const newStreak = lastClaim?.claimed_date === yesterdayStr ? (lastClaim.streak ?? 0) + 1 : 1
      await supabase.from('user_claims').upsert({
        user_id: user.id, casino_id: casino.id, claimed_date: today,
        streak: newStreak, last_claim_date: today, updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,casino_id,claimed_date' })
      setCasinos((prev) => prev.map((c) => c.id === casino.id ? { ...c, claimed_today: true, streak: newStreak } : c))
    } else {
      await supabase.from('user_claims').delete().eq('user_id', user.id).eq('casino_id', casino.id).eq('claimed_date', today)
      setCasinos((prev) => prev.map((c) => c.id === casino.id ? { ...c, claimed_today: false, streak: 0 } : c))
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const filtered = casinos.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase())
    if (filter === 'claimed') return matchesSearch && c.claimed_today
    if (filter === 'unclaimed') return matchesSearch && !c.claimed_today
    return matchesSearch
  })

  const claimedCount = casinos.filter((c) => c.claimed_today).length
  const totalCount = casinos.length
  const progress = totalCount > 0 ? (claimedCount / totalCount) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1e252e' }}>
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🎰</div>
          <p style={{ color: '#FFE799' }}>Loading your bonuses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#1e252e' }}>
      <header style={{ background: '#2C343F', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎰</span>
            <div>
              <h1 className="font-black text-lg leading-none" style={{ color: '#FFE799' }}>Bonus Tracker</h1>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm hidden md:block" style={{ color: 'rgba(255,255,255,0.5)' }}>{user?.email}</span>
            <button onClick={handleSignOut} className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              style={{ background: 'rgba(229,45,75,0.2)', color: '#E52D4B', border: '1px solid rgba(229,45,75,0.3)' }}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-2xl p-6 mb-8" style={{ background: '#2C343F', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>Today&apos;s Progress</p>
              <p className="text-3xl font-black">
                <span style={{ color: '#FFE799' }}>{claimedCount}</span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}> / {totalCount}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black" style={{ color: '#E52D4B' }}>{Math.round(progress)}%</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>bonuses claimed</p>
            </div>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #E52D4B, #FFE799)', boxShadow: '0 0 10px rgba(229,45,75,0.5)' }} />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input type="text" placeholder="Search casinos..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl outline-none text-sm"
            style={{ background: '#2C343F', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f0' }} />
          <div className="flex gap-2">
            {(['all', 'unclaimed', 'claimed'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-4 py-3 rounded-xl text-sm font-semibold capitalize transition-all cursor-pointer"
                style={{
                  background: filter === f ? '#E52D4B' : '#2C343F',
                  color: filter === f ? '#fff' : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${filter === f ? '#E52D4B' : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: filter === f ? '0 0 15px rgba(229,45,75,0.4)' : 'none',
                }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((casino) => (
            <div key={casino.id} className="rounded-2xl p-5 transition-all duration-200"
              style={{
                background: casino.claimed_today ? 'rgba(229,45,75,0.1)' : '#2C343F',
                border: `1px solid ${casino.claimed_today ? 'rgba(229,45,75,0.4)' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: casino.claimed_today ? '0 0 15px rgba(229,45,75,0.15)' : 'none',
              }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base truncate" style={{ color: casino.claimed_today ? '#FFE799' : '#f0f0f0' }}>
                    {casino.name}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{casino.bonus_description}</p>
                  {casino.streak > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
                      style={{ background: 'rgba(255,231,153,0.15)', color: '#FFE799' }}>
                      🔥 {casino.streak} day streak
                    </div>
                  )}
                </div>
                <button onClick={() => toggleClaim(casino)}
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer"
                  style={{
                    background: casino.claimed_today ? '#E52D4B' : 'rgba(255,255,255,0.08)',
                    border: `2px solid ${casino.claimed_today ? '#E52D4B' : 'rgba(255,255,255,0.2)'}`,
                    boxShadow: casino.claimed_today ? '0 0 10px rgba(229,45,75,0.5)' : 'none',
                  }}>
                  {casino.claimed_today && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7l3.5 3.5L12 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🎲</div>
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>No casinos match your filter</p>
          </div>
        )}
      </div>
    </div>
  )
}
