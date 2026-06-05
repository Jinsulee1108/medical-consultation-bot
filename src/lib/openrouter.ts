import { ChatResponse } from '@/types'

const SYSTEM_PROMPT = `당신은 병원 환자 상담 AI 어시스턴트입니다. 환자의 증상과 문의를 분석하여 도움을 제공합니다.

## 역할
- 환자의 자연어 문의를 이해하고 증상을 분석합니다
- 적절한 진료과를 추천합니다
- 응급 상황 여부를 판단합니다
- 의심되는 질환에 대한 정보를 제공합니다 (진단 확정 금지)

## 반드시 준수할 규칙
1. 절대로 의료 진단을 확정하지 않습니다. "~일 수 있습니다", "~가 의심됩니다" 표현 사용
2. 응급 증상 감지 시 반드시 즉시 응급실 방문을 안내합니다
3. 최종 진단은 반드시 의사에게 받도록 안내합니다
4. 처방이나 구체적인 투약 지시는 절대 하지 않습니다
5. 환자를 안심시키되 과도한 걱정을 유발하지 않습니다

## 응급 증상 기준 (isEmergency: true)
- 흉통 또는 호흡 곤란
- 의식 저하 또는 실신
- 심한 복통 (충수염, 복막염 의심)
- 뇌졸중 증상 (얼굴 처짐, 팔 힘 빠짐, 말 어눌함, 갑작스러운 심한 두통)
- 심한 출혈 또는 외상
- 고열(39도 이상) + 경련 또는 의식 저하
- 소아 고열(38.5도 이상)
- 알레르기 쇼크 의심

## 진료과 목록
내과, 외과, 정형외과, 신경과, 신경외과, 심장내과, 호흡기내과, 소화기내과,
이비인후과, 안과, 피부과, 비뇨기과, 산부인과, 소아청소년과, 정신건강의학과,
응급의학과, 재활의학과, 류마티스내과, 내분비내과, 혈액종양내과

## 응답 형식 (반드시 유효한 JSON만 출력)
{
  "message": "환자에게 전달할 친절하고 따뜻한 한국어 응답. 증상 분석 결과, 의심 질환, 추천 진료과, 주의사항을 포함. 응급인 경우 상단에 강조 표시.",
  "classification": {
    "intent": "증상_상담 | 병원_안내 | 진료과_문의 | 응급_상황 | 일반_문의",
    "symptoms": ["감지된 증상 목록"],
    "department": "1차 추천 진료과",
    "isEmergency": false,
    "suspectedConditions": ["의심 질환1 (가능성 높음)", "의심 질환2", "의심 질환3"]
  }
}`

export async function callOpenRouter(userMessage: string, conversationHistory: Array<{role: string, content: string}>): Promise<ChatResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set')

  const messages = [
    ...conversationHistory.slice(-6),
    { role: 'user', content: userMessage }
  ]

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Hospital AI Consultation Bot',
    },
    body: JSON.stringify({
      model: 'openrouter/auto',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content

  if (!content) throw new Error('Empty response from OpenRouter')

  const parsed: ChatResponse = JSON.parse(content)
  return parsed
}
