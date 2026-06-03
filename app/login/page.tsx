'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [isForgot, setIsForgot] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'success'>('error')

  const showMessage = (msg: string, type: 'error' | 'success') => {
    setMessage(msg)
    setMessageType(type)
  }

  const handleAuth = async () => {
    if (!email || !password) {
      showMessage('⚠️ Please fill in all fields.', 'error')
      return
    }
    setLoading(true)
    setMessage('')

    if (isSignup) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) showMessage(error.message, 'error')
      else {
        showMessage('✅ Account created! You can now sign in.', 'success')
        setIsSignup(false)
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        showMessage(error.message, 'error')
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

  const handleForgotPassword = async () => {
    if (!email) {
      showMessage('⚠️ Enter your email address first.', 'error')
      return
    }
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) showMessage(error.message, 'error')
    else showMessage('✅ Check your email for the reset link!', 'success')
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    })
    if (error) {
      showMessage(error.message, 'error')
      setLoadingGoogle(false)
    }
    // Se non c'è errore, Supabase reindirizza automaticamente a Google
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      isForgot ? handleForgotPassword() : handleAuth()
    }
  }

  return (
    <main style={{
      padding:'40px 20px',
      maxWidth:'400px',
      margin:'0 auto',
      fontFamily:'DM Sans, sans-serif',
      minHeight:'100vh',
      display:'flex',
      flexDirection:'column',
      justifyContent:'center',
    }}>

      {/* LOGO */}
      <div style={{marginBottom:'32px'}}>
        <h1 style={{fontSize:'24px', fontWeight:'800', fontFamily:'Syne, sans-serif', marginBottom:'4px'}}>
          Friends Without Benefits
        </h1>
        <p style={{color:'var(--text-3)', fontSize:'14px'}}>
          {isForgot ? 'Reset your password' : isSignup ? 'Create your account' : 'Welcome back'}
        </p>
      </div>

      {/* MESSAGE */}
      {message && (
        <div style={{
          marginBottom:'16px',
          padding:'12px 14px',
          borderRadius:'var(--radius-sm)',
          background: messageType === 'success' ? 'var(--green-light)' : '#FEE2E2',
          color: messageType === 'success' ? 'var(--green-dark)' : '#DC2626',
          fontSize:'13px',
          lineHeight:'1.5',
        }}>
          {message}
        </div>
      )}

      {/* GOOGLE LOGIN — nascosto in modalità forgot */}
      {!isForgot && (
        <>
          <button
            onMouseDown={handleGoogleLogin}
            disabled={loadingGoogle}
            style={{
              width:'100%',
              padding:'13px',
              background:'white',
              color:'var(--text)',
              border:'1.5px solid var(--border)',
              borderRadius:'var(--radius-sm)',
              fontSize:'15px',
              fontWeight:'600',
              cursor:'pointer',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              gap:'10px',
              marginBottom:'16px',
              boxShadow:'var(--shadow)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
              <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
              <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
              <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
            </svg>
            {loadingGoogle ? 'Redirecting...' : `${isSignup ? 'Sign up' : 'Sign in'} with Google`}
          </button>

          {/* DIVIDER */}
          <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px'}}>
            <div style={{flex:1, height:'1px', background:'var(--border)'}} />
            <span style={{fontSize:'12px', color:'var(--text-3)', fontWeight:'500'}}>or continue with email</span>
            <div style={{flex:1, height:'1px', background:'var(--border)'}} />
          </div>
        </>
      )}

      {/* EMAIL */}
      <div style={{marginBottom:'16px'}}>
        <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'var(--text-2)'}}>Email</p>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={handleKey}
          placeholder="your@email.com"
        />
      </div>

      {/* PASSWORD */}
      {!isForgot && (
        <div style={{marginBottom:'8px'}}>
          <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'var(--text-2)'}}>Password</p>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKey}
            placeholder="••••••••"
          />
        </div>
      )}

      {/* FORGOT LINK */}
      {!isSignup && !isForgot && (
        <div style={{textAlign:'right', marginBottom:'24px'}}>
          <span
            onMouseDown={() => { setIsForgot(true); setMessage('') }}
            style={{fontSize:'12px', color:'var(--green)', cursor:'pointer', fontWeight:'600'}}
          >
            Forgot password?
          </span>
        </div>
      )}

      {!isForgot && isSignup && <div style={{marginBottom:'24px'}} />}

      {/* MAIN BUTTON */}
      <button
        onMouseDown={isForgot ? handleForgotPassword : handleAuth}
        disabled={loading}
        style={{
          width:'100%',
          padding:'14px',
          background:'var(--green)',
          color:'white',
          border:'none',
          borderRadius:'var(--radius-sm)',
          fontSize:'16px',
          fontWeight:'700',
          cursor:'pointer',
          boxShadow:'0 2px 8px rgba(29,158,117,0.3)',
          marginBottom:'16px',
        }}
      >
        {loading ? 'Loading...' : isForgot ? 'Send reset link →' : isSignup ? 'Create account →' : 'Sign in →'}
      </button>

      {/* LINKS */}
      {isForgot ? (
        <p style={{textAlign:'center', fontSize:'13px', color:'var(--text-3)'}}>
          Remember your password?{' '}
          <span
            onMouseDown={() => { setIsForgot(false); setMessage('') }}
            style={{color:'var(--green)', cursor:'pointer', fontWeight:'600'}}
          >
            Sign in
          </span>
        </p>
      ) : (
        <p style={{textAlign:'center', fontSize:'13px', color:'var(--text-3)'}}>
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <span
            onMouseDown={() => { setIsSignup(!isSignup); setMessage('') }}
            style={{color:'var(--green)', cursor:'pointer', fontWeight:'600'}}
          >
            {isSignup ? 'Sign in' : 'Sign up'}
          </span>
        </p>
      )}
    </main>
  )
}