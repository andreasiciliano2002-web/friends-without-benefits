'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const CATEGORY_CONFIG: Record<string, { icon: string; bg: string; color: string }> = {
  Sport:   { icon: '🏄', bg: '#E6F1FB', color: '#185FA5' },
  Food:    { icon: '🍕', bg: '#FAECE7', color: '#C04A20' },
  Culture: { icon: '🎨', bg: '#FEF3C7', color: '#9A6200' },
  Outdoor: { icon: '🌿', bg: '#E1F5EE', color: '#1D9E75' },
  Music:   { icon: '🎵', bg: '#EEEDFE', color: '#534AB7' },
}

export default function GroupPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<any>(null)
  const [group, setGroup] = useState<any>(null)
  const [creator, setCreator] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [joined, setJoined] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
      else { setUser(data.user); loadGroup(data.user.id) }
    })
  }, [])

  const loadGroup = async (userId: string) => {
    const { data: groupData } = await supabase
      .from('groups')
      .select('*, profiles!groups_creator_id_fkey(display_name, avatar_url)')
      .eq('id', params.id)
      .single()
    if (groupData) {
      setGroup(groupData)
      setEditForm(groupData)
      setCreator(groupData.profiles || null)
    }

    const { data: membersData } = await supabase
      .from('group_members')
      .select('user_id, profiles(display_name, avatar_url, location, interests)')
      .eq('group_id', params.id)
    if (membersData) {
      setMembers(membersData)
      setJoined(membersData.some((m: any) => m.user_id === userId))
    }
  }

  const toggleJoin = async () => {
    if (!user) return
    setLoading(true)
    if (joined) {
      await supabase.from('group_members').delete().eq('group_id', params.id).eq('user_id', user.id)
    } else {
      await supabase.from('group_members').insert({ group_id: params.id, user_id: user.id })
    }
    await loadGroup(user.id)
    setLoading(false)
  }

  const deleteGroup = async () => {
    if (!confirm('Delete this group? This cannot be undone.')) return
    setDeleting(true)
    await supabase.from('group_members').delete().eq('group_id', params.id)
    await supabase.from('groups').delete().eq('id', params.id)
    window.location.href = '/groups'
  }

  const saveEdit = async () => {
    setSaving(true)
    const { error } = await supabase.from('groups').update({
      name: editForm.name,
      description: editForm.description,
      category: editForm.category,
    }).eq('id', params.id)
    if (error) {
      alert('Error: ' + error.message)
      setSaving(false)
      return
    }
    setEditing(false)
    await loadGroup(user.id)
    setSaving(false)
  }

  if (!group) return (
    <main style={{padding:'32px 24px', fontFamily:'sans-serif', textAlign:'center', color:'var(--text-3)'}}>
      Loading...
    </main>
  )

  const cfg = CATEGORY_CONFIG[group.category] || { icon: '👥', bg: '#E1F5EE', color: '#1D9E75' }
  const avatarColors = ['#9FE1CB', '#F5C4B3', '#B5D4F4', '#CECBF6', '#FAC775']
  const isCreator = user?.id === group.creator_id

  const creatorEntry = { user_id: group.creator_id, isHost: true, profiles: creator }
  const otherMembers = members.filter(m => m.user_id !== group.creator_id)
  const displayMembers = [creatorEntry, ...otherMembers]

  return (
    <main style={{
      padding:'24px 20px',
      paddingBottom:'calc(80px + env(safe-area-inset-bottom))',
      maxWidth:'600px',
      margin:'0 auto',
      fontFamily:'sans-serif',
    }}>

      <a href="/groups" style={{color:'var(--text-3)', textDecoration:'none', fontSize:'14px', display:'inline-flex', alignItems:'center', gap:'6px', marginBottom:'20px'}}>
        ← Back to groups
      </a>

      {/* GROUP HEADER */}
      <div style={{background:'white', borderRadius:'var(--radius)', padding:'24px', boxShadow:'var(--shadow)', border:'1px solid var(--border)', marginBottom:'16px'}}>

        {editing ? (
          <div>
            <h2 style={{fontSize:'18px', fontWeight:'700', fontFamily:'Syne, sans-serif', marginBottom:'16px'}}>Edit group</h2>
            <div style={{marginBottom:'14px'}}>
              <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px'}}>Name</p>
              <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
            </div>
            <div style={{marginBottom:'14px'}}>
              <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px'}}>Category</p>
              <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})}>
                {['Sport','Food','Culture','Outdoor','Music'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{marginBottom:'20px'}}>
              <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px'}}>Description</p>
              <textarea value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} rows={3} style={{resize:'none'}} />
            </div>
            <div style={{display:'flex', gap:'10px'}}>
              <button onClick={saveEdit} disabled={saving} style={{flex:1, padding:'12px', background:'var(--green)', color:'white', border:'none', borderRadius:'var(--radius-sm)', fontSize:'15px', fontWeight:'700', cursor:'pointer'}}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button onMouseDown={() => setEditing(false)} style={{padding:'12px 20px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:'15px', cursor:'pointer'}}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{display:'flex', alignItems:'flex-start', gap:'16px', marginBottom:'16px'}}>
              <div style={{width:'60px', height:'60px', borderRadius:'16px', background: cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', flexShrink:0}}>
                {cfg.icon}
              </div>
              <div style={{flex:1, minWidth:0}}>
                <h1 style={{fontSize:'22px', fontWeight:'800', fontFamily:'Syne, sans-serif', marginBottom:'4px'}}>{group.name}</h1>
                <span style={{fontSize:'11px', fontWeight:'700', color: cfg.color, textTransform:'uppercase', letterSpacing:'0.04em'}}>{group.category}</span>
              </div>
              {isCreator && (
                <div style={{display:'flex', gap:'8px', flexShrink:0}}>
                  <button onMouseDown={() => setEditing(true)} style={{padding:'6px 12px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'100px', fontSize:'12px', fontWeight:'600', cursor:'pointer', minHeight:'auto'}}>✏️ Edit</button>
                  <button onMouseDown={deleteGroup} disabled={deleting} style={{padding:'6px 12px', background:'#FEE2E2', color:'#DC2626', border:'none', borderRadius:'100px', fontSize:'12px', fontWeight:'600', cursor:'pointer', minHeight:'auto'}}>🗑️</button>
                </div>
              )}
            </div>

            {/* CREATED BY */}
            {creator?.display_name && (
              <div
                onMouseDown={() => window.location.href = `/users/${group.creator_id}`}
                style={{display:'inline-flex', alignItems:'center', gap:'7px', marginBottom:'14px', cursor:'pointer', padding:'5px 10px 5px 5px', borderRadius:'100px', border:'1px solid var(--border)', background:'var(--bg)'}}
              >
                <div style={{width:'22px', height:'22px', borderRadius:'50%', overflow:'hidden', background:'#9FE1CB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'700', flexShrink:0}}>
                  {creator.avatar_url
                    ? <img src={creator.avatar_url} style={{width:'100%', height:'100%', objectFit:'cover'}} alt={creator.display_name} />
                    : creator.display_name[0]?.toUpperCase()}
                </div>
                <span style={{fontSize:'12px', color:'var(--text-3)'}}>
                  Created by <span style={{fontWeight:'600', color:'var(--text-2)'}}>{creator.display_name}</span>
                </span>
              </div>
            )}

            {group.description && (
              <p style={{fontSize:'14px', color:'var(--text-2)', lineHeight:'1.6', marginBottom:'16px'}}>{group.description}</p>
            )}

            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'16px', borderTop:'1px solid var(--border)', marginBottom:'12px', gap:'12px'}}>
              <span style={{fontSize:'14px', color:'var(--text-3)', flexShrink:0}}>👥 {members.length} members</span>
              {!isCreator ? (
                <button
                  onMouseDown={toggleJoin}
                  disabled={loading}
                  style={{
                    padding:'10px 24px',
                    background: joined ? 'var(--green-light)' : 'var(--green)',
                    color: joined ? 'var(--green-dark)' : 'white',
                    border:'none', borderRadius:'100px',
                    fontSize:'14px', fontWeight:'700', cursor:'pointer',
                    boxShadow: joined ? 'none' : '0 2px 8px rgba(29,158,117,0.3)',
                    flexShrink:0, minHeight:'auto',
                  }}
                >
                  {loading ? '...' : joined ? '✓ Member' : 'Join group →'}
                </button>
              ) : (
                <span style={{fontSize:'13px', color:'var(--text-3)', padding:'10px 16px', background:'var(--bg)', borderRadius:'100px', border:'1px solid var(--border)'}}>
                  👑 Your group
                </span>
              )}
            </div>

            <a 
              href={`/groups/${params.id}/chat`}
              style={{display:'block', width:'100%', padding:'14px', background:'var(--bg)', color:'var(--text)', borderRadius:'100px', fontSize:'14px', fontWeight:'700', cursor:'pointer', textAlign:'center', textDecoration:'none', border:'1px solid var(--border)', boxSizing:'border-box'}}
            >
              💬 Open group chat
            </a>
          </>
        )}
      </div>

      {/* MEMBERS */}
      <div style={{background:'white', borderRadius:'var(--radius)', padding:'24px', boxShadow:'var(--shadow)', border:'1px solid var(--border)'}}>
        <h2 style={{fontSize:'18px', fontWeight:'700', fontFamily:'Syne, sans-serif', marginBottom:'16px'}}>
          Members ({displayMembers.length})
        </h2>

        {displayMembers.length === 0 ? (
          <div style={{textAlign:'center', padding:'24px', color:'var(--text-3)'}}>
            <div style={{fontSize:'32px', marginBottom:'8px'}}>👋</div>
            <p style={{fontSize:'14px'}}>Be the first to join!</p>
          </div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            {displayMembers.map((m: any, i: number) => {
              const profile = m.profiles
              const name = profile?.display_name || 'Anonymous'
              const initial = name[0]?.toUpperCase() || '?'
              const bg = avatarColors[i % avatarColors.length]

              return (
                <div
                  key={m.user_id}
                  onMouseDown={() => window.location.href = `/users/${m.user_id}`}
                  style={{display:'flex', alignItems:'center', gap:'12px', padding:'12px', border: m.isHost ? '1.5px solid var(--green)' : '1px solid var(--border)', borderRadius:'var(--radius-sm)', cursor:'pointer', background: m.isHost ? 'var(--green-light)' : 'white'}}
                >
                  <div style={{width:'42px', height:'42px', borderRadius:'50%', overflow:'hidden', flexShrink:0, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', fontWeight:'700', color:'#333'}}>
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} style={{width:'100%', height:'100%', objectFit:'cover'}} alt={name} />
                      : initial}
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{display:'flex', alignItems:'center', gap:'6px', marginBottom:'2px', flexWrap:'wrap'}}>
                      <span style={{fontSize:'14px', fontWeight:'600'}}>{name}</span>
                      {m.isHost && (
                        <span style={{fontSize:'10px', fontWeight:'700', color:'var(--green-dark)', background:'var(--green-mid)', padding:'2px 7px', borderRadius:'100px'}}>HOST</span>
                      )}
                    </div>
                    {profile?.location && (
                      <div style={{fontSize:'12px', color:'var(--text-3)'}}>📍 {profile.location}</div>
                    )}
                    {profile?.interests?.length > 0 && (
                      <div style={{display:'flex', gap:'4px', marginTop:'4px', flexWrap:'wrap'}}>
                        {profile.interests.slice(0, 3).map((interest: string) => (
                          <span key={interest} style={{fontSize:'11px', padding:'2px 8px', background:'white', borderRadius:'100px', color:'var(--text-2)', border:'1px solid var(--border)'}}>
                            {interest}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span style={{fontSize:'18px', color: m.isHost ? 'var(--green)' : 'var(--text-3)', flexShrink:0}}>→</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}