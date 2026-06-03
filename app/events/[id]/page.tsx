'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function EventPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<any>(null)
  const [creator, setCreator] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [attendees, setAttendees] = useState<any[]>([])
  const [joined, setJoined] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [myReview, setMyReview] = useState<any>(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [savingReview, setSavingReview] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
      else { setUser(data.user); loadEvent(data.user.id) }
    })
  }, [])

  const loadEvent = async (userId: string) => {
    const { data: eventData } = await supabase
      .from('events')
      .select('*, profiles!events_creator_id_fkey(display_name, avatar_url)')
      .eq('id', params.id)
      .single()

    if (eventData) {
      setEvent(eventData)
      setEditForm(eventData)
      setCreator(eventData.profiles || null)
    }

    const { data: attendeesData } = await supabase
      .from('event_attendees')
      .select('user_id, profiles(display_name, avatar_url, location, interests)')
      .eq('event_id', params.id)
    if (attendeesData) {
      setAttendees(attendeesData)
      setJoined(attendeesData.some((a: any) => a.user_id === userId))
    }

    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*, profiles(display_name, avatar_url)')
      .eq('event_id', params.id)
      .order('created_at', { ascending: false })
    if (reviewsData) {
      setReviews(reviewsData)
      setMyReview(reviewsData.find((r: any) => r.reviewer_id === userId) || null)
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
    if (!confirm('Delete this event?')) return
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

  const saveReview = async () => {
    if (!user) return
    setSavingReview(true)
    if (myReview) {
      await supabase.from('reviews').update({ rating: reviewRating, comment: reviewComment }).eq('id', myReview.id)
    } else {
      await supabase.from('reviews').insert({ event_id: params.id, reviewer_id: user.id, rating: reviewRating, comment: reviewComment })
    }
    setShowReviewForm(false)
    await loadEvent(user.id)
    setSavingReview(false)
  }

  const categoryColor: Record<string, string> = {
    Sport: '#185FA5', Food: '#D85A30', Culture: '#BA7517',
    Outdoor: '#1D9E75', Music: '#534AB7'
  }

  if (!event) return (
    <main style={{padding:'32px 24px', textAlign:'center', color:'var(--text-3)'}}>
      Loading...
    </main>
  )

  const spots = event.max_attendees - attendees.length
  const color = categoryColor[event.category] || '#1D9E75'
  const isCreator = user?.id === event.creator_id
  const isPast = event.date < new Date().toISOString().split('T')[0]
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const creatorEntry = { user_id: event.creator_id, isHost: true, profiles: creator }
  const otherAttendees = attendees.filter(a => a.user_id !== event.creator_id)
  const displayAttendees = [creatorEntry, ...otherAttendees]

  return (
    <main style={{
      padding: '24px 20px',
      paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
      maxWidth: '600px',
      margin: '0 auto',
      fontFamily: 'sans-serif',
    }}>

      <a href="/explore" style={{color:'var(--text-3)', textDecoration:'none', fontSize:'14px', display:'inline-flex', alignItems:'center', gap:'6px', marginBottom:'20px'}}>
        ← Back to events
      </a>

      <div style={{background:'white', borderRadius:'var(--radius)', padding:'24px', boxShadow:'var(--shadow)', border:'1px solid var(--border)', marginBottom:'16px'}}>

        {/* BADGES */}
        <div style={{display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'14px'}}>
          <span style={{fontSize:'11px', fontWeight:'700', color, background: color + '18', padding:'3px 10px', borderRadius:'100px', textTransform:'uppercase'}}>{event.category}</span>
          {event.event_type === 'group' && (
            <span style={{fontSize:'11px', fontWeight:'600', color:'#9A6200', background:'#FEF3C7', padding:'3px 10px', borderRadius:'100px'}}>👥 Group</span>
          )}
          {event.gender_filter && event.gender_filter !== 'everyone' && (
            <span style={{fontSize:'11px', fontWeight:'600', color:'#534AB7', background:'#EEEDFE', padding:'3px 10px', borderRadius:'100px'}}>
              {event.gender_filter === 'women' ? '👩 Women only' : '👨 Men only'}
            </span>
          )}
          {isPast && <span style={{fontSize:'11px', fontWeight:'600', color:'var(--text-3)', background:'var(--bg)', padding:'3px 10px', borderRadius:'100px'}}>Past event</span>}
          {avgRating && <span style={{fontSize:'11px', fontWeight:'600', color:'#9A6200', background:'#FEF3C7', padding:'3px 10px', borderRadius:'100px'}}>⭐ {avgRating}</span>}
        </div>

        {editing ? (
          <div>
            <div style={{marginBottom:'14px'}}>
              <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px'}}>Title</p>
              <input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} />
            </div>
            <div style={{marginBottom:'14px'}}>
              <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px'}}>Description</p>
              <textarea value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} rows={3} style={{resize:'none'}} />
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px'}}>
              <div>
                <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px'}}>Date</p>
                <input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} />
              </div>
              <div>
                <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px'}}>Time</p>
                <input type="time" value={editForm.time || ''} onChange={e => setEditForm({...editForm, time: e.target.value})} />
              </div>
            </div>
            <div style={{marginBottom:'14px'}}>
              <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px'}}>Location</p>
              <input value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} />
            </div>
            <div style={{marginBottom:'20px'}}>
              <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px'}}>Max attendees</p>
              <input type="number" value={editForm.max_attendees} onChange={e => setEditForm({...editForm, max_attendees: parseInt(e.target.value)})} />
            </div>
            <div style={{display:'flex', gap:'10px'}}>
              <button onMouseDown={saveEdit} style={{flex:1, padding:'12px', background:'var(--green)', color:'white', border:'none', borderRadius:'var(--radius-sm)', fontSize:'15px', fontWeight:'700', cursor:'pointer'}}>Save changes</button>
              <button onMouseDown={() => setEditing(false)} style={{padding:'12px 20px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:'15px', cursor:'pointer'}}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'12px'}}>
              <h1 style={{fontSize:'24px', fontWeight:'800', fontFamily:'Syne, sans-serif', marginBottom:'8px', flex:1}}>{event.title}</h1>
              {isCreator && (
                <div style={{display:'flex', gap:'8px', flexShrink:0}}>
                  <button onMouseDown={() => setEditing(true)} style={{padding:'6px 12px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'100px', fontSize:'12px', fontWeight:'600', cursor:'pointer'}}>✏️ Edit</button>
                  <button onMouseDown={deleteEvent} disabled={deleting} style={{padding:'6px 12px', background:'#FEE2E2', color:'#DC2626', border:'none', borderRadius:'100px', fontSize:'12px', fontWeight:'600', cursor:'pointer'}}>🗑️</button>
                </div>
              )}
            </div>

            {/* HOSTED BY */}
            {creator?.display_name && (
              <div
                onMouseDown={() => window.location.href = `/users/${event.creator_id}`}
                style={{display:'inline-flex', alignItems:'center', gap:'7px', marginBottom:'14px', cursor:'pointer', padding:'5px 10px 5px 5px', borderRadius:'100px', border:'1px solid var(--border)', background:'var(--bg)'}}
              >
                <div style={{width:'22px', height:'22px', borderRadius:'50%', overflow:'hidden', background:'#9FE1CB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'700', flexShrink:0}}>
                  {creator.avatar_url
                    ? <img src={creator.avatar_url} style={{width:'100%', height:'100%', objectFit:'cover'}} alt={creator.display_name} />
                    : creator.display_name[0]?.toUpperCase()}
                </div>
                <span style={{fontSize:'12px', color:'var(--text-3)'}}>
                  Hosted by <span style={{fontWeight:'600', color:'var(--text-2)'}}>{creator.display_name}</span>
                </span>
              </div>
            )}

            {event.description && (
              <p style={{fontSize:'15px', color:'var(--text-2)', marginBottom:'16px', lineHeight:'1.6'}}>{event.description}</p>
            )}

            <div style={{display:'flex', flexDirection:'column', gap:'8px', marginBottom:'20px'}}>
              <div style={{display:'flex', alignItems:'center', gap:'10px', fontSize:'14px', color:'var(--text-2)'}}>
                <span style={{fontSize:'18px'}}>📅</span>
                <span>{event.date} {event.time && `· ${event.time}`}</span>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:'10px', fontSize:'14px', color:'var(--text-2)'}}>
                <span style={{fontSize:'18px'}}>📍</span>
                <span>{event.location}</span>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:'10px', fontSize:'14px', color:'var(--text-2)'}}>
                <span style={{fontSize:'18px'}}>👥</span>
                <span>{attendees.length} joined · <span style={{color: spots <= 2 ? '#C04A20' : 'var(--green)', fontWeight:'600'}}>{spots} spots left</span></span>
              </div>
            </div>

            <div style={{marginBottom:'20px', borderRadius:'12px', overflow:'hidden', border:'1px solid var(--border)'}}>
              <iframe
                width="100%"
                height="200"
                style={{border:0, display:'block'}}
                loading="lazy"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&output=embed`}
              />
            </div>

            {!isPast && (
              <button
                onMouseDown={toggleJoin}
                disabled={loading || (!joined && spots === 0) || isCreator}
                style={{width:'100%', padding:'14px', background: isCreator ? 'var(--bg)' : joined ? 'var(--green-light)' : 'var(--green)', color: isCreator ? 'var(--text-3)' : joined ? 'var(--green-dark)' : 'white', border: isCreator ? '1px solid var(--border)' : 'none', borderRadius:'100px', fontSize:'16px', fontWeight:'700', cursor: isCreator ? 'default' : 'pointer', marginBottom:'10px', boxShadow: isCreator || joined ? 'none' : '0 2px 8px rgba(29,158,117,0.3)'}}
              >
                {isCreator ? '👑 You created this event' : loading ? '...' : joined ? '✓ You are going!' : spots === 0 ? 'Event is full' : 'Join this event →'}
              </button>
            )}

            {isPast && joined && !isCreator && (
              <button
                onMouseDown={() => {
                  setShowReviewForm(!showReviewForm)
                  if (myReview) { setReviewRating(myReview.rating); setReviewComment(myReview.comment || '') }
                }}
                style={{width:'100%', padding:'14px', background:'var(--green-light)', color:'var(--green-dark)', border:'none', borderRadius:'100px', fontSize:'15px', fontWeight:'700', cursor:'pointer', marginBottom:'10px'}}
              >
                {myReview ? '✏️ Edit your review' : '⭐ Leave a review'}
              </button>
            )}

            {showReviewForm && (
              <div style={{background:'var(--bg)', borderRadius:'var(--radius-sm)', padding:'16px', marginBottom:'10px', border:'1px solid var(--border)'}}>
                <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'10px'}}>Your rating</p>
                <div style={{display:'flex', gap:'8px', marginBottom:'14px'}}>
                  {[1,2,3,4,5].map(star => (
                    <span key={star} onMouseDown={() => setReviewRating(star)} style={{fontSize:'28px', cursor:'pointer', opacity: star <= reviewRating ? 1 : 0.3}}>⭐</span>
                  ))}
                </div>
                <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px'}}>Comment (optional)</p>
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Tell others about your experience..."
                  rows={3}
                  style={{resize:'none', marginBottom:'12px'}}
                />
                <button
                  onMouseDown={saveReview}
                  disabled={savingReview}
                  style={{width:'100%', padding:'12px', background:'var(--green)', color:'white', border:'none', borderRadius:'var(--radius-sm)', fontSize:'14px', fontWeight:'700', cursor:'pointer'}}
                >
                  {savingReview ? 'Saving...' : 'Submit review →'}
                </button>
              </div>
            )}

            <a 
              href={`/events/${params.id}/chat`}
              style={{display:'block', width:'100%', padding:'14px', background:'var(--bg)', color:'var(--text)', borderRadius:'100px', fontSize:'15px', fontWeight:'700', cursor:'pointer', textAlign:'center', textDecoration:'none', border:'1px solid var(--border)', boxSizing:'border-box'}}
            >
              💬 Open chat
            </a>
          </>
        )}
      </div>

      {/* WHO'S GOING */}
      <div style={{background:'white', borderRadius:'var(--radius)', padding:'24px', boxShadow:'var(--shadow)', border:'1px solid var(--border)', marginBottom:'16px'}}>
        <h2 style={{fontSize:'18px', fontWeight:'700', fontFamily:'Syne, sans-serif', marginBottom:'16px'}}>
          {"Who's going"} ({displayAttendees.length})
        </h2>
        <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
          {displayAttendees.map((a: any, i: number) => {
            const profile = a.profiles
            const name = profile?.display_name || 'Anonymous'
            const initial = name[0]?.toUpperCase() || '?'
            const colors = ['#9FE1CB', '#F5C4B3', '#B5D4F4', '#CECBF6', '#FAC775']
            const bg = colors[i % colors.length]
            return (
              <div
                key={a.user_id}
                onMouseDown={() => window.location.href = `/users/${a.user_id}`}
                style={{display:'flex', alignItems:'center', gap:'12px', padding:'12px', border: a.isHost ? '1.5px solid var(--green)' : '1px solid var(--border)', borderRadius:'var(--radius-sm)', cursor:'pointer', background: a.isHost ? 'var(--green-light)' : 'white'}}
              >
                <div style={{width:'44px', height:'44px', borderRadius:'50%', overflow:'hidden', flexShrink:0, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:'700', color:'#333'}}>
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} style={{width:'100%', height:'100%', objectFit:'cover'}} alt={name} />
                    : initial}
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{display:'flex', alignItems:'center', gap:'6px', marginBottom:'2px', flexWrap:'wrap'}}>
                    <span style={{fontSize:'14px', fontWeight:'600'}}>{name}</span>
                    {a.isHost && (
                      <span style={{fontSize:'10px', fontWeight:'700', color:'var(--green-dark)', background:'var(--green-mid)', padding:'2px 7px', borderRadius:'100px'}}>HOST</span>
                    )}
                  </div>
                  {profile?.location && <div style={{fontSize:'12px', color:'var(--text-3)'}}>📍 {profile.location}</div>}
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
                <span style={{fontSize:'18px', color: a.isHost ? 'var(--green)' : 'var(--text-3)', flexShrink:0}}>→</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* REVIEWS */}
      {reviews.length > 0 && (
        <div style={{background:'white', borderRadius:'var(--radius)', padding:'24px', boxShadow:'var(--shadow)', border:'1px solid var(--border)'}}>
          <h2 style={{fontSize:'18px', fontWeight:'700', fontFamily:'Syne, sans-serif', marginBottom:'16px'}}>
            Reviews ({reviews.length}) {avgRating && `· ⭐ ${avgRating}`}
          </h2>
          <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
            {reviews.map((review: any) => {
              const name = review.profiles?.display_name || 'Anonymous'
              const initial = name[0]?.toUpperCase() || '?'
              return (
                <div key={review.id} style={{padding:'14px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px'}}>
                    <div style={{width:'32px', height:'32px', borderRadius:'50%', background:'#9FE1CB', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'700', flexShrink:0}}>
                      {review.profiles?.avatar_url
                        ? <img src={review.profiles.avatar_url} style={{width:'100%', height:'100%', objectFit:'cover'}} alt={name} />
                        : initial}
                    </div>
                    <div>
                      <div style={{fontSize:'13px', fontWeight:'600'}}>{name}</div>
                      <div style={{fontSize:'12px', color:'var(--text-3)'}}>{'⭐'.repeat(review.rating)}</div>
                    </div>
                  </div>
                  {review.comment && <p style={{fontSize:'13px', color:'var(--text-2)', lineHeight:'1.5'}}>{review.comment}</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}

    </main>
  )
}