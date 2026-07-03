import Link from 'next/link'

export default function LandingPage() {
  return (
    <main style={{minHeight:'100vh', background:'#0D1F1A', color:'white', fontFamily:'sans-serif', overflowX:'hidden'}}>

      {/* NAV */}
      <nav style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 32px', borderBottom:'1px solid rgba(255,255,255,0.08)', position:'sticky', top:0, zIndex:100, background:'rgba(13,31,26,0.95)', backdropFilter:'blur(20px)'}}>
        <div style={{fontSize:'18px', fontWeight:'800', letterSpacing:'-0.5px'}}>
          FWB <span style={{color:'#9FE1CB', fontSize:'13px', fontWeight:'500'}}>Friends Without Benefits</span>
        </div>
        <div style={{display:'flex', gap:'10px'}}>
          <Link href="/login" style={{padding:'8px 18px', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'100px', color:'white', textDecoration:'none', fontSize:'14px', fontWeight:'500'}}>
            Sign in
          </Link>
          <Link href="/login" style={{padding:'8px 18px', background:'#1D9E75', borderRadius:'100px', color:'white', textDecoration:'none', fontSize:'14px', fontWeight:'600', boxShadow:'0 2px 12px rgba(29,158,117,0.4)'}}>
            Join free →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{maxWidth:'720px', margin:'0 auto', padding:'80px 24px 60px', textAlign:'center'}}>
        <div style={{display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(29,158,117,0.15)', border:'1px solid rgba(29,158,117,0.3)', color:'#9FE1CB', fontSize:'12px', fontWeight:'600', padding:'6px 14px', borderRadius:'100px', marginBottom:'32px', letterSpacing:'0.04em'}}>
          <span style={{width:'6px', height:'6px', borderRadius:'50%', background:'#1D9E75', display:'inline-block'}} />
          Now live in your city
        </div>

        <h1 style={{fontSize:'clamp(38px, 7vw, 72px)', fontWeight:'800', lineHeight:'1.05', letterSpacing:'-2px', marginBottom:'24px'}}>
  Meet people,<br/>
  <span style={{color:'#9FE1CB'}}>not screens</span>
</h1>

        <p style={{fontSize:'18px', color:'rgba(255,255,255,0.55)', lineHeight:'1.7', maxWidth:'460px', margin:'0 auto 16px', fontWeight:'300'}}>
          Friends Without Benefits connects people through real experiences — no feeds, no algorithms, no nonsense.
        </p>

        <p style={{fontSize:'14px', color:'rgba(255,255,255,0.3)', marginBottom:'40px'}}>
          🏄 Surf sessions · 🍜 Dinners · 🎵 Concerts · 🌿 Hikes · 🎨 Art walks
        </p>

        <div style={{display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap', marginBottom:'20px'}}>
          <Link href="/login" style={{padding:'16px 32px', background:'#1D9E75', color:'white', borderRadius:'100px', textDecoration:'none', fontSize:'16px', fontWeight:'700', boxShadow:'0 4px 24px rgba(29,158,117,0.4)'}}>
            Create your profile →
          </Link>
          <Link href="/explore" style={{padding:'16px 28px', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.8)', borderRadius:'100px', textDecoration:'none', fontSize:'16px', fontWeight:'500'}}>
            Browse events
          </Link>
        </div>

        <p style={{fontSize:'12px', color:'rgba(255,255,255,0.25)'}}>Free forever · No credit card required</p>
      </div>

      {/* EXAMPLE EVENTS — scrolling cards */}
      <div style={{padding:'0 0 60px', overflow:'hidden'}}>
        <div style={{display:'flex', gap:'14px', padding:'0 32px', overflowX:'auto', scrollbarWidth:'none', WebkitOverflowScrolling:'touch'}}>
          {[
            { emoji:'🏄', title:'Morning surf session', category:'Sport', time:'Today · 7:00 AM', location:'Bondi Beach', spots:4, mood:'🔥' },
            { emoji:'🍜', title:'Ramen dinner downtown', category:'Food', time:'Tonight · 7:30 PM', location:'City center', spots:3, mood:'💬' },
            { emoji:'🍹', title:'Rooftop aperitivo', category:'Culture', time:'Tonight · 6:30 PM', location:'Rooftop bar', spots:12, mood:'🎉' },
            { emoji:'🖼️', title:'Art exhibition + coffee', category:'Culture', time:'Tomorrow · 11 AM', location:'Local museum', spots:5, mood:'🧘' },
            { emoji:'🌿', title:'Sunday morning hike', category:'Outdoor', time:'Sunday · 8:00 AM', location:'National park', spots:8, mood:'🧘' },
            { emoji:'🎵', title:'Jazz night in the park', category:'Music', time:'Saturday · 7 PM', location:'City park', spots:20, mood:'🎉' },
          ].map((event, i) => (
            <div key={i} style={{flexShrink:0, width:'220px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', padding:'18px', backdropFilter:'blur(10px)'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
                <span style={{fontSize:'11px', fontWeight:'700', color:'#9FE1CB', textTransform:'uppercase', letterSpacing:'0.04em'}}>{event.category}</span>
                <span style={{fontSize:'14px'}}>{event.mood}</span>
              </div>
              <div style={{fontSize:'28px', marginBottom:'8px'}}>{event.emoji}</div>
              <div style={{fontSize:'14px', fontWeight:'700', marginBottom:'8px', lineHeight:'1.3'}}>{event.title}</div>
              <div style={{fontSize:'11px', color:'rgba(255,255,255,0.45)', marginBottom:'2px'}}>📅 {event.time}</div>
              <div style={{fontSize:'11px', color:'rgba(255,255,255,0.45)', marginBottom:'12px'}}>📍 {event.location}</div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span style={{fontSize:'12px', color:'#9FE1CB', fontWeight:'600'}}>{event.spots} spots left</span>
                <div style={{padding:'5px 12px', background:'#1D9E75', borderRadius:'100px', fontSize:'12px', fontWeight:'600', color:'white'}}>Join</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{maxWidth:'800px', margin:'0 auto', padding:'20px 24px 80px', textAlign:'center'}}>
        <div style={{fontSize:'11px', fontWeight:'700', color:'#9FE1CB', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'16px'}}>How it works</div>
        <h2 style={{fontSize:'clamp(28px, 5vw, 42px)', fontWeight:'800', letterSpacing:'-1px', marginBottom:'48px'}}>
          Three steps to your<br/>next real experience
        </h2>

        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'32px'}}>
          {[
            { step:'01', icon:'👤', title:'Create your profile', desc:'Add your photo, interests and languages. Let others know who you are before you even meet.' },
            { step:'02', icon:'🗺️', title:'Find an event', desc:'Browse activities near you — filter by category, vibe or time. Join with one tap.' },
            { step:'03', icon:'🤝', title:'Show up & connect', desc:'Meet real people at real places. Chat before, review after. No awkwardness.' },
          ].map((step, i) => (
            <div key={i} style={{textAlign:'center'}}>
              <div style={{fontSize:'11px', fontWeight:'700', color:'rgba(255,255,255,0.25)', letterSpacing:'0.1em', marginBottom:'16px'}}>{step.step}</div>
              <div style={{width:'56px', height:'56px', borderRadius:'16px', background:'rgba(29,158,117,0.15)', border:'1px solid rgba(29,158,117,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', margin:'0 auto 16px'}}>
                {step.icon}
              </div>
              <div style={{fontSize:'16px', fontWeight:'700', marginBottom:'8px'}}>{step.title}</div>
              <div style={{fontSize:'13px', color:'rgba(255,255,255,0.45)', lineHeight:'1.6'}}>{step.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES GRID */}
      <div style={{maxWidth:'900px', margin:'0 auto', padding:'0 24px 80px'}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'16px'}}>
          {[
            { icon:'✨', title:'Vibe matching', desc:'See how many people at an event share your interests before you join.', color:'#534AB7', bg:'rgba(83,74,183,0.1)' },
            { icon:'🧳', title:'Solo traveler mode', desc:'Badge that signals you are new in town and open to meeting people.', color:'#C04A20', bg:'rgba(192,74,32,0.1)' },
            { icon:'🎟️', title:'Waitlist', desc:'Full event? Join the waitlist and get notified automatically when a spot opens.', color:'#9A6200', bg:'rgba(154,98,0,0.1)' },
            { icon:'👥', title:'Groups', desc:'Permanent communities for recurring interests. Surfers, foodies, hikers.', color:'#1D9E75', bg:'rgba(29,158,117,0.1)' },
            { icon:'⭐', title:'Reviews', desc:'Rate events and hosts after attending. Build trust in the community.', color:'#9A6200', bg:'rgba(154,98,0,0.1)' },
            { icon:'🔒', title:'Privacy first', desc:'Choose what to share. Control who sees your attended events.', color:'#185FA5', bg:'rgba(24,95,165,0.1)' },
          ].map((feat, i) => (
            <div key={i} style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', padding:'24px'}}>
              <div style={{width:'40px', height:'40px', borderRadius:'10px', background:feat.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', marginBottom:'14px'}}>
                {feat.icon}
              </div>
              <div style={{fontSize:'15px', fontWeight:'700', marginBottom:'6px'}}>{feat.title}</div>
              <div style={{fontSize:'13px', color:'rgba(255,255,255,0.45)', lineHeight:'1.6'}}>{feat.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SOCIAL PROOF */}
      <div style={{maxWidth:'700px', margin:'0 auto', padding:'0 24px 80px', textAlign:'center'}}>
        <div style={{display:'flex', justifyContent:'center', gap:'32px', flexWrap:'wrap', marginBottom:'40px'}}>
          {[
            { number:'100%', label:'Free to use' },
            { number:'0', label:'Ads or algorithms' },
            { number:'∞', label:'Real connections' },
          ].map((stat, i) => (
            <div key={i}>
              <div style={{fontSize:'36px', fontWeight:'800', color:'#9FE1CB', letterSpacing:'-1px'}}>{stat.number}</div>
              <div style={{fontSize:'13px', color:'rgba(255,255,255,0.4)', marginTop:'4px'}}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA FINALE */}
      <div style={{textAlign:'center', padding:'60px 24px 80px', background:'rgba(29,158,117,0.06)', borderTop:'1px solid rgba(29,158,117,0.1)'}}>
        <h2 style={{fontSize:'clamp(28px, 5vw, 48px)', fontWeight:'800', marginBottom:'16px', letterSpacing:'-1px', lineHeight:'1.1'}}>
          Your next friend is<br/>at the next event
        </h2>
        <p style={{fontSize:'16px', color:'rgba(255,255,255,0.45)', marginBottom:'32px', maxWidth:'400px', margin:'0 auto 32px'}}>
          No algorithms. No swiping. Just real people doing real things.
        </p>
        <Link href="/login" style={{display:'inline-block', padding:'16px 36px', background:'#1D9E75', color:'white', borderRadius:'100px', textDecoration:'none', fontSize:'18px', fontWeight:'700', boxShadow:'0 4px 32px rgba(29,158,117,0.4)'}}>
          Join for free →
        </Link>
        <p style={{fontSize:'12px', color:'rgba(255,255,255,0.2)', marginTop:'16px'}}>No credit card · Takes 2 minutes</p>
      </div>

      {/* FOOTER */}
      <div style={{textAlign:'center', padding:'24px', borderTop:'1px solid rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.25)', fontSize:'12px', display:'flex', justifyContent:'center', gap:'24px', flexWrap:'wrap'}}>
        <span>© 2025 Friends Without Benefits</span>
        <span>Meet people, not screens</span>
      </div>

    </main>
  )
}