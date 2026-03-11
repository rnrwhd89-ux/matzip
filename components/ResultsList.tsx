import type { RecommendResponse } from '@/types/restaurant'
import RestaurantCard from './RestaurantCard'

export default function ResultsList({ data }: { data: RecommendResponse }) {
  const top3 = data.restaurants.slice(0, 3)
  const rest = data.restaurants.slice(3)

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* 지역명 헤더 */}
      <div className="text-center mb-8">
        <p className="text-gray-400 text-sm mb-1">통계 기반 맛집 알고리즘 분석 결과</p>
        <h2 className="text-white text-3xl font-bold">
          <span className="text-[#FF6B6B]">{data.region}</span> 맛집 TOP 10
        </h2>
        <p className="text-gray-500 text-sm mt-2">
          베이즈 평균 · 표준편차 패널티 · 로컬 지수 적용
        </p>
      </div>

      {/* TOP 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {top3.map((r) => (
          <RestaurantCard key={r.rank} restaurant={r} />
        ))}
      </div>

      {/* 4~10위 */}
      {rest.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <p className="text-gray-500 text-sm">✅ 4~10위</p>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rest.map((r) => (
              <RestaurantCard key={r.rank} restaurant={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
