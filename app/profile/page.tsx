'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const INTERESTS = ['🏄 Surf', '🍕 Food', '🎾 Tennis', '🏃 Running', '🎨 Art', '✈️ Travel', '🎵 Music', '🌿 Hiking', '📚 Books', '🎮 Gaming', '🍷 Wine', '🧘 Yoga']

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState({
    display_name: '',
    bio: '',
    location: '',
    gender: '',
    interests: [] as string[],
    avatar_url: '',
    show_attended: false
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const isNew = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('new') === 'true'

  useEffect(() => {
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
        show_attended: p.show_attended || false
      })
    })
  }, [])

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

  const saveProfile = async () => {
    if (!user) return
    if (!profile.display_name) { setMessage('⚠️ Display name is required.'); return }
    if (!profile.gender) { setMessage('⚠️ Please select your gender.'); return }
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert({ id: user.id, ...profile })
    if (error) setMessage('Error: ' + error.message)
    else {
      setMessage('✅ Profile saved!')
      if (isNew) setTimeout(() => window.location.href = '/explore', 1000)
    }
    setSaving(false)
  }

  return (
    <main style={{padding:'24px 20px', maxWidth:'600px', margin:'0 auto', fontFamily:'sans-serif'}}>

      <div style={{display:'flex', alignItems:'center', gap:'16px', marginBottom:'24px'}}>
        {!isNew && <a href="/explore" style={{color:'var(--text-3)', textDecoration:'none', fontSize:'20px'}}>←</a>}
        <div>
          <h1 style={{fontSize:'26px', fontWeight:'800', fontFamily:'Syne, sans-serif', letterSpacing:'-0.5px', marginBottom:'2px'}}>
            {isNew ? 'Complete your profile' : 'My Profile'}
          </h1>
          <p style={{fontSize:'13px', color:'var(--text-3)'}}>
            {isNew ? 'Tell people who you are' : 'Manage your account'}
          </p>
        </div>
      </div>

      {isNew && (
        <div style={{background:'var(--green-light)', borderRadius:'var(--radius-sm)', padding:'14px 18px', marginBottom:'20px', fontSize:'14px', color:'var(--green-dark)', border:'1px solid rgba(29,158,117,0.2)'}}>
          Welcome! Complete your profile so others can get to know you before joining your events.
        </div>
      )}

      {message && (
        <div style={{marginBottom:'16px', padding:'12px 16px', borderRadius:'var(--radius-sm)', background: message.includes('Error') || message.includes('⚠️') ? '#FEE2E2' : 'var(--green-light)', color: message.includes('Error') || message.includes('⚠️') ? '#DC2626' : 'var(--green-dark)', fontSize:'13px', fontWeight:'500'}}>
          {message}
        </div>
      )}

      <div style={{background:'white', borderRadius:'var(--radius)', padding:'28px', boxShadow:'var(--shadow)', border:'1px solid var(--border)'}}>

        {/* AVATAR */}
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', marginBottom:'28px'}}>
          <div style={{width:'100px', height:'100px', borderRadius:'50%', background:'var(--green-mid)', overflow:'hidden', marginBottom:'14px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'36px', fontWeight:'700', color:'var(--green-dark)', border:'3px solid var(--green-light)'}}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="avatar" />
              : (profile.display_name?.[0] || '?')}
          </div>
          <div style={{display:'flex', gap:'8px'}}>
            <label style={{padding:'8px 16px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'100px', fontSize:'13px', fontWeight:'600', cursor:'pointer', color:'var(--text-2)'}}>
              {uploading ? 'Uploading...' : '📷 Take photo'}
              <input type="file" accept="image/*" capture="user" onChange={uploadAvatar} style={{display:'none'}} />
            </label>
            <label style={{padding:'8px 16px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'100px', fontSize:'13px', fontWeight:'600', cursor:'pointer', color:'var(--text-2)'}}>
              🖼️ Gallery
              <input type="file" accept="image/*" onChange={uploadAvatar} style={{display:'none'}} />
            </label>
          </div>
        </div>

        {/* NAME */}
        <div style={{marginBottom:'18px'}}>
          <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'var(--text-2)'}}>Display name *</p>
          <input
            value={profile.display_name}
            onChange={e => setProfile(p => ({...p, display_name: e.target.value}))}
            placeholder="Your name..."
          />
        </div>

        {/* GENDER */}
        <div style={{marginBottom:'18px'}}>
          <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'8px', color:'var(--text-2)'}}>I am *</p>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px'}}>
            {[{value:'man', label:'Man', icon:'👨'}, {value:'woman', label:'Woman', icon:'👩'}, {value:'other', label:'Other', icon:'🌈'}].map(opt => (
              <div
                key={opt.value}
                onMouseDown={() => setProfile(p => ({...p, gender: opt.value}))}
                style={{padding:'14px', border:`2px solid ${profile.gender === opt.value ? 'var(--green)' : 'var(--border)'}`, background: profile.gender === opt.value ? 'var(--green-light)' : 'white', borderRadius:'var(--radius-sm)', cursor:'pointer', textAlign:'center'}}
              >
                <div style={{fontSize:'22px', marginBottom:'4px'}}>{opt.icon}</div>
                <div style={{fontSize:'13px', fontWeight:'600', color: profile.gender === opt.value ? 'var(--green-dark)' : 'var(--text-2)'}}>{opt.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* LOCATION */}
        <div style={{marginBottom:'18px'}}>
          <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'var(--text-2)'}}>Location</p>
          <input
            value={profile.location}
            onChange={e => setProfile(p => ({...p, location: e.target.value}))}
            placeholder="e.g. Sydney, Australia"
          />
        </div>

        {/* BIO */}
        <div style={{marginBottom:'18px'}}>
          <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'var(--text-2)'}}>Bio</p>
          <textarea
            value={profile.bio}
            onChange={e => setProfile(p => ({...p, bio: e.target.value}))}
            placeholder="Tell people a bit about yourself..."
            rows={3}
            style={{resize:'none'}}
          />
        </div>

        {/* INTERESTS */}
        <div style={{marginBottom:'20px'}}>
          <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'10px', color:'var(--text-2)'}}>Interests</p>
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

        {/* SHOW ATTENDED */}
        <div style={{marginBottom:'24px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', background:'var(--bg)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)'}}>
          <div>
            <div style={{fontSize:'14px', fontWeight:'600', marginBottom:'2px'}}>Show activities attended</div>
            <div style={{fontSize:'12px', color:'var(--text-3)'}}>Others can see events you have joined</div>
          </div>
          <div
            onMouseDown={() => setProfile(p => ({...p, show_attended: !p.show_attended}))}
            style={{width:'44px', height:'24px', borderRadius:'100px', background: profile.show_attended ? 'var(--green)' : '#ddd', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0}}
          >
            <div style={{width:'20px', height:'20px', borderRadius:'50%', background:'white', position:'absolute', top:'2px', left: profile.show_attended ? '22px' : '2px', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}} />
          </div>
        </div>

        <button
          onMouseDown={saveProfile}
          disabled={saving}
          style={{width:'100%', padding:'14px', background:'var(--green)', color:'white', border:'none', borderRadius:'var(--radius-sm)', fontSize:'16px', fontWeight:'700', cursor:'pointer', boxShadow:'0 2px 8px rgba(29,158,117,0.3)'}}
        >
          {saving ? 'Saving...' : isNew ? 'Complete profile →' : 'Save profile →'}
        </button>
      </div>

      {!isNew && (
        <div style={{marginTop:'16px', textAlign:'center'}}>
          <button
            onMouseDown={() => { supabase.auth.signOut(); window.location.href = '/login' }}
            style={{background:'none', border:'none', color:'var(--text-3)', fontSize:'13px', cursor:'pointer', padding:'8px 16px'}}
          >
            Sign out
          </button>
        </div>
      )}
    </main>
  )
}