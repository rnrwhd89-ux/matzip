/**
 * 로그 페널티 알고리즘 테스트 스크립트
 *
 * S_final = R - k / log10(N+1)
 *
 * 사용법:
 *   npx tsx scripts/compare-algorithms.ts
 *   npx tsx scripts/compare-algorithms.ts --region "홍대"
 *   npx tsx scripts/compare-algorithms.ts --data scripts/places-data.json --region "홍대"
 *
 * 실제 데이터 테스트:
 *   KAKAO_REST_API_KEY=xxx npx tsx scripts/fetch-places.ts --region "지역명"
 *   (places-data.json 에서 R·N 직접 입력)
 *   npx tsx scripts/compare-algorithms.ts --data scripts/places-data.json
 */

import fs from 'fs'

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────

interface Restaurant {
  name: string
  category: string
  R: number   // 평균 평점
  N: number   // 리뷰 수
  isFranchise?: boolean
  note?: string
}

interface ScoredRestaurant extends Restaurant {
  score: number
  rank: number
  abused: boolean
}

// ─────────────────────────────────────────────
// 샘플 데이터 (--data 플래그 없을 때 사용)
// ─────────────────────────────────────────────

const SAMPLE_DATA: Restaurant[] = [
  // 리뷰 많고 평점 안정적
  { name: '성대시장 국밥집',       category: '국밥',     R: 4.5, N: 820 },
  { name: '삼대째 순대국',         category: '순대국밥', R: 4.3, N: 1350 },
  { name: '노포 칼국수',           category: '칼국수',   R: 4.4, N: 430 },

  // 리뷰 적고 평점 높음 → 페널티 강하게 적용
  { name: '신상 파스타 카페',      category: '이탈리안', R: 4.9, N: 42 },
  { name: '오픈한지 얼마 안된 집', category: '한식',     R: 5.0, N: 11 },

  // 프랜차이즈 → 제외
  { name: '대형 프랜차이즈 A',     category: '치킨',     R: 3.8, N: 2100, isFranchise: true },

  // 어뷰징 의심
  { name: '마케팅 의심 카페',      category: '카페',     R: 4.95, N: 5200, note: '소규모 카페 리뷰 5,200개' },

  // 중간대 평점
  { name: '성대갈비',              category: '갈비',     R: 4.2, N: 290 },
  { name: '옛날 족발집',           category: '족발',     R: 4.1, N: 510 },
  { name: '시장 분식',             category: '분식',     R: 4.0, N: 670 },
  { name: '로컬 곱창집',           category: '곱창',     R: 4.3, N: 180 },
  { name: '동네 중국집',           category: '중식',     R: 4.2, N: 340 },
]

// ─────────────────────────────────────────────
// 알고리즘: S_final = R - k / log10(N+1)
// ─────────────────────────────────────────────

function calcScore(R: number, N: number, k = 1.0): number {
  return Math.round((R - k / Math.log10(N + 1)) * 1000) / 1000
}

// ─────────────────────────────────────────────
// 어뷰징 감지
// - 프랜차이즈
// - 동네 소규모 업종인데 리뷰 5,000개 이상 + 평점 4.9 이상
// ─────────────────────────────────────────────

function isAbused(r: Restaurant): boolean {
  if (r.isFranchise) return true
  if (r.N > 5000 && r.R >= 4.9) return true
  return false
}

// ─────────────────────────────────────────────
// 메인
// ─────────────────────────────────────────────

