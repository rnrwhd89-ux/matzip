import { NextRequest, NextResponse } from 'next/server'
import { recommendRestaurants } from '@/lib/claude'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { region } = body as { region: string }

    if (!region || typeof region !== 'string' || region.trim().length === 0) {
      return NextResponse.json({ error: '지역명을 입력해주세요.' }, { status: 400 })
    }

    const data = await recommendRestaurants(region.trim())
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
