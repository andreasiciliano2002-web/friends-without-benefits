'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

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
  const [authChecked, setAuthChecked] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [onWaitlist, setOnWaitlist] = useState(false)
  const [waitlistCount, setWaitlistCount] = useState(0)
  const [loadingWaitlist, setLoadingWaitlist] = useState(false)
  const [postPhoto, setPostPhoto] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user)
        loadEvent(data.user.id)
      } else {
        loadEvent(null)
      }
      setAuthChecked(true)
    })
  }, [])

  const loadEvent = async (userId: string | null) => {
    const { data: eventData } = await supabase
      .from('events')
      .select('*, profiles!events_creator_id_fkey(display_name, avatar_url)')
      .eq('id', params.id)
      .single()

    if (eventData) {
      setEvent(eventData)
      if (eventData.post_photo_url) setPostPhoto(eventData.post_photo_url)
      setEditForm(eventData)
      setCreator(eventData.profiles || null)
    }

    const { data: attendeesData } = await supabase
      .from('event_attendees')
      .select('user_id, profiles(display_name, avatar_url, location, interests, is_traveler)')
      .eq('event_id', params.id)
    if (attendeesData) {
      setAttendees(attendeesData)
      if (userId) setJoined(attendeesData.some((a: any) => a.user_id === userId))
    }

    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*, profiles(display_name, avatar_url)')
      .eq('event_id', params.id)
      .order('created_at', { ascending: false })
    if (reviewsData) {
      setReviews(reviewsData)
      if (userId) setMyReview(reviewsData.find((r: any) => r.reviewer_id === userId) || null)
    }

    const { data: waitlistData, count } = await supabase
      .from('event_waitlist')
      .select('user_id', { count: 'exact' })
      .eq('event_id', params.id)
    if (waitlistData) {
      setWaitlistCount(count || 0)
      if (userId) setOnWaitlist(waitlistData.some((w: any) => w.user_id === userId))
    }
  }

  const toggleJoin = async () => {
    if (!user) { window.location.href = '/login'; return }
    setLoading(true)
    if (joined) {
      await supabase.from('event_attendees').delete().eq('event_id', params.id).eq('user_id', user.id)
    } else {
      await supabase.from('event_attendees').insert({ event_id: params.id, user_id: user.id })
  
      // Invia email al creatore
      try {
        const { data: myProfile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single()
  
        const { data: creatorProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', event.creator_id)
          .single()
  
        if (creatorProfile?.email && event.creator_id !== user.id) {
          await fetch('https://bljrordabqfrlkvmenkj.supabase.co/functions/v1/send-notification-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsanJvcmRhYnFmcmxrdm1lbmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3ODA0MzAsImV4cCI6MjA5NDM1NjQzMH0.WV_KZW54uMSH3yv7QJZEL_1CygjABkNOtByPrFt_Dz0`,
            },
            body: JSON.stringify({
              type: 'join',
              to: creatorProfile.email,
              eventTitle: event.title,
              joinerName: myProfile?.display_name || 'Someone',
            }),
          })
        }
      } catch (e) {
        console.log('Email error:', e)
      }
    }
    await loadEvent(user.id)
    setLoading(false)
  }

  const toggleWaitlist = async () => {
    if (!user) { window.location.href = '/login'; return }
    setLoadingWaitlist(true)
    if (onWaitlist) {
      await supabase.from('event_waitlist').delete().eq('event_id', params.id).eq('user_id', user.id)
    } else {
      await supabase.from('event_waitlist').insert({ event_id: params.id, user_id: user.id })
    }
    await loadEvent(user.id)
    setLoadingWaitlist(false)
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

  const shareEvent = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: event.title, url })
    } else {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    }
  }

  const uploadPostPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !event) return
    setUploadingPhoto(true)
    const ext = file.name.split('.').pop()
    const path = `post-photos/${event.id}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('event-covers').upload(path, file, { upsert: true })
    if (!error) {
      const { data: urlData } = supabase.storage.from('event-covers').getPublicUrl(path)
      await supabase.from('events').update({ post_photo_url: urlData.publicUrl }).eq('id', event.id)
      setPostPhoto(urlData.publicUrl)
    } else {
      alert('Error uploading photo: ' + error.message)
    }
    setUploadingPhoto(false)
  }

  const categoryColor: Record<string, string> = {
    Sport: '#185FA5', Food: '#D85A30', Culture: '#BA7517',
    Outdoor: '#1D9E75', Music: '#534AB7'
  }

  if (!authChecked || !event) return (
    <main style={{padding:'32px 24px', textAlign:'center', color:'var(--text-3)'}}>
      Loading...
    </main>
  )

  const spots = event.max_attendees - attendees.length
  const color = categoryColor[event.category] || '#1D9E75'
  const isCreator = user?.id === event.creator_id
  const isPast = event.date < new Date().toISOString().split('T')[0]
  const isFull = spots <= 0
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

      {user ? (
        <a href="/explore" style={{color:'var(--text-3)', textDecoration:'none', fontSize:'14px', display:'inline-flex', alignItems:'center', gap:'6px', marginBottom:'20px'}}>
          ← Back to events
        </a>
      ) : (
        <a href="/" style={{color:'var(--text-3)', textDecoration:'none', fontSize:'14px', display:'inline-flex', alignItems:'center', gap:'6px', marginBottom:'20px'}}>
          ← Friends Without Benefits
        </a>
      )}

      {event.cover_url && (
        <div style={{borderRadius:'var(--radius)', overflow:'hidden', marginBottom:'16px', boxShadow:'var(--shadow)'}}>
          <img src={event.cover_url} style={{width:'100%', height:'220px', objectFit:'cover', display:'block'}} alt={event.title} />
        </div>
      )}

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
          {event.mood && (
            <span style={{fontSize:'11px', fontWeight:'600', color:'#C04A20', background:'#FAECE7', padding:'3px 10px', borderRadius:'100px'}}>
              {event.mood === 'energetic' ? '🔥 Energetic' : event.mood === 'chill' ? '🧘 Chill' : event.mood === 'party' ? '🎉 Party' : '💬 Social'}
            </span>
          )}
          {event.recurrence && (
            <span style={{fontSize:'11px', fontWeight:'600', color:'#185FA5', background:'#E6F1FB', padding:'3px 10px', borderRadius:'100px'}}>
              {event.recurrence === 'weekly' ? '📅 Weekly' : '🗓️ Monthly'}
            </span>
          )}
          {isPast && <span style={{fontSize:'11px', fontWeight:'600', color:'var(--text-3)', background:'var(--bg)', padding:'3px 10px', borderRadius:'100px'}}>Past event</span>}
          {avgRating && <span style={{fontSize:'11px', fontWeight:'600', color:'#9A6200', background:'#FEF3C7', padding:'3px 10px', borderRadius:'100px'}}>⭐ {avgRating}</span>}
          {isFull && !isPast && <span style={{fontSize:'11px', fontWeight:'600', color:'#DC2626', background:'#FEE2E2', padding:'3px 10px', borderRadius:'100px'}}>🔴 Full</span>}
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
                <span>{formatDate(event.date)} {event.time && `· ${event.time}`}</span>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:'10px', fontSize:'14px', color:'var(--text-2)'}}>
                <span style={{fontSize:'18px'}}>📍</span>
                <span>{event.location}</span>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:'10px', fontSize:'14px', color:'var(--text-2)'}}>
                <span style={{fontSize:'18px'}}>👥</span>
                <span>
                  {attendees.length} joined · <span style={{color: spots <= 2 ? '#C04A20' : 'var(--green)', fontWeight:'600'}}>{spots > 0 ? `${spots} spots left` : 'Full'}</span>
                  {waitlistCount > 0 && <span style={{color:'var(--text-3)'}}> · {waitlistCount} on waitlist</span>}
                </span>
              </div>
            </div>

            <div style={{marginBottom:'20px', borderRadius:'12px', overflow:'hidden', border:'1px solid var(--border)'}}>
              <iframe width="100%" height="200" style={{border:0, display:'block'}} loading="lazy" src={`https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&output=embed`} />
            </div>

            {!user ? (
              <a 
                href="/login"
                style={{display:'block', width:'100%', padding:'14px', background:'var(--green)', color:'white', borderRadius:'100px', fontSize:'16px', fontWeight:'700', textAlign:'center', textDecoration:'none', marginBottom:'10px', boxShadow:'0 2px 8px rgba(29,158,117,0.3)', boxSizing:'border-box'}}
              >
                Sign up to join this event →
              </a>
            ) : !isPast && !isCreator ? (
              <>
                {!isFull ? (
                  <button
                    onMouseDown={toggleJoin}
                    disabled={loading}
                    style={{width:'100%', padding:'14px', background: joined ? 'var(--green-light)' : 'var(--green)', color: joined ? 'var(--green-dark)' : 'white', border:'none', borderRadius:'100px', fontSize:'16px', fontWeight:'700', cursor:'pointer', marginBottom:'10px', boxShadow: joined ? 'none' : '0 2px 8px rgba(29,158,117,0.3)'}}
                  >
                    {loading ? '...' : joined ? '✓ You are going!' : 'Join this event →'}
                  </button>
                ) : !joined ? (
                  <button
                    onMouseDown={toggleWaitlist}
                    disabled={loadingWaitlist}
                    style={{width:'100%', padding:'14px', background: onWaitlist ? '#FEF3C7' : '#FEE2E2', color: onWaitlist ? '#9A6200' : '#DC2626', border:'none', borderRadius:'100px', fontSize:'16px', fontWeight:'700', cursor:'pointer', marginBottom:'10px'}}
                  >
                    {loadingWaitlist ? '...' : onWaitlist ? '✓ On waitlist — you will be notified' : '🎟️ Join waitlist'}
                  </button>
                ) : null}
              </>
            ) : !isPast && isCreator ? (
              <div style={{width:'100%', padding:'14px', background:'var(--bg)', color:'var(--text-3)', border:'1px solid var(--border)', borderRadius:'100px', fontSize:'16px', fontWeight:'700', textAlign:'center', marginBottom:'10px'}}>
                👑 You created this event
              </div>
            ) : null}

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
                <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Tell others about your experience..." rows={3} style={{resize:'none', marginBottom:'12px'}} />
                <button onMouseDown={saveReview} disabled={savingReview} style={{width:'100%', padding:'12px', background:'var(--green)', color:'white', border:'none', borderRadius:'var(--radius-sm)', fontSize:'14px', fontWeight:'700', cursor:'pointer'}}>
                  {savingReview ? 'Saving...' : 'Submit review →'}
                </button>
              </div>
            )}

            <div style={{display:'flex', gap:'10px'}}>
              {user && (
                <a 
                  href={`/events/${params.id}/chat`}
                  style={{flex:1, display:'block', padding:'14px', background:'var(--bg)', color:'var(--text)', borderRadius:'100px', fontSize:'15px', fontWeight:'700', cursor:'pointer', textAlign:'center', textDecoration:'none', border:'1px solid var(--border)', boxSizing:'border-box'}}
                >
                  💬 Chat
                </a>
              )}
              <button onMouseDown={shareEvent} style={{flex:1, padding:'14px', background:'var(--bg)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:'100px', fontSize:'15px', fontWeight:'700', cursor:'pointer'}}>
                {shareCopied ? '✓ Copied!' : '🔗 Share'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* WHO'S GOING */}
      <div style={{background:'white', borderRadius:'var(--radius)', padding:'24px', boxShadow:'var(--shadow)', border:'1px solid var(--border)', marginBottom:'16px'}}>
        <h2 style={{fontSize:'18px', fontWeight:'700', fontFamily:'Syne, sans-serif', marginBottom:'16px'}}>
          {"Who's going"} ({displayAttendees.length})
        </h2>

        {!user ? (
          <div style={{position:'relative'}}>
            <div style={{filter:'blur(4px)', pointerEvents:'none', userSelect:'none'}}>
              {displayAttendees.slice(0, 3).map((a: any, i: number) => {
                const colors = ['#9FE1CB', '#F5C4B3', '#B5D4F4']
                const bg = colors[i % colors.length]
                return (
                  <div key={i} style={{display:'flex', alignItems:'center', gap:'12px', padding:'12px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', marginBottom:'10px', background:'white'}}>
                    <div style={{width:'44px', height:'44px', borderRadius:'50%', background:bg, flexShrink:0}} />
                    <div style={{flex:1}}>
                      <div style={{height:'12px', background:'var(--border)', borderRadius:'6px', width:'60%', marginBottom:'6px'}} />
                      <div style={{height:'10px', background:'var(--border)', borderRadius:'6px', width:'40%'}} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.7)', borderRadius:'var(--radius-sm)'}}>
              <p style={{fontSize:'14px', fontWeight:'600', color:'var(--text)', marginBottom:'12px', textAlign:'center'}}>Sign up to see who is going</p>
              <a href="/login" style={{padding:'10px 24px', background:'var(--green)', color:'white', borderRadius:'100px', textDecoration:'none', fontSize:'14px', fontWeight:'700', boxShadow:'0 2px 8px rgba(29,158,117,0.3)'}}>Join for free →</a>
            </div>
          </div>
        ) : (
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
                      {profile?.is_traveler && (
                        <span style={{fontSize:'10px', fontWeight:'700', color:'#C04A20', background:'#FAECE7', padding:'2px 7px', borderRadius:'100px'}}>🧳 Traveler</span>
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
        )}
      </div>

      {/* POST-EVENT PHOTO */}
      {isPast && (postPhoto || isCreator) && (
        <div style={{background:'white', borderRadius:'var(--radius)', padding:'24px', boxShadow:'var(--shadow)', border:'1px solid var(--border)', marginBottom:'16px'}}>
          <h2 style={{fontSize:'18px', fontWeight:'700', fontFamily:'Syne, sans-serif', marginBottom:'16px'}}>
            📸 Group photo
          </h2>
          {postPhoto ? (
            <div>
              <img src={postPhoto} style={{width:'100%', objectFit:'cover', display:'block', borderRadius:'var(--radius-sm)'}} alt="Group photo" />
              {isCreator && (
                <label style={{display:'block', marginTop:'12px', padding:'10px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', textAlign:'center', fontSize:'13px', fontWeight:'600', cursor:'pointer', color:'var(--text-2)'}}>
                  {uploadingPhoto ? 'Uploading...' : '🔄 Change photo'}
                  <input type="file" accept="image/*" onChange={uploadPostPhoto} style={{display:'none'}} />
                </label>
              )}
            </div>
          ) : isCreator ? (
            <label style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', width:'100%', height:'160px', border:'2px dashed var(--border)', borderRadius:'var(--radius-sm)', cursor:'pointer', background:'var(--bg)', gap:'8px', boxSizing:'border-box'}}>
              <span style={{fontSize:'32px'}}>📸</span>
              <span style={{fontSize:'13px', fontWeight:'600', color:'var(--text-3)'}}>
                {uploadingPhoto ? 'Uploading...' : 'Add a group photo'}
              </span>
              <span style={{fontSize:'11px', color:'var(--text-3)'}}>Share the memory with attendees</span>
              <input type="file" accept="image/*" onChange={uploadPostPhoto} style={{display:'none'}} />
            </label>
          ) : null}
        </div>
      )}

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

      {!user && (
        <div style={{background:'#0D1F1A', borderRadius:'var(--radius)', padding:'28px 24px', textAlign:'center', marginTop:'16px'}}>
          <div style={{fontSize:'32px', marginBottom:'12px'}}>🌍</div>
          <h2 style={{fontSize:'20px', fontWeight:'800', fontFamily:'Syne, sans-serif', color:'white', marginBottom:'8px'}}>Meet people, not screens</h2>
          <p style={{fontSize:'14px', color:'rgba(255,255,255,0.6)', marginBottom:'20px', lineHeight:'1.6'}}>
            Join Friends Without Benefits for free and start attending real-life experiences.
          </p>
          <a href="/login" style={{display:'inline-block', padding:'14px 28px', background:'var(--green)', color:'white', borderRadius:'100px', textDecoration:'none', fontSize:'15px', fontWeight:'700', boxShadow:'0 2px 8px rgba(29,158,117,0.3)'}}>
            Join for free →
          </a>
        </div>
      )}

    </main>
  )
}