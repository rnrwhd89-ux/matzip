/**
 * 알고리즘 비교 테스트 스크립트
 *
 * 사용법:
 *   npx tsx scripts/compare-algorithms.ts
 *   npx tsx scripts/compare-algorithms.ts --region "상도동 성대시장"
 *   npx tsx scripts/compare-algorithms.ts --data scripts/places-data.json --region "상도동"
 *
 * Algorithm A (현재): Bayesian Average
 *   S_opt = α × ((C×m + N×R) / (C+N)) − β×σ + γ×L
 *
 * Algorithm B (신규 제안): Log Penalty
 *   S_final = R - k / log10(N+1)
 */

import fs from 'fs'

// ─────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────

interface Restaurant {
  name: string
  category: string
  R: number   // 평균 평점
  N: number   // 리뷰 수
  sigma: number  // 표준편차 (Algorithm A용, 없으면 추정값 사용)
  L: number   // 로컬 지수 0~1 (Algorithm A용)
  isFranchise?: boolean
  note?: string  // 특이사항 (어뷰징 의심 등)
}

interface ScoredRestaurant extends Restaurant {
  scoreA: number
  scoreB: number
  rankA: number
  rankB: number
  rankDiff: number  // B기준 - A기준 (양수면 B에서 더 올라감)
}

// ─────────────────────────────────────────────
// 테스트 데이터 (상도동 성대시장 가상 예시)
// 실제 R, N 값을 직접 수정해서 테스트하세요
// ─────────────────────────────────────────────

const SAMPLE_DATA: Restaurant[] = [
  // 리뷰 많고 평점 안정적 → 두 알고리즘 모두 높을 것
  { name: '성대시장 국밥집',      category: '국밥',     R: 4.5, N: 820,  sigma: 0.4, L: 0.92 },
  { name: '삼대째 순대국',        category: '순대국밥', R: 4.3, N: 1350, sigma: 0.5, L: 0.88 },
  { name: '노포 칼국수',          category: '칼국수',   R: 4.4, N: 430,  sigma: 0.6, L: 0.85 },

  // 리뷰 적고 평점 높음 → Algorithm B에서 더 많이 깎임
  { name: '신상 파스타 카페',     category: '이탈리안', R: 4.9, N: 42,   sigma: 0.3, L: 0.55 },
  { name: '오픈한지 얼마 안된 집', category: '한식',    R: 5.0, N: 11,   sigma: 0.2, L: 0.60 },

  // 리뷰 많지만 평점 낮음
  { name: '대형 프랜차이즈 A',    category: '치킨',     R: 3.8, N: 2100, sigma: 0.9, L: 0.30, isFranchise: true },

  // 어뷰징 의심: 소규모인데 리뷰 과다 + 평점 수렴
  { name: '마케팅 의심 카페',     category: '카페',     R: 4.95, N: 5200, sigma: 0.1, L: 0.40, note: '⚠️ 어뷰징 의심 (소규모 카페 리뷰 5200개)' },

  // 중간대 평점, 리뷰 적당
  { name: '성대갈비',            category: '갈비',     R: 4.2, N: 290,  sigma: 0.7, L: 0.80 },
  { name: '옛날 족발집',         category: '족발',     R: 4.1, N: 510,  sigma: 0.8, L: 0.82 },
  { name: '시장 분식',           category: '분식',     R: 4.0, N: 670,  sigma: 0.6, L: 0.95 },
  { name: '로컬 곱창집',         category: '곱창',     R: 4.3, N: 180,  sigma: 0.5, L: 0.90 },
  { name: '동네 중국집',         category: '중식',     R: 4.2, N: 340,  sigma: 0.7, L: 0.78 },
]

// ─────────────────────────────────────────────
// Algorithm A: 베이지안 평균 (현재 algorithm.md)
// S_opt = α × ((C×m + N×R) / (C+N)) − β×σ + γ×L
// ─────────────────────────────────────────────

function algorithmA(r: Restaurant, regionAvg: number): number {
  const alpha = 1.0
  const beta  = 0.3
  const gamma = 0.5
  const C     = 50  // 유의미한 최소 리뷰 수

  const bayesian = (C * regionAvg + r.N * r.R) / (C + r.N)
  const score = alpha * bayesian - beta * r.sigma + gamma * r.L

  return Math.round(score * 1000) / 1000
}

// ─────────────────────────────────────────────
// Algorithm B: 로그 페널티 (신규 제안)
// S_final = R - k / log10(N+1)
// ─────────────────────────────────────────────

