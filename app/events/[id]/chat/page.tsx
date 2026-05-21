'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function ChatPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [event, setEvent] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = '/login'; return }
      setUser(data.user)

      const { data: p } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
      if (p) setProfile(p)

      const { data: e } = await supabase.from('events').select('*').eq('id', params.id).single()
      if (e) setEvent(e)

      loadMessages()
    })

    // REALTIME — ascolta nuovi messaggi in tempo reale
    const channel = supabase
      .channel('messages-' + params.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `event_id=eq.${params.id}`
      }, payload => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles(display_name, avatar_url)')
      .eq('event_id', params.id)
      .order('created_at', { ascending: true })
    console.log('messages:', data, 'error:', error)
    if (data) setMessages(data)

  }

  const sendMessage = async () => {
    if (!text.trim() || !user) return
    setSending(true)
    await supabase.from('messages').insert({
      event_id: params.id,
      user_id: user.id,
      content: text.trim()
    })
    setText('')
    setSending(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const colors = ['#9FE1CB', '#F5C4B3', '#B5D4F4', '#CECBF6', '#FAC775']
  const colorFor = (id: string) => colors[id.charCodeAt(0) % colors.length]

  return (
    <main style={{display:'flex', flexDirection:'column', height:'100vh', fontFamily:'sans-serif', background:'#F7F5F0'}}>

      {/* HEADER */}
      <div style={{background:'white', borderBottom:'1px solid #eee', padding:'14px 20px', display:'flex', alignItems:'center', gap:'12px', flexShrink:0}}>
        <a href={`/events/${params.id}`} style={{color:'#888', textDecoration:'none', fontSize:'20px'}}>←</a>
        <div>
          <div style={{fontSize:'16px', fontWeight:'700'}}>{event?.title || 'Event chat'}</div>
          <div style={{fontSize:'12px', color:'#888'}}>Group chat</div>
        </div>
      </div>

      {/* MESSAGES */}
      <div style={{flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'12px'}}>
        {messages.length === 0 && (
          <div style={{textAlign:'center', padding:'40px 20px', color:'#888'}}>
            <div style={{fontSize:'32px', marginBottom:'8px'}}>💬</div>
            <p style={{fontSize:'14px'}}>No messages yet. Say hi!</p>
          </div>
        )}

        {messages.map(msg => {
          const isMe = msg.user_id === user?.id
          const name = msg.profiles?.display_name || 'Anonymous'
          const initial = name[0]?.toUpperCase() || '?'
          const bg = colorFor(msg.user_id)

          return (
            <div key={msg.id} style={{display:'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap:'8px', alignItems:'flex-end'}}>
              {!isMe && (
                <div style={{width:'32px', height:'32px', borderRadius:'50%', background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'700', flexShrink:0, overflow:'hidden'}}>
                  {msg.profiles?.avatar_url
                    ? <img src={msg.profiles.avatar_url} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                    : initial}
                </div>
              )}
              <div style={{maxWidth:'70%'}}>
                {!isMe && <div style={{fontSize:'11px', color:'#888', marginBottom:'3px', paddingLeft:'4px'}}>{name}</div>}
                <div style={{background: isMe ? '#1D9E75' : 'white', color: isMe ? 'white' : '#1a1a1a', padding:'10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', fontSize:'14px', lineHeight:'1.5', boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
                  {msg.content}
                </div>
                <div style={{fontSize:'10px', color:'#aaa', marginTop:'3px', textAlign: isMe ? 'right' : 'left', paddingLeft:'4px', paddingRight:'4px'}}>
                  {formatTime(msg.created_at)}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={{background:'white', borderTop:'1px solid #eee', padding:'12px 16px', display:'flex', gap:'10px', alignItems:'flex-end', flexShrink:0}}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message... (Enter to send)"
          rows={1}
          style={{flex:1, padding:'10px 14px', border:'1px solid #eee', borderRadius:'20px', fontSize:'14px', outline:'none', resize:'none', fontFamily:'sans-serif', lineHeight:'1.5'}}
        />
        <button
          onMouseDown={sendMessage}
          disabled={sending || !text.trim()}
          style={{width:'40px', height:'40px', borderRadius:'50%', background: text.trim() ? '#1D9E75' : '#eee', border:'none', cursor: text.trim() ? 'pointer' : 'default', fontSize:'18px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}
        >
          →
        </button>
      </div>
    </main>
  )
}