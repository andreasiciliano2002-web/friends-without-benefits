'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function EventPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [attendees, setAttendees] = useState<any[]>([])
  const [joined, setJoined] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
      else { setUser(data.user); loadEvent(data.user.id) }
    })
  }, [])

  const loadEvent = async (userId: string) => {
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', params.id)
      .single()
    if (eventData) {
      setEvent(eventData)
      setEditForm(eventData)
    }

    const { data: attendeesData } = await supabase
      .from('event_attendees')
      .select('user_id, profiles(display_name, avatar_url, location, interests)')
      .eq('event_id', params.id)
    if (attendeesData) {
      setAttendees(attendeesData)
      setJoined(attendeesData.some((a: any) => a.user_id === userId))
    }
  }

  const toggleJoin = async () => {
    if (!user) return
    setLoading(true)
    if (joined) {
      await supabase.from('event_attendees').delete().eq('event_id', params.id).eq('user_id', user.id)
    } else {
      await supabase.from('event_attendees').insert({ event_id: params.id, user_id: user.id })
    }
    await loadEvent(user.id)
    setLoading(false)
  }

  const deleteEvent = async () => {
    if (!confirm('Are you sure you want to delete this event?')) return
    setDeleting(true)
    await supabase.from('events').delete().eq('id', params.id)
    window.location.href = '/explore'
  }

  const saveEdit = async () => {
    await supabase.from('events').update({
      title: editForm.title,
      description: editForm.description,
      date: editForm.date,
      time: editForm.time,
      location: editForm.location,
      max_attendees: editForm.max_attendees,
    }).eq('id', params.id)
    setEditing(false)
    await loadEvent(user.id)
  }

  const categoryColor: Record<string, string> = {
    Sport: '#185FA5', Food: '#D85A30', Culture: '#BA7517',
    Outdoor: '#1D9E75', Music: '#534AB7'
  }

  if (!event) return (
    <main style={{padding:'32px 24px', fontFamily:'sans-serif', textAlign:'center', color:'#888'}}>
      Loading...
    </main>
  )

  const spots = event.max_attendees - attendees.length
  const color = categoryColor[event.category] || '#1D9E75'
  const isCreator = user?.id === event.creator_id

  return (
    <main style={{padding:'24px', maxWidth:'600px', margin:'0 auto', fontFamily:'sans-serif'}}>

      <a href="/explore" style={{color:'#888', textDecoration:'none', fontSize:'14px', display:'inline-flex', alignItems:'center', gap:'6px', marginBottom:'20px'}}>
        ← Back to events
      </a>

      <div style={{background:'white', borderRadius:'16px', padding:'24px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', marginBottom:'16px'}}>

        <div style={{display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'14px'}}>
          <span style={{fontSize:'11px', fontWeight:'700', color, background: color + '18', padding:'3px 10px', borderRadius:'100px', textTransform:'uppercase'}}>{event.category}</span>
          {event.event_type === 'group' && (
            <span style={{fontSize:'11px', fontWeight:'600', color:'#BA7517', background:'#FAEEDA', padding:'3px 10px', borderRadius:'100px'}}>👥 Group</span>
          )}
          {event.gender_filter && event.gender_filter !== 'everyone' && (
            <span style={{fontSize:'11px', fontWeight:'600', color:'#534AB7', background:'#EEEDFE', padding:'3px 10px', borderRadius:'100px'}}>
              {event.gender_filter === 'women' ? '👩 Women only' : '👨 Men only'}
            </span>
          )}
        </div>

        {editing ? (
          <div>
            <div style={{marginBottom:'14px'}}>
              <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px'}}>Title</p>
              <input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} style={{width:'100%', padding:'10px 14px', border:'1px solid #eee', borderRadius:'8px', fontSize:'14px', outline:'none', boxSizing:'border-box'}} />
            </div>
            <div style={{marginBottom:'14px'}}>
              <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px'}}>Description</p>
              <textarea value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} rows={3} style={{width:'100%', padding:'10px 14px', border:'1px solid #eee', borderRadius:'8px', fontSize:'14px', outline:'none', resize:'none', boxSizing:'border-box'}} />
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px'}}>
              <div>
                <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px'}}>Date</p>
                <input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} style={{width:'100%', padding:'10px 14px', border:'1px solid #eee', borderRadius:'8px', fontSize:'14px', outline:'none', boxSizing:'border-box'}} />
              </div>
              <div>
                <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px'}}>Time</p>
                <input type="time" value={editForm.time || ''} onChange={e => setEditForm({...editForm, time: e.target.value})} style={{width:'100%', padding:'10px 14px', border:'1px solid #eee', borderRadius:'8px', fontSize:'14px', outline:'none', boxSizing:'border-box'}} />
              </div>
            </div>
            <div style={{marginBottom:'14px'}}>
              <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px'}}>Location</p>
              <input value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} style={{width:'100%', padding:'10px 14px', border:'1px solid #eee', borderRadius:'8px', fontSize:'14px', outline:'none', boxSizing:'border-box'}} />
            </div>
            <div style={{marginBottom:'20px'}}>
              <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px'}}>Max attendees</p>
              <input type="number" value={editForm.max_attendees} onChange={e => setEditForm({...editForm, max_attendees: parseInt(e.target.value)})} style={{width:'100%', padding:'10px 14px', border:'1px solid #eee', borderRadius:'8px', fontSize:'14px', outline:'none', boxSizing:'border-box'}} />
            </div>
            <div style={{display:'flex', gap:'10px'}}>
              <button onMouseDown={saveEdit} style={{flex:1, padding:'12px', background:'#1D9E75', color:'white', border:'none', borderRadius:'8px', fontSize:'15px', fontWeight:'700', cursor:'pointer'}}>Save changes</button>
              <button onMouseDown={() => setEditing(false)} style={{padding:'12px 20px', background:'#f5f5f5', border:'none', borderRadius:'8px', fontSize:'15px', cursor:'pointer'}}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
              <h1 style={{fontSize:'24px', fontWeight:'800', marginBottom:'12px', flex:1}}>{event.title}</h1>
              {isCreator && (
                <div style={{display:'flex', gap:'8px', marginLeft:'12px', flexShrink:0}}>
                  <button onMouseDown={() => setEditing(true)} style={{padding:'6px 12px', background:'#f5f5f5', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:'600', cursor:'pointer'}}>✏️ Edit</button>
                  <button onMouseDown={deleteEvent} disabled={deleting} style={{padding:'6px 12px', background:'#FEE2E2', color:'#DC2626', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:'600', cursor:'pointer'}}>🗑️ Delete</button>
                </div>
              )}
            </div>

            {event.description && (
              <p style={{fontSize:'15px', color:'#555', marginBottom:'16px', lineHeight:'1.6'}}>{event.description}</p>
            )}

            <div style={{display:'flex', flexDirection:'column', gap:'8px', marginBottom:'20px'}}>
              <div style={{display:'flex', alignItems:'center', gap:'10px', fontSize:'14px', color:'#555'}}>
                <span style={{fontSize:'18px'}}>📅</span>
                <span>{event.date} {event.time && `· ${event.time}`}</span>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:'10px', fontSize:'14px', color:'#555'}}>
                <span style={{fontSize:'18px'}}>📍</span>
                <span>{event.location}</span>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:'10px', fontSize:'14px', color:'#555'}}>
                <span style={{fontSize:'18px'}}>👥</span>
                <span>{attendees.length} joined · <span style={{color: spots <= 2 ? '#D85A30' : '#1D9E75', fontWeight:'600'}}>{spots} spots left</span></span>
              </div>
            </div>

            <div style={{marginBottom:'20px', borderRadius:'12px', overflow:'hidden', border:'1px solid #eee'}}>
              <iframe
                width="100%"
                height="200"
                style={{border:0, display:'block'}}
                loading="lazy"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&output=embed`}
              />
            </div>

            <button
              onMouseDown={toggleJoin}
              disabled={loading || (!joined && spots === 0) || isCreator}
              style={{width:'100%', padding:'14px', background: isCreator ? '#f5f5f5' : joined ? '#E1F5EE' : '#1D9E75', color: isCreator ? '#888' : joined ? '#085041' : 'white', border:'none', borderRadius:'10px', fontSize:'16px', fontWeight:'700', cursor: isCreator ? 'default' : 'pointer'}}
            >
              {isCreator ? '👑 You created this event' : loading ? '...' : joined ? '✓ You are going!' : spots === 0 ? 'Event is full' : 'Join this event →'}
            </button>

            <a
              href={`/events/${params.id}/chat`}
              style={{display:'block', width:'100%', padding:'14px', background:'#f5f5f5', color:'#1a1a1a', borderRadius:'10px', fontSize:'16px', fontWeight:'700', cursor:'pointer', textAlign:'center', textDecoration:'none', marginTop:'10px', boxSizing:'border-box'}}
            >
              💬 Open chat
            </a>
          </>
        )}
      </div>

      <div style={{background:'white', borderRadius:'16px', padding:'24px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
<h2 style={{fontSize:'18px', fontWeight:'700', marginBottom:'16px'}}>{"Who's going"} ({attendees.length})</h2>

        {attendees.length === 0 ? (
          <div style={{textAlign:'center', padding:'24px', color:'#888'}}>
            <div style={{fontSize:'32px', marginBottom:'8px'}}>👋</div>
            <p style={{fontSize:'14px'}}>Be the first to join!</p>
          </div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
            {attendees.map((a: any, i: number) => {
              const profile = a.profiles
              const name = profile?.display_name || 'Anonymous'
              const initial = name[0]?.toUpperCase() || '?'
              const colors = ['#9FE1CB', '#F5C4B3', '#B5D4F4', '#CECBF6', '#FAC775']
              const bg = colors[i % colors.length]

              return (
                <div
                  key={a.user_id}
                  onMouseDown={() => window.location.href = `/users/${a.user_id}`}
                  style={{display:'flex', alignItems:'center', gap:'12px', padding:'12px', border:'1px solid #f0f0f0', borderRadius:'12px', cursor:'pointer'}}
                >
                  <div style={{width:'44px', height:'44px', borderRadius:'50%', overflow:'hidden', flexShrink:0, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:'700', color:'#333'}}>
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                      : initial}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'14px', fontWeight:'600'}}>{name}</div>
                    {profile?.location && (
                      <div style={{fontSize:'12px', color:'#888'}}>📍 {profile.location}</div>
                    )}
                    {profile?.interests?.length > 0 && (
                      <div style={{display:'flex', gap:'4px', marginTop:'4px', flexWrap:'wrap'}}>
                        {profile.interests.slice(0, 3).map((interest: string) => (
                          <span key={interest} style={{fontSize:'11px', padding:'2px 8px', background:'#f0f0f0', borderRadius:'100px', color:'#555'}}>
                            {interest}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}