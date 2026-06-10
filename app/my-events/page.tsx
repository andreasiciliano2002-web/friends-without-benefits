'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [attendedEvents, setAttendedEvents] = useState<any[]>([])
  const [myReviews, setMyReviews] = useState<Record<string, any>>({})
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [tab, setTab] = useState<'created' | 'attended'>('created')
  const [form, setForm] = useState({
    title: '', description: '', category: 'Sport',
    date: '', time: '', location: '',
    max_attendees: 10, event_type: 'open', gender_filter: 'everyone'
  })
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // Autocomplete state
  const [locationQuery, setLocationQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const debounceRef = useRef<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
      else { setUser(data.user); loadData(data.user.id) }
    })
  }, [])

  const searchLocation = async (query: string) => {
    if (query.length < 3) { setSuggestions([]); return }
    setLoadingSuggestions(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      setSuggestions(data)
      setShowSuggestions(true)
    } catch {
      setSuggestions([])
    }
    setLoadingSuggestions(false)
  }

  const handleLocationChange = (value: string) => {
    setLocationQuery(value)
    update('location', value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchLocation(value), 400)
  }

  const selectSuggestion = (place: any) => {
    const name = place.name || place.display_name.split(',')[0]
    const city = place.address?.city || place.address?.town || place.address?.suburb || ''
    const country = place.address?.country || ''
    const formatted = city ? `${name}, ${city}, ${country}` : place.display_name
    setLocationQuery(formatted)
    update('location', formatted)
    setSuggestions([])
    setShowSuggestions(false)
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const loadData = async (userId: string) => {
    const { data: created } = await supabase
      .from('events')
      .select('*')
      .eq('creator_id', userId)
      .order('date', { ascending: true })
    if (created) setMyEvents(created)

    const { data: attended } = await supabase
      .from('event_attendees')
      .select('event_id, events(id, title, category, date, location, creator_id)')
      .eq('user_id', userId)
    if (attended) {
      const events = attended
        .map((a: any) => a.events)
        .filter((e: any) => e && e.creator_id !== userId)
      setAttendedEvents(events)
    }

    const { data: reviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewer_id', userId)
    if (reviews) {
      const map: Record<string, any> = {}
      reviews.forEach((r: any) => { map[r.event_id] = r })
      setMyReviews(map)
    }
  }

  const handleSubmit = async () => {
    if (!form.title || !form.date || !form.location) {
      setMessage('⚠️ Title, date and location are required.')
      return
    }
    setLoading(true)

    let cover_url = null

    // Upload cover se presente
    if (coverFile && user) {
      const ext = coverFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('event-covers')
        .upload(path, coverFile, { upsert: true })
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('event-covers')
          .getPublicUrl(path)
        cover_url = urlData.publicUrl
      }
    }

    const { error } = await supabase.from('events').insert({
      ...form,
      creator_id: user.id,
      cover_url,
    })

    if (error) setMessage('Error: ' + error.message)
    else {
      setShowCreate(false)
      setForm({ title: '', description: '', category: 'Sport', date: '', time: '', location: '', max_attendees: 10, event_type: 'open', gender_filter: 'everyone' })
      setLocationQuery('')
      setCoverFile(null)
      setCoverPreview(null)
      setMessage('')
      await loadData(user.id)
    }
    setLoading(false)
  }

  const deleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return
    await supabase.from('events').delete().eq('id', id)
    await loadData(user.id)
  }

  const update = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }))
  const isPast = (date: string) => date < new Date().toISOString().split('T')[0]

  return (
    <main style={{
      padding:'24px 20px',
      paddingBottom:'calc(80px + env(safe-area-inset-bottom))',
      maxWidth:'700px',
      margin:'0 auto',
      fontFamily:'sans-serif',
    }}>

      {/* HEADER */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', gap:'12px'}}>
        <div>
          <h1 style={{fontSize:'26px', fontWeight:'800', fontFamily:'Syne, sans-serif', letterSpacing:'-0.5px', marginBottom:'2px'}}>My Events</h1>
          <p style={{fontSize:'13px', color:'var(--text-3)'}}>Manage your activities</p>
        </div>
        <button
          onMouseDown={() => setShowCreate(!showCreate)}
          style={{padding:'10px 20px', background: showCreate ? 'var(--bg)' : 'var(--green)', color: showCreate ? 'var(--text-2)' : 'white', border: showCreate ? '1px solid var(--border)' : 'none', borderRadius:'100px', fontWeight:'600', fontSize:'14px', cursor:'pointer', boxShadow: showCreate ? 'none' : '0 2px 8px rgba(29,158,117,0.3)', flexShrink:0}}
        >
          {showCreate ? '✕ Cancel' : '+ Create new'}
        </button>
      </div>

      {/* CREATE FORM */}
      {showCreate && (
        <div style={{background:'white', borderRadius:'var(--radius)', padding:'24px', marginBottom:'24px', boxShadow:'var(--shadow)', border:'1px solid var(--border)'}}>
          <h2 style={{fontSize:'18px', fontWeight:'700', fontFamily:'Syne, sans-serif', marginBottom:'20px'}}>New event</h2>
          {message && <p style={{marginBottom:'14px', color:'#C04A20', background:'#FAECE7', padding:'10px 14px', borderRadius:'8px', fontSize:'13px'}}>{message}</p>}

          {/* COVER IMAGE */}
          <div style={{marginBottom:'16px'}}>
            <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'var(--text-2)'}}>Cover image</p>
            <div
              onMouseDown={() => coverInputRef.current?.click()}
              style={{
                width:'100%',
                height:'160px',
                borderRadius:'var(--radius-sm)',
                border:`2px dashed ${coverPreview ? 'var(--green)' : 'var(--border)'}`,
                background: coverPreview ? 'transparent' : 'var(--bg)',
                cursor:'pointer',
                overflow:'hidden',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                position:'relative',
              }}
            >
              {coverPreview ? (
                <>
                  <img src={coverPreview} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="cover" />
                  <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                    <span style={{color:'white', fontSize:'13px', fontWeight:'600'}}>Tap to change</span>
                  </div>
                </>
              ) : (
                <div style={{textAlign:'center', color:'var(--text-3)'}}>
                  <div style={{fontSize:'32px', marginBottom:'8px'}}>🖼️</div>
                  <p style={{fontSize:'13px', fontWeight:'500'}}>Tap to add a cover image</p>
                  <p style={{fontSize:'11px', marginTop:'4px'}}>JPG, PNG or WebP</p>
                </div>
              )}
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCoverChange}
              style={{display:'none'}}
            />
          </div>

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

          {/* LOCATION CON AUTOCOMPLETE */}
          <div style={{marginBottom:'16px', position:'relative'}}>
            <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'var(--text-2)'}}>
              Location * <span style={{fontWeight:'400', color:'var(--text-3)'}}>— start typing to search</span>
            </p>
            <div style={{position:'relative'}}>
              <input
                value={locationQuery}
                onChange={e => handleLocationChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Search a place..."
                style={{paddingLeft:'36px'}}
                autoComplete="off"
              />
              <span style={{position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'16px', pointerEvents:'none'}}>📍</span>
              {loadingSuggestions && (
                <span style={{position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'12px', color:'var(--text-3)'}}>...</span>
              )}
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div style={{position:'absolute', top:'100%', left:0, right:0, background:'white', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', boxShadow:'0 4px 24px rgba(0,0,0,0.1)', zIndex:100, overflow:'hidden', marginTop:'4px'}}>
                {suggestions.map((place, i) => {
                  const name = place.name || place.display_name.split(',')[0]
                  const detail = place.display_name.split(',').slice(1, 3).join(',').trim()
                  return (
                    <div
                      key={i}
                      onMouseDown={() => selectSuggestion(place)}
                      style={{padding:'12px 14px', cursor:'pointer', borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none', display:'flex', alignItems:'flex-start', gap:'10px'}}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'white'}
                    >
                      <span style={{fontSize:'14px', flexShrink:0, marginTop:'1px'}}>📍</span>
                      <div>
                        <div style={{fontSize:'13px', fontWeight:'600', color:'var(--text)'}}>{name}</div>
                        <div style={{fontSize:'11px', color:'var(--text-3)', marginTop:'2px'}}>{detail}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
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

      {/* TABS */}
      <div style={{display:'flex', gap:'4px', background:'white', borderRadius:'var(--radius-sm)', padding:'4px', marginBottom:'20px', width:'fit-content', border:'1px solid var(--border)'}}>
        <button onMouseDown={() => setTab('created')} style={{padding:'7px 18px', borderRadius:'8px', border:'none', background: tab === 'created' ? 'var(--green)' : 'transparent', color: tab === 'created' ? 'white' : 'var(--text-3)', fontWeight: tab === 'created' ? '600' : '400', fontSize:'13px', cursor:'pointer', minHeight:'auto'}}>
          Created ({myEvents.length})
        </button>
        <button onMouseDown={() => setTab('attended')} style={{padding:'7px 18px', borderRadius:'8px', border:'none', background: tab === 'attended' ? 'var(--green)' : 'transparent', color: tab === 'attended' ? 'white' : 'var(--text-3)', fontWeight: tab === 'attended' ? '600' : '400', fontSize:'13px', cursor:'pointer', minHeight:'auto'}}>
          Attended ({attendedEvents.length})
        </button>
      </div>

      {/* CREATED EVENTS */}
      {tab === 'created' && (
        myEvents.length === 0 ? (
          <div style={{textAlign:'center', padding:'60px 20px', color:'var(--text-3)'}}>
            <div style={{fontSize:'48px', marginBottom:'16px'}}>🗓️</div>
            <h2 style={{fontSize:'20px', fontWeight:'700', fontFamily:'Syne, sans-serif', marginBottom:'8px'}}>No events yet</h2>
            <p style={{fontSize:'14px'}}>Create your first event!</p>
          </div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
            {myEvents.map(event => {
              const cfg = CATEGORY_CONFIG[event.category] || { icon:'🌍', bg:'#E1F5EE', color:'#1D9E75' }
              const past = isPast(event.date)
              return (
                <div key={event.id} style={{background:'white', border:'1px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden', boxShadow:'var(--shadow)', opacity: past ? 0.7 : 1}}>
                  {event.cover_url && (
                    <img src={event.cover_url} style={{width:'100%', height:'120px', objectFit:'cover', display:'block'}} alt={event.title} />
                  )}
                  <div style={{padding:'18px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'12px'}}>
                      <div style={{display:'flex', gap:'14px', alignItems:'flex-start', flex:1, minWidth:0}}>
                        <div style={{width:'46px', height:'46px', borderRadius:'12px', background: cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0}}>
                          {cfg.icon}
                        </div>
                        <div style={{flex:1, minWidth:0}}>
                          <div style={{display:'flex', gap:'6px', marginBottom:'6px', flexWrap:'wrap', alignItems:'center'}}>
                            <span style={{fontSize:'11px', fontWeight:'700', color: cfg.color, textTransform:'uppercase', letterSpacing:'0.04em'}}>{event.category}</span>
                            {past && <span style={{fontSize:'11px', color:'var(--text-3)', background:'var(--bg)', padding:'1px 8px', borderRadius:'100px'}}>Past</span>}
                          </div>
                          <div style={{fontSize:'15px', fontWeight:'700', fontFamily:'Syne, sans-serif', marginBottom:'4px'}}>{event.title}</div>
                          <div style={{fontSize:'13px', color:'var(--text-3)'}}>📅 {event.date} {event.time && `· ${event.time}`}</div>
                          <div style={{fontSize:'13px', color:'var(--text-3)'}}>📍 {event.location}</div>
                        </div>
                      </div>
                      <div style={{display:'flex', gap:'8px', flexShrink:0}}>
                        <button onMouseDown={() => window.location.href = `/events/${event.id}`} style={{padding:'7px 14px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'100px', fontSize:'12px', fontWeight:'600', cursor:'pointer', minHeight:'auto'}}>View</button>
                        <button onMouseDown={() => deleteEvent(event.id)} style={{padding:'7px 14px', background:'#FEE2E2', color:'#DC2626', border:'none', borderRadius:'100px', fontSize:'12px', fontWeight:'600', cursor:'pointer', minHeight:'auto'}}>🗑️</button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ATTENDED EVENTS */}
      {tab === 'attended' && (
        attendedEvents.length === 0 ? (
          <div style={{textAlign:'center', padding:'60px 20px', color:'var(--text-3)'}}>
            <div style={{fontSize:'48px', marginBottom:'16px'}}>🎯</div>
            <h2 style={{fontSize:'20px', fontWeight:'700', fontFamily:'Syne, sans-serif', marginBottom:'8px'}}>No events attended yet</h2>
            <p style={{fontSize:'14px'}}>Join events and leave reviews after!</p>
          </div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
            {attendedEvents.map(event => {
              const cfg = CATEGORY_CONFIG[event.category] || { icon:'🌍', bg:'#E1F5EE', color:'#1D9E75' }
              const past = isPast(event.date)
              const myReview = myReviews[event.id]
              return (
                <div key={event.id} style={{background:'white', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'18px', boxShadow:'var(--shadow)'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'12px'}}>
                    <div style={{display:'flex', gap:'14px', alignItems:'flex-start', flex:1, minWidth:0}}>
                      <div style={{width:'46px', height:'46px', borderRadius:'12px', background: cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0}}>
                        {cfg.icon}
                      </div>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{display:'flex', gap:'6px', marginBottom:'6px', flexWrap:'wrap', alignItems:'center'}}>
                          <span style={{fontSize:'11px', fontWeight:'700', color: cfg.color, textTransform:'uppercase', letterSpacing:'0.04em'}}>{event.category}</span>
                          {past && <span style={{fontSize:'11px', color:'var(--text-3)', background:'var(--bg)', padding:'1px 8px', borderRadius:'100px'}}>Past</span>}
                          {myReview && <span style={{fontSize:'11px', color:'#9A6200', background:'#FEF3C7', padding:'1px 8px', borderRadius:'100px'}}>{'⭐'.repeat(myReview.rating)}</span>}
                        </div>
                        <div style={{fontSize:'15px', fontWeight:'700', fontFamily:'Syne, sans-serif', marginBottom:'4px'}}>{event.title}</div>
                        <div style={{fontSize:'13px', color:'var(--text-3)'}}>📅 {event.date}</div>
                        <div style={{fontSize:'13px', color:'var(--text-3)'}}>📍 {event.location}</div>
                      </div>
                    </div>
                    <div style={{display:'flex', flexDirection:'column', gap:'6px', flexShrink:0}}>
                      <button onMouseDown={() => window.location.href = `/events/${event.id}`} style={{padding:'7px 14px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'100px', fontSize:'12px', fontWeight:'600', cursor:'pointer', minHeight:'auto'}}>View</button>
                      {past && (
                        <button onMouseDown={() => window.location.href = `/events/${event.id}`} style={{padding:'7px 14px', background: myReview ? 'var(--green-light)' : 'var(--green)', color: myReview ? 'var(--green-dark)' : 'white', border:'none', borderRadius:'100px', fontSize:'12px', fontWeight:'600', cursor:'pointer', minHeight:'auto'}}>
                          {myReview ? '✓ Reviewed' : '⭐ Review'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
    </main>
  )
}