import { NextRequest, NextResponse } from 'next/server'
import { searchKakaoPlaces } from '@/lib/kakao'
import { analyzeWithKakao } from '@/lib/gemini'
import { checkUsage, recordUsage, getUsageSummary } from '@/lib/usageTracker'

// In-memory rate limiter (per-instance, provides basic abuse protection)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
const WINDOW_MS = 60_000 // 1 minute

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: RATE_LIMIT - 1 }
  }
  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 }
  }
  entry.count++
  return { allowed: true, remaining: RATE_LIMIT - entry.count }
}

export async function POST(request: NextRequest) {
  // [VULN-02] Rate limiting
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
  const { allowed, remaining } = checkRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': String(RATE_LIMIT),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  // [VULN-07] Content-Type 검증
  const contentType = request.headers.get('content-type')
  if (!contentType?.includes('application/json')) {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 415 })
  }

  let body: { region?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const { region } = body as { region: string }

  if (!region || typeof region !== 'string' || region.trim().length === 0) {
    return NextResponse.json({ error: '지역명을 입력해주세요.' }, { status: 400 })
  }

  // [VULN-05] 입력값 길이 및 문자 유형 검증
  if (region.trim().length > 100) {
    return NextResponse.json(
      { error: '지역명은 100자 이내로 입력해주세요.' },
      { status: 400 }
    )
  }

  if (!/^[\uAC00-\uD7A3a-zA-Z0-9\s\-,.]+$/.test(region.trim())) {
    return NextResponse.json(
      { error: '올바른 지역명을 입력해주세요.' },
      { status: 400 }
    )
  }

  try {
    if (!process.env.KAKAO_REST_API_KEY) {
      return NextResponse.json(
        { error: '서비스 설정 오류가 발생했습니다. 관리자에게 문의해주세요.' },
        { status: 503 }
      )
    }

    // 카카오 API 사용량 사전 체크
    const kakaoCheck = checkUsage('kakao')
    if (!kakaoCheck.allowed) {
      return NextResponse.json(
        { error: '오늘의 Kakao Maps 사용 한도에 도달했습니다. 내일 다시 시도해주세요.' },
        { status: 429 }
      )
    }

    let data
    const warnings: string[] = []

    recordUsage('kakao')
    const places = await searchKakaoPlaces(region.trim())
    data = await analyzeWithKakao(region.trim(), places)

    // 사용량 경고 수집 (80% 이상 시)
    const summary = getUsageSummary()
    for (const [, info] of Object.entries(summary)) {
      const ratio = info.used / info.limit
      if (ratio >= 0.8) {
        warnings.push(`API 사용량 경고: ${info.used}/${info.limit}회 사용됨`)
      }
    }

    const responseBody = warnings.length > 0 ? { ...data, _warnings: warnings } : data

    return NextResponse.json(responseBody, {
      headers: { 'X-RateLimit-Remaining': String(remaining) },
    })
  } catch (error) {
    // [VULN-01] 내부 에러 상세 정보 서버 로그에만 기록, 클라이언트에는 노출 안 함
    console.error('[Recommend API Error]', error)

    // 한도 초과 에러는 사용자에게 명확히 전달
    const message = error instanceof Error ? error.message : ''
    if (message.includes('일일 한도')) {
      return NextResponse.json({ error: message }, { status: 429 })
    }

    return NextResponse.json(
      { error: '서비스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}
