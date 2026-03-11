import SearchForm from '@/components/SearchForm'

function AlgorithmCard({
  icon,
  title,
  variable,
  desc,
}: {
  icon: string
  title: string
  variable: string
  desc: string
}) {
  return (
    <div className="bg-[#1A1A2E] border border-white/5 rounded-2xl p-5 hover:border-[#FF6B6B]/30 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <span className="text-[#FF6B6B] font-bold text-sm font-mono">{variable}</span>
          <p className="text-white font-semibold text-sm">{title}</p>
        </div>
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
            <span className="text-[#FF6B6B] text-xs font-semibold">📊 베이즈 평균 알고리즘 적용</span>
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

      {/* 알고리즘 설명 */}
      <section className="px-6 py-16 bg-[#080810]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-white text-2xl font-bold mb-2">
              어떤 알고리즘을 사용하나요?
            </h2>
            <p className="text-gray-400 text-sm">
              S<sub>opt</sub> = α × Bayesian Average − β×σ + γ×L
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AlgorithmCard
              icon="⭐"
              variable="R (Rating)"
              title="평균 평점"
              desc="단순 평균 평점입니다. 하지만 이것만으로는 리뷰 수가 적은 식당이 왜곡될 수 있어 베이즈 평균으로 보정합니다."
            />
            <AlgorithmCard
              icon="📝"
              variable="N (Reviews)"
              title="리뷰 수"
              desc="리뷰가 적을수록 지역 평균에 수렴시킵니다. 리뷰가 많을수록 실제 평점을 신뢰합니다."
            />
            <AlgorithmCard
              icon="📉"
              variable="σ (Std Dev)"
              title="표준편차"
              desc="평점이 1점과 5점으로 극단적으로 갈리면 패널티를 줍니다. 일관된 긍정 평가가 핵심입니다."
            />
            <AlgorithmCard
              icon="🏠"
              variable="L (Local)"
              title="로컬 지수"
              desc="현지 언어 리뷰 비율입니다. 현지인이 자주 찾는 곳일수록 Tourist Trap이 아닙니다."
            />
          </div>

          {/* 공식 박스 */}
          <div className="mt-8 bg-[#1A1A2E] border border-[#FF6B6B]/20 rounded-2xl p-6 text-center">
            <p className="text-gray-400 text-sm mb-3">최종 점수 공식</p>
            <p className="text-white font-mono text-lg md:text-xl">
              S<sub className="text-[#FF6B6B]">opt</sub> = α ×{' '}
              <span className="text-[#FF6B6B]">(C·m + N·R) / (C+N)</span>
              {' '}−{' '}
              <span className="text-yellow-400">β·σ</span>
              {' '}+{' '}
              <span className="text-green-400">γ·L</span>
            </p>
            <p className="text-gray-500 text-xs mt-3">α=1.0 · β=0.3 · γ=0.5 · C=50 (최소 유효 리뷰 수)</p>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="px-6 py-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-gray-600 text-sm">
            © 2026 TrueScore · 베이즈 평균 기반 맛집 알고리즘
          </p>
        </div>
      </footer>
    </main>
  )
}
