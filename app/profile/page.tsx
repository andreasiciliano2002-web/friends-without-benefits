'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const INTERESTS = ['🏄 Surf', '🍕 Food', '🎾 Tennis', '🏃 Running', '🎨 Art', '✈️ Travel', '🎵 Music', '🌿 Hiking', '📚 Books', '🎮 Gaming', '🍷 Wine', '🧘 Yoga']
const LANGUAGES = ['English', 'Spanish', 'French', 'Italian', 'German', 'Portuguese', 'Arabic', 'Chinese', 'Japanese', 'Russian']

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState({
    display_name: '',
    bio: '',
    location: '',
    gender: '',
    interests: [] as string[],
    avatar_url: '',
    show_attended: false,
    is_traveler: false,
    age: '' as any,
    occupation: '',
    languages: [] as string[],
    instagram: '',
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [activeSection, setActiveSection] = useState<'basics' | 'details' | 'settings'>('basics')
  const isNew = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('new') === 'true'

  useEffect(() => {
    const saved = localStorage.getItem('fwb-theme')
    setDarkMode(saved === 'dark')

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = '/login'; return }
      setUser(data.user)
      const { data: p } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
      if (p) setProfile({
        display_name: p.display_name || '',
        bio: p.bio || '',
        location: p.location || '',
        gender: p.gender || '',
        interests: p.interests || [],
        avatar_url: p.avatar_url || '',
        show_attended: p.show_attended || false,
        is_traveler: p.is_traveler || false,
        age: p.age || '',
        occupation: p.occupation || '',
        languages: p.languages || [],
        instagram: p.instagram || '',
      })
    })
  }, [])

  const toggleDarkMode = () => {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('fwb-theme', next ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', next ? 'dark' : '')
  }

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      setProfile(p => ({ ...p, avatar_url: urlData.publicUrl }))
      setMessage('✅ Photo uploaded!')
    } else {
      setMessage('Error uploading photo: ' + error.message)
    }
    setUploading(false)
  }

  const toggleInterest = (interest: string) => {
    setProfile(p => ({
      ...p,
      interests: p.interests.includes(interest)
        ? p.interests.filter(i => i !== interest)
        : [...p.interests, interest]
    }))
  }

  const toggleLanguage = (lang: string) => {
    setProfile(p => ({
      ...p,
      languages: p.languages.includes(lang)
        ? p.languages.filter(l => l !== lang)
        : [...p.languages, lang]
    }))
  }

  const saveProfile = async () => {
    if (!user) return
    if (!profile.display_name) { setMessage('⚠️ Display name is required.'); return }
    if (!profile.gender) { setMessage('⚠️ Please select your gender.'); return }
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      ...profile,
      age: profile.age ? parseInt(profile.age) : null,
    })
    if (error) setMessage('Error: ' + error.message)
    else {
      setMessage('✅ Profile saved!')
      if (isNew) setTimeout(() => window.location.href = '/explore', 1000)
    }
    setSaving(false)
  }

  const Toggle = ({ value, onChange }: { value: boolean, onChange: () => void }) => (
    <div
      onMouseDown={onChange}
      style={{width:'44px', height:'24px', borderRadius:'100px', background: value ? 'var(--green)' : '#ddd', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0}}
    >
      <div style={{width:'20px', height:'20px', borderRadius:'50%', background:'white', position:'absolute', top:'2px', left: value ? '22px' : '2px', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}} />
    </div>
  )

  return (
    <main style={{
      padding:'0',
      paddingBottom:'calc(80px + env(safe-area-inset-bottom))',
      maxWidth:'600px',
      margin:'0 auto',
      fontFamily:'sans-serif',
    }}>

      {/* HERO HEADER */}
      <div style={{
        background:'linear-gradient(135deg, #0D3D2E 0%, #1D9E75 100%)',
        padding:'32px 24px 80px',
        position:'relative',
      }}>
        {!isNew && (
          <a href="/explore" style={{color:'rgba(255,255,255,0.7)', textDecoration:'none', fontSize:'14px', display:'inline-flex', alignItems:'center', gap:'6px', marginBottom:'20px'}}>
            ← Back
          </a>
        )}
        <div style={{display:'flex', alignItems:'flex-end', gap:'20px'}}>
          {/* AVATAR */}
          <div style={{position:'relative', flexShrink:0}}>
            <div style={{width:'90px', height:'90px', borderRadius:'50%', background:'var(--green-mid)', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'32px', fontWeight:'700', color:'#0D3D2E', border:'3px solid rgba(255,255,255,0.3)'}}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="avatar" />
                : (profile.display_name?.[0] || '?')}
            </div>
            <label style={{position:'absolute', bottom:'0', right:'0', width:'28px', height:'28px', borderRadius:'50%', background:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.2)', fontSize:'13px'}}>
              📷
              <input type="file" accept="image/*" onChange={uploadAvatar} style={{display:'none'}} />
            </label>
          </div>
          <div style={{flex:1, minWidth:0}}>
            <h1 style={{fontSize:'22px', fontWeight:'800', fontFamily:'Syne, sans-serif', color:'white', marginBottom:'4px'}}>
              {profile.display_name || 'Your name'}
            </h1>
            <div style={{display:'flex', flexWrap:'wrap', gap:'6px'}}>
              {profile.location && <span style={{fontSize:'12px', color:'rgba(255,255,255,0.7)'}}>📍 {profile.location}</span>}
              {profile.age && <span style={{fontSize:'12px', color:'rgba(255,255,255,0.7)'}}>· {profile.age} yo</span>}
              {profile.occupation && <span style={{fontSize:'12px', color:'rgba(255,255,255,0.7)'}}>· {profile.occupation}</span>}
            </div>
            {profile.is_traveler && (
              <span style={{display:'inline-block', marginTop:'6px', fontSize:'11px', fontWeight:'600', color:'#C04A20', background:'rgba(255,255,255,0.9)', padding:'2px 10px', borderRadius:'100px'}}>🧳 Solo traveler</span>
            )}
          </div>
        </div>
      </div>

      {/* SECTION TABS */}
      <div style={{
        display:'flex',
        background:'white',
        borderBottom:'1px solid var(--border)',
        position:'sticky',
        top:0,
        zIndex:10,
        marginTop:'-40px',
        borderRadius:'var(--radius) var(--radius) 0 0',
        overflow:'hidden',
        boxShadow:'var(--shadow)',
      }}>
        {([
          { key: 'basics', label: '👤 Profile' },
          { key: 'details', label: '✨ Details' },
          { key: 'settings', label: '⚙️ Settings' },
        ] as const).map(s => (
          <button
            key={s.key}
            onMouseDown={() => setActiveSection(s.key)}
            style={{
              flex:1, padding:'16px 8px',
              border:'none', borderBottom: activeSection === s.key ? '2px solid var(--green)' : '2px solid transparent',
              background:'transparent',
              color: activeSection === s.key ? 'var(--green)' : 'var(--text-3)',
              fontSize:'13px', fontWeight: activeSection === s.key ? '700' : '500',
              cursor:'pointer', minHeight:'auto',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div style={{padding:'24px 20px'}}>

        {message && (
          <div style={{marginBottom:'16px', padding:'12px 16px', borderRadius:'var(--radius-sm)', background: message.includes('Error') || message.includes('⚠️') ? '#FEE2E2' : 'var(--green-light)', color: message.includes('Error') || message.includes('⚠️') ? '#DC2626' : 'var(--green-dark)', fontSize:'13px', fontWeight:'500'}}>
            {message}
          </div>
        )}

        {isNew && (
          <div style={{background:'var(--green-light)', borderRadius:'var(--radius-sm)', padding:'14px 18px', marginBottom:'20px', fontSize:'14px', color:'var(--green-dark)', border:'1px solid rgba(29,158,117,0.2)'}}>
            Welcome! Complete your profile so others can get to know you.
          </div>
        )}

        {/* === BASICS === */}
        {activeSection === 'basics' && (
          <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>

            <div style={{background:'white', borderRadius:'var(--radius)', padding:'20px', boxShadow:'var(--shadow)', border:'1px solid var(--border)'}}>
              <p style={{fontSize:'11px', fontWeight:'700', color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'16px'}}>Basic info</p>

              <div style={{marginBottom:'14px'}}>
                <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'var(--text-2)'}}>Display name *</p>
                <input value={profile.display_name} onChange={e => setProfile(p => ({...p, display_name: e.target.value}))} placeholder="Your name..." />
              </div>

              <div style={{marginBottom:'14px'}}>
                <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'8px', color:'var(--text-2)'}}>I am *</p>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px'}}>
                  {[{value:'man', label:'Man', icon:'👨'}, {value:'woman', label:'Woman', icon:'👩'}, {value:'other', label:'Other', icon:'🌈'}].map(opt => (
                    <div
                      key={opt.value}
                      onMouseDown={() => setProfile(p => ({...p, gender: opt.value}))}
                      style={{padding:'12px 8px', border:`2px solid ${profile.gender === opt.value ? 'var(--green)' : 'var(--border)'}`, background: profile.gender === opt.value ? 'var(--green-light)' : 'white', borderRadius:'var(--radius-sm)', cursor:'pointer', textAlign:'center'}}
                    >
                      <div style={{fontSize:'20px', marginBottom:'4px'}}>{opt.icon}</div>
                      <div style={{fontSize:'12px', fontWeight:'600', color: profile.gender === opt.value ? 'var(--green-dark)' : 'var(--text-2)'}}>{opt.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'14px'}}>
                <div>
                  <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'var(--text-2)'}}>Age</p>
                  <input type="number" value={profile.age} onChange={e => setProfile(p => ({...p, age: e.target.value}))} placeholder="e.g. 28" min={16} max={99} />
                </div>
                <div>
                  <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'var(--text-2)'}}>Location</p>
                  <input value={profile.location} onChange={e => setProfile(p => ({...p, location: e.target.value}))} placeholder="City, Country" />
                </div>
              </div>

              <div>
                <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'var(--text-2)'}}>Bio</p>
                <textarea value={profile.bio} onChange={e => setProfile(p => ({...p, bio: e.target.value}))} placeholder="Tell people a bit about yourself..." rows={3} style={{resize:'none'}} />
              </div>
            </div>

            {/* INTERESTS */}
            <div style={{background:'white', borderRadius:'var(--radius)', padding:'20px', boxShadow:'var(--shadow)', border:'1px solid var(--border)'}}>
              <p style={{fontSize:'11px', fontWeight:'700', color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'14px'}}>Interests</p>
              <div style={{display:'flex', flexWrap:'wrap', gap:'8px'}}>
                {INTERESTS.map(interest => (
                  <span
                    key={interest}
                    onMouseDown={() => toggleInterest(interest)}
                    style={{
                      padding:'7px 14px', borderRadius:'100px', fontSize:'13px', fontWeight:'500', cursor:'pointer',
                      border:`1.5px solid ${profile.interests.includes(interest) ? 'var(--green)' : 'var(--border)'}`,
                      background: profile.interests.includes(interest) ? 'var(--green-light)' : 'white',
                      color: profile.interests.includes(interest) ? 'var(--green-dark)' : 'var(--text-2)'
                    }}
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* === DETAILS === */}
        {activeSection === 'details' && (
          <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>

            <div style={{background:'white', borderRadius:'var(--radius)', padding:'20px', boxShadow:'var(--shadow)', border:'1px solid var(--border)'}}>
              <p style={{fontSize:'11px', fontWeight:'700', color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'16px'}}>Work & life</p>

              <div style={{marginBottom:'14px'}}>
                <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'var(--text-2)'}}>Occupation</p>
                <input value={profile.occupation} onChange={e => setProfile(p => ({...p, occupation: e.target.value}))} placeholder="e.g. Designer, Teacher, Student..." />
              </div>

              <div>
                <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'var(--text-2)'}}>Instagram</p>
                <div style={{position:'relative'}}>
                  <span style={{position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', fontSize:'14px', color:'var(--text-3)', pointerEvents:'none'}}>@</span>
                  <input value={profile.instagram} onChange={e => setProfile(p => ({...p, instagram: e.target.value}))} placeholder="yourhandle" style={{paddingLeft:'32px'}} />
                </div>
              </div>
            </div>

            {/* LANGUAGES */}
            <div style={{background:'white', borderRadius:'var(--radius)', padding:'20px', boxShadow:'var(--shadow)', border:'1px solid var(--border)'}}>
              <p style={{fontSize:'11px', fontWeight:'700', color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'14px'}}>Languages I speak</p>
              <div style={{display:'flex', flexWrap:'wrap', gap:'8px'}}>
                {LANGUAGES.map(lang => (
                  <span
                    key={lang}
                    onMouseDown={() => toggleLanguage(lang)}
                    style={{
                      padding:'7px 14px', borderRadius:'100px', fontSize:'13px', fontWeight:'500', cursor:'pointer',
                      border:`1.5px solid ${profile.languages.includes(lang) ? 'var(--green)' : 'var(--border)'}`,
                      background: profile.languages.includes(lang) ? 'var(--green-light)' : 'white',
                      color: profile.languages.includes(lang) ? 'var(--green-dark)' : 'var(--text-2)'
                    }}
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            {/* TRAVELER MODE */}
            <div style={{background:'white', borderRadius:'var(--radius)', padding:'20px', boxShadow:'var(--shadow)', border:'1px solid var(--border)'}}>
              <p style={{fontSize:'11px', fontWeight:'700', color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'14px'}}>Mode</p>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                <div>
                  <div style={{fontSize:'14px', fontWeight:'600', marginBottom:'2px'}}>🧳 Solo traveler mode</div>
                  <div style={{fontSize:'12px', color:'var(--text-3)'}}>Show others you are new in town</div>
                </div>
                <Toggle value={profile.is_traveler} onChange={() => setProfile(p => ({...p, is_traveler: !p.is_traveler}))} />
              </div>
            </div>

          </div>
        )}

        {/* === SETTINGS === */}
        {activeSection === 'settings' && (
          <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>

            <div style={{background:'white', borderRadius:'var(--radius)', padding:'20px', boxShadow:'var(--shadow)', border:'1px solid var(--border)'}}>
              <p style={{fontSize:'11px', fontWeight:'700', color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'14px'}}>Privacy</p>

              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:'14px', borderBottom:'1px solid var(--border)', marginBottom:'14px'}}>
                <div>
                  <div style={{fontSize:'14px', fontWeight:'600', marginBottom:'2px'}}>Show activities attended</div>
                  <div style={{fontSize:'12px', color:'var(--text-3)'}}>Others can see events you joined</div>
                </div>
                <Toggle value={profile.show_attended} onChange={() => setProfile(p => ({...p, show_attended: !p.show_attended}))} />
              </div>

              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                <div>
                  <div style={{fontSize:'14px', fontWeight:'600', marginBottom:'2px'}}>{darkMode ? '🌙 Dark mode' : '☀️ Light mode'}</div>
                  <div style={{fontSize:'12px', color:'var(--text-3)'}}>Switch between light and dark</div>
                </div>
                <Toggle value={darkMode} onChange={toggleDarkMode} />
              </div>
            </div>

            {/* ACCOUNT */}
            <div style={{background:'white', borderRadius:'var(--radius)', padding:'20px', boxShadow:'var(--shadow)', border:'1px solid var(--border)'}}>
              <p style={{fontSize:'11px', fontWeight:'700', color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'14px'}}>Account</p>
              <div style={{fontSize:'13px', color:'var(--text-3)', marginBottom:'14px'}}>
                {user?.email}
              </div>
              <button
                onMouseDown={() => { supabase.auth.signOut(); window.location.href = '/login' }}
                style={{width:'100%', padding:'12px', background:'#FEE2E2', color:'#DC2626', border:'none', borderRadius:'var(--radius-sm)', fontSize:'14px', fontWeight:'600', cursor:'pointer'}}
              >
                Sign out
              </button>
            </div>

          </div>
        )}

        {/* SAVE BUTTON */}
        <button
          onMouseDown={saveProfile}
          disabled={saving}
          style={{width:'100%', padding:'14px', background:'var(--green)', color:'white', border:'none', borderRadius:'var(--radius-sm)', fontSize:'16px', fontWeight:'700', cursor:'pointer', boxShadow:'0 2px 8px rgba(29,158,117,0.3)', marginTop:'20px'}}
        >
          {saving ? 'Saving...' : isNew ? 'Complete profile →' : 'Save profile →'}
        </button>

      </div>
    </main>
  )
}