'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ExplorePage() {
  const [events, setEvents] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [userGender, setUserGender] = useState<string | null>(null)
  const [attendees, setAttendees] = useState<Record<string, string[]>>({})
  const [loadingJoin, setLoadingJoin] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
      else {
        setUser(data.user)
        loadUserAndEvents(data.user.id)
      }
    })
  }, [])

  const loadUserAndEvents = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('gender')
      .eq('id', userId)
      .single()
    const gender = profile?.gender || null
    setUserGender(gender)
    loadEvents(gender)
  }

  const loadEvents = async (gender: string | null) => {
    const today = new Date().toISOString().split('T')[0]
    const { data: eventsData } = await supabase
      .from('events')
      .select('*, profiles!events_creator_id_fkey(display_name)')
      .gte('date', today)
      .order('date', { ascending: true })

    if (eventsData) {
      const filtered = eventsData.filter(event => {
        if (!event.gender_filter || event.gender_filter === 'everyone') return true
        if (gender === 'man') return event.gender_filter !== 'women'
        if (gender === 'woman') return event.gender_filter !== 'men'
        return true
      })
      setEvents(filtered)

      const { data: attendeesData } = await supabase
        .from('event_attendees')
        .select('event_id, user_id')
      if (attendeesData) {
        const map: Record<string, string[]> = {}
        attendeesData.forEach(a => {
          if (!map[a.event_id]) map[a.event_id] = []
          map[a.event_id].push(a.user_id)
        })
        setAttendees(map)
      }
    }
  }

  const toggleJoin = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) return
    const isJoined = attendees[eventId]?.includes(user.id)
    if (!isJoined) {
      const event = events.find(ev => ev.id === eventId)
      if (event?.gender_filter && event.gender_filter !== 'everyone') {
        const { data: profile } = await supabase
          .from('profiles').select('gender').eq('id', user.id).single()
        const allowed =
          (event.gender_filter === 'women' && profile?.gender === 'woman') ||
          (event.gender_filter === 'men' && profile?.gender === 'man')
        if (!allowed) {
          alert(`This event is ${event.gender_filter === 'women' ? 'for women only 👩' : 'for men only 👨'}`)
          return
        }
      }
    }
    setLoadingJoin(eventId)
    if (isJoined) {
      await supabase.from('event_attendees').delete().eq('event_id', eventId).eq('user_id', user.id)
    } else {
      await supabase.from('event_attendees').insert({ event_id: eventId, user_id: user.id })
    }
    await loadEvents(userGender)
    setLoadingJoin(null)
  }

  const categoryConfig: Record<string, { color: string; bg: string; icon: string }> = {
    Sport:   { color: '#185FA5', bg: '#E6F1FB', icon: '🏄' },
    Food:    { color: '#C04A20', bg: '#FAECE7', icon: '🍜' },
    Culture: { color: '#9A6200', bg: '#FEF3C7', icon: '🎨' },
    Outdoor: { color: '#1D9E75', bg: '#E1F5EE', icon: '🌿' },
    Music:   { color: '#534AB7', bg: '#EEEDFE', icon: '🎵' },
  }

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'Sport', label: '🏄 Sport' },
    { value: 'Food', label: '🍜 Food' },
    { value: 'Culture', label: '🎨 Culture' },
    { value: 'Outdoor', label: '🌿 Outdoor' },
    { value: 'Music', label: '🎵 Music' },
  ]

  const dateFilters = [
    { value: 'all', label: '📅 Any time' },
    { value: 'today', label: '☀️ Today' },
    { value: 'weekend', label: '🎉 Weekend' },
    { value: 'week', label: '📆 This week' },
  ]

  const getDateRange = () => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const dayOfWeek = now.getDay()
    const daysToSat = dayOfWeek === 6 ? 0 : (6 - dayOfWeek)
    const sat = new Date(now)
    sat.setDate(now.getDate() + daysToSat)
    const sun = new Date(sat)
    sun.setDate(sat.getDate() + 1)
    const satStr = sat.toISOString().split('T')[0]
    const sunStr = sun.toISOString().split('T')[0]
    const endOfWeek = new Date(now)
    endOfWeek.setDate(now.getDate() + (7 - dayOfWeek))
    const endOfWeekStr = endOfWeek.toISOString().split('T')[0]
    return { today, satStr, sunStr, endOfWeekStr }
  }

  const { today, satStr, sunStr, endOfWeekStr } = getDateRange()

  const filteredEvents = events
    .filter(e => filter === 'all' || e.category === filter)
    .filter(e => {
      if (dateFilter === 'all') return true
      if (dateFilter === 'today') return e.date === today
      if (dateFilter === 'weekend') return e.date === satStr || e.date === sunStr
      if (dateFilter === 'week') return e.date >= today && e.date <= endOfWeekStr
      return true
    })
    .filter(e => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        e.title?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q)
      )
    })

  return (
    <main style={{
      padding: '24px 20px',
      paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
      maxWidth: '900px',
      margin: '0 auto',
    }}>

      {/* HEADER */}
      <div style={{marginBottom:'20px'}}>
        <h1 style={{fontSize:'26px', fontWeight:'800', fontFamily:'Syne, sans-serif', letterSpacing:'-0.5px', marginBottom:'2px'}}>
          Friends Without Benefits
        </h1>
        <p style={{fontSize:'13px', color:'var(--text-3)'}}>🌍 {filteredEvents.length} upcoming events near you</p>
      </div>

      {/* SEARCH BAR */}
      <div style={{position:'relative', marginBottom:'16px'}}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search events, places..."
          style={{paddingLeft:'40px', background:'white'}}
        />
        <span style={{position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', fontSize:'16px', pointerEvents:'none'}}>
          🔍
        </span>
        {search && (
          <span
            onMouseDown={() => setSearch('')}
            style={{position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', fontSize:'16px', cursor:'pointer', color:'var(--text-3)'}}
          >
            ✕
          </span>
        )}
      </div>

      {/* CATEGORY FILTERS */}
      <div style={{display:'flex', gap:'8px', marginBottom:'10px', overflowX:'auto', paddingBottom:'4px'}}>
        {filters.map(f => (
          <button
            key={f.value}
            onMouseDown={() => setFilter(f.value)}
            style={{
              padding:'7px 16px', borderRadius:'100px',
              border:`1.5px solid ${filter === f.value ? 'var(--green)' : 'var(--border)'}`,
              background: filter === f.value ? 'var(--green)' : 'white',
              color: filter === f.value ? 'white' : 'var(--text-2)',
              fontSize:'13px', fontWeight:'500', cursor:'pointer',
              whiteSpace:'nowrap', flexShrink:0,
              boxShadow: filter === f.value ? '0 2px 8px rgba(29,158,117,0.3)' : 'none',
              minHeight:'auto',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* DATE FILTERS */}
      <div style={{display:'flex', gap:'8px', marginBottom:'20px', overflowX:'auto', paddingBottom:'4px'}}>
        {dateFilters.map(f => (
          <button
            key={f.value}
            onMouseDown={() => setDateFilter(f.value)}
            style={{
              padding:'7px 16px', borderRadius:'100px',
              border:`1.5px solid ${dateFilter === f.value ? '#534AB7' : 'var(--border)'}`,
              background: dateFilter === f.value ? '#534AB7' : 'white',
              color: dateFilter === f.value ? 'white' : 'var(--text-2)',
              fontSize:'13px', fontWeight:'500', cursor:'pointer',
              whiteSpace:'nowrap', flexShrink:0,
              boxShadow: dateFilter === f.value ? '0 2px 8px rgba(83,74,183,0.3)' : 'none',
              minHeight:'auto',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* EVENTS */}
      {filteredEvents.length === 0 ? (
        <div style={{textAlign:'center', padding:'60px 20px', color:'var(--text-3)', maxWidth:'320px', margin:'0 auto'}}>
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{margin:'0 auto 24px', display:'block'}}>
            <circle cx="60" cy="60" r="60" fill="#E1F5EE"/>
            <circle cx="60" cy="45" r="16" fill="#9FE1CB"/>
            <path d="M30 95c0-16.569 13.431-30 30-30s30 13.431 30 30" stroke="#1D9E75" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <circle cx="85" cy="35" r="8" fill="#B5D4F4"/>
            <circle cx="35" cy="38" r="6" fill="#FAC775"/>
            <path d="M60 72v8M56 76h8" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h2 style={{fontSize:'20px', fontWeight:'800', marginBottom:'8px', fontFamily:'Syne, sans-serif', color:'var(--text)'}}>
            {search ? 'No results found' : 'No upcoming events'}
          </h2>
          <p style={{fontSize:'14px', lineHeight:'1.6', marginBottom:'24px'}}>
            {search ? `No events matching "${search}"` : dateFilter !== 'all' ? 'Try a different time range' : 'Be the first to create something great!'}
          </p>
          {!search && dateFilter === 'all' && (
            <a href="/my-events" style={{display:'inline-block', padding:'12px 24px', background:'var(--green)', color:'white', borderRadius:'100px', textDecoration:'none', fontWeight:'600', fontSize:'14px', boxShadow:'0 2px 8px rgba(29,158,117,0.3)'}}>
              Create first event →
            </a>
          )}
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(290px, 1fr))', gap:'14px'}}>
          {filteredEvents.map(event => {
            const joined = attendees[event.id]?.includes(user?.id)
            const count = attendees[event.id]?.length || 0
            const spots = event.max_attendees - count
            const cfg = categoryConfig[event.category] || { color:'var(--green)', bg:'var(--green-light)', icon:'🌍' }
            const isLoading = loadingJoin === event.id
            const creatorName = event.profiles?.display_name || null

            return (
              <div
                key={event.id}
                onMouseDown={() => window.location.href = `/events/${event.id}`}
                style={{
                  background:'white',
                  border:'1px solid var(--border)',
                  borderRadius:'var(--radius)',
                  overflow:'hidden',
                  cursor:'pointer',
                  boxShadow:'var(--shadow)',
                  transition:'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)'
                }}
              >
                {event.cover_url && (
                  <img
                    src={event.cover_url}
                    style={{width:'100%', height:'140px', objectFit:'cover', display:'block'}}
                    alt={event.title}
                  />
                )}

                <div style={{padding:'18px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
                    <div style={{display:'flex', gap:'6px', flexWrap:'wrap'}}>
                      <span style={{fontSize:'11px', fontWeight:'700', color: cfg.color, background: cfg.bg, padding:'3px 10px', borderRadius:'100px', textTransform:'uppercase', letterSpacing:'0.04em'}}>
                        {cfg.icon} {event.category}
                      </span>
                      {event.event_type === 'group' && (
                        <span style={{fontSize:'11px', fontWeight:'600', color:'#9A6200', background:'#FEF3C7', padding:'3px 10px', borderRadius:'100px'}}>👥 Group</span>
                      )}
                      {event.gender_filter && event.gender_filter !== 'everyone' && (
                        <span style={{fontSize:'11px', fontWeight:'600', color:'#534AB7', background:'#EEEDFE', padding:'3px 10px', borderRadius:'100px'}}>
                          {event.gender_filter === 'women' ? '👩 Women' : '👨 Men'}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 style={{fontSize:'16px', fontWeight:'700', marginBottom:'4px', lineHeight:'1.3', fontFamily:'Syne, sans-serif'}}>
                    {event.title}
                  </h3>

                  {creatorName && (
                    <p style={{fontSize:'12px', color:'var(--text-3)', marginBottom:'8px'}}>
                      by <span style={{fontWeight:'500', color:'var(--text-2)'}}>{creatorName}</span>
                    </p>
                  )}

                  <div style={{display:'flex', flexDirection:'column', gap:'4px', marginBottom:'14px'}}>
                    <span style={{fontSize:'13px', color:'var(--text-2)'}}>📅 {event.date} {event.time && `· ${event.time}`}</span>
                    <span style={{fontSize:'13px', color:'var(--text-2)'}}>📍 {event.location}</span>
                  </div>

                  {event.description && (
                    <p style={{fontSize:'13px', color:'var(--text-3)', marginBottom:'14px', lineHeight:'1.5', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>
                      {event.description}
                    </p>
                  )}

                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'12px', borderTop:'1px solid var(--border)', gap:'8px'}}>
                    <div style={{display:'flex', flexDirection:'column', gap:'2px'}}>
                      <span style={{fontSize:'12px', color:'var(--text-3)'}}>{count} joined</span>
                      <span style={{fontSize:'12px', color: spots <= 2 ? '#C04A20' : 'var(--green)', fontWeight:'600'}}>
                        {spots} spots left
                      </span>
                    </div>
                    <button
                      onMouseDown={(e) => toggleJoin(event.id, e)}
                      disabled={isLoading || (!joined && spots === 0)}
                      style={{
                        padding:'8px 18px',
                        background: joined ? 'var(--green-light)' : 'var(--green)',
                        color: joined ? 'var(--green-dark)' : 'white',
                        border:'none', borderRadius:'100px',
                        fontSize:'13px', fontWeight:'600', cursor:'pointer',
                        boxShadow: joined ? 'none' : '0 2px 8px rgba(29,158,117,0.3)',
                        minHeight:'auto', flexShrink:0,
                      }}
                    >
                      {isLoading ? '...' : joined ? '✓ Joined' : spots === 0 ? 'Full' : 'Join'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}