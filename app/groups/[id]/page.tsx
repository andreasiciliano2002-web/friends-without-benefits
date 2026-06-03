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
  const [members, setMembers] = useState<any[]>([])
  const [joined, setJoined] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
      else { setUser(data.user); loadGroup(data.user.id) }
    })
  }, [])

  const loadGroup = async (userId: string) => {
    const { data: groupData } = await supabase
      .from('groups')
      .select('*')
      .eq('id', params.id)
      .single()
    if (groupData) setGroup(groupData)

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

  if (!group) return (
    <main style={{padding:'32px 24px', fontFamily:'sans-serif', textAlign:'center', color:'var(--text-3)'}}>
      Loading...
    </main>
  )

  const cfg = CATEGORY_CONFIG[group.category] || { icon: '👥', bg: '#E1F5EE', color: '#1D9E75' }
  const avatarColors = ['#9FE1CB', '#F5C4B3', '#B5D4F4', '#CECBF6', '#FAC775']

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
        <div style={{display:'flex', alignItems:'center', gap:'16px', marginBottom:'16px'}}>
          <div style={{width:'60px', height:'60px', borderRadius:'16px', background: cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', flexShrink:0}}>
            {cfg.icon}
          </div>
          <div style={{flex:1, minWidth:0}}>
            <h1 style={{fontSize:'22px', fontWeight:'800', fontFamily:'Syne, sans-serif', marginBottom:'4px'}}>{group.name}</h1>
            <span style={{fontSize:'11px', fontWeight:'700', color: cfg.color, textTransform:'uppercase', letterSpacing:'0.04em'}}>{group.category}</span>
          </div>
        </div>

        {group.description && (
          <p style={{fontSize:'14px', color:'var(--text-2)', lineHeight:'1.6', marginBottom:'16px'}}>{group.description}</p>
        )}

        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'16px', borderTop:'1px solid var(--border)', marginBottom:'12px', gap:'12px'}}>
          <span style={{fontSize:'14px', color:'var(--text-3)', flexShrink:0}}>👥 {members.length} members</span>
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
              flexShrink:0,
            }}
          >
            {loading ? '...' : joined ? '✓ Member' : 'Join group →'}
          </button>
        </div>

        <a 
          href={`/groups/${params.id}/chat`}
          style={{display:'block', width:'100%', padding:'14px', background:'var(--bg)', color:'var(--text)', borderRadius:'100px', fontSize:'14px', fontWeight:'700', cursor:'pointer', textAlign:'center', textDecoration:'none', border:'1px solid var(--border)', boxSizing:'border-box'}}
        >
          💬 Open group chat
        </a>
      </div>

      {/* MEMBERS */}
      <div style={{background:'white', borderRadius:'var(--radius)', padding:'24px', boxShadow:'var(--shadow)', border:'1px solid var(--border)'}}>
        <h2 style={{fontSize:'18px', fontWeight:'700', fontFamily:'Syne, sans-serif', marginBottom:'16px'}}>
          Members ({members.length})
        </h2>

        {members.length === 0 ? (
          <div style={{textAlign:'center', padding:'24px', color:'var(--text-3)'}}>
            <div style={{fontSize:'32px', marginBottom:'8px'}}>👋</div>
            <p style={{fontSize:'14px'}}>Be the first to join!</p>
          </div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            {members.map((m: any, i: number) => {
              const profile = m.profiles
              const name = profile?.display_name || 'Anonymous'
              const initial = name[0]?.toUpperCase() || '?'
              const bg = avatarColors[i % avatarColors.length]

              return (
                <div
                  key={m.user_id}
                  onMouseDown={() => window.location.href = `/users/${m.user_id}`}
                  style={{display:'flex', alignItems:'center', gap:'12px', padding:'12px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', cursor:'pointer'}}
                >
                  <div style={{width:'42px', height:'42px', borderRadius:'50%', overflow:'hidden', flexShrink:0, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', fontWeight:'700', color:'#333'}}>
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} style={{width:'100%', height:'100%', objectFit:'cover'}} alt={name} />
                      : initial}
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:'14px', fontWeight:'600'}}>{name}</div>
                    {profile?.location && (
                      <div style={{fontSize:'12px', color:'var(--text-3)'}}>📍 {profile.location}</div>
                    )}
                    {profile?.interests?.length > 0 && (
                      <div style={{display:'flex', gap:'4px', marginTop:'4px', flexWrap:'wrap'}}>
                        {profile.interests.slice(0, 3).map((interest: string) => (
                          <span key={interest} style={{fontSize:'11px', padding:'2px 8px', background:'var(--bg)', borderRadius:'100px', color:'var(--text-2)'}}>
                            {interest}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span style={{fontSize:'18px', color:'var(--text-3)', flexShrink:0}}>→</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}