import { NextResponse } from 'next/server'
import { getUsageSummary } from '@/lib/usageTracker'

/**
 * GET /api/usage
 * 오늘의 API 사용량 현황을 반환합니다.
 */
export async function GET() {
  const summary = getUsageSummary()

  const detail = Object.entries(summary).map(([service, info]) => ({
    service,
    used: info.used,
    limit: info.limit,
    freeLimit: info.freeLimit,
    remaining: info.limit - info.used,
    usagePercent: Math.round((info.used / info.limit) * 100),
    status:
      info.used >= info.limit
        ? 'exhausted'
        : info.used / info.limit >= 0.9
        ? 'critical'
        : info.used / info.limit >= 0.8
        ? 'warning'
        : 'ok',
  }))

  return NextResponse.json({ date: new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' }), services: detail })
}
