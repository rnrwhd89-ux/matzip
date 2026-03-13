'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import SearchForm from '@/components/SearchForm'
import ResultsList from '@/components/ResultsList'
import LoadingState from '@/components/LoadingState'
import type { RecommendResponse } from '@/types/restaurant'

// useSearchParams를 사용하는 모든 로직을 이 컴포넌트 안으로 격리
function SearchContent() {
  const searchParams = useSearchParams()
  const region = searchParams.get('q') ?? ''

  const [data, setData] = useState<RecommendResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!region) return

    setLoading(true)
    setData(null)
    setError(null)

    fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ region }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error ?? '서버 오류가 발생했습니다.')
        }
        return res.json() as Promise<RecommendResponse>
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [region])

  if (!region) {
    return (
      <div className="text-center py-12 md:py-24">
        <p className="text-gray-400">검색어를 입력해주세요.</p>
        <Link href="/" className="text-[#FF6B6B] underline text-sm mt-2 inline-block">
          홈으로 돌아가기
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <>
        <div className="mb-5 md:mb-8 flex justify-center">
          <SearchForm defaultValue={region} />
        </div>
        <LoadingState region={region} />
      </>
    )
  }

  if (error) {
    return (
      <>
        <div className="mb-5 md:mb-8 flex justify-center">
          <SearchForm defaultValue={region} />
        </div>
        <div className="text-center py-10 md:py-16">
          <p className="text-[#FF6B6B] text-lg font-semibold mb-2">오류가 발생했습니다</p>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <Link
            href="/"
            className="bg-[#FF6B6B] text-white px-6 py-2 rounded-xl text-sm hover:bg-[#FF5252] transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </>
    )
  }

  if (!data) return null

  return (
    <>
      <div className="mb-8 flex justify-center">
        <SearchForm defaultValue={region} />
      </div>
      <ResultsList data={data} />
    </>
  )
}

// SearchPage는 useSearchParams를 사용하지 않음 — Suspense 경계를 만들기 위한 래퍼
export default function SearchPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* 네비게이션 */}
      <nav className="px-6 py-4 border-b border-white/5 sticky top-0 bg-[#0A0A0F]/80 backdrop-blur-sm z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[#FF6B6B] text-xl">🍽️</span>
            <span className="text-white font-bold">TrueScore</span>
          </Link>
        </div>
      </nav>

      {/* 결과 — useSearchParams는 Suspense 내부에서만 사용 */}
      <section className="flex-1 px-4 md:px-6 py-6 md:py-10">
        <Suspense fallback={<LoadingState region="" />}>
          <SearchContent />
        </Suspense>
      </section>

      {/* 푸터 */}
      <footer className="px-6 py-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-gray-600 text-xs">
            © 2026 TrueScore · 베이즈 평균 기반 맛집 알고리즘
          </p>
        </div>
      </footer>
    </main>
  )
}
