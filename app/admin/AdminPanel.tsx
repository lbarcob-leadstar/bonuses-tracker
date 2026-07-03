'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Casino, FeaturedBonus } from '@/types'

export default function AdminPanel() {
  const supabase = createClient()
  const [casinos, setCasinos] = useState<Casino[]>([])
  const [featuredBonuses, setFeaturedBonuses] = useState<FeaturedBonus[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingFeaturedId, setEditingFeaturedId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    bonus_description: '',
    welcome_offer_info: '',
    logo_url: '',
    casino_url: '',
    logo_primary_color: '',
    logo_secondary_color: '',
    min_redemption: '',
    reset_at_midnight: false,
    sc_amount: '',
    gc_amount: '',
  })
  const [newForm, setNewForm] = useState({
    name: '',
    bonus_description: '',
    welcome_offer_info: '',
    logo_url: '',
    casino_url: '',
    logo_primary_color: '',
    logo_secondary_color: '',
    min_redemption: '',
    reset_at_midnight: false,
    sc_amount: '',
    gc_amount: '',
  })
  const [showAdd, setShowAdd] = useState(false)
  const [showAddFeatured, setShowAddFeatured] = useState(false)
  const [editFeaturedForm, setEditFeaturedForm] = useState({
    title: '',
    description: '',
    background_image_url: '',
    is_active: true,
  })
  const [newFeaturedForm, setNewFeaturedForm] = useState({
    title: '',
    description: '',
    background_image_url: '',
    is_active: true,
  })

  const parseNullableNumber = (value: string, label: string) => {
    const trimmed = value.trim()
    if (!trimmed) return { ok: true as const, value: null as number | null }
    const parsed = Number.parseFloat(trimmed.replace(',', '.'))
    if (!Number.isFinite(parsed)) {
      alert(`${label} must be a valid number`)
      return { ok: false as const, value: null as number | null }
    }
    return { ok: true as const, value: parsed }
  }

  const parseNullableHexColor = (value: string, label: string) => {
    const trimmed = value.trim()
    if (!trimmed) return { ok: true as const, value: null as string | null }
    const normalized = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
    if (!/^#[0-9a-fA-F]{6}$/.test(normalized)) {
      alert(`${label} must be a valid 6-digit hex color (e.g. #E52D4B)`)
      return { ok: false as const, value: null as string | null }
    }
    return { ok: true as const, value: normalized.toUpperCase() }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { window.location.href = '/'; return }
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single()
      if (!profile?.is_admin) { window.location.href = '/app'; return }
      loadAdminData()
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadAdminData = async () => {
    const [{ data: casinoData }, { data: featuredData }] = await Promise.all([
      supabase.from('casinos').select('*').order('sort_order'),
      supabase.from('featured_bonuses').select('*').order('sort_order'),
    ])
    setCasinos(casinoData ?? [])
    setFeaturedBonuses(featuredData ?? [])
    setLoading(false)
  }

  const toggleActive = async (casino: Casino) => {
    await supabase.from('casinos').update({ is_active: !casino.is_active }).eq('id', casino.id)
    setCasinos((prev) => prev.map((c) => c.id === casino.id ? { ...c, is_active: !c.is_active } : c))
  }

  const startEdit = (casino: Casino) => {
    setEditingId(casino.id)
    setEditForm({
      name: casino.name,
      bonus_description: casino.bonus_description,
      welcome_offer_info: casino.welcome_offer_info ?? '',
      logo_url: casino.logo_url ?? '',
      casino_url: casino.casino_url ?? '',
      logo_primary_color: casino.logo_primary_color ?? '',
      logo_secondary_color: casino.logo_secondary_color ?? '',
      min_redemption: casino.min_redemption?.toString() ?? '',
      reset_at_midnight: casino.reset_at_midnight,
      sc_amount: casino.sc_amount?.toString() ?? '',
      gc_amount: casino.gc_amount?.toString() ?? '',
    })
  }

  const saveEdit = async (id: string) => {
    const scAmount = parseNullableNumber(editForm.sc_amount, 'SC amount')
    if (!scAmount.ok) return
    const gcAmount = parseNullableNumber(editForm.gc_amount, 'GC amount')
    if (!gcAmount.ok) return
    const primaryColor = parseNullableHexColor(editForm.logo_primary_color, 'Primary logo color')
    if (!primaryColor.ok) return
    const secondaryColor = parseNullableHexColor(editForm.logo_secondary_color, 'Secondary logo color')
    if (!secondaryColor.ok) return
    const minRedemption = parseNullableNumber(editForm.min_redemption, 'Min redemption')
    if (!minRedemption.ok) return

    const payload = {
      name: editForm.name,
      bonus_description: editForm.bonus_description,
      welcome_offer_info: editForm.welcome_offer_info.trim() ? editForm.welcome_offer_info : null,
      logo_url: editForm.logo_url.trim() ? editForm.logo_url : null,
      casino_url: editForm.casino_url.trim() ? editForm.casino_url : null,
      logo_primary_color: primaryColor.value,
      logo_secondary_color: secondaryColor.value,
      min_redemption: minRedemption.value,
      reset_at_midnight: editForm.reset_at_midnight,
      sc_amount: scAmount.value,
      gc_amount: gcAmount.value,
    }
    await supabase.from('casinos').update(payload).eq('id', id)
    setCasinos((prev) => prev.map((c) => c.id === id ? { ...c, ...payload } : c))
    setEditingId(null)
  }

  const deleteCasino = async (id: string) => {
    if (!confirm('Delete this casino?')) return
    await supabase.from('casinos').delete().eq('id', id)
    setCasinos((prev) => prev.filter((c) => c.id !== id))
  }

  const addCasino = async () => {
    if (!newForm.name || !newForm.bonus_description) return
    const scAmount = parseNullableNumber(newForm.sc_amount, 'SC amount')
    if (!scAmount.ok) return
    const gcAmount = parseNullableNumber(newForm.gc_amount, 'GC amount')
    if (!gcAmount.ok) return
    const primaryColor = parseNullableHexColor(newForm.logo_primary_color, 'Primary logo color')
    if (!primaryColor.ok) return
    const secondaryColor = parseNullableHexColor(newForm.logo_secondary_color, 'Secondary logo color')
    if (!secondaryColor.ok) return
    const minRedemption = parseNullableNumber(newForm.min_redemption, 'Min redemption')
    if (!minRedemption.ok) return

    const maxOrder = Math.max(...casinos.map((c) => c.sort_order), 0)
    const payload = {
      name: newForm.name,
      bonus_description: newForm.bonus_description,
      welcome_offer_info: newForm.welcome_offer_info.trim() ? newForm.welcome_offer_info : null,
      logo_url: newForm.logo_url.trim() ? newForm.logo_url : null,
      casino_url: newForm.casino_url.trim() ? newForm.casino_url : null,
      logo_primary_color: primaryColor.value,
      logo_secondary_color: secondaryColor.value,
      min_redemption: minRedemption.value,
      reset_at_midnight: newForm.reset_at_midnight,
      sc_amount: scAmount.value,
      gc_amount: gcAmount.value,
      is_active: true,
      sort_order: maxOrder + 1,
    }
    const { data } = await supabase
      .from('casinos')
      .insert(payload)
      .select()
      .single()
    if (data) setCasinos((prev) => [...prev, data])
    setNewForm({
      name: '',
      bonus_description: '',
      welcome_offer_info: '',
      logo_url: '',
      casino_url: '',
      logo_primary_color: '',
      logo_secondary_color: '',
      min_redemption: '',
      reset_at_midnight: false,
      sc_amount: '',
      gc_amount: '',
    })
    setShowAdd(false)
  }

  const toggleFeaturedActive = async (featured: FeaturedBonus) => {
    await supabase.from('featured_bonuses').update({ is_active: !featured.is_active }).eq('id', featured.id)
    setFeaturedBonuses((prev) => prev.map((f) => f.id === featured.id ? { ...f, is_active: !f.is_active } : f))
  }

  const startEditFeatured = (featured: FeaturedBonus) => {
    setEditingFeaturedId(featured.id)
    setEditFeaturedForm({
      title: featured.title,
      description: featured.description,
      background_image_url: featured.background_image_url ?? '',
      is_active: featured.is_active,
    })
  }

  const saveEditFeatured = async (id: string) => {
    if (!editFeaturedForm.title.trim() || !editFeaturedForm.description.trim()) return
    const payload = {
      title: editFeaturedForm.title.trim(),
      description: editFeaturedForm.description.trim(),
      background_image_url: editFeaturedForm.background_image_url.trim() ? editFeaturedForm.background_image_url.trim() : null,
      is_active: editFeaturedForm.is_active,
    }
    await supabase.from('featured_bonuses').update(payload).eq('id', id)
    setFeaturedBonuses((prev) => prev.map((f) => f.id === id ? { ...f, ...payload } : f))
    setEditingFeaturedId(null)
  }

  const deleteFeatured = async (id: string) => {
    if (!confirm('Delete this featured bonus card?')) return
    await supabase.from('featured_bonuses').delete().eq('id', id)
    setFeaturedBonuses((prev) => prev.filter((f) => f.id !== id))
  }

  const addFeatured = async () => {
    if (!newFeaturedForm.title.trim() || !newFeaturedForm.description.trim()) return
    const maxOrder = Math.max(...featuredBonuses.map((f) => f.sort_order), 0)
    const payload = {
      title: newFeaturedForm.title.trim(),
      description: newFeaturedForm.description.trim(),
      background_image_url: newFeaturedForm.background_image_url.trim() ? newFeaturedForm.background_image_url.trim() : null,
      is_active: newFeaturedForm.is_active,
      sort_order: maxOrder + 1,
    }
    const { data } = await supabase.from('featured_bonuses').insert(payload).select().single()
    if (data) setFeaturedBonuses((prev) => [...prev, data])
    setNewFeaturedForm({
      title: '',
      description: '',
      background_image_url: '',
      is_active: true,
    })
    setShowAddFeatured(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1e252e' }}>
        <div className="text-4xl animate-spin">🎰</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#1e252e' }}>
      <header style={{ background: '#2C343F', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            <div>
              <h1 className="font-black text-lg" style={{ color: '#FFE799' }}>Admin Panel</h1>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{casinos.length} casinos · {featuredBonuses.length} featured cards</p>
            </div>
          </div>
          <div className="flex gap-3">
            <a href="/app"
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
              ← Back to App
            </a>
            <button onClick={() => setShowAdd(true)}
              className="px-4 py-2 rounded-xl text-sm font-bold cursor-pointer"
              style={{ background: '#E52D4B', color: '#fff', boxShadow: '0 0 15px rgba(229,45,75,0.4)' }}>
              + Add Casino
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="rounded-2xl p-6 mb-6"
          style={{ background: '#2C343F', border: '1px solid rgba(73,148,201,0.35)', boxShadow: '0 0 20px rgba(73,148,201,0.12)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold" style={{ color: '#d8f0ff' }}>Featured Bonuses</h2>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Cards shown at the top of the tracker (name + short description + optional background image)
              </p>
            </div>
            <button onClick={() => setShowAddFeatured(true)}
              className="px-4 py-2 rounded-xl text-sm font-bold cursor-pointer"
              style={{ background: '#4994C9', color: '#fff', boxShadow: '0 0 12px rgba(73,148,201,0.35)' }}>
              + Add Featured Card
            </button>
          </div>

          {showAddFeatured && (
            <div className="rounded-xl p-4 mb-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(73,148,201,0.35)' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <input placeholder="Operator name (e.g. Ace.com)" value={newFeaturedForm.title}
                  onChange={(e) => setNewFeaturedForm((p) => ({ ...p, title: e.target.value }))}
                  className="px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.35)', color: '#f0f0f0' }} />
                <input placeholder="Background image URL (optional)" value={newFeaturedForm.background_image_url}
                  onChange={(e) => setNewFeaturedForm((p) => ({ ...p, background_image_url: e.target.value }))}
                  className="px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.35)', color: '#f0f0f0' }} />
              </div>
              <textarea placeholder="Main description" value={newFeaturedForm.description}
                onChange={(e) => setNewFeaturedForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full mb-3 px-3 py-2 rounded-xl text-sm outline-none resize-y min-h-[72px]"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.35)', color: '#f0f0f0' }} />
              <label className="mb-3 flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.78)' }}>
                <input
                  type="checkbox"
                  checked={newFeaturedForm.is_active}
                  onChange={(e) => setNewFeaturedForm((p) => ({ ...p, is_active: e.target.checked }))}
                />
                Visible in app
              </label>
              <div className="flex gap-2">
                <button onClick={addFeatured} className="px-4 py-2 rounded-xl text-sm font-bold cursor-pointer"
                  style={{ background: '#4994C9', color: '#fff' }}>Save card</button>
                <button onClick={() => setShowAddFeatured(false)} className="px-4 py-2 rounded-xl text-sm cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {featuredBonuses.map((featured) => (
              <div key={featured.id} className="rounded-xl p-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${featured.is_active ? 'rgba(73,148,201,0.3)' : 'rgba(229,45,75,0.25)'}`, opacity: featured.is_active ? 1 : 0.6 }}>
                {editingFeaturedId === featured.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input value={editFeaturedForm.title} onChange={(e) => setEditFeaturedForm((p) => ({ ...p, title: e.target.value }))}
                        placeholder="Operator name"
                        className="px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.4)', color: '#f0f0f0' }} />
                      <input value={editFeaturedForm.background_image_url} onChange={(e) => setEditFeaturedForm((p) => ({ ...p, background_image_url: e.target.value }))}
                        placeholder="Background image URL"
                        className="px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.4)', color: '#f0f0f0' }} />
                    </div>
                    <textarea value={editFeaturedForm.description} onChange={(e) => setEditFeaturedForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Main description"
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-y min-h-[72px]"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.4)', color: '#f0f0f0' }} />
                    <label className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.78)' }}>
                      <input
                        type="checkbox"
                        checked={editFeaturedForm.is_active}
                        onChange={(e) => setEditFeaturedForm((p) => ({ ...p, is_active: e.target.checked }))}
                      />
                      Visible in app
                    </label>
                    <div className="flex gap-2">
                      <button onClick={() => saveEditFeatured(featured.id)} className="px-4 py-2 rounded-xl text-sm font-bold cursor-pointer"
                        style={{ background: '#4994C9', color: '#fff' }}>Save</button>
                      <button onClick={() => setEditingFeaturedId(null)} className="px-4 py-2 rounded-xl text-sm cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-28 h-16 rounded-lg flex-shrink-0 overflow-hidden"
                      style={{
                        backgroundImage: featured.background_image_url
                          ? `linear-gradient(130deg, rgba(28,36,49,0.66), rgba(28,36,49,0.55)), url(${featured.background_image_url})`
                          : 'linear-gradient(130deg, rgba(73,148,201,0.35), rgba(229,45,75,0.35))',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: '1px solid rgba(255,255,255,0.15)',
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm" style={{ color: '#f0f0f0' }}>{featured.title}</span>
                        {!featured.is_active && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(229,45,75,0.2)', color: '#E52D4B' }}>hidden</span>
                        )}
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.58)' }}>{featured.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => toggleFeaturedActive(featured)} className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                        style={{ background: featured.is_active ? 'rgba(255,255,255,0.05)' : 'rgba(229,45,75,0.2)', color: featured.is_active ? 'rgba(255,255,255,0.4)' : '#E52D4B', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {featured.is_active ? 'Hide' : 'Show'}
                      </button>
                      <button onClick={() => startEditFeatured(featured)} className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                        style={{ background: 'rgba(255,231,153,0.1)', color: '#FFE799', border: '1px solid rgba(255,231,153,0.2)' }}>Edit</button>
                      <button onClick={() => deleteFeatured(featured.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                        style={{ background: 'rgba(229,45,75,0.1)', color: '#E52D4B', border: '1px solid rgba(229,45,75,0.2)' }}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {featuredBonuses.length === 0 && (
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>No featured cards yet. Add one to customize the top cards in the app.</p>
            )}
          </div>
        </div>

        {showAdd && (
          <div className="rounded-2xl p-6 mb-6"
            style={{ background: '#2C343F', border: '1px solid rgba(229,45,75,0.4)', boxShadow: '0 0 20px rgba(229,45,75,0.15)' }}>
            <h2 className="font-bold mb-4" style={{ color: '#FFE799' }}>New Casino</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input placeholder="Casino name" value={newForm.name}
                onChange={(e) => setNewForm((p) => ({ ...p, name: e.target.value }))}
                className="px-4 py-3 rounded-xl outline-none text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f0' }} />
              <input placeholder="Bonus description" value={newForm.bonus_description}
                onChange={(e) => setNewForm((p) => ({ ...p, bonus_description: e.target.value }))}
                className="px-4 py-3 rounded-xl outline-none text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f0' }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input placeholder="Logo URL (https://...)" value={newForm.logo_url}
                onChange={(e) => setNewForm((p) => ({ ...p, logo_url: e.target.value }))}
                className="px-4 py-3 rounded-xl outline-none text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f0' }} />
              <input placeholder="Casino URL (https://...)" value={newForm.casino_url}
                onChange={(e) => setNewForm((p) => ({ ...p, casino_url: e.target.value }))}
                className="px-4 py-3 rounded-xl outline-none text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f0' }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input placeholder="Primary logo color (#E52D4B)" value={newForm.logo_primary_color}
                onChange={(e) => setNewForm((p) => ({ ...p, logo_primary_color: e.target.value }))}
                className="px-4 py-3 rounded-xl outline-none text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f0' }} />
              <input placeholder="Secondary logo color (#4994C9)" value={newForm.logo_secondary_color}
                onChange={(e) => setNewForm((p) => ({ ...p, logo_secondary_color: e.target.value }))}
                className="px-4 py-3 rounded-xl outline-none text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f0' }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input placeholder="Min redemption (e.g. 50)" value={newForm.min_redemption}
                onChange={(e) => setNewForm((p) => ({ ...p, min_redemption: e.target.value }))}
                className="px-4 py-3 rounded-xl outline-none text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f0' }} />
              <input placeholder="SC amount (e.g. 0.5)" value={newForm.sc_amount}
                onChange={(e) => setNewForm((p) => ({ ...p, sc_amount: e.target.value }))}
                className="px-4 py-3 rounded-xl outline-none text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f0' }} />
              <input placeholder="GC amount (e.g. 10000)" value={newForm.gc_amount}
                onChange={(e) => setNewForm((p) => ({ ...p, gc_amount: e.target.value }))}
                className="px-4 py-3 rounded-xl outline-none text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f0' }} />
            </div>
            <label className="mb-4 flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.78)' }}>
              <input
                type="checkbox"
                checked={newForm.reset_at_midnight}
                onChange={(e) => setNewForm((p) => ({ ...p, reset_at_midnight: e.target.checked }))}
              />
              Set timer reset to midnight (instead of 24h cooldown)
            </label>
            <textarea placeholder="Welcome offer info (expanded details shown in app)" value={newForm.welcome_offer_info}
              onChange={(e) => setNewForm((p) => ({ ...p, welcome_offer_info: e.target.value }))}
              className="w-full mb-4 px-4 py-3 rounded-xl outline-none text-sm resize-y min-h-[96px]"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f0' }} />
            <div className="flex gap-3">
              <button onClick={addCasino} className="px-6 py-2 rounded-xl text-sm font-bold cursor-pointer"
                style={{ background: '#E52D4B', color: '#fff' }}>Save</button>
              <button onClick={() => setShowAdd(false)} className="px-6 py-2 rounded-xl text-sm cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}>Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {casinos.map((casino) => (
            <div key={casino.id} className="rounded-2xl p-4 transition-all"
              style={{ background: '#2C343F', border: `1px solid ${casino.is_active ? 'rgba(255,255,255,0.08)' : 'rgba(229,45,75,0.2)'}`, opacity: casino.is_active ? 1 : 0.5 }}>
              {editingId === casino.id ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col md:flex-row gap-3">
                    <input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                      className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,231,153,0.4)', color: '#f0f0f0' }} />
                    <input value={editForm.bonus_description} onChange={(e) => setEditForm((p) => ({ ...p, bonus_description: e.target.value }))}
                      className="flex-[2] px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,231,153,0.4)', color: '#f0f0f0' }} />
                  </div>
                  <div className="flex flex-col md:flex-row gap-3">
                    <input value={editForm.logo_url} onChange={(e) => setEditForm((p) => ({ ...p, logo_url: e.target.value }))}
                      placeholder="Logo URL (https://...)"
                      className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,231,153,0.4)', color: '#f0f0f0' }} />
                    <input value={editForm.casino_url} onChange={(e) => setEditForm((p) => ({ ...p, casino_url: e.target.value }))}
                      placeholder="Casino URL (https://...)"
                      className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,231,153,0.4)', color: '#f0f0f0' }} />
                  </div>
                  <div className="flex flex-col md:flex-row gap-3">
                    <input value={editForm.logo_primary_color} onChange={(e) => setEditForm((p) => ({ ...p, logo_primary_color: e.target.value }))}
                      placeholder="Primary logo color (#E52D4B)"
                      className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,231,153,0.4)', color: '#f0f0f0' }} />
                    <input value={editForm.logo_secondary_color} onChange={(e) => setEditForm((p) => ({ ...p, logo_secondary_color: e.target.value }))}
                      placeholder="Secondary logo color (#4994C9)"
                      className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,231,153,0.4)', color: '#f0f0f0' }} />
                  </div>
                  <div className="flex flex-col md:flex-row gap-3">
                    <input value={editForm.min_redemption} onChange={(e) => setEditForm((p) => ({ ...p, min_redemption: e.target.value }))}
                      placeholder="Min redemption (e.g. 50)"
                      className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,231,153,0.4)', color: '#f0f0f0' }} />
                    <input value={editForm.sc_amount} onChange={(e) => setEditForm((p) => ({ ...p, sc_amount: e.target.value }))}
                      placeholder="SC amount (e.g. 0.5)"
                      className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,231,153,0.4)', color: '#f0f0f0' }} />
                    <input value={editForm.gc_amount} onChange={(e) => setEditForm((p) => ({ ...p, gc_amount: e.target.value }))}
                      placeholder="GC amount (e.g. 10000)"
                      className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,231,153,0.4)', color: '#f0f0f0' }} />
                  </div>
                  <label className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.78)' }}>
                    <input
                      type="checkbox"
                      checked={editForm.reset_at_midnight}
                      onChange={(e) => setEditForm((p) => ({ ...p, reset_at_midnight: e.target.checked }))}
                    />
                    Set timer reset to midnight (instead of 24h cooldown)
                  </label>
                  <textarea value={editForm.welcome_offer_info} onChange={(e) => setEditForm((p) => ({ ...p, welcome_offer_info: e.target.value }))}
                    placeholder="Welcome offer info"
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-y min-h-[88px]"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,231,153,0.4)', color: '#f0f0f0' }} />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(casino.id)} className="px-4 py-2 rounded-xl text-sm font-bold cursor-pointer"
                      style={{ background: '#E52D4B', color: '#fff' }}>Save</button>
                    <button onClick={() => setEditingId(null)} className="px-4 py-2 rounded-xl text-sm cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color: '#f0f0f0' }}>{casino.name}</span>
                      {!casino.is_active && (
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(229,45,75,0.2)', color: '#E52D4B' }}>hidden</span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{casino.bonus_description}</p>
                    {casino.casino_url && (
                      <p className="text-xs mt-1 truncate">
                        <a href={casino.casino_url} target="_blank" rel="noreferrer"
                          style={{ color: '#FFE799' }}>
                          {casino.casino_url}
                        </a>
                      </p>
                    )}
                    {casino.logo_url && (
                      <p className="text-xs mt-1 truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        Logo: {casino.logo_url}
                      </p>
                    )}
                    {(casino.logo_primary_color || casino.logo_secondary_color) && (
                      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        Gradient: {casino.logo_primary_color ?? '—'} / {casino.logo_secondary_color ?? '—'}
                      </p>
                    )}
                    {casino.welcome_offer_info && (
                      <p className="text-xs mt-1" style={{ color: 'rgba(255,231,153,0.75)' }}>
                        Welcome offer: {casino.welcome_offer_info}
                      </p>
                    )}
                    <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      Min redemption: {casino.min_redemption ?? '—'} · SC: {casino.sc_amount ?? '—'} · GC: {casino.gc_amount ?? '—'}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      Reset mode: {casino.reset_at_midnight ? 'Midnight' : '24h cooldown'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleActive(casino)} className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                      style={{ background: casino.is_active ? 'rgba(255,255,255,0.05)' : 'rgba(229,45,75,0.2)', color: casino.is_active ? 'rgba(255,255,255,0.4)' : '#E52D4B', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {casino.is_active ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => startEdit(casino)} className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                      style={{ background: 'rgba(255,231,153,0.1)', color: '#FFE799', border: '1px solid rgba(255,231,153,0.2)' }}>Edit</button>
                    <button onClick={() => deleteCasino(casino.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                      style={{ background: 'rgba(229,45,75,0.1)', color: '#E52D4B', border: '1px solid rgba(229,45,75,0.2)' }}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
