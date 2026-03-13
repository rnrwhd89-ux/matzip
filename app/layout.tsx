import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TrueScore - 진짜 현지 맛집 검색',
  description: '베이즈 평균 알고리즘으로 관광객 함정을 피하고 진짜 현지 맛집을 찾아드립니다.',
  keywords: ['맛집', '현지맛집', '맛집추천', '베이즈평균', 'TrueScore'],
  openGraph: {
    title: 'TrueScore - 진짜 현지 맛집 검색',
    description: '통계 알고리즘으로 걸러낸 진짜 현지 맛집',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[#0A0A0F]" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
