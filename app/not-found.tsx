'use client'

export default function NotFound() {
  return (
    <main style={{
      minHeight:'100vh',
      display:'flex',
      flexDirection:'column',
      alignItems:'center',
      justifyContent:'center',
      padding:'40px 20px',
      fontFamily:'DM Sans, sans-serif',
      textAlign:'center',
      background:'var(--bg)',
    }}>
      <div style={{fontSize:'64px', marginBottom:'16px'}}>🌍</div>
      <h1 style={{fontSize:'32px', fontWeight:'800', fontFamily:'Syne, sans-serif', marginBottom:'8px', letterSpacing:'-0.5px'}}>
        Lost somewhere?
      </h1>
      <p style={{fontSize:'16px', color:'var(--text-3)', marginBottom:'32px', maxWidth:'280px', lineHeight:'1.6'}}>
        This page does not exist. But there are plenty of real experiences waiting for you.
      </p>
      <a 
        href="/explore"
        style={{
          display:'inline-block',
          padding:'14px 28px',
          background:'var(--green)',
          color:'white',
          borderRadius:'100px',
          textDecoration:'none',
          fontSize:'15px',
          fontWeight:'700',
          boxShadow:'0 2px 8px rgba(29,158,117,0.3)',
          marginBottom:'12px',
        }}
      >
        Back to events →
      </a>
      <a 
        href="/login"
        style={{
          display:'inline-block',
          fontSize:'13px',
          color:'var(--text-3)',
          textDecoration:'none',
        }}
      >
        or go to login
      </a>
    </main>
  )
}