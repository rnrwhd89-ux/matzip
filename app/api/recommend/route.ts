import { NextRequest, NextResponse } from 'next/server'
import { searchNaverPlaces } from '@/lib/naver'
import { analyzeWithGemini, analyzeWithGeminiOnly } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { region } = body as { region: string }

    if (!region || typeof region !== 'string' || region.trim().length === 0) {
      return NextResponse.json({ error: '지역명을 입력해주세요.' }, { status: 400 })
    }

    const hasNaverKey = !!(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET)

    let data
    if (hasNaverKey) {
      // 네이버 API로 실제 맛집 목록 조회 → Gemini로 분석
      const places = await searchNaverPlaces(region.trim())
      data = await analyzeWithGemini(region.trim(), places)
    } else {
      // 네이버 API 키 없으면 Gemini 단독 분석 (fallback)
      data = await analyzeWithGeminiOnly(region.trim())
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Recommendation error:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: '추천 데이터를 가져오는 중 오류가 발생했습니다.', detail: message },
      { status: 500 }
    )
  }
}
