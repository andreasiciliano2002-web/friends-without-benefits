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

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [attended, setAttended] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [tab, setTab] = useState<'events' | 'attended' | 'groups'>('events')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
      else setCurrentUser(data.user)
    })
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', params.id)
      .single()
    if (p) setProfile(p)

    const { data: created } = await supabase
      .from('events')
      .select('id, title, category, date, location')
      .eq('creator_id', params.id)
      .order('date', { ascending: false })
    if (created) setEvents(created)

    const { data: groupMembers } = await supabase
      .from('group_members')
      .select('group_id, groups(id, name, category, description)')
      .eq('user_id', params.id)
    if (groupMembers) setGroups(groupMembers.map((m: any) => m.groups).filter(Boolean))

    const { data: attendedData } = await supabase
      .from('event_attendees')
      .select('event_id, events(id, title, category, date, location)')
      .eq('user_id', params.id)
    if (attendedData) setAttended(attendedData.map((a: any) => a.events).filter(Boolean))
  }

  const colors = ['#9FE1CB', '#F5C4B3', '#B5D4F4', '#CECBF6', '#FAC775']
  const bg = colors[params.id.charCodeAt(0) % colors.length]

  if (!profile) return (
    <main style={{padding:'32px 24px', fontFamily:'sans-serif', textAlign:'center', color:'var(--text-3)'}}>
      Loading...
    </main>
  )

  const isMe = currentUser?.id === params.id
  const showAttended = profile.show_attended || isMe

  const tabs = [
    { key: 'events', label: `Activities Created (${events.length})` },
    ...(showAttended ? [{ key: 'attended', label: `Activities Attended (${attended.length})` }] : []),
    { key: 'groups', label: `Groups Joined (${groups.length})` },
  ]

  return (
    <main style={{padding:'24px', maxWidth:'600px', margin:'0 auto', fontFamily:'sans-serif'}}>

      <a href="/explore" style={{color:'var(--text-3)', textDecoration:'none', fontSize:'14px', display:'inline-flex', alignItems:'center', gap:'6px', marginBottom:'20px'}}>
        ← Back
      </a>

      {/* PROFILE HEADER */}
      <div style={{background:'white', borderRadius:'var(--radius)', padding:'28px', boxShadow:'var(--shadow)', border:'1px solid var(--border)', marginBottom:'16px', textAlign:'center'}}>
        <div style={{width:'88px', height:'88px', borderRadius:'50%', background:bg, overflow:'hidden', margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', fontWeight:'700', color:'#333'}}>
          {profile.avatar_url
            ? <img src={profile.avatar_url} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="avatar" />
            : (profile.display_name?.[0]?.toUpperCase() || '?')}
        </div>

        <h1 style={{fontSize:'22px', fontWeight:'800', fontFamily:'Syne, sans-serif', marginBottom:'4px'}}>{profile.display_name || 'Anonymous'}</h1>
        {profile.location && <p style={{fontSize:'14px', color:'var(--text-3)', marginBottom:'12px'}}>📍 {profile.location}</p>}
        {profile.bio && <p style={{fontSize:'14px', color:'var(--text-2)', lineHeight:'1.6', marginBottom:'16px'}}>{profile.bio}</p>}

        {profile.interests?.length > 0 && (
          <div style={{display:'flex', flexWrap:'wrap', gap:'8px', justifyContent:'center', marginBottom:'16px'}}>
            {profile.interests.map((interest: string) => (
              <span key={interest} style={{padding:'5px 12px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'100px', fontSize:'13px', color:'var(--text-2)'}}>
                {interest}
              </span>
            ))}
          </div>
        )}

        {isMe && (
          <a href="/profile" style={{display:'inline-block', padding:'10px 20px', background:'var(--green)', color:'white', borderRadius:'100px', textDecoration:'none', fontSize:'14px', fontWeight:'600'}}>
            Edit my profile
          </a>
        )}
      </div>

      {/* TABS */}
      <div style={{display:'flex', gap:'4px', background:'white', borderRadius:'var(--radius-sm)', padding:'4px', marginBottom:'16px', border:'1px solid var(--border)', overflowX:'auto'}}>
        {tabs.map(t => (
          <button
            key={t.key}
            onMouseDown={() => setTab(t.key as any)}
            style={{padding:'7px 14px', borderRadius:'8px', border:'none', background: tab === t.key ? 'var(--green)' : 'transparent', color: tab === t.key ? 'white' : 'var(--text-3)', fontWeight: tab === t.key ? '600' : '400', fontSize:'12px', cursor:'pointer', whiteSpace:'nowrap'}}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{background:'white', borderRadius:'var(--radius)', padding:'24px', boxShadow:'var(--shadow)', border:'1px solid var(--border)'}}>

        {tab === 'events' && (
          <>
            <h2 style={{fontSize:'18px', fontWeight:'700', fontFamily:'Syne, sans-serif', marginBottom:'16px'}}>Activities Created ({events.length})</h2>
            {events.length === 0 ? (
              <div style={{textAlign:'center', padding:'24px', color:'var(--text-3)'}}>
                <div style={{fontSize:'32px', marginBottom:'8px'}}>🗺️</div>
                <p style={{fontSize:'14px'}}>{isMe ? 'You have not created any activities yet' : 'No activities created yet'}</p>
                {isMe && <a href="/create" style={{display:'inline-block', marginTop:'12px', padding:'10px 20px', background:'var(--green)', color:'white', borderRadius:'100px', textDecoration:'none', fontSize:'14px', fontWeight:'600'}}>Create your first activity →</a>}
              </div>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                {events.map(event => {
                  const cfg = CATEGORY_CONFIG[event.category] || { icon:'🌍', bg:'#E1F5EE', color:'#1D9E75' }
                  return (
                    <div key={event.id} onMouseDown={() => window.location.href = `/events/${event.id}`} style={{display:'flex', alignItems:'center', gap:'12px', padding:'12px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', cursor:'pointer'}}>
                      <div style={{width:'40px', height:'40px', borderRadius:'10px', background: cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0}}>{cfg.icon}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'14px', fontWeight:'600'}}>{event.title}</div>
                        <div style={{fontSize:'12px', color:'var(--text-3)'}}>📅 {event.date} · 📍 {event.location}</div>
                      </div>
                      <span style={{fontSize:'18px', color:'var(--text-3)'}}>→</span>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {tab === 'attended' && showAttended && (
          <>
            <h2 style={{fontSize:'18px', fontWeight:'700', fontFamily:'Syne, sans-serif', marginBottom:'16px'}}>Activities Attended ({attended.length})</h2>
            {attended.length === 0 ? (
              <div style={{textAlign:'center', padding:'24px', color:'var(--text-3)'}}>
                <div style={{fontSize:'32px', marginBottom:'8px'}}>🎯</div>
                <p style={{fontSize:'14px'}}>No activities attended yet</p>
              </div>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                {attended.map(event => {
                  const cfg = CATEGORY_CONFIG[event.category] || { icon:'🌍', bg:'#E1F5EE', color:'#1D9E75' }
                  return (
                    <div key={event.id} onMouseDown={() => window.location.href = `/events/${event.id}`} style={{display:'flex', alignItems:'center', gap:'12px', padding:'12px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', cursor:'pointer'}}>
                      <div style={{width:'40px', height:'40px', borderRadius:'10px', background: cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0}}>{cfg.icon}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'14px', fontWeight:'600'}}>{event.title}</div>
                        <div style={{fontSize:'12px', color:'var(--text-3)'}}>📅 {event.date} · 📍 {event.location}</div>
                      </div>
                      <span style={{fontSize:'18px', color:'var(--text-3)'}}>→</span>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {tab === 'groups' && (
          <>
            <h2 style={{fontSize:'18px', fontWeight:'700', fontFamily:'Syne, sans-serif', marginBottom:'16px'}}>Groups Joined ({groups.length})</h2>
            {groups.length === 0 ? (
              <div style={{textAlign:'center', padding:'24px', color:'var(--text-3)'}}>
                <div style={{fontSize:'32px', marginBottom:'8px'}}>👥</div>
                <p style={{fontSize:'14px'}}>{isMe ? 'You have not joined any groups yet' : 'Not in any groups yet'}</p>
                {isMe && <a href="/groups" style={{display:'inline-block', marginTop:'12px', padding:'10px 20px', background:'var(--green)', color:'white', borderRadius:'100px', textDecoration:'none', fontSize:'14px', fontWeight:'600'}}>Discover groups →</a>}
              </div>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                {groups.map(group => {
                  const cfg = CATEGORY_CONFIG[group.category] || { icon:'👥', bg:'#E1F5EE', color:'#1D9E75' }
                  return (
                    <div key={group.id} onMouseDown={() => window.location.href = `/groups/${group.id}`} style={{display:'flex', alignItems:'center', gap:'12px', padding:'12px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', cursor:'pointer'}}>
                      <div style={{width:'40px', height:'40px', borderRadius:'10px', background: cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0}}>{cfg.icon}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'14px', fontWeight:'600'}}>{group.name}</div>
                        <div style={{fontSize:'12px', fontWeight:'600', color: cfg.color, textTransform:'uppercase', letterSpacing:'0.04em'}}>{group.category}</div>
                      </div>
                      <span style={{fontSize:'18px', color:'var(--text-3)'}}>→</span>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}