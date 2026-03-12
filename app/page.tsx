import SearchForm from '@/components/SearchForm'

function TrustCard({
  icon,
  title,
  desc,
}: {
  icon: string
  title: string
  desc: string
}) {
  return (
    <div className="bg-[#1A1A2E] border border-white/5 rounded-2xl p-5 hover:border-[#FF6B6B]/30 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <p className="text-white font-semibold text-sm">{title}</p>
      </div>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  )
}

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* 네비게이션 */}
      <nav className="px-6 py-4 border-b border-white/5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#FF6B6B] text-xl">🍽️</span>
            <span className="text-white font-bold">TrueScore</span>
          </div>
          <span className="text-gray-500 text-sm">진짜 현지 맛집 검색</span>
        </div>
      </nav>

      {/* 히어로 섹션 */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-[#FF6B6B] text-xs font-semibold">✅ 현지인이 실제로 가는 맛집만</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4">
            진짜 현지 맛집만
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53]">
              골라드립니다
            </span>
          </h1>
          <p className="text-gray-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            관광객 함정을 피하고, 통계적 오류를 제거해
            <br />
            실패 확률이 가장 낮은 맛집 TOP 10을 추천합니다
          </p>
        </div>

        <SearchForm />

        <p className="text-gray-600 text-xs mt-4">
          예: 부산 서면 · 도쿄 신주쿠 · 서울 을지로 · 방콕 카오산로드
        </p>
      </section>

      {/* 신뢰 지표 섹션 */}
      <section className="px-6 py-16 bg-[#080810]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-white text-2xl font-bold mb-2">
              어떻게 고르나요?
            </h2>
            <p className="text-gray-400 text-sm">
              단순 평점순이 아닌, 진짜 신뢰할 수 있는 기준으로만 선별합니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <TrustCard
              icon="⭐"
              title="평점 신뢰도"
              desc="리뷰가 적은 식당의 높은 평점은 걸러냅니다. 충분한 리뷰가 쌓인 곳만 신뢰합니다."
            />
            <TrustCard
              icon="💬"
              title="리뷰 수"
              desc="리뷰가 많을수록 우연이 아닌 실력입니다. 꾸준히 사랑받는 곳을 우선합니다."
            />
            <TrustCard
              icon="📊"
              title="평가 일관성"
              desc="극단적으로 호불호가 갈리는 곳은 제외합니다. 대부분의 손님이 만족한 곳을 추천합니다."
            />
            <TrustCard
              icon="🏠"
              title="현지인 추천"
              desc="관광객보다 현지인이 자주 찾는 곳을 우선합니다. Tourist Trap을 자동으로 걸러냅니다."
            />
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="px-6 py-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-gray-600 text-sm">
            © 2026 TrueScore · 진짜 현지 맛집 검색
          </p>
        </div>
      </footer>
    </main>
  )
}
