'use client'

import { useState, useRef, useEffect } from 'react'
import { Message, Classification } from '@/types'

const SUGGESTED_QUESTIONS = [
  '목이 아프고 열이 나요',
  '오른쪽 아래 배가 찌르듯이 아파요',
  '두통이 심하고 어지러워요',
  '기침이 2주째 지속돼요',
  '진료 예약은 어떻게 하나요?',
]

function ClassificationCard({ classification }: { classification: Classification }) {
  return (
    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm">
      <div className="mb-2 flex flex-wrap gap-2">
        {classification.isEmergency && (
          <span className="animate-pulse rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
            🚨 응급
          </span>
        )}
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
          {classification.intent.replace('_', ' ')}
        </span>
        {classification.department && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
            🏥 {classification.department}
          </span>
        )}
      </div>

      {classification.symptoms.length > 0 && (
        <div className="mb-1.5">
          <span className="font-medium text-gray-600">감지된 증상: </span>
          <span className="text-gray-700">{classification.symptoms.join(', ')}</span>
        </div>
      )}

      {classification.suspectedConditions.length > 0 && (
        <div>
          <span className="font-medium text-gray-600">의심 질환: </span>
          <span className="text-gray-700">{classification.suspectedConditions.join(', ')}</span>
        </div>
      )}
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="mr-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm">
          🏥
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
        {!isUser && (
          <p className="mb-1 text-xs text-gray-500">AI 상담 봇</p>
        )}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'rounded-tr-sm bg-blue-500 text-white'
              : 'rounded-tl-sm bg-white text-gray-800 shadow-sm border border-gray-100'
          }`}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        </div>
        {message.classification && !isUser && (
          <ClassificationCard classification={message.classification} />
        )}
        <p className={`mt-1 text-xs text-gray-400 ${isUser ? 'text-right' : ''}`}>
          {message.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      {isUser && (
        <div className="ml-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm">
          👤
        </div>
      )}
    </div>
  )
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '안녕하세요! 저는 병원 AI 상담 봇입니다. 😊\n\n증상이나 궁금한 점을 자연어로 말씀해 주세요. 증상 분석, 진료과 안내, 응급 여부 판단을 도와드립니다.\n\n⚠️ 본 서비스는 참고용이며, 정확한 진단은 반드시 의사에게 받으시기 바랍니다.',
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => crypto.randomUUID())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getHistory = () =>
    messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({ role: m.role, content: m.content }))

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          sessionId,
          history: getHistory(),
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || '오류가 발생했습니다.')

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
        classification: data.classification,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (err) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.\n\n${err instanceof Error ? err.message : ''}`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-xl">
          🏥
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900">병원 AI 상담 봇</h1>
          <p className="text-xs text-gray-500">증상 분석 · 진료과 안내 · 응급 판단</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-400"></span>
          <span className="text-xs text-gray-500">온라인</span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="flex items-start gap-2 mb-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm">
              🏥
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm border border-gray-100">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]"></span>
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]"></span>
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="mb-2 text-xs text-gray-500">💡 이런 증상이 있으신가요?</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-100 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 focus-within:border-blue-300 focus-within:bg-white transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="증상이나 궁금한 점을 입력하세요... (Enter로 전송)"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
            style={{ maxHeight: '120px' }}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = `${el.scrollHeight}px`
            }}
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-white transition-all hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="mt-1.5 text-center text-xs text-gray-400">
          ⚠️ AI 상담은 참고용입니다. 정확한 진단은 의사에게 받으세요.
        </p>
      </div>
    </div>
  )
}
