'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const steps = [
  {
    icon: '👤',
    title: 'Complete your profile',
    desc: 'Add a photo, bio and interests so others can get to know you before events.',
    cta: 'Set up profile →',
    href: '/profile?new=true',
    color: '#1D9E75',
    bg: 'rgba(29,158,117,0.1)',
  },
  {
    icon: '🗺️',
    title: 'Explore events near you',
    desc: 'Browse activities in your city — filter by category, vibe or time.',
    cta: 'Explore events →',
    href: '/explore',
    color: '#534AB7',
    bg: 'rgba(83,74,183,0.1)',
  },
  {
    icon: '✨',
    title: 'Create your first event',
    desc: 'Host a surf session, dinner or anything you love. People will find you.',
    cta: 'Create event →',
    href: '/my-events',
    color: '#C04A20',
    bg: 'rgba(192,74,32,0.1)',
  },
]

export default function OnboardingPage() {
  const [user, setUser] = useState<any>(null)
  const [name, setName] = useState('')
  const [done, setDone] = useState<boolean[]>([false, false, false])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = '/login'; return }
      setUser(data.user)
      const { data: p } = await supabase.from('profiles').select('display_name').eq('id', data.user.id).single()
      if (p?.display_name) setName(p.display_name)
    })
  }, [])

  const markDone = (index: number) => {
    const next = [...done]
    next[index] = true
    setDone(next)
  }

  const allDone = done.every(Boolean)

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0D3D2E 0%, #1a1a2e 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      fontFamily: 'sans-serif',
    }}>

      {/* HEADER */}
      <div style={{textAlign:'center', marginBottom:'40px', maxWidth:'400px'}}>
        <div style={{fontSize:'40px', marginBottom:'16px'}}>🌍</div>
        <h1 style={{fontSize:'28px', fontWeight:'800', fontFamily:'Syne, sans-serif', color:'white', marginBottom:'8px', letterSpacing:'-0.5px'}}>
          Welcome{name ? `, ${name.split(' ')[0]}` : ''}!
        </h1>
        <p style={{fontSize:'15px', color:'rgba(255,255,255,0.55)', lineHeight:'1.6'}}>
          You are 3 steps away from your first real connection.
        </p>
      </div>

      {/* STEPS */}
      <div style={{display:'flex', flexDirection:'column', gap:'12px', width:'100%', maxWidth:'420px', marginBottom:'32px'}}>
        {steps.map((step, i) => (
          <div
            key={i}
            style={{
              background: done[i] ? 'rgba(29,158,117,0.15)' : 'rgba(255,255,255,0.06)',
              border: done[i] ? '1.5px solid rgba(29,158,117,0.4)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius:'16px',
              padding:'20px',
              transition:'all 0.2s',
            }}
          >
            <div style={{display:'flex', alignItems:'center', gap:'14px'}}>
              <div style={{
                width:'48px', height:'48px', borderRadius:'14px',
                background: done[i] ? 'rgba(29,158,117,0.2)' : step.bg,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'22px', flexShrink:0,
              }}>
                {done[i] ? '✅' : step.icon}
              </div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px'}}>
                  <span style={{fontSize:'11px', fontWeight:'700', color:'rgba(255,255,255,0.3)'}}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{fontSize:'15px', fontWeight:'700', color: done[i] ? '#9FE1CB' : 'white'}}>
                    {step.title}
                  </span>
                </div>
                <p style={{fontSize:'12px', color:'rgba(255,255,255,0.45)', lineHeight:'1.5', margin:0}}>
                  {step.desc}
                </p>
              </div>
            </div>

            {!done[i] && (
              <a 
                href={step.href}
                onMouseDown={() => markDone(i)}
                style={{
                  display:'block', marginTop:'14px',
                  padding:'10px', textAlign:'center',
                  background: step.color,
                  color:'white', borderRadius:'100px',
                  textDecoration:'none', fontSize:'13px', fontWeight:'700',
                  boxShadow:`0 2px 12px ${step.color}40`,
                }}
              >
                {step.cta}
              </a>
            )}
          </div>
        ))}
      </div>

      {/* PROGRESS */}
      <div style={{width:'100%', maxWidth:'420px', marginBottom:'24px'}}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
          <span style={{fontSize:'12px', color:'rgba(255,255,255,0.4)'}}>Progress</span>
          <span style={{fontSize:'12px', color:'#9FE1CB', fontWeight:'600'}}>{done.filter(Boolean).length}/3 completed</span>
        </div>
        <div style={{height:'4px', background:'rgba(255,255,255,0.1)', borderRadius:'100px', overflow:'hidden'}}>
          <div style={{
            height:'100%',
            width:`${(done.filter(Boolean).length / 3) * 100}%`,
            background:'#1D9E75',
            borderRadius:'100px',
            transition:'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* SKIP / DONE */}
      {allDone ? (
        <a 
          href="/explore"
          style={{padding:'14px 32px', background:'#1D9E75', color:'white', borderRadius:'100px', textDecoration:'none', fontSize:'16px', fontWeight:'700', boxShadow:'0 4px 24px rgba(29,158,117,0.4)'}}
        >
          🎉 Start exploring →
        </a>
      ) : (
        <a 
          href="/explore"
          style={{fontSize:'13px', color:'rgba(255,255,255,0.3)', textDecoration:'none', padding:'8px'}}
        >
          Skip for now →
        </a>
      )}

    </main>
  )
}