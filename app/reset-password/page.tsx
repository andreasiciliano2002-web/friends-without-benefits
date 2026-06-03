'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'success'>('error')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase gestisce automaticamente il token dall'URL
    // Dobbiamo solo aspettare che la sessione sia pronta
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
  }, [])

  const handleReset = async () => {
    if (!password || !confirm) {
      setMessage('⚠️ Please fill in all fields.')
      setMessageType('error')
      return
    }
    if (password.length < 6) {
      setMessage('⚠️ Password must be at least 6 characters.')
      setMessageType('error')
      return
    }
    if (password !== confirm) {
      setMessage('⚠️ Passwords do not match.')
      setMessageType('error')
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setMessage(error.message)
      setMessageType('error')
    } else {
      setMessage('✅ Password updated! Redirecting...')
      setMessageType('success')
      setTimeout(() => {
        window.location.href = '/explore'
      }, 2000)
    }
    setLoading(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleReset()
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
        <p style={{color:'var(--text-3)', fontSize:'14px'}}>Set a new password</p>
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

      {!ready ? (
        <div style={{
          textAlign:'center',
          padding:'32px 20px',
          background:'white',
          borderRadius:'var(--radius)',
          border:'1px solid var(--border)',
          boxShadow:'var(--shadow)',
        }}>
          <div style={{fontSize:'40px', marginBottom:'12px'}}>🔗</div>
          <p style={{fontSize:'14px', color:'var(--text-2)', lineHeight:'1.6'}}>
            Waiting for the reset link to be verified...
          </p>
          <p style={{fontSize:'12px', color:'var(--text-3)', marginTop:'8px'}}>
            If nothing happens, try clicking the link in your email again.
          </p>
        </div>
      ) : (
        <>
          <div style={{marginBottom:'16px'}}>
            <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'var(--text-2)'}}>New password</p>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKey}
              placeholder="••••••••"
            />
          </div>

          <div style={{marginBottom:'24px'}}>
            <p style={{fontSize:'13px', fontWeight:'600', marginBottom:'6px', color:'var(--text-2)'}}>Confirm password</p>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={handleKey}
              placeholder="••••••••"
            />
          </div>

          <button
            onMouseDown={handleReset}
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
            {loading ? 'Saving...' : 'Set new password →'}
          </button>

          <p style={{textAlign:'center', fontSize:'13px', color:'var(--text-3)'}}>
            Remember your password?{' '}
            <a href="/login" style={{color:'var(--green)', fontWeight:'600', textDecoration:'none'}}>
              Sign in
            </a>
          </p>
        </>
      )}
    </main>
  )
}