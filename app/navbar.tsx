'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const navItems = [
  { href: '/explore', icon: '🗺️', label: 'Explore' },
  { href: '/groups', icon: '👥', label: 'Groups' },
  { href: '/my-events', icon: '🗓️', label: 'My Events' },
  { href: '/profile', icon: '👤', label: 'Profile' },
]

export default function NavBar() {
  const pathname = usePathname()
  const [unread, setUnread] = useState(0)
  const showNav = !['/login', '/'].includes(pathname) && !pathname.includes('/chat')

  useEffect(() => {
    if (!showNav) return

    const loadUnread = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)
      setUnread(count || 0)
    }

    loadUnread()
  }, [showNav, pathname])
  // Si ricarica ad ogni cambio pagina — aggiorna il badge automaticamente

  if (!showNav) return null

  return (
    <>
      <nav style={{
        position:'fixed', bottom:0, left:0, right:0,
        background:'rgba(255,255,255,0.97)',
        backdropFilter:'blur(20px)',
        WebkitBackdropFilter:'blur(20px)',
        borderTop:'1px solid rgba(0,0,0,0.06)',
        display:'flex',
        zIndex:1000,
        paddingBottom:'env(safe-area-inset-bottom)',
        boxShadow:'0 -4px 24px rgba(0,0,0,0.06)'
      }}>
        {navItems.map(item => {
          const isActive = pathname.startsWith(item.href)
          return (
            <a 
              key={item.href}
              href={item.href}
              style={{
                flex:1, display:'flex', flexDirection:'column',
                alignItems:'center', padding:'10px 0 8px',
                textDecoration:'none',
                color: isActive ? 'var(--green)' : 'var(--text-3)',
                fontSize:'10px',
                fontWeight: isActive ? '700' : '500',
                gap:'4px',
                transition:'color 0.15s',
                WebkitTapHighlightColor:'transparent',
              }}
            >
              <span style={{
                fontSize:'22px',
                background: isActive ? 'var(--green-light)' : 'transparent',
                padding:'4px 18px',
                borderRadius:'100px',
                transition:'background 0.15s',
                lineHeight:'1.4',
                display:'block',
              }}>
                {item.icon}
              </span>
              {item.label}
            </a>
          )
        })}

        {/* NOTIFICHE */}
        <a 
          href="/notifications"
          style={{
            flex:1, display:'flex', flexDirection:'column',
            alignItems:'center', padding:'10px 0 8px',
            textDecoration:'none',
            color: pathname.startsWith('/notifications') ? 'var(--green)' : 'var(--text-3)',
            fontSize:'10px',
            fontWeight: pathname.startsWith('/notifications') ? '700' : '500',
            gap:'4px',
            transition:'color 0.15s',
            WebkitTapHighlightColor:'transparent',
          }}
        >
          <span style={{
            fontSize:'22px',
            background: pathname.startsWith('/notifications') ? 'var(--green-light)' : 'transparent',
            padding:'4px 18px',
            borderRadius:'100px',
            transition:'background 0.15s',
            lineHeight:'1.4',
            display:'block',
            position:'relative',
          }}>
            🔔
            {unread > 0 && (
              <span style={{
                position:'absolute',
                top:'2px', right:'8px',
                background:'#DC2626',
                color:'white',
                fontSize:'9px',
                fontWeight:'700',
                borderRadius:'100px',
                minWidth:'16px',
                height:'16px',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                padding:'0 4px',
                lineHeight:'1',
              }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </span>
          Alerts
        </a>
      </nav>
      <div style={{height:'calc(64px + env(safe-area-inset-bottom))'}} />
    </>
  )
}