function algorithmB(r: Restaurant): number {
  const k = 1.0
  const score = r.R - k / Math.log10(r.N + 1)
  return Math.round(score * 1000) / 1000
}

// ─────────────────────────────────────────────
// 어뷰징 필터 (두 알고리즘 공통 적용)
// - 프랜차이즈 제외
// - 소규모 업종 대비 리뷰 과다 + 평점 4.9 이상
// ─────────────────────────────────────────────

function isAbused(r: Restaurant): boolean {
  if (r.isFranchise) return true
  // 동네 카페/식당 기준 리뷰 3000개 이상이면서 평점 4.9 이상 → 어뷰징 의심
  if (r.N > 3000 && r.R >= 4.9) return true
  return false
}

// ─────────────────────────────────────────────
// 메인 실행
// ─────────────────────────────────────────────

function run() {
  const args = process.argv.slice(2)
  const regionIdx = args.indexOf('--region')
  const region = regionIdx !== -1 ? args[regionIdx + 1] : '상도동 성대시장'

  // --data 플래그: JSON 파일에서 데이터 로드 (fetch-places.ts 결과)
  const dataIdx = args.indexOf('--data')
  let data: Restaurant[] = SAMPLE_DATA
  if (dataIdx !== -1) {
    const dataFile = args[dataIdx + 1]
    const raw = fs.readFileSync(dataFile, 'utf-8')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed: any[] = JSON.parse(raw)

    // R 또는 N이 null인 항목 걸러내고 경고
    const incomplete = parsed.filter(p => p.R === null || p.N === null)
    if (incomplete.length > 0) {
      console.warn(`\n⚠️  R·N 미입력 항목 ${incomplete.length}개가 제외됩니다:`)
      incomplete.forEach((p: { name: string }) => console.warn(`   - ${p.name}`))
    }

    data = parsed
      .filter(p => p.R !== null && p.N !== null)
      .map(p => ({
        name:        p.name,
        category:    p.category,
        R:           Number(p.R),
        N:           Number(p.N),
        sigma:       p.sigma ?? 0.5,
        L:           p.L    ?? 0.7,
        isFranchise: p.isFranchise ?? false,
        note:        p.note,
      }))

    if (data.length === 0) {
      console.error('\n❌ R·N이 입력된 식당이 없습니다. places-data.json 을 먼저 채워주세요.')
      process.exit(1)
    }

    console.log(`\n📂 데이터 파일 로드: ${dataFile} (${data.length}개)`)
  }

  const regionAvg = data.reduce((sum, r) => sum + r.R, 0) / data.length

  console.log('\n' + '═'.repeat(72))
  console.log(`  알고리즘 비교 테스트 — 대상 지역: ${region}`)
  console.log('═'.repeat(72))
  console.log(`  지역 평균 평점(m): ${regionAvg.toFixed(2)}`)
  console.log()
  console.log('  [Algorithm A] 베이지안 평균:  S = α×((C×m + N×R)/(C+N)) − β×σ + γ×L')
  console.log('  [Algorithm B] 로그 페널티:    S = R − k/log10(N+1)')
  console.log('═'.repeat(72))

  // 점수 계산
  const scored: ScoredRestaurant[] = data.map(r => ({
    ...r,
    scoreA: algorithmA(r, regionAvg),
    scoreB: algorithmB(r),
    rankA: 0,
    rankB: 0,
    rankDiff: 0,
  }))

  // 랭킹 부여 (어뷰징 의심 포함해서 계산, 출력 시 표시)
  const sortedA = [...scored].sort((a, b) => b.scoreA - a.scoreA)
  const sortedB = [...scored].sort((a, b) => b.scoreB - a.scoreB)

  sortedA.forEach((r, i) => {
    const s = scored.find(x => x.name === r.name)!
    s.rankA = i + 1
  })
  sortedB.forEach((r, i) => {
    const s = scored.find(x => x.name === r.name)!
    s.rankB = i + 1
  })

  scored.forEach(r => {
    r.rankDiff = r.rankA - r.rankB  // 양수면 B에서 순위 상승
  })

  // ── 비교 테이블 출력 ──
  const PAD = 22
  console.log()
  console.log(
    '  ' +
    '식당 이름'.padEnd(PAD) +
    'R    N      ' +
    'ScoreA  RankA  ' +
    'ScoreB  RankB  ' +
    '순위변화  플래그'
  )
  console.log('  ' + '─'.repeat(100))

  const byRankB = [...scored].sort((a, b) => a.rankB - b.rankB)

  byRankB.forEach(r => {
    const abused = isAbused(r)
    const flag = abused
      ? '🚫 제외'
      : r.note
      ? r.note
      : r.rankDiff > 0
      ? `▲${r.rankDiff} (B에서 상승)`
      : r.rankDiff < 0
      ? `▼${Math.abs(r.rankDiff)} (B에서 하락)`
      : '동일'

    console.log(
      '  ' +
      r.name.padEnd(PAD) +
      String(r.R).padEnd(5) +
      String(r.N).padEnd(7) +
      String(r.scoreA).padEnd(8) +
      String(r.rankA).padEnd(7) +
      String(r.scoreB).padEnd(8) +
      String(r.rankB).padEnd(7) +
      flag
    )
  })

  // ── Algorithm A TOP 5 ──
  console.log()
  console.log('─'.repeat(72))
  console.log('  [Algorithm A] 베이지안 평균 TOP 5 (프랜차이즈/어뷰징 제외)')
  console.log('─'.repeat(72))
  sortedA.filter(r => !isAbused(r)).slice(0, 5).forEach((r, i) => {
    console.log(`  ${i + 1}위. ${r.name} (${r.category}) — ScoreA: ${r.scoreA}`)
  })

  // ── Algorithm B TOP 5 ──
  console.log()
  console.log('─'.repeat(72))
  console.log('  [Algorithm B] 로그 페널티 TOP 5 (프랜차이즈/어뷰징 제외)')
  console.log('─'.repeat(72))
  sortedB.filter(r => !isAbused(r)).slice(0, 5).forEach((r, i) => {
    console.log(`  ${i + 1}위. ${r.name} (${r.category}) — ScoreB: ${r.scoreB}`)
  })

  // ── 주요 차이점 분석 ──
  console.log()
  console.log('─'.repeat(72))
  console.log('  핵심 차이 분석')
  console.log('─'.repeat(72))

  const bigDiff = scored.filter(r => Math.abs(r.rankDiff) >= 2 && !isAbused(r))
  if (bigDiff.length === 0) {
    console.log('  두 알고리즘 결과가 거의 동일합니다.')
  } else {
    bigDiff.forEach(r => {
      const dir = r.rankDiff > 0 ? 'B에서 상승' : 'B에서 하락'
      console.log(
        `  · ${r.name}: A=${r.rankA}위 → B=${r.rankB}위 (${dir} ${Math.abs(r.rankDiff)}계단)` +
        ` | R=${r.R}, N=${r.N}`
      )
    })
  }

  // ── 알고리즘 특성 요약 ──
  console.log()
  console.log('─'.repeat(72))
  console.log('  알고리즘 특성 요약')
  console.log('─'.repeat(72))
  console.log('  Algorithm A (베이지안)')
  console.log('    장점: 표준편차(σ)로 일관성 반영, 로컬 지수(L)로 현지인 선호 반영')
  console.log('    단점: σ·L 데이터를 직접 입력해야 함 (API 없이 수집 어려움)')
  console.log()
  console.log('  Algorithm B (로그 페널티)')
  console.log('    장점: R·N 두 변수만 있으면 계산 가능 — 지도 앱에서 바로 적용 가능')
  console.log('    단점: 일관성·현지인 반영 없음, k값 튜닝 필요')
  console.log()

  // ── 특정 N값에서 페널티 미리보기 ──
  console.log('─'.repeat(72))
  console.log('  Algorithm B 페널티 프리뷰 (R=4.5 고정, k=1)')
  console.log('─'.repeat(72))
  const k = 1.0
  const R = 4.5
  ;[5, 10, 30, 50, 100, 300, 500, 1000, 3000].forEach(n => {
    const penalty = k / Math.log10(n + 1)
    const score = R - penalty
    console.log(
      `  N=${String(n).padStart(4)}  페널티 -${penalty.toFixed(3)}  →  최종 ${score.toFixed(3)}`
    )
  })

  console.log()
  if (dataIdx !== -1) {
    console.log('  💡 places-data.json 의 R·N 값을 수정하면 결과가 달라집니다.')
  } else {
    console.log('  💡 SAMPLE_DATA 배열을 수정하거나 --data 플래그로 실제 데이터를 사용하세요.')
    console.log('  💡 실제 테스트: npx tsx scripts/fetch-places.ts --region "지역명"')
  }
  console.log('═'.repeat(72))
  console.log()
}

run()
