import { NextRequest, NextResponse } from 'next/server'
import { searchNaverPlaces } from '@/lib/naver'
import { searchKakaoPlaces } from '@/lib/kakao'
import { analyzeWithKakao, analyzeWithGemini, analyzeWithGeminiOnly } from '@/lib/gemini'

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
    const hasKakaoKey = !!process.env.KAKAO_REST_API_KEY
    const hasNaverKey = !!(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET)

    let data
    if (hasKakaoKey) {
      // 1순위: 카카오 API + Gemini 분석
      const places = await searchKakaoPlaces(region.trim())
      data = await analyzeWithKakao(region.trim(), places)
    } else if (hasNaverKey) {
      // 2순위: 네이버 API + Gemini 분석
      const places = await searchNaverPlaces(region.trim())
      data = await analyzeWithGemini(region.trim(), places)
    } else {
      // 3순위: Gemini 단독 (fallback)
      data = await analyzeWithGeminiOnly(region.trim())
    }

    return NextResponse.json(data, {
      headers: { 'X-RateLimit-Remaining': String(remaining) },
    })
  } catch (error) {
    // [VULN-01] 내부 에러 상세 정보 서버 로그에만 기록, 클라이언트에는 노출 안 함
    console.error('[Recommend API Error]', error)
    return NextResponse.json(
      { error: '서비스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}
