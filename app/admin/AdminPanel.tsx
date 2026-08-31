'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Casino, FeaturedBonus, LandingBlock, LandingConfig } from '@/types'

function FeaturedHtmlToolbar({
  onBold,
  onItalic,
  onLink,
  onBreak,
  onList,
}: {
  onBold: () => void
  onItalic: () => void
  onLink: () => void
  onBreak: () => void
  onList: () => void
}) {
  const buttonStyle = {
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.78)',
    border: '1px solid rgba(255,255,255,0.14)',
  }

  return (
    <div className="mb-2 flex flex-wrap gap-2">
      <button type="button" onClick={onBold} className="px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer" style={buttonStyle}>Bold</button>
      <button type="button" onClick={onItalic} className="px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer" style={buttonStyle}>Italic</button>
      <button type="button" onClick={onLink} className="px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer" style={buttonStyle}>Link</button>
      <button type="button" onClick={onBreak} className="px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer" style={buttonStyle}>Line break</button>
      <button type="button" onClick={onList} className="px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer" style={buttonStyle}>Bullet list</button>
    </div>
  )
}

export default function AdminPanel() {
  const supabase = createClient()
  const [casinos, setCasinos] = useState<Casino[]>([])
  const [featuredBonuses, setFeaturedBonuses] = useState<FeaturedBonus[]>([])
  const [landingBlocks, setLandingBlocks] = useState<LandingBlock[]>([])
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [showAddBlock, setShowAddBlock] = useState(false)
  const [activeTab, setActiveTab] = useState<'landing' | 'featured' | 'casinos'>('landing')
  const [editBlockForm, setEditBlockForm] = useState({ type: 'heading' as LandingBlock['type'], heading_level: 'h2' as string, content: '', image_url: '', image_alt: '' })
  const [newBlockForm, setNewBlockForm] = useState({ type: 'heading' as LandingBlock['type'], heading_level: 'h2' as string, content: '', image_url: '', image_alt: '' })
  const [landingConfig, setLandingConfig] = useState<LandingConfig | null>(null)
  const [activeUsersCount, setActiveUsersCount] = useState(0)
  const [totalUsersCount, setTotalUsersCount] = useState(0)
  const [landingForm, setLandingForm] = useState({
    page_title: '',
    meta_description: '',
    hero_badge: '',
    hero_description: '',
  })
  const [isSavingLanding, setIsSavingLanding] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingFeaturedId, setEditingFeaturedId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    bonus_description: '',
    welcome_offer_info: '',
    welcome_offer_show_cta: false,
    welcome_offer_cta_text: '',
    welcome_offer_cta_url: '',
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
    welcome_offer_show_cta: false,
    welcome_offer_cta_text: '',
    welcome_offer_cta_url: '',
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
    subtitle: '',
    description: '',
    show_cta: false,
    cta_text: '',
    cta_url: '',
    background_image_url: '',
    is_active: true,
  })
  const [newFeaturedForm, setNewFeaturedForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    show_cta: false,
    cta_text: '',
    cta_url: '',
    background_image_url: '',
    is_active: true,
  })
  const newFeaturedDescriptionRef = useRef<HTMLTextAreaElement | null>(null)
  const editFeaturedDescriptionRef = useRef<HTMLTextAreaElement | null>(null)
  const newWelcomeOfferRef = useRef<HTMLTextAreaElement | null>(null)
  const editWelcomeOfferRef = useRef<HTMLTextAreaElement | null>(null)

  const applyHtmlSnippet = (
    textarea: HTMLTextAreaElement | null,
    value: string,
    onChange: (nextValue: string) => void,
    before: string,
    after = '',
    placeholder = 'text'
  ) => {
    const start = textarea?.selectionStart ?? value.length
    const end = textarea?.selectionEnd ?? value.length
    const selectedText = value.slice(start, end) || placeholder
    const nextValue = `${value.slice(0, start)}${before}${selectedText}${after}${value.slice(end)}`
    onChange(nextValue)

    if (!textarea) return
    const selectionStart = start + before.length
    const selectionEnd = selectionStart + selectedText.length
    window.requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(selectionStart, selectionEnd)
    })
  }

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

  const assertNoSupabaseError = (error: { message: string } | null, context: string) => {
    if (!error) return true
    alert(`${context}: ${error.message}`)
    return false
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
    const [{ data: casinoData }, { data: featuredData }, { data: landingData }, { data: blocksData }] = await Promise.all([
      supabase.from('casinos').select('*').order('sort_order'),
      supabase.from('featured_bonuses').select('*').order('sort_order'),
      supabase.from('landing_config').select('*').single(),
      supabase.from('landing_blocks').select('*').order('sort_order'),
    ])
    
    // Get user counts from API endpoint (uses admin auth)
    try {
      const response = await fetch('/api/admin/users-count')
      if (response.ok) {
        const data = await response.json()
        setTotalUsersCount(data.totalUsers ?? 0)
        setActiveUsersCount(data.activeToday ?? 0)
      }
    } catch (err) {
      console.error('Failed to fetch users count:', err)
    }
    
    setCasinos(casinoData ?? [])
    setFeaturedBonuses(featuredData ?? [])
    setLandingBlocks(blocksData ?? [])
    if (landingData) {
      setLandingConfig(landingData)
      setLandingForm({
        page_title: landingData.page_title,
        meta_description: landingData.meta_description,
        hero_badge: landingData.hero_badge,
        hero_description: landingData.hero_description,
      })
    }
    setLoading(false)
  }

  const saveLandingConfig = async () => {
    if (!landingForm.page_title.trim() || !landingForm.meta_description.trim()) {
      alert('Page title and meta description are required.')
      return
    }
    setIsSavingLanding(true)
    const payload = {
      page_title: landingForm.page_title.trim(),
      meta_description: landingForm.meta_description.trim(),
      hero_badge: landingForm.hero_badge.trim(),
      hero_description: landingForm.hero_description.trim(),
      updated_at: new Date().toISOString(),
    }
    const { error } = landingConfig
      ? await supabase.from('landing_config').update(payload).eq('id', landingConfig.id)
      : await supabase.from('landing_config').insert(payload)
    if (!assertNoSupabaseError(error, 'Could not save landing config')) {
      setIsSavingLanding(false)
      return
    }
    setIsSavingLanding(false)
    alert('Landing page config saved!')
  }

  const addLandingBlock = async () => {
    const maxOrder = Math.max(...landingBlocks.map((b) => b.sort_order), 0)
    const payload = {
      type: newBlockForm.type,
      heading_level: newBlockForm.type === 'heading' ? newBlockForm.heading_level : null,
      content: newBlockForm.content.trim() || null,
      image_url: newBlockForm.image_url.trim() || null,
      image_alt: newBlockForm.image_alt.trim() || null,
      sort_order: maxOrder + 1,
      is_active: true,
    }
    const { data, error } = await supabase.from('landing_blocks').insert(payload).select().single()
    if (!assertNoSupabaseError(error, 'Could not create block')) return
    if (data) setLandingBlocks((prev) => [...prev, data])
    setNewBlockForm({ type: 'heading', heading_level: 'h2', content: '', image_url: '', image_alt: '' })
    setShowAddBlock(false)
  }

  const startEditBlock = (block: LandingBlock) => {
    setEditingBlockId(block.id)
    setEditBlockForm({
      type: block.type,
      heading_level: block.heading_level ?? 'h2',
      content: block.content ?? '',
      image_url: block.image_url ?? '',
      image_alt: block.image_alt ?? '',
    })
  }

  const saveEditBlock = async (id: string) => {
    const payload: Partial<LandingBlock> = {
      type: editBlockForm.type,
      heading_level: editBlockForm.type === 'heading' ? (editBlockForm.heading_level as LandingBlock['heading_level']) : null,
      content: editBlockForm.content.trim() || null,
      image_url: editBlockForm.image_url.trim() || null,
      image_alt: editBlockForm.image_alt.trim() || null,
    }
    const { error } = await supabase.from('landing_blocks').update(payload).eq('id', id)
    if (!assertNoSupabaseError(error, 'Could not save block')) return
    setLandingBlocks((prev) => prev.map((b) => b.id === id ? { ...b, ...payload } : b))
    setEditingBlockId(null)
  }

  const deleteBlock = async (id: string) => {
    if (!confirm('Delete this block?')) return
    const { error } = await supabase.from('landing_blocks').delete().eq('id', id)
    if (!assertNoSupabaseError(error, 'Could not delete block')) return
    setLandingBlocks((prev) => prev.filter((b) => b.id !== id))
  }

  const toggleBlockActive = async (block: LandingBlock) => {
    const { error } = await supabase.from('landing_blocks').update({ is_active: !block.is_active }).eq('id', block.id)
    if (!assertNoSupabaseError(error, 'Could not update block visibility')) return
    setLandingBlocks((prev) => prev.map((b) => b.id === block.id ? { ...b, is_active: !b.is_active } : b))
  }

  const moveBlock = async (block: LandingBlock, direction: 'up' | 'down') => {
    const sorted = [...landingBlocks].sort((a, b) => a.sort_order - b.sort_order)
    const idx = sorted.findIndex((b) => b.id === block.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const swapBlock = sorted[swapIdx]
    const aOrder = block.sort_order
    const bOrder = swapBlock.sort_order
    await Promise.all([
      supabase.from('landing_blocks').update({ sort_order: bOrder }).eq('id', block.id),
      supabase.from('landing_blocks').update({ sort_order: aOrder }).eq('id', swapBlock.id),
    ])
    setLandingBlocks((prev) => prev.map((b) => {
      if (b.id === block.id) return { ...b, sort_order: bOrder }
      if (b.id === swapBlock.id) return { ...b, sort_order: aOrder }
      return b
    }))
  }

  const toggleActive = async (casino: Casino) => {
    const { error } = await supabase.from('casinos').update({ is_active: !casino.is_active }).eq('id', casino.id)
    if (!assertNoSupabaseError(error, 'Could not update casino visibility')) return
    setCasinos((prev) => prev.map((c) => c.id === casino.id ? { ...c, is_active: !c.is_active } : c))
  }

  const startEdit = (casino: Casino) => {
    setEditingId(casino.id)
    setEditForm({
      name: casino.name,
      bonus_description: casino.bonus_description,
      welcome_offer_info: casino.welcome_offer_info ?? '',
      welcome_offer_show_cta: casino.welcome_offer_show_cta,
      welcome_offer_cta_text: casino.welcome_offer_cta_text ?? '',
      welcome_offer_cta_url: casino.welcome_offer_cta_url ?? '',
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
      welcome_offer_show_cta: editForm.welcome_offer_show_cta && !!editForm.welcome_offer_cta_text.trim() && !!editForm.welcome_offer_cta_url.trim(),
      welcome_offer_cta_text: editForm.welcome_offer_show_cta && editForm.welcome_offer_cta_text.trim() ? editForm.welcome_offer_cta_text.trim() : null,
      welcome_offer_cta_url: editForm.welcome_offer_show_cta && editForm.welcome_offer_cta_url.trim() ? editForm.welcome_offer_cta_url.trim() : null,
      logo_url: editForm.logo_url.trim() ? editForm.logo_url : null,
      casino_url: editForm.casino_url.trim() ? editForm.casino_url : null,
      logo_primary_color: primaryColor.value,
      logo_secondary_color: secondaryColor.value,
      min_redemption: minRedemption.value,
      reset_at_midnight: editForm.reset_at_midnight,
      sc_amount: scAmount.value,
      gc_amount: gcAmount.value,
    }
    const { error } = await supabase.from('casinos').update(payload).eq('id', id)
    if (!assertNoSupabaseError(error, 'Could not save casino changes')) return
    setCasinos((prev) => prev.map((c) => c.id === id ? { ...c, ...payload } : c))
    setEditingId(null)
  }

  const deleteCasino = async (id: string) => {
    if (!confirm('Delete this casino?')) return
    const { error } = await supabase.from('casinos').delete().eq('id', id)
    if (!assertNoSupabaseError(error, 'Could not delete casino')) return
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
      welcome_offer_show_cta: newForm.welcome_offer_show_cta && !!newForm.welcome_offer_cta_text.trim() && !!newForm.welcome_offer_cta_url.trim(),
      welcome_offer_cta_text: newForm.welcome_offer_show_cta && newForm.welcome_offer_cta_text.trim() ? newForm.welcome_offer_cta_text.trim() : null,
      welcome_offer_cta_url: newForm.welcome_offer_show_cta && newForm.welcome_offer_cta_url.trim() ? newForm.welcome_offer_cta_url.trim() : null,
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
    const { data, error } = await supabase
      .from('casinos')
      .insert(payload)
      .select()
      .single()
    if (!assertNoSupabaseError(error, 'Could not create casino')) return
    if (data) setCasinos((prev) => [...prev, data])
    setNewForm({
      name: '',
      bonus_description: '',
      welcome_offer_info: '',
      welcome_offer_show_cta: false,
      welcome_offer_cta_text: '',
      welcome_offer_cta_url: '',
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
    const { error } = await supabase.from('featured_bonuses').update({ is_active: !featured.is_active }).eq('id', featured.id)
    if (!assertNoSupabaseError(error, 'Could not update featured card visibility')) return
    setFeaturedBonuses((prev) => prev.map((f) => f.id === featured.id ? { ...f, is_active: !f.is_active } : f))
  }

  const startEditFeatured = (featured: FeaturedBonus) => {
    setEditingFeaturedId(featured.id)
    setEditFeaturedForm({
      title: featured.title,
      subtitle: featured.subtitle ?? '',
      description: featured.description,
      show_cta: featured.show_cta,
      cta_text: featured.cta_text ?? '',
      cta_url: featured.cta_url ?? '',
      background_image_url: featured.background_image_url ?? '',
      is_active: featured.is_active,
    })
  }

  const saveEditFeatured = async (id: string) => {
    if (!editFeaturedForm.title.trim() || !editFeaturedForm.description.trim()) return
    const payload = {
      title: editFeaturedForm.title.trim(),
      subtitle: editFeaturedForm.subtitle.trim() ? editFeaturedForm.subtitle.trim() : null,
      description: editFeaturedForm.description.trim(),
      show_cta: editFeaturedForm.show_cta && !!editFeaturedForm.cta_text.trim() && !!editFeaturedForm.cta_url.trim(),
      cta_text: editFeaturedForm.show_cta && editFeaturedForm.cta_text.trim() ? editFeaturedForm.cta_text.trim() : null,
      cta_url: editFeaturedForm.show_cta && editFeaturedForm.cta_url.trim() ? editFeaturedForm.cta_url.trim() : null,
      background_image_url: editFeaturedForm.background_image_url.trim() ? editFeaturedForm.background_image_url.trim() : null,
      is_active: editFeaturedForm.is_active,
    }
    const { error } = await supabase.from('featured_bonuses').update(payload).eq('id', id)
    if (!assertNoSupabaseError(error, 'Could not save featured card changes')) return
    setFeaturedBonuses((prev) => prev.map((f) => f.id === id ? { ...f, ...payload } : f))
    setEditingFeaturedId(null)
  }

  const deleteFeatured = async (id: string) => {
    if (!confirm('Delete this featured bonus card?')) return
    const { error } = await supabase.from('featured_bonuses').delete().eq('id', id)
    if (!assertNoSupabaseError(error, 'Could not delete featured card')) return
    setFeaturedBonuses((prev) => prev.filter((f) => f.id !== id))
  }

  const addFeatured = async () => {
    if (!newFeaturedForm.title.trim() || !newFeaturedForm.description.trim()) return
    const maxOrder = Math.max(...featuredBonuses.map((f) => f.sort_order), 0)
    const payload = {
      title: newFeaturedForm.title.trim(),
      subtitle: newFeaturedForm.subtitle.trim() ? newFeaturedForm.subtitle.trim() : null,
      description: newFeaturedForm.description.trim(),
      show_cta: newFeaturedForm.show_cta && !!newFeaturedForm.cta_text.trim() && !!newFeaturedForm.cta_url.trim(),
      cta_text: newFeaturedForm.show_cta && newFeaturedForm.cta_text.trim() ? newFeaturedForm.cta_text.trim() : null,
      cta_url: newFeaturedForm.show_cta && newFeaturedForm.cta_url.trim() ? newFeaturedForm.cta_url.trim() : null,
      background_image_url: newFeaturedForm.background_image_url.trim() ? newFeaturedForm.background_image_url.trim() : null,
      is_active: newFeaturedForm.is_active,
      sort_order: maxOrder + 1,
    }
    const { data, error } = await supabase.from('featured_bonuses').insert(payload).select().single()
    if (!assertNoSupabaseError(error, 'Could not create featured card')) return
    if (data) setFeaturedBonuses((prev) => [...prev, data])
    setNewFeaturedForm({
      title: '',
      subtitle: '',
      description: '',
      show_cta: false,
      cta_text: '',
      cta_url: '',
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
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{casinos.length} casinos · {featuredBonuses.length} featured cards · {activeUsersCount} active today · {totalUsersCount} total users</p>
            </div>
          </div>
          <div className="flex gap-3">
            <a href="/app"
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
              ← Back to App
            </a>
            {activeTab === 'casinos' && (
              <button onClick={() => setShowAdd(true)}
                className="px-4 py-2 rounded-xl text-sm font-bold cursor-pointer"
                style={{ background: '#E52D4B', color: '#fff', boxShadow: '0 0 15px rgba(229,45,75,0.4)' }}>
                + Add Casino
              </button>
            )}
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 pb-0 flex gap-1">
          {(['landing', 'featured', 'casinos'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-5 py-2.5 text-sm font-semibold rounded-t-xl capitalize cursor-pointer transition-colors"
              style={{
                background: activeTab === tab ? '#1e252e' : 'transparent',
                color: activeTab === tab ? '#FFE799' : 'rgba(255,255,255,0.5)',
                borderBottom: activeTab === tab ? '2px solid #FFE799' : '2px solid transparent',
              }}>
              {tab === 'landing' ? 'Landing Page' : tab === 'featured' ? 'Featured Cards' : 'Casinos'}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* ── LANDING TAB ── */}
        {activeTab === 'landing' && (<>
        {/* Landing SEO Config */}
        <div className="rounded-2xl p-6 mb-6"
          style={{ background: '#2C343F', border: '1px solid rgba(73,148,201,0.35)', boxShadow: '0 0 20px rgba(73,148,201,0.12)' }}>
          <div className="mb-4">
            <h2 className="font-bold" style={{ color: '#d8f0ff' }}>Landing Page</h2>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Controls SEO metadata and visible text on the landing page.
            </p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.72)' }}>Page Title (title tag)</label>
              <input
                value={landingForm.page_title}
                onChange={(e) => setLandingForm((p) => ({ ...p, page_title: e.target.value }))}
                placeholder="United Gamblers Daily Bonus Tracker"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.35)', color: '#f0f0f0' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.72)' }}>Meta Description</label>
              <textarea
                value={landingForm.meta_description}
                onChange={(e) => setLandingForm((p) => ({ ...p, meta_description: e.target.value }))}
                placeholder="Track all your sweepstakes casino daily bonuses in one place."
                rows={2}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-y"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.35)', color: '#f0f0f0' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.72)' }}>Hero Badge text</label>
              <input
                value={landingForm.hero_badge}
                onChange={(e) => setLandingForm((p) => ({ ...p, hero_badge: e.target.value }))}
                placeholder="Built for daily bonus grinders"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.35)', color: '#f0f0f0' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.72)' }}>Hero Description paragraph</label>
              <textarea
                value={landingForm.hero_description}
                onChange={(e) => setLandingForm((p) => ({ ...p, hero_description: e.target.value }))}
                placeholder="United Gamblers Daily Bonus Tracker helps sweepstakes casino players..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-y"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.35)', color: '#f0f0f0' }}
              />
            </div>
            <button
              onClick={saveLandingConfig}
              disabled={isSavingLanding}
              className="px-5 py-2 rounded-xl text-sm font-bold cursor-pointer transition-opacity"
              style={{ background: '#4994C9', color: '#fff', opacity: isSavingLanding ? 0.7 : 1 }}
            >
              {isSavingLanding ? 'Saving…' : 'Save Landing Config'}
            </button>
          </div>
        </div>

        {/* Landing Content Blocks */}
        <div className="rounded-2xl p-6 mb-6"
          style={{ background: '#2C343F', border: '1px solid rgba(73,148,201,0.35)', boxShadow: '0 0 20px rgba(73,148,201,0.12)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold" style={{ color: '#d8f0ff' }}>Content Blocks</h2>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Additional content shown below the feature cards on the landing page.
              </p>
            </div>
            <button onClick={() => setShowAddBlock(true)}
              className="px-4 py-2 rounded-xl text-sm font-bold cursor-pointer"
              style={{ background: '#4994C9', color: '#fff', boxShadow: '0 0 12px rgba(73,148,201,0.35)' }}>
              + Add Block
            </button>
          </div>

          {showAddBlock && (
            <div className="rounded-xl p-4 mb-4 space-y-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(73,148,201,0.35)' }}>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.72)' }}>Block type</label>
                  <select value={newBlockForm.type} onChange={(e) => setNewBlockForm((p) => ({ ...p, type: e.target.value as LandingBlock['type'] }))}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.35)', color: '#f0f0f0' }}>
                    <option value="heading">Heading</option>
                    <option value="text">Text / HTML</option>
                    <option value="image">Image</option>
                  </select>
                </div>
                {newBlockForm.type === 'heading' && (
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.72)' }}>Level</label>
                    <select value={newBlockForm.heading_level} onChange={(e) => setNewBlockForm((p) => ({ ...p, heading_level: e.target.value }))}
                      className="px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.35)', color: '#f0f0f0' }}>
                      <option value="h2">H2</option>
                      <option value="h3">H3</option>
                      <option value="h4">H4</option>
                    </select>
                  </div>
                )}
              </div>
              {newBlockForm.type !== 'image' && (
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.72)' }}>
                    {newBlockForm.type === 'heading' ? 'Heading text' : 'Content (HTML allowed)'}
                  </label>
                  {newBlockForm.type === 'text' && (
                    <FeaturedHtmlToolbar
                      onBold={() => setNewBlockForm((p) => ({ ...p, content: p.content + '<strong>text</strong>' }))}
                      onItalic={() => setNewBlockForm((p) => ({ ...p, content: p.content + '<em>text</em>' }))}
                      onLink={() => setNewBlockForm((p) => ({ ...p, content: p.content + '<a href="https://">link text</a>' }))}
                      onBreak={() => setNewBlockForm((p) => ({ ...p, content: p.content + '<br />' }))}
                      onList={() => setNewBlockForm((p) => ({ ...p, content: p.content + '<ul>\n  <li>List item</li>\n</ul>' }))}
                    />
                  )}
                  <textarea value={newBlockForm.content} onChange={(e) => setNewBlockForm((p) => ({ ...p, content: e.target.value }))}
                    rows={newBlockForm.type === 'text' ? 4 : 2}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-y"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.35)', color: '#f0f0f0' }} />
                </div>
              )}
              {newBlockForm.type === 'image' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.72)' }}>Image URL</label>
                    <input value={newBlockForm.image_url} onChange={(e) => setNewBlockForm((p) => ({ ...p, image_url: e.target.value }))}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.35)', color: '#f0f0f0' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.72)' }}>Alt text / caption</label>
                    <input value={newBlockForm.image_alt} onChange={(e) => setNewBlockForm((p) => ({ ...p, image_alt: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.35)', color: '#f0f0f0' }} />
                  </div>
                </>
              )}
              <div className="flex gap-2">
                <button onClick={addLandingBlock} className="px-4 py-2 rounded-xl text-sm font-bold cursor-pointer"
                  style={{ background: '#4994C9', color: '#fff' }}>Add block</button>
                <button onClick={() => setShowAddBlock(false)} className="px-4 py-2 rounded-xl text-sm cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {[...landingBlocks].sort((a, b) => a.sort_order - b.sort_order).map((block) => (
              <div key={block.id} className="rounded-xl p-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${block.is_active ? 'rgba(73,148,201,0.25)' : 'rgba(229,45,75,0.2)'}`, opacity: block.is_active ? 1 : 0.55 }}>
                {editingBlockId === block.id ? (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.72)' }}>Type</label>
                        <select value={editBlockForm.type} onChange={(e) => setEditBlockForm((p) => ({ ...p, type: e.target.value as LandingBlock['type'] }))}
                          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.4)', color: '#f0f0f0' }}>
                          <option value="heading">Heading</option>
                          <option value="text">Text / HTML</option>
                          <option value="image">Image</option>
                        </select>
                      </div>
                      {editBlockForm.type === 'heading' && (
                        <div>
                          <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.72)' }}>Level</label>
                          <select value={editBlockForm.heading_level} onChange={(e) => setEditBlockForm((p) => ({ ...p, heading_level: e.target.value }))}
                            className="px-3 py-2 rounded-xl text-sm outline-none"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.4)', color: '#f0f0f0' }}>
                            <option value="h2">H2</option>
                            <option value="h3">H3</option>
                            <option value="h4">H4</option>
                          </select>
                        </div>
                      )}
                    </div>
                    {editBlockForm.type !== 'image' && (
                      <div>
                        {editBlockForm.type === 'text' && (
                          <FeaturedHtmlToolbar
                            onBold={() => setEditBlockForm((p) => ({ ...p, content: p.content + '<strong>text</strong>' }))}
                            onItalic={() => setEditBlockForm((p) => ({ ...p, content: p.content + '<em>text</em>' }))}
                            onLink={() => setEditBlockForm((p) => ({ ...p, content: p.content + '<a href="https://">link text</a>' }))}
                            onBreak={() => setEditBlockForm((p) => ({ ...p, content: p.content + '<br />' }))}
                            onList={() => setEditBlockForm((p) => ({ ...p, content: p.content + '<ul>\n  <li>List item</li>\n</ul>' }))}
                          />
                        )}
                        <textarea value={editBlockForm.content} onChange={(e) => setEditBlockForm((p) => ({ ...p, content: e.target.value }))}
                          rows={editBlockForm.type === 'text' ? 4 : 2}
                          className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-y"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.4)', color: '#f0f0f0' }} />
                      </div>
                    )}
                    {editBlockForm.type === 'image' && (
                      <>
                        <input value={editBlockForm.image_url} onChange={(e) => setEditBlockForm((p) => ({ ...p, image_url: e.target.value }))}
                          placeholder="Image URL (https://...)"
                          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.4)', color: '#f0f0f0' }} />
                        <input value={editBlockForm.image_alt} onChange={(e) => setEditBlockForm((p) => ({ ...p, image_alt: e.target.value }))}
                          placeholder="Alt text / caption"
                          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.4)', color: '#f0f0f0' }} />
                      </>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => saveEditBlock(block.id)} className="px-4 py-2 rounded-xl text-sm font-bold cursor-pointer"
                        style={{ background: '#4994C9', color: '#fff' }}>Save</button>
                      <button onClick={() => setEditingBlockId(null)} className="px-4 py-2 rounded-xl text-sm cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button onClick={() => moveBlock(block, 'up')} className="text-xs cursor-pointer px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>▲</button>
                      <button onClick={() => moveBlock(block, 'down')} className="text-xs cursor-pointer px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>▼</button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs px-2 py-0.5 rounded-full mr-2" style={{ background: 'rgba(73,148,201,0.18)', color: '#C8E8FF' }}>
                        {block.type === 'heading' ? `${block.heading_level?.toUpperCase()} heading` : block.type}
                      </span>
                      <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        {block.type === 'image' ? (block.image_url ?? '—') : (block.content?.slice(0, 80) ?? '—')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => toggleBlockActive(block)} className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                        style={{ background: block.is_active ? 'rgba(255,255,255,0.05)' : 'rgba(229,45,75,0.2)', color: block.is_active ? 'rgba(255,255,255,0.4)' : '#E52D4B', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {block.is_active ? 'Hide' : 'Show'}
                      </button>
                      <button onClick={() => startEditBlock(block)} className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                        style={{ background: 'rgba(255,231,153,0.1)', color: '#FFE799', border: '1px solid rgba(255,231,153,0.2)' }}>Edit</button>
                      <button onClick={() => deleteBlock(block.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                        style={{ background: 'rgba(229,45,75,0.1)', color: '#E52D4B', border: '1px solid rgba(229,45,75,0.2)' }}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {landingBlocks.length === 0 && (
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>No content blocks yet. Add one to place content below the feature cards.</p>
            )}
          </div>
        </div>
        </>)}

        {/* ── FEATURED TAB ── */}
        {activeTab === 'featured' && (<>
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
                <input placeholder="Subtitle (e.g. Fav of the week)" value={newFeaturedForm.subtitle}
                  onChange={(e) => setNewFeaturedForm((p) => ({ ...p, subtitle: e.target.value }))}
                  className="px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.35)', color: '#f0f0f0' }} />
                <input placeholder="Background image URL (optional)" value={newFeaturedForm.background_image_url}
                  onChange={(e) => setNewFeaturedForm((p) => ({ ...p, background_image_url: e.target.value }))}
                  className="px-3 py-2 rounded-xl text-sm outline-none md:col-span-2"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.35)', color: '#f0f0f0' }} />
              </div>
              <FeaturedHtmlToolbar
                onBold={() => applyHtmlSnippet(newFeaturedDescriptionRef.current, newFeaturedForm.description, (description) => setNewFeaturedForm((p) => ({ ...p, description })), '<strong>', '</strong>')}
                onItalic={() => applyHtmlSnippet(newFeaturedDescriptionRef.current, newFeaturedForm.description, (description) => setNewFeaturedForm((p) => ({ ...p, description })), '<em>', '</em>')}
                onLink={() => applyHtmlSnippet(newFeaturedDescriptionRef.current, newFeaturedForm.description, (description) => setNewFeaturedForm((p) => ({ ...p, description })), '<a href="https://">', '</a>', 'link text')}
                onBreak={() => applyHtmlSnippet(newFeaturedDescriptionRef.current, newFeaturedForm.description, (description) => setNewFeaturedForm((p) => ({ ...p, description })), '<br />', '', '')}
                onList={() => applyHtmlSnippet(newFeaturedDescriptionRef.current, newFeaturedForm.description, (description) => setNewFeaturedForm((p) => ({ ...p, description })), '<ul>\n  <li>', '</li>\n</ul>', 'List item')}
              />
              <textarea ref={newFeaturedDescriptionRef} placeholder="Main description" value={newFeaturedForm.description}
                onChange={(e) => setNewFeaturedForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full mb-3 px-3 py-2 rounded-xl text-sm outline-none resize-y min-h-[72px]"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.35)', color: '#f0f0f0' }} />
              <p className="mb-3 text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                HTML allowed here: &lt;strong&gt;, &lt;em&gt;, &lt;a href&gt;, &lt;br /&gt;, &lt;ul&gt;, &lt;li&gt;
              </p>
              <label className="mb-3 flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.78)' }}>
                <input
                  type="checkbox"
                  checked={newFeaturedForm.show_cta}
                  onChange={(e) => setNewFeaturedForm((p) => ({ ...p, show_cta: e.target.checked }))}
                />
                Show CTA button
              </label>
              {newFeaturedForm.show_cta && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <input placeholder="CTA text (e.g. Claim now)" value={newFeaturedForm.cta_text}
                    onChange={(e) => setNewFeaturedForm((p) => ({ ...p, cta_text: e.target.value }))}
                    className="px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.35)', color: '#f0f0f0' }} />
                  <input placeholder="CTA link (https://...)" value={newFeaturedForm.cta_url}
                    onChange={(e) => setNewFeaturedForm((p) => ({ ...p, cta_url: e.target.value }))}
                    className="px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.35)', color: '#f0f0f0' }} />
                </div>
              )}
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
                      <input value={editFeaturedForm.subtitle} onChange={(e) => setEditFeaturedForm((p) => ({ ...p, subtitle: e.target.value }))}
                        placeholder="Subtitle (e.g. Fav of the week)"
                        className="px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.4)', color: '#f0f0f0' }} />
                      <input value={editFeaturedForm.background_image_url} onChange={(e) => setEditFeaturedForm((p) => ({ ...p, background_image_url: e.target.value }))}
                        placeholder="Background image URL"
                        className="px-3 py-2 rounded-xl text-sm outline-none md:col-span-2"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.4)', color: '#f0f0f0' }} />
                    </div>
                    <FeaturedHtmlToolbar
                      onBold={() => applyHtmlSnippet(editFeaturedDescriptionRef.current, editFeaturedForm.description, (description) => setEditFeaturedForm((p) => ({ ...p, description })), '<strong>', '</strong>')}
                      onItalic={() => applyHtmlSnippet(editFeaturedDescriptionRef.current, editFeaturedForm.description, (description) => setEditFeaturedForm((p) => ({ ...p, description })), '<em>', '</em>')}
                      onLink={() => applyHtmlSnippet(editFeaturedDescriptionRef.current, editFeaturedForm.description, (description) => setEditFeaturedForm((p) => ({ ...p, description })), '<a href="https://">', '</a>', 'link text')}
                      onBreak={() => applyHtmlSnippet(editFeaturedDescriptionRef.current, editFeaturedForm.description, (description) => setEditFeaturedForm((p) => ({ ...p, description })), '<br />', '', '')}
                      onList={() => applyHtmlSnippet(editFeaturedDescriptionRef.current, editFeaturedForm.description, (description) => setEditFeaturedForm((p) => ({ ...p, description })), '<ul>\n  <li>', '</li>\n</ul>', 'List item')}
                    />
                    <textarea ref={editFeaturedDescriptionRef} value={editFeaturedForm.description} onChange={(e) => setEditFeaturedForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Main description"
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-y min-h-[72px]"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.4)', color: '#f0f0f0' }} />
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      HTML allowed here: &lt;strong&gt;, &lt;em&gt;, &lt;a href&gt;, &lt;br /&gt;, &lt;ul&gt;, &lt;li&gt;
                    </p>
                    <label className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.78)' }}>
                      <input
                        type="checkbox"
                        checked={editFeaturedForm.show_cta}
                        onChange={(e) => setEditFeaturedForm((p) => ({ ...p, show_cta: e.target.checked }))}
                      />
                      Show CTA button
                    </label>
                    {editFeaturedForm.show_cta && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input value={editFeaturedForm.cta_text} onChange={(e) => setEditFeaturedForm((p) => ({ ...p, cta_text: e.target.value }))}
                          placeholder="CTA text"
                          className="px-3 py-2 rounded-xl text-sm outline-none"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.4)', color: '#f0f0f0' }} />
                        <input value={editFeaturedForm.cta_url} onChange={(e) => setEditFeaturedForm((p) => ({ ...p, cta_url: e.target.value }))}
                          placeholder="CTA link (https://...)"
                          className="px-3 py-2 rounded-xl text-sm outline-none"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(73,148,201,0.4)', color: '#f0f0f0' }} />
                      </div>
                    )}
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
                      {featured.subtitle && (
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,231,153,0.85)' }}>{featured.subtitle}</p>
                      )}
                      <div className="text-xs mt-1 featured-bonus-copy" style={{ color: 'rgba(255,255,255,0.58)' }} dangerouslySetInnerHTML={{ __html: featured.description }} />
                      {featured.show_cta && featured.cta_text && featured.cta_url && (
                        <p className="text-xs mt-2" style={{ color: '#CFE8FF' }}>
                          CTA: {featured.cta_text} {'->'} {featured.cta_url}
                        </p>
                      )}
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
        </>)}

        {/* ── CASINOS TAB ── */}
        {activeTab === 'casinos' && (<>

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
            <FeaturedHtmlToolbar
              onBold={() => applyHtmlSnippet(newWelcomeOfferRef.current, newForm.welcome_offer_info, (welcome_offer_info) => setNewForm((p) => ({ ...p, welcome_offer_info })), '<strong>', '</strong>')}
              onItalic={() => applyHtmlSnippet(newWelcomeOfferRef.current, newForm.welcome_offer_info, (welcome_offer_info) => setNewForm((p) => ({ ...p, welcome_offer_info })), '<em>', '</em>')}
              onLink={() => applyHtmlSnippet(newWelcomeOfferRef.current, newForm.welcome_offer_info, (welcome_offer_info) => setNewForm((p) => ({ ...p, welcome_offer_info })), '<a href="https://">', '</a>', 'link text')}
              onBreak={() => applyHtmlSnippet(newWelcomeOfferRef.current, newForm.welcome_offer_info, (welcome_offer_info) => setNewForm((p) => ({ ...p, welcome_offer_info })), '<br />', '', '')}
              onList={() => applyHtmlSnippet(newWelcomeOfferRef.current, newForm.welcome_offer_info, (welcome_offer_info) => setNewForm((p) => ({ ...p, welcome_offer_info })), '<ul>\n  <li>', '</li>\n</ul>', 'List item')}
            />
            <textarea ref={newWelcomeOfferRef} placeholder="Welcome offer info (expanded details shown in app)" value={newForm.welcome_offer_info}
              onChange={(e) => setNewForm((p) => ({ ...p, welcome_offer_info: e.target.value }))}
              className="w-full mb-4 px-4 py-3 rounded-xl outline-none text-sm resize-y min-h-[96px]"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f0' }} />
            <p className="mb-3 text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
              HTML allowed here: &lt;strong&gt;, &lt;em&gt;, &lt;a href&gt;, &lt;br /&gt;, &lt;ul&gt;, &lt;li&gt;
            </p>
            <label className="mb-3 flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.78)' }}>
              <input
                type="checkbox"
                checked={newForm.welcome_offer_show_cta}
                onChange={(e) => setNewForm((p) => ({ ...p, welcome_offer_show_cta: e.target.checked }))}
              />
              Show CTA button in welcome offer
            </label>
            {newForm.welcome_offer_show_cta && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input placeholder="CTA text (e.g. Claim now)" value={newForm.welcome_offer_cta_text}
                  onChange={(e) => setNewForm((p) => ({ ...p, welcome_offer_cta_text: e.target.value }))}
                  className="px-4 py-3 rounded-xl outline-none text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f0' }} />
                <input placeholder="CTA link (https://...)" value={newForm.welcome_offer_cta_url}
                  onChange={(e) => setNewForm((p) => ({ ...p, welcome_offer_cta_url: e.target.value }))}
                  className="px-4 py-3 rounded-xl outline-none text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f0' }} />
              </div>
            )}
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
                  <FeaturedHtmlToolbar
                    onBold={() => applyHtmlSnippet(editWelcomeOfferRef.current, editForm.welcome_offer_info, (welcome_offer_info) => setEditForm((p) => ({ ...p, welcome_offer_info })), '<strong>', '</strong>')}
                    onItalic={() => applyHtmlSnippet(editWelcomeOfferRef.current, editForm.welcome_offer_info, (welcome_offer_info) => setEditForm((p) => ({ ...p, welcome_offer_info })), '<em>', '</em>')}
                    onLink={() => applyHtmlSnippet(editWelcomeOfferRef.current, editForm.welcome_offer_info, (welcome_offer_info) => setEditForm((p) => ({ ...p, welcome_offer_info })), '<a href="https://">', '</a>', 'link text')}
                    onBreak={() => applyHtmlSnippet(editWelcomeOfferRef.current, editForm.welcome_offer_info, (welcome_offer_info) => setEditForm((p) => ({ ...p, welcome_offer_info })), '<br />', '', '')}
                    onList={() => applyHtmlSnippet(editWelcomeOfferRef.current, editForm.welcome_offer_info, (welcome_offer_info) => setEditForm((p) => ({ ...p, welcome_offer_info })), '<ul>\n  <li>', '</li>\n</ul>', 'List item')}
                  />
                  <textarea ref={editWelcomeOfferRef} value={editForm.welcome_offer_info} onChange={(e) => setEditForm((p) => ({ ...p, welcome_offer_info: e.target.value }))}
                    placeholder="Welcome offer info"
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-y min-h-[88px]"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,231,153,0.4)', color: '#f0f0f0' }} />
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    HTML allowed here: &lt;strong&gt;, &lt;em&gt;, &lt;a href&gt;, &lt;br /&gt;, &lt;ul&gt;, &lt;li&gt;
                  </p>
                  <label className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.78)' }}>
                    <input
                      type="checkbox"
                      checked={editForm.welcome_offer_show_cta}
                      onChange={(e) => setEditForm((p) => ({ ...p, welcome_offer_show_cta: e.target.checked }))}
                    />
                    Show CTA button in welcome offer
                  </label>
                  {editForm.welcome_offer_show_cta && (
                    <div className="flex flex-col md:flex-row gap-3">
                      <input value={editForm.welcome_offer_cta_text} onChange={(e) => setEditForm((p) => ({ ...p, welcome_offer_cta_text: e.target.value }))}
                        placeholder="CTA text"
                        className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,231,153,0.4)', color: '#f0f0f0' }} />
                      <input value={editForm.welcome_offer_cta_url} onChange={(e) => setEditForm((p) => ({ ...p, welcome_offer_cta_url: e.target.value }))}
                        placeholder="CTA link (https://...)"
                        className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,231,153,0.4)', color: '#f0f0f0' }} />
                    </div>
                  )}
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
                      <div className="text-xs mt-1 rich-text-content" style={{ color: 'rgba(255,231,153,0.75)' }} dangerouslySetInnerHTML={{ __html: casino.welcome_offer_info }} />
                    )}
                    {casino.welcome_offer_show_cta && casino.welcome_offer_cta_text && casino.welcome_offer_cta_url && (
                      <p className="text-xs mt-1" style={{ color: '#CFE8FF' }}>
                        Welcome CTA: {casino.welcome_offer_cta_text} {'->'} {casino.welcome_offer_cta_url}
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
        </>)}
      </div>
    </div>
  )
}
