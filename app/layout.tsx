'use client'

import './globals.css'
import { usePathname } from 'next/navigation'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    { href: '/explore', icon: '🗺️', label: 'Explore' },
    { href: '/groups', icon: '👥', label: 'Groups' },
    { href: '/create', icon: '🗓️', label: 'My Events' },
    { href: '/profile', icon: '👤', label: 'Profile' },
  ]

  const showNav = !['/login', '/'].includes(pathname)

  return (
    <html lang="en">
      <body>
        {children}
        {showNav && (
          <nav style={{
            position:'fixed', bottom:0, left:0, right:0,
            background:'rgba(255,255,255,0.92)',
            backdropFilter:'blur(20px)',
            borderTop:'1px solid rgba(0,0,0,0.06)',
            display:'flex', zIndex:1000,
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
                    alignItems:'center', padding:'10px 0',
                    textDecoration:'none',
                    color: isActive ? 'var(--green)' : 'var(--text-3)',
                    fontSize:'10px',
                    fontWeight: isActive ? '700' : '500',
                    gap:'4px',
                    transition:'color 0.15s'
                  }}
                >
                  <span style={{
                    fontSize:'20px',
                    background: isActive ? 'var(--green-light)' : 'transparent',
                    padding:'4px 14px',
                    borderRadius:'100px',
                    transition:'background 0.15s'
                  }}>
                    {item.icon}
                  </span>
                  {item.label}
                </a>
              )
            })}
          </nav>
        )}
        {showNav && <div style={{paddingBottom:'80px'}} />}
      </body>
    </html>
  )
}