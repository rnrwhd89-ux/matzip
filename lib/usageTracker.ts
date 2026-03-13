/**
 * 일일 API 사용량 추적기
 *
 * 무료 한도 대비 보수적인 일일 한도를 설정하여
 * 예상치 못한 과금을 방지합니다.
 *
 * 무료 한도 vs 설정된 한도:
 *   Gemini    : 무료 1,500/일 → 제한 200/일
 *   Groq      : 무료 14,400/일 → 제한 500/일
 *   Kakao     : 무료 300,000/일 → 제한 1,000/일
 */

export type ApiService = 'gemini' | 'groq' | 'kakao'

interface DailyLimit {
  limit: number
  freeLimit: number
  label: string
}

const DAILY_LIMITS: Record<ApiService, DailyLimit> = {
  gemini: { limit: 200,   freeLimit: 1_500,   label: 'Google Gemini' },
  groq:   { limit: 500,   freeLimit: 14_400,  label: 'Groq' },
  kakao:  { limit: 1_000, freeLimit: 300_000, label: 'Kakao Maps' },
}

interface DayCount {
  date: string  // 'YYYY-MM-DD'
  counts: Record<ApiService, number>
}

// 서버 인스턴스 내 메모리 유지 (재시작 시 초기화)
const state: DayCount = {
  date: '',
  counts: { gemini: 0, groq: 0, kakao: 0 },
}

function todayKST(): string {
  return new Date().toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\. /g, '-').replace('.', '')
}

function ensureToday() {
  const today = todayKST()
  if (state.date !== today) {
    state.date = today
    state.counts = { gemini: 0, groq: 0, kakao: 0 }
  }
}

export interface UsageCheckResult {
  allowed: boolean
  used: number
  limit: number
  freeLimit: number
  label: string
  warningMessage?: string
}

/**
 * 사용 가능 여부를 확인합니다.
 * 한도 초과 시 allowed=false, 80% 이상 시 경고 메시지 포함.
 */
export function checkUsage(service: ApiService): UsageCheckResult {
  ensureToday()
  const { limit, freeLimit, label } = DAILY_LIMITS[service]
  const used = state.counts[service]

  if (used >= limit) {
    return {
      allowed: false,
      used,
      limit,
      freeLimit,
      label,
      warningMessage: `[${label}] 오늘 일일 한도(${limit}회)에 도달했습니다. 내일 자정(KST)에 초기화됩니다.`,
    }
  }

  let warningMessage: string | undefined
  const ratio = used / limit
  if (ratio >= 0.9) {
    warningMessage = `[${label}] 오늘 사용량이 한도의 90% 이상입니다. (${used}/${limit}회)`
  } else if (ratio >= 0.8) {
    warningMessage = `[${label}] 오늘 사용량이 한도의 80% 이상입니다. (${used}/${limit}회)`
  }

  return { allowed: true, used, limit, freeLimit, label, warningMessage }
}

/**
 * 사용량을 1 증가시킵니다. 실제 API 호출 직전에 호출하세요.
 */
export function recordUsage(service: ApiService): void {
  ensureToday()
  state.counts[service]++
}

/**
 * 현재 모든 서비스의 사용량 현황을 반환합니다.
 */
export function getUsageSummary(): Record<ApiService, { used: number; limit: number; freeLimit: number }> {
  ensureToday()
  return (Object.keys(DAILY_LIMITS) as ApiService[]).reduce(
    (acc, service) => {
      const { limit, freeLimit } = DAILY_LIMITS[service]
      acc[service] = { used: state.counts[service], limit, freeLimit }
      return acc
    },
    {} as Record<ApiService, { used: number; limit: number; freeLimit: number }>
  )
}
