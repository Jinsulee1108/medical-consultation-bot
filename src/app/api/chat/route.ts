import { NextRequest, NextResponse } from 'next/server'
import { callOpenRouter } from '@/lib/openrouter'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, history } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: '메시지를 입력해주세요.' }, { status: 400 })
    }

    const result = await callOpenRouter(message, history || [])

    const { error: dbError } = await supabase.from('consultations').insert({
      session_id: sessionId,
      patient_message: message,
      ai_response: result.message,
      classification: result.classification,
    })

    if (dbError) {
      console.error('Supabase insert error:', dbError)
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Chat API error:', err)
    const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
