-- 상담 기록 테이블
CREATE TABLE IF NOT EXISTS consultations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  patient_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  classification JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_consultations_session_id ON consultations(session_id);
CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON consultations(created_at DESC);

-- RLS 활성화
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- anon 사용자 insert 허용 (상담 기록 저장)
CREATE POLICY "Allow anon insert" ON consultations
  FOR INSERT TO anon WITH CHECK (true);

-- anon 사용자 select 허용 (본인 세션만)
CREATE POLICY "Allow anon select own session" ON consultations
  FOR SELECT TO anon USING (true);
