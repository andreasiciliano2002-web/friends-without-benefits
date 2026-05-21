'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleAuth = async () => {
    setLoading(true)
    setMessage('Loading...')
    if (isSignup) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage('✅ Check your email!')
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage(error.message)
      } else if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', data.user.id)
          .single()

        if (!profile?.display_name) {
          window.location.href = '/profile?new=true'
        } else {
          window.location.href = '/explore'
        }
      }
    }
    setLoading(false)
  }

  return (
    <main style={{padding:'40px 20px', maxWidth:'400px', margin:'0 auto', fontFamily:'sans-serif'}}>
      <h1 style={{fontSize:'24px', fontWeight:'800', marginBottom:'8px'}}>
        Friends Without Benefits
      </h1>
      <p style={{color:'#888', marginBottom:'28px', fontSize:'14px'}}>
        {isSignup ? 'Create your account' : 'Welcome back'}
      </p>

      {message && (
        <p style={{marginBottom:'16px', padding:'10px 14px', borderRadius:'8px', background: message.includes('error') || message.includes('Error') ? '#FEE2E2' : '#E1F5EE', color: message.includes('error') || message.includes('Error') ? '#DC2626' : '#085041', fontSize:'13px'}}>
          {message}
        </p>
      )}

      <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px'}}>Email</p>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        style={{width:'100%', padding:'10px 14px', marginBottom:'16px', fontSize:'14px', border:'1px solid #eee', borderRadius:'8px', outline:'none', boxSizing:'border-box'}}
      />

      <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px'}}>Password</p>
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="••••••••"
        style={{width:'100%', padding:'10px 14px', marginBottom:'24px', fontSize:'14px', border:'1px solid #eee', borderRadius:'8px', outline:'none', boxSizing:'border-box'}}
      />

      <button
        onMouseDown={handleAuth}
        disabled={loading}
        style={{width:'100%', padding:'14px', background:'#1D9E75', color:'white', border:'none', borderRadius:'8px', fontSize:'16px', fontWeight:'700', cursor:'pointer'}}
      >
        {loading ? 'Loading...' : isSignup ? 'Create account →' : 'Sign in →'}
      </button>

      <p style={{marginTop:'16px', textAlign:'center', fontSize:'13px', color:'#888'}}>
        {isSignup ? 'Already have an account? ' : "Don't have an account? "}
        <span
          onMouseDown={() => setIsSignup(!isSignup)}
          style={{color:'#1D9E75', cursor:'pointer', fontWeight:'600'}}
        >
          {isSignup ? 'Sign in' : 'Sign up'}
        </span>
      </p>
    </main>
  )
}