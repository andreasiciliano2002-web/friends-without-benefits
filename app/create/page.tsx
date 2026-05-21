'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const CATEGORY_CONFIG: Record<string, { icon: string; bg: string; color: string }> = {
  Sport:   { icon: '🏄', bg: '#E6F1FB', color: '#185FA5' },
  Food:    { icon: '🍕', bg: '#FAECE7', color: '#C04A20' },
  Culture: { icon: '🎨', bg: '#FEF3C7', color: '#9A6200' },
  Outdoor: { icon: '🌿', bg: '#E1F5EE', color: '#1D9E75' },
  Music:   { icon: '🎵', bg: '#EEEDFE', color: '#534AB7' },
}

export default function MyEventsPage() {
  const [user, setUser] = useState<any>(null)
  const [myEvents, setMyEvents] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Sport',
    date: '',
    time: '',
    location: '',
    max_attendees: 10,
    event_type: 'open',
    gender_filter: 'everyone'
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
      else { setUser(data.user); loadMyEvents(data.user.id) }
    })
  }, [])

  const loadMyEvents = async (userId: string) => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('creator_id', userId)
      .order('date', { ascending: true })
    if (data) setMyEvents(data)
  }

  const handleSubmit = async () => {
    if (!form.title || !form.date || !form.location) {
      setMessage('⚠️ Title, date and location are required.')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('events').insert({ ...form, creator_id: user.id })
    if (error) setMessage('Error: ' + error.message)
    else {
      setShowCreate(false)
      setForm({ title: '', description: '', category: 'Sport', date: '', time: '', location: '', max_attendees: 10, event_type: 'open', gender_filter: 'everyone' })
      setMessage('')
      await loadMyEvents(user.id)
    }
    setLoading(false)
  }

  const deleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return
    await supabase.from('events').delete().eq('id', id)
    await loadMyEvents(user.id)
  }

  const update = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }))

  const isPast = (date: string) => date < new Date().toISOString().split('T')[0]

  return (
    <main style={{padding:'24px 20px', maxWidth:'700px', margin:'0 auto', fontFamily:'sans-serif'}}>

      {/* HEADER */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
        <div>
          <h1 style={{fontSize:'26px', fontWeight:'800', fontFamily:'Syne, sans-serif', letterSpacing:'-0.5px', marginBottom:'2px'}}>My Events</h1>
          <p style={{fontSize:'13px', color:'var(--text-3)'}}>Manage your activities</p>
        </div>
        <button
          onMouseDown={() => setShowCreate(!showCreate)}
          style={{padding:'10px 20px', background: showCreate ? 'var(--bg)' : 'var(--green)', color: showCreate ? 'var(--text-2)' : 'white', border: showCreate ? '1px solid var(--border)' : 'none', borderRadius:'100px', fontWeight:'600', fontSize:'14px', cursor:'pointer', boxShadow: showCreate ? 'none' : '0 2px 8px rgba(29,158,117,0.3)'}}
        >
          {showCreate ? '✕ Cancel' : '+ Create new'}
        </button>
      </div>

      {/* CREATE FORM */}
      {showCreate && (
        <div style={{background:'white', borderRadius:'var(--radius)', padding:'24px', marginBottom:'24px', boxShadow:'var(--shadow)', border:'1px solid var(--border)'}}>
          <h2 style={{fontSize:'18px', fontWeight:'700', fontFamily:'Syne, sans-serif', marginBottom:'20px'}}>New event</h2>

          {message && <p style={{marginBottom:'14px', color:'#C04A20', background:'#FAECE7', padding:'10px 14px', borderRadius:'8px', fontSize:'13px'}}>{message}</p>}

          <div style={{marginBottom:'16px'}}>
            <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'8px', color:'var(--text-2)'}}>Event type</p>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
              {['open', 'group'].map(type => (
                <div key={type} onMouseDown={() => update('event_type', type)} style={{padding:'14px', border:`2px solid ${form.event_type === type ? 'var(--green)' : 'var(--border)'}`, background: form.event_type === type ? 'var(--green-light)' : 'white', borderRadius:'var(--radius-sm)', cursor:'pointer', textAlign:'center'}}>
                  <div style={{fontSize:'20px', marginBottom:'4px'}}>{type === 'open' ? '🌍' : '👥'}</div>
                  <div style={{fontSize:'12px', fontWeight:'600', color: form.event_type === type ? 'var(--green-dark)' : 'var(--text-2)'}}>{type === 'open' ? 'Open to everyone' : 'Group looking for people'}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{marginBottom:'16px'}}>
            <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'8px', color:'var(--text-2)'}}>Who can join</p>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px'}}>
              {[{value:'everyone',label:'Everyone',icon:'🌍'},{value:'women',label:'Women only',icon:'👩'},{value:'men',label:'Men only',icon:'👨'}].map(opt => (
                <div key={opt.value} onMouseDown={() => update('gender_filter', opt.value)} style={{padding:'12px', border:`2px solid ${form.gender_filter === opt.value ? 'var(--green)' : 'var(--border)'}`, background: form.gender_filter === opt.value ? 'var(--green-light)' : 'white', borderRadius:'var(--radius-sm)', cursor:'pointer', textAlign:'center'}}>
                  <div style={{fontSize:'18px', marginBottom:'4px'}}>{opt.icon}</div>
                  <div style={{fontSize:'11px', fontWeight:'600', color: form.gender_filter === opt.value ? 'var(--green-dark)' : 'var(--text-2)'}}>{opt.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{marginBottom:'16px'}}>
            <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'var(--text-2)'}}>Title *</p>
            <input value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. Surf at Bondi..." />
          </div>

          <div style={{marginBottom:'16px'}}>
            <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'var(--text-2)'}}>Category</p>
            <select value={form.category} onChange={e => update('category', e.target.value)}>
              <option>Sport</option>
              <option>Food</option>
              <option>Culture</option>
              <option>Outdoor</option>
              <option>Music</option>
            </select>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'16px'}}>
            <div>
              <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'var(--text-2)'}}>Date *</p>
              <input type="date" value={form.date} onChange={e => update('date', e.target.value)} />
            </div>
            <div>
              <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'var(--text-2)'}}>Time</p>
              <input type="time" value={form.time} onChange={e => update('time', e.target.value)} />
            </div>
          </div>

          <div style={{marginBottom:'16px'}}>
            <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'var(--text-2)'}}>Location *</p>
            <input value={form.location} onChange={e => update('location', e.target.value)} placeholder="Place name or address..." />
          </div>

          <div style={{marginBottom:'16px'}}>
            <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'var(--text-2)'}}>Available spots</p>
            <input type="number" value={form.max_attendees} onChange={e => update('max_attendees', parseInt(e.target.value))} min={2} max={100} />
          </div>

          <div style={{marginBottom:'20px'}}>
            <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'var(--text-2)'}}>Description</p>
            <textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="Tell people what to expect..." rows={3} style={{resize:'none'}} />
          </div>

          <button onMouseDown={handleSubmit} disabled={loading} style={{width:'100%', padding:'14px', background:'var(--green)', color:'white', border:'none', borderRadius:'var(--radius-sm)', fontSize:'16px', fontWeight:'700', cursor:'pointer', boxShadow:'0 2px 8px rgba(29,158,117,0.3)'}}>
            {loading ? 'Publishing...' : 'Publish event →'}
          </button>
        </div>
      )}

      {/* MY EVENTS LIST */}
      {myEvents.length === 0 ? (
        <div style={{textAlign:'center', padding:'60px 20px', color:'var(--text-3)'}}>
          <div style={{fontSize:'48px', marginBottom:'16px'}}>🗓️</div>
          <h2 style={{fontSize:'20px', fontWeight:'700', fontFamily:'Syne, sans-serif', marginBottom:'8px'}}>No events yet</h2>
          <p style={{fontSize:'14px'}}>Create your first event and start meeting people!</p>
        </div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
          {myEvents.map(event => {
            const cfg = CATEGORY_CONFIG[event.category] || { icon:'🌍', bg:'#E1F5EE', color:'#1D9E75' }
            const past = isPast(event.date)
            return (
              <div
                key={event.id}
                style={{background:'white', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'18px', boxShadow:'var(--shadow)', opacity: past ? 0.6 : 1}}
              >
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'12px'}}>
                  <div style={{display:'flex', gap:'14px', alignItems:'flex-start', flex:1}}>
                    <div style={{width:'46px', height:'46px', borderRadius:'12px', background: cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0}}>
                      {cfg.icon}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex', gap:'6px', marginBottom:'6px', flexWrap:'wrap'}}>
                        <span style={{fontSize:'11px', fontWeight:'700', color: cfg.color, textTransform:'uppercase', letterSpacing:'0.04em'}}>{event.category}</span>
                        {past && <span style={{fontSize:'11px', fontWeight:'600', color:'var(--text-3)', background:'var(--bg)', padding:'1px 8px', borderRadius:'100px'}}>Past</span>}
                      </div>
                      <div style={{fontSize:'15px', fontWeight:'700', fontFamily:'Syne, sans-serif', marginBottom:'4px'}}>{event.title}</div>
                      <div style={{fontSize:'13px', color:'var(--text-3)'}}>📅 {event.date} {event.time && `· ${event.time}`}</div>
                      <div style={{fontSize:'13px', color:'var(--text-3)'}}>📍 {event.location}</div>
                    </div>
                  </div>
                  <div style={{display:'flex', gap:'8px', flexShrink:0}}>
                    <button onMouseDown={() => window.location.href = `/events/${event.id}`} style={{padding:'7px 14px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'100px', fontSize:'12px', fontWeight:'600', cursor:'pointer'}}>View</button>
                    <button onMouseDown={() => deleteEvent(event.id)} style={{padding:'7px 14px', background:'#FEE2E2', color:'#DC2626', border:'none', borderRadius:'100px', fontSize:'12px', fontWeight:'600', cursor:'pointer'}}>🗑️</button>
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