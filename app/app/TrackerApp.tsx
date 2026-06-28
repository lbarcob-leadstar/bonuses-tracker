'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { CasinoWithClaim } from '@/types'

export default function TrackerApp() {
  const COOLDOWN_MS = 24 * 60 * 60 * 1000
  const STREAK_ACTIVE_MS = 48 * 60 * 60 * 1000
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [casinos, setCasinos] = useState<CasinoWithClaim[]>([])
  const [expandedCasinoIds, setExpandedCasinoIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'claimed' | 'unclaimed'>('all')
  const [sortBy, setSortBy] = useState<'highest-sc' | 'highest-gc' | 'a-z' | 'z-a' | 'next-available'>('next-available')
  const [search, setSearch] = useState('')
  const [now, setNow] = useState(Date.now())

  const getCooldownEndsAt = useCallback((lastClaimedAt: string | null) => {
    if (!lastClaimedAt) return null
    return new Date(new Date(lastClaimedAt).getTime() + COOLDOWN_MS)
  }, [COOLDOWN_MS])

  const isOnCooldown = useCallback((casino: CasinoWithClaim) => {
    const endsAt = getCooldownEndsAt(casino.last_claimed_at)
    return !!endsAt && endsAt.getTime() > now
  }, [getCooldownEndsAt, now])

  const formatCountdown = useCallback((casino: CasinoWithClaim) => {
    const endsAt = getCooldownEndsAt(casino.last_claimed_at)
    if (!endsAt) return null
    const remaining = endsAt.getTime() - now
    if (remaining <= 0) return null

    const totalSeconds = Math.floor(remaining / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, [getCooldownEndsAt, now])

  const getScValue = useCallback((casino: CasinoWithClaim) => Number(casino.sc_amount ?? 0), [])
  const getGcValue = useCallback((casino: CasinoWithClaim) => Number(casino.gc_amount ?? 0), [])

  const getRemainingCooldownMs = useCallback((casino: CasinoWithClaim) => {
    const endsAt = getCooldownEndsAt(casino.last_claimed_at)
    if (!endsAt) return 0
    return Math.max(0, endsAt.getTime() - now)
  }, [getCooldownEndsAt, now])

  const isStreakActive = useCallback((casino: CasinoWithClaim) => {
    if (casino.streak <= 0 || !casino.last_claimed_at) return false
    const elapsedMs = now - new Date(casino.last_claimed_at).getTime()
    return elapsedMs < STREAK_ACTIVE_MS
  }, [now, STREAK_ACTIVE_MS])

  const loadData = useCallback(async (userId: string) => {
    const { data: casinoData } = await supabase.from('casinos').select('*').eq('is_active', true).order('sort_order')
    const { data: claimsData } = await supabase
      .from('user_claims')
      .select('casino_id, streak, claimed_at, updated_at')
      .eq('user_id', userId)
      .order('claimed_at', { ascending: false })
      .order('updated_at', { ascending: false })
    const { data: favoritesData } = await supabase.from('user_favorites').select('casino_id').eq('user_id', userId)
    const claimMap = new Map<string, { streak: number | null, claimed_at: string, updated_at: string }>()
    for (const claim of claimsData ?? []) {
      const current = claimMap.get(claim.casino_id)
      if (!current) {
        claimMap.set(claim.casino_id, { streak: claim.streak, claimed_at: claim.claimed_at, updated_at: claim.updated_at })
        continue
      }
      const claimTime = new Date(claim.claimed_at).getTime()
      const currentTime = new Date(current.claimed_at).getTime()
      const claimUpdated = new Date(claim.updated_at).getTime()
      const currentUpdated = new Date(current.updated_at).getTime()
      if (claimTime > currentTime || (claimTime === currentTime && claimUpdated > currentUpdated)) {
        claimMap.set(claim.casino_id, { streak: claim.streak, claimed_at: claim.claimed_at, updated_at: claim.updated_at })
      }
    }
    const favoriteIds = new Set(favoritesData?.map((f) => f.casino_id) ?? [])
    const merged: CasinoWithClaim[] = (casinoData ?? []).map((casino) => {
      const claim = claimMap.get(casino.id)
      return {
        ...casino,
        last_claimed_at: claim?.claimed_at ?? null,
        streak: claim?.streak ?? 0,
        is_favorite: favoriteIds.has(casino.id),
      }
    })
    merged.sort((a, b) => Number(b.is_favorite) - Number(a.is_favorite) || a.sort_order - b.sort_order)
    setCasinos(merged)
    setLoading(false)
  }, [supabase])

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

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timerId)
  }, [])

  const toggleClaim = async (casino: CasinoWithClaim) => {
    if (!user) return
    if (isOnCooldown(casino)) return

    const nowDate = new Date()
    const nowIso = nowDate.toISOString()
    const today = nowIso.split('T')[0]
    const { data: lastClaim } = await supabase
      .from('user_claims').select('claimed_at, streak')
      .eq('user_id', user.id).eq('casino_id', casino.id)
      .order('claimed_at', { ascending: false }).limit(1).maybeSingle()

    const hoursSinceLastClaim = lastClaim?.claimed_at
      ? (nowDate.getTime() - new Date(lastClaim.claimed_at).getTime()) / (1000 * 60 * 60)
      : null

    let newStreak = 1
    if (hoursSinceLastClaim !== null && hoursSinceLastClaim >= 24 && hoursSinceLastClaim < 48) {
      newStreak = (lastClaim?.streak ?? 0) + 1
    }

    await supabase.from('user_claims').insert({
      user_id: user.id,
      casino_id: casino.id,
      claimed_date: today,
      claimed_at: nowIso,
      streak: newStreak,
      last_claim_date: today,
      updated_at: nowIso,
    })

    setCasinos((prev) => prev.map((c) => c.id === casino.id
      ? { ...c, last_claimed_at: nowIso, streak: newStreak }
      : c))
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const toggleFavorite = async (casino: CasinoWithClaim) => {
    if (!user) return

    if (casino.is_favorite) {
      await supabase.from('user_favorites').delete().eq('user_id', user.id).eq('casino_id', casino.id)
    } else {
      await supabase.from('user_favorites').upsert({ user_id: user.id, casino_id: casino.id }, { onConflict: 'user_id,casino_id' })
    }

    setCasinos((prev) => {
      const updated = prev.map((c) => c.id === casino.id ? { ...c, is_favorite: !c.is_favorite } : c)
      updated.sort((a, b) => Number(b.is_favorite) - Number(a.is_favorite) || a.sort_order - b.sort_order)
      return updated
    })
  }

  const toggleWelcomeOfferInfo = (casinoId: string) => {
    setExpandedCasinoIds((prev) => {
      const next = new Set(prev)
      if (next.has(casinoId)) {
        next.delete(casinoId)
      } else {
        next.add(casinoId)
      }
      return next
    })
  }

  const filtered = casinos.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const claimed = isOnCooldown(c)
    if (filter === 'claimed') return matchesSearch && claimed
    if (filter === 'unclaimed') return matchesSearch && !claimed
    return matchesSearch
  })

  const sortedFiltered = [...filtered].sort((a, b) => {
    if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1

    switch (sortBy) {
      case 'highest-sc': {
        const diff = getScValue(b) - getScValue(a)
        if (diff !== 0) return diff
        return a.name.localeCompare(b.name)
      }
      case 'highest-gc': {
        const diff = getGcValue(b) - getGcValue(a)
        if (diff !== 0) return diff
        return a.name.localeCompare(b.name)
      }
      case 'a-z':
        return a.name.localeCompare(b.name)
      case 'z-a':
        return b.name.localeCompare(a.name)
      case 'next-available': {
        const aCooldown = isOnCooldown(a)
        const bCooldown = isOnCooldown(b)
        if (aCooldown !== bCooldown) return aCooldown ? -1 : 1
        if (aCooldown && bCooldown) {
          const diff = getRemainingCooldownMs(a) - getRemainingCooldownMs(b)
          if (diff !== 0) return diff
        }
        return a.name.localeCompare(b.name)
      }
      default:
        return a.sort_order - b.sort_order
    }
  })

  const claimedCount = casinos.filter((c) => isOnCooldown(c)).length
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
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'highest-sc' | 'highest-gc' | 'a-z' | 'z-a' | 'next-available')}
            className="px-4 py-3 rounded-xl outline-none text-sm"
            style={{ background: '#2C343F', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f0' }}>
            <option value="highest-sc">Sort: Highest SC</option>
            <option value="highest-gc">Sort: Highest GC</option>
            <option value="a-z">Sort: A-Z</option>
            <option value="z-a">Sort: Z-A</option>
            <option value="next-available">Sort: Next available bonus</option>
          </select>
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
          {sortedFiltered.map((casino) => {
            const claimed = isOnCooldown(casino)
            const countdown = formatCountdown(casino)

            return (
            <div key={casino.id} className="rounded-2xl p-5 transition-all duration-200"
              style={{
                background: claimed ? 'rgba(229,45,75,0.1)' : '#2C343F',
                border: `1px solid ${claimed ? 'rgba(229,45,75,0.4)' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: claimed ? '0 0 15px rgba(229,45,75,0.15)' : 'none',
              }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {casino.logo_url ? (
                      <img
                        src={casino.logo_url}
                        alt={`${casino.name} logo`}
                        className="w-6 h-6 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-6 h-6 rounded flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.1)' }}
                      />
                    )}
                    {casino.casino_url ? (
                      <a
                        href={casino.casino_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-base truncate"
                        style={{ color: claimed ? '#FFE799' : '#f0f0f0' }}
                      >
                        {casino.name}
                      </a>
                    ) : (
                      <h3 className="font-bold text-base truncate" style={{ color: claimed ? '#FFE799' : '#f0f0f0' }}>
                        {casino.name}
                      </h3>
                    )}
                  </div>
                  <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{casino.bonus_description}</p>
                  {countdown && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
                      style={{ background: 'rgba(229,45,75,0.2)', color: '#ff9bad' }}>
                      ⏳ Available in {countdown}
                    </div>
                  )}
                  {casino.welcome_offer_info && (
                    <div className="mt-2">
                      <button
                        onClick={() => toggleWelcomeOfferInfo(casino.id)}
                        className="text-xs font-semibold cursor-pointer"
                        style={{ color: '#FFE799' }}>
                        {expandedCasinoIds.has(casino.id) ? 'Hide welcome offer info ▲' : 'Show welcome offer info ▼'}
                      </button>
                      {expandedCasinoIds.has(casino.id) && (
                        <div className="mt-2 p-3 rounded-lg text-xs leading-relaxed"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)' }}>
                          {casino.welcome_offer_info}
                        </div>
                      )}
                    </div>
                  )}
                  {isStreakActive(casino) && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
                      style={{ background: 'rgba(255,231,153,0.15)', color: '#FFE799' }}>
                      🔥 {casino.streak} day streak
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => toggleFavorite(casino)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer"
                    aria-label={casino.is_favorite ? `Remove ${casino.name} from favorites` : `Add ${casino.name} to favorites`}
                    title={casino.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                    style={{
                      background: casino.is_favorite ? 'rgba(229,45,75,0.2)' : 'rgba(255,255,255,0.08)',
                      border: `1px solid ${casino.is_favorite ? 'rgba(229,45,75,0.6)' : 'rgba(255,255,255,0.2)'}`,
                    }}
                  >
                    <span style={{ color: casino.is_favorite ? '#E52D4B' : 'rgba(255,255,255,0.35)' }}>♥</span>
                  </button>
                  <button onClick={() => toggleClaim(casino)}
                    disabled={claimed}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                    style={{
                      background: claimed ? '#E52D4B' : 'rgba(255,255,255,0.08)',
                      border: `2px solid ${claimed ? '#E52D4B' : 'rgba(255,255,255,0.2)'}`,
                      boxShadow: claimed ? '0 0 10px rgba(229,45,75,0.5)' : 'none',
                      cursor: claimed ? 'not-allowed' : 'pointer',
                      opacity: claimed ? 0.85 : 1,
                    }}>
                    {claimed && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7l3.5 3.5L12 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
            )
          })}
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