function run() {
  const args = process.argv.slice(2)

  const regionIdx = args.indexOf('--region')
  const region = regionIdx !== -1 ? args[regionIdx + 1] : '상도동 성대시장'

  const dataIdx = args.indexOf('--data')
  let data: Restaurant[] = SAMPLE_DATA

  if (dataIdx !== -1) {
    const dataFile = args[dataIdx + 1]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed: any[] = JSON.parse(fs.readFileSync(dataFile, 'utf-8'))

    const incomplete = parsed.filter(p => p.R === null || p.N === null)
    if (incomplete.length > 0) {
      console.warn(`\n⚠️  R·N 미입력 항목 ${incomplete.length}개 제외:`)
      incomplete.forEach((p: { name: string }) => console.warn(`   - ${p.name}`))
    }

    data = parsed
      .filter(p => p.R !== null && p.N !== null)
      .map(p => ({
        name:        p.name,
        category:    p.category,
        R:           Number(p.R),
        N:           Number(p.N),
        isFranchise: p.isFranchise ?? false,
        note:        p.note,
      }))

    if (data.length === 0) {
      console.error('\n❌ R·N이 입력된 식당이 없습니다. places-data.json 을 먼저 채워주세요.')
      process.exit(1)
    }

    console.log(`\n📂 데이터 파일 로드: ${dataFile} (${data.length}개)`)
  }

  // 점수 계산 및 정렬
  const scored: ScoredRestaurant[] = data
    .map(r => ({
      ...r,
      score: calcScore(r.R, r.N),
      rank:  0,
      abused: isAbused(r),
    }))
    .sort((a, b) => b.score - a.score)

  // 랭크 부여 (어뷰징 포함 전체 순위)
  scored.forEach((r, i) => { r.rank = i + 1 })

  // 정상 식당만 필터 (Top 10 선정용)
  const clean = scored.filter(r => !r.abused)

  // ── 헤더 ──
  console.log('\n' + '═'.repeat(72))
  console.log(`  ■ ${region} 통계(로그 페널티) 기반 맛집 분석 결과 ■`)
  console.log(`  알고리즘: S_final = R − k/log10(N+1)   [k=1.0]`)
  console.log('═'.repeat(72))

  // ── 전체 테이블 ──
  console.log()
  console.log(
    '  ' +
    '가게 이름'.padEnd(24) +
    'R    '.padEnd(6) +
    'N'.padEnd(7) +
    'S_final'.padEnd(9) +
    '플래그'
  )
  console.log('  ' + '─'.repeat(68))

  scored.forEach(r => {
    const flag = r.abused
      ? (r.isFranchise ? '🚫 프랜차이즈 제외' : `🚫 어뷰징 의심 — ${r.note ?? ''}`)
      : r.note
      ? `⚠️  ${r.note}`
      : ''

    console.log(
      '  ' +
      r.name.padEnd(24) +
      String(r.R).padEnd(6) +
      String(r.N).padEnd(7) +
      String(r.score).padEnd(9) +
      flag
    )
  })

  // ── TOP 3 상세 ──
  console.log()
  console.log('─'.repeat(72))
  console.log('  TOP 3 상세')
  console.log('─'.repeat(72))

  const medals = ['🥇', '🥈', '🥉']
  clean.slice(0, 3).forEach((r, i) => {
    const penalty = 1.0 / Math.log10(r.N + 1)
    console.log()
    console.log(`  ${medals[i]} ${i + 1}위. ${r.name} (${r.category})`)
    console.log(`     📊 표면 평점(R) ${r.R}  |  리뷰 수(N) ${r.N.toLocaleString()}`)
    console.log(`     🔍 페널티 -${penalty.toFixed(3)}  →  최종 점수 ${r.score}`)
  })

  // ── 4~10위 ──
  console.log()
  console.log('─'.repeat(72))
  console.log('  4~10위')
  console.log('─'.repeat(72))
  clean.slice(3, 10).forEach((r, i) => {
    console.log(`  ${i + 4}위. ${r.name} (${r.category}) — S_final: ${r.score}`)
  })

  // ── 페널티 미리보기 ──
  console.log()
  console.log('─'.repeat(72))
  console.log('  페널티 프리뷰 (R=4.5 고정, k=1)')
  console.log('─'.repeat(72))
  const R = 4.5
  ;[5, 10, 30, 50, 100, 300, 500, 1000, 3000].forEach(n => {
    const penalty = 1.0 / Math.log10(n + 1)
    console.log(
      `  N=${String(n).padStart(4)}  페널티 -${penalty.toFixed(3)}  →  최종 ${(R - penalty).toFixed(3)}`
    )
  })

  console.log()
  if (dataIdx !== -1) {
    console.log('  💡 places-data.json 의 R·N 값을 수정하면 결과가 달라집니다.')
  } else {
    console.log('  💡 실제 테스트: KAKAO_REST_API_KEY=xxx npx tsx scripts/fetch-places.ts --region "지역명"')
  }
  console.log('═'.repeat(72))
  console.log()
}

run()
