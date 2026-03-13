import type { Restaurant } from '@/types/restaurant'

const RANK_BADGES: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
}

function getMapButton(name: string, naver_link: string) {
  if (naver_link.includes('place.map.kakao.com')) {
    return { url: naver_link, label: '카카오맵에서 보기', colorClass: 'bg-[#FEE500]/10 border-[#FEE500]/20 text-[#FEE500] hover:bg-[#FEE500]/20' }
  }
  if (naver_link.includes('naver.com')) {
    return { url: naver_link, label: '네이버지도에서 보기', colorClass: 'bg-[#03C75A]/10 border-[#03C75A]/20 text-[#03C75A] hover:bg-[#03C75A]/20' }
  }
  return {
    url: `https://map.kakao.com/link/search/${encodeURIComponent(name)}`,
    label: '카카오맵에서 보기',
    colorClass: 'bg-[#FEE500]/10 border-[#FEE500]/20 text-[#FEE500] hover:bg-[#FEE500]/20',
  }
}

function ScoreBadge({ label, value, unit = '' }: { label: string; value: number | string; unit?: string }) {
  return (
    <div className="bg-[#0A0A0F] rounded-lg px-3 py-2 text-center min-w-[72px]">
      <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-white font-bold text-sm">
        {typeof value === 'number' ? value.toFixed(2) : value}
        {unit && <span className="text-xs text-gray-400 ml-0.5">{unit}</span>}
      </p>
    </div>
  )
}

export default function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const { rank, name, category, naver_link, data_summary, algorithm_reason, local_features } = restaurant
  const badge = RANK_BADGES[rank]
  const isTop3 = rank <= 3

  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-200 hover:border-[#FF6B6B]/50 hover:shadow-lg hover:shadow-[#FF6B6B]/5 ${
        isTop3
          ? 'bg-gradient-to-br from-[#1A1A2E] to-[#1a0d0d] border-[#FF6B6B]/40'
          : 'bg-[#1A1A2E] border-white/5'
      }`}
    >
      {/* 헤더 */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0">
          {badge ? (
            <span className="text-2xl">{badge}</span>
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 flex items-center justify-center">
              <span className="text-[#FF6B6B] text-xs font-bold">{rank}</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-lg leading-tight">{name}</h3>
          <span className="text-[#FF6B6B] text-xs bg-[#FF6B6B]/10 px-2 py-0.5 rounded-full mt-1 inline-block">
            {category}
          </span>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-[10px] text-gray-500">TrueScore</p>
          <p className="text-[#FF6B6B] font-bold text-xl">{data_summary.bayesian_score.toFixed(2)}</p>
        </div>
      </div>

      {/* 데이터 요약 */}
      <div className="flex flex-wrap gap-2 mb-4">
        <ScoreBadge label="리뷰수(N)" value={data_summary.estimated_review_count} />
        <ScoreBadge label="평점(R)" value={data_summary.estimated_avg_rating} />
        <ScoreBadge label="표준편차(σ)" value={data_summary.estimated_std_deviation} />
        <ScoreBadge label="로컬지수(L)" value={(data_summary.local_index * 100).toFixed(0)} unit="%" />
      </div>

      {/* 알고리즘 통과 사유 */}
      <div className="mb-3">
        <p className="text-[11px] text-[#FF6B6B] font-semibold mb-1.5 flex items-center gap-1">
          <span>🔍</span> 알고리즘 통과 사유
        </p>
        <p className="text-gray-300 text-sm leading-relaxed">{algorithm_reason}</p>
      </div>

      {/* 현지인 평가 */}
      <div>
        <p className="text-[11px] text-[#FF6B6B] font-semibold mb-1.5 flex items-center gap-1">
          <span>💡</span> 현지인 평가 특징
        </p>
        <p className="text-gray-300 text-sm leading-relaxed">{local_features}</p>
      </div>

      {/* 지도 버튼 */}
      {(() => {
        const { url, label, colorClass } = getMapButton(name, naver_link ?? '')
        return (
          <div className="mt-4 pt-3 border-t border-white/5">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 w-full py-2 rounded-xl border text-sm font-medium transition-colors ${colorClass}`}
            >
              🗺️ {label}
            </a>
          </div>
        )
      })()}
    </div>
  )
}
