'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = '/login'; return }
      setUser(data.user)
      loadNotifications(data.user.id)
    })
  }, [])

  const loadNotifications = async (userId: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (data) setNotifications(data)
    setLoading(false)

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
  }

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <main style={{
      padding:'24px 20px',
      paddingBottom:'calc(80px + env(safe-area-inset-bottom))',
      maxWidth:'600px',
      margin:'0 auto',
      fontFamily:'sans-serif',
    }}>
      <h1 style={{fontSize:'26px', fontWeight:'800', fontFamily:'Syne, sans-serif', letterSpacing:'-0.5px', marginBottom:'4px'}}>
        Notifications
      </h1>
      <p style={{fontSize:'13px', color:'var(--text-3)', marginBottom:'24px'}}>
        {notifications.length} total
      </p>

      {loading ? (
        <div style={{textAlign:'center', padding:'40px', color:'var(--text-3)'}}>Loading...</div>
      ) : notifications.length === 0 ? (
        <div style={{textAlign:'center', padding:'60px 20px', color:'var(--text-3)', maxWidth:'320px', margin:'0 auto'}}>
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{margin:'0 auto 24px', display:'block'}}>
            <circle cx="60" cy="60" r="60" fill="#E1F5EE"/>
            <path d="M60 30c-15 0-25 10-25 25v15l-5 8h60l-5-8V55c0-15-10-25-25-25z" fill="#9FE1CB" stroke="#1D9E75" strokeWidth="2"/>
            <circle cx="60" cy="88" r="5" fill="#1D9E75"/>
            <circle cx="75" cy="32" r="8" fill="#FAC775" stroke="white" strokeWidth="2"/>
          </svg>
          <h2 style={{fontSize:'20px', fontWeight:'800', marginBottom:'8px', fontFamily:'Syne, sans-serif', color:'var(--text)'}}>
            No notifications yet
          </h2>
          <p style={{fontSize:'14px', lineHeight:'1.6'}}>
            When someone joins your event you will be notified here.
          </p>
        </div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
          {notifications.map(n => (
            <div
              key={n.id}
              onMouseDown={() => n.event_id && (window.location.href = `/events/${n.event_id}`)}
              style={{
                background: n.read ? 'white' : 'var(--green-light)',
                border: n.read ? '1px solid var(--border)' : '1.5px solid var(--green)',
                borderRadius:'var(--radius-sm)',
                padding:'14px 16px',
                cursor: n.event_id ? 'pointer' : 'default',
                display:'flex',
                alignItems:'flex-start',
                gap:'12px',
              }}
            >
              <span style={{fontSize:'22px', flexShrink:0}}>
                {n.type === 'join' ? '👋' : '🔔'}
              </span>
              <div style={{flex:1, minWidth:0}}>
                <p style={{fontSize:'14px', color:'var(--text)', lineHeight:'1.5', marginBottom:'4px'}}>
                  {n.message}
                </p>
                <p style={{fontSize:'12px', color:'var(--text-3)'}}>
                  {formatTime(n.created_at)}
                </p>
              </div>
              {!n.read && (
                <div style={{width:'8px', height:'8px', borderRadius:'50%', background:'var(--green)', flexShrink:0, marginTop:'4px'}} />
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}