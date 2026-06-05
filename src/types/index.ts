export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  classification?: Classification
  timestamp: Date
}

export interface Classification {
  intent: string
  symptoms: string[]
  department: string
  isEmergency: boolean
  suspectedConditions: string[]
}

export interface ConsultationRecord {
  id: string
  session_id: string
  patient_message: string
  ai_response: string
  classification: Classification
  created_at: string
}

export interface ChatResponse {
  message: string
  classification: Classification
}
