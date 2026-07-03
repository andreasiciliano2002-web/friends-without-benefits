import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient(
      'https://bljrordabqfrlkvmenkj.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsanJvcmRhYnFmcmxrdm1lbmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3ODA0MzAsImV4cCI6MjA5NDM1NjQzMH0.WV_KZW54uMSH3yv7QJZEL_1CygjABkNOtByPrFt_Dz0'
    )

    await supabase.auth.exchangeCodeForSession(code)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single()

      if (!profile?.display_name) {
        return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
      }
    }
  }

  return NextResponse.redirect(new URL('/explore', requestUrl.origin))
}