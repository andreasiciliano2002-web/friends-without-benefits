'use client';

import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/explore', icon: '🗺️', label: 'Explore' },
  { href: '/groups', icon: '👥', label: 'Groups' },
  { href: '/my-events', icon: '🗓️', label: 'My Events' },
  { href: '/profile', icon: '👤', label: 'Profile' },
];

export default function NavBar() {
  const pathname = usePathname();
  const showNav =
    !['/login', '/'].includes(pathname) && !pathname.includes('/chat');

  if (!showNav) return null;

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          zIndex: 1000,
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
        }}
      >
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '10px 0 8px',
                textDecoration: 'none',
                color: isActive ? 'var(--green)' : 'var(--text-3)',
                fontSize: '10px',
                fontWeight: isActive ? '700' : '500',
                gap: '4px',
                transition: 'color 0.15s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span
                style={{
                  fontSize: '22px',
                  background: isActive ? 'var(--green-light)' : 'transparent',
                  padding: '4px 18px',
                  borderRadius: '100px',
                  transition: 'background 0.15s',
                  lineHeight: '1.4',
                  display: 'block',
                }}
              >
                {item.icon}
              </span>
              {item.label}
            </a>
          );
        })}
      </nav>
      {/* Spacer che spinge il contenuto sopra la navbar */}
      <div style={{ height: 'calc(64px + env(safe-area-inset-bottom))' }} />
    </>
  );
}
