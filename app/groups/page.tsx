'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const CATEGORIES = ['Sport', 'Food', 'Culture', 'Outdoor', 'Music']
const CATEGORY_CONFIG: Record<string, { icon: string; bg: string; color: string }> = {
  Sport:   { icon: '🏄', bg: '#E6F1FB', color: '#185FA5' },
  Food:    { icon: '🍕', bg: '#FAECE7', color: '#C04A20' },
  Culture: { icon: '🎨', bg: '#FEF3C7', color: '#9A6200' },
  Outdoor: { icon: '🌿', bg: '#E1F5EE', color: '#1D9E75' },
  Music:   { icon: '🎵', bg: '#EEEDFE', color: '#534AB7' },
}

export default function GroupsPage() {
  const [user, setUser] = useState<any>(null)
  const [groups, setGroups] = useState<any[]>([])
  const [members, setMembers] = useState<Record<string, string[]>>({})
  const [showCreate, setShowCreate] = useState(false)
  const [loadingJoin, setLoadingJoin] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', category: 'Sport' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [tab, setTab] = useState<'discover' | 'mine'>('discover')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
      else { setUser(data.user); loadGroups() }
    })
  }, [])

  const loadGroups = async () => {
    const { data: groupsData } = await supabase.from('groups').select('*').order('created_at', { ascending: false })
    if (groupsData) setGroups(groupsData)
    const { data: membersData } = await supabase.from('group_members').select('group_id, user_id')
    if (membersData) {
      const map: Record<string, string[]> = {}
      membersData.forEach(m => {
        if (!map[m.group_id]) map[m.group_id] = []
        map[m.group_id].push(m.user_id)
      })
      setMembers(map)
    }
  }

  const toggleJoin = async (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) return
    setLoadingJoin(groupId)
    const isJoined = members[groupId]?.includes(user.id)
    if (isJoined) {
      await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', user.id)
    } else {
      await supabase.from('group_members').insert({ group_id: groupId, user_id: user.id })
    }
    await loadGroups()
    setLoadingJoin(null)
  }

  const createGroup = async () => {
    if (!form.name) { setMessage('⚠️ Group name is required.'); return }
    setSaving(true)
    const { error } = await supabase.from('groups').insert({ ...form, creator_id: user.id })
    if (error) setMessage('Error: ' + error.message)
    else {
      setShowCreate(false)
      setForm({ name: '', description: '', category: 'Sport' })
      await loadGroups()
    }
    setSaving(false)
  }

  const myGroups = groups.filter(g => members[g.id]?.includes(user?.id))
  const discoverGroups = groups.filter(g => !members[g.id]?.includes(user?.id))
  const displayGroups = tab === 'mine' ? myGroups : discoverGroups

  return (
    <main style={{padding:'24px 20px', maxWidth:'900px', margin:'0 auto'}}>

      {/* HEADER */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <div>
          <h1 style={{fontSize:'26px', fontWeight:'800', fontFamily:'Syne, sans-serif', letterSpacing:'-0.5px', marginBottom:'2px'}}>Groups</h1>
          <p style={{fontSize:'13px', color:'var(--text-3)'}}>Find your community</p>
        </div>
        <button
          onMouseDown={() => setShowCreate(!showCreate)}
          style={{padding:'10px 18px', background:'var(--green)', color:'white', border:'none', borderRadius:'100px', fontWeight:'600', fontSize:'14px', cursor:'pointer', boxShadow:'0 2px 8px rgba(29,158,117,0.3)'}}
        >
          {showCreate ? '✕ Cancel' : '+ Create'}
        </button>
      </div>

      {/* CREATE FORM */}
      {showCreate && (
        <div style={{background:'white', borderRadius:'var(--radius)', padding:'24px', marginBottom:'20px', boxShadow:'var(--shadow)', border:'1px solid var(--border)'}}>
          <h2 style={{fontSize:'18px', fontWeight:'700', fontFamily:'Syne, sans-serif', marginBottom:'16px'}}>New group</h2>
          {message && <p style={{marginBottom:'12px', color:'#C04A20', fontSize:'13px', background:'#FAECE7', padding:'10px 14px', borderRadius:'8px'}}>{message}</p>}

          <div style={{marginBottom:'14px'}}>
            <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'var(--text-2)'}}>Name *</p>
            <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Surfers Bondi..." />
          </div>

          <div style={{marginBottom:'14px'}}>
            <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'var(--text-2)'}}>Category</p>
            <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div style={{marginBottom:'20px'}}>
            <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'var(--text-2)'}}>Description</p>
            <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="What is this group about?" rows={2} style={{resize:'none'}} />
          </div>

          <div style={{display:'flex', gap:'10px'}}>
            <button onMouseDown={createGroup} disabled={saving} style={{flex:1, padding:'12px', background:'var(--green)', color:'white', border:'none', borderRadius:'var(--radius-sm)', fontSize:'15px', fontWeight:'700', cursor:'pointer'}}>
              {saving ? 'Creating...' : 'Create group →'}
            </button>
            <button onMouseDown={() => setShowCreate(false)} style={{padding:'12px 20px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:'15px', cursor:'pointer'}}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* TABS */}
      <div style={{display:'flex', gap:'4px', background:'white', borderRadius:'var(--radius-sm)', padding:'4px', marginBottom:'20px', width:'fit-content', border:'1px solid var(--border)'}}>
        {(['discover', 'mine'] as const).map(t => (
          <button
            key={t}
            onMouseDown={() => setTab(t)}
            style={{
              padding:'7px 18px', borderRadius:'8px', border:'none',
              background: tab === t ? 'var(--green)' : 'transparent',
              color: tab === t ? 'white' : 'var(--text-3)',
              fontWeight: tab === t ? '600' : '400',
              fontSize:'13px', cursor:'pointer',
              boxShadow: tab === t ? '0 2px 8px rgba(29,158,117,0.3)' : 'none'
            }}
          >
            {t === 'discover' ? 'Discover' : `My groups (${myGroups.length})`}
          </button>
        ))}
      </div>

      {/* GROUPS GRID */}
      {displayGroups.length === 0 ? (
        <div style={{textAlign:'center', padding:'60px 20px', color:'var(--text-3)'}}>
          <div style={{fontSize:'48px', marginBottom:'16px'}}>{tab === 'mine' ? '👥' : '🔍'}</div>
          <h2 style={{fontSize:'20px', fontWeight:'700', fontFamily:'Syne, sans-serif', marginBottom:'8px'}}>
            {tab === 'mine' ? 'No groups yet' : 'No groups to discover'}
          </h2>
          <p style={{fontSize:'14px'}}>{tab === 'mine' ? 'Join a group or create one!' : 'Be the first to create a group!'}</p>
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'14px'}}>
          {displayGroups.map(group => {
            const isJoined = members[group.id]?.includes(user?.id)
            const count = members[group.id]?.length || 0
            const isLoading = loadingJoin === group.id
            const cfg = CATEGORY_CONFIG[group.category] || { icon:'👥', bg:'#E1F5EE', color:'#1D9E75' }

            return (
              <div
                key={group.id}
                onMouseDown={() => window.location.href = `/groups/${group.id}`}
                style={{background:'white', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'20px', boxShadow:'var(--shadow)', cursor:'pointer'}}
              >
                <div style={{width:'46px', height:'46px', borderRadius:'12px', background: cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', marginBottom:'12px'}}>
                  {cfg.icon}
                </div>
                <h3 style={{fontSize:'16px', fontWeight:'700', fontFamily:'Syne, sans-serif', marginBottom:'4px'}}>{group.name}</h3>
                <p style={{fontSize:'11px', fontWeight:'700', color: cfg.color, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'8px'}}>{group.category}</p>
                {group.description && (
                  <p style={{fontSize:'13px', color:'var(--text-2)', lineHeight:'1.5', marginBottom:'14px', display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden', wordBreak:'break-word'}}>
                    {group.description}
                  </p>
                )}
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'12px', borderTop:'1px solid var(--border)'}}>
                  <span style={{fontSize:'13px', color:'var(--text-3)'}}>👥 {count} members</span>
                  <button
                    onMouseDown={(e) => toggleJoin(group.id, e)}
                    disabled={isLoading}
                    style={{
                      padding:'7px 16px',
                      background: isJoined ? 'var(--green-light)' : 'var(--green)',
                      color: isJoined ? 'var(--green-dark)' : 'white',
                      border:'none', borderRadius:'100px',
                      fontSize:'13px', fontWeight:'600', cursor:'pointer',
                      boxShadow: isJoined ? 'none' : '0 2px 8px rgba(29,158,117,0.3)'
                    }}
                  >
                    {isLoading ? '...' : isJoined ? '✓ Joined' : 'Join'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}