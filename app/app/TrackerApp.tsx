'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { CasinoWithClaim, FeaturedBonus } from '@/types'

type LogoGradient = { primary: string, secondary: string }

export default function TrackerApp() {
  const COOLDOWN_MS = 24 * 60 * 60 * 1000
  const STREAK_ACTIVE_MS = 48 * 60 * 60 * 1000
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [casinos, setCasinos] = useState<CasinoWithClaim[]>([])
  const [expandedCasinoIds, setExpandedCasinoIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'claimed' | 'unclaimed' | 'favorites'>('all')
  const [dashboardView, setDashboardView] = useState<'tracker' | 'stats'>('tracker')
  const [sortBy, setSortBy] = useState<'highest-sc' | 'highest-gc' | 'lowest-min-redemption' | 'longest-streak' | 'a-z' | 'z-a' | 'next-available'>('next-available')
  const [search, setSearch] = useState('')
  const [now, setNow] = useState(Date.now())
  const [logoGradients, setLogoGradients] = useState<Record<string, LogoGradient>>({})
  const [claimFxByCasino, setClaimFxByCasino] = useState<Record<string, number>>({})
  const [streakFxByCasino, setStreakFxByCasino] = useState<Record<string, number>>({})
  const [featuredBonuses, setFeaturedBonuses] = useState<FeaturedBonus[]>([])
  const [claimHistory, setClaimHistory] = useState<Array<{ casino_id: string, claimed_at: string, streak: number | null }>>([])

  const triggerClaimFx = useCallback((casinoId: string) => {
    setClaimFxByCasino((prev) => ({ ...prev, [casinoId]: Date.now() }))

    window.setTimeout(() => {
      setClaimFxByCasino((prev) => {
        if (!prev[casinoId]) return prev
        const next = { ...prev }
        delete next[casinoId]
        return next
      })
    }, 980)
  }, [])

  const triggerStreakFx = useCallback((casinoId: string) => {
    setStreakFxByCasino((prev) => ({ ...prev, [casinoId]: Date.now() }))

    window.setTimeout(() => {
      setStreakFxByCasino((prev) => {
        if (!prev[casinoId]) return prev
        const next = { ...prev }
        delete next[casinoId]
        return next
      })
    }, 1400)
  }, [])

  const getCooldownEndsAt = useCallback((casino: CasinoWithClaim, lastClaimedAt: string | null) => {
    if (!lastClaimedAt) return null
    if (casino.reset_at_midnight) {
      const midnightReset = new Date(lastClaimedAt)
      midnightReset.setHours(24, 0, 0, 0)
      return midnightReset
    }
    return new Date(new Date(lastClaimedAt).getTime() + COOLDOWN_MS)
  }, [COOLDOWN_MS])

  const isOnCooldown = useCallback((casino: CasinoWithClaim) => {
    const endsAt = getCooldownEndsAt(casino, casino.last_claimed_at)
    return !!endsAt && endsAt.getTime() > now
  }, [getCooldownEndsAt, now])

  const formatCountdown = useCallback((casino: CasinoWithClaim) => {
    const endsAt = getCooldownEndsAt(casino, casino.last_claimed_at)
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
  const getMinRedemptionValue = useCallback((casino: CasinoWithClaim) => {
    if (casino.min_redemption !== null && Number.isFinite(casino.min_redemption)) {
      return Number(casino.min_redemption)
    }

    const text = `${casino.bonus_description ?? ''} ${casino.welcome_offer_info ?? ''}`
    const matches = [...text.matchAll(/\$\s*(\d+(?:[.,]\d+)?)/g)]
      .map((m) => Number.parseFloat(m[1].replace(',', '.')))
      .filter((n) => Number.isFinite(n) && n > 0)

    if (matches.length === 0) return Number.POSITIVE_INFINITY
    return Math.min(...matches)
  }, [])

  const withAlpha = useCallback((rgb: string, alpha: number) => {
    const m = rgb.match(/\d+/g)
    if (!m || m.length < 3) return `rgba(73,148,201,${alpha})`
    return `rgba(${m[0]}, ${m[1]}, ${m[2]}, ${alpha})`
  }, [])

  const hexToRgb = useCallback((hex: string | null | undefined) => {
    if (!hex) return null
    const normalized = hex.trim().startsWith('#') ? hex.trim() : `#${hex.trim()}`
    if (!/^#[0-9a-fA-F]{6}$/.test(normalized)) return null
    const r = Number.parseInt(normalized.slice(1, 3), 16)
    const g = Number.parseInt(normalized.slice(3, 5), 16)
    const b = Number.parseInt(normalized.slice(5, 7), 16)
    return `rgb(${r}, ${g}, ${b})`
  }, [])

  const buildLogoGradient = useCallback(async (logoUrl: string): Promise<LogoGradient | null> => {
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.referrerPolicy = 'no-referrer'

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('logo-load-failed'))
        img.src = logoUrl
      })

      const canvas = document.createElement('canvas')
      canvas.width = 28
      canvas.height = 28
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return null

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const buckets = new Map<string, { count: number, r: number, g: number, b: number }>()

      for (let i = 0; i < data.length; i += 16) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const a = data[i + 3]
        if (a < 120) continue
        const key = `${r >> 4}-${g >> 4}-${b >> 4}`
        const current = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 }
        current.count += 1
        current.r += r
        current.g += g
        current.b += b
        buckets.set(key, current)
      }

      const ranked = [...buckets.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, 4)
        .map((p) => ({
          r: Math.round(p.r / p.count),
          g: Math.round(p.g / p.count),
          b: Math.round(p.b / p.count),
        }))

      if (ranked.length === 0) return null
      const first = ranked[0]
      const second = ranked[1] ?? ranked[0]
      return {
        primary: `rgb(${first.r}, ${first.g}, ${first.b})`,
        secondary: `rgb(${second.r}, ${second.g}, ${second.b})`,
      }
    } catch {
      return null
    }
  }, [])

  const getRemainingCooldownMs = useCallback((casino: CasinoWithClaim) => {
    const endsAt = getCooldownEndsAt(casino, casino.last_claimed_at)
    if (!endsAt) return 0
    return Math.max(0, endsAt.getTime() - now)
  }, [getCooldownEndsAt, now])

  const isStreakActive = useCallback((casino: CasinoWithClaim) => {
    if (casino.streak <= 0 || !casino.last_claimed_at) return false
    const elapsedMs = now - new Date(casino.last_claimed_at).getTime()
    return elapsedMs < STREAK_ACTIVE_MS
  }, [now, STREAK_ACTIVE_MS])

  const loadData = useCallback(async (userId: string) => {
    const [{ data: casinoData }, { data: claimsData }, { data: favoritesData }, { data: featuredData }] = await Promise.all([
      supabase.from('casinos').select('*').eq('is_active', true).order('sort_order'),
      supabase
        .from('user_claims')
        .select('casino_id, streak, claimed_at, updated_at')
        .eq('user_id', userId)
        .order('claimed_at', { ascending: false })
        .order('updated_at', { ascending: false }),
      supabase.from('user_favorites').select('casino_id').eq('user_id', userId),
      supabase.from('featured_bonuses').select('*').eq('is_active', true).order('sort_order'),
    ])
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
    merged.sort((a, b) => a.sort_order - b.sort_order)
    setCasinos(merged)
    setFeaturedBonuses(featuredData ?? [])
    setClaimHistory((claimsData ?? []).map((claim) => ({
      casino_id: claim.casino_id,
      claimed_at: claim.claimed_at,
      streak: claim.streak,
    })))
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

  useEffect(() => {
    const logoUrls = [...new Set(casinos.map((c) => c.logo_url).filter((u): u is string => !!u))]
      .filter((url) => !logoGradients[url])
    if (logoUrls.length === 0) return

    let cancelled = false

    Promise.all(logoUrls.map(async (url) => ({
      url,
      gradient: await buildLogoGradient(url),
    }))).then((results) => {
      if (cancelled) return
      setLogoGradients((prev) => {
        const next = { ...prev }
        for (const result of results) {
          next[result.url] = result.gradient ?? { primary: 'rgb(73, 148, 201)', secondary: 'rgb(229, 45, 75)' }
        }
        return next
      })
    })

    return () => {
      cancelled = true
    }
  }, [casinos, logoGradients, buildLogoGradient])

  const toggleClaim = async (casino: CasinoWithClaim) => {
    if (!user) return

    if (isOnCooldown(casino)) {
      if (!casino.last_claimed_at) return

      await supabase
        .from('user_claims')
        .delete()
        .eq('user_id', user.id)
        .eq('casino_id', casino.id)
        .eq('claimed_at', casino.last_claimed_at)

      const { data: previousClaim } = await supabase
        .from('user_claims')
        .select('claimed_at, streak')
        .eq('user_id', user.id)
        .eq('casino_id', casino.id)
        .order('claimed_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      setCasinos((prev) => prev.map((c) => c.id === casino.id
        ? {
          ...c,
          last_claimed_at: previousClaim?.claimed_at ?? null,
          streak: previousClaim?.streak ?? 0,
        }
        : c))
      return
    }

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

    const dayStartNow = new Date(nowDate)
    dayStartNow.setHours(0, 0, 0, 0)
    const dayStartLast = lastClaim?.claimed_at ? new Date(lastClaim.claimed_at) : null
    if (dayStartLast) dayStartLast.setHours(0, 0, 0, 0)
    const dayDiff = dayStartLast
      ? Math.round((dayStartNow.getTime() - dayStartLast.getTime()) / (1000 * 60 * 60 * 24))
      : null

    let newStreak = 1
    if (casino.reset_at_midnight) {
      if (dayDiff === 1) {
        newStreak = (lastClaim?.streak ?? 0) + 1
      }
    } else if (hoursSinceLastClaim !== null && hoursSinceLastClaim >= 24 && hoursSinceLastClaim < 48) {
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
    triggerClaimFx(casino.id)
    triggerStreakFx(casino.id)
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

    setCasinos((prev) => prev.map((c) => c.id === casino.id ? { ...c, is_favorite: !c.is_favorite } : c))
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
    if (filter === 'favorites') return matchesSearch && c.is_favorite
    return matchesSearch
  })

  const sortedFiltered = [...filtered].sort((a, b) => {
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
      case 'lowest-min-redemption': {
        const diff = getMinRedemptionValue(a) - getMinRedemptionValue(b)
        if (diff !== 0) return diff
        return a.name.localeCompare(b.name)
      }
      case 'longest-streak': {
        const diff = b.streak - a.streak
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

  const claimedCount = filtered.filter((c) => isOnCooldown(c)).length
  const totalCount = filtered.length
  const progress = totalCount > 0 ? (claimedCount / totalCount) * 100 : 0
  const activeStreaks = filtered.filter((casino) => isStreakActive(casino)).length
  const favoriteCount = filtered.filter((casino) => casino.is_favorite).length
  const topFeaturedBonuses = featuredBonuses.slice(0, 3)

  const stats = useMemo(() => {
    const byCasinoId = new Map(casinos.map((casino) => [casino.id, casino]))
    const totalClaims = claimHistory.length
    const uniqueClaimedCount = new Set(claimHistory.map((claim) => claim.casino_id)).size
    const totalScAccumulated = claimHistory.reduce((sum, claim) => sum + Number(byCasinoId.get(claim.casino_id)?.sc_amount ?? 0), 0)
    const totalGcAccumulated = claimHistory.reduce((sum, claim) => sum + Number(byCasinoId.get(claim.casino_id)?.gc_amount ?? 0), 0)

    const claimsByCasino = new Map<string, number>()
    for (const claim of claimHistory) {
      claimsByCasino.set(claim.casino_id, (claimsByCasino.get(claim.casino_id) ?? 0) + 1)
    }

    const topClaimedBonuses = [...claimsByCasino.entries()]
      .map(([casinoId, count]) => ({
        casinoId,
        count,
        name: byCasinoId.get(casinoId)?.name ?? 'Unknown Casino',
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 5)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const claimsPerDay = new Map<string, number>()

    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      claimsPerDay.set(key, 0)
    }

    for (const claim of claimHistory) {
      const key = claim.claimed_at.slice(0, 10)
      if (claimsPerDay.has(key)) {
        claimsPerDay.set(key, (claimsPerDay.get(key) ?? 0) + 1)
      }
    }

    const recentActivity = [...claimsPerDay.entries()].map(([date, count]) => ({ date, count }))
    const maxDailyClaims = Math.max(1, ...recentActivity.map((item) => item.count))
    const longestStreakAchieved = claimHistory.reduce((max, claim) => Math.max(max, claim.streak ?? 0), 0)
    const claimsLast7Days = recentActivity.slice(-7).reduce((sum, item) => sum + item.count, 0)

    return {
      totalClaims,
      uniqueClaimedCount,
      totalScAccumulated,
      totalGcAccumulated,
      topClaimedBonuses,
      recentActivity,
      maxDailyClaims,
      longestStreakAchieved,
      claimsLast7Days,
    }
  }, [casinos, claimHistory])

  if (loading) {
    return (
      <div className="min-h-screen casino-app-bg flex items-center justify-center relative overflow-hidden">
        <div className="casino-texture" />
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🎰</div>
          <p style={{ color: '#2C343F', fontWeight: 700 }}>Loading your bonuses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen casino-app-bg relative overflow-hidden">
      <div className="casino-texture" />
      <header className="casino-header relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/UG-logo.png"
              alt="UG logo"
              className="w-9 h-9 object-contain flex-shrink-0"
            />
            <div>
              <h1 className="font-black text-lg leading-none" style={{ color: '#FFE799', textShadow: '0 0 10px rgba(255, 231, 153, 0.3)' }}>United Gamblers Daily Bonus Tracker</h1>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm hidden md:block" style={{ color: 'rgba(255,255,255,0.5)' }}>{user?.email}</span>
            <button onClick={handleSignOut} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer hover:-translate-y-px"
              style={{ background: 'rgba(229,45,75,0.2)', color: '#E52D4B', border: '1px solid rgba(229,45,75,0.3)' }}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        <div className="mb-5 flex items-center gap-2">
          <button
            onClick={() => setDashboardView('tracker')}
            className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
            style={{
              background: dashboardView === 'tracker' ? '#E52D4B' : 'rgba(44,52,63,0.88)',
              color: dashboardView === 'tracker' ? '#fff' : 'rgba(255,255,255,0.7)',
              border: `1px solid ${dashboardView === 'tracker' ? '#E52D4B' : 'rgba(255,255,255,0.12)'}`,
            }}
          >
            Tracker
          </button>
          <button
            onClick={() => setDashboardView('stats')}
            className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
            style={{
              background: dashboardView === 'stats' ? '#4994C9' : 'rgba(44,52,63,0.88)',
              color: dashboardView === 'stats' ? '#fff' : 'rgba(255,255,255,0.7)',
              border: `1px solid ${dashboardView === 'stats' ? '#4994C9' : 'rgba(255,255,255,0.12)'}`,
            }}
          >
            My Stats
          </button>
        </div>

        {dashboardView === 'stats' ? (
          <div className="space-y-5">
            <div className="casino-progress rounded-2xl p-5">
              <h2 className="text-xl font-black mb-4" style={{ color: '#f4f7ff' }}>Usage Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)' }}>
                  <p className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>Bonuses claimed</p>
                  <p className="text-2xl font-black" style={{ color: '#ffffff' }}>{stats.totalClaims}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)' }}>
                  <p className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>Unique bonuses</p>
                  <p className="text-2xl font-black" style={{ color: '#d8f0ff' }}>{stats.uniqueClaimedCount}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(229,45,75,0.14)', border: '1px solid rgba(229,45,75,0.34)' }}>
                  <p className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>SC accumulated</p>
                  <p className="text-2xl font-black" style={{ color: '#ffd6e0' }}>{stats.totalScAccumulated.toLocaleString()}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(73,148,201,0.2)', border: '1px solid rgba(73,148,201,0.34)' }}>
                  <p className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>GC accumulated</p>
                  <p className="text-2xl font-black" style={{ color: '#cfeeff' }}>{stats.totalGcAccumulated.toLocaleString()}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,231,153,0.14)', border: '1px solid rgba(255,231,153,0.34)' }}>
                  <p className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>Longest streak</p>
                  <p className="text-2xl font-black" style={{ color: '#FFE799' }}>🔥 {stats.longestStreakAchieved}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)' }}>
                  <p className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>Claims last 7d</p>
                  <p className="text-2xl font-black" style={{ color: '#ffffff' }}>{stats.claimsLast7Days}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="casino-panel rounded-2xl p-5">
                <h3 className="text-lg font-black mb-4" style={{ color: '#f4f7ff' }}>Most Claimed Bonuses</h3>
                {stats.topClaimedBonuses.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.55)' }}>No claims yet.</p>
                ) : (
                  <div className="space-y-2">
                    {stats.topClaimedBonuses.map((item, index) => (
                      <div key={item.casinoId} className="rounded-xl p-3 flex items-center justify-between"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}>
                        <p className="text-sm font-semibold truncate" style={{ color: '#f4f7ff' }}>{index + 1}. {item.name}</p>
                        <p className="text-xs font-bold" style={{ color: '#FFE799' }}>{item.count} claims</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="casino-panel rounded-2xl p-5">
                <h3 className="text-lg font-black mb-4" style={{ color: '#f4f7ff' }}>Activity (last 14 days)</h3>
                <div className="h-44 flex items-end gap-1.5">
                  {stats.recentActivity.map((item) => {
                    const barHeight = Math.max(8, Math.round((item.count / stats.maxDailyClaims) * 100))
                    return (
                      <div key={item.date} className="flex-1 flex flex-col items-center justify-end gap-1">
                        <div
                          className="w-full rounded-t-md"
                          style={{
                            height: `${barHeight}%`,
                            background: 'linear-gradient(180deg, rgba(255,231,153,0.95), rgba(229,45,75,0.9))',
                            boxShadow: '0 0 10px rgba(229,45,75,0.35)',
                          }}
                          title={`${item.date}: ${item.count} claims`}
                        />
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.date.slice(5)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
        <>
        <div className="casino-progress rounded-2xl p-6 mb-8">
          {topFeaturedBonuses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
              {topFeaturedBonuses.map((featured) => (
                <div
                  key={featured.id}
                  className="featured-bonus-card rounded-xl px-4 py-3 flex flex-col"
                  style={{
                    backgroundImage: featured.background_image_url
                      ? `linear-gradient(128deg, rgba(21,31,46,0.76), rgba(48,40,60,0.7)), url(${featured.background_image_url})`
                      : 'linear-gradient(128deg, rgba(73,148,201,0.26), rgba(229,45,75,0.3))',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1px solid rgba(255,255,255,0.24)',
                  }}
                >
                  <div>
                    <p className="text-[1.85rem] font-black leading-tight truncate" style={{ color: '#f4f7ff' }}>{featured.title}</p>
                    {featured.subtitle && (
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] mt-0.5" style={{ color: 'rgba(255,231,153,0.9)' }}>
                        {featured.subtitle}
                      </p>
                    )}
                  </div>
                  <p
                    className="text-sm mt-auto pt-2"
                    style={{
                      color: 'rgba(255,255,255,0.78)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {featured.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
              <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <p className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.72)' }}>Claimed Bonuses</p>
                <p className="text-2xl font-black" style={{ color: '#ffffff' }}>{claimedCount}</p>
              </div>
              <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(229,45,75,0.15)', border: '1px solid rgba(229,45,75,0.3)' }}>
                <p className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.72)' }}>Active Streaks</p>
                <p className="text-2xl font-black" style={{ color: '#ffdbe4' }}>{activeStreaks}</p>
              </div>
              <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(73,148,201,0.2)', border: '1px solid rgba(73,148,201,0.34)' }}>
                <p className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.72)' }}>Favorite Brands</p>
                <p className="text-2xl font-black" style={{ color: '#d8f0ff' }}>{favoriteCount}</p>
              </div>
            </div>
          )}

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
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #E52D4B 0%, #ff6f98 40%, #FFE799 100%)', boxShadow: '0 0 14px rgba(229,45,75,0.56)' }} />
          </div>

        </div>

        <div className="casino-panel p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
          <input type="text" placeholder="Search casinos..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl outline-none text-sm casino-control" />
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'highest-sc' | 'highest-gc' | 'lowest-min-redemption' | 'longest-streak' | 'a-z' | 'z-a' | 'next-available')}
              className="w-full px-4 py-3 pr-11 rounded-xl outline-none text-sm casino-control"
              style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}>
              <option value="highest-sc">Sort: Highest SC</option>
              <option value="highest-gc">Sort: Highest GC</option>
              <option value="lowest-min-redemption">Sort: Lowest min redemption</option>
              <option value="longest-streak">Sort: Longest streak</option>
              <option value="a-z">Sort: A-Z</option>
              <option value="z-a">Sort: Z-A</option>
              <option value="next-available">Sort: Next available bonus</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 5.25 7 9l4-3.75" stroke="rgba(255,255,255,0.78)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 w-full md:flex md:w-auto">
            {(['all', 'favorites', 'unclaimed', 'claimed'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className="w-full md:w-auto px-4 py-3 rounded-xl text-sm font-semibold capitalize transition-all cursor-pointer"
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedFiltered.map((casino) => {
            const claimed = isOnCooldown(casino)
            const isClaimAnimating = !!claimFxByCasino[casino.id]
            const isStreakAnimating = !!streakFxByCasino[casino.id]
            const countdown = formatCountdown(casino)
            const manualPrimary = hexToRgb(casino.logo_primary_color)
            const manualSecondary = hexToRgb(casino.logo_secondary_color)
            const manualGradient = manualPrimary && manualSecondary
              ? { primary: manualPrimary, secondary: manualSecondary }
              : null
            const autoGradient = (casino.logo_url && logoGradients[casino.logo_url])
              ? logoGradients[casino.logo_url]
              : null
            const logoGradient = manualGradient ?? autoGradient ?? { primary: 'rgb(73, 148, 201)', secondary: 'rgb(229, 45, 75)' }
            const cardBackground = claimed
              ? `linear-gradient(135deg, ${withAlpha(logoGradient.primary, 0.22)}, ${withAlpha(logoGradient.secondary, 0.28)}), linear-gradient(140deg, rgba(67, 42, 58, 0.95), rgba(49, 41, 63, 0.95))`
              : `linear-gradient(135deg, ${withAlpha(logoGradient.primary, 0.27)}, ${withAlpha(logoGradient.secondary, 0.23)}), linear-gradient(140deg, rgba(45, 61, 83, 0.96), rgba(35, 51, 73, 0.96))`

            return (
            <div
              key={casino.id}
              className="casino-card p-4 relative overflow-hidden"
              style={{
                background: cardBackground,
                borderColor: claimed ? withAlpha(logoGradient.secondary, 0.5) : withAlpha(logoGradient.primary, 0.44),
              }}>
              {isClaimAnimating && (
                <div className="claim-burst-overlay" key={`claim-fx-${claimFxByCasino[casino.id]}`}>
                  <div className="claim-burst-wash" />
                  <div className="claim-burst-ring" />
                  <div className="claim-burst-check" aria-hidden="true">
                    🔥 {casino.streak} day streak
                  </div>
                </div>
              )}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  {casino.logo_url ? (
                    <img
                      src={casino.logo_url}
                      alt={`${casino.name} logo`}
                      className="w-7 h-7 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-7 h-7 rounded flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.1)' }}
                    />
                  )}
                  <div className="flex items-center gap-2 min-w-0">
                    {casino.casino_url ? (
                      <a
                        href={casino.casino_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-[1.05rem] truncate"
                        style={{ color: claimed ? '#FFE799' : '#f0f0f0' }}
                      >
                        {casino.name}
                      </a>
                    ) : (
                      <h3 className="font-bold text-[1.05rem] truncate" style={{ color: claimed ? '#FFE799' : '#f0f0f0' }}>
                        {casino.name}
                      </h3>
                    )}
                    <div className="relative flex items-center gap-2">
                      <span
                        onClick={() => toggleFavorite(casino)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            void toggleFavorite(casino)
                          }
                        }}
                        className="flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 flex-shrink-0 p-0"
                        aria-label={casino.is_favorite ? `Remove ${casino.name} from favorites` : `Add ${casino.name} to favorites`}
                        role="button"
                        tabIndex={0}
                        title={casino.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          borderRadius: 0,
                          boxShadow: 'none',
                          outline: 'none',
                          width: 'auto',
                          height: 'auto',
                        }}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M10 17.25 8.84 16.2C4.7 12.45 2 9.99 2 6.98 2 4.52 3.93 2.75 6.4 2.75c1.39 0 2.73.64 3.6 1.64.87-1 2.21-1.64 3.6-1.64C16.07 2.75 18 4.52 18 6.98c0 3.01-2.7 5.47-6.84 9.22L10 17.25Z"
                            fill={casino.is_favorite ? '#E52D4B' : 'transparent'}
                            stroke={casino.is_favorite ? '#E52D4B' : 'rgba(255,255,255,0.42)'}
                            strokeWidth="1.7"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      {isStreakActive(casino) && (
                        <span className={`streak-mini-badge ${isStreakAnimating ? 'streak-mini-badge-pop' : ''}`}>
                          🔥 {casino.streak}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  <button onClick={() => toggleClaim(casino)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
                    style={{
                      background: claimed ? '#E52D4B' : 'rgba(255,255,255,0.08)',
                      border: `2px solid ${claimed ? '#E52D4B' : 'rgba(255,255,255,0.2)'}`,
                      boxShadow: claimed ? '0 0 10px rgba(229,45,75,0.5)' : 'none',
                      cursor: 'pointer',
                      opacity: 1,
                    }}>
                    {claimed && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7l3.5 3.5L12 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.62)' }}>{casino.bonus_description}</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {countdown && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
                    style={{ background: 'rgba(229,45,75,0.2)', border: '1px solid rgba(229,45,75,0.3)', color: '#ff9bad' }}>
                    ⏳ Available in {countdown}
                  </div>
                )}
              </div>
              {casino.welcome_offer_info && (
                <div>
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
        </>
        )}
      </div>
    </div>
  )
}
