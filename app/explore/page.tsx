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
    // Carica il genere dell'utente
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
      // Filtra eventi in base al genere:
      // - man non vede women only
      // - woman non vede men only
      // - other (o non specificato) vede tutto
      const filtered = eventsData.filter(event => {
        if (!event.gender_filter || event.gender_filter === 'everyone') return true
        if (gender === 'man') return event.gender_filter !== 'women'
        if (gender === 'woman') return event.gender_filter !== 'men'
        return true // other o null: vede tutto
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

  const filteredEvents = filter === 'all' ? events : events.filter(e => e.category === filter)

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
        <p style={{fontSize:'13px', color:'var(--text-3)'}}>📍 Sydney · {filteredEvents.length} upcoming events</p>
      </div>

      {/* FILTERS */}
      <div style={{display:'flex', gap:'8px', marginBottom:'20px', overflowX:'auto', paddingBottom:'4px'}}>
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

      {/* EVENTS */}
      {filteredEvents.length === 0 ? (
        <div style={{textAlign:'center', padding:'60px 20px', color:'var(--text-3)'}}>
          <div style={{fontSize:'48px', marginBottom:'16px'}}>🌍</div>
          <h2 style={{fontSize:'20px', fontWeight:'700', marginBottom:'8px', fontFamily:'Syne, sans-serif'}}>No upcoming events</h2>
          <p style={{fontSize:'14px'}}>Be the first to create one!</p>
          <a href="/create" style={{display:'inline-block', marginTop:'20px', padding:'12px 24px', background:'var(--green)', color:'white', borderRadius:'100px', textDecoration:'none', fontWeight:'600', fontSize:'14px'}}>
            Create first event →
          </a>
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
                  padding:'18px',
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
                {/* BADGES */}
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

                {/* TITLE */}
                <h3 style={{fontSize:'16px', fontWeight:'700', marginBottom:'4px', lineHeight:'1.3', fontFamily:'Syne, sans-serif'}}>
                  {event.title}
                </h3>

                {/* HOSTED BY */}
                {creatorName && (
                  <p style={{fontSize:'12px', color:'var(--text-3)', marginBottom:'8px'}}>
                    by <span style={{fontWeight:'500', color:'var(--text-2)'}}>{creatorName}</span>
                  </p>
                )}

                {/* META */}
                <div style={{display:'flex', flexDirection:'column', gap:'4px', marginBottom:'14px'}}>
                  <span style={{fontSize:'13px', color:'var(--text-2)'}}>📅 {event.date} {event.time && `· ${event.time}`}</span>
                  <span style={{fontSize:'13px', color:'var(--text-2)'}}>📍 {event.location}</span>
                </div>

                {event.description && (
                  <p style={{fontSize:'13px', color:'var(--text-3)', marginBottom:'14px', lineHeight:'1.5', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>
                    {event.description}
                  </p>
                )}

                {/* FOOTER */}
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
            )
          })}
        </div>
      )}
    </main>
  )
}