'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Casino } from '@/types'

export default function AdminPanel() {
  const supabase = createClient()
  const [casinos, setCasinos] = useState<Casino[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', bonus_description: '' })
  const [newForm, setNewForm] = useState({ name: '', bonus_description: '' })
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { window.location.href = '/'; return }
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single()
      if (!profile?.is_admin) { window.location.href = '/app'; return }
      loadCasinos()
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadCasinos = async () => {
    const { data } = await supabase.from('casinos').select('*').order('sort_order')
    setCasinos(data ?? [])
    setLoading(false)
  }

  const toggleActive = async (casino: Casino) => {
    await supabase.from('casinos').update({ is_active: !casino.is_active }).eq('id', casino.id)
    setCasinos((prev) => prev.map((c) => c.id === casino.id ? { ...c, is_active: !c.is_active } : c))
  }

  const startEdit = (casino: Casino) => {
    setEditingId(casino.id)
    setEditForm({ name: casino.name, bonus_description: casino.bonus_description })
  }

  const saveEdit = async (id: string) => {
    await supabase.from('casinos').update(editForm).eq('id', id)
    setCasinos((prev) => prev.map((c) => c.id === id ? { ...c, ...editForm } : c))
    setEditingId(null)
  }

  const deleteCasino = async (id: string) => {
    if (!confirm('Delete this casino?')) return
    await supabase.from('casinos').delete().eq('id', id)
    setCasinos((prev) => prev.filter((c) => c.id !== id))
  }

  const addCasino = async () => {
    if (!newForm.name || !newForm.bonus_description) return
    const maxOrder = Math.max(...casinos.map((c) => c.sort_order), 0)
    const { data } = await supabase
      .from('casinos')
      .insert({ ...newForm, is_active: true, sort_order: maxOrder + 1 })
      .select()
      .single()
    if (data) setCasinos((prev) => [...prev, data])
    setNewForm({ name: '', bonus_description: '' })
    setShowAdd(false)
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
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{casinos.length} casinos total</p>
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
                <div className="flex flex-col md:flex-row gap-3">
                  <input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,231,153,0.4)', color: '#f0f0f0' }} />
                  <input value={editForm.bonus_description} onChange={(e) => setEditForm((p) => ({ ...p, bonus_description: e.target.value }))}
                    className="flex-[2] px-3 py-2 rounded-xl text-sm outline-none"
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
