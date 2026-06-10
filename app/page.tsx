import Link from 'next/link'

export default function LandingPage() {
  return (
    <main style={{minHeight:'100vh', background:'#0D1F1A', color:'white', fontFamily:'sans-serif'}}>

      {/* NAV */}
      <nav style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 32px', borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
        <div style={{fontSize:'20px', fontWeight:'800', letterSpacing:'-0.5px'}}>
          Friends <span style={{color:'#9FE1CB'}}>Without</span> Benefits
        </div>
        <div style={{display:'flex', gap:'12px'}}>
          <Link href="/login" style={{padding:'8px 18px', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'100px', color:'white', textDecoration:'none', fontSize:'14px', fontWeight:'500'}}>
            Sign in
          </Link>
          <Link href="/login" style={{padding:'8px 18px', background:'#1D9E75', borderRadius:'100px', color:'white', textDecoration:'none', fontSize:'14px', fontWeight:'600'}}>
            Get started
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{maxWidth:'720px', margin:'0 auto', padding:'80px 32px 60px', textAlign:'center'}}>
        <div style={{display:'inline-block', background:'rgba(29,158,117,0.2)', border:'1px solid rgba(29,158,117,0.4)', color:'#9FE1CB', fontSize:'12px', fontWeight:'600', padding:'6px 14px', borderRadius:'100px', marginBottom:'28px', letterSpacing:'0.04em'}}>
          🌍 Connect with people around you
        </div>
        <h1 style={{fontSize:'clamp(40px, 7vw, 72px)', fontWeight:'800', lineHeight:'1.05', letterSpacing:'-2px', marginBottom:'24px'}}>
          Meet people,<br/>
          <span style={{color:'#9FE1CB'}}>not screens</span>
        </h1>
        <p style={{fontSize:'18px', color:'rgba(255,255,255,0.6)', lineHeight:'1.6', maxWidth:'480px', margin:'0 auto 40px', fontWeight:'300'}}>
          Friends Without Benefits connects people through real-life experiences. Create events, join activities, make friends.
        </p>
        <div style={{display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap'}}>
          <Link href="/login" style={{padding:'14px 28px', background:'#1D9E75', color:'white', borderRadius:'100px', textDecoration:'none', fontSize:'16px', fontWeight:'700'}}>
            Create your profile →
          </Link>
          <Link href="/explore" style={{padding:'14px 28px', border:'1px solid rgba(255,255,255,0.2)', color:'white', borderRadius:'100px', textDecoration:'none', fontSize:'16px', fontWeight:'500'}}>
            Browse events
          </Link>
        </div>
      </div>

      {/* EXAMPLE EVENTS */}
      <div style={{maxWidth:'900px', margin:'0 auto', padding:'0 32px 60px', display:'flex', gap:'16px', overflowX:'auto', scrollbarWidth:'none'}}>
        {[
          { emoji:'🏄', title:'Morning surf session', category:'Sport', time:'Today · 7:00–9:00 AM', location:'Local beach', spots:4 },
          { emoji:'🍜', title:'Ramen dinner downtown', category:'Food', time:'Tonight · 7:30 PM', location:'City center', spots:3 },
          { emoji:'🍹', title:'Rooftop aperitivo', category:'Culture', time:'Tonight · 6:30 PM', location:'Rooftop bar', spots:12 },
          { emoji:'🖼️', title:'Art exhibition + coffee', category:'Culture', time:'Tomorrow · 11:00 AM', location:'Local museum', spots:5 },
        ].map((event, i) => (
          <div key={i} style={{flexShrink:0, width:'240px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', padding:'20px', backdropFilter:'blur(10px)'}}>
            <div style={{fontSize:'11px', fontWeight:'600', color:'#9FE1CB', marginBottom:'10px', textTransform:'uppercase', letterSpacing:'0.04em'}}>{event.category}</div>
            <div style={{fontSize:'24px', marginBottom:'8px'}}>{event.emoji}</div>
            <div style={{fontSize:'15px', fontWeight:'700', marginBottom:'6px', lineHeight:'1.3'}}>{event.title}</div>
            <div style={{fontSize:'12px', color:'rgba(255,255,255,0.5)', marginBottom:'2px'}}>📅 {event.time}</div>
            <div style={{fontSize:'12px', color:'rgba(255,255,255,0.5)', marginBottom:'12px'}}>📍 {event.location}</div>
            <div style={{fontSize:'12px', color:'#9FE1CB', fontWeight:'500'}}>{event.spots} spots left</div>
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <div style={{maxWidth:'900px', margin:'0 auto', padding:'0 32px 60px', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'1px', background:'rgba(255,255,255,0.06)', borderRadius:'16px', overflow:'hidden'}}>
        {[
          { icon:'🗺️', title:'Explore nearby', desc:'Find events and activities around you, filtered by category and time. All in real time.' },
          { icon:'👥', title:'Thematic groups', desc:'Join permanent groups for shared interests — surf, food, music. Your community.' },
          { icon:'⭐', title:'Partner venues', desc:'Bars, restaurants and cultural spaces post their events on the platform.' },
        ].map((feat, i) => (
          <div key={i} style={{background:'#0D1F1A', padding:'32px 28px'}}>
            <div style={{fontSize:'28px', marginBottom:'14px'}}>{feat.icon}</div>
            <div style={{fontSize:'17px', fontWeight:'700', marginBottom:'8px'}}>{feat.title}</div>
            <div style={{fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:'1.6'}}>{feat.desc}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{textAlign:'center', padding:'60px 32px 80px'}}>
        <h2 style={{fontSize:'36px', fontWeight:'800', marginBottom:'16px', letterSpacing:'-1px'}}>Ready to meet people?</h2>
        <p style={{fontSize:'16px', color:'rgba(255,255,255,0.5)', marginBottom:'28px'}}>Join for free. No algorithms, no swiping. Just real experiences.</p>
        <Link href="/login" style={{padding:'16px 32px', background:'#1D9E75', color:'white', borderRadius:'100px', textDecoration:'none', fontSize:'18px', fontWeight:'700'}}>
          Join Friends Without Benefits →
        </Link>
      </div>

      {/* FOOTER */}
      <div style={{textAlign:'center', padding:'20px', borderTop:'1px solid rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.3)', fontSize:'13px'}}>
        © 2025 Friends Without Benefits · Meet people, not screens
      </div>

    </main>
  )
